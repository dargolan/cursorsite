'use client';

import React, { useState, useEffect } from 'react';
import FileUpload from '@/components/FileUpload';
import ImageUpload from '@/components/ImageUpload';
import TagSelector from '@/components/TagSelector';
import PageContainer from '@/components/PageContainer';
import ContentWrapper from '@/components/ContentWrapper';
import Header from '@/components/Header';
import { PlusCircleIcon, TrashIcon, ArrowDownTrayIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { Tag } from '../../types';

interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  url: string;
  fileType: 'main' | 'stem' | 'image';
  duration?: number;
  waveform?: number[];
}

export default function UploadPage() {
  const [mainTrack, setMainTrack] = useState<UploadedFile | null>(null);
  const [trackImage, setTrackImage] = useState<UploadedFile | null>(null);
  const [stems, setStems] = useState<{
    name: string;
    mp3File: File | null;
    wavFile: File | null;
    price: number;
    duration?: number;
    waveform?: number[];
    mp3Status?: 'idle' | 'uploading' | 'success' | 'error';
    wavStatus?: 'idle' | 'uploading' | 'success' | 'error';
    mp3Url?: string;
    wavUrl?: string;
    id?: string;
  }[]>([]);
  const [stemPrices, setStemPrices] = useState<{[key: string]: string}>({});
  const [trackTitle, setTrackTitle] = useState('');
  const [genreTags, setGenreTags] = useState<Tag[]>([]);
  const [moodTags, setMoodTags] = useState<Tag[]>([]);
  const [instrumentTags, setInstrumentTags] = useState<Tag[]>([]);
  const [bpm, setBpm] = useState('');
  const [trackDuration, setTrackDuration] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showStemUpload, setShowStemUpload] = useState(false);
  const [trackId, setTrackId] = useState<string>(uuidv4());
  const [selectedMainFile, setSelectedMainFile] = useState<File | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isUploadingMain, setIsUploadingMain] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [mainUploadProgress, setMainUploadProgress] = useState(0);
  const [mainUploadSpeed, setMainUploadSpeed] = useState(0);
  const [mainTimeRemaining, setMainTimeRemaining] = useState(0);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [imageUploadSpeed, setImageUploadSpeed] = useState(0);
  const [imageTimeRemaining, setImageTimeRemaining] = useState(0);
  const [stemUploadProgress, setStemUploadProgress] = useState(0);
  const [stemUploadSpeed, setStemUploadSpeed] = useState(0);
  const [stemTimeRemaining, setStemTimeRemaining] = useState(0);
  const [artistName, setArtistName] = useState('');
  const [waveformGenerated, setWaveformGenerated] = useState(false);
  const [stemWaveformStatus, setStemWaveformStatus] = useState<Record<number, 'idle' | 'loading' | 'success' | 'error'>>({});

  useEffect(() => {
    async function fetchTags() {
      try {
        // Try to fetch from our custom API endpoint first
        const apiRes = await fetch('/api/tags');
        
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          
          if (apiData.tags && Array.isArray(apiData.tags)) {
            console.log('Tags fetched from API:', apiData.tags);
            setAllTags(apiData.tags);
            return; // Exit early if we got tags from our API
          }
        }
        
        // Fallback to direct Strapi API if our endpoint failed
        console.log('Falling back to direct Strapi API...');
        const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api'}/tags?pagination[pageSize]=100`;
        console.log('Fetching tags from URL:', url);
        
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch tags: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('Strapi tags response:', data);
        
        // Strapi v4 returns { data: [ ... ] }
        let tags: Tag[] = [];
        
        if (data.data && Array.isArray(data.data)) {
          tags = data.data.map((item: any) => {
            // Add null checks to prevent undefined access errors
            if (!item) {
              console.warn('Invalid tag item structure:', item);
              return null;
            }
            
            // The Strapi response has tag properties directly on the object, not in attributes
            return {
              id: item.id ? item.id.toString() : '',
              name: item.Name || item.name || 'Unknown', // Check both Name and name (case sensitive)
              type: item.type || 'unknown'
            };
          })
          .filter((tag: any): tag is Tag => tag !== null); // Filter out any null entries
        }
        
        console.log('Processed tags:', tags);
        setAllTags(tags);
        
      } catch (err) {
        console.error('Failed to fetch tags from Strapi:', err);
      }
    }
    fetchTags();
  }, []);

  // New function to handle chunked uploads
  const uploadFileInChunks = async (file: File, fileType: 'main' | 'stem' | 'image'): Promise<UploadedFile> => {
    // Generate unique upload ID
    const uploadId = uuidv4();
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    const chunks = Math.ceil(file.size / chunkSize);
    
    // Track upload state variables
    let completedChunks = 0;
    let startTime = Date.now();
    let uploadedBytes = 0;
    let lastUploadedBytes = 0;
    let lastSpeedUpdateTime = startTime;
    const speedUpdateInterval = 1000; // Update speed calculation every second
    
    // Function to update progress UI
    const updateProgress = (chunk: number, uploaded: number, speed: number) => {
      // Calculate total progress percentage
      const progress = (uploaded / file.size) * 100;
      
      // Calculate estimated time remaining
      const bytesRemaining = file.size - uploaded;
      const timeRemaining = speed > 0 ? bytesRemaining / speed : 0;
      
      // Update upload state for file component
      if (fileType === 'main') {
        setIsUploadingMain(true);
      } else if (fileType === 'image') {
        setIsUploadingImage(true);
      }
      
      // Update progress states
      switch (fileType) {
        case 'main':
          if (selectedMainFile) {
            // Assuming FileUpload component has progress properties
            const progressEvent = {
              target: {
                dataset: {
                  uploadProgress: progress,
                  uploadSpeed: speed,
                  timeRemaining: timeRemaining
                }
              }
            };
            // Pass progress info to main file component
            setMainUploadProgress(progress);
            setMainUploadSpeed(speed);
            setMainTimeRemaining(timeRemaining);
          }
          break;
        case 'image':
          if (selectedImageFile) {
            setImageUploadProgress(progress);
            setImageUploadSpeed(speed);
            setImageTimeRemaining(timeRemaining);
          }
          break;
      }
    };
    
    try {
      for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
        // Calculate this chunk's size
        const start = chunkIndex * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const chunkBlob = file.slice(start, end);
        
        // Create form data for this chunk
        const formData = new FormData();
        formData.append('file', chunkBlob);
        formData.append('fileType', fileType);
        formData.append('trackId', trackId);
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', chunks.toString());
        formData.append('originalFileName', file.name);
        formData.append('totalFileSize', file.size.toString());
        
        // Add track metadata to improve folder naming
        if (trackTitle) {
          formData.append('trackTitle', trackTitle);
        }
        if (artistName) {
          formData.append('artistName', artistName);
        }
        
        // Maximum retry attempts
        let retryCount = 0;
        const maxRetries = 3;
        let success = false;
        
        // Retry loop for each chunk
        while (!success && retryCount <= maxRetries) {
          try {
            const res = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });
            
            if (!res.ok) {
              throw new Error(`Upload failed with status ${res.status}`);
            }
            
            const data = await res.json();
            
            if (data.error) {
              throw new Error(data.error);
            }
            
            // If this is the final chunk response with complete file details
            if (data.complete === false) {
              // This is a progress update
              completedChunks = data.completedChunks;
              uploadedBytes = (chunkIndex + 1) * chunkSize;
              
              // Update speed calculation periodically
              const now = Date.now();
              if (now - lastSpeedUpdateTime >= speedUpdateInterval) {
                const timeDiff = (now - lastSpeedUpdateTime) / 1000; // in seconds
                const bytesDiff = uploadedBytes - lastUploadedBytes;
                const speed = bytesDiff / timeDiff; // bytes per second
                
                // Update progress UI
                updateProgress(completedChunks, uploadedBytes, speed);
                
                // Update last values for next calculation
                lastUploadedBytes = uploadedBytes;
                lastSpeedUpdateTime = now;
              }
            } else if (data.success && data.url) {
              // This is the final response with the complete file
              success = true;
              completedChunks = chunks;
              uploadedBytes = file.size;
              
              // Calculate overall speed
              const totalTime = (Date.now() - startTime) / 1000; // in seconds
              const overallSpeed = file.size / totalTime; // bytes per second
              
              // Final progress update (100%)
              updateProgress(chunks, file.size, overallSpeed);
              
              // Construct and return the uploaded file object
              return {
                filename: data.filename,
                originalName: data.originalName,
                size: data.size,
                url: data.url,
                fileType,
                duration: data.duration,
                waveform: data.waveform
              };
            }
            
            success = true; // This chunk was uploaded successfully
          } catch (error) {
            retryCount++;
            console.error(`Chunk ${chunkIndex} upload error (attempt ${retryCount}):`, error);
            
            if (retryCount >= maxRetries) {
              throw error; // Re-throw after max retries
            }
            
            // Exponential backoff before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          }
        }
      }
      
      throw new Error('Upload failed to complete');
    } catch (error) {
      // Set error based on file type
      if (fileType === 'main') {
        setSubmitError('Failed to upload main track. Please try again.');
        setIsUploadingMain(false);
      } else if (fileType === 'image') {
        setSubmitError('Failed to upload cover image. Please try again.');
        setIsUploadingImage(false);
      }
      throw error;
    } finally {
      // Reset upload state
      if (fileType === 'main') {
        setIsUploadingMain(false);
      } else if (fileType === 'image') {
        setIsUploadingImage(false);
      }
    }
  };

  // Replace the simple handleMainFileSelected function with a more comprehensive one
  const handleMainFileSelected = (file: File) => {
    // Clear any existing duration data to prevent stale information
    setTrackDuration(0);
    
    // Store the selected file
    setSelectedMainFile(file);
    
    // Clear any previous upload errors
    setSubmitError(null);
  };

  // New handlers for file selection
  const handleImageFileSelected = (file: File) => setSelectedImageFile(file);

  // Replace the existing upload handlers with chunked versions
  const handleUploadMainTrack = async () => {
    if (!selectedMainFile) return;
    setIsUploadingMain(true);
    setSubmitError(null);
    try {
      // Use chunked upload for large files, regular upload for small ones
      let fileData;
      if (selectedMainFile.size > 5 * 1024 * 1024) {
        fileData = await uploadFileInChunks(selectedMainFile, 'main');
      } else {
        // Use existing upload for small files
        const formData = new FormData();
        formData.append('file', selectedMainFile);
        formData.append('fileType', 'main');
        formData.append('trackId', trackId);
        
        // Add track metadata to improve folder naming
        if (trackTitle) {
          formData.append('trackTitle', trackTitle);
        }
        if (artistName) {
          formData.append('artistName', artistName);
        }
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        fileData = await res.json();
      }
      
      setMainTrack(fileData);
      setShowStemUpload(true);
      setSelectedMainFile(null);
      
      // Show success message
      const successMessage = document.getElementById('upload-success-message');
      if (successMessage) {
        successMessage.textContent = 'Main track uploaded successfully!';
        successMessage.classList.remove('hidden');
        setTimeout(() => {
          successMessage.classList.add('hidden');
        }, 3000);
      }
    } catch (err) {
      console.error('Main track upload failed:', err);
      setSubmitError('Failed to upload main track. Please try again.');
    } finally {
      setIsUploadingMain(false);
    }
  };
  
  const handleUploadImage = async () => {
    if (!selectedImageFile) return;
    setIsUploadingImage(true);
    setSubmitError(null);
    try {
      // Use chunked upload for large files
      let fileData;
      if (selectedImageFile.size > 5 * 1024 * 1024) {
        fileData = await uploadFileInChunks(selectedImageFile, 'image');
      } else {
        // Use existing upload for small files
        const formData = new FormData();
        formData.append('file', selectedImageFile);
        formData.append('fileType', 'image');
        formData.append('trackId', trackId);
        
        // Add track metadata to improve folder naming
        if (trackTitle) {
          formData.append('trackTitle', trackTitle);
        }
        if (artistName) {
          formData.append('artistName', artistName);
        }
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        fileData = await res.json();
      }
      
      setTrackImage(fileData);
      setSelectedImageFile(null);
      
      // Show success message
      const successMessage = document.getElementById('upload-success-message');
      if (successMessage) {
        successMessage.textContent = 'Cover image uploaded successfully!';
        successMessage.classList.remove('hidden');
        setTimeout(() => {
          successMessage.classList.add('hidden');
        }, 3000);
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      setSubmitError('Failed to upload cover image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleBpmDetected = (detectedBpm: number) => {
    setBpm(detectedBpm.toString());
  };

  const handleDurationDetected = (duration: number) => {
    console.log('Detected audio duration:', duration);
    setTrackDuration(Math.round(duration));
  };

  const addStem = () => {
    setStems([...stems, { name: '', mp3File: null, wavFile: null, price: 1.99 }]);
  };

  const updateStem = (index: number, field: string, value: any) => {
    const newStems = [...stems];
    (newStems[index] as any)[field] = value;
    setStems(newStems);
  };

  const removeStem = (index: number) => {
    setStems(stems.filter((_, i) => i !== index));
  };

  const removeMainTrack = () => {
    setMainTrack(null);
    setShowStemUpload(false);
    setBpm('');
  };

  const removeTrackImage = () => {
    setTrackImage(null);
  };

  const handleStemPriceChange = (stemFilename: string, price: string) => {
    setStemPrices(prev => ({
      ...prev,
      [stemFilename]: price
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainTrack) {
      setSubmitError('Please upload a main track');
      return;
    }
    if (!trackImage) {
      setSubmitError('Please upload a cover image');
      return;
    }
    if (genreTags.length === 0) {
      setSubmitError('Please select at least one genre tag');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Upload stems files and collect URLs, duration, waveform
      const stemsData = [];
      for (let i = 0; i < stems.length; i++) {
        const stem = stems[i];
        let mp3Url = '';
        let wavUrl = '';
        let duration = 0;
        let waveform: number[] = [];
        if (stem.mp3File) {
          const mp3Upload = await uploadFileInChunks(stem.mp3File, 'stem');
          mp3Url = mp3Upload.url;
          if (mp3Upload.duration) duration = mp3Upload.duration;
          if (mp3Upload.waveform) waveform = mp3Upload.waveform;
        }
        if (stem.wavFile) {
          const wavUpload = await uploadFileInChunks(stem.wavFile, 'stem');
          wavUrl = wavUpload.url;
          // Prefer duration/waveform from WAV if available
          if (wavUpload.duration) duration = wavUpload.duration;
          if (wavUpload.waveform) waveform = wavUpload.waveform;
        }
        // Update stems state with duration and waveform for UI feedback (optional)
        setStems(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], duration, waveform };
          return updated;
        });
        stemsData.push({
          name: stem.name,
          mp3Url,
          wavUrl,
          price: stem.price,
          duration,
          waveform,
        });
      }

      // Prepare track payload
      const trackData = {
        Title: trackTitle,
        BPM: parseInt(bpm),
        Duration: trackDuration,
        tags: [...genreTags, ...moodTags, ...instrumentTags].map(tag => tag.id),
        audioUrl: mainTrack.url,
        ImageUrl: trackImage.url,
        stems: stemsData,
        trackId,
      };
      
      // First try with the original endpoint
      let res = await fetch('/api/tracks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackData)
      });
      
      // If that fails, try the no-auth endpoint
      if (!res.ok) {
        console.log('Original endpoint failed, trying no-auth endpoint...');
        res = await fetch('/api/tracks/create-noauth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trackData)
        });
      }
      
      // If that also fails, try the temp-track fallback
      if (!res.ok) {
        console.log('No-auth endpoint failed, trying temp-track fallback...');
        res = await fetch('/api/temp-track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trackData)
        });
      }
      
      if (!res.ok) throw new Error('Failed to save track metadata');
      
      setSubmitSuccess(true);
      setTimeout(() => {
        setMainTrack(null);
        setTrackImage(null);
        setStems([]);
        setStemPrices({});
        setTrackTitle('');
        setGenreTags([]);
        setMoodTags([]);
        setInstrumentTags([]);
        setBpm('');
        setShowStemUpload(false);
        setSubmitSuccess(false);
        setTrackId(uuidv4());
      }, 3000);
    } catch (error: any) {
      setSubmitError(error.message || 'Error submitting track');
    } finally {
      setIsSubmitting(false);
    }
  };

  const genreAvailableTags = allTags.filter(tag => tag.type === 'genre');
  const moodAvailableTags = allTags.filter(tag => tag.type === 'mood');
  const instrumentAvailableTags = allTags.filter(tag => tag.type === 'instrument');

  // Add progress event handlers
  const handleMainProgress = (progress: number, speed: number, timeRemaining: number) => {
    setMainUploadProgress(progress);
    setMainUploadSpeed(speed);
    setMainTimeRemaining(timeRemaining);
  };
  
  const handleImageProgress = (progress: number, speed: number, timeRemaining: number) => {
    setImageUploadProgress(progress);
    setImageUploadSpeed(speed);
    setImageTimeRemaining(timeRemaining);
  };
  
  const handleStemProgress = (progress: number, speed: number, timeRemaining: number) => {
    setStemUploadProgress(progress);
    setStemUploadSpeed(speed);
    setStemTimeRemaining(timeRemaining);
  };

  // Add format functions for display
  const formatSpeed = (bytesPerSecond: number) => {
    if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(0)}s`;
    return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
  };

  // Add a new handler for generating waveform
  const handleGenerateWaveform = async () => {
    if (!mainTrack) return;
    
    try {
      // Extract S3 key from audioUrl (remove protocol and domain)
      const audioUrl = mainTrack.url || '';
      const s3Key = audioUrl.replace(/^https?:\/\/[^/]+\//, '');
      
      // Show loading in success message
      const successMessage = document.getElementById('upload-success-message');
      if (successMessage) {
        successMessage.textContent = 'Generating waveform...';
        successMessage.classList.remove('hidden');
      }
      
      const res = await fetch('/api/generate-waveform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ s3Key }),
      });
      
      const data = await res.json();
      
      // Show success or error message
      if (successMessage) {
        if (data.success) {
          successMessage.textContent = 'Waveform generated successfully!';
          setWaveformGenerated(true);
        } else {
          successMessage.textContent = 'Error: ' + (data.error || 'Failed to generate waveform');
          successMessage.className = 'fixed top-4 right-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded z-50 shadow-lg';
        }
        
        setTimeout(() => {
          successMessage.classList.add('hidden');
          successMessage.className = 'fixed top-4 right-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded hidden z-50 shadow-lg';
        }, 3000);
      }
    } catch (error) {
      console.error('Waveform generation error:', error);
      
      // Show error message
      const successMessage = document.getElementById('upload-success-message');
      if (successMessage) {
        successMessage.textContent = 'Error: ' + (error instanceof Error ? error.message : String(error));
        successMessage.className = 'fixed top-4 right-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded z-50 shadow-lg';
        
        setTimeout(() => {
          successMessage.classList.add('hidden');
          // Reset class back to success style
          successMessage.className = 'fixed top-4 right-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded hidden z-50 shadow-lg';
        }, 3000);
      }
    }
  };

  // Add this handler function inside UploadPage
  const handleUploadStem = async (idx: number) => {
    const stem = stems[idx];
    let mp3Url = '';
    let wavUrl = '';
    let duration = 0;
    let waveform: number[] = [];
    // Set uploading status
    updateStem(idx, 'mp3Status', stem.mp3File ? 'uploading' : 'idle');
    updateStem(idx, 'wavStatus', stem.wavFile ? 'uploading' : 'idle');
    try {
      if (stem.mp3File) {
        const mp3Upload = await uploadFileInChunks(stem.mp3File, 'stem');
        mp3Url = mp3Upload.url;
        duration = mp3Upload.duration || duration;
        waveform = mp3Upload.waveform || waveform;
        updateStem(idx, 'mp3Status', 'success');
      }
      if (stem.wavFile) {
        const wavUpload = await uploadFileInChunks(stem.wavFile, 'stem');
        wavUrl = wavUpload.url;
        duration = wavUpload.duration || duration;
        waveform = wavUpload.waveform || waveform;
        updateStem(idx, 'wavStatus', 'success');
      }
      // Save remote URLs and duration/waveform in stem object
      updateStem(idx, 'mp3Url', mp3Url);
      updateStem(idx, 'wavUrl', wavUrl);
      updateStem(idx, 'duration', duration);
      updateStem(idx, 'waveform', waveform);
    } catch (err) {
      if (stem.mp3File) updateStem(idx, 'mp3Status', 'error');
      if (stem.wavFile) updateStem(idx, 'wavStatus', 'error');
    }
  };

  return (
    <PageContainer className="min-h-screen bg-gray-50">
      <ContentWrapper>
        <Header nonSticky />
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Your Track</h1>
            
            {submitSuccess ? (
              <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                <p>Your track was uploaded successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Track Information</h2>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                    <div className="col-span-4">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Track Title*
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={trackTitle}
                        onChange={(e) => setTrackTitle(e.target.value)}
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm text-gray-900"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label htmlFor="bpm" className="block text-sm font-medium text-gray-700">
                        BPM{mainTrack ? ' (Auto-detected)' : ''}
                      </label>
                      <input
                        type="number"
                        id="bpm"
                        value={bpm}
                        onChange={(e) => setBpm(e.target.value)}
                        min="1"
                        placeholder="120"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm text-gray-900"
                        readOnly={!!mainTrack}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                        Duration{mainTrack ? ' (Auto-detected)' : ''}
                      </label>
                      <input
                        type="text"
                        id="duration"
                        value={trackDuration ? `${Math.floor(trackDuration / 60)}:${(trackDuration % 60).toString().padStart(2, '0')}` : ''}
                        readOnly
                        placeholder="00:00"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm text-gray-900 bg-gray-50"
                      />
                    </div>
                    
                    <div className="col-span-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Genre Tags*
                      </label>
                      <TagSelector 
                        category="genre" 
                        selectedTags={genreTags} 
                        onChange={setGenreTags} 
                        availableTags={genreAvailableTags}
                      />
                    </div>
                    
                    <div className="col-span-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mood Tags
                      </label>
                      <TagSelector 
                        category="mood" 
                        selectedTags={moodTags} 
                        onChange={setMoodTags} 
                        availableTags={moodAvailableTags}
                      />
                    </div>
                    
                    <div className="col-span-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instrument Tags
                      </label>
                      <TagSelector 
                        category="instrument" 
                        selectedTags={instrumentTags} 
                        onChange={setInstrumentTags} 
                        availableTags={instrumentAvailableTags}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Main Track</h2>
                    <p className="text-sm text-gray-500 mb-4">
                      Upload the full track. BPM will be automatically detected.
                    </p>
                    
                    <div className="space-y-4">
                      <FileUpload
                        label="Upload main track"
                        onFileSelected={handleMainFileSelected}
                        onBpmDetected={handleBpmDetected}
                        onDurationDetected={handleDurationDetected}
                        analyzeBpm={true}
                        analyzeDuration={true}
                        fileType="main"
                        acceptedTypes="audio/mpeg,audio/wav,audio/mp3,audio/flac"
                        maxSizeMB={50}
                        onProgress={handleMainProgress}
                      />
                      <div className="flex flex-wrap gap-2">
                        {selectedMainFile && (
                          <button onClick={handleUploadMainTrack} disabled={isUploadingMain} className="mt-2 bg-accent text-white rounded px-4 py-2">
                            {isUploadingMain ? 'Uploading...' : 'Upload Main Track'}
                          </button>
                        )}
                        
                        {/* Add Generate Waveform button after main track is uploaded */}
                        {mainTrack && (
                          <button 
                            type="button"
                            onClick={handleGenerateWaveform} 
                            className={`mt-2 rounded px-4 py-2 flex items-center ${waveformGenerated ? 'bg-green-500 text-white' : 'bg-accent text-white'}`}
                            disabled={waveformGenerated}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 5v14m7-7H5" />
                            </svg>
                            {waveformGenerated ? 'Waveform Generated ✓' : 'Generate Waveform'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Cover Image</h2>
                    <p className="text-sm text-gray-500 mb-4">
                      Upload a cover image for your track. Recommended size: 1000x1000px.
                    </p>
                    
                    <div className="space-y-4">
                      <ImageUpload
                        label="Upload cover image"
                        onImageSelected={handleImageFileSelected}
                        acceptedTypes="image/jpeg,image/png,image/webp,image/gif"
                        maxSizeMB={5}
                      />
                      {selectedImageFile && (
                        <button onClick={handleUploadImage} disabled={isUploadingImage} className="mt-2 bg-accent text-white rounded px-4 py-2">
                          {isUploadingImage ? 'Uploading...' : 'Upload Cover Image'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {showStemUpload && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Stems (For Sale)</h2>
                    <p className="text-sm text-gray-500 mb-4">
                      Upload individual stems for the track (drums, bass, etc.). You can select multiple files at once.
                    </p>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold mt-8 mb-2">Stems</h3>
                      <div className="space-y-4 mb-4">
                        {stems.map((stem, idx) => (
                          <div key={idx} className="mb-4 p-4 bg-gray-50 rounded border">
                            <label className="block text-sm font-medium mb-1">Stem Name</label>
                            <input
                              type="text"
                              className="w-full p-2 border rounded bg-white text-black"
                              value={stem.name}
                              onChange={e => updateStem(idx, 'name', e.target.value)}
                              placeholder="e.g. Drums"
                            />
                            <div className="flex gap-4 mt-2">
                              <div className="flex-1">
                                <label className="block text-xs font-medium mb-1">Upload MP3 file</label>
                                <input
                                  type="file"
                                  accept="audio/mp3"
                                  className="w-full p-1 border rounded bg-white text-black"
                                  onChange={e => {
                                    updateStem(idx, 'mp3File', e.target.files?.[0] || null);
                                    if (e.target.files?.[0]) updateStem(idx, 'mp3Status', 'idle');
                                  }}
                                />
                                {stem.mp3File && <span className="text-green-600 text-xs ml-2">Loaded ✓</span>}
                                {stem.mp3Status === 'uploading' && <span className="text-xs text-blue-500 ml-2">Uploading...</span>}
                                {stem.mp3Status === 'success' && <span className="text-xs text-green-600 ml-2">Uploaded</span>}
                                {stem.mp3Status === 'error' && <span className="text-xs text-red-600 ml-2">Error</span>}
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs font-medium mb-1">Upload WAV file</label>
                                <input
                                  type="file"
                                  accept="audio/wav"
                                  className="w-full p-1 border rounded bg-white text-black"
                                  onChange={e => {
                                    updateStem(idx, 'wavFile', e.target.files?.[0] || null);
                                    if (e.target.files?.[0]) updateStem(idx, 'wavStatus', 'idle');
                                  }}
                                />
                                {stem.wavFile && <span className="text-green-600 text-xs ml-2">Loaded ✓</span>}
                                {stem.wavStatus === 'uploading' && <span className="text-xs text-blue-500 ml-2">Uploading...</span>}
                                {stem.wavStatus === 'success' && <span className="text-xs text-green-600 ml-2">Uploaded</span>}
                                {stem.wavStatus === 'error' && <span className="text-xs text-red-600 ml-2">Error</span>}
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs font-medium mb-1">Price (EUR)</label>
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  className="w-full p-2 border rounded bg-white text-black"
                                  value={stem.price}
                                  onChange={e => updateStem(idx, 'price', parseFloat(e.target.value))}
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              className="mt-2 bg-accent text-white rounded px-4 py-2"
                              disabled={(!stem.mp3File && !stem.wavFile) || stem.mp3Status === 'uploading' || stem.wavStatus === 'uploading'}
                              onClick={() => handleUploadStem(idx)}
                            >
                              {stem.mp3Status === 'uploading' || stem.wavStatus === 'uploading' ? 'Uploading...' : 'Upload Stem'}
                            </button>
                            <button type="button" className="mt-2 text-red-500 text-xs" onClick={() => removeStem(idx)}>Remove</button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addStem}
                          className="flex items-center gap-2 px-3 py-1 bg-accent text-white rounded hover:bg-accent-hover"
                        >
                          <PlusCircleIcon className="h-5 w-5" /> Add Stem
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {showStemUpload && stems.length > 0 && (
                  <div className="bg-white shadow rounded-lg p-6 mt-6 border border-gray-200 text-gray-900">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Uploaded Stems</h2>
                    <div className="space-y-4">
                      {stems.map((stem, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded border">
                          <h3 className="font-medium">{stem.name}</h3>
                          <div className="mt-2">
                            <p>MP3: {stem.mp3Status === 'success' ? 'Uploaded' : stem.mp3Status === 'error' ? 'Error' : 'Not uploaded'}</p>
                            <p>WAV: {stem.wavStatus === 'success' ? 'Uploaded' : stem.wavStatus === 'error' ? 'Error' : 'Not uploaded'}</p>
                            {/* Optionally, add a preview link if the stem has a URL */}
                            {stem.mp3Url && (
                              <a href={stem.mp3Url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Preview MP3</a>
                            )}
                            {stem.wavUrl && (
                              <a href={stem.wavUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-4">Preview WAV</a>
                            )}
                            {/* Generate Waveform button for uploaded stems with remote URL */}
                            {(stem.mp3Url || stem.wavUrl) && (
                              <button
                                type="button"
                                className={`mt-2 ml-4 rounded px-4 py-2 flex items-center
                                  ${stemWaveformStatus[idx] === 'success' ? 'bg-green-500 text-white' : ''}
                                  ${stemWaveformStatus[idx] === 'error' ? 'bg-red-500 text-white' : ''}
                                  ${!stemWaveformStatus[idx] || stemWaveformStatus[idx] === 'loading' ? 'bg-accent text-white' : ''}
                                `}
                                disabled={stemWaveformStatus[idx] === 'loading'}
                                onClick={async () => {
                                  setStemWaveformStatus(s => ({ ...s, [idx]: 'loading' }));
                                  try {
                                    const res = await fetch('/api/generate-stem-waveform', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ audioUrl: stem.mp3Url || stem.wavUrl }),
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setStemWaveformStatus(s => ({ ...s, [idx]: 'success' }));
                                    } else {
                                      setStemWaveformStatus(s => ({ ...s, [idx]: 'error' }));
                                    }
                                  } catch {
                                    setStemWaveformStatus(s => ({ ...s, [idx]: 'error' }));
                                  }
                                }}
                              >
                                {stemWaveformStatus[idx] === 'loading'
                                  ? 'Generating...'
                                  : stemWaveformStatus[idx] === 'success'
                                    ? 'Waveform Generated ✓'
                                    : stemWaveformStatus[idx] === 'error'
                                      ? 'Error'
                                      : 'Generate Waveform'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {submitError && (
                  <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{submitError}</p>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !mainTrack || !trackImage}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-900 bg-accent hover:bg-accent/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Upload Track'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </ContentWrapper>
      <div id="upload-success-message" className="fixed top-4 right-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded hidden z-50 shadow-lg">
        Success message here
      </div>
    </PageContainer>
  );
} 