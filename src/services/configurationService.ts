import * as vscode from 'vscode';
import {
    CONFIG_SECTION,
    CONFIG_ENABLED,
    CONFIG_MODEL,
    CONFIG_API_KEY,
    CONFIG_API_ENDPOINT,
    CONFIG_MAX_TOKENS,
    CONFIG_TEMPERATURE,
    CONFIG_TOP_P,
    CONFIG_FREQUENCY_PENALTY,
    CONFIG_PRESENCE_PENALTY,
    DEFAULT_MODEL,
    DEFAULT_MAX_TOKENS,
    DEFAULT_TEMPERATURE,
    DEFAULT_TOP_P,
    DEFAULT_FREQUENCY_PENALTY,
    DEFAULT_PRESENCE_PENALTY,
} from '../utils/constants';
import { Logger } from '../utils/logger';

/**
 * Configuration service for ThinkBit extension
 */
export class ConfigurationService {
    private static instance: ConfigurationService;
    private logger: Logger;
    private config: vscode.WorkspaceConfiguration;

    private constructor() {
        this.logger = Logger.getInstance();
        this.config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    }

    /**
     * Get the configuration service instance
     */
    public static getInstance(): ConfigurationService {
        if (!ConfigurationService.instance) {
            ConfigurationService.instance = new ConfigurationService();
        }
        return ConfigurationService.instance;
    }

    /**
     * Refresh the configuration
     */
    public refresh(): void {
        this.config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    }

    /**
     * Check if the extension is enabled
     */
    public isEnabled(): boolean {
        return this.config.get<boolean>(CONFIG_ENABLED, false);
    }

    /**
     * Enable or disable the extension
     * @param enabled Whether to enable the extension
     */
    public async setEnabled(enabled: boolean): Promise<void> {
        await this.config.update(CONFIG_ENABLED, enabled, vscode.ConfigurationTarget.Global);
        this.logger.info(`Extension ${enabled ? 'enabled' : 'disabled'}`);
        await vscode.commands.executeCommand('setContext', 'thinkbitEnabled', enabled);
    }

    /**
     * Get the model to use for code completion
     */
    public getModel(): string {
        return this.config.get<string>(CONFIG_MODEL, DEFAULT_MODEL);
    }

    /**
     * Get the API key
     */
    public getApiKey(): string | undefined {
        return this.config.get<string>(CONFIG_API_KEY);
    }

    /**
     * Get the API endpoint
     */
    public getApiEndpoint(): string | undefined {
        return this.config.get<string>(CONFIG_API_ENDPOINT);
    }

    /**
     * Get the maximum number of tokens to generate
     */
    public getMaxTokens(): number {
        return this.config.get<number>(CONFIG_MAX_TOKENS, DEFAULT_MAX_TOKENS);
    }

    /**
     * Get the temperature for code completion
     */
    public getTemperature(): number {
        return this.config.get<number>(CONFIG_TEMPERATURE, DEFAULT_TEMPERATURE);
    }

    /**
     * Get the top_p value for code completion
     */
    public getTopP(): number {
        return this.config.get<number>(CONFIG_TOP_P, DEFAULT_TOP_P);
    }

    /**
     * Get the frequency penalty for code completion
     */
    public getFrequencyPenalty(): number {
        return this.config.get<number>(CONFIG_FREQUENCY_PENALTY, DEFAULT_FREQUENCY_PENALTY);
    }

    /**
     * Get the presence penalty for code completion
     */
    public getPresencePenalty(): number {
        return this.config.get<number>(CONFIG_PRESENCE_PENALTY, DEFAULT_PRESENCE_PENALTY);
    }

    /**
     * Check if the extension is properly configured
     */
    public isConfigured(): boolean {
        const apiKey = this.getApiKey();
        return !!apiKey && apiKey.trim().length > 0;
    }
}