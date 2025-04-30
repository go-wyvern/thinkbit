import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import {
    TELEMETRY_COMPLETION_SHOWN,
    TELEMETRY_COMPLETION_ACCEPTED,
    TELEMETRY_COMPLETION_REJECTED
} from '../utils/constants';

/**
 * Telemetry service for ThinkBit extension
 */
export class TelemetryService {
    private static instance: TelemetryService;
    private logger: Logger;
    private isEnabled: boolean = false;

    private constructor() {
        this.logger = Logger.getInstance();
        // Check if telemetry is enabled in VS Code
        this.isEnabled = vscode.env.isTelemetryEnabled;
    }

    /**
     * Get the telemetry service instance
     */
    public static getInstance(): TelemetryService {
        if (!TelemetryService.instance) {
            TelemetryService.instance = new TelemetryService();
        }
        return TelemetryService.instance;
    }

    /**
     * Track a completion shown event
     * @param languageId The language ID
     * @param completionLength The length of the completion
     * @param requestDuration Time taken to generate the completion (ms)
     */
    public trackCompletionShown(languageId: string, completionLength: number, requestDuration: number): void {
        if (!this.isEnabled) {
            return;
        }

        this.logger.debug(`Telemetry: ${TELEMETRY_COMPLETION_SHOWN} for ${languageId}, length: ${completionLength}, duration: ${requestDuration}ms`);
    }

    /**
     * Track a completion accepted event
     * @param languageId The language ID
     * @param completionLength The length of the completion
     * @param requestDuration Time taken to generate the completion (ms)
     */
    public trackCompletionAccepted(languageId: string, completionLength: number, requestDuration: number): void {
        if (!this.isEnabled) {
            return;
        }

        this.logger.debug(`Telemetry: ${TELEMETRY_COMPLETION_ACCEPTED} for ${languageId}, length: ${completionLength}, duration: ${requestDuration}ms`);
    }

    /**
     * Track a completion rejected event
     * @param languageId The language ID
     * @param completionLength The length of the completion
     */
    public trackCompletionRejected(languageId: string, completionLength: number): void {
        if (!this.isEnabled) {
            return;
        }

        this.logger.debug(`Telemetry: ${TELEMETRY_COMPLETION_REJECTED} for ${languageId}, length: ${completionLength}`);
    }

    /**
     * Track a feature usage event
     * @param featureName The name of the feature being used
     */
    public trackFeatureUsage(featureName: string): void {
        if (!this.isEnabled) {
            return;
        }

        this.logger.debug(`Telemetry: Feature used: ${featureName}`);
    }

    /**
     * Track an error event
     * @param errorName The error name or category
     * @param message Optional error message
     */
    public trackError(errorName: string, message?: string): void {
        if (!this.isEnabled) {
            return;
        }

        this.logger.debug(`Telemetry: Error: ${errorName}${message ? ` - ${message}` : ''}`);
    }
}