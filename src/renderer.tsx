/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import Layout from './components/Layout';

export type View = 'installer' | 'runner' | 'terminal';

export interface Tool {
  name: string;
  installed: boolean;
  installMethod: string;
  category: string;
  description?: string;
  runMethod?: string;
}

// This interface defines the structure for a single terminal tab's state.
export interface TerminalSession {
  sessionId: string;
  title: string;
  output: string;
  exitCode?: number | null;
}

const initialTools: Tool[] = [
  // This is the complex install command your friend @hejhdiss suggested.
  // Note: This requires `sudo` which we haven't implemented a password handler for yet.
  // This command will likely fail until a sudo solution is in place.
  {
    name: 'Ettercap',
    installed: false,
    installMethod: 'sudo apt-get update && sudo apt-get install -y build-essential cmake flex bison libpcap-dev libnet-dev libcurl4-openssl-dev libssl-dev libgtk-3-dev && git clone https://github.com/Ettercap/ettercap.git && cd ettercap && mkdir build && cd build && cmake .. && make && sudo make install',
    category: 'Spoofing',
    description: 'Ettercap is a powerful and flexible network sniffer and man-in-the-middle attack tool.',
    runMethod: 'cd tools/ettercap && sudo ./ettercap -G',
  },
  {
    name: 'RED_HAWK',
    description: 'All in one tool for Information Gathering, Vulnerability Scanning and Crawling.',
    installMethod: `sudo apt-get install -y php php-curl php-xml && git clone https://github.com/Tuhinshubhra/RED_HAWK.git ./tools/RED_HAWK`,
    runMethod: 'cd tools/RED_HAWK && php rhawk.php',
  },
  {
    name: 'RouterSploit',
    description: 'Exploitation Framework for Embedded Devices.',
    installMethod: `sudo apt-get install -y python3-pip && git clone https://github.com/threat9/routersploit.git ./tools/routersploit && cd ./tools/routersploit && python3 -m pip install -r requirements.txt`,
    runMethod: 'cd tools/routersploit && python3 rsf.py',
  },
];

function App() {
  const [view, setView] = useState<View>('installer');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [tools, setTools] = useState<Tool[]>(initialTools);
  
  // The state for the terminal is now managed at the top level of the application.
  const [terminalSessions, setTerminalSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // This effect sets up the global listeners for terminal data and exit events.
  useEffect(() => {
    const removeDataListener = window.api.terminal.onData(({ sessionId, data }) => {
      setTerminalSessions(prev =>
        prev.map(s => (s.sessionId === sessionId ? { ...s, output: s.output + data } : s))
      );
    });

    const removeExitListener = window.api.terminal.onExit(({ sessionId, code }) => {
      setTerminalSessions(prev =>
        prev.map(s => (s.sessionId === sessionId ? { ...s, exitCode: code } : s))
      );
    });

    return () => {
      removeDataListener();
      removeExitListener();
    };
  }, []);

  useEffect(() => {
    const checkInstallStatus = async () => {
      const installedToolNames = await window.api.checkToolsInstalled(initialTools);
      setTools(currentTools => 
        currentTools.map(t => 
          installedToolNames.includes(t.name) ? { ...t, installed: true } : t
        )
      );
    };
    checkInstallStatus();
  }, []);

  const updateTool = (toolName: string, updates: Partial<Tool>) => {
    setTools(currentTools => 
      currentTools.map(t => t.name === toolName ? { ...t, ...updates } : t)
    );
  };

  // This function is passed down to components that need to create new terminal tabs.
  const createNewTab = async (title: string, command: string, args: string[], options?: { cwd?: string, password?: string }) => {
    const sessionId = await window.api.terminal.create(command, args, options);
    const newSession: TerminalSession = {
      sessionId,
      title,
      output: `Session started for command: ${command} ${args.join(' ')}\n\n`,
      exitCode: null,
    };
    setTerminalSessions(prev => [...prev, newSession]);
    setActiveSessionId(sessionId);
    setView('terminal'); // Switch view to the terminal
  };
  
  const closeTab = (sessionId: string) => {
    // Find the index of the tab to be closed from the current state.
    const sessionIndex = terminalSessions.findIndex(s => s.sessionId === sessionId);
    if (sessionIndex === -1) return;

    // Create the new list of sessions by filtering out the closed one.
    const newSessions = terminalSessions.filter(s => s.sessionId !== sessionId);

    // If the closed tab was the active one, we need to determine the new active tab.
    if (activeSessionId === sessionId) {
      let newActiveId: string | null = null;
      if (newSessions.length > 0) {
        // Default to the previous tab, or the first tab if the closed one was the first.
        const newIndex = Math.max(0, sessionIndex - 1);
        newActiveId = newSessions[newIndex]?.sessionId || newSessions[0]?.sessionId;
      }
      setActiveSessionId(newActiveId);
    }

    // Update the sessions list in the state.
    setTerminalSessions(newSessions);

    // Finally, kill the process in the backend.
    window.api.terminal.kill(sessionId);
  };

  return <Layout 
    view={view} 
    setView={setView} 
    selectedCategory={selectedCategory}
    setSelectedCategory={setSelectedCategory}
    tools={tools}
    updateTool={updateTool}
    terminalSessions={terminalSessions}
    activeSessionId={activeSessionId}
    setActiveSessionId={setActiveSessionId}
    createNewTab={createNewTab}
    closeTab={closeTab}
  />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
