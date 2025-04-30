/**
 * Constants for the ThinkBit extension
 */
export const EXTENSION_NAME = 'thinkbit';
export const EXTENSION_DISPLAY_NAME = 'ThinkBit';

// Configuration constants
export const CONFIG_SECTION = 'thinkbit';
export const CONFIG_ENABLED = 'enabled';
export const CONFIG_MODEL = 'model';
export const CONFIG_API_KEY = 'apiKey';
export const CONFIG_API_ENDPOINT = 'apiEndpoint';
export const CONFIG_MAX_TOKENS = 'maxTokens';
export const CONFIG_TEMPERATURE = 'temperature';
export const CONFIG_TOP_P = 'topP';
export const CONFIG_FREQUENCY_PENALTY = 'frequencyPenalty';
export const CONFIG_PRESENCE_PENALTY = 'presencePenalty';

// Default values
export const DEFAULT_MODEL = 'gpt-4';
export const DEFAULT_MAX_TOKENS = 1024;
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_TOP_P = 1.0;
export const DEFAULT_FREQUENCY_PENALTY = 0.0;
export const DEFAULT_PRESENCE_PENALTY = 0.0;

// Command IDs
export const CMD_ENABLE = 'thinkbit.enable';
export const CMD_DISABLE = 'thinkbit.disable';
export const CMD_SHOW_SUGGESTIONS = 'thinkbit.showSuggestions';
export const CMD_ACCEPT_SUGGESTION = 'thinkbit.acceptSuggestion';
export const CMD_REJECT_SUGGESTION = 'thinkbit.rejectSuggestion';

// Context keys for keyboard shortcuts and menu items
export const CTX_ENABLED = 'thinkbitEnabled';
export const CTX_HAS_SUGGESTION = 'thinkbitHasSuggestion';

// Telemetry events
export const TELEMETRY_COMPLETION_SHOWN = 'completionShown';
export const TELEMETRY_COMPLETION_ACCEPTED = 'completionAccepted';
export const TELEMETRY_COMPLETION_REJECTED = 'completionRejected';

// API and HTTP constants
export const HTTP_TIMEOUT = 30000; // 30 seconds
export const HTTP_RETRY_COUNT = 3;
export const HTTP_RETRY_DELAY = 1000; // 1 second