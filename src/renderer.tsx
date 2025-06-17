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

export type View = 'installer' | 'runner';

export interface Tool {
  name: string;
  installed: boolean;
  installMethod: string;
  category: string;
}

const initialTools: Tool[] = [
  { name: 'Ettercap', installed: false, installMethod: 'git clone https://github.com/Ettercap/ettercap.git', category: 'Spoofing' },
  { name: 'RedHawk', installed: false, installMethod: 'git clone https://github.com/Tuhinshubhra/RED_HAWK.git', category: 'Web' },
  { name: 'RouterSploit', installed: false, installMethod: 'git clone https://github.com/threat9/routersploit.git', category: 'Scanning' },
];

function App() {
  const [view, setView] = useState<View>('installer');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [tools, setTools] = useState<Tool[]>(initialTools);

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

  return <Layout 
    view={view} 
    setView={setView} 
    selectedCategory={selectedCategory}
    setSelectedCategory={setSelectedCategory}
    tools={tools}
    updateTool={updateTool}
  />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
