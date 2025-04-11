// Global audio manager to ensure only one audio source plays at a time
class GlobalAudioManager {
  private activeAudio: HTMLAudioElement | null = null;
  private activeStemId: string | null = null;
  private activeTrackId: string | null = null;

  // Play an audio element and stop any currently playing audio
  play(audio: HTMLAudioElement, info?: { stemId?: string; trackId?: string }) {
    // Stop any currently playing audio
    if (this.activeAudio && this.activeAudio !== audio && !this.activeAudio.paused) {
      this.activeAudio.pause();
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

  // Stop the currently playing audio
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
}

export const globalAudioManager = new GlobalAudioManager(); 