import * as vscode from 'vscode';
import { ModelService } from '../ai/modelService';
import { PromptBuilder } from '../ai/promptBuilder';
import { ConfigurationService } from '../services/configurationService';
import { TelemetryService } from '../services/telemetryService';
import { Logger } from '../utils/logger';

/**
 * Provider for inline code completions
 */
export class ThinkbitInlineCompletionProvider implements vscode.InlineCompletionItemProvider {
    private logger: Logger;
    private modelService: ModelService;
    private promptBuilder: PromptBuilder;
    private configService: ConfigurationService;
    private telemetryService: TelemetryService;
    private lastRequestTime = 0;
    private debounceDelay = 300; // ms

    constructor() {
        this.logger = Logger.getInstance();
        this.modelService = ModelService.getInstance();
        this.promptBuilder = PromptBuilder.getInstance();
        this.configService = ConfigurationService.getInstance();
        this.telemetryService = TelemetryService.getInstance();
    }

    /**
     * Provide inline completions
     * @param document The document
     * @param position The position
     * @param context The completion context
     * @param token Cancellation token
     * @returns A list of inline completion items
     */
    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[] | vscode.InlineCompletionList | null> {
        // Check if extension is enabled
        if (!this.configService.isEnabled()) {
            return null;
        }

        // Skip if the request is too frequent
        const now = Date.now();
        if (now - this.lastRequestTime < this.debounceDelay) {
            return null;
        }
        this.lastRequestTime = now;

        try {
            // Build the prompt for inline completion
            const prompt = this.promptBuilder.buildInlineCompletionPrompt(document, position);
            
            // Get completions from the model
            const completions = await this.modelService.getCompletions(prompt);
            
            if (!completions.length) {
                return null;
            }
            
            // Convert completions to inline completion items
            const items = completions.map(completion => {
                return new vscode.InlineCompletionItem(completion, new vscode.Range(position, position));
            });
            
            // Track suggestion shown
            this.telemetryService.trackCompletionShown(
                document.languageId,
                items.reduce((sum, item) => sum + (typeof item.insertText === 'string' ? item.insertText.length : item.insertText.value.length), 0),
                Date.now() - this.lastRequestTime
            );
            
            await vscode.commands.executeCommand('setContext', 'thinkbitHasSuggestion', true);
            
            return items;
        } catch (error) {
            this.logger.error('Error providing inline completions', error as Error);
            return null;
        }
    }
}