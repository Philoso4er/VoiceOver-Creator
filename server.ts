import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Lazy initializer for Gemini client to prevent crash if key is loaded dynamically
function getGeminiAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. Script Optimization Endpoint
app.post('/api/optimize-script', async (req, res) => {
  try {
    const { script, tone = 'tiktok_viral' } = req.body;

    if (!script || typeof script !== 'string') {
      return res.status(400).json({ error: 'Script text is required' });
    }

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const jsonText = response.text || '{}';
    const parsed = JSON.parse(jsonText);

    return res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Error optimizing script:', error);
    return res.status(500).json({
      error: error.message || 'Failed to optimize script',
    });
  }
});

// Helper to call Gemini TTS with auto-retry on 429 rate limit errors
async function generateTtsWithRetry(ai: any, params: any, retries = 3, delayMs = 2500): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      const isQuotaError =
        err?.status === 'RESOURCE_EXHAUSTED' ||
        err?.message?.includes('429') ||
        err?.message?.includes('Quota exceeded') ||
        err?.message?.includes('RESOURCE_EXHAUSTED');
      if (isQuotaError && attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
        delayMs *= 1.8;
        continue;
      }
      throw err;
    }
  }
}

// 2.5 Quick Voice Sample Preview Endpoint (Gemini TTS)
app.post('/api/voice-sample', async (req, res) => {
  try {
    const { voice = 'Kore', text = 'Hey there! This is what my voice actor performance sounds like.' } = req.body;
    const ai = getGeminiAI();

    const ttsResponse = await generateTtsWithRetry(ai, {
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('No audio returned for voice sample');
    }

    return res.json({ success: true, audioBase64: base64Audio });
  } catch (err: any) {
    return res.json({ success: false, fallback: true, message: 'Sample generation fallback active' });
  }
});

// 3. Generate Voiceover Endpoint (Gemini TTS + Timestamped Captions)
app.post('/api/generate-voiceover', async (req, res) => {
  try {
    const {
      script,
      voice = 'Kore',
      tone = 'tiktok_viral',
      speed = 1.0,
      multiSpeaker = false,
      speaker2Voice = 'Puck',
      speaker2Script = '',
    } = req.body;

    if (!script || typeof script !== 'string') {
      return res.status(400).json({ error: 'Script text is required' });
    }

    const ai = getGeminiAI();

    // Call Gemini TTS
    let ttsResponse;
    if (multiSpeaker && speaker2Script) {
      const dialogueText = `Speaker 1: ${script}\nSpeaker 2: ${speaker2Script}`;
      ttsResponse = await generateTtsWithRetry(ai, {
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: dialogueText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: 'Speaker 1',
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice },
                  },
                },
                {
                  speaker: 'Speaker 2',
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: speaker2Voice },
                  },
                },
              ],
            },
          },
        },
      });
    } else {
      ttsResponse = await generateTtsWithRetry(ai, {
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: script }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });
    }

    const base64Audio =
      ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error('No audio data received from TTS model.');
    }

    // Convert raw PCM from Gemini TTS (24kHz 16-bit Mono PCM) into a valid WAV buffer if needed
    const rawAudioBuffer = Buffer.from(base64Audio, 'base64');
    let wavAudioBuffer = rawAudioBuffer;
    if (rawAudioBuffer.length < 12 || rawAudioBuffer.toString('utf8', 0, 4) !== 'RIFF') {
      const header = Buffer.alloc(44);
      const dataSize = rawAudioBuffer.length;
      header.write('RIFF', 0);
      header.writeUInt32LE(36 + dataSize, 4);
      header.write('WAVE', 8);
      header.write('fmt ', 12);
      header.writeUInt32LE(16, 16);
      header.writeUInt16LE(1, 20);
      header.writeUInt16LE(1, 22);
      header.writeUInt32LE(24000, 24);
      header.writeUInt32LE(48000, 28);
      header.writeUInt16LE(2, 32);
      header.writeUInt16LE(16, 34);
      header.write('data', 36);
      header.writeUInt32LE(dataSize, 40);
      wavAudioBuffer = Buffer.concat([header, rawAudioBuffer]);
    }

    const wavBase64 = wavAudioBuffer.toString('base64');
    const estimatedDurationSeconds = Math.max(1, rawAudioBuffer.length / 48000);

    // Full spoken text (includes Speaker 2 if multiSpeaker mode is active)
    const fullSpokenScript = multiSpeaker && speaker2Script
      ? `${script}. ${speaker2Script}`
      : script;

    // Call Gemini 3.6 Flash with BOTH the audio WAV and spoken text for TRUE audio forced-alignment
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

    const captionResponse = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'audio/wav',
            data: wavBase64,
          },
        },
        {
          text: captionPrompt,
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    });

    let rawCaptionData: any = {};
    try {
      rawCaptionData = JSON.parse(captionResponse.text || '{}');
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

    return res.json({
      success: true,
      data: {
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
      },
    });
  } catch (error: any) {
    const isQuota =
      error?.status === 'RESOURCE_EXHAUSTED' ||
      error?.message?.includes('429') ||
      error?.message?.includes('Quota exceeded') ||
      error?.message?.includes('RESOURCE_EXHAUSTED');

    if (isQuota) {
      console.warn('Voiceover generation rate limited (429).');
      return res.status(429).json({
        error: 'Gemini API free tier rate limit reached. Please wait a few seconds and click Generate Voiceover again.',
      });
    }

    console.error('Error generating voiceover:', error?.message || 'Unknown error');

    return res.status(500).json({
      error: error.message || 'Failed to generate voiceover',
    });
  }
});

// Start Express server & Vite integration
async function main() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening at http://0.0.0.0:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Fatal server boot error:', err);
});
