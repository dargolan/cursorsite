'use client';

import { useState, useEffect } from 'react';
import { getTracksNeedingMigration, migrateTrackMetadata } from '@/utils/strapi-integration';
import { extractTrackMetadata } from '@/utils/audio-metadata-extractor';

interface Track {
  id: string;
  attributes: {
    Title: string;
    AudioPreview: {
      data: {
        attributes: {
          url: string;
        }
      }
    };
  };
}

export default function MigratePage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [logs, setLogs] = useState<string[]>([]);

  // Add log with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  // Fetch tracks that need migration
  useEffect(() => {
    async function fetchTracks() {
      try {
        addLog('Fetching all tracks...');
        const response = await getTracksNeedingMigration();

        if (!response?.data) {
          throw new Error('No data received from API');
        }

        // Process each track
        const tracksData = response.data.map((track: any) => {
          console.log('Processing track:', track);
          
          // Extract title and audio URL safely
          const title = track.attributes?.Title || 'Untitled Track';
          const audioPreview = track.attributes?.AudioPreview?.data?.attributes?.url;
          
          addLog(`Found track: ${title}${audioPreview ? '' : ' (no audio)'}`);
          
          return {
            id: track.id,
            attributes: {
              Title: title,
              AudioPreview: track.attributes?.AudioPreview
            }
          };
        });

        console.log('Processed tracks:', tracksData);
        setTracks(tracksData);
        addLog(`Found ${tracksData.length} tracks total`);
      } catch (error) {
        console.error('Fetch error:', error);
        addLog(`Error fetching tracks: ${error}`);
      } finally {
        setLoading(false);
      }
    }

    fetchTracks();
  }, []);

  // Handle migration of a single track
  async function migrateTrack(track: Track) {
    try {
      const title = track.attributes?.Title || 'Untitled Track';
      addLog(`Starting migration for "${title}"`);

      // Debug the track structure
      console.log('Track data:', JSON.stringify(track, null, 2));

      // Safely access the audio URL
      const audioPreview = track.attributes?.AudioPreview?.data?.attributes?.url;
      if (!audioPreview) {
        throw new Error(`Missing audio URL for track "${title}"`);
      }

      // Get the full URL if it's a relative URL
      const fullAudioUrl = audioPreview.startsWith('http') 
        ? audioPreview 
        : `${process.env.NEXT_PUBLIC_STRAPI_API_URL}${audioPreview}`;

      addLog(`Audio URL: ${fullAudioUrl}`);

      // Download the audio file
      addLog(`Downloading audio for "${title}"`);
      const audioResponse = await fetch(fullAudioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to download audio file: ${audioResponse.statusText}`);
      }

      const audioBlob = await audioResponse.blob();
      const audioFile = new File([audioBlob], 'track.mp3', { type: 'audio/mpeg' });

      // Extract metadata
      addLog(`Extracting metadata for "${title}"`);
      const metadata = await extractTrackMetadata(audioFile);
      addLog(`Extracted metadata for "${title}" - Duration: ${metadata.duration.toFixed(2)}s, BPM: ${metadata.bpm || 'unknown'}`);

      // Update track in Strapi
      addLog(`Updating "${title}" in Strapi`);
      await migrateTrackMetadata(track.id, metadata);
      addLog(`Successfully migrated "${title}"`);

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const title = track.attributes?.Title || 'Unknown track';
      addLog(`Failed to migrate "${title}": ${errorMessage}`);
      console.error('Migration error:', error);
      return false;
    }
  }

  // Handle migration of all tracks
  async function handleMigrateAll() {
    if (migrating) return;
    
    setMigrating(true);
    setProgress({ current: 0, total: tracks.length });

    try {
      addLog('Starting migration of all tracks...');

      let successCount = 0;
      let failureCount = 0;

      for (const track of tracks) {
        const success = await migrateTrack(track);
        if (success) {
          successCount++;
        } else {
          failureCount++;
        }
        setProgress(prev => ({ ...prev, current: prev.current + 1 }));
      }

      addLog(`Migration completed! ${successCount} succeeded, ${failureCount} failed`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Migration error: ${errorMessage}`);
      console.error('Migration error:', error);
    } finally {
      setMigrating(false);
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Track Migration</h1>
      
      {/* Status Section */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">Status</h2>
        <p>Total tracks: {tracks.length}</p>
        {migrating && (
          <div className="mt-2">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-sm mt-1">
              Progress: {progress.current} / {progress.total}
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mb-6">
        <button
          onClick={handleMigrateAll}
          disabled={loading || migrating || tracks.length === 0}
          className={`px-4 py-2 rounded ${
            loading || migrating || tracks.length === 0
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {migrating ? 'Migrating...' : 'Migrate All Tracks'}
        </button>
      </div>

      {/* Track List */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">Tracks</h2>
        {loading ? (
          <p>Loading tracks...</p>
        ) : tracks.length === 0 ? (
          <p>No tracks found!</p>
        ) : (
          <ul className="space-y-2">
            {tracks.map(track => (
              <li key={track.id} className="flex items-center justify-between">
                <span>{track.attributes?.Title || 'Untitled Track'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Logs */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-2">Logs</h2>
        <div className="bg-gray-900 rounded p-2 h-60 overflow-y-auto">
          {logs.map((log, index) => (
            <p key={index} className="font-mono text-sm">{log}</p>
          ))}
        </div>
      </div>
    </div>
  );
} 