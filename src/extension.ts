import * as vscode from 'vscode';
import { ThinkbitInlineCompletionProvider } from './providers/inlineCompletionProvider';
import { ThinkbitCompletionProvider } from './providers/completionProvider';
import { ThinkbitHoverProvider } from './providers/hoverProvider';
import { AuthenticationService } from './services/authenticationService';
import { ConfigurationService } from './services/configurationService';
import { TelemetryService } from './services/telemetryService';
import { UIService } from './services/uiService';
import { ModelService } from './ai/modelService';
import { Logger } from './utils/logger';
import { CMD_ENABLE, CMD_DISABLE, CMD_SHOW_SUGGESTIONS, CTX_ENABLED } from './utils/constants';
import { showInfoMessage } from './utils/helpers';

// Supported languages for code completion
const SUPPORTED_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'cpp', 'c',
  'ruby', 'php', 'rust', 'swift', 'kotlin', 'html', 'css', 'markdown'
];

// Completion triggers
const COMPLETION_TRIGGERS = ['.', '(', '{', '[', '<', ' ', '\n'];

/**
 * Activate the extension
 * @param context Extension context
 */
export async function activate(context: vscode.ExtensionContext) {
    // Initialize logger
    const logger = Logger.getInstance();
    logger.info('Activating ThinkBit extension');

    try {
        // Initialize services
        const configService = ConfigurationService.getInstance();
        const authService = AuthenticationService.getInstance();
        await authService.initialize();
        
        // Initialize UI service
        const uiService = UIService.getInstance();
        uiService.registerUIComponents(context);

        // Register the inline completion provider
        const inlineCompletionProvider = new ThinkbitInlineCompletionProvider();
        for (const language of SUPPORTED_LANGUAGES) {
            context.subscriptions.push(
                vscode.languages.registerInlineCompletionItemProvider(
                    { scheme: 'file', language },
                    inlineCompletionProvider
                )
            );
        }

        // Register the inline completion provider for all files
        context.subscriptions.push(
            vscode.languages.registerInlineCompletionItemProvider(
                { pattern: '**' },
                new ThinkbitInlineCompletionProvider()
            )
        );

        // Register the completion provider
        const completionProvider = new ThinkbitCompletionProvider();
        for (const language of SUPPORTED_LANGUAGES) {
            context.subscriptions.push(
                vscode.languages.registerCompletionItemProvider(
                    { scheme: 'file', language },
                    completionProvider,
                    ...COMPLETION_TRIGGERS
                )
            );
        }

        // Register the hover provider
        const hoverProvider = new ThinkbitHoverProvider();
        for (const language of SUPPORTED_LANGUAGES) {
            context.subscriptions.push(
                vscode.languages.registerHoverProvider(
                    { scheme: 'file', language },
                    hoverProvider
                )
            );
        }

        // Set context
        await vscode.commands.executeCommand('setContext', CTX_ENABLED, configService.isEnabled());

        // Register commands
        context.subscriptions.push(
            vscode.commands.registerCommand(CMD_ENABLE, async () => {
                await configService.setEnabled(true);
                await vscode.commands.executeCommand('setContext', CTX_ENABLED, true);
                uiService.updateUI();
                showInfoMessage('ThinkBit is now enabled');
            })
        );

        context.subscriptions.push(
            vscode.commands.registerCommand(CMD_DISABLE, async () => {
                await configService.setEnabled(false);
                await vscode.commands.executeCommand('setContext', CTX_ENABLED, false);
                uiService.updateUI();
                showInfoMessage('ThinkBit is now disabled');
            })
        );

        context.subscriptions.push(
            vscode.commands.registerCommand(CMD_SHOW_SUGGESTIONS, async () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    return;
                }
                
                if (!configService.isEnabled()) {
                    showInfoMessage('ThinkBit is currently disabled. Enable it first.');
                    return;
                }

                // Trigger inline completion
                await vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
            })
        );

        // Track completion accepted command
        context.subscriptions.push(
            vscode.commands.registerCommand('thinkbit.trackCompletionAccepted', 
                (languageId: string, completionLength: number, requestDuration: number) => {
                    const telemetryService = TelemetryService.getInstance();
                    telemetryService.trackCompletionAccepted(languageId, completionLength, requestDuration);
                }
            )
        );

        // Track completion rejected command
        context.subscriptions.push(
            vscode.commands.registerCommand('thinkbit.trackCompletionRejected',
                (languageId: string, completionLength: number) => {
                    const telemetryService = TelemetryService.getInstance();
                    telemetryService.trackCompletionRejected(languageId, completionLength);
                }
            )
        );

        // Configuration change listener
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('thinkbit')) {
                    configService.refresh();
                    uiService.updateUI();
                    logger.debug('Configuration refreshed');
                }
            })
        );

        // Add event listener to track inline completion acceptance
        vscode.window.onDidChangeTextEditorSelection(async (event) => {
            const telemetryService = TelemetryService.getInstance();
            const activeEditor = vscode.window.activeTextEditor;

            if (activeEditor) {
                telemetryService.trackCompletionAccepted(
                    activeEditor.document.languageId,
                    0, // Temporary value for completion length
                    0  // Temporary value for request duration
                );
            }
        });

        logger.info('ThinkBit extension activated');
        
        // If enabled, just show a simple welcome message in status bar
        if (configService.isEnabled()) {
            vscode.window.setStatusBarMessage('ThinkBit is ready - start typing for AI-powered suggestions', 5000);
        }
    } catch (error) {
        logger.error('Failed to activate ThinkBit extension', error as Error);
    }
}

/**
 * Deactivate the extension
 */
export function deactivate() {
    const logger = Logger.getInstance();
    logger.info('ThinkBit extension deactivated');
}