import { GoogleGenAI, Modality } from '@google/genai';

export const API_KEY_STORAGE = 'gemini_api_key';

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function setStoredApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key.trim());
  window.dispatchEvent(new Event('gemini-key-changed'));
}

export function clearStoredApiKey() {
  localStorage.removeItem(API_KEY_STORAGE);
  window.dispatchEvent(new Event('gemini-key-changed'));
}

export class MissingApiKeyError extends Error {
  constructor() {
    super('Add your Gemini API key in Settings (get a free key at aistudio.google.com).');
    this.name = 'MissingApiKeyError';
  }
}

function getGeminiAI(): GoogleGenAI {
  const apiKey = getStoredApiKey();
  if (!apiKey) throw new MissingApiKeyError();
  return new GoogleGenAI({ apiKey });
}

export const TEXT_MODELS = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest'];
// Key-less model listing isn't possible (ai.models.list requires a key), so fallbacks are the
// documented generateContent TTS models that return raw PCM like the primary model.
export const TTS_MODELS = ['gemini-3.1-flash-tts-preview', 'gemini-2.5-flash-preview-tts', 'gemini-2.5-pro-preview-tts'];

export type StatusCallback = (message: string | null) => void;

export class BusyError extends Error {
  constructor() {
    super("Still busy — Google's free Gemini servers are overloaded right now. Please try again in a minute.");
    this.name = 'BusyError';
  }
}

function errText(err: any): string {
  return `${err?.status ?? ''} ${err?.code ?? ''} ${err?.message ?? ''}`;
}

export function isRetryableError(err: any): boolean {
  if (err instanceof MissingApiKeyError) return false;
  const code = Number(err?.status ?? err?.code);
  if ([429, 500, 502, 503, 504].includes(code)) return true;
  return /\b(429|500|503)\b|UNAVAILABLE|overloaded|RESOURCE_EXHAUSTED|high demand|Quota exceeded|INTERNAL|try again later/i.test(errText(err));
}

function isAuthError(err: any): boolean {
  return /API[_ ]KEY[_ ]INVALID|API key not valid|PERMISSION_DENIED|\b401\b|\b403\b/i.test(errText(err));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Shared Gemini caller: tries each model in order; each model gets up to `attempts`
 * tries with exponential backoff + jitter on transient (429/5xx/overloaded) errors.
 * Non-transient errors on one model (e.g. model not found) move on to the next model,
 * except auth/key errors, which are thrown immediately.
 */
async function callGemini(
  ai: GoogleGenAI,
  models: string[],
  buildParams: (model: string) => any,
  opts: { onStatus?: StatusCallback; label?: string; attempts?: number } = {}
): Promise<any> {
  const { onStatus, label = 'request', attempts = 4 } = opts;
  let sawBusy = false;
  let lastErr: any;
  for (let m = 0; m < models.length; m++) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const res = await ai.models.generateContent(buildParams(models[m]));
        onStatus?.(null);
        return res;
      } catch (err: any) {
        lastErr = err;
        if (err instanceof MissingApiKeyError || isAuthError(err)) { onStatus?.(null); throw err; }
        if (!isRetryableError(err)) {
          console.warn(`Gemini ${label}: model ${models[m]} failed (non-retryable), trying next model.`);
          break;
        }
        sawBusy = true;
        if (attempt < attempts) {
          const delay = Math.min(16000, 1500 * 2 ** (attempt - 1)) + Math.random() * 1000;
          onStatus?.(`Google's free servers are busy, retrying… (attempt ${attempt + 1} of ${attempts}${m > 0 ? `, backup model ${m}` : ''})`);
          await sleep(delay);
        }
      }
    }
    if (m < models.length - 1) onStatus?.(`Google's free servers are busy, switching to a backup model… (${m + 2} of ${models.length})`);
  }
  onStatus?.(null);
  if (sawBusy) throw new BusyError();
  throw lastErr;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function pcmToWavBytes(raw: Uint8Array): Uint8Array {
  const isRiff = raw.length >= 12 && String.fromCharCode(raw[0], raw[1], raw[2], raw[3]) === 'RIFF';
  if (isRiff) return raw;
  const header = new ArrayBuffer(44);
  const v = new DataView(header);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  const dataSize = raw.length;
  w(0, 'RIFF'); v.setUint32(4, 36 + dataSize, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 24000, true); v.setUint32(28, 48000, true); v.setUint16(32, 2, true);
  v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, dataSize, true);
  const out = new Uint8Array(44 + dataSize);
  out.set(new Uint8Array(header), 0);
  out.set(raw, 44);
  return out;
}

export async function optimizeScript(script: string, tone: string = 'tiktok_viral', onStatus?: StatusCallback) {
  if (!script || typeof script !== 'string') throw new Error('Script text is required');
  const ai = getGeminiAI();

    const prompt = `You are a world-class viral content producer & voiceover director specializing in TikTok, Reels, Shorts, and Podcasts.
Analyze and optimize the following raw script to make it maximally viral, relatable, and engaging when spoken aloud.

RAW SCRIPT:
"""
${script}
"""

TARGET TONE / STYLE: ${tone}

Your goal:
1. Rewrite the script into an "optimizedScript". Clean up awkward sentences, add a strong opening hook (first 3 seconds), natural speech pauses [pause], and emotional emphasis.
2. Calculate a virality analysis: hookScore (0-100), pacingScore (0-100), relatabilityScore (0-100).
3. Provide actionable retention tips and 5 viral hashtags.

Return ONLY valid JSON matching this schema:
{
  "optimizedScript": "string",
  "viralHook": "string",
  "hookScore": number,
  "pacingScore": number,
  "relatabilityScore": number,
  "retentionTips": ["string"],
  "suggestedHashtags": ["string"],
  "estimatedDurationSeconds": number
}`;

    const response = await callGemini(ai, TEXT_MODELS, (model) => ({
      model,
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.7 },
    }), { onStatus, label: 'optimize' });
    return JSON.parse(response.text || '{}');
}

export async function generateVoiceSample(voice: string = 'Kore', text: string = 'Hey there! This is what my voice actor performance sounds like.', onStatus?: StatusCallback): Promise<string> {
  const ai = getGeminiAI();
  const ttsResponse = await callGemini(ai, TTS_MODELS, (model) => ({
    model,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  }), { onStatus, label: 'voice sample', attempts: 3 });
  const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error('No audio returned for voice sample');
  return base64Audio;
}

export interface GenerateVoiceoverParams {
  script: string;
  voice?: string;
  tone?: string;
  speed?: number;
  multiSpeaker?: boolean;
  speaker2Voice?: string;
  speaker2Script?: string;
  onStatus?: StatusCallback;
}

export async function generateVoiceover(params: GenerateVoiceoverParams): Promise<any> {
  const {
    script,
    voice = 'Kore',
    tone = 'tiktok_viral',
    multiSpeaker = false,
    speaker2Voice = 'Puck',
    speaker2Script = '',
    onStatus,
  } = params;
  if (!script || typeof script !== 'string') throw new Error('Script text is required');

  try {
    const ai = getGeminiAI();
    let ttsResponse;
    if (multiSpeaker && speaker2Script) {
      const dialogueText = `Speaker 1: ${script}\nSpeaker 2: ${speaker2Script}`;
      ttsResponse = await callGemini(ai, TTS_MODELS, (model) => ({
        model,
        contents: [{ parts: [{ text: dialogueText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                { speaker: 'Speaker 1', voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
                { speaker: 'Speaker 2', voiceConfig: { prebuiltVoiceConfig: { voiceName: speaker2Voice } } },
              ],
            },
          },
        },
      }), { onStatus, label: 'voiceover' });
    } else {
      ttsResponse = await callGemini(ai, TTS_MODELS, (model) => ({
        model,
        contents: [{ parts: [{ text: script }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      }), { onStatus, label: 'voiceover' });
    }

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error('No audio data received from TTS model.');

    const rawAudio = base64ToBytes(base64Audio);
    const wavBase64 = bytesToBase64(pcmToWavBytes(rawAudio));
    const estimatedDurationSeconds = Math.max(1, rawAudio.length / 48000);

    const fullSpokenScript = multiSpeaker && speaker2Script ? `${script}. ${speaker2Script}` : script;

    const captionPrompt = `You are an expert audio forced-alignment system for viral video captions.
LISTEN CAREFULLY to the attached WAV audio recording (exact duration: ${estimatedDurationSeconds.toFixed(2)}s).

Below is the EXACT transcript of the words spoken in the audio recording:
"""
${fullSpokenScript}
"""

YOUR INSTRUCTIONS:
1. Listen to the audio track and perform exact audio forced-alignment for every spoken word and phrase.
2. Divide the spoken text into sequential, natural reading caption segments (3 to 6 words max).
3. Assign pinpoint-accurate start and end timestamps (in seconds) for each caption segment based on where words are spoken in the audio.
4. Provide word-level forced alignment for EVERY single word in "allWords", matching exact audio playback timing.
5. Ensure timestamps are strictly chronological, accurate to 2 decimal places, starting at 0.0s and ending when speech finishes (~${estimatedDurationSeconds.toFixed(2)}s). Do NOT omit any words.

Return ONLY valid JSON matching this schema:
{
  "transcription": "${fullSpokenScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}",
  "captions": [
    {
      "id": 1,
      "start": 0.0,
      "end": 1.5,
      "text": "First phrase spoken"
    }
  ],
  "allWords": [
    {
      "word": "First",
      "start": 0.0,
      "end": 0.3
    }
  ],
  "analysis": {
    "hookScore": 92,
    "pacingScore": 88,
    "relatabilityScore": 95,
    "viralHook": "First 3s hook summary",
    "retentionTips": ["Keep emphasis on keywords", "Add quick zoom cut at 2s"],
    "suggestedHashtags": ["#viral", "#voiceover", "#relatable", "#contentcreator", "#fyp"]
  }
}`;

    let captionResponse: any = null;
    try {
      onStatus?.('Voiceover ready — aligning captions…');
      captionResponse = await callGemini(ai, TEXT_MODELS, (model) => ({
      model,
      contents: [
        { inlineData: { mimeType: 'audio/wav', data: wavBase64 } },
        { text: captionPrompt },
      ],
      config: { responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 8192 },
    }), { onStatus, label: 'caption alignment' });
    } catch (e) {
      if (e instanceof MissingApiKeyError || isAuthError(e)) throw e;
      // Alignment failed (busy servers etc.): fall through to the local timestamp estimate below.
      console.warn('Caption alignment failed, using local timestamp estimate:', e);
    } finally {
      onStatus?.(null);
    }

    let rawCaptionData: any = {};
    try {
      rawCaptionData = JSON.parse(captionResponse?.text || '{}');
    } catch (e) {
      console.warn('Failed to parse Gemini caption response, using full script fallback aligner:', e);
    }

    // Normalize and complete captions so 100% of words are timestamped without cutoff
    const wordsInScript = fullSpokenScript.split(/\s+/).filter(Boolean);
    const totalWords = wordsInScript.length || 1;
    const timePerWord = estimatedDurationSeconds / totalWords;

    let parsedCaptions = Array.isArray(rawCaptionData.captions) ? rawCaptionData.captions : [];
    let parsedWords = Array.isArray(rawCaptionData.allWords) ? rawCaptionData.allWords : [];

    const combinedText = parsedCaptions.map((c: any) => c.text || '').join(' ');
    const coveredWords = combinedText.split(/\s+/).filter(Boolean).length;
    const lastEnd = parsedCaptions[parsedCaptions.length - 1]?.end || 0;

    const isCutOff =
      parsedCaptions.length === 0 ||
      coveredWords < totalWords * 0.75 ||
      lastEnd < estimatedDurationSeconds * 0.75;

    if (isCutOff) {
      parsedCaptions = [];
      parsedWords = [];
      const CHUNK_SIZE = 5;

      for (let i = 0; i < totalWords; i += CHUNK_SIZE) {
        const chunk = wordsInScript.slice(i, i + CHUNK_SIZE);
        const start = parseFloat((i * timePerWord).toFixed(2));
        const end = parseFloat(Math.min(estimatedDurationSeconds, (i + chunk.length) * timePerWord).toFixed(2));

        parsedCaptions.push({
          id: Math.floor(i / CHUNK_SIZE) + 1,
          start,
          end,
          text: chunk.join(' '),
        });
      }
    }

    if (!parsedWords || parsedWords.length < totalWords * 0.75) {
      parsedWords = [];
      for (const seg of parsedCaptions) {
        const segWords = (seg.text || '').split(/\s+/).filter(Boolean);
        const segDuration = Math.max(0.1, seg.end - seg.start);
        const segTimePerWord = segDuration / Math.max(1, segWords.length);

        segWords.forEach((w: string, idx: number) => {
          parsedWords.push({
            word: w,
            start: parseFloat((seg.start + idx * segTimePerWord).toFixed(2)),
            end: parseFloat(Math.min(seg.end, seg.start + (idx + 1) * segTimePerWord).toFixed(2)),
          });
        });
      }
    }

    if (parsedCaptions.length > 0) {
      parsedCaptions[parsedCaptions.length - 1].end = parseFloat(estimatedDurationSeconds.toFixed(2));
    }
    if (parsedWords.length > 0) {
      parsedWords[parsedWords.length - 1].end = parseFloat(estimatedDurationSeconds.toFixed(2));
    }

    const finalCaptionData = {
      transcription: fullSpokenScript,
      captions: parsedCaptions,
      allWords: parsedWords,
      analysis: rawCaptionData.analysis || {
        hookScore: 88,
        pacingScore: 90,
        relatabilityScore: 92,
        viralHook: fullSpokenScript.slice(0, 50),
        retentionTips: ['Use punchy visual captions', 'Add background music beat'],
        suggestedHashtags: ['#viral', '#voiceover', '#relatable'],
      },
    };

    return {
      id: 'vo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      script: fullSpokenScript,
      audioBase64: base64Audio,
      audioMimeType: 'audio/wav',
      audioDurationSeconds: estimatedDurationSeconds,
      voice,
      tone,
      transcription: finalCaptionData.transcription,
      captions: finalCaptionData.captions,
      allWords: finalCaptionData.allWords,
      analysis: finalCaptionData.analysis,
      createdAt: new Date().toISOString(),
    };
  } catch (error: any) {
    if (isRetryableError(error) && !(error instanceof BusyError)) throw new BusyError();
    throw error;
  }
}
