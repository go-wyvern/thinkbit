import * as vscode from 'vscode';
import { Logger } from './utils/logger';
import { ThinkbitSidebar } from './core/webview';

/**
 * Activate the extension
 * @param context Extension context
 */
export async function activate(context: vscode.ExtensionContext) {
    // Initialize logger
    const logger = Logger.getInstance();
    logger.info('Activating ThinkBit extension');

    try {
        // Register sidebar provider
        const sidebarProvider = new ThinkbitSidebar(context);
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
                ThinkbitSidebar.sideBarId,
                sidebarProvider
            )
        );

        // Register command to show sidebar
        context.subscriptions.push(
            vscode.commands.registerCommand('thinkbit.showSidebar', () => {
                vscode.commands.executeCommand('workbench.view.extension.thinkbit-sidebar');
            })
        );

        // Register command to refresh sidebar
        context.subscriptions.push(
            vscode.commands.registerCommand('thinkbit.refreshSidebar', () => {
                logger.info("refreshSidebar")
                const sidebar = ThinkbitSidebar.getActiveInstance();
                if (sidebar) {
                    sidebar.refresh();
                }
            })
        );

        logger.info('ThinkBit extension activated');
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