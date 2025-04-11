// Global audio manager to ensure only one audio source plays at a time
class AudioManager {
  private static instance: AudioManager;
  private activeAudio: HTMLAudioElement | null = null;
  private activeStemId: string | null = null;
  private activeTrackId: string | null = null;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  play(audio: HTMLAudioElement, info?: { stemId?: string; trackId?: string }) {
    // Stop any currently playing audio
    if (this.activeAudio && this.activeAudio !== audio && !this.activeAudio.paused) {
      console.log('Stopping previously playing audio');
      this.activeAudio.pause();
      
      // Reset currentTime if needed
      this.activeAudio.currentTime = 0;
      
      // Dispatch custom event for stem stopped
      if (this.activeStemId) {
        const event = new CustomEvent('stem-stopped', {
          detail: {
            stemId: this.activeStemId,
            trackId: this.activeTrackId
          }
        });
        document.dispatchEvent(event);
      }
    }
    
    // Set new active audio
    this.activeAudio = audio;
    this.activeStemId = info?.stemId || null;
    this.activeTrackId = info?.trackId || null;
    
    // Play the new audio
    audio.play().catch(err => {
      console.error('Error playing audio:', err);
    });
  }

  stop() {
    if (this.activeAudio && !this.activeAudio.paused) {
      this.activeAudio.pause();
      
      // Dispatch custom event if it's a stem
      if (this.activeStemId) {
        const event = new CustomEvent('stem-stopped', {
          detail: {
            stemId: this.activeStemId,
            trackId: this.activeTrackId
          }
        });
        document.dispatchEvent(event);
      }
    }
    
    this.activeAudio = null;
    this.activeStemId = null;
    this.activeTrackId = null;
  }

  isPlaying(audio: HTMLAudioElement): boolean {
    return this.activeAudio === audio && !audio.paused;
  }

  getCurrentTime(): number {
    return this.activeAudio?.currentTime || 0;
  }

  getDuration(): number {
    return this.activeAudio?.duration || 0;
  }
}

export const audioManager = AudioManager.getInstance(); 