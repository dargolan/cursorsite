import React from 'react';
import '../styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '../components/Header';

// Load Inter font
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Music Library - Dar Golan',
  description: 'High-quality royalty-free music for your creative projects',
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" />
      </head>
      <body style={{ backgroundColor: '#1E1E1E' }} className="min-h-screen flex flex-col">
        <Header cartTotal={0} />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
} 