'use client';

import React, { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import PageContainer from '@/components/PageContainer';
import ContentWrapper from '@/components/ContentWrapper';
import { PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  url: string;
}

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [trackTitle, setTrackTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [bpm, setBpm] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFileUploaded = (fileData: UploadedFile) => {
    setUploadedFiles(prev => [...prev, fileData]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uploadedFiles.length === 0) {
      setSubmitError('Please upload at least one audio file');
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
        description,
        files: uploadedFiles
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      setSubmitSuccess(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setUploadedFiles([]);
        setTrackTitle('');
        setGenre('');
        setBpm('');
        setPrice('');
        setDescription('');
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
                        BPM
                      </label>
                      <input
                        type="number"
                        id="bpm"
                        value={bpm}
                        onChange={(e) => setBpm(e.target.value)}
                        min="1"
                        placeholder="120"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm"
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
                    
                    <div className="col-span-2">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm"
                        placeholder="Describe your track..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Audio Files</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Upload stems or the full track. Accepted formats: MP3, WAV
                  </p>
                  
                  <div className="space-y-4">
                    <FileUpload onFileUploaded={handleFileUploaded} />
                    
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h3>
                        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
                          {uploadedFiles.map((file, index) => (
                            <li key={index} className="px-4 py-3 flex items-center justify-between bg-white">
                              <div className="flex items-center min-w-0">
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {file.originalName}
                                </span>
                                <span className="ml-2 text-xs text-gray-500">
                                  ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
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
                
                {submitError && (
                  <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{submitError}</p>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
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