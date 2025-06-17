import React, { useState } from 'react';
import { View } from '../renderer';
import './Sidebar.css';

const categories = ['All', 'Web', 'Spoofing', 'Sniffing', 'Scanning'];

interface SidebarProps {
  setView: (view: View) => void;
  view: View;
  setSelectedCategory: (category: string) => void;
  selectedCategory: string;
}

const Sidebar: React.FC<SidebarProps> = ({ setView, view, setSelectedCategory, selectedCategory }) => {
  return (
    <div className="sidebar">
      <div className="views">
        <h2>Views</h2>
        <button onClick={() => setView('installer')} className={view === 'installer' ? 'active' : ''}>Tool Installer</button>
        <button onClick={() => setView('runner')} className={view === 'runner' ? 'active' : ''}>Script Runner</button>
      </div>
      <div className="categories">
        <h2>Categories</h2>
        <ul>
          {categories.map(category => (
            <li 
              key={category} 
              className={selectedCategory === category ? 'active' : ''}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar; 