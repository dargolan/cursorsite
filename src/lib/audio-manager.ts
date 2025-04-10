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

class GlobalAudioManager {
  private currentlyPlaying: HTMLAudioElement | null = null;
  private currentTrackId: string | null = null;
  private currentStemId: string | null = null;
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
      if (this.currentlyPlaying && !this.currentlyPlaying.paused) {
        this.dispatchEvent({
          type: 'timeupdate',
          trackId: this.currentTrackId,
          stemId: this.currentStemId,
          time: this.currentlyPlaying.currentTime
        });
      }
    }, 250); // Update every 250ms for efficiency
  }

  play(audio: HTMLAudioElement, options: AudioPlayOptions = {}): void {
    // If we're already playing this audio, just update seek time if provided
    if (this.currentlyPlaying === audio) {
      if (options.seekTime !== undefined) {
        this.currentlyPlaying.currentTime = options.seekTime;
      }
      return;
    }

    // If something else is playing, stop it
    if (this.currentlyPlaying) {
      this.stop();
    }

    // Set the current audio and options
    this.currentlyPlaying = audio;
    this.currentTrackId = options.trackId || null;
    this.currentStemId = options.stemId || null;
    
    // Set seek time if provided
    if (options.seekTime !== undefined) {
      this.currentlyPlaying.currentTime = options.seekTime;
    }

    // Notify listeners before playing
    this.notifyStateListeners();
    
    // Play the audio
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      this.currentlyPlaying = null;
      this.currentTrackId = null;
      this.currentStemId = null;
      this.notifyStateListeners();
    });

    // Dispatch play event
    this.dispatchEvent({
      type: 'play',
      trackId: this.currentTrackId,
      stemId: this.currentStemId
    });

    // Set up event listeners
    audio.addEventListener('ended', this.handleAudioEnded);
  }

  pause(): void {
    if (this.currentlyPlaying) {
      this.currentlyPlaying.pause();
      
      // Dispatch pause event
      this.dispatchEvent({
        type: 'pause',
        trackId: this.currentTrackId,
        stemId: this.currentStemId
      });
    }
  }

  stop(): void {
    if (this.currentlyPlaying) {
      this.currentlyPlaying.pause();
      this.currentlyPlaying.currentTime = 0;
      this.currentlyPlaying.removeEventListener('ended', this.handleAudioEnded);
      
      const trackId = this.currentTrackId;
      const stemId = this.currentStemId;
      
      this.currentlyPlaying = null;
      this.currentTrackId = null;
      this.currentStemId = null;
      
      // Notify listeners
      this.notifyStateListeners();
      
      // Dispatch stop event
      this.dispatchEvent({
        type: 'stop',
        trackId,
        stemId
      });
    }
  }

  seek(time: number): void {
    if (this.currentlyPlaying) {
      this.currentlyPlaying.currentTime = time;
    }
  }

  getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }

  getCurrentStemId(): string | null {
    return this.currentStemId;
  }

  isPlaying(trackId?: string, stemId?: string): boolean {
    if (trackId && stemId) {
      return this.currentTrackId === trackId && this.currentStemId === stemId && this.currentlyPlaying !== null && !this.currentlyPlaying.paused;
    }
    if (trackId) {
      return this.currentTrackId === trackId && this.currentlyPlaying !== null && !this.currentlyPlaying.paused;
    }
    return this.currentlyPlaying !== null && !this.currentlyPlaying.paused;
  }

  getCurrentTime(): number {
    return this.currentlyPlaying?.currentTime || 0;
  }

  getDuration(): number {
    return this.currentlyPlaying?.duration || 0;
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

  private handleAudioEnded = (): void => {
    if (this.currentlyPlaying) {
      this.currentlyPlaying.removeEventListener('ended', this.handleAudioEnded);
      
      const trackId = this.currentTrackId;
      const stemId = this.currentStemId;
      
      this.currentlyPlaying = null;
      this.currentTrackId = null;
      this.currentStemId = null;
      
      // Notify listeners
      this.notifyStateListeners();
      
      // Dispatch ended event
      this.dispatchEvent({
        type: 'ended',
        trackId,
        stemId
      });
    }
  };

  private notifyStateListeners(): void {
    this.stateListeners.forEach(listener => {
      listener(this.currentTrackId);
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

// Create a singleton instance
export const globalAudioManager = new GlobalAudioManager(); 