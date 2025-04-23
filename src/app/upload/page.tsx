'use client';

import React, { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import PageContainer from '@/components/PageContainer';
import ContentWrapper from '@/components/ContentWrapper';
import { PlusCircleIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  url: string;
  fileType: 'main' | 'stem';
}

export default function UploadPage() {
  const [mainTrack, setMainTrack] = useState<UploadedFile | null>(null);
  const [stems, setStems] = useState<UploadedFile[]>([]);
  const [trackTitle, setTrackTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [bpm, setBpm] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showStemUpload, setShowStemUpload] = useState(false);

  const handleMainTrackUploaded = (fileData: UploadedFile) => {
    setMainTrack(fileData);
    setShowStemUpload(true);
  };

  const handleStemUploaded = (fileData: UploadedFile) => {
    setStems(prev => [...prev, fileData]);
  };

  const handleBpmDetected = (detectedBpm: number) => {
    setBpm(detectedBpm.toString());
  };

  const removeStem = (index: number) => {
    setStems(prev => prev.filter((_, i) => i !== index));
  };

  const removeMainTrack = () => {
    setMainTrack(null);
    setShowStemUpload(false);
    setBpm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mainTrack) {
      setSubmitError('Please upload a main track');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // For now, we'll just simulate a submission
      // In a real app, you'd submit this data to your backend
      console.log('Submitting track data:', {
        title: trackTitle,
        genre,
        bpm: parseInt(bpm),
        price: parseFloat(price),
        mainTrack,
        stems
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      setSubmitSuccess(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setMainTrack(null);
        setStems([]);
        setTrackTitle('');
        setGenre('');
        setBpm('');
        setPrice('');
        setShowStemUpload(false);
        setSubmitSuccess(false);
      }, 3000);
      
    } catch (error: any) {
      setSubmitError(error.message || 'Error submitting track');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="col-span-2">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Track Title*
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={trackTitle}
                        onChange={(e) => setTrackTitle(e.target.value)}
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="genre" className="block text-sm font-medium text-gray-700">
                        Genre*
                      </label>
                      <select
                        id="genre"
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm"
                      >
                        <option value="">Select Genre</option>
                        <option value="hip-hop">Hip Hop</option>
                        <option value="rnb">R&B</option>
                        <option value="pop">Pop</option>
                        <option value="electronic">Electronic</option>
                        <option value="rock">Rock</option>
                        <option value="jazz">Jazz</option>
                        <option value="acoustic">Acoustic</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
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
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm"
                        readOnly={!!mainTrack}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        Price ($)*
                      </label>
                      <input
                        type="number"
                        id="price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        min="0"
                        step="0.01"
                        required
                        placeholder="29.99"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Main Track</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Upload the full track. BPM will be automatically detected.
                  </p>
                  
                  <div className="space-y-4">
                    {!mainTrack ? (
                      <FileUpload 
                        onFileUploaded={handleMainTrackUploaded} 
                        analyzeBpm={true}
                        onBpmDetected={handleBpmDetected}
                        label="Upload main track"
                        fileType="main"
                      />
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <ArrowDownTrayIcon className="h-10 w-10 text-accent flex-shrink-0" />
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{mainTrack.originalName}</p>
                            <p className="text-xs text-gray-500">
                              {(mainTrack.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={removeMainTrack}
                            className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-gray-200"
                          >
                            <TrashIcon className="h-5 w-5 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {showStemUpload && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Stems</h2>
                    <p className="text-sm text-gray-500 mb-4">
                      Upload individual stems for the track (drums, bass, etc.)
                    </p>
                    
                    <div className="space-y-4">
                      <FileUpload 
                        onFileUploaded={handleStemUploaded}
                        label="Upload a stem"
                        fileType="stem"
                      />
                      
                      {stems.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Stems:</h3>
                          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
                            {stems.map((stem, index) => (
                              <li key={index} className="px-4 py-3 flex items-center justify-between bg-white">
                                <div className="flex items-center min-w-0">
                                  <span className="text-sm font-medium text-gray-900 truncate">
                                    {stem.originalName}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({(stem.size / (1024 * 1024)).toFixed(2)} MB)
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeStem(index)}
                                  className="ml-2 p-1 text-gray-500 hover:text-red-500"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
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
                    disabled={isSubmitting || !mainTrack}
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