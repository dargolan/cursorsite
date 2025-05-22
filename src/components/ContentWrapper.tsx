'use client';

import React from 'react';

interface ContentWrapperProps {
  children: React.ReactNode;
}

export default function ContentWrapper({ children }: ContentWrapperProps) {
  return (
    <div 
      className="transition-all duration-300 w-full"
      style={{ 
        position: 'relative',
        paddingTop: '0px'
      }}
    >
      {children}
    </div>
  );
} 