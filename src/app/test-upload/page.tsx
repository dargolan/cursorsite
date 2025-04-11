'use client';

import { useState } from 'react';
import { testS3Upload } from '@/utils/test-s3';

export default function TestUpload() {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Log S3 configuration on component mount
  console.log('S3 Configuration:', {
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
    // Don't log credentials
    hasAccessKeyId: !!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadStatus('idle');
    setErrorMessage(null);
    setUploadedUrl(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadStatus('uploading');
      setErrorMessage(null);
      console.log('Starting upload for file:', selectedFile.name);
      
      // Log the file details
      console.log('File details:', {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
      });

      const url = await testS3Upload(selectedFile);
      console.log('Upload successful, URL:', url);
      setUploadedUrl(url);
      setUploadStatus('success');
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
      setUploadStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">S3 Upload Test</h1>
        
        <div className="bg-[#232323] p-6 rounded-lg">
          <div className="mb-6">
            <label className="block mb-2">Select a file to test upload:</label>
            <input
              type="file"
              onChange={handleFileChange}
              disabled={uploadStatus === 'uploading'}
              accept="audio/*"
              className="block w-full text-sm text-gray-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-[#1DF7CE] file:text-[#121212]
                hover:file:bg-[#19d9b6]
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-2 text-sm text-gray-400">
              Supported formats: MP3, WAV, AIFF, etc.
            </p>
          </div>

          {selectedFile && uploadStatus === 'idle' && (
            <button
              onClick={handleUpload}
              className="bg-[#1DF7CE] text-[#121212] px-6 py-2 rounded-full font-medium hover:bg-[#19d9b6] transition-colors"
            >
              Upload {selectedFile.name}
            </button>
          )}

          {uploadStatus === 'uploading' && (
            <div className="text-[#1DF7CE] animate-pulse flex items-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Uploading {selectedFile?.name}...
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="mt-4">
              <p className="text-[#1DF7CE] mb-2 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Upload successful!
              </p>
              <p className="text-sm text-gray-400">File URL:</p>
              <a 
                href={uploadedUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1DF7CE] hover:underline break-all"
              >
                {uploadedUrl}
              </a>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setUploadStatus('idle');
                  setUploadedUrl(null);
                }}
                className="mt-4 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Upload another file
              </button>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="mt-4">
              <p className="text-red-500 font-semibold flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Upload failed
              </p>
              <p className="text-red-400 text-sm mt-1">{errorMessage}</p>
              <button
                onClick={() => {
                  setUploadStatus('idle');
                  setErrorMessage(null);
                }}
                className="mt-4 text-sm text-[#1DF7CE] hover:text-[#19d9b6] transition-colors"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 