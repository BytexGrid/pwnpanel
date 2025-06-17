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
};

contextBridge.exposeInMainWorld('api', api);
