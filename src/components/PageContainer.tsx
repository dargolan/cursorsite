'use client';

import React, { ReactNode } from 'react';
import Header from './Header';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      <Header />
      <main className="flex-grow">{children}</main>
    </div>
  );
} 