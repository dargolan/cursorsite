import { Stem } from '../types';

// Basic event emitter
type Listener<T> = (payload: T) => void;
class EventEmitter<EventMap extends Record<string, any>> {
  private listeners: { [K in keyof EventMap]?: Array<Listener<EventMap[K]>> } = {};

  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
    return () => this.off(event, listener);
  }

  off<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event]!.filter(l => l !== listener);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    if (!this.listeners[event]) return;
    this.listeners[event]!.forEach(listener => listener(payload));
  }
}

export interface StemAudioEventMap {
  'statechange': { 
    isPlaying: boolean; 
    currentTime: number; 
    duration: number; 
    loading: boolean;
    error: string | null;
  };
  'solomutechange': { 
    soloedStemIds: ReadonlySet<string>;
    mutedStemIds: ReadonlySet<string>;
  };
  'buffersloaded': { duration: number };
  'trackended': void;
}

export class StemAudioManager extends EventEmitter<StemAudioEventMap> {
  private audioContext: AudioContext;
  private stems: Stem[] = [];
  
  private stemBuffers: Record<string, AudioBuffer> = {};
  
  private stemSources: Record<string, AudioBufferSourceNode> = {};
  
  private stemGainNodes: Record<string, GainNode> = {};

  private masterGainNode: GainNode;

  private _isPlaying = false;
  private _currentTime = 0;
  private _duration = 0;
  private _soloedStemIds = new Set<string>();
  private _mutedStemIds = new Set<string>();
  private _loading = false;
  private _error: string | null = null;

  private audioContextTimeAtPlayStart = 0; // audioContext.currentTime when play() was last called successfully
  private accumulatedPauseDuration = 0;    // Total duration spent in a paused state
  private lastPauseTimeContext = 0;        // audioContext.currentTime when pause() was last called

  private progressIntervalId: number | null = null;
  private isDestroyed = false;

  constructor() {
    super();
    if (typeof window === 'undefined') {
      throw new Error("StemAudioManager can only be used in a browser environment.");
    }
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGainNode = this.audioContext.createGain();
    this.masterGainNode.connect(this.audioContext.destination);
  }

  private emitStateChange() {
    if (this.isDestroyed) return;
    this.emit('statechange', { 
      isPlaying: this._isPlaying, 
      currentTime: this._currentTime, 
      duration: this._duration,
      loading: this._loading,
      error: this._error,
    });
  }

  private emitSoloMuteChange() {
    if (this.isDestroyed) return;
    this.emit('solomutechange', { 
      soloedStemIds: new Set(this._soloedStemIds),
      mutedStemIds: new Set(this._mutedStemIds)
    });
    this.applyGainToStems();
  }

  async loadStems(stemsToLoad: Stem[]): Promise<void> {
    if (this.isDestroyed) {
        console.warn("StemAudioManager is destroyed. Cannot load stems.");
        return;
    }
    this.resetInternalState();
    this.stems = stemsToLoad;
    this._loading = true;
    this.emitStateChange();

    try {
      const bufferPromises = this.stems.map(stem => {
        const url = stem.mp3Url || stem.wavUrl;
        if (url) {
          return fetch(url)
            .then(res => {
              if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
              return res.arrayBuffer();
            })
            .then(arr => this.audioContext.decodeAudioData(arr))
            .then(buf => { this.stemBuffers[stem.id] = buf; })
            .catch(e => {
              console.error(`Error loading stem ${stem.name || stem.id}:`, e);
            });
        }
        return Promise.resolve();
      });

      await Promise.all(bufferPromises);

      let maxDuration = 0;
      Object.values(this.stemBuffers).forEach(buf => {
        if (buf.duration > maxDuration) maxDuration = buf.duration;
      });
      this._duration = maxDuration;
      
      this.createGainNodes();
      this._loading = false;
      this.emitStateChange();
      this.emit('buffersloaded', { duration: this._duration });

    } catch (e:any) {
      console.error("Error loading audio data:", e);
      this._loading = false;
      this._error = e.message || "Failed to load some audio tracks.";
      this.emitStateChange();
    }
  }

  private resetInternalState() {
    this.stopAllSources(true);
    this.stems = [];
    this.stemBuffers = {};
    this.stemSources = {};
    this.stemGainNodes = {};
    this._isPlaying = false;
    this._currentTime = 0;
    this._duration = 0;
    this._soloedStemIds = new Set<string>();
    this._mutedStemIds = new Set<string>();
    this._loading = false;
    this._error = null;
    this.audioContextTimeAtPlayStart = 0;
    this.accumulatedPauseDuration = 0;
    this.lastPauseTimeContext = 0;
  }

  private createGainNodes() {
    this.stemGainNodes = {};
    this.stems.forEach(stem => {
      if (this.stemBuffers[stem.id]) {
        const gainNode = this.audioContext.createGain();
        gainNode.connect(this.masterGainNode);
        this.stemGainNodes[stem.id] = gainNode;
      }
    });
    this.applyGainToStems();
  }
  
  private applyGainToStems() {
    const ctxTime = this.audioContext.currentTime;
    this.stems.forEach(stem => {
      const gainNode = this.stemGainNodes[stem.id];
      if (gainNode) {
        let newGainValue = 1;
        if (this._soloedStemIds.size > 0) {
          newGainValue = this._soloedStemIds.has(stem.id) && !this._mutedStemIds.has(stem.id) ? 1 : 0;
        } else {
          newGainValue = this._mutedStemIds.has(stem.id) ? 0 : 1;
        }
        gainNode.gain.cancelScheduledValues(ctxTime);
        gainNode.gain.setValueAtTime(newGainValue, ctxTime);
      }
    });
  }

  private stopAllSources(clearProgressInterval = true) {
    Object.values(this.stemSources).forEach(s => {
        try { 
            s.onended = null; 
            s.stop(0); // Stop at current context time
            s.disconnect(); 
        } catch(e) {/*ignore*/}
    });
    this.stemSources = {};
    if (this.progressIntervalId && clearProgressInterval) {
      window.clearInterval(this.progressIntervalId);
      this.progressIntervalId = null;
    }
  }

  play() {
    if (this.isDestroyed || this._isPlaying || this._loading || Object.keys(this.stemBuffers).length === 0) return;
    this.audioContext.resume();
    this.stopAllSources(false); 
    this.applyGainToStems(); 

    if (this.lastPauseTimeContext > 0) {
        this.accumulatedPauseDuration += (this.audioContext.currentTime - this.lastPauseTimeContext);
        this.lastPauseTimeContext = 0; // Reset after accumulating
    }
    this.audioContextTimeAtPlayStart = this.audioContext.currentTime;
    // Effective start time for sources is _currentTime, which accounts for previous pauses/seeks.
    const sourceStartTime = this._currentTime;

    let sourcesCreated = 0;
    this.stems.forEach(stem => {
      if (this.stemBuffers[stem.id] && this.stemGainNodes[stem.id]) {
        const source = this.audioContext.createBufferSource();
        source.buffer = this.stemBuffers[stem.id];
        source.connect(this.stemGainNodes[stem.id]);
        source.start(0, sourceStartTime); 
        this.stemSources[stem.id] = source;
        sourcesCreated++;
        source.onended = () => {
            if (!this.stemSources[stem.id] || this.stemSources[stem.id] !== source || this.isDestroyed) return;
            delete this.stemSources[stem.id];
            if (Object.keys(this.stemSources).length === 0 && this._isPlaying) {
                this._isPlaying = false;
                if (this._currentTime < this._duration - 0.01) { /* Paused or stopped early */ }
                else { this._currentTime = this._duration; }
                this.resetTimingForStop();
                this.stopAllSources(true);
                this.emitStateChange();
                this.emit('trackended');
            }
        };
      }
    });
    
    if (sourcesCreated > 0) {
      this._isPlaying = true;
      this.emitStateChange();
      if (this.progressIntervalId) window.clearInterval(this.progressIntervalId);
      this.progressIntervalId = window.setInterval(() => {
        if (!this._isPlaying || this.isDestroyed) {
          if(this.progressIntervalId) window.clearInterval(this.progressIntervalId);
          this.progressIntervalId = null;
          return;
        }
        
        const elapsedSincePlay = this.audioContext.currentTime - this.audioContextTimeAtPlayStart;
        this._currentTime = this.accumulatedPauseDuration + elapsedSincePlay;

        if (this._currentTime >= this._duration) {
          this._currentTime = this._duration;
          if (this._isPlaying) { // Check ensures this doesn't conflict with onended
            this.pause(); 
            this.emit('trackended');
          }
        } else {
          this.emitStateChange(); 
        }
      }, 100); 
    } else {
        console.warn("No sources created to play.");
    }
  }

  private resetTimingForStop() {
    this.accumulatedPauseDuration = 0;
    this.lastPauseTimeContext = 0;
    this.audioContextTimeAtPlayStart = 0;
  }

  pause() {
    if (this.isDestroyed || !this._isPlaying) return;
    this.lastPauseTimeContext = this.audioContext.currentTime;
    this._isPlaying = false;
    this.stopAllSources(true);
    // Update _currentTime based on how much has played since play() was called this last time
    const elapsedSincePlay = this.audioContext.currentTime - this.audioContextTimeAtPlayStart;
    this._currentTime = this.accumulatedPauseDuration + elapsedSincePlay;
    if(this._currentTime > this._duration) this._currentTime = this._duration;

    this.emitStateChange();
  }

  seek(time: number) {
    if (this.isDestroyed || this._duration === 0) return;
    const newTime = Math.max(0, Math.min(time, this._duration));
    
    this._currentTime = newTime;
    // To maintain correct playback position if play() is called next:
    // Treat all time before the seek point as accumulated pause duration.
    // When play() is called, audioContextTimeAtPlayStart will be now, and playback will start from _currentTime.
    this.accumulatedPauseDuration = newTime;
    this.audioContextTimeAtPlayStart = this.audioContext.currentTime; // Reset reference for future play
    this.lastPauseTimeContext = 0; // Not paused if we just seeked

    this.emitStateChange();
    if (this._isPlaying) {
      this.stopAllSources(false); 
      this.play();
    }
  }

  toggleSolo(stemId: string) {
    if (this.isDestroyed) return;
    const newSoloed = new Set(this._soloedStemIds);
    if (newSoloed.has(stemId)) {
      newSoloed.delete(stemId);
    } else {
      newSoloed.add(stemId);
    }
    this._soloedStemIds = newSoloed;
    this.emitSoloMuteChange();
  }

  toggleMute(stemId: string) {
    if (this.isDestroyed) return;
    const newMuted = new Set(this._mutedStemIds);
    if (newMuted.has(stemId)) {
      newMuted.delete(stemId);
    } else {
      newMuted.add(stemId);
    }
    this._mutedStemIds = newMuted;
    this.emitSoloMuteChange();
  }
  
  public getPlaybackState() {
    return {
      isPlaying: this._isPlaying,
      currentTime: this._currentTime,
      duration: this._duration,
      soloedStemIds: new Set(this._soloedStemIds),
      mutedStemIds: new Set(this._mutedStemIds),
      loading: this._loading,
      error: this._error,
    };
  }

  destroy() {
    this.isDestroyed = true;
    this.stopAllSources(true);
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(e => console.error("Error closing AudioContext:", e));
    }
    this.stems = [];
    this.stemBuffers = {};
    (this as any).listeners = {};
    console.log("StemAudioManager destroyed");
  }
} 