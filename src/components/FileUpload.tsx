'use client';

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { analyzeBPM } from '@/lib/audio-analyzer';

interface FileUploadProps {
  onFileUploaded?: (fileData: any) => void;
  onMultipleFilesUploaded?: (filesData: any[]) => void;
  acceptedTypes?: string;
  maxSizeMB?: number;
  label?: string;
  analyzeBpm?: boolean;
  onBpmDetected?: (bpm: number) => void;
  fileType?: 'main' | 'stem';
  multiple?: boolean;
}

export default function FileUpload({
  onFileUploaded,
  onMultipleFilesUploaded,
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
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (multiple && e.target.files && e.target.files.length > 0) {
      // Handle multiple files
      const selectedFiles = Array.from(e.target.files);
      handleMultipleFiles(selectedFiles);
    } else {
      // Handle single file
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;
      validateAndSetFile(selectedFile);
    }
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
    
    // Analyze BPM if needed
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
  };

  const handleMultipleFiles = (selectedFiles: File[]) => {
    setError(null);
    
    // Validate all files
    const validTypes = acceptedTypes.split(',');
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    // Check if any file fails validation
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
    
    // All files are valid
    setFiles(selectedFiles);
    setPreview(`${selectedFiles.length} files selected`);
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

  const uploadFile = async () => {
    if (!file && files.length === 0) return;
    
    setUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      if (multiple && files.length > 0) {
        // Upload multiple files
        const uploadPromises = files.map(async (file, index) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('fileType', fileType);
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Upload failed for ${file.name}`);
          }
          
          // Update progress after each file
          setProgress(Math.round((index + 1) / files.length * 100));
          
          return response.json();
        });
        
        const results = await Promise.all(uploadPromises);
        
        // Call the callback with all uploaded file data
        if (onMultipleFilesUploaded) {
          onMultipleFilesUploaded(results);
        }
        
      } else if (file) {
        // Upload single file
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', fileType);
        
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
          onFileUploaded({
            ...data,
            fileType
          });
        }
        
        setProgress(100);
      }
      
      // Clear file after successful upload
      setTimeout(() => {
        setFile(null);
        setFiles([]);
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
    setFiles([]);
    setPreview(null);
    setError(null);
    setProgress(0);
    
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
              Upload {multiple && files.length > 0 ? `${files.length} Files` : 'File'}
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