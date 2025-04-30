import { Logger } from '../utils/logger';

/**
 * Simple tokenizer for code completion
 * This is a placeholder implementation that can be replaced with a more sophisticated tokenizer
 */
export class Tokenizer {
    private static instance: Tokenizer;
    private logger: Logger;

    private constructor() {
        this.logger = Logger.getInstance();
    }

    /**
     * Get the tokenizer instance
     */
    public static getInstance(): Tokenizer {
        if (!Tokenizer.instance) {
            Tokenizer.instance = new Tokenizer();
        }
        return Tokenizer.instance;
    }

    /**
     * Count the tokens in a text (approximate)
     * This is a very simple implementation and should be replaced with a proper tokenizer
     * @param text The text to count tokens in
     * @returns The approximate number of tokens
     */
    public countTokens(text: string): number {
        if (!text) {
            return 0;
        }
        
        // Simple approximation: split by whitespace and punctuation
        const tokens = text.split(/\s+|([.,!?;:(){}\[\]])/g)
            .filter(token => token && token.trim().length > 0);
            
        return tokens.length;
    }

    /**
     * Truncate text to a maximum number of tokens
     * @param text The text to truncate
     * @param maxTokens The maximum number of tokens
     * @returns The truncated text
     */
    public truncateToTokenLimit(text: string, maxTokens: number): string {
        if (!text) {
            return '';
        }
        
        if (this.countTokens(text) <= maxTokens) {
            return text;
        }
        
        // Simple implementation: split by whitespace and punctuation
        const tokens = text.split(/\s+|([.,!?;:(){}\[\]])/g)
            .filter(token => token && token.trim().length > 0);
        
        // Take the last maxTokens tokens
        const truncatedTokens = tokens.slice(-maxTokens);
        
        return truncatedTokens.join(' ');
    }
}