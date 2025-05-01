'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function StemAudioDebugPage() {
  const [stemName, setStemName] = useState('Keys');
  const [trackTitle, setTrackTitle] = useState('Elevator Music');
  const [currentAudioUrl, setCurrentAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUrlValid, setIsUrlValid] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [availableFiles, setAvailableFiles] = useState<any[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Use dynamic track options instead of hardcoded ones
  const [stemOptions, setStemOptions] = useState(['Keys', 'Drums', 'Bass', 'Guitars']);
  const [trackOptions, setTrackOptions] = useState(['Elevator Music', 'Crazy Meme Music', 'Lo-Fi Beats']);
  
  // Fetch available track options from API 
  useEffect(() => {
    // This could be connected to an API endpoint that returns available tracks
    // For now we'll use the existing options
    addLog('Using default stem and track options');
  }, []);
  
  // Add log message function
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].slice(0, -1)}: ${message}`]);
  };
  
  // Test the stem URL using our endpoint
  const testStemUrl = async () => {
    try {
      addLog(`Testing URL for stem: ${stemName}, track: ${trackTitle}`);
      
      // Use the new unified stem-audio endpoint
      const stemAudioUrl = `/api/stem-audio?name=${encodeURIComponent(stemName)}&track=${encodeURIComponent(trackTitle)}`;
      setCurrentAudioUrl(stemAudioUrl);
      addLog(`Using stem-audio URL: ${stemAudioUrl}`);
      
      // Also fetch from API for comparison in debug results
      try {
        const response = await fetch(`/api/get-stem-url?name=${encodeURIComponent(stemName)}&track=${encodeURIComponent(trackTitle)}`);
        const data = await response.json();
        setApiResponse(data);
        addLog(`API response received (shown in Debug Results)`);
      } catch (error) {
        addLog(`Error fetching from API: ${error}`);
      }
      
      return;
    } catch (error) {
      addLog(`Error testing URL: ${error}`);
      console.error('Error testing URL:', error);
    }
  };
  
  // Play the audio
  const playAudio = () => {
    if (!audioRef.current || !currentAudioUrl) {
      addLog('No audio element or URL available');
      return;
    }
    
    try {
      // The stem-audio endpoint always works directly without redirects
      audioRef.current.src = currentAudioUrl;
      audioRef.current.load();
      audioRef.current.play().catch(error => {
        addLog(`Error playing audio: ${error.message}`);
      });
      setIsPlaying(true);
    } catch (error) {
      addLog(`Error setting up audio: ${error}`);
      console.error('Error setting up audio:', error);
    }
  };
  
  // Stop the audio
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };
  
  // Check if the current URL is valid
  const checkUrlValidity = async () => {
    if (!currentAudioUrl) {
      addLog('No URL to check');
      return;
    }
    
    try {
      // Special case for generate-stem URLs - they should always be valid
      if (currentAudioUrl.includes('/api/generate-stem')) {
        setIsUrlValid(true);
        addLog(`URL is valid (generate-stem): ${currentAudioUrl}`);
        return;
      }
      
      // For proxy URLs, check if it gets redirected to generate-stem
      if (currentAudioUrl.includes('/api/proxy-media')) {
        const response = await fetch(currentAudioUrl, { method: 'HEAD' });
        if (response.redirected && response.url.includes('/api/generate-stem')) {
          setIsUrlValid(true);
          addLog(`URL redirected to generate-stem: ${response.url}`);
          // Update the current URL to the redirected one
          setCurrentAudioUrl(response.url);
          return;
        }
      }
      
      // Normal URL validation
      const response = await fetch(currentAudioUrl, { method: 'HEAD' });
      setIsUrlValid(response.ok);
      
      if (response.ok) {
        addLog(`URL is valid: ${currentAudioUrl}`);
      } else {
        addLog(`URL returned status ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setIsUrlValid(false);
      addLog(`Error checking URL: ${error}`);
      console.error('Error checking URL:', error);
    }
  };
  
  // Refresh available audio files
  const refreshAudioFiles = async () => {
    try {
      addLog('Refreshing audio files...');
      
      const validFiles = [];
      
      // Try the get-stem-url API for the current track/stem
      try {
        const response = await fetch(`/api/get-stem-url?name=${encodeURIComponent(stemName)}&track=${encodeURIComponent(trackTitle)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            // Verify the URL is accessible
            try {
              const urlCheck = await fetch(data.url, { method: 'HEAD' });
              if (urlCheck.ok) {
                validFiles.push({
                  url: data.url,
                  name: `${stemName} - ${trackTitle} (from API)`,
                  type: 'api'
                });
              }
            } catch (error) {
              console.error('Error checking URL from API:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error calling get-stem-url API:', error);
      }
      
      // Always check generate-stem API for the current selection
      try {
        const generateUrl = `/api/generate-stem?name=${encodeURIComponent(stemName)}&track=${encodeURIComponent(trackTitle)}`;
        const response = await fetch(generateUrl, { method: 'HEAD' });
        if (response.ok) {
          validFiles.push({
            url: generateUrl,
            name: `${stemName} - ${trackTitle} (Generated)`,
            type: 'generated'
          });
        }
      } catch (error) {
        console.error('Error checking generate-stem API:', error);
      }
      
      setAvailableFiles(validFiles);
      addLog(`Refreshed audio files: found ${validFiles.length} files`);
    } catch (error) {
      console.error('Error refreshing audio files:', error);
      addLog(`Error refreshing audio files: ${error}`);
    }
  };
  
  // Update URL when stem or track changes
  useEffect(() => {
    if (currentAudioUrl) {
      checkUrlValidity();
    }
  }, [currentAudioUrl]);
  
  // Initial load
  useEffect(() => {
    testStemUrl();
    refreshAudioFiles();
  }, []);
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Stem Audio Debug Tool</h1>
      
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block mb-2">Stem Name</label>
          <select 
            className="w-full p-2 bg-gray-800 rounded"
            value={stemName}
            onChange={(e) => setStemName(e.target.value)}
          >
            {stemOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block mb-2">Track Title</label>
          <select 
            className="w-full p-2 bg-gray-800 rounded"
            value={trackTitle}
            onChange={(e) => setTrackTitle(e.target.value)}
          >
            {trackOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex gap-4 mb-8">
        <button 
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          onClick={testStemUrl}
        >
          Test Stem URL
        </button>
        
        <button 
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          onClick={playAudio}
          disabled={!currentAudioUrl || isPlaying}
        >
          Play Audio
        </button>
        
        <button 
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          onClick={stopAudio}
          disabled={!isPlaying}
        >
          Stop Audio
        </button>
        
        <button 
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
          onClick={refreshAudioFiles}
        >
          Refresh Audio Files
        </button>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2">Current Audio URL</h2>
        <div className="p-4 bg-gray-900 rounded flex items-center">
          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${isUrlValid ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="overflow-auto">{currentAudioUrl || 'No URL set'}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Debug Results</h2>
          <pre className="p-4 bg-gray-900 rounded h-80 overflow-auto">
            {apiResponse && JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-2">Log Messages</h2>
          <div className="p-4 bg-gray-900 rounded h-80 overflow-auto text-sm">
            {logs.map((log, index) => (
              <div key={index} className={`mb-1 ${log.includes('Error') ? 'text-red-400' : log.includes('valid') ? 'text-green-400' : 'text-white'}`}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Available Audio Files ({availableFiles.length})</h2>
        {availableFiles.length === 0 ? (
          <div className="p-4 bg-gray-900 rounded">No audio files found</div>
        ) : (
          <div className="grid grid-cols-1 gap-2 mt-4">
            {availableFiles.map((file, index) => (
              <div key={index} className="p-2 bg-gray-800 rounded text-sm flex justify-between">
                <span>{file.name}</span>
                <span className="text-gray-400">{file.url}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        src={currentAudioUrl} 
        onEnded={() => setIsPlaying(false)}
        onError={(e) => {
          addLog(`Error loading audio: ${(e.target as HTMLAudioElement).error?.message || 'Unknown error'}`);
          setIsPlaying(false);
        }}
      />
    </div>
  );
} 