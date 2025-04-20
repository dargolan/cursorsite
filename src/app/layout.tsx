import '../styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { CartProvider } from '@/contexts/CartContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import SidebarToggle from '@/components/SidebarToggle';
import SidebarOverlay from '@/components/SidebarOverlay';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Music Library',
  description: 'Browse and purchase high-quality music stems',
  icons: {
    icon: '/logo.svg',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#121212]">
        <CartProvider>
          <SidebarProvider>
            <SidebarToggle />
            <SidebarOverlay />
            <main className="min-h-screen">
              {children}
            </main>
          </SidebarProvider>
        </CartProvider>
      </body>
    </html>
  );
} 