'use client';

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FileUploadProps {
  onFileUploaded?: (fileData: any) => void;
  acceptedTypes?: string;
  maxSizeMB?: number;
  label?: string;
}

export default function FileUpload({
  onFileUploaded,
  acceptedTypes = "audio/mpeg,audio/wav,audio/mp3",
  maxSizeMB = 50,
  label = "Upload audio file"
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    
    // Check file type
    const validTypes = acceptedTypes.split(',');
    if (!validTypes.includes(selectedFile.type)) {
      setError(`Invalid file type. Accepted formats: ${validTypes.map(t => t.split('/')[1]).join(', ')}`);
      return;
    }
    
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      setError(`File is too large. Maximum size: ${maxSizeMB}MB`);
      return;
    }
    
    setFile(selectedFile);
    
    // Set preview information
    setPreview(selectedFile.name);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    
    validateAndSetFile(droppedFile);
  };

  const uploadFile = async () => {
    if (!file) return;
    
    setUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      
      // Call the callback with upload data
      if (onFileUploaded) {
        onFileUploaded(data);
      }
      
      setProgress(100);
      
      // Clear file after successful upload
      setTimeout(() => {
        setFile(null);
        setPreview(null);
        setProgress(0);
        setUploading(false);
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'Error uploading file');
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setProgress(0);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging ? 'border-accent bg-gray-100' : 'border-gray-300 hover:border-accent'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-1 text-xs text-gray-500">
            Drag & drop or click to browse
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Accepted formats: {acceptedTypes.split(',').map(t => t.split('/')[1]).join(', ')}
          </p>
          <p className="text-xs text-gray-400">
            Max size: {maxSizeMB}MB
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={acceptedTypes}
            className="hidden"
          />
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <DocumentIcon className="h-10 w-10 text-accent flex-shrink-0" />
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{preview}</p>
              <p className="text-xs text-gray-500">
                {file.size < 1024 * 1024
                  ? `${(file.size / 1024).toFixed(2)} KB`
                  : `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
              </p>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-gray-200"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          {uploading ? (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-center mt-1 text-gray-500">Uploading: {progress}%</p>
            </div>
          ) : (
            <button
              onClick={uploadFile}
              className="mt-3 w-full py-2 px-4 bg-accent text-gray-900 rounded-md text-sm font-medium hover:bg-accent/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
            >
              Upload File
            </button>
          )}
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
} 