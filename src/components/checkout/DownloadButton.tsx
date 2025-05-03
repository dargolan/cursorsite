'use client';

import React from 'react';
import { STRAPI_URL } from '../../config/strapi';

interface DownloadButtonProps {
  trackId: string;
  buttonText?: string;
  className?: string;
}

export function DownloadButton({ 
  trackId,
  buttonText = 'Download',
  className = ''
}: DownloadButtonProps) {
  const handleDownload = () => {
    // Open the download URL in a new tab
    window.open(`${STRAPI_URL}/api/download/track/${trackId}`, '_blank');
  };
  
  return (
    <button
      onClick={handleDownload}
      className={`flex items-center justify-center rounded-md px-4 py-2 bg-[#1DF7CE] text-black hover:bg-[#18e0bb] transition-colors ${className}`}
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {buttonText}
    </button>
  );
} 