'use client';

import React from 'react';
import { useSidebar } from '../contexts/SidebarContext';

export default function SidebarToggle() {
  const { isCollapsed, toggleCollapse } = useSidebar();
  
  const handleToggle = () => {
    console.log('SidebarToggle button clicked');
    toggleCollapse();
  };
  
  // The icon is now rendered directly in the sidebar, so this component
  // only shows the toggle button when the sidebar is collapsed
  if (isCollapsed) {
    return (
      <button 
        onClick={handleToggle}
        className="fixed top-[105px] z-50 bg-[#282828] rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#333] transition-colors shadow-lg"
        style={{ 
          left: '40px',
          transform: 'translateX(-50%)',
          transition: 'left 0.3s ease'
        }}
        aria-label="Expand sidebar"
      >
        <span 
          className="material-symbols-outlined text-[#1DF7CE] rotate-180"
          style={{ fontSize: '20px' }}
        >
          dock_to_right
        </span>
      </button>
    );
  }
  
  // No floating toggle when the sidebar is expanded - it's rendered in the sidebar itself
  return null;
} 