'use client';

import { useState, useRef } from 'react';
import { uploadTrackToS3, TrackUploadParams } from '@/utils/track-upload';

interface UploadFormData {
  title: string;
  bpm: number;
  tags: string[];
}

export default function UploadPage() {
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    bpm: 120,
    tags: [],
  });
  
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [stemFiles, setStemFiles] = useState<Record<string, File>>({});
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleTrackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setTrackFile(file);
  };
  
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  };
  
  const handleStemFileChange = (e: React.ChangeEvent<HTMLInputElement>, stemName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setStemFiles(prev => ({
        ...prev,
        [stemName]: file
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackFile || !imageFile || Object.keys(stemFiles).length === 0) {
      setErrorMessage('Please select all required files');
      return;
    }
    
    try {
      setUploadStatus('uploading');
      setErrorMessage(null);
      
      const uploadParams: TrackUploadParams = {
        trackFile,
        imageFile,
        stemFiles,
        trackTitle: formData.title,
      };
      
      const result = await uploadTrackToS3(uploadParams);
      console.log('Upload successful:', result);
      
      setUploadStatus('success');
      // Here you would typically also create the track in Strapi with the S3 URLs
      
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
      setUploadStatus('error');
    }
  };
  
  return (
    <div style={{ backgroundColor: 'var(--background-color)' }} className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Upload Track</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Track Information */}
          <div style={{ backgroundColor: 'var(--card-color)' }} className="p-6 rounded-lg space-y-4">
            <h2 className="text-xl font-semibold mb-4">Track Information</h2>
            
            <div>
              <label className="block mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-[#333333] rounded px-3 py-2 text-white"
                required
              />
            </div>
            
            <div>
              <label className="block mb-2">BPM</label>
              <input
                type="number"
                value={formData.bpm}
                onChange={(e) => setFormData(prev => ({ ...prev, bpm: parseInt(e.target.value) }))}
                className="w-full bg-[#333333] rounded px-3 py-2 text-white"
                required
              />
            </div>
          </div>
          
          {/* File Uploads */}
          <div style={{ backgroundColor: 'var(--card-color)' }} className="p-6 rounded-lg space-y-4">
            <h2 className="text-xl font-semibold mb-4">Files</h2>
            
            {/* Main Track */}
            <div>
              <label className="block mb-2">Main Track (MP3)</label>
              <input
                type="file"
                onChange={handleTrackFileChange}
                accept="audio/mpeg,audio/wav"
                className="block w-full text-sm text-gray-300
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-[var(--accent-color)] file:text-[#121212]
                  hover:file:bg-[var(--accent-color)] hover:file:opacity-90"
                required
              />
            </div>
            
            {/* Cover Image */}
            <div>
              <label className="block mb-2">Cover Image</label>
              <input
                type="file"
                onChange={handleImageFileChange}
                accept="image/*"
                className="block w-full text-sm text-gray-300
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-[var(--accent-color)] file:text-[#121212]
                  hover:file:bg-[var(--accent-color)] hover:file:opacity-90"
                required
              />
            </div>
            
            {/* Stems */}
            <div>
              <h3 className="text-lg font-medium mb-3">Stems</h3>
              
              {/* Drums Stem */}
              <div className="mb-3">
                <label className="block mb-2">Drums</label>
                <input
                  type="file"
                  onChange={(e) => handleStemFileChange(e, 'drums')}
                  accept="audio/mpeg,audio/wav"
                  className="block w-full text-sm text-gray-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-[var(--accent-color)] file:text-[#121212]
                    hover:file:bg-[var(--accent-color)] hover:file:opacity-90"
                />
              </div>
              
              {/* Bass Stem */}
              <div className="mb-3">
                <label className="block mb-2">Bass</label>
                <input
                  type="file"
                  onChange={(e) => handleStemFileChange(e, 'bass')}
                  accept="audio/mpeg,audio/wav"
                  className="block w-full text-sm text-gray-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-[var(--accent-color)] file:text-[#121212]
                    hover:file:bg-[var(--accent-color)] hover:file:opacity-90"
                />
              </div>
              
              {/* Other Stems */}
              <div className="mb-3">
                <label className="block mb-2">Other Stems</label>
                <input
                  type="file"
                  onChange={(e) => handleStemFileChange(e, 'other')}
                  accept="audio/mpeg,audio/wav"
                  multiple
                  className="block w-full text-sm text-gray-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-[var(--accent-color)] file:text-[#121212]
                    hover:file:bg-[var(--accent-color)] hover:file:opacity-90"
                />
              </div>
            </div>
          </div>
          
          {/* Upload Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploadStatus === 'uploading'}
              style={{ 
                backgroundColor: 'var(--accent-color)',
                opacity: uploadStatus === 'uploading' ? '0.5' : '1'
              }}
              className="text-[#121212] px-8 py-3 rounded-full font-medium
                hover:opacity-90 transition-opacity disabled:cursor-not-allowed"
            >
              {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Track'}
            </button>
          </div>
        </form>
        
        {/* Status Messages */}
        {errorMessage && (
          <div className="mt-4 p-4 bg-red-500/20 text-red-300 rounded">
            {errorMessage}
          </div>
        )}
        
        {uploadStatus === 'success' && (
          <div className="mt-4 p-4 bg-green-500/20 text-green-300 rounded">
            Upload completed successfully!
          </div>
        )}
      </div>
    </div>
  );
} 