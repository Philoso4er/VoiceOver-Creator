export type VoiceName =
  | 'Kore'
  | 'Puck'
  | 'Aoede'
  | 'Zephyr'
  | 'Charon'
  | 'Fenrir';

export type ViralTone =
  | 'tiktok_viral'
  | 'storyteller'
  | 'tech_reviewer'
  | 'relatable_comedy'
  | 'dramatic_trailer'
  | 'asmr_calm'
  | 'hype_motivational';

export interface VoiceProfile {
  id: VoiceName;
  name: string;
  tagline: string;
  gender: 'Female' | 'Male' | 'Neutral';
  description: string;
  bestFor: string[];
  avatarColor: string;
  accent: string;
  samplePhrase: string;
}

export interface WordTimestamp {
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export interface CaptionSegment {
  id: number;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
  words?: WordTimestamp[];
}

export interface ViralScriptAnalysis {
  hookScore: number;      // 0-100
  pacingScore: number;    // 0-100
  relatabilityScore: number; // 0-100
  viralHook: string;
  retentionTips: string[];
  suggestedHashtags: string[];
  estimatedDurationSeconds: number;
}

export interface GenerateVoiceoverRequest {
  script: string;
  voice: VoiceName;
  tone: ViralTone;
  speed?: number; // 0.8 - 1.2
  multiSpeaker?: boolean;
  speaker2Voice?: VoiceName;
  speaker2Script?: string;
}

export interface VoiceoverResult {
  id: string;
  script: string;
  audioBase64: string;
  audioMimeType: string;
  audioDurationSeconds: number;
  voice: VoiceName;
  tone: ViralTone;
  transcription: string;
  captions: CaptionSegment[];
  allWords: WordTimestamp[];
  analysis?: ViralScriptAnalysis;
  createdAt: string;
}

export interface ScriptTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  script: string;
  suggestedVoice: VoiceName;
  suggestedTone: ViralTone;
}
