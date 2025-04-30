import * as vscode from 'vscode';
import * as path from 'path';
import { Logger } from './logger';

const logger = Logger.getInstance();

/**
 * Gets the current editor's content
 * @returns The editor content or null if no active editor
 */
export function getEditorContent(): string | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return null;
    }
    return editor.document.getText();
}

/**
 * Gets the current cursor position
 * @returns The cursor position or null if no active editor
 */
export function getCursorPosition(): vscode.Position | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return null;
    }
    return editor.selection.active;
}

/**
 * Gets the content before the cursor
 * @returns The content before the cursor or null if no active editor
 */
export function getContentBeforeCursor(): string | null {
    const editor = vscode.window.activeTextEditor;
    const position = getCursorPosition();
    if (!editor || !position) {
        return null;
    }
    return editor.document.getText(new vscode.Range(new vscode.Position(0, 0), position));
}

/**
 * Gets the current line content
 * @returns The current line content or null if no active editor
 */
export function getCurrentLine(): string | null {
    const editor = vscode.window.activeTextEditor;
    const position = getCursorPosition();
    if (!editor || !position) {
        return null;
    }
    const line = editor.document.lineAt(position.line);
    return line.text;
}

/**
 * Gets the current language ID
 * @returns The language ID or null if no active editor
 */
export function getCurrentLanguageId(): string | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return null;
    }
    return editor.document.languageId;
}

/**
 * Gets the current file path
 * @returns The file path or null if no active editor
 */
export function getCurrentFilePath(): string | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return null;
    }
    return editor.document.uri.fsPath;
}

/**
 * Gets the current file name
 * @returns The file name or null if no active editor
 */
export function getCurrentFileName(): string | null {
    const filePath = getCurrentFilePath();
    if (!filePath) {
        return null;
    }
    return path.basename(filePath);
}

/**
 * Gets the indentation of the current line
 * @returns The indentation string
 */
export function getIndentation(): string {
    const editor = vscode.window.activeTextEditor;
    const line = getCurrentLine();
    if (!editor || !line) {
        return '';
    }
    const match = line.match(/^(\s*)/);
    return match ? match[1] : '';
}

/**
 * Sleeps for the given milliseconds
 * @param ms Milliseconds to sleep
 */
export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Shows an error message and logs it
 * @param message The error message
 * @param error Optional error object
 */
export function showErrorMessage(message: string, error?: Error): void {
    logger.error(message, error);
    vscode.window.showErrorMessage(`${message}${error ? `: ${error.message}` : ''}`);
}

/**
 * Shows an information message and logs it
 * @param message The information message
 */
export function showInfoMessage(message: string): void {
    logger.info(message);
    vscode.window.showInformationMessage(message);
}