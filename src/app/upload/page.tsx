'use client';

import React, { useState, useEffect } from 'react';
import FileUpload from '@/components/FileUpload';
import ImageUpload from '@/components/ImageUpload';
import TagSelector from '@/components/TagSelector';
import PageContainer from '@/components/PageContainer';
import ContentWrapper from '@/components/ContentWrapper';
import { PlusCircleIcon, TrashIcon, ArrowDownTrayIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { Tag } from '../../types';

interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  url: string;
  fileType: 'main' | 'stem' | 'image';
}

export default function UploadPage() {
  const [mainTrack, setMainTrack] = useState<UploadedFile | null>(null);
  const [trackImage, setTrackImage] = useState<UploadedFile | null>(null);
  const [stems, setStems] = useState<UploadedFile[]>([]);
  const [stemPrices, setStemPrices] = useState<{[key: string]: string}>({});
  const [trackTitle, setTrackTitle] = useState('');
  const [genreTags, setGenreTags] = useState<Tag[]>([]);
  const [moodTags, setMoodTags] = useState<Tag[]>([]);
  const [instrumentTags, setInstrumentTags] = useState<Tag[]>([]);
  const [bpm, setBpm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showStemUpload, setShowStemUpload] = useState(false);
  const [trackId, setTrackId] = useState<string>(uuidv4());
  const [selectedMainFile, setSelectedMainFile] = useState<File | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedStemFiles, setSelectedStemFiles] = useState<File[]>([]);
  const [isUploadingMain, setIsUploadingMain] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingStems, setIsUploadingStems] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);

  useEffect(() => {
    async function fetchTags() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api'}/tags?pagination[pageSize]=100`);
        const data = await res.json();
        // Strapi v4 returns { data: [ ... ] }
        const tags = data.data ? data.data.map((item: any) => ({
          id: item.id,
          ...item.attributes
        })) : [];
        setAllTags(tags);
      } catch (err) {
        console.error('Failed to fetch tags from Strapi', err);
      }
    }
    fetchTags();
  }, []);

  // Helper to upload a file to /api/upload
  const uploadFile = async (file: File, fileType: 'main' | 'stem' | 'image') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);
    formData.append('trackId', trackId);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  };

  // New handlers for file selection
  const handleMainFileSelected = (file: File) => setSelectedMainFile(file);
  const handleImageFileSelected = (file: File) => setSelectedImageFile(file);
  const handleStemFilesSelected = (files: File[]) => setSelectedStemFiles(files);

  // Upload handlers
  const handleUploadMainTrack = async () => {
    if (!selectedMainFile) return;
    setIsUploadingMain(true);
    try {
      const fileData = await uploadFile(selectedMainFile, 'main');
      setMainTrack(fileData);
      setShowStemUpload(true);
      setSelectedMainFile(null);
    } catch (err) {
      setSubmitError('Failed to upload main track');
    } finally {
      setIsUploadingMain(false);
    }
  };
  const handleUploadImage = async () => {
    if (!selectedImageFile) return;
    setIsUploadingImage(true);
    try {
      const fileData = await uploadFile(selectedImageFile, 'image');
      setTrackImage(fileData);
      setSelectedImageFile(null);
    } catch (err) {
      setSubmitError('Failed to upload cover image');
    } finally {
      setIsUploadingImage(false);
    }
  };
  const handleUploadStems = async () => {
    if (!selectedStemFiles.length) return;
    setIsUploadingStems(true);
    const uploadedStems: UploadedFile[] = [];
    const newPrices = { ...stemPrices };
    for (const file of selectedStemFiles) {
      try {
        const fileData = await uploadFile(file, 'stem');
        uploadedStems.push(fileData);
        newPrices[fileData.filename] = '1.99';
      } catch (err) {
        setSubmitError('Failed to upload one or more stems');
      }
    }
    setStemPrices(newPrices);
    setStems(prev => [...prev, ...uploadedStems]);
    setSelectedStemFiles([]);
    setIsUploadingStems(false);
  };

  const handleBpmDetected = (detectedBpm: number) => {
    setBpm(detectedBpm.toString());
  };

  const removeStem = (index: number) => {
    const stem = stems[index];
    setStems(prev => prev.filter((_, i) => i !== index));
    
    // Remove price for this stem
    setStemPrices(prev => {
      const newPrices = {...prev};
      delete newPrices[stem.filename];
      return newPrices;
    });
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
      // Prepare stems data for backend
      const stemsData = stems.map(stem => ({
        name: stem.originalName,
        url: stem.url,
        price: parseFloat(stemPrices[stem.filename] || '0'),
        duration: 0 // You can add duration extraction if available
      }));
      // POST metadata to /api/tracks/create
      const res = await fetch('/api/tracks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trackTitle,
          bpm: parseInt(bpm),
          duration: 0, // You can add duration extraction if available
          tags: [...genreTags, ...moodTags, ...instrumentTags].map(tag => tag.id),
          audioUrl: mainTrack.url,
          imageUrl: trackImage.url,
          stems: stemsData,
          trackId,
        })
      });
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

  return (
    <PageContainer className="min-h-screen bg-gray-50">
      <ContentWrapper>
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
                        onFileSelected={handleMainFileSelected} 
                        analyzeBpm={true}
                        onBpmDetected={handleBpmDetected}
                        label="Upload main track"
                        fileType="main"
                      />
                      {selectedMainFile && (
                        <button onClick={handleUploadMainTrack} disabled={isUploadingMain} className="mt-2 bg-accent text-white rounded px-4 py-2">
                          {isUploadingMain ? 'Uploading...' : 'Upload Main Track'}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Cover Image</h2>
                    <p className="text-sm text-gray-500 mb-4">
                      Upload a cover image for your track. Recommended size: 1000x1000px.
                    </p>
                    
                    <div className="space-y-4">
                      <ImageUpload 
                        onImageSelected={handleImageFileSelected} 
                        label="Upload cover image"
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
                      <FileUpload 
                        onMultipleFilesSelected={handleStemFilesSelected}
                        label="Upload stems"
                        fileType="stem"
                        multiple={true}
                      />
                      {selectedStemFiles.length > 0 && (
                        <button onClick={handleUploadStems} disabled={isUploadingStems} className="mt-2 bg-accent text-white rounded px-4 py-2">
                          {isUploadingStems ? 'Uploading...' : `Upload ${selectedStemFiles.length} Stems`}
                        </button>
                      )}
                      
                      {stems.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Stems:</h3>
                          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
                            {stems.map((stem, index) => (
                              <li key={index} className="px-4 py-3 flex items-center justify-between bg-white">
                                <div className="flex items-center min-w-0 flex-1">
                                  <span className="text-sm font-medium text-gray-900 truncate">
                                    {stem.originalName}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({(stem.size / (1024 * 1024)).toFixed(2)} MB)
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-24">
                                    <div className="relative rounded-md shadow-sm">
                                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                                        <span className="text-gray-500 sm:text-sm">€</span>
                                      </div>
                                      <input
                                        type="number"
                                        value={stemPrices[stem.filename] || '1.99'}
                                        onChange={(e) => handleStemPriceChange(stem.filename, e.target.value)}
                                        min="0"
                                        step="0.01"
                                        className="block w-full rounded-md border-0 py-1.5 pl-7 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6"
                                      />
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeStem(index)}
                                    className="ml-2 p-1 text-gray-500 hover:text-red-500"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
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
    </PageContainer>
  );
} 