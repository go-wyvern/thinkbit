import * as vscode from 'vscode';
import { ModelService } from '../ai/modelService';
import { PromptBuilder } from '../ai/promptBuilder';
import { ConfigurationService } from '../services/configurationService';
import { TelemetryService } from '../services/telemetryService';
import { Logger } from '../utils/logger';

/**
 * Provider for code completions
 */
export class ThinkbitCompletionProvider implements vscode.CompletionItemProvider {
    private logger: Logger;
    private modelService: ModelService;
    private promptBuilder: PromptBuilder;
    private configService: ConfigurationService;
    private telemetryService: TelemetryService;

    constructor() {
        this.logger = Logger.getInstance();
        this.modelService = ModelService.getInstance();
        this.promptBuilder = PromptBuilder.getInstance();
        this.configService = ConfigurationService.getInstance();
        this.telemetryService = TelemetryService.getInstance();
    }

    /**
     * Provide completion items
     * @param document The document
     * @param position The position
     * @param token Cancellation token
     * @param context The completion context
     * @returns A list of completion items
     */
    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[] | vscode.CompletionList | null> {
        // Check if extension is enabled
        if (!this.configService.isEnabled()) {
            return null;
        }

        try {
            // Build the prompt for completion
            const prompt = this.promptBuilder.buildCompletionPrompt(document, position);
            
            // Get completions from the model
            const completions = await this.modelService.getCompletions(prompt);
            
            if (!completions.length) {
                return null;
            }
            
            // Convert completions to completion items
            const items = completions.map((completion, index) => {
                const item = new vscode.CompletionItem(
                    `ThinkBit suggestion ${index + 1}`,
                    vscode.CompletionItemKind.Snippet
                );
                item.insertText = completion;
                item.detail = 'AI-powered completion';
                item.documentation = new vscode.MarkdownString(completion);
                item.sortText = `00${index}`; // Ensure suggestions appear at the top
                
                return item;
            });
            
            // Track suggestion shown
            this.telemetryService.trackCompletionShown(
                document.languageId,
                items.reduce((sum, item) => sum + (item.insertText?.toString().length || 0), 0),
                0 // 你可能需要添加实际的请求时间测量
            );
            
            return items;
        } catch (error) {
            this.logger.error('Error providing completions', error as Error);
            return null;
        }
    }

    /**
     * Handle completion item selection
     * @param item The selected completion item
     * @param token Cancellation token
     * @returns The resolved completion item
     */
    async resolveCompletionItem(
        item: vscode.CompletionItem,
        token: vscode.CancellationToken
    ): Promise<vscode.CompletionItem> {
        // Track completion accepted
        if (item.label.toString().startsWith('ThinkBit suggestion')) {
            // Get the active editor's document to retrieve language ID
            const activeEditor = vscode.window.activeTextEditor;
            const languageId = activeEditor?.document.languageId || 'unknown';
            
            this.telemetryService.trackCompletionAccepted(
                languageId,
                item.insertText?.toString().length || 0,
                0 // 你可能需要添加实际的请求时间测量
            );
        }
        
        return item;
    }
}