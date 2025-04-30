import * as vscode from 'vscode';
import { ConfigurationService } from './configurationService';
import { Logger } from '../utils/logger';
import { showErrorMessage } from '../utils/helpers';
import { CONFIG_API_KEY } from '../utils/constants';

/**
 * Authentication service for ThinkBit extension
 */
export class AuthenticationService {
    private static instance: AuthenticationService;
    private logger: Logger;
    private configService: ConfigurationService;
    private isAuthenticated: boolean = false;

    private constructor() {
        this.logger = Logger.getInstance();
        this.configService = ConfigurationService.getInstance();
    }

    /**
     * Get the authentication service instance
     */
    public static getInstance(): AuthenticationService {
        if (!AuthenticationService.instance) {
            AuthenticationService.instance = new AuthenticationService();
        }
        return AuthenticationService.instance;
    }

    /**
     * Initialize the authentication service
     */
    public async initialize(): Promise<void> {
        // Check if API key is configured
        const apiKey = this.configService.getApiKey();
        this.isAuthenticated = !!apiKey && apiKey.trim().length > 0;
        
        if (!this.isAuthenticated) {
            this.logger.warn('API key not configured');
        } else {
            this.logger.info('Authentication initialized');
        }
    }

    /**
     * Check if the user is authenticated
     */
    public isUserAuthenticated(): boolean {
        return this.isAuthenticated;
    }

    /**
     * Get the API key
     */
    public getApiKey(): string | undefined {
        return this.configService.getApiKey();
    }

    /**
     * Prompt the user to enter an API key
     */
    public async promptForApiKey(): Promise<boolean> {
        this.logger.info('Prompting for API key');

        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your AI model API key',
            password: true,
            ignoreFocusOut: true,
            placeHolder: 'API key'
        });

        if (apiKey) {
            await vscode.workspace.getConfiguration('thinkbit').update(CONFIG_API_KEY, apiKey, vscode.ConfigurationTarget.Global);
            this.isAuthenticated = true;
            this.logger.info('API key configured');
            return true;
        }

        return false;
    }

    /**
     * Check authentication and prompt for API key if not authenticated
     */
    public async checkAuthentication(): Promise<boolean> {
        if (this.isAuthenticated) {
            return true;
        }

        // Check if API key is configured
        const apiKey = this.configService.getApiKey();
        if (apiKey && apiKey.trim().length > 0) {
            this.isAuthenticated = true;
            return true;
        }

        // Prompt for API key
        const result = await this.promptForApiKey();
        if (!result) {
            showErrorMessage('ThinkBit requires an API key to function');
        }

        return result;
    }

    /**
     * Clear authentication
     */
    public async clearAuthentication(): Promise<void> {
        await vscode.workspace.getConfiguration('thinkbit').update(CONFIG_API_KEY, undefined, vscode.ConfigurationTarget.Global);
        this.isAuthenticated = false;
        this.logger.info('Authentication cleared');
    }
}