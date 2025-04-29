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
  // Default to expanded (false means expanded)
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Check localStorage for saved preference
    const savedIsCollapsed = localStorage.getItem('sidebarCollapsed');
    
    if (savedIsCollapsed !== null) {
      // Use saved preference if available
      setIsCollapsed(savedIsCollapsed === 'true');
    } else {
      // Default to expanded (false) if no preference is saved
      setIsCollapsed(false);
    }
  }, [pathname]);

  // Save preference when changed
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
  }, [isCollapsed]);

  const toggleCollapse = () => {
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