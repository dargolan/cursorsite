'use client';

import { useState, useRef, useEffect } from 'react';
import { uploadTrackToS3, TrackUploadParams } from '@/utils/track-upload';
import { extractTrackMetadata, TrackMetadata } from '@/utils/audio-metadata-extractor';
import { createTrackInStrapi } from '@/utils/strapi-integration';
import { getTags } from '@/utils/strapi-client';
import { Tag } from '@/types';

interface TestUploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  logs: string[];
  error: string | null;
  uploadedUrls: {
    trackUrl: string | null;
    imageUrl: string | null;
    stemUrls: Record<string, string>;
  } | null;
  metadata?: TrackMetadata;
  stemNames: Record<string, string>;
}

const MAX_FILE_SIZE = {
  track: 50 * 1024 * 1024, // 50MB
  image: 5 * 1024 * 1024,  // 5MB
  stem: 50 * 1024 * 1024,  // 50MB
};

const ALLOWED_FILE_TYPES = {
  track: ['audio/mpeg', 'audio/wav', 'audio/aiff', 'audio/mp3'],
  image: ['image/jpeg', 'image/png', 'image/webp'],
  stem: ['audio/mpeg', 'audio/wav', 'audio/aiff', 'audio/mp3'],
};

export default function TestUploadPage() {
  const [state, setState] = useState<TestUploadState>({
    status: 'idle',
    progress: 0,
    logs: [],
    error: null,
    uploadedUrls: null,
    stemNames: {}
  });

  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const trackFileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const stemFilesRef = useRef<HTMLInputElement>(null);
  const trackTitleRef = useRef<HTMLInputElement>(null);
  const bpmInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load available tags
    getTags().then(setTags).catch(console.error);
  }, []);

  const addLog = (message: string) => {
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, `[${new Date().toISOString()}] ${message}`]
    }));
  };

  const validateFile = (file: File, type: 'track' | 'image' | 'stem'): string | null => {
    if (!ALLOWED_FILE_TYPES[type].includes(file.type)) {
      return `Invalid file type for ${type}. Allowed types: ${ALLOWED_FILE_TYPES[type].join(', ')}`;
    }
    if (file.size > MAX_FILE_SIZE[type]) {
      return `${type} file too large. Maximum size: ${MAX_FILE_SIZE[type] / (1024 * 1024)}MB`;
    }
    return null;
  };

  const updateProgress = (progress: number) => {
    setState(prev => ({ ...prev, progress }));
  };

  const handleTrackFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      addLog(`Extracting metadata from track: ${file.name}`);
      const metadata = await extractTrackMetadata(file);
      setState(prev => ({ ...prev, metadata }));
      addLog(`Metadata extracted successfully:`);
      addLog(`- Duration: ${metadata.duration.toFixed(2)}s`);
      addLog(`- BPM: ${metadata.bpm || 'unknown'}`);

      // Auto-fill BPM if detected
      if (metadata.bpm && bpmInputRef.current) {
        bpmInputRef.current.value = metadata.bpm.toString();
      }
    } catch (error) {
      console.error('Error extracting metadata:', error);
      addLog(`Failed to extract metadata: ${error}`);
    }
  };

  const handleStemFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const stemNames: Record<string, string> = {};

    for (const file of Array.from(files)) {
      const stemName = file.name.replace(/\.[^/.]+$/, '');
      stemNames[stemName] = stemName;
      addLog(`Added stem: ${stemName}`);
    }

    setState(prev => ({
      ...prev,
      stemNames
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setState(prev => ({ ...prev, status: 'uploading', progress: 0, error: null }));
      addLog('Starting upload...');

      // Get files and metadata
      const trackFile = trackFileRef.current?.files?.[0];
      const imageFile = imageFileRef.current?.files?.[0];
      const stemFiles = stemFilesRef.current?.files;
      const trackTitle = trackTitleRef.current?.value.trim();
      const bpm = parseInt(bpmInputRef.current?.value || '0', 10);

      if (!trackTitle) {
        throw new Error('Please enter a track title');
      }

      if (!trackFile || !imageFile || !stemFiles) {
        throw new Error('Missing required files');
      }

      if (!state.metadata) {
        throw new Error('Track metadata not extracted');
      }

      // Convert FileList to Record with original names
      const stemFilesRecord: Record<string, File> = {};
      Array.from(stemFiles).forEach((file) => {
        const stemName = file.name.replace(/\.[^/.]+$/, '');
        stemFilesRecord[stemName] = file;
      });

      // Upload files to S3
      const uploadResult = await uploadTrackToS3({
        trackFile,
        imageFile,
        stemFiles: stemFilesRecord,
        trackTitle
      }, (progress) => setState(prev => ({ ...prev, progress })));

      // Create track in Strapi with new integration
      await createTrackInStrapi({
        title: trackTitle,
        metadata: state.metadata,
        imageUrl: uploadResult.imageUrl!,
        audioUrl: uploadResult.trackUrl!,
        stems: Object.entries(uploadResult.stemUrls).map(([name, url]) => ({
          name,
          url
        })),
        tags: selectedTags
      });

      addLog('Track created in Strapi successfully!');

      setState(prev => ({
        ...prev,
        status: 'success',
        progress: 100,
        uploadedUrls: uploadResult
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Error: ${errorMessage}`);
      setState(prev => ({ ...prev, status: 'error', error: errorMessage }));
    }
  };

  return (
    <div className="container mx-auto p-4 text-white">
      <h1 className="text-2xl font-bold mb-4">Upload Test Page</h1>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Test Files</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Track Title:</label>
            <input
              type="text"
              ref={trackTitleRef}
              placeholder="Enter track title"
              className="block w-full p-2 border rounded bg-[#232323] text-white border-gray-600 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block mb-2">BPM (optional):</label>
            <input
              type="number"
              ref={bpmInputRef}
              placeholder="Enter BPM"
              className="block w-full p-2 border rounded bg-[#232323] text-white border-gray-600 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block mb-2">Tags:</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTags(prev => 
                    prev.includes(tag.id) 
                      ? prev.filter(id => id !== tag.id)
                      : [...prev, tag.id]
                  )}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedTags.includes(tag.id)
                      ? 'bg-[#1DF7CE] text-[#121212]'
                      : 'bg-[#333] text-white'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-2">Track File (max 50MB):</label>
            <input
              type="file"
              ref={trackFileRef}
              onChange={handleTrackFileChange}
              accept="audio/*"
              className="block w-full text-gray-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-[#1DF7CE] file:text-[#121212]
                hover:file:bg-[#19d9b6]"
            />
            <p className="text-sm text-gray-400 mt-1">Allowed: MP3, WAV, AIFF</p>
            {state.metadata && (
              <div className="mt-2 text-sm text-gray-300">
                <p>Duration: {state.metadata.duration.toFixed(2)}s</p>
                {state.metadata.bpm && <p>Detected BPM: {state.metadata.bpm}</p>}
              </div>
            )}
          </div>
          
          <div>
            <label className="block mb-2">Image File (max 5MB):</label>
            <input
              type="file"
              ref={imageFileRef}
              accept="image/*"
              className="block w-full text-gray-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-[#1DF7CE] file:text-[#121212]
                hover:file:bg-[#19d9b6]"
            />
            <p className="text-sm text-gray-400 mt-1">Allowed: JPG, PNG, WebP</p>
          </div>
          
          <div>
            <label className="block mb-2">Stem Files (max 50MB each):</label>
            <input
              type="file"
              ref={stemFilesRef}
              onChange={handleStemFileChange}
              accept="audio/*"
              multiple
              className="block w-full text-gray-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-[#1DF7CE] file:text-[#121212]
                hover:file:bg-[#19d9b6]"
            />
            <p className="text-sm text-gray-400 mt-1">Allowed: MP3, WAV, AIFF</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={state.status === 'uploading'}
        className="bg-[#1DF7CE] text-[#121212] px-6 py-2 rounded-full font-medium 
          hover:bg-[#19d9b6] transition-colors disabled:bg-gray-600 disabled:text-gray-300"
      >
        {state.status === 'uploading' ? 'Uploading...' : 'Start Test Upload'}
      </button>

      {state.status === 'uploading' && (
        <div className="mt-4">
          <div className="w-full bg-gray-600 rounded-full h-2.5">
            <div
              className="bg-[#1DF7CE] h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-300 mt-1">{state.progress}%</p>
        </div>
      )}

      {state.status === 'success' && state.uploadedUrls && (
        <div className="mt-4 p-4 bg-[#1a2e29] text-[#1DF7CE] rounded">
          <h3 className="font-semibold text-lg mb-2">Upload Successful!</h3>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Track:</span>{' '}
              <a href={state.uploadedUrls.trackUrl || ''} target="_blank" rel="noopener noreferrer" className="text-[#1DF7CE] hover:underline">
                {state.uploadedUrls.trackUrl}
              </a>
            </p>
            <p>
              <span className="font-medium">Image:</span>{' '}
              <a href={state.uploadedUrls.imageUrl || ''} target="_blank" rel="noopener noreferrer" className="text-[#1DF7CE] hover:underline">
                {state.uploadedUrls.imageUrl}
              </a>
            </p>
            <div>
              <span className="font-medium">Stems:</span>
              <ul className="list-disc list-inside ml-4">
                {Object.entries(state.uploadedUrls.stemUrls).map(([name, url]) => (
                  <li key={name}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#1DF7CE] hover:underline">
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {state.metadata && (
              <div>
                <span className="font-medium">Metadata:</span>
                <ul className="list-disc list-inside ml-4">
                  <li>Duration: {state.metadata.duration.toFixed(2)}s</li>
                  {state.metadata.bpm && <li>BPM: {state.metadata.bpm}</li>}
                  <li>Selected Tags: {selectedTags.map(id => 
                    tags.find(t => t.id === id)?.name
                  ).join(', ')}</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {state.error && (
        <div className="mt-4 p-4 bg-red-900/50 text-red-200 rounded border border-red-500">
          <p className="font-semibold">Error:</p>
          <p>{state.error}</p>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Upload Logs</h2>
        <div className="bg-[#232323] p-4 rounded max-h-96 overflow-y-auto border border-gray-600">
          <pre className="text-sm text-gray-300 font-mono">
            {state.logs.join('\n')}
          </pre>
        </div>
      </div>
    </div>
  );
} 