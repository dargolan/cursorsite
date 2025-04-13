/**
 * Extracts metadata from an audio file using Web Audio API
 */
export async function extractAudioMetadata(file: File): Promise<{
  duration: number;
  bpm?: number;
  waveform: number[];
}> {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Get duration
        const duration = audioBuffer.duration;

        // Generate waveform data
        const channelData = audioBuffer.getChannelData(0); // Get the first channel
        const samples = 200; // Number of points in the waveform
        const blockSize = Math.floor(channelData.length / samples);
        const waveform = [];

        for (let i = 0; i < samples; i++) {
          const start = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[start + j]);
          }
          waveform.push(sum / blockSize);
        }

        // Normalize waveform data to 0-1 range
        const max = Math.max(...waveform);
        const normalizedWaveform = waveform.map(w => w / max);

        // Attempt to detect BPM
        const bpm = await detectBPM(audioBuffer);

        resolve({
          duration,
          bpm,
          waveform: normalizedWaveform,
        });
      } catch (error) {
        reject(error);
      } finally {
        audioContext.close();
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Attempts to detect BPM using peak detection
 */
async function detectBPM(audioBuffer: AudioBuffer): Promise<number | undefined> {
  try {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Convert to mono if needed and get amplitude envelope
    const envelope = getAmplitudeEnvelope(channelData, sampleRate);
    
    // Find peaks in the envelope
    const peaks = findPeaks(envelope);
    
    // Calculate intervals between peaks
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    
    // Convert intervals to BPM candidates
    const bpmCandidates = intervals.map(interval => 60 / (interval / sampleRate));
    
    // Filter out unreasonable BPM values and find the most common one
    const filteredBPMs = bpmCandidates.filter(bpm => bpm >= 60 && bpm <= 200);
    
    if (filteredBPMs.length === 0) return undefined;
    
    // Return the median BPM
    filteredBPMs.sort((a, b) => a - b);
    const medianBPM = filteredBPMs[Math.floor(filteredBPMs.length / 2)];
    
    // Round to nearest integer
    return Math.round(medianBPM);
  } catch (error) {
    console.error('BPM detection failed:', error);
    return undefined;
  }
}

function getAmplitudeEnvelope(channelData: Float32Array, sampleRate: number): Float32Array {
  const blockSize = Math.floor(sampleRate / 100); // 10ms blocks
  const envelope = new Float32Array(Math.floor(channelData.length / blockSize));
  
  for (let i = 0; i < envelope.length; i++) {
    const start = i * blockSize;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[start + j]);
    }
    envelope[i] = sum / blockSize;
  }
  
  return envelope;
}

function findPeaks(envelope: Float32Array): number[] {
  const peaks: number[] = [];
  const lookAhead = 10; // Number of samples to look ahead/behind
  const threshold = 0.5; // Minimum amplitude for a peak
  
  for (let i = lookAhead; i < envelope.length - lookAhead; i++) {
    const current = envelope[i];
    if (current < threshold) continue;
    
    let isPeak = true;
    for (let j = 1; j <= lookAhead; j++) {
      if (envelope[i - j] > current || envelope[i + j] > current) {
        isPeak = false;
        break;
      }
    }
    
    if (isPeak) {
      peaks.push(i);
    }
  }
  
  return peaks;
} 