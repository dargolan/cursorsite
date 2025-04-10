'use client';

interface AudioPlayOptions {
  trackId: string;
}

class GlobalAudioManager {
  private currentlyPlaying: HTMLAudioElement | null = null;
  private currentTrackId: string | null = null;
  private listeners: Set<(trackId: string | null) => void> = new Set();

  play(audio: HTMLAudioElement, options: AudioPlayOptions): void {
    // If we're already playing this audio, do nothing
    if (this.currentlyPlaying === audio) return;

    // If something else is playing, pause it
    if (this.currentlyPlaying) {
      this.currentlyPlaying.pause();
    }

    // Set the current audio and play it
    this.currentlyPlaying = audio;
    this.currentTrackId = options.trackId;
    
    // Notify listeners before playing
    this.notifyListeners();
    
    // Play the audio
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      this.currentlyPlaying = null;
      this.currentTrackId = null;
      this.notifyListeners();
    });

    // Set up event listener for when audio ends
    audio.addEventListener('ended', this.handleAudioEnded);
  }

  pause(): void {
    if (this.currentlyPlaying) {
      this.currentlyPlaying.pause();
      // Don't reset currentlyPlaying because we might want to resume
    }
  }

  stop(): void {
    if (this.currentlyPlaying) {
      this.currentlyPlaying.pause();
      this.currentlyPlaying.currentTime = 0;
      this.currentlyPlaying.removeEventListener('ended', this.handleAudioEnded);
      this.currentlyPlaying = null;
      this.currentTrackId = null;
      this.notifyListeners();
    }
  }

  getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }

  isPlaying(trackId: string): boolean {
    return this.currentTrackId === trackId && !!this.currentlyPlaying;
  }

  subscribe(listener: (trackId: string | null) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private handleAudioEnded = (): void => {
    if (this.currentlyPlaying) {
      this.currentlyPlaying.removeEventListener('ended', this.handleAudioEnded);
      this.currentlyPlaying = null;
      this.currentTrackId = null;
      this.notifyListeners();
    }
  };

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener(this.currentTrackId);
    });
  }
}

// Create a singleton instance
export const globalAudioManager = new GlobalAudioManager(); 