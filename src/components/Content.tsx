import React, { useState } from 'react';
import ToolCard from './ToolCard';
import './Content.css';
import { Tool } from '../renderer';

interface ContentProps {
  selectedCategory: string;
  tools: Tool[];
  updateTool: (toolName: string, updates: Partial<Tool>) => void;
}

const Content: React.FC<ContentProps> = ({ selectedCategory, tools, updateTool }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTools = tools
    .filter(tool => selectedCategory === 'All' || tool.category === selectedCategory)
    .filter(tool => tool.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="content">
      <div className="content-header">
        <input 
          type="text" 
          placeholder="Search for tools..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="tool-grid">
        {filteredTools.map(tool => (
          <ToolCard key={tool.name} tool={tool} updateTool={updateTool} />
        ))}
      </div>
    </div>
  );
};

export default Content; 