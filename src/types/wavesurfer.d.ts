declare module 'wavesurfer.js' {
  interface WaveSurferOptions {
    container: string | HTMLElement;
    waveColor?: string;
    progressColor?: string;
    height?: number;
    barWidth?: number;
    barGap?: number;
    cursorWidth?: number;
    normalize?: boolean;
    responsive?: boolean;
    fillParent?: boolean;
    backend?: string;
    mediaControls?: boolean;
    hideScrollbar?: boolean;
    audioRate?: number;
    autoCenter?: boolean;
    barRadius?: number;
    scrollParent?: boolean;
    closeAudioContext?: boolean;
  }

  interface WaveSurfer {
    create(options: WaveSurferOptions): WaveSurfer;
    load(url: string): void;
    play(start?: number, end?: number): void;
    pause(): void;
    playPause(): void;
    stop(): void;
    destroy(): void;
    on(event: string, callback: (arg?: any) => void): void;
    seekTo(progress: number): void;
    skip(seconds: number): void;
    setVolume(newVolume: number): void;
    getVolume(): number;
    setHeight(height: number): void;
    getMute(): boolean;
    setMute(mute: boolean): void;
    toggleMute(): void;
    getCurrentTime(): number;
    getDuration(): number;
    exportPCM(length: number, accuracy: number, noWindow: boolean, start: number): Float32Array;
    exportImage(format: string, quality: number): string;
    isPlaying(): boolean;
  }

  const WaveSurfer: {
    create(options: WaveSurferOptions): WaveSurfer;
  };

  export default WaveSurfer;
} 