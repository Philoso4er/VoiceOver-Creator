/**
 * Helper to convert raw PCM (24kHz, 16-bit, Mono) base64 string from Gemini TTS
 * into a valid downloadable & playable WAV Data URL or Blob.
 */

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function pcmToWavHeader(pcmLength: number, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + pcmLength, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (1 = PCM) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sampleRate * numChannels * bitsPerSample / 8) */
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  /* block align (numChannels * bitsPerSample / 8) */
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  /* bits per sample */
  view.setUint16(34, bitsPerSample, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, pcmLength, true);

  return new Uint8Array(header);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export function pcmBase64ToWavBlobUrl(base64Pcm: string, sampleRate = 24000): { url: string; blob: Blob; durationSeconds: number } {
  const pcmBytes = base64ToUint8Array(base64Pcm);
  
  // Check if it already has a RIFF header (some servers return full WAV)
  const isAlreadyWav = pcmBytes.length > 12 &&
    String.fromCharCode(pcmBytes[0], pcmBytes[1], pcmBytes[2], pcmBytes[3]) === 'RIFF';

  let finalBytes: Uint8Array;
  if (isAlreadyWav) {
    finalBytes = pcmBytes;
  } else {
    const wavHeader = pcmToWavHeader(pcmBytes.length, sampleRate, 1, 16);
    finalBytes = new Uint8Array(wavHeader.length + pcmBytes.length);
    finalBytes.set(wavHeader, 0);
    finalBytes.set(pcmBytes, wavHeader.length);
  }

  const blob = new Blob([finalBytes.buffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  
  // Calculate exact audio duration in seconds
  // 16-bit mono = 2 bytes per sample
  const bytesPerSecond = sampleRate * 2;
  const pcmDataLength = isAlreadyWav ? pcmBytes.length - 44 : pcmBytes.length;
  const durationSeconds = Math.max(0.5, pcmDataLength / bytesPerSecond);

  return { url, blob, durationSeconds };
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export function formatTimeShort(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
