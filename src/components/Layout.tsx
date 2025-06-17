import React from 'react';
import Sidebar from './Sidebar';
import Content from './Content';
import ScriptRunner from './ScriptRunner';
import { View, Tool } from '../renderer';
import './Layout.css';

interface LayoutProps {
  view: View;
  setView: (view: View) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  tools: Tool[];
  updateTool: (toolName: string, updates: Partial<Tool>) => void;
}

const Layout: React.FC<LayoutProps> = ({ view, setView, selectedCategory, setSelectedCategory, tools, updateTool }) => {
  return (
    <div className="layout">
      <Sidebar 
        setView={setView} 
        view={view} 
        selectedCategory={selectedCategory} 
        setSelectedCategory={setSelectedCategory} 
      />
      {view === 'installer' ? (
        <Content 
          selectedCategory={selectedCategory} 
          tools={tools}
          updateTool={updateTool}
        />
      ) : (
        <ScriptRunner />
      )}
    </div>
  );
};

export default Layout; 