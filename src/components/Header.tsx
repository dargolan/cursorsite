'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  cartTotal?: number;
}

export default function Header({ cartTotal = 0 }: HeaderProps): React.ReactElement {
  const [isSticky, setIsSticky] = useState(false);

  // Make header sticky on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Format the cart total to show two decimal places
  const formattedCartTotal = cartTotal.toFixed(2);

  return (
    <header 
      className={`bg-black ${
        isSticky ? 'sticky top-0 z-50 shadow-md' : ''
      } transition-all duration-200`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center font-bold text-white">
            <div className="w-10 h-10 mr-2">
              <Image 
                src="/logo.svg" 
                alt="Dar Golan" 
                width={40} 
                height={40}
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40' fill='none'%3E%3Crect width='40' height='40' rx='4' fill='%23252525'/%3E%3Cpath d='M12 14c0-1.657 1.343-3 3-3s3 1.343 3 3v8c0 1.657-1.343 3-3 3s-3-1.343-3-3v-8z' fill='white'/%3E%3Cpath d='M22 19c0-1.657 1.343-3 3-3s3 1.343 3 3v3c0 1.657-1.343 3-3 3s-3-1.343-3-3v-3z' fill='white'/%3E%3C/svg%3E";
                }}
              />
            </div>
            <span className="text-xl">Dar Golan</span>
          </Link>
          
          {/* Main navigation */}
          <nav className="hidden md:block ml-16">
            <ul className="flex space-x-8">
              <li>
                <Link 
                  href="/" 
                  className="text-[#1DF7CE] border-b-2 border-[#1DF7CE] pb-1 font-medium"
                >
                  Music
                </Link>
              </li>
              <li>
                <Link 
                  href="/sound-effects" 
                  className="text-white hover:text-[#1DF7CE] transition-colors font-medium"
                >
                  Sound Effects
                </Link>
              </li>
              <li>
                <Link 
                  href="/video" 
                  className="text-white hover:text-[#1DF7CE] transition-colors font-medium"
                >
                  Video
                </Link>
              </li>
              <li>
                <Link 
                  href="/about" 
                  className="text-white hover:text-[#1DF7CE] transition-colors font-medium"
                >
                  About
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-white hover:text-[#1DF7CE] transition-colors font-medium"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
          
          {/* Right side navigation and cart */}
          <div className="flex items-center space-x-6">
            <Link 
              href="/signin" 
              className="text-white hover:text-[#1DF7CE] transition-colors font-medium hidden md:block"
            >
              Sign In
            </Link>
            
            <Link 
              href="/cart" 
              className="flex items-center group"
            >
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white group-hover:text-[#1DF7CE] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {cartTotal > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#1DF7CE] text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {Math.min(cartTotal, 9)}
                  </span>
                )}
              </div>
              <span id="header-cart-total" className="ml-2 text-[#1DF7CE] font-medium">{formattedCartTotal}€</span>
            </Link>
            
            {/* Mobile menu button */}
            <button className="md:hidden text-white hover:text-[#1DF7CE] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 