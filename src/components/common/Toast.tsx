'use client';

import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
  action?: 'add' | 'remove';
  itemName?: string;
  price?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  duration = 3000,
  onClose,
  action,
  itemName,
  price
}) => {
  // Close toast after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  // Add animation styles to document head if not already added
  useEffect(() => {
    const existingStyle = document.getElementById('toast-animation');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'toast-animation';
      style.textContent = `
        @keyframes slide-up {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease forwards;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#232323] border border-[#1DF7CE] text-white px-4 py-3 rounded shadow-lg flex items-center animate-slide-up">
      {action === 'add' ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#1DF7CE] mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5l10 -10"></path>
        </svg>
      ) : action === 'remove' ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          <line x1="15" y1="8" x2="9" y2="14" />
          <line x1="9" y1="8" x2="15" y2="14" />
        </svg>
      ) : type === 'error' ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#1DF7CE] mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      )}
      
      <span>
        {itemName && <strong>{itemName}</strong>}
        {action && (action === 'add' ? ' added to cart' : ' removed from cart')}
        {price !== undefined && ` • €${price.toFixed(2)}`}
        {!itemName && message}
      </span>
      
      <button 
        onClick={onClose}
        className="ml-4 text-gray-400 hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
};

export default Toast; 