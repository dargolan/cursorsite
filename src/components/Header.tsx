'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CartItem } from '../types';

interface HeaderProps {
  cartTotal: number;
  cartItems: CartItem[];
  onRemoveFromCart: (id: string) => void;
}

export default function Header({ cartTotal = 0, cartItems = [], onRemoveFromCart }: HeaderProps): React.ReactElement {
  const [isSticky, setIsSticky] = useState(false);
  const [showCart, setShowCart] = useState(false);

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

  // Close cart dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const cartDropdown = document.getElementById('cart-dropdown');
      const cartButton = document.getElementById('cart-button');
      if (
        cartDropdown && 
        cartButton && 
        !cartDropdown.contains(event.target as Node) && 
        !cartButton.contains(event.target as Node)
      ) {
        setShowCart(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
      <div className="w-full relative px-0">
        <div className="flex h-16 relative">
          {/* Left sidebar area - contains logo */}
          <div className="w-[210px] flex items-center justify-center">
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
          </div>
          
          {/* Main navigation - positioned absolutely */}
          <nav className="hidden md:block absolute left-[260px] top-1/2 transform -translate-y-1/2">
            <ul className="flex space-x-8">
              <li>
                <Link 
                  href="/" 
                  className="text-[#1DF7CE] font-normal"
                >
                  Music
                </Link>
              </li>
              <li>
                <Link 
                  href="/sound-effects" 
                  className="text-[#CDCDCD] hover:text-[#1DF7CE] transition-colors font-normal"
                >
                  Sound Effects
                </Link>
              </li>
              <li>
                <Link 
                  href="/video" 
                  className="text-[#CDCDCD] hover:text-[#1DF7CE] transition-colors font-normal"
                >
                  Video
                </Link>
              </li>
              <li>
                <Link 
                  href="/about" 
                  className="text-[#CDCDCD] hover:text-[#1DF7CE] transition-colors font-normal"
                >
                  About
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact"
                  className="text-[#CDCDCD] hover:text-[#1DF7CE] transition-colors font-normal"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
          
          {/* Right side content area - sign in and cart */}
          <div className="flex items-center space-x-6 absolute right-[60px] top-1/2 transform -translate-y-1/2">
            <Link 
              href="/signin"
              className="text-[#CDCDCD] hover:text-[#1DF7CE] transition-colors font-normal hidden md:block" 
            >
              Sign In
            </Link>
            
            <div className="relative">
              <button
                id="cart-button"
                onClick={() => setShowCart(!showCart)}
                className="flex items-center group"
              >
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white group-hover:text-[#1DF7CE] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  {cartItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#1DF7CE] text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {Math.min(cartItems.length, 9)}
                    </span>
                  )}
                </div>
                <span id="header-cart-total" className="ml-2 text-[#1DF7CE] font-medium">{formattedCartTotal}€</span>
              </button>
              
              {/* Cart dropdown */}
              {showCart && (
                <div 
                  id="cart-dropdown"
                  className="absolute right-0 top-10 mt-2 w-96 bg-[#1E1E1E] border border-[#333] shadow-lg rounded-lg z-50"
                >
                  <div className="p-3 border-b border-[#333]">
                    <h3 className="text-white font-medium">Cart ({cartItems.length})</h3>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {cartItems.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">
                        Your cart is empty
                      </div>
                    ) : (
                      cartItems.map(item => (
                        <div key={item.id} className="p-3 border-b border-[#333] flex items-center">
                          <div className="mr-3">
                            {item.imageUrl && (
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                width={40}
                                height={40}
                                className="rounded"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium">{item.name}</p>
                            <p className="text-gray-400 text-xs">{item.trackTitle}</p>
                          </div>
                          <div className="flex items-center">
                            <span className="text-[#1DF7CE] font-medium mr-3">{item.price.toFixed(2)}€</span>
                            <button 
                              onClick={() => onRemoveFromCart(item.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="p-3 border-t border-[#333]">
                    <div className="flex justify-between mb-3">
                      <span className="text-white">Total:</span>
                      <span className="text-[#1DF7CE] font-medium">{formattedCartTotal}€</span>
                    </div>
                    <Link 
                      href="/checkout" 
                      className={`block w-full text-center py-2 rounded ${
                        cartItems.length === 0 
                          ? 'bg-gray-600 cursor-not-allowed' 
                          : 'bg-[#1DF7CE] text-black hover:bg-[#19d4b1] transition-colors'
                      }`}
                      onClick={(e) => {
                        if (cartItems.length === 0) {
                          e.preventDefault();
                        }
                      }}
                    >
                      Checkout
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
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