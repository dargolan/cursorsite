'use client';

import React from 'react';
import { useSidebar } from '../contexts/SidebarContext';

interface ContentWrapperProps {
  children: React.ReactNode;
}

export default function ContentWrapper({ children }: ContentWrapperProps) {
  const { isCollapsed } = useSidebar();
  
  return (
    <div 
      className="transition-all duration-300 w-full overflow-hidden"
      style={{ 
        marginLeft: isCollapsed ? '80px' : '295px',
        width: `calc(100% - ${isCollapsed ? '80px' : '295px'})`,
        paddingTop: '0px'
      }}
    >
      {children}
    </div>
  );
} 