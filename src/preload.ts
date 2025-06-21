// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

export const api = {
  runCommand: (command: string, args: string[], cwd?: string) => ipcRenderer.invoke('run-command', command, args, cwd),
  getScripts: () => ipcRenderer.invoke('get-scripts'),
  onScriptOutput: (callback: (output: string) => void) => {
    ipcRenderer.on('script-output', (event, output) => {
      callback(output);
    });
  },
  openTerminal: (path: string) => ipcRenderer.invoke('open-terminal', path),
  getToolDocs: (scriptPath: string) => ipcRenderer.invoke('get-tool-docs', scriptPath),
  checkToolsInstalled: (tools: any[]) => ipcRenderer.invoke('check-tools-installed', tools),
  logMessage: (message: string) => {
    ipcRenderer.send('log-message', message);
  },
  runScript: (command: string, script: string, args: string[], onData: (data: string) => void) => {
    ipcRenderer.send('run-script', { command, script, args });
    const listener = (event: Electron.IpcRendererEvent, data: string) => onData(data);
    ipcRenderer.on('script-output', listener);
    return () => ipcRenderer.removeListener('script-output', listener);
  },
  openToolTerminal: (toolName: string) => {
    ipcRenderer.send('open-tool-terminal', toolName);
  },
  openToolFolder: (toolName: string) => {
    ipcRenderer.send('open-tool-folder', toolName);
  },
  terminal: {
    create: (command: string, args: string[], options?: { cwd?: string, password?: string }): Promise<string> => ipcRenderer.invoke('terminal:create', command, args, options),
    onData: (callback: (event: { sessionId: string, data: string }) => void) => {
      const listener = (event: Electron.IpcRendererEvent, data: { sessionId: string, data: string }) => callback(data);
      ipcRenderer.on('terminal:data', listener);
      return () => ipcRenderer.removeListener('terminal:data', listener);
    },
    onExit: (callback: (event: { sessionId: string, code?: number, error?: string }) => void) => {
      const listener = (event: Electron.IpcRendererEvent, data: { sessionId: string, code?: number, error?: string }) => callback(data);
      ipcRenderer.on('terminal:exit', listener);
      return () => ipcRenderer.removeListener('terminal:exit', listener);
    },
    kill: (sessionId: string) => ipcRenderer.send('terminal:kill', sessionId),
  },
};

contextBridge.exposeInMainWorld('api', api);
