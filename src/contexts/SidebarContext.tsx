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
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize the sidebar state based on localStorage and current path
  useEffect(() => {
    if (!isInitialized) {
      const isHomepage = pathname === '/';
      
      try {
        // Get saved state from localStorage if available
        const savedState = typeof window !== 'undefined' ? localStorage.getItem(SIDEBAR_STATE_KEY) : null;
        
        if (savedState !== null) {
          // User has a saved preference, use it
          console.log('Using saved sidebar state:', savedState);
          setIsCollapsed(savedState === 'collapsed');
        } else if (isHomepage) {
          // No saved preference and on homepage - collapse by default
          console.log('On homepage with no saved state - collapsing sidebar');
          setIsCollapsed(true);
        } else {
          // Not on homepage and no saved preference
          console.log('Not on homepage and no saved state - expanding sidebar');
          setIsCollapsed(false);
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
        // Default behavior if localStorage fails
        setIsCollapsed(isHomepage);
      }
      
      setIsInitialized(true);
    }
  }, [pathname, isInitialized]);

  // Save sidebar state to localStorage whenever it changes after initialization
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(SIDEBAR_STATE_KEY, isCollapsed ? 'collapsed' : 'expanded');
        console.log('Saved sidebar state:', isCollapsed ? 'collapsed' : 'expanded');
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }, [isCollapsed, isInitialized]);
  
  // Debug logging
  useEffect(() => {
    console.log('Current sidebar state:', isCollapsed ? 'collapsed' : 'expanded', 'Path:', pathname);
  }, [isCollapsed, pathname]);

  const toggleCollapse = () => {
    console.log('Toggle collapse clicked, current state:', isCollapsed);
    setIsCollapsed(prevState => !prevState);
  };
  
  const setCollapsed = (value: boolean) => {
    console.log('Setting sidebar collapsed state to:', value);
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