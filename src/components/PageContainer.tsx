'use client';

import React, { ReactNode } from 'react';
// import Header from './Header'; // Header removed

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      {/* <Header /> */}{/* Header removed */}
      <main className="flex-grow">{children}</main>
    </div>
  );
} 