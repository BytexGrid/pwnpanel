import React, { useState } from 'react';
import './ToolCard.css';
import { Tool } from '../renderer';
import PasswordDialog from './PasswordDialog';

interface ToolCardProps {
  tool: Tool;
  updateTool: (toolName: string, updates: Partial<Tool>) => void;
  createNewTab: (title: string, command: string, args: string[], options?: { cwd?: string, password?: string }) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, updateTool, createNewTab }) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const startInstallation = async (password?: string) => {
    setIsInstalling(true);
    setError(null);
    window.api.logMessage(`[INSTALL_START] Starting installation for ${tool.name}`);
    
    // This logic is now responsible for deciding if a password needs to be sent to the backend.
    const command = 'bash';
    const args = ['-c', tool.installMethod];
    const options = {
      cwd: 'tools',
      password: password, // Pass the password if it exists.
    };

    try {
      await createNewTab(`Install: ${tool.name}`, command, args, options);
    } catch (e) {
      window.api.logMessage(`[INSTALL_FAIL] An unexpected error occurred: ${e.message}`);
      setError(e.message);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleInstallClick = () => {
    // If the command requires sudo, open the password dialog.
    // Otherwise, start the installation immediately without a password.
    if (tool.installMethod.includes('sudo')) {
      setIsPasswordDialogOpen(true);
    } else {
      startInstallation();
    }
  };

  const handlePasswordSubmit = (password: string) => {
    setIsPasswordDialogOpen(false);
    startInstallation(password);
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
    <>
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
            <button onClick={handleInstallClick} className="install" disabled={isInstalling}>
            {isInstalling ? 'Installing...' : 'Install'}
          </button>
        )}
      </div>
      {error && <p style={{color: 'red'}}>{error}</p>}
    </div>
      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        onSubmit={handlePasswordSubmit}
        toolName={tool.name}
      />
    </>
  );
};

export default ToolCard; 