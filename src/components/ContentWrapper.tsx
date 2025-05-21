'use client';

import React from 'react';

interface ContentWrapperProps {
  children: React.ReactNode;
}

export default function ContentWrapper({ children }: ContentWrapperProps) {
  return (
    <div 
      className="transition-all duration-300 w-full overflow-hidden"
      style={{ 
        marginLeft: '295px',
        width: 'calc(100% - 295px)',
        paddingTop: '0px'
      }}
    >
      {children}
    </div>
  );
} 