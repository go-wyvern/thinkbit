import * as vscode from 'vscode';
import { ModelService } from '../ai/modelService';
import { ConfigurationService } from '../services/configurationService';
import { Logger } from '../utils/logger';

/**
 * Provider for hover information
 */
export class ThinkbitHoverProvider implements vscode.HoverProvider {
    private logger: Logger;
    private modelService: ModelService;
    private configService: ConfigurationService;

    constructor() {
        this.logger = Logger.getInstance();
        this.modelService = ModelService.getInstance();
        this.configService = ConfigurationService.getInstance();
    }

    /**
     * Provide hover information
     * @param document The document
     * @param position The position
     * @param token Cancellation token
     * @returns Hover information
     */
    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | null> {
        // Check if extension is enabled
        if (!this.configService.isEnabled()) {
            return null;
        }

        try {
            const wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                return null;
            }

            const word = document.getText(wordRange);
            if (!word || word.trim().length === 0) {
                return null;
            }

            // For complex functions or classes, provide explanations
            const lineText = document.lineAt(position.line).text;
            let explanation: string | undefined;

            // Function or class definition
            if (lineText.includes('function') || lineText.includes('class') || 
                lineText.includes('def ') || lineText.match(/^\s*(public|private|protected)/)) {
                
                // Get the block content (up to 10 lines) for context
                let blockContent = lineText;
                let endLine = position.line;
                let braceCount = 0;
                
                // Simple heuristic to capture function/class body
                for (let i = position.line; i < Math.min(position.line + 10, document.lineCount); i++) {
                    const line = document.lineAt(i).text;
                    braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
                    
                    if (i > position.line) {
                        blockContent += '\n' + line;
                    }
                    
                    endLine = i;
                    if (braceCount < 0 || (braceCount === 0 && i > position.line && 
                        (line.includes('}') || line.trim() === 'end' || line.match(/^\s*$/g)))) {
                        break;
                    }
                }
                
                // Generate explanation for the function or class
                const prompt = `Explain what the following ${lineText.includes('class') ? 'class' : 'function'} does. Be concise and specific:\n\n${blockContent}`;
                const explanations = await this.modelService.getCompletions(prompt);
                
                if (explanations.length > 0) {
                    explanation = explanations[0];
                }
            }

            if (explanation) {
                const markdown = new vscode.MarkdownString();
                markdown.appendMarkdown(`**ThinkBit explanation:**\n\n${explanation}`);
                markdown.isTrusted = true;
                
                return new vscode.Hover(markdown);
            }
            
            return null;
            
        } catch (error) {
            this.logger.error('Error providing hover', error as Error);
            return null;
        }
    }
}