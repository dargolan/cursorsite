'use client';

import React, { useState } from 'react';
import { CartItem } from '../types';

interface NavBarProps {
  cartItems: CartItem[];
  removeFromCart: (id: string) => void;
}

export default function NavBar({ cartItems, removeFromCart }: NavBarProps) {
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  
  const toggleCartDropdown = () => {
    setShowCartDropdown(!showCartDropdown);
  };

  const toggleSearchBar = () => {
    setShowSearchBar(!showSearchBar);
  };
  
  // Calculate cart total
  const cartTotal = cartItems.reduce((total, item) => total + item.price, 0);
  
  return (
    <nav className="bg-[#232323] p-4 flex justify-between items-center z-50">
      <div className="flex items-center space-x-8">
        <div className="text-white font-bold text-xl">CURSOR BEATS</div>
        
        <div className="hidden md:flex space-x-6">
          <a href="#" className="text-white hover:text-[#1DF7CE] font-normal text-xs transition-colors">Home</a>
          <a href="#" className="text-white hover:text-[#1DF7CE] font-normal text-xs transition-colors">Browse</a>
          <a href="#" className="text-white hover:text-[#1DF7CE] font-normal text-xs transition-colors">Featured</a>
          <a href="#" className="text-white hover:text-[#1DF7CE] font-normal text-xs transition-colors">Tutorials</a>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button 
          onClick={toggleSearchBar}
          className="text-white hover:text-[#1DF7CE] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        
        <div className="relative">
          <button 
            onClick={toggleCartDropdown}
            className="flex items-center space-x-1 text-white hover:text-[#1DF7CE] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartTotal > 0 && (
              <span className="text-[#1DF7CE] font-normal text-xs">${cartTotal.toFixed(2)}</span>
            )}
          </button>
          
          {showCartDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-[#1E1E1E] rounded shadow-lg p-4">
              <h3 className="text-white font-bold text-sm mb-3">Your Cart</h3>
              
              {cartItems.length === 0 ? (
                <p className="text-[#CDCDCD] font-normal text-xs">Your cart is empty</p>
              ) : (
                <>
                  <div className="max-h-48 overflow-y-auto">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center mb-2 p-2 hover:bg-[#232323] rounded">
                        <div>
                          <p className="text-white font-normal text-xs">{item.type === 'track' ? 'Track' : 'Stem'}</p>
                          <p className="text-[#CDCDCD] font-normal text-xs">${item.price.toFixed(2)}</p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-[#CDCDCD] hover:text-white transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-[#3C3C3C] mt-3 pt-3 flex justify-between items-center">
                    <p className="text-white font-normal text-xs">Total:</p>
                    <p className="text-[#1DF7CE] font-normal text-xs">${cartTotal.toFixed(2)}</p>
                  </div>
                  
                  <button className="w-full bg-[#1DF7CE] hover:bg-[#19d9b6] text-[#1E1E1E] font-normal text-xs py-2 rounded mt-3 transition-colors">
                    Checkout
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Search bar that appears when toggled */}
      {showSearchBar && (
        <div className="absolute top-16 left-0 right-0 bg-[#1E1E1E] p-4 shadow-lg">
          <div className="max-w-3xl mx-auto relative">
            <input
              type="text"
              placeholder="Search for tracks..."
              className="w-full bg-[#232323] text-white border border-[#3C3C3C] rounded py-2 px-4 pl-10 focus:outline-none focus:border-[#1DF7CE]"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-[#CDCDCD] absolute top-2.5 left-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      )}
    </nav>
  );
} 