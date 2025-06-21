import React from 'react';
import Sidebar from './Sidebar';
import Content from './Content';
import ScriptRunner from './ScriptRunner';
import Terminal from './Terminal/Terminal';
import { View, Tool, TerminalSession } from '../renderer';
import './Layout.css';

interface LayoutProps {
  view: View;
  setView: (view: View) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  tools: Tool[];
  updateTool: (toolName: string, updates: Partial<Tool>) => void;
  terminalSessions: TerminalSession[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  createNewTab: (title: string, command: string, args: string[], options?: { cwd?: string, password?: string }) => void;
  closeTab: (sessionId: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  view, setView, selectedCategory, setSelectedCategory, tools, updateTool,
  terminalSessions, activeSessionId, setActiveSessionId, createNewTab, closeTab
}) => {
  const renderContent = () => {
    switch (view) {
      case 'installer':
        return <Content 
          selectedCategory={selectedCategory} 
          tools={tools}
          updateTool={updateTool}
          createNewTab={createNewTab}
        />;
      case 'runner':
        return <ScriptRunner />;
      case 'terminal':
        return <Terminal 
          sessions={terminalSessions}
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          closeTab={closeTab}
        />;
      default:
        return <Content 
          selectedCategory={selectedCategory} 
          tools={tools}
          updateTool={updateTool}
          createNewTab={createNewTab}
        />;
    }
  };

  return (
    <div className="layout">
      <Sidebar 
        setView={setView} 
        view={view} 
        selectedCategory={selectedCategory} 
        setSelectedCategory={setSelectedCategory} 
      />
      {renderContent()}
    </div>
  );
};

export default Layout; 