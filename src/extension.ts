// Pain Language VS Code Extension

import './shims/punycode';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;
let isFormatting = false; // Prevent concurrent formatting calls
let lspCrashCount = 0; // Track LSP crashes
let lspDisabled = false; // Disable LSP after too many crashes

export function activate(context: vscode.ExtensionContext) {
    try {
        // Get workspace folders (may be undefined if no workspace is open)
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        // Get LSP server path from configuration or use default
        // getConfiguration can be called without workspace, it returns default values
        let lspPath = '';
        try {
            const config = vscode.workspace.getConfiguration('pain');
            lspPath = config.get<string>('lsp.path', '') || '';
        } catch (error) {
            // If configuration fails, use default empty string
            console.warn('Failed to get configuration, using defaults:', error);
        }
        
        // If not configured, try to find pain-lsp in workspace or PATH
        if (!lspPath) {
            // Try relative path from workspace root (only if workspace is open)
            if (workspaceFolders && workspaceFolders.length > 0) {
                const workspaceRoot = workspaceFolders[0].uri.fsPath;
                // Try target/debug/pain-lsp (development)
                const devPath = path.join(workspaceRoot, 'target', 'debug', 'pain-lsp');
                const devPathExe = devPath + (process.platform === 'win32' ? '.exe' : '');
                if (fs.existsSync(devPathExe)) {
                    lspPath = devPathExe;
                } else if (fs.existsSync(devPath)) {
                    lspPath = devPath;
                } else {
                    // Try target/release/pain-lsp (release)
                    const releasePath = path.join(workspaceRoot, 'target', 'release', 'pain-lsp');
                    const releasePathExe = releasePath + (process.platform === 'win32' ? '.exe' : '');
                    if (fs.existsSync(releasePathExe)) {
                        lspPath = releasePathExe;
                    } else if (fs.existsSync(releasePath)) {
                        lspPath = releasePath;
                    }
                }
            }
        }

        // Register format document command (always available, even without LSP)
        const formatCommand = vscode.commands.registerCommand('pain.formatDocument', async () => {
            // Prevent concurrent formatting calls
            if (isFormatting) {
                return;
            }

            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'pain') {
                return;
            }

            const document = editor.document;
            const text = document.getText();
            
            // Find pain executable
            let compilerPath = '';
            if (workspaceFolders && workspaceFolders.length > 0) {
                const workspaceRoot = workspaceFolders[0].uri.fsPath;
                const devPath = path.join(workspaceRoot, 'target', 'debug', 'pain');
                const devPathExe = devPath + (process.platform === 'win32' ? '.exe' : '');
                if (fs.existsSync(devPathExe)) {
                    compilerPath = devPathExe;
                } else {
                    const releasePath = path.join(workspaceRoot, 'target', 'release', 'pain');
                    const releasePathExe = releasePath + (process.platform === 'win32' ? '.exe' : '');
                    if (fs.existsSync(releasePathExe)) {
                        compilerPath = releasePathExe;
                    } else {
                        compilerPath = 'pain';
                    }
                }
            } else {
                compilerPath = 'pain';
            }

            // Create temporary file for formatting
            const tempFile = path.join(path.dirname(document.uri.fsPath), '.pain_format_temp.pain');
            isFormatting = true;
            
            try {
                fs.writeFileSync(tempFile, text);
                
                // Run formatter using spawn for better Windows compatibility
                const args = ['format', '--input', tempFile, '--stdout'];
                const formatter = spawn(compilerPath, args, {
                    shell: false,
                    cwd: workspaceFolders && workspaceFolders.length > 0 
                        ? workspaceFolders[0].uri.fsPath 
                        : undefined
                });
                
                let stdout = '';
                let stderr = '';
                let timeoutId: NodeJS.Timeout | null = null;
                
                // Set timeout for formatting (5 seconds)
                timeoutId = setTimeout(() => {
                    if (!formatter.killed) {
                        formatter.kill();
                        isFormatting = false;
                        vscode.window.showErrorMessage('Formatting timed out after 5 seconds');
                        // Clean up temp file
                        if (fs.existsSync(tempFile)) {
                            fs.unlinkSync(tempFile);
                        }
                    }
                }, 5000);
                
                formatter.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                
                formatter.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
                
                formatter.on('error', (error: any) => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    isFormatting = false;
                    vscode.window.showErrorMessage(`Formatting failed: ${error.message}`);
                    // Clean up temp file on error
                    if (fs.existsSync(tempFile)) {
                        fs.unlinkSync(tempFile);
                    }
                });
                
                formatter.on('close', (code) => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    isFormatting = false;
                    
                    // Clean up temp file
                    if (fs.existsSync(tempFile)) {
                        fs.unlinkSync(tempFile);
                    }
                    
                    if (code !== 0) {
                        vscode.window.showErrorMessage(`Formatting failed: Command exited with code ${code}${stderr ? `\n${stderr}` : ''}`);
                        return;
                    }
                    
                    if (stderr) {
                        console.warn('Formatting warning:', stderr);
                    }
                    
                    // Apply formatted text
                    const edit = new vscode.WorkspaceEdit();
                    const fullRange = new vscode.Range(
                        document.positionAt(0),
                        document.positionAt(text.length)
                    );
                    edit.replace(document.uri, fullRange, stdout);
                    vscode.workspace.applyEdit(edit);
                });
            } catch (error: any) {
                isFormatting = false;
                vscode.window.showErrorMessage(`Formatting failed: ${error.message}`);
                // Clean up temp file on error
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
            }
        });

        context.subscriptions.push(formatCommand);

        // Register format on save
        const formatOnSave = vscode.workspace.onDidSaveTextDocument(async (document) => {
            if (document.languageId !== 'pain') {
                return;
            }

            const config = vscode.workspace.getConfiguration('pain');
            const formatOnSaveEnabled = config.get<boolean>('format.enable', false);

            if (!formatOnSaveEnabled) {
                return;
            }

            // Format the document
            try {
                await vscode.commands.executeCommand('pain.formatDocument');
            } catch (error) {
                // Silently fail - formatting errors are already shown by format command
                console.error('Format on save failed:', error);
            }
        });

        context.subscriptions.push(formatOnSave);

        // Register document formatting provider (can be registered before client starts)
        const formattingProvider = vscode.languages.registerDocumentFormattingEditProvider('pain', {
            async provideDocumentFormattingEdits(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
                // Don't use formatDocument command here to avoid double calls
                // Return empty array - formatting is handled by the command
                return [];
            }
        });
        context.subscriptions.push(formattingProvider);

        // Function to start LSP with crash protection
        const startLSP = () => {
            if (lspDisabled) {
                console.warn('LSP disabled due to repeated crashes');
                return;
            }

            if (!lspPath || (!fs.existsSync(lspPath) && !path.isAbsolute(lspPath))) {
                console.warn('Pain LSP server not found. LSP features will be disabled. Configure pain.lsp.path in settings.');
                return;
            }

            try {
                // Server options - run LSP server
                const serverOptions: ServerOptions = {
                    run: { command: lspPath, transport: TransportKind.stdio },
                    debug: { command: lspPath, transport: TransportKind.stdio }
                };

                // Get trace configuration
                const config = vscode.workspace.getConfiguration('pain');
                const trace = config.get<string>('lsp.trace', 'off') as 'off' | 'messages' | 'verbose';

                // Client options
                const clientOptions: LanguageClientOptions = {
                    documentSelector: [{ scheme: 'file', language: 'pain' }],
                    synchronize: {
                        fileEvents: workspaceFolders && workspaceFolders.length > 0
                            ? vscode.workspace.createFileSystemWatcher('**/*.pain')
                            : undefined
                    },
                    traceOutputChannel: trace !== 'off' ? vscode.window.createOutputChannel('Pain Language Server') : undefined,
                    outputChannel: vscode.window.createOutputChannel('Pain Language Server'),
                    // Increase timeout and reduce aggressive reconnection
                    initializationFailedHandler: (error) => {
                        lspCrashCount++;
                        console.error(`LSP initialization failed (crash ${lspCrashCount}):`, error);
                        
                        if (lspCrashCount >= 3) {
                            lspDisabled = true;
                            vscode.window.showErrorMessage(
                                'Pain LSP crashed too many times and has been disabled. Restart VS Code to re-enable.',
                                'Restart'
                            ).then(choice => {
                                if (choice === 'Restart') {
                                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                                }
                            });
                            return false; // Don't retry
                        }
                        return false; // Don't auto-retry, we'll handle it manually
                    }
                };

                client = new LanguageClient(
                    'painLanguageServer',
                    'Pain Language Server',
                    serverOptions,
                    clientOptions
                );

                // Monitor client crashes
                client.onDidChangeState((event) => {
                    if (event.newState === 3) { // State.Stopped
                        lspCrashCount++;
                        console.warn(`LSP stopped unexpectedly (crash ${lspCrashCount})`);
                        
                        // Disable after first crash to prevent infinite loop
                        if (lspCrashCount >= 1) {
                            lspDisabled = true;
                            vscode.window.showErrorMessage(
                                'Pain LSP crashed and has been disabled to prevent infinite restart loop. Check the Output panel for errors.',
                                'Show Output'
                            ).then(choice => {
                                if (choice === 'Show Output') {
                                    vscode.commands.executeCommand('workbench.action.output.toggleOutput');
                                }
                            });
                            return;
                        }
                    }
                });

                // Start the client with timeout
                const startPromise = client.start();
                const timeoutPromise = new Promise<void>((_, reject) => {
                    setTimeout(() => reject(new Error('LSP start timeout after 5 seconds')), 5000);
                });

                Promise.race([startPromise, timeoutPromise])
                    .then(() => {
                        console.log('Pain Language Server is ready');
                        lspCrashCount = 0; // Reset counter on successful start
                    })
                    .catch((error) => {
                        console.error('Failed to start Pain Language Server:', error);
                        lspCrashCount++;
                        lspDisabled = true;
                        
                        vscode.window.showErrorMessage(
                            'Pain LSP failed to start and has been disabled. Check the Output panel for errors.',
                            'Show Output'
                        ).then(choice => {
                            if (choice === 'Show Output') {
                                vscode.commands.executeCommand('workbench.action.output.toggleOutput');
                            }
                        });
                        
                        // Clean up failed client
                        if (client) {
                            client.stop().catch(() => {});
                            client = undefined;
                        }
                    });
            } catch (error) {
                console.error('Failed to create Language Client:', error);
                lspCrashCount++;
                lspDisabled = true;
                vscode.window.showErrorMessage('Pain LSP failed to initialize and has been disabled.');
            }
        };

        // Start LSP
        startLSP();
    } catch (error) {
        console.error('Error activating Pain extension:', error);
        vscode.window.showErrorMessage(`Error activating Pain extension: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

