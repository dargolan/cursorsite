'use client';

import React, { useState, useRef, ChangeEvent, DragEvent, useEffect } from 'react';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FileUploadProps {
  onFileSelected?: (file: File) => void;
  onMultipleFilesSelected?: (files: File[]) => void;
  acceptedTypes?: string;
  maxSizeMB?: number;
  label?: string;
  fileType?: 'main' | 'stem' | 'image';
  multiple?: boolean;
  onProgress?: (progress: number, speed: number, timeRemaining: number) => void;
  retryCount?: number;
}

export default function FileUpload({
  onFileSelected,
  onMultipleFilesSelected,
  acceptedTypes = "audio/mpeg,audio/wav,audio/mp3",
  maxSizeMB = 50,
  label = "Upload audio file",
  fileType = 'main',
  multiple = false,
  onProgress,
  retryCount = 3
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [lastUploadTime, setLastUploadTime] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploadRetries, setUploadRetries] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate session ID for persistence
  useEffect(() => {
    const newSessionId = `upload_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    
    // Try to restore from session storage
    const savedSession = sessionStorage.getItem(`upload_${fileType}`);
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        setUploadProgress(sessionData.progress || 0);
        // We can't restore the actual file object from storage,
        // but we can show the name and progress
        if (sessionData.fileName) {
          setPreview(sessionData.fileName);
        }
      } catch (e) {
        console.error('Error restoring upload session:', e);
      }
    }
  }, [fileType]);

  // Save progress to session storage
  useEffect(() => {
    if (file && uploadProgress > 0) {
      const sessionData = {
        fileName: file.name,
        progress: uploadProgress,
        lastUpdated: new Date().toISOString()
      };
      sessionStorage.setItem(`upload_${fileType}`, JSON.stringify(sessionData));
    }
    
    // Report progress to parent component
    if (onProgress && uploadProgress > 0) {
      onProgress(uploadProgress, uploadSpeed, timeRemaining);
    }
  }, [uploadProgress, uploadSpeed, timeRemaining, file, fileType, onProgress]);

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
    setWarning(null);
    const validTypes = acceptedTypes.split(',');
    
    // Validate file type
    if (!validTypes.includes(selectedFile.type)) {
      setError(`Invalid file type. Accepted formats: ${validTypes.map(t => t.split('/')[1]).join(', ')}`);
      return;
    }
    
    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      setError(`File is too large. Maximum size: ${maxSizeMB}MB`);
      return;
    }
    
    // Validate audio quality for mp3 files
    if (selectedFile.type === 'audio/mpeg' || selectedFile.type === 'audio/mp3') {
      // Check file size compared to duration (estimated) - simplified check
      // Assuming proper bit rate is at least 192kbps
      // For a 3-minute song that would be ~4.3MB
      // If significantly smaller, it might be low quality
      const estimatedSizeForQuality = 4.3 * 1024 * 1024; // rough estimate for 3-min song at 192kbps
      if (selectedFile.size < estimatedSizeForQuality / 2) {
        setWarning('This audio file might be low quality. For best results, use 192-320kbps MP3 files.');
      }
    }
    
    // Validate image dimensions for image files
    if (fileType === 'image' && (selectedFile.type.includes('image'))) {
      const img = new window.Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.width < 1000 || img.height < 1000) {
          setWarning('Image resolution is lower than recommended (1200x1200px). This may affect display quality.');
        }
      };
      img.src = URL.createObjectURL(selectedFile);
    }
    
    setFile(selectedFile);
    setPreview(selectedFile.name);
    resetUploadStats();
    
    if (onFileSelected) {
      onFileSelected(selectedFile);
    }
  };

  const resetUploadStats = () => {
    setUploadProgress(0);
    setUploadSpeed(0);
    setTimeRemaining(0);
    setLastUploadTime(null);
    setUploadRetries(0);
  };

  const handleMultipleFiles = (selectedFiles: File[]) => {
    setError(null);
    setWarning(null);
    const validTypes = acceptedTypes.split(',');
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    let hasWarning = false;
    
    const invalidFile = selectedFiles.find(file => {
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type in "${file.name}". Accepted formats: ${validTypes.map(t => t.split('/')[1]).join(', ')}`);
        return true;
      }
      if (file.size > maxSizeBytes) {
        setError(`"${file.name}" is too large. Maximum size: ${maxSizeMB}MB`);
        return true;
      }
      
      // Check for potential quality issues
      if ((file.type === 'audio/mpeg' || file.type === 'audio/mp3') && 
          file.size < 2 * 1024 * 1024) { // Simplistic check for files under 2MB
        hasWarning = true;
      }
      
      return false;
    });
    
    if (invalidFile) return;
    
    if (hasWarning) {
      setWarning('One or more files might be low quality. For best results, use 192-320kbps MP3 files.');
    }
    
    setFiles(selectedFiles);
    setPreview(`${selectedFiles.length} files selected`);
    resetUploadStats();
    
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
    setWarning(null);
    resetUploadStats();
    
    // Clear session storage
    sessionStorage.removeItem(`upload_${fileType}`);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatSpeed = (bytesPerSecond: number) => {
    if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(0)}s`;
    return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
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
              
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-accent h-1.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>{uploadProgress.toFixed(0)}%</span>
                    {uploadSpeed > 0 && (
                      <span>{formatSpeed(uploadSpeed)}</span>
                    )}
                    {timeRemaining > 0 && (
                      <span>ETA: {formatTime(timeRemaining)}</span>
                    )}
                  </div>
                </div>
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
      
      {warning && (
        <div className="mt-2 text-sm text-amber-600">
          <span className="font-bold">Warning:</span> {warning}
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {/* Upload retry info for debugging */}
      {uploadRetries > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          Upload attempts: {uploadRetries}/{retryCount}
        </div>
      )}
    </div>
  );
} 