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

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // On initial render, check localStorage for saved preference
    const savedIsCollapsed = localStorage.getItem('sidebarCollapsed');
    
    if (savedIsCollapsed !== null) {
      // Use saved preference if available
      setIsCollapsed(savedIsCollapsed === 'true');
      console.log('Using saved sidebar preference:', savedIsCollapsed === 'true' ? 'collapsed' : 'expanded');
    } else {
      // Default behavior: expanded for homepage, collapsed for other pages
      const shouldBeCollapsed = pathname !== '/' && pathname !== '/explore';
      setIsCollapsed(shouldBeCollapsed);
      console.log('No saved preference. Setting sidebar to:', shouldBeCollapsed ? 'collapsed' : 'expanded');
    }
  }, [pathname]);

  // Save preference when changed
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
  }, [isCollapsed]);

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