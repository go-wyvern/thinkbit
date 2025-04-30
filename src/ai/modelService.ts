import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { ConfigurationService } from '../services/configurationService';
import { AuthenticationService } from '../services/authenticationService';
import { TelemetryService } from '../services/telemetryService';
import { showErrorMessage } from '../utils/helpers';
import { HTTP_TIMEOUT, HTTP_RETRY_COUNT, HTTP_RETRY_DELAY } from '../utils/constants';

/**
 * Service for interacting with AI models
 */
export class ModelService {
    private static instance: ModelService;
    private logger: Logger;
    private configService: ConfigurationService;
    private authService: AuthenticationService;
    private telemetryService: TelemetryService;

    private constructor() {
        this.logger = Logger.getInstance();
        this.configService = ConfigurationService.getInstance();
        this.authService = AuthenticationService.getInstance();
        this.telemetryService = TelemetryService.getInstance();
    }

    /**
     * Get the model service instance
     */
    public static getInstance(): ModelService {
        if (!ModelService.instance) {
            ModelService.instance = new ModelService();
        }
        return ModelService.instance;
    }

    /**
     * Get completions from the AI model
     * @param prompt The prompt to send to the model
     * @returns The completions
     */
    public async getCompletions(prompt: string): Promise<string[]> {
        try {
            // Check authentication
            if (!await this.authService.checkAuthentication()) {
                return [];
            }

            const apiKey = this.authService.getApiKey();
            const model = this.configService.getModel();
            const apiEndpoint = this.configService.getApiEndpoint() || 'https://api.openai.com/v1/completions';
            const maxTokens = this.configService.getMaxTokens();
            const temperature = this.configService.getTemperature();
            const topP = this.configService.getTopP();
            const frequencyPenalty = this.configService.getFrequencyPenalty();
            const presencePenalty = this.configService.getPresencePenalty();

            this.logger.debug(`Requesting completions from ${model}`);
            
            const startTime = Date.now();
            
            // Make the API request
            const response = await this.makeApiRequest(apiEndpoint, {
                model,
                prompt,
                max_tokens: maxTokens,
                temperature,
                top_p: topP,
                frequency_penalty: frequencyPenalty,
                presence_penalty: presencePenalty,
                n: 3, // Request multiple completions
                stop: null // Let the model decide when to stop
            }, apiKey);
            
            const duration = Date.now() - startTime;
            this.logger.debug(`Got response in ${duration}ms`);

            // Parse the response
            const completions = this.parseCompletions(response);
            
            this.telemetryService.sendEvent('model_completions', {
                model,
                duration,
                completionCount: completions.length
            });
            
            return completions;
        } catch (error) {
            this.handleApiError(error as Error);
            return [];
        }
    }

    /**
     * Make an API request to the model
     * @param endpoint The API endpoint
     * @param data The request data
     * @param apiKey The API key
     * @returns The response
     */
    private async makeApiRequest(endpoint: string, data: any, apiKey: string | undefined): Promise<any> {
        if (!apiKey) {
            throw new Error('API key not provided');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT);

        try {
            let retryCount = 0;
            while (retryCount <= HTTP_RETRY_COUNT) {
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        body: JSON.stringify(data),
                        signal: controller.signal
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
                    }

                    return await response.json();
                } catch (error) {
                    if (retryCount >= HTTP_RETRY_COUNT) {
                        throw error;
                    }

                    this.logger.warn(`Retrying API request (${retryCount + 1}/${HTTP_RETRY_COUNT})`);
                    await new Promise(resolve => setTimeout(resolve, HTTP_RETRY_DELAY));
                    retryCount++;
                }
            }
            throw new Error('Maximum retry count exceeded');
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Parse completions from the API response
     * @param response The API response
     * @returns The completions
     */
    private parseCompletions(response: any): string[] {
        if (!response || !response.choices || !Array.isArray(response.choices)) {
            this.logger.warn('Invalid response format');
            return [];
        }

        return response.choices
            .map((choice: any) => choice.text?.trim())
            .filter((text: string) => !!text);
    }

    /**
     * Handle API errors
     * @param error The error
     */
    private handleApiError(error: Error): void {
        this.logger.error('API request failed', error);
        
        this.telemetryService.trackError('api_request', {
            message: error.message
        });
        
        let errorMessage = 'Failed to get AI completions';
        
        if (error.message.includes('API key')) {
            errorMessage = 'Invalid API key';
        } else if (error.message.includes('429')) {
            errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please try again.';
        }
        
        showErrorMessage(errorMessage, error);
    }
}