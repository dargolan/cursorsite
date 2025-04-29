'use client';

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import Image from 'next/image';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImageUploadProps {
  onImageSelected?: (file: File) => void;
  acceptedTypes?: string;
  maxSizeMB?: number;
  label?: string;
}

export default function ImageUpload({
  onImageSelected,
  acceptedTypes = "image/jpeg,image/png,image/webp",
  maxSizeMB = 5,
  label = "Upload image"
}: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    const validTypes = acceptedTypes.split(',');
    if (!validTypes.includes(selectedFile.type)) {
      setError(`Invalid file type. Accepted formats: ${validTypes.map(t => t.split('/')[1]).join(', ')}`);
      return;
    }
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      setError(`File is too large. Maximum size: ${maxSizeMB}MB`);
      return;
    }
    setFile(selectedFile);
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    fileReader.readAsDataURL(selectedFile);
    if (onImageSelected) {
      onImageSelected(selectedFile);
    }
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

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    
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
          <PhotoIcon className="h-12 w-12 mx-auto text-gray-400" />
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
          <div className="flex flex-col items-center">
            {preview && (
              <div className="w-40 h-40 relative overflow-hidden rounded mb-3">
                <Image 
                  src={preview} 
                  alt="Image preview" 
                  fill 
                  className="object-cover" 
                />
              </div>
            )}
            <div className="flex items-center w-full">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
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
          </div>
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