'use client';

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { analyzeBPM } from '@/lib/audio-analyzer';

interface FileUploadProps {
  onFileSelected?: (file: File) => void;
  onMultipleFilesSelected?: (files: File[]) => void;
  acceptedTypes?: string;
  maxSizeMB?: number;
  label?: string;
  analyzeBpm?: boolean;
  onBpmDetected?: (bpm: number) => void;
  fileType?: 'main' | 'stem';
  multiple?: boolean;
}

export default function FileUpload({
  onFileSelected,
  onMultipleFilesSelected,
  acceptedTypes = "audio/mpeg,audio/wav,audio/mp3",
  maxSizeMB = 50,
  label = "Upload audio file",
  analyzeBpm = false,
  onBpmDetected,
  fileType = 'main',
  multiple = false
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (multiple && e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      handleMultipleFiles(selectedFiles);
    } else {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;
      validateAndSetFile(selectedFile);
    }
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
    setPreview(selectedFile.name);
    if (analyzeBpm && onBpmDetected) {
      setIsAnalyzing(true);
      analyzeBPM(selectedFile)
        .then(bpm => {
          onBpmDetected(bpm);
        })
        .catch(err => {
          console.error('BPM analysis error:', err);
        })
        .finally(() => {
          setIsAnalyzing(false);
        });
    }
    if (onFileSelected) {
      onFileSelected(selectedFile);
    }
  };

  const handleMultipleFiles = (selectedFiles: File[]) => {
    setError(null);
    const validTypes = acceptedTypes.split(',');
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const invalidFile = selectedFiles.find(file => {
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type in "${file.name}". Accepted formats: ${validTypes.map(t => t.split('/')[1]).join(', ')}`);
        return true;
      }
      if (file.size > maxSizeBytes) {
        setError(`"${file.name}" is too large. Maximum size: ${maxSizeMB}MB`);
        return true;
      }
      return false;
    });
    if (invalidFile) return;
    setFiles(selectedFiles);
    setPreview(`${selectedFiles.length} files selected`);
    if (onMultipleFilesSelected) {
      onMultipleFilesSelected(selectedFiles);
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
    
    if (multiple && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Handle multiple files
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleMultipleFiles(droppedFiles);
    } else {
      // Handle single file
      const droppedFile = e.dataTransfer.files?.[0];
      if (!droppedFile) return;
      validateAndSetFile(droppedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFiles([]);
    setPreview(null);
    setError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasFile = file !== null || files.length > 0;

  return (
    <div className="w-full">
      {!hasFile ? (
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
            multiple={multiple}
          />
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <DocumentIcon className="h-10 w-10 text-accent flex-shrink-0" />
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{preview}</p>
              {files.length > 0 ? (
                <p className="text-xs text-gray-500">
                  {files.length} files selected
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  {file && (file.size < 1024 * 1024
                    ? `${(file.size / 1024).toFixed(2)} KB`
                    : `${(file.size / (1024 * 1024)).toFixed(2)} MB`)}
                </p>
              )}
              {isAnalyzing && (
                <p className="text-xs text-blue-500 animate-pulse">
                  Analyzing BPM...
                </p>
              )}
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
      )}
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
} 