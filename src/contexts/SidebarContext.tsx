'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface SidebarContextProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  setCollapsed: (value: boolean) => void;
}

const SIDEBAR_STATE_KEY = 'sidebar_state';

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Initialize the sidebar state based on localStorage and current path
  useEffect(() => {
    // Check if this is the first render
    if (isFirstVisit) {
      setIsFirstVisit(false);
      
      // Get saved state from localStorage
      const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
      
      if (savedState !== null) {
        // User has a saved preference, use it
        setIsCollapsed(savedState === 'collapsed');
      } else {
        // No saved preference - collapse by default if on homepage
        const isHomepage = pathname === '/';
        setIsCollapsed(isHomepage);
      }
    }
  }, [pathname, isFirstVisit]);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    if (!isFirstVisit) {
      localStorage.setItem(SIDEBAR_STATE_KEY, isCollapsed ? 'collapsed' : 'expanded');
      console.log('Saved sidebar state:', isCollapsed ? 'collapsed' : 'expanded');
    }
  }, [isCollapsed, isFirstVisit]);
  
  // Debug logging
  useEffect(() => {
    console.log('Sidebar state:', isCollapsed ? 'collapsed' : 'expanded');
  }, [isCollapsed]);

  const toggleCollapse = () => {
    console.log('Toggle collapse clicked');
    setIsCollapsed(prevState => !prevState);
  };
  
  const setCollapsed = (value: boolean) => {
    setIsCollapsed(value);
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapse, setCollapsed }}>
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