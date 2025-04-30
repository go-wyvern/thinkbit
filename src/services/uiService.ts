import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { ConfigurationService } from './configurationService';
import { AuthenticationService } from './authenticationService';
import { TelemetryService } from './telemetryService';
import { CMD_ENABLE, CMD_DISABLE, CMD_SHOW_SUGGESTIONS, CTX_ENABLED } from '../utils/constants';

/**
 * UI Service for ThinkBit extension
 */
export class UIService {
    private static instance: UIService;
    private logger: Logger;
    private configService: ConfigurationService;
    private telemetryService: TelemetryService;
    
    // UI elements
    private statusBarItem: vscode.StatusBarItem;
    private welcomePanel: vscode.WebviewPanel | undefined;
    private dashboardProvider: ThinkbitDashboardProvider;
    private settingsProvider: ThinkbitSettingsProvider;

    private constructor() {
        this.logger = Logger.getInstance();
        this.configService = ConfigurationService.getInstance();
        this.telemetryService = TelemetryService.getInstance();
        
        // Initialize status bar
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'thinkbit.showSidebar';
        
        // Initialize view providers
        this.dashboardProvider = new ThinkbitDashboardProvider();
        this.settingsProvider = new ThinkbitSettingsProvider();
        
        // Update UI based on current state
        this.updateUI();
    }

    /**
     * Get the UI service instance
     */
    public static getInstance(): UIService {
        if (!UIService.instance) {
            UIService.instance = new UIService();
        }
        return UIService.instance;
    }

    /**
     * Register all UI components
     * @param context The extension context
     */
    public registerUIComponents(context: vscode.ExtensionContext): void {
        // Register status bar
        context.subscriptions.push(this.statusBarItem);
        
        // Register view providers
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('thinkbit-dashboard', this.dashboardProvider)
        );
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('thinkbit-settings', this.settingsProvider)
        );
        
        // Register commands
        context.subscriptions.push(
            vscode.commands.registerCommand('thinkbit.openSettings', () => {
                vscode.commands.executeCommand('workbench.action.openSettings', '@ext:go-wyvern.thinkbit');
                this.telemetryService.trackFeatureUsage('open_settings');
            })
        );
        
        context.subscriptions.push(
            vscode.commands.registerCommand('thinkbit.showSidebar', () => {
                vscode.commands.executeCommand('workbench.view.extension.thinkbit-sidebar');
                this.telemetryService.trackFeatureUsage('open_sidebar');
            })
        );
        
        // Show welcome panel on first install
        if (context.extensionMode === vscode.ExtensionMode.Development || 
            !context.globalState.get('thinkbit.welcomeShown')) {
            this.showWelcomePanel(context);
            context.globalState.update('thinkbit.welcomeShown', true);
        }
    }

    /**
     * Update UI elements based on current state
     */
    public updateUI(): void {
        const isEnabled = this.configService.isEnabled();
        
        // Update status bar
        if (isEnabled) {
            this.statusBarItem.text = '$(sparkle) ThinkBit';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
            this.statusBarItem.tooltip = 'ThinkBit is enabled (click to open)';
            this.statusBarItem.show();
        } else {
            this.statusBarItem.text = '$(circle-slash) ThinkBit';
            this.statusBarItem.backgroundColor = undefined;
            this.statusBarItem.tooltip = 'ThinkBit is disabled (click to open)';
            this.statusBarItem.show();
        }
        
        // Notify webviews of state change
        this.dashboardProvider.updateState({ enabled: isEnabled });
        this.settingsProvider.updateState({ 
            enabled: isEnabled,
            model: this.configService.getModel(),
            isConfigured: this.configService.isConfigured()
        });
    }

    /**
     * Show the welcome panel
     */
    private showWelcomePanel(context: vscode.ExtensionContext): void {
        if (this.welcomePanel) {
            this.welcomePanel.reveal();
            return;
        }
        
        this.welcomePanel = vscode.window.createWebviewPanel(
            'thinkbitWelcome',
            'Welcome to ThinkBit',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(context.extensionPath)]
            }
        );
        
        // Create welcome content
        this.welcomePanel.webview.html = this.getWelcomeHtml();
        
        // Handle messages from webview
        this.welcomePanel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'enable':
                    await vscode.commands.executeCommand(CMD_ENABLE);
                    break;
                case 'openSettings':
                    await vscode.commands.executeCommand('thinkbit.openSettings');
                    break;
                case 'close':
                    this.welcomePanel?.dispose();
                    break;
            }
        });
        
        // Clean up on panel close
        this.welcomePanel.onDidDispose(() => {
            this.welcomePanel = undefined;
        });
        
        this.telemetryService.trackFeatureUsage('welcome_panel_shown');
    }

    /**
     * Get the welcome panel HTML
     */
    private getWelcomeHtml(): string {
        const isConfigured = this.configService.isConfigured();
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to ThinkBit</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                        color: var(--vscode-foreground);
                        padding: 20px;
                        line-height: 1.5;
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    h1 {
                        font-size: 28px;
                        margin-bottom: 20px;
                        color: var(--vscode-textLink-foreground);
                    }
                    .header {
                        display: flex;
                        align-items: center;
                        margin-bottom: 30px;
                    }
                    .logo {
                        font-size: 36px;
                        margin-right: 10px;
                    }
                    .step {
                        margin-bottom: 30px;
                        background-color: var(--vscode-editor-background);
                        border-radius: 5px;
                        padding: 15px;
                    }
                    .step-header {
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .step-content {
                        margin-bottom: 15px;
                    }
                    button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 16px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        border-radius: 2px;
                        margin-right: 10px;
                        margin-bottom: 10px;
                    }
                    button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .button-container {
                        margin-top: 15px;
                    }
                    .checkbox {
                        margin-top: 30px;
                    }
                    .features {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .feature {
                        padding: 15px;
                        background-color: var(--vscode-editor-background);
                        border-radius: 5px;
                    }
                    .feature-title {
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">✨</div>
                        <h1>Welcome to ThinkBit</h1>
                    </div>
                    
                    <p>ThinkBit is an AI-powered coding assistant that helps you write better code faster. Get smart code completions, suggestions, and explanations as you type.</p>
                    
                    <div class="features">
                        <div class="feature">
                            <div class="feature-title">✓ Code Completions</div>
                            <div>Get AI-powered code suggestions as you type</div>
                        </div>
                        <div class="feature">
                            <div class="feature-title">✓ Inline Suggestions</div>
                            <div>See completions right in your editor</div>
                        </div>
                        <div class="feature">
                            <div class="feature-title">✓ Code Explanations</div>
                            <div>Hover over code to understand what it does</div>
                        </div>
                        <div class="feature">
                            <div class="feature-title">✓ Multiple Languages</div>
                            <div>Works with JavaScript, TypeScript, Python, and more</div>
                        </div>
                    </div>

                    <div class="step">
                        <div class="step-header">1. Configure API Key</div>
                        <div class="step-content">
                            ThinkBit requires an AI model API key to function. You can use OpenAI's API or any compatible service.
                        </div>
                        <div class="button-container">
                            <button id="configureButton">Configure API Key</button>
                        </div>
                    </div>
                    
                    <div class="step">
                        <div class="step-header">2. Enable ThinkBit</div>
                        <div class="step-content">
                            Once configured, enable ThinkBit to start getting AI-powered code suggestions.
                        </div>
                        <div class="button-container">
                            <button id="enableButton">Enable ThinkBit</button>
                        </div>
                    </div>
                    
                    <div class="step">
                        <div class="step-header">3. Start coding with AI assistance</div>
                        <div class="step-content">
                            ThinkBit will provide suggestions as you write code. Press Tab to accept suggestions.
                            You can also trigger suggestions manually with Ctrl+Space.
                        </div>
                    </div>
                    
                    <button id="closeButton">Got it, let's code!</button>

                    <script>
                        const vscode = acquireVsCodeApi();
                        
                        document.getElementById('configureButton').addEventListener('click', () => {
                            vscode.postMessage({ command: 'openSettings' });
                        });
                        
                        document.getElementById('enableButton').addEventListener('click', () => {
                            vscode.postMessage({ command: 'enable' });
                        });
                        
                        document.getElementById('closeButton').addEventListener('click', () => {
                            vscode.postMessage({ command: 'close' });
                        });
                    </script>
                </div>
            </body>
            </html>
        `;
    }
}

/**
 * Dashboard view provider
 */
class ThinkbitDashboardProvider implements vscode.WebviewViewProvider {
    private webviewView: vscode.WebviewView | undefined;
    private state = { enabled: false };
    
    public updateState(state: Partial<{ enabled: boolean }>): void {
        this.state = { ...this.state, ...state };
        
        if (this.webviewView) {
            Promise.resolve(this.webviewView.webview.postMessage({ 
                command: 'updateState', 
                state: this.state 
            })).catch(err => {
                // Ignore postMessage errors when webview is disposed
                console.log('Error sending message to webview:', err);
            });
        }
    }
    
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken): void | Thenable<void> {
        this.webviewView = webviewView;
        
        webviewView.webview.options = {
            enableScripts: true
        };
        
        webviewView.webview.html = this.getHtml();
        
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'enable':
                    await vscode.commands.executeCommand(CMD_ENABLE);
                    break;
                case 'disable':
                    await vscode.commands.executeCommand(CMD_DISABLE);
                    break;
                case 'showSuggestions':
                    await vscode.commands.executeCommand(CMD_SHOW_SUGGESTIONS);
                    break;
                case 'openSettings':
                    await vscode.commands.executeCommand('thinkbit.openSettings');
                    break;
            }
        });
    }
    
    private getHtml(): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                        padding: 10px;
                    }
                    button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 16px;
                        font-size: 13px;
                        cursor: pointer;
                        border-radius: 2px;
                        margin-right: 5px;
                        margin-bottom: 10px;
                        display: block;
                        width: 100%;
                        text-align: left;
                    }
                    button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .section {
                        margin-bottom: 20px;
                    }
                    .section-title {
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .status {
                        display: flex;
                        align-items: center;
                        margin-bottom: 15px;
                    }
                    .status-indicator {
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        margin-right: 8px;
                    }
                    .status-enabled {
                        background-color: var(--vscode-testing-iconPassed);
                    }
                    .status-disabled {
                        background-color: var(--vscode-testing-iconFailed);
                    }
                    .status-text {
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="section">
                    <div class="status">
                        <div class="status-indicator ${this.state.enabled ? 'status-enabled' : 'status-disabled'}"></div>
                        <div class="status-text">ThinkBit is ${this.state.enabled ? 'enabled' : 'disabled'}</div>
                    </div>
                    
                    <button id="${this.state.enabled ? 'disableButton' : 'enableButton'}">
                        ${this.state.enabled ? '$(circle-slash) Disable ThinkBit' : '$(check) Enable ThinkBit'}
                    </button>
                    
                    <button id="suggestButton" ${!this.state.enabled ? 'disabled' : ''}>
                        $(lightbulb) Show Suggestions
                    </button>
                </div>
                
                <div class="section">
                    <div class="section-title">Quick Actions</div>
                    <button id="settingsButton">$(gear) Settings</button>
                </div>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    // Button event listeners
                    document.getElementById('${this.state.enabled ? 'disableButton' : 'enableButton'}').addEventListener('click', () => {
                        vscode.postMessage({ command: '${this.state.enabled ? 'disable' : 'enable'}' });
                    });
                    
                    document.getElementById('suggestButton').addEventListener('click', () => {
                        vscode.postMessage({ command: 'showSuggestions' });
                    });
                    
                    document.getElementById('settingsButton').addEventListener('click', () => {
                        vscode.postMessage({ command: 'openSettings' });
                    });
                    
                    // Handle state updates
                    window.addEventListener('message', (event) => {
                        const message = event.data;
                        if (message.command === 'updateState') {
                            // This would reload the view with the new state
                            document.location.reload();
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
}

/**
 * Settings view provider
 */
class ThinkbitSettingsProvider implements vscode.WebviewViewProvider {
    private webviewView: vscode.WebviewView | undefined;
    private state = { 
        enabled: false,
        model: 'gpt-4',
        isConfigured: false
    };
    
    public updateState(state: Partial<{ enabled: boolean, model: string, isConfigured: boolean }>): void {
        this.state = { ...this.state, ...state };
        
        if (this.webviewView) {
            Promise.resolve(this.webviewView.webview.postMessage({ 
                command: 'updateState', 
                state: this.state 
            })).catch(err => {
                // Ignore postMessage errors when webview is disposed
                console.log('Error sending message to webview:', err);
            });
        }
    }
    
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken): void | Thenable<void> {
        this.webviewView = webviewView;
        
        webviewView.webview.options = {
            enableScripts: true
        };
        
        webviewView.webview.html = this.getHtml();
        
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'openSettings':
                    await vscode.commands.executeCommand('thinkbit.openSettings');
                    break;
            }
        });
    }
    
    private getHtml(): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                        padding: 10px;
                    }
                    .setting {
                        margin-bottom: 15px;
                    }
                    .setting-label {
                        font-weight: 500;
                        margin-bottom: 5px;
                    }
                    .setting-value {
                        font-family: monospace;
                        background-color: var(--vscode-editor-background);
                        padding: 5px;
                        border-radius: 3px;
                        color: var(--vscode-textPreformat-foreground);
                    }
                    .setting-status {
                        margin-top: 5px;
                        font-size: 12px;
                    }
                    .status-ok {
                        color: var(--vscode-testing-iconPassed);
                    }
                    .status-error {
                        color: var(--vscode-testing-iconFailed);
                    }
                    button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 16px;
                        font-size: 13px;
                        cursor: pointer;
                        border-radius: 2px;
                        margin-top: 15px;
                    }
                    button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="setting">
                    <div class="setting-label">Status:</div>
                    <div class="setting-value">${this.state.enabled ? 'Enabled' : 'Disabled'}</div>
                </div>
                
                <div class="setting">
                    <div class="setting-label">Current Model:</div>
                    <div class="setting-value">${this.state.model}</div>
                </div>
                
                <div class="setting">
                    <div class="setting-label">API Key:</div>
                    <div class="setting-value">
                        ${this.state.isConfigured ? '••••••••••••••••••••' : 'Not configured'}
                    </div>
                    <div class="setting-status ${this.state.isConfigured ? 'status-ok' : 'status-error'}">
                        ${this.state.isConfigured ? '✓ API key is set' : '× API key is required'}
                    </div>
                </div>
                
                <button id="configureButton">Open Full Settings</button>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    document.getElementById('configureButton').addEventListener('click', () => {
                        vscode.postMessage({ command: 'openSettings' });
                    });
                    
                    // Handle state updates
                    window.addEventListener('message', (event) => {
                        const message = event.data;
                        if (message.command === 'updateState') {
                            // This would reload the view with the new state
                            document.location.reload();
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
}