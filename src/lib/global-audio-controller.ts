'use client';

/**
 * Global Audio Controller
 * 
 * This singleton manages all audio playback across the site
 * to ensure only one audio source plays at a time.
 */

class GlobalAudioController {
  private static instance: GlobalAudioController;
  private currentAudio: HTMLAudioElement | null = null;
  private subscribers: Set<(isPlaying: boolean) => void> = new Set();

  private constructor() {
    // Initialize event listeners for global audio control
    if (typeof window !== 'undefined') {
      // Listen for space key to pause/play current audio
      window.addEventListener('keydown', this.handleKeyPress.bind(this));
    }
  }

  public static getInstance(): GlobalAudioController {
    if (!GlobalAudioController.instance) {
      GlobalAudioController.instance = new GlobalAudioController();
    }
    return GlobalAudioController.instance;
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
  public play(audio: HTMLAudioElement): Promise<void> {
    // Check if audio playback is being prevented by stem operations
    if (!this.isSafeToPlayAudio()) {
      return Promise.resolve();
    }
    
    // Stop any currently playing audio
    this.stopCurrent();
    
    // Set and play the new audio
    this.currentAudio = audio;
    
    // Notify subscribers that audio is playing
    this.notifySubscribers(true);
    
    return audio.play();
  }

  /**
   * Pauses the currently playing audio
   */
  public pause(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.notifySubscribers(false);
    }
  }

  /**
   * Stops the currently playing audio and resets it
   */
  public stopCurrent(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.notifySubscribers(false);
    }
  }

  /**
   * Toggle play/pause for the current audio
   */
  public toggle(): void {
    // Check if audio playback is being prevented
    if (!this.isSafeToPlayAudio()) {
      return;
    }
    
    if (!this.currentAudio) return;
    
    if (this.currentAudio.paused) {
      this.currentAudio.play();
      this.notifySubscribers(true);
    } else {
      this.currentAudio.pause();
      this.notifySubscribers(false);
    }
  }

  /**
   * Checks if any audio is currently playing
   */
  public isPlaying(): boolean {
    return this.currentAudio ? !this.currentAudio.paused : false;
  }

  /**
   * Handle keypress events (space bar for play/pause)
   */
  private handleKeyPress(event: KeyboardEvent): void {
    // Only handle space key when not in an input field
    if (event.code === 'Space' && 
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) {
      event.preventDefault();
      this.toggle();
    }
  }

  /**
   * Subscribe to playback state changes
   */
  public subscribe(callback: (isPlaying: boolean) => void): () => void {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of playback state changes
   */
  private notifySubscribers(isPlaying: boolean): void {
    this.subscribers.forEach(callback => {
      callback(isPlaying);
    });
  }
}

// Export singleton instance
export const globalAudioController = GlobalAudioController.getInstance(); 