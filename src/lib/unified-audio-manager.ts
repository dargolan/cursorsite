'use client';

/**
 * Unified Audio Manager
 * 
 * This singleton manages all audio playback across the site 
 * to ensure only one audio source plays at a time.
 * It combines the functionality of global-audio-controller and audioManager.
 */

export interface AudioPlayOptions {
  trackId?: string;
  seekTime?: number;
}

export interface AudioEvent {
  type: 'play' | 'pause' | 'stop' | 'ended' | 'timeupdate';
  trackId: string | null;
  time?: number;
}

type AudioEventListener = (event: AudioEvent) => void;

class UnifiedAudioManager {
  private static instance: UnifiedAudioManager;
  
  // Current audio state
  private currentAudio: HTMLAudioElement | null = null;
  private activeTrackId: string | null = null;
  
  // Subscribers
  private playbackSubscribers: Set<(isPlaying: boolean) => void> = new Set();
  private eventSubscribers: Set<AudioEventListener> = new Set();
  
  // Time update interval
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Initialize event listeners for global audio control
    if (typeof window !== 'undefined') {
      // Listen for space key to pause/play current audio
      window.addEventListener('keydown', this.handleKeyPress);
      
      // Start time update interval
      this.startTimeUpdateInterval();
    }
  }

  public static getInstance(): UnifiedAudioManager {
    if (!UnifiedAudioManager.instance) {
      UnifiedAudioManager.instance = new UnifiedAudioManager();
    }
    return UnifiedAudioManager.instance;
  }
  
  private startTimeUpdateInterval(): void {
    // Clear any existing interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Set up interval to emit time updates
    this.updateInterval = setInterval(() => {
      if (this.currentAudio && !this.currentAudio.paused) {
        this.dispatchEvent({
          type: 'timeupdate',
          trackId: this.activeTrackId,
          time: this.currentAudio.currentTime
        });
      }
    }, 250); // Update every 250ms for efficiency
  }

  /**
   * Plays an audio element and stops any currently playing audio
   */
  public play(audio: HTMLAudioElement, options?: AudioPlayOptions): Promise<void> {
    // Stop any currently playing audio
    if (this.currentAudio && this.currentAudio !== audio && !this.currentAudio.paused) {
      console.log('Stopping previously playing audio');
      this.currentAudio.pause();
      
      // Reset currentTime
      this.currentAudio.currentTime = 0;
    }
    
    // Set new active audio
    this.currentAudio = audio;
    this.activeTrackId = options?.trackId || null;
    
    // Set seek time if provided
    if (options?.seekTime !== undefined && audio) {
      audio.currentTime = options.seekTime;
    }
    
    // Notify subscribers that audio is playing
    this.notifyPlaybackSubscribers(true);
    
    // Dispatch play event
    this.dispatchEvent({
      type: 'play',
      trackId: this.activeTrackId,
      time: audio.currentTime
    });
    
    // Play the audio
    return audio.play().catch(err => {
      console.error('Error playing audio:', err);
      this.notifyPlaybackSubscribers(false);
      throw err;
    });
  }

  /**
   * Pauses the currently playing audio
   */
  public pause(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      
      // Notify subscribers
      this.notifyPlaybackSubscribers(false);
      
      // Dispatch pause event
      this.dispatchEvent({
        type: 'pause',
        trackId: this.activeTrackId,
        time: this.currentAudio.currentTime
      });
    }
  }

  /**
   * Stops the currently playing audio and resets it
   */
  public stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      
      // Dispatch stop event
      this.dispatchEvent({
        type: 'stop',
        trackId: this.activeTrackId
      });
      
      // Notify subscribers
      this.notifyPlaybackSubscribers(false);
    }
    
    this.currentAudio = null;
    this.activeTrackId = null;
  }

  /**
   * Toggle play/pause for the current audio
   */
  public toggle(): void {
    if (!this.currentAudio) return;
    
    if (this.currentAudio.paused) {
      this.currentAudio.play();
      this.notifyPlaybackSubscribers(true);
      
      // Dispatch play event
      this.dispatchEvent({
        type: 'play',
        trackId: this.activeTrackId,
        time: this.currentAudio.currentTime
      });
    } else {
      this.currentAudio.pause();
      this.notifyPlaybackSubscribers(false);
      
      // Dispatch pause event
      this.dispatchEvent({
        type: 'pause',
        trackId: this.activeTrackId,
        time: this.currentAudio.currentTime
      });
    }
  }

  /**
   * Checks if any audio is currently playing
   */
  public isPlaying(): boolean {
    return this.currentAudio ? !this.currentAudio.paused : false;
  }
  
  /**
   * Check if a specific track is currently playing
   */
  public isPlayingItem(info: { trackId?: string }): boolean {
    if (!this.isPlaying()) {
      return false;
    }
    
    if (info.trackId && this.activeTrackId === info.trackId) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Get current playback time
   */
  public getCurrentTime(): number {
    return this.currentAudio?.currentTime || 0;
  }

  /**
   * Get total duration of current audio
   */
  public getDuration(): number {
    return this.currentAudio?.duration || 0;
  }

  /**
   * Set current time for active audio
   */
  public seek(time: number): void {
    if (this.currentAudio) {
      this.currentAudio.currentTime = Math.max(0, Math.min(time, this.currentAudio.duration || 0));
    }
  }
  
  /**
   * Create a new audio element with the given URL
   */
  public createAudio(url: string, options?: { 
    trackTitle?: string,
    trackId?: string
  }): HTMLAudioElement {
    const audio = new Audio(url);
    
    // Set cross-origin attribute for CORS requests
    audio.crossOrigin = "anonymous";
    
    // Add metadata attributes
    if (options?.trackTitle) {
      audio.dataset.trackTitle = options.trackTitle;
    }
    
    if (options?.trackId) {
      audio.dataset.trackId = options.trackId;
    }
    
    // Add ended event listener
    audio.addEventListener('ended', () => {
      // Dispatch ended event
      this.dispatchEvent({
        type: 'ended',
        trackId: options?.trackId || null
      });
      
      // Notify subscribers that playback has stopped
      this.notifyPlaybackSubscribers(false);
    });
    
    return audio;
  }
  
  /**
   * Handle space key press to toggle play/pause
   */
  private handleKeyPress = (event: KeyboardEvent): void => {
    // Only handle space key when not in an input field
    if (
      event.code === 'Space' && 
      document.activeElement?.tagName !== 'INPUT' && 
      document.activeElement?.tagName !== 'TEXTAREA'
    ) {
      event.preventDefault();
      this.toggle();
    }
  };
  
  /**
   * Subscribe to playback state changes
   */
  public subscribe(callback: (isPlaying: boolean) => void): () => void {
    this.playbackSubscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.playbackSubscribers.delete(callback);
    };
  }
  
  /**
   * Subscribe to audio events
   */
  public addEventListener(listener: AudioEventListener): () => void {
    this.eventSubscribers.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.eventSubscribers.delete(listener);
    };
  }
  
  /**
   * Notify all playback subscribers of state change
   */
  private notifyPlaybackSubscribers(isPlaying: boolean): void {
    this.playbackSubscribers.forEach(callback => {
      callback(isPlaying);
    });
  }
  
  /**
   * Dispatch event to all event subscribers
   */
  private dispatchEvent(event: AudioEvent): void {
    this.eventSubscribers.forEach(listener => {
      listener(event);
    });
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyPress);
    }
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.stop();
    this.playbackSubscribers.clear();
    this.eventSubscribers.clear();
  }
}

// Export a singleton instance
export const unifiedAudioManager = UnifiedAudioManager.getInstance(); 