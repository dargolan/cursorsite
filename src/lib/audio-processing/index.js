// Dynamic imports for audio processing libraries
export const getAudioProcessor = async () => {
  const [
    { default: WaveSurfer },
    { default: audioDecode },
    { default: audioBufferToWav }
  ] = await Promise.all([
    import('wavesurfer.js'),
    import('audio-decode'),
    import('audiobuffer-to-wav')
  ]);

  return {
    WaveSurfer,
    audioDecode,
    audioBufferToWav
  };
};

// Waveform generation with lazy loading
export const generateWaveform = async (audioBuffer) => {
  const { WaveSurfer } = await getAudioProcessor();
  // Implementation will be loaded only when needed
  return WaveSurfer.create({
    container: '#waveform',
    waveColor: '#4a9eff',
    progressColor: '#1453ff',
    cursorColor: '#1453ff',
    barWidth: 2,
    barRadius: 3,
    responsive: true,
    height: 100,
    normalize: true,
    partialRender: true
  });
};

// Audio buffer processing with lazy loading
export const processAudioBuffer = async (arrayBuffer) => {
  const { audioDecode, audioBufferToWav } = await getAudioProcessor();
  const audioBuffer = await audioDecode(arrayBuffer);
  return audioBufferToWav(audioBuffer);
}; 