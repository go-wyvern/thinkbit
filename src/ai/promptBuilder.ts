import * as vscode from 'vscode';
import { Tokenizer } from './tokenizer';
import { Logger } from '../utils/logger';
import { getCurrentLanguageId, getIndentation } from '../utils/helpers';

/**
 * Builds prompts for the AI model
 */
export class PromptBuilder {
    private static instance: PromptBuilder;
    private logger: Logger;
    private tokenizer: Tokenizer;

    private constructor() {
        this.logger = Logger.getInstance();
        this.tokenizer = Tokenizer.getInstance();
    }

    /**
     * Get the prompt builder instance
     */
    public static getInstance(): PromptBuilder {
        if (!PromptBuilder.instance) {
            PromptBuilder.instance = new PromptBuilder();
        }
        return PromptBuilder.instance;
    }

    /**
     * Build a prompt for code completion
     * @param document The document to build a prompt for
     * @param position The position in the document
     * @param maxPromptTokens The maximum number of tokens in the prompt
     * @returns The prompt
     */
    public buildCompletionPrompt(
        document: vscode.TextDocument,
        position: vscode.Position,
        maxPromptTokens: number = 1000
    ): string {
        const languageId = document.languageId;
        const fileContent = document.getText();
        const cursorOffset = document.offsetAt(position);
        
        // Get content before cursor
        const contentBeforeCursor = fileContent.substring(0, cursorOffset);
        
        // Truncate content to fit within token limit
        const truncatedContent = this.tokenizer.truncateToTokenLimit(contentBeforeCursor, maxPromptTokens);
        
        // Build the prompt
        const prompt = this.createPromptTemplate(languageId, truncatedContent);
        
        this.logger.debug(`Built completion prompt of ${this.tokenizer.countTokens(prompt)} tokens`);
        return prompt;
    }

    /**
     * Create a prompt template based on language
     * @param languageId The language ID
     * @param context The code context
     * @returns The prompt template
     */
    private createPromptTemplate(languageId: string, context: string): string {
        // Include language-specific instructions
        const languageInstruction = this.getLanguageInstruction(languageId);
        
        // General instructions
        const generalInstructions = [
            "Continue the code below:",
            "Keep the code concise, readable, and well-structured.",
            "Match the existing code style and conventions.",
            "Don't include explanatory comments unless the existing code style uses them."
        ].join("\n");
        
        return `${generalInstructions}\n${languageInstruction}\n\nCODE CONTEXT:\n${context}\n`;
    }

    /**
     * Get language-specific instructions
     * @param languageId The language ID
     * @returns Language-specific instructions
     */
    private getLanguageInstruction(languageId: string): string {
        switch (languageId) {
            case 'javascript':
                return "Continue the JavaScript code with modern ES6+ syntax.";
            case 'typescript':
                return "Continue the TypeScript code with proper type annotations.";
            case 'python':
                return "Continue the Python code with clear, idiomatic Python.";
            case 'java':
                return "Continue the Java code following standard Java conventions.";
            case 'csharp':
                return "Continue the C# code following .NET conventions.";
            case 'go':
                return "Continue the Go code following standard Go conventions.";
            case 'rust':
                return "Continue the Rust code with proper error handling and memory safety.";
            default:
                return `Continue the ${languageId} code appropriately.`;
        }
    }

    /**
     * Build a prompt for inline completion
     * @param document The document
     * @param position The position
     * @param maxPromptTokens The maximum number of tokens in the prompt
     * @returns The prompt
     */
    public buildInlineCompletionPrompt(
        document: vscode.TextDocument,
        position: vscode.Position,
        maxPromptTokens: number = 800
    ): string {
        const languageId = document.languageId;
        const fileContent = document.getText();
        const cursorOffset = document.offsetAt(position);
        
        // Get content before cursor
        const contentBeforeCursor = fileContent.substring(0, cursorOffset);
        
        // Get current line up to the cursor
        const linePrefix = document.lineAt(position.line).text.substring(0, position.character);
        const indentation = getIndentation();
        
        // Truncate content to fit within token limit, but keep the current line intact
        const lineStartOffset = cursorOffset - position.character;
        const contextBeforeLine = contentBeforeCursor.substring(0, lineStartOffset);
        const truncatedContextBeforeLine = this.tokenizer.truncateToTokenLimit(
            contextBeforeLine, 
            maxPromptTokens - this.tokenizer.countTokens(linePrefix) - 100 // Reserve tokens for instructions
        );
        
        // Build the complete prompt
        const context = truncatedContextBeforeLine + linePrefix;
        const prompt = `Complete the following code. Continue writing from where the cursor is positioned. Match the style and indentation of the existing code. Be concise. Do not explain the code.

Language: ${languageId}
${indentation ? `Current indentation: ${JSON.stringify(indentation)}` : ''}

CODE:
${context}`;

        this.logger.debug(`Built inline completion prompt of ${this.tokenizer.countTokens(prompt)} tokens`);
        return prompt;
    }
}