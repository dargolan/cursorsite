/**
 * Global audio manager to handle playback control across the application
 * Ensures only one audio source plays at a time and provides events for UI sync
 */

'use client';

interface AudioPlayOptions {
  trackId?: string;
  stemId?: string;
  seekTime?: number;
}

export interface AudioEvent {
  type: 'play' | 'pause' | 'stop' | 'ended' | 'timeupdate';
  trackId: string | null;
  stemId: string | null;
  time?: number;
}

type AudioEventListener = (event: AudioEvent) => void;

type PlayInfo = {
  stemId?: string;
  trackId?: string;
};

class AudioManager {
  activeAudio: HTMLAudioElement | null = null;
  activeStemId: string | null = null;
  activeTrackId: string | null = null;
  private stateListeners: Set<(trackId: string | null) => void> = new Set();
  private eventListeners: Set<AudioEventListener> = new Set();
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize time update interval
    this.startTimeUpdateInterval();
  }

  private startTimeUpdateInterval(): void {
    // Clear any existing interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Set up interval to emit time updates
    this.updateInterval = setInterval(() => {
      if (this.activeAudio && !this.activeAudio.paused) {
        this.dispatchEvent({
          type: 'timeupdate',
          trackId: this.activeTrackId,
          stemId: this.activeStemId,
          time: this.activeAudio.currentTime
        });
      }
    }, 250); // Update every 250ms for efficiency
  }

  /**
   * Play an audio element and stop any currently playing audio
   */
  play(audio: HTMLAudioElement, info?: PlayInfo): Promise<void> {
    // Stop any currently playing audio
    if (this.activeAudio && this.activeAudio !== audio && !this.activeAudio.paused) {
      console.log('Stopping previously playing audio');
      this.activeAudio.pause();
      
      // Reset currentTime
      this.activeAudio.currentTime = 0;
      
      // Dispatch custom event for stem stopped
      if (this.activeStemId) {
        this.dispatchStemStoppedEvent(this.activeStemId, this.activeTrackId);
      }
    }
    
    // Set new active audio
    this.activeAudio = audio;
    this.activeStemId = info?.stemId || null;
    this.activeTrackId = info?.trackId || null;
    
    // Play the new audio
    return audio.play().catch(err => {
      console.error('Error playing audio:', err);
    });
  }
  
  /**
   * Stop the currently playing audio
   */
  stop(): void {
    if (this.activeAudio && !this.activeAudio.paused) {
      this.activeAudio.pause();
      
      // Dispatch custom event if it's a stem
      if (this.activeStemId) {
        this.dispatchStemStoppedEvent(this.activeStemId, this.activeTrackId);
      }
    }
    
    this.activeAudio = null;
    this.activeStemId = null;
    this.activeTrackId = null;
  }

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    return this.activeAudio?.currentTime || 0;
  }

  /**
   * Get total duration of current audio
   */
  getDuration(): number {
    return this.activeAudio?.duration || 0;
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying(): boolean {
    return this.activeAudio ? !this.activeAudio.paused : false;
  }

  /**
   * Set current time for active audio
   */
  setCurrentTime(time: number): void {
    if (this.activeAudio) {
      this.activeAudio.currentTime = time;
    }
  }

  /**
   * Helper to dispatch stem stopped event
   */
  private dispatchStemStoppedEvent(stemId: string | null, trackId: string | null): void {
    const event = new CustomEvent('stem-stopped', {
      detail: {
        stemId,
        trackId
      }
    });
    document.dispatchEvent(event);
  }

  // Legacy subscribe method for backward compatibility
  subscribe(listener: (trackId: string | null) => void): () => void {
    this.stateListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  // New event-based subscription model
  addEventListener(listener: AudioEventListener): () => void {
    this.eventListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  private notifyStateListeners(): void {
    this.stateListeners.forEach(listener => {
      listener(this.activeTrackId);
    });
  }

  private dispatchEvent(event: AudioEvent): void {
    this.eventListeners.forEach(listener => {
      listener(event);
    });
  }

  // Clean up resources when no longer needed
  dispose(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.stop();
    this.stateListeners.clear();
    this.eventListeners.clear();
  }
}

// Export a singleton instance
export const audioManager = new AudioManager(); 