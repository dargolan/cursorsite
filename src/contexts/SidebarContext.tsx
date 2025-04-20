'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface SidebarContextProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Add debug logging
  useEffect(() => {
    console.log('Sidebar state changed:', isCollapsed ? 'collapsed' : 'expanded');
  }, [isCollapsed]);

  const toggleCollapse = () => {
    console.log('Toggle collapse clicked, current state:', isCollapsed);
    setIsCollapsed(prevState => {
      const newState = !prevState;
      console.log('Setting new state to:', newState ? 'collapsed' : 'expanded');
      return newState;
    });
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapse }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
} 