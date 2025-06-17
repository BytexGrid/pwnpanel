import React, { useState } from 'react';
import './ToolCard.css';
import { Tool } from '../renderer';

interface ToolCardProps {
  tool: Tool;
  updateTool: (toolName: string, updates: Partial<Tool>) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, updateTool }) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  const handleInstall = async () => {
    setIsInstalling(true);
    setError(null);
    window.api.logMessage(`[INSTALL_START] Starting installation for ${tool.name}`);
    const [command, ...args] = tool.installMethod.split(' ');
    try {
      const result = await window.api.runCommand(command, args, 'tools');
      if (result.success) {
        window.api.logMessage(`[INSTALL_SUCCESS] Successfully installed ${tool.name}`);
        updateTool(tool.name, { installed: true });
      } else {
        window.api.logMessage(`[INSTALL_FAIL] Failed to install ${tool.name}. Error: ${result.error}`);
        setError(result.error);
      }
    } catch (e) {
      window.api.logMessage(`[INSTALL_FAIL] An unexpected error occurred during installation of ${tool.name}. Error: ${e.message}`);
      setError(e.message);
    } finally {
      setIsInstalling(false);
    }
  };
  
  const handleRun = () => {
    const repoName = tool.installMethod.split('/').pop()?.replace('.git', '');
    if (repoName) {
      window.api.openToolTerminal(repoName);
    }
  };

  const handleOpenFolder = () => {
    const repoName = tool.installMethod.split('/').pop()?.replace('.git', '');
    if (repoName) {
      window.api.openToolFolder(repoName);
    }
  };

  return (
    <div className="tool-card">
      <h3>{tool.name}</h3>
      <p>Status: {tool.installed ? 'Installed' : 'Not Installed'}</p>
      <p>Install Method: <code>{tool.installMethod}</code></p>
      <div className="tool-card-actions">
        {tool.installed ? (
          <div className="tool-card-buttons">
            <button onClick={handleRun} className="run-button">Run</button>
            <button onClick={handleOpenFolder} className="open-folder-button">Open Folder</button>
          </div>
        ) : (
          <button onClick={handleInstall} className="install" disabled={isInstalling}>
            {isInstalling ? 'Installing...' : 'Install'}
          </button>
        )}
      </div>
      {error && <p style={{color: 'red'}}>{error}</p>}
    </div>
  );
};

export default ToolCard; 