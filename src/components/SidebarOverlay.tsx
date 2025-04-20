'use client';

import React from 'react';
import { useSidebar } from '../contexts/SidebarContext';

export default function SidebarOverlay() {
  const { isCollapsed, toggleCollapse } = useSidebar();
  
  if (isCollapsed) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-5 transition-opacity duration-300 md:hidden"
      style={{ opacity: isCollapsed ? 0 : 1 }}
      onClick={toggleCollapse}
      aria-hidden="true"
    />
  );
} 