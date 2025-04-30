import * as vscode from 'vscode';

/**
 * Log levels for the extension
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

/**
 * Logger class for ThinkBit extension
 */
export class Logger {
    private static instance: Logger;
    private outputChannel: vscode.OutputChannel;
    private logLevel: LogLevel;

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel('ThinkBit');
        this.logLevel = LogLevel.INFO;
    }

    /**
     * Get the logger instance
     */
    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    /**
     * Set the log level
     * @param level The log level to set
     */
    public setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    /**
     * Debug level log
     * @param message The message to log
     */
    public debug(message: string): void {
        if (this.logLevel <= LogLevel.DEBUG) {
            this.log(`DEBUG: ${message}`);
        }
    }

    /**
     * Info level log
     * @param message The message to log
     */
    public info(message: string): void {
        if (this.logLevel <= LogLevel.INFO) {
            this.log(`INFO: ${message}`);
        }
    }

    /**
     * Warning level log
     * @param message The message to log
     */
    public warn(message: string): void {
        if (this.logLevel <= LogLevel.WARN) {
            this.log(`WARN: ${message}`);
        }
    }

    /**
     * Error level log
     * @param message The message to log
     * @param error Optional error to log
     */
    public error(message: string, error?: Error): void {
        if (this.logLevel <= LogLevel.ERROR) {
            this.log(`ERROR: ${message}`);
            if (error) {
                this.log(`${error.name}: ${error.message}`);
                if (error.stack) {
                    this.log(error.stack);
                }
            }
        }
    }

    /**
     * Write a message to the output channel
     * @param message The message to log
     */
    private log(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
    }

    /**
     * Show the output channel
     */
    public show(): void {
        this.outputChannel.show();
    }
}