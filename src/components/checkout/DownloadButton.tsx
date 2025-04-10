'use client';

import { useState } from 'react';

interface DownloadButtonProps {
  stemId: string;
  stemName: string;
  sessionId?: string;
  className?: string;
  buttonText?: string;
  onDownloadStarted?: () => void;
  onDownloadComplete?: () => void;
  onError?: (error: string) => void;
}

export default function DownloadButton({
  stemId,
  stemName,
  sessionId,
  className = '',
  buttonText = 'Download',
  onDownloadStarted,
  onDownloadComplete,
  onError
}: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (onDownloadStarted) {
        onDownloadStarted();
      }

      // Build the download URL with params
      const baseUrl = `/api/download/${stemId}`;
      const url = new URL(baseUrl, window.location.origin);
      
      // Add session ID if available (for just completed purchases)
      if (sessionId) {
        url.searchParams.append('session_id', sessionId);
      }
      
      // Generate a temporary download token if needed
      // This is optional and would be used if implementing token-based downloads
      // const token = await generateDownloadToken(stemId);
      // if (token) {
      //   url.searchParams.append('token', token);
      // }

      // Trigger the download by creating a hidden link and clicking it
      const downloadLink = document.createElement('a');
      downloadLink.href = url.toString();
      downloadLink.target = '_blank';
      downloadLink.download = `${stemName.replace(/\s+/g, '_')}.mp3`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      if (onDownloadComplete) {
        onDownloadComplete();
      }
    } catch (err: any) {
      console.error('Download error:', err);
      const errorMsg = err.message || 'Failed to download file';
      setError(errorMsg);
      
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="download-button">
      {error && (
        <div className="text-red-500 mb-3 text-sm">
          {error}
        </div>
      )}
      
      <button
        onClick={handleDownload}
        disabled={isLoading}
        className={`bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md 
                  transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
        aria-label={`Download ${stemName}`}
      >
        {isLoading ? 'Processing...' : buttonText}
      </button>
    </div>
  );
} 

import { useState } from 'react';

interface DownloadButtonProps {
  stemId: string;
  stemName: string;
  sessionId?: string;
  className?: string;
  buttonText?: string;
  onDownloadStarted?: () => void;
  onDownloadComplete?: () => void;
  onError?: (error: string) => void;
}

export default function DownloadButton({
  stemId,
  stemName,
  sessionId,
  className = '',
  buttonText = 'Download',
  onDownloadStarted,
  onDownloadComplete,
  onError
}: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (onDownloadStarted) {
        onDownloadStarted();
      }

      // Build the download URL with params
      const baseUrl = `/api/download/${stemId}`;
      const url = new URL(baseUrl, window.location.origin);
      
      // Add session ID if available (for just completed purchases)
      if (sessionId) {
        url.searchParams.append('session_id', sessionId);
      }
      
      // Generate a temporary download token if needed
      // This is optional and would be used if implementing token-based downloads
      // const token = await generateDownloadToken(stemId);
      // if (token) {
      //   url.searchParams.append('token', token);
      // }

      // Trigger the download by creating a hidden link and clicking it
      const downloadLink = document.createElement('a');
      downloadLink.href = url.toString();
      downloadLink.target = '_blank';
      downloadLink.download = `${stemName.replace(/\s+/g, '_')}.mp3`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      if (onDownloadComplete) {
        onDownloadComplete();
      }
    } catch (err: any) {
      console.error('Download error:', err);
      const errorMsg = err.message || 'Failed to download file';
      setError(errorMsg);
      
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="download-button">
      {error && (
        <div className="text-red-500 mb-3 text-sm">
          {error}
        </div>
      )}
      
      <button
        onClick={handleDownload}
        disabled={isLoading}
        className={`bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md 
                  transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
        aria-label={`Download ${stemName}`}
      >
        {isLoading ? 'Processing...' : buttonText}
      </button>
    </div>
  );
} 