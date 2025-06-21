import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { runCommand } from './utils/process';
import { readdir, readFile, appendFile } from 'fs/promises';
import { existsSync } from 'fs';
import { fork } from 'child_process';
import { homedir } from 'os';
import { spawn } from 'child_process';
import { exec, ChildProcess } from 'child_process';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// This is the core of the multi-terminal backend, as suggested by @hejhdiss.
// It holds references to all active child processes, allowing us to manage them,
// send data to their specific frontend tabs, and kill them when needed.
const runningProcesses: Map<string, ChildProcess> = new Map();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, '..', '..', 'public', 'logo.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

const IGNORED_SCRIPTS = ['__init__.py', 'setup.py', 'install.sh', 'uninstall.sh'];

async function getScripts(dir: string): Promise<string[]> {
  const dirents = await readdir(dir, { withFileTypes: true });
  const toolSubDirs = dirents.filter(d => d.isDirectory()).map(d => path.join(dir, d.name));

  let allScripts: string[] = [];
  for (const subDir of toolSubDirs) {
    const files = await readdir(subDir);
    const scripts = files
      .filter(f => (f.endsWith('.py') || f.endsWith('.sh') || f.endsWith('.rb') || f.endsWith('.php') || f.endsWith('.pl')) && !IGNORED_SCRIPTS.includes(f.toLowerCase()))
      .map(f => path.join(subDir, f));
    allScripts = allScripts.concat(scripts);
  }
  return allScripts;
}

async function findFile(dir: string, baseNames: string[]): Promise<string | null> {
  const dirents = await readdir(dir);
  for (const dirent of dirents) {
    if (baseNames.some(baseName => baseName.toLowerCase() === dirent.toLowerCase())) {
      return readFile(path.join(dir, dirent), 'utf-8');
    }
  }
  return null;
}

ipcMain.handle('run-command', async (event, command: string, args: string[], cwd?: string) => {
  try {
    await runCommand(command, args, {
      cwd,
      onOutput: (data) => {
        event.sender.send('script-output', data);
      }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('terminal:create', (event, command: string, args: string[], options?: { cwd?: string, password?: string }) => {
  const sessionId = uuidv4();
  
  let finalCommand = command;
  let finalArgs = args;

  // This block implements the password handling from the Python PoC.
  // If a password is provided, it constructs a command that pipes the password
  // to `sudo -S`, which tells sudo to read the password from standard input.
  if (options?.password) {
    // Escape single quotes in the password to prevent command injection.
    const sanitizedPassword = options.password.replace(/'/g, "'\\''");
    
    // The command to run is `bash -c "the real command"`. We wrap this entire
    // thing in the `echo | sudo -S` construct.
    const script = `${command} ${args.join(' ')}`;
    
    // We must use `shell: true` for the pipe `|` to be interpreted by a shell.
    // The final command becomes a single string executed by the system's shell.
    finalCommand = `echo '${sanitizedPassword}' | sudo -S bash -c "${script.replace(/"/g, '\\"')}"`;
    finalArgs = []; // args are now part of the command string
  }

  const child = spawn(finalCommand, finalArgs, {
    cwd: options?.cwd,
    shell: true, // `shell: true` is crucial for the pipe `|` to work.
    stdio: 'pipe' 
  });

  runningProcesses.set(sessionId, child);

  child.stdout.on('data', (data) => {
    event.sender.send('terminal:data', { sessionId, data: data.toString() });
  });

  child.stderr.on('data', (data) => {
    // We send stderr data on the same 'data' channel, but could prefix it
    // to be styled differently in the frontend if needed.
    event.sender.send('terminal:data', { sessionId, data: data.toString() });
  });

  child.on('exit', (code) => {
    event.sender.send('terminal:exit', { sessionId, code });
    runningProcesses.delete(sessionId);
  });
  
  child.on('error', (err) => {
    event.sender.send('terminal:exit', { sessionId, error: err.message });
    runningProcesses.delete(sessionId);
  });

  return sessionId;
});

ipcMain.on('terminal:kill', (event, sessionId: string) => {
  const child = runningProcesses.get(sessionId);
  if (child) {
    // Use kill() which sends SIGTERM. This is a more graceful way to stop the process
    // than SIGKILL, allowing it to perform cleanup if it has a handler.
    child.kill(); 
    runningProcesses.delete(sessionId);
  }
});

ipcMain.handle('get-scripts', async () => {
  try {
    const scripts = await getScripts('tools');
    return { success: true, scripts: scripts };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-tools-installed', async (event, tools: {name: string, installMethod: string}[]) => {
  const installedTools = tools.filter(tool => {
    const repoName = tool.installMethod.split('/').pop()?.replace('.git', '');
    if (!repoName) return false;
    const toolPath = path.resolve('tools', repoName);
    return existsSync(toolPath);
  });
  return installedTools.map(tool => tool.name);
});

ipcMain.handle('log-message', (event, message: string) => {
  const logFilePath = path.resolve('pwnpanel.log');
  const timestamp = new Date().toISOString();
  appendFile(logFilePath, `[${timestamp}] ${message}\n`);
});

ipcMain.handle('get-tool-docs', async (event, scriptPath: string) => {
  try {
    const toolDir = path.dirname(scriptPath);
    const readme = await findFile(toolDir, ['README.md', 'README.txt', 'README']);
    const license = await findFile(toolDir, ['LICENSE.md', 'LICENSE.txt', 'LICENSE', 'COPYING']);
    return { success: true, readme, license };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-terminal', (event, toolPath: string) => {
  const fullPath = path.resolve(toolPath);
  shell.openPath(fullPath);
});

// Tools are installed in a 'tools' directory in the project's root.
const toolsDir = path.join(app.getAppPath(), 'tools');
if (!fs.existsSync(toolsDir)) {
  fs.mkdirSync(toolsDir, { recursive: true });
}

// Handle "open-tool-folder"
ipcMain.on('open-tool-folder', (event, repoName) => {
  const toolPath = path.join(toolsDir, repoName);
  shell.openPath(toolPath);
});

// Handle "open-tool-terminal"
ipcMain.on('open-tool-terminal', (event, repoName) => {
  const toolPath = path.join(toolsDir, repoName);

  if (process.platform === 'win32') {
    const comspec = path.join(process.env.windir, 'System32', 'cmd.exe');
    spawn(comspec, ['/c', 'start'], {
      cwd: toolPath,
      detached: true,
      stdio: 'ignore',
    });
  } else {
    // This is a basic fallback for Linux/macOS
    spawn('x-terminal-emulator', [], {
      cwd: toolPath,
      detached: true,
      stdio: 'ignore',
    });
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
