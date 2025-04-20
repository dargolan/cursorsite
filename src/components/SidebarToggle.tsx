'use client';

import React from 'react';
import { useSidebar } from '../contexts/SidebarContext';

export default function SidebarToggle() {
  const { isCollapsed, toggleCollapse } = useSidebar();
  
  const handleToggle = () => {
    console.log('SidebarToggle button clicked');
    toggleCollapse();
  };
  
  return (
    <button 
      onClick={handleToggle}
      className="fixed top-4 z-50 bg-[#282828] rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#333] transition-colors shadow-lg"
      style={{ 
        left: isCollapsed ? '80px' : '295px',
        transform: 'translateX(-50%)',
        transition: 'left 0.3s ease'
      }}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      <span 
        className={`material-symbols-outlined text-[#1DF7CE] transition-transform duration-300 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`}
        style={{ fontSize: '20px' }}
      >
        dock_to_right
      </span>
    </button>
  );
} 