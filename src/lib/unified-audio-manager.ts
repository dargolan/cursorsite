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

class UnifiedAudioManager {
  private static instance: UnifiedAudioManager;
  
  // Current audio state
  private currentAudio: HTMLAudioElement | null = null;
  private activeStemId: string | null = null;
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
          stemId: this.activeStemId,
          time: this.currentAudio.currentTime
        });
      }
    }, 250); // Update every 250ms for efficiency
  }

  /**
   * Check if it's safe to play audio right now
   */
  public isSafeToPlayAudio(): boolean {
    // Check the global flag
    if ((window as any).preventStemAudioPlay) {
      console.log('Audio playback prevented by stem operation flag');
      return false;
    }
    
    // Check if we're in a cart operation
    const now = Date.now();
    const lastCartOperation = (window as any).lastCartOperationTime || 0;
    if (now - lastCartOperation < 1000) { // 1000ms safety window
      console.log('Audio playback prevented by recent cart operation');
      return false;
    }
    
    return true;
  }

  /**
   * Plays an audio element and stops any currently playing audio
   */
  public play(audio: HTMLAudioElement, options?: AudioPlayOptions): Promise<void> {
    // Check if it's safe to play audio
    if (!this.isSafeToPlayAudio()) {
      return Promise.resolve();
    }
    
    // Stop any currently playing audio
    if (this.currentAudio && this.currentAudio !== audio && !this.currentAudio.paused) {
      console.log('Stopping previously playing audio');
      this.currentAudio.pause();
      
      // Reset currentTime
      this.currentAudio.currentTime = 0;
      
      // Dispatch custom event for stem stopped
      if (this.activeStemId) {
        this.dispatchStemStoppedEvent(this.activeStemId, this.activeTrackId);
      }
    }
    
    // Set new active audio
    this.currentAudio = audio;
    this.activeStemId = options?.stemId || null;
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
      stemId: this.activeStemId,
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
        stemId: this.activeStemId,
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
      
      // Dispatch custom event if it's a stem
      if (this.activeStemId) {
        this.dispatchStemStoppedEvent(this.activeStemId, this.activeTrackId);
      }
      
      // Dispatch stop event
      this.dispatchEvent({
        type: 'stop',
        trackId: this.activeTrackId,
        stemId: this.activeStemId
      });
      
      // Notify subscribers
      this.notifyPlaybackSubscribers(false);
    }
    
    this.currentAudio = null;
    this.activeStemId = null;
    this.activeTrackId = null;
  }

  /**
   * Toggle play/pause for the current audio
   */
  public toggle(): void {
    // Check if it's safe to play audio
    if (!this.isSafeToPlayAudio()) {
      return;
    }
    
    if (!this.currentAudio) return;
    
    if (this.currentAudio.paused) {
      this.currentAudio.play();
      this.notifyPlaybackSubscribers(true);
      
      // Dispatch play event
      this.dispatchEvent({
        type: 'play',
        trackId: this.activeTrackId,
        stemId: this.activeStemId,
        time: this.currentAudio.currentTime
      });
    } else {
      this.currentAudio.pause();
      this.notifyPlaybackSubscribers(false);
      
      // Dispatch pause event
      this.dispatchEvent({
        type: 'pause',
        trackId: this.activeTrackId,
        stemId: this.activeStemId,
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
   * Check if a specific stem or track is currently playing
   */
  public isPlayingItem(info: { stemId?: string, trackId?: string }): boolean {
    if (!this.isPlaying()) {
      return false;
    }
    
    if (info.stemId && this.activeStemId === info.stemId) {
      return true;
    }
    
    if (info.trackId && this.activeTrackId === info.trackId && !this.activeStemId) {
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
   * Create a new audio element with proper settings
   */
  public createAudio(url: string, options?: { 
    stemName?: string, 
    trackTitle?: string,
    stemId?: string,
    trackId?: string
  }): HTMLAudioElement {
    const audio = new Audio(url);
    
    // Set cross-origin attribute to avoid CORS issues
    audio.crossOrigin = 'anonymous';
    
    // Add data attributes for identification
    if (options?.stemName) {
      audio.dataset.stem = options.stemName;
    }
    
    if (options?.trackTitle) {
      audio.dataset.track = options.trackTitle;
    }
    
    if (options?.stemId) {
      audio.dataset.stemId = options.stemId;
    }
    
    if (options?.trackId) {
      audio.dataset.trackId = options.trackId;
    }
    
    return audio;
  }

  /**
   * Handle keypress events (space bar for play/pause)
   */
  private handleKeyPress = (event: KeyboardEvent): void => {
    // Only handle space key when not in an input field
    if (event.code === 'Space' && 
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) {
      event.preventDefault();
      this.toggle();
    }
  };
  
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
   * Notify all playback subscribers of state changes
   */
  private notifyPlaybackSubscribers(isPlaying: boolean): void {
    this.playbackSubscribers.forEach(callback => {
      callback(isPlaying);
    });
  }

  /**
   * Dispatch an event to all subscribers
   */
  private dispatchEvent(event: AudioEvent): void {
    this.eventSubscribers.forEach(listener => {
      listener(event);
    });
  }

  /**
   * Clean up resources when no longer needed
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