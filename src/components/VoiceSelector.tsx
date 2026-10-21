import React, { useState, useRef } from 'react';
import { Mic2, Flame, Users, Volume2, Play, Pause, Sparkles, Check, Loader2 } from 'lucide-react';
import { VoiceName, ViralTone } from '../types';
import { PRESET_VOICES, VIRAL_TONES } from '../data/presetVoices';
import { pcmBase64ToWavBlobUrl } from '../utils/wavConverter';

interface VoiceSelectorProps {
  selectedVoice: VoiceName;
  onSelectVoice: (v: VoiceName) => void;
  selectedTone: ViralTone;
  onSelectTone: (t: ViralTone) => void;
  speed: number;
  onSpeedChange: (s: number) => void;
  multiSpeaker: boolean;
  onToggleMultiSpeaker: (val: boolean) => void;
  speaker2Voice: VoiceName;
  onSelectSpeaker2Voice: (v: VoiceName) => void;
  speaker2Script: string;
  onSpeaker2ScriptChange: (s: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  selectedTone,
  onSelectTone,
  speed,
  onSpeedChange,
  multiSpeaker,
  onToggleMultiSpeaker,
  speaker2Voice,
  onSelectSpeaker2Voice,
  speaker2Script,
  onSpeaker2ScriptChange,
}) => {
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const [loadingSampleId, setLoadingSampleId] = useState<string | null>(null);

  const audioCacheRef = useRef<Record<string, HTMLAudioElement>>({});
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const playVoiceSample = async (voiceName: VoiceName, text: string) => {
    // If currently playing this voice, stop it
    if (playingSampleId === voiceName) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }
      window.speechSynthesis.cancel();
      setPlayingSampleId(null);
      return;
    }

    // Stop any existing playing sample
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
    window.speechSynthesis.cancel();

    // Check if we have a cached HTML5 Audio object for this voice
    if (audioCacheRef.current[voiceName]) {
      const cachedAudio = audioCacheRef.current[voiceName];
      cachedAudio.playbackRate = speed;
      cachedAudio.currentTime = 0;
      currentAudioRef.current = cachedAudio;
      setPlayingSampleId(voiceName);

      cachedAudio.play().catch((err) => {
        console.warn('Cached audio playback error:', err);
        setPlayingSampleId(null);
      });
      return;
    }

    // Fetch live sample from Gemini TTS server
    setLoadingSampleId(voiceName);

    try {
      const res = await fetch('/api/voice-sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice: voiceName, text }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.audioBase64) {
        throw new Error(data.error || 'Failed to fetch audio sample');
      }

      // Convert PCM to WAV Blob URL
      const { url } = pcmBase64ToWavBlobUrl(data.audioBase64);
      const audio = new Audio(url);
      audio.playbackRate = speed;

      audio.onended = () => {
        if (currentAudioRef.current === audio) {
          setPlayingSampleId(null);
        }
      };

      audio.onerror = () => {
        if (currentAudioRef.current === audio) {
          setPlayingSampleId(null);
        }
      };

      audioCacheRef.current[voiceName] = audio;
      currentAudioRef.current = audio;

      setLoadingSampleId(null);
      setPlayingSampleId(voiceName);

      audio.play().catch((err) => {
        console.warn('Audio play error:', err);
        setPlayingSampleId(null);
      });
    } catch (err) {
      console.warn('Gemini sample fetch error, falling back to browser synthesis:', err);
      setLoadingSampleId(null);
      setPlayingSampleId(voiceName);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speed;
      utterance.onend = () => setPlayingSampleId(null);
      utterance.onerror = () => setPlayingSampleId(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1.5">
            <Mic2 className="w-3.5 h-3.5 text-indigo-400" />
            Voice Identity & Delivery Vibe
          </label>
          <p className="text-xs text-slate-400 mt-0.5">
            Choose a high-impact AI voiceover actor and set the viral mood
          </p>
        </div>

        {/* Multi-speaker toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleMultiSpeaker(!multiSpeaker)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              multiSpeaker
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-sm shadow-indigo-500/20'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200 hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2-Person Dialogue</span>
          </button>
        </div>
      </div>

      {/* Voice Personas Grid */}
      <div className="space-y-3">
        <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
          Select Speaker 1 Voice
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESET_VOICES.map((v) => {
            const isSelected = selectedVoice === v.id;
            const isPlaying = playingSampleId === v.id;

            return (
              <div
                key={v.id}
                onClick={() => onSelectVoice(v.id)}
                className={`relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-500/10 border-indigo-500/80 ring-1 ring-indigo-500 shadow-lg shadow-indigo-500/10'
                    : 'bg-[#0A0A0A] border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${v.avatarColor} flex items-center justify-center font-bold text-white text-xs shadow-md`}
                      >
                        {v.name[0]}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white flex items-center gap-1">
                          {v.name}
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </h3>
                        <span className="text-[10px] text-slate-400">{v.gender} • {v.accent}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playVoiceSample(v.id, v.samplePhrase);
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-indigo-400 transition-colors cursor-pointer"
                      title="Quick Listen Sample"
                    >
                      {loadingSampleId === v.id ? (
                        <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-200 font-medium line-clamp-1 mb-1">
                    "{v.tagline}"
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {v.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-white/5 flex flex-wrap gap-1">
                  {v.bestFor.slice(0, 2).map((tag, i) => (
                    <span
                      key={i}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi Speaker Dialogue Option */}
      {multiSpeaker && (
        <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-400" />
              Speaker 2 Dialogue Setup
            </h3>
            <span className="text-[10px] text-indigo-400 font-medium font-mono">Banter Mode</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1 font-medium">Speaker 2 Persona:</label>
              <select
                value={speaker2Voice}
                onChange={(e) => onSelectSpeaker2Voice(e.target.value as VoiceName)}
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-400"
              >
                {PRESET_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.tagline})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1 font-medium">Speaker 2 Line / Reply:</label>
              <input
                type="text"
                value={speaker2Script}
                onChange={(e) => onSpeaker2ScriptChange(e.target.value)}
                placeholder="Speaker 2 response line..."
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Viral Tone Selector */}
      <div className="space-y-3">
        <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-indigo-400" />
          Viral Vibe & Delivery Style
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {VIRAL_TONES.map((t) => {
            const isSelected = selectedTone === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTone(t.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-[#0A0A0A] border-white/10 hover:border-white/20 text-slate-300 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  {t.label}
                </div>
                <div className="text-[9px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                  {t.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pace / Cadence Slider */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-[#0A0A0A] border border-white/10">
        <div>
          <span className="text-xs font-semibold text-slate-200">Delivery Cadence:</span>
          <span className="ml-2 text-xs font-bold font-mono text-indigo-400">{speed.toFixed(1)}x</span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            1.0x is natural speech cadence. 1.1x is recommended for snappy retention.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-48 font-mono">
          <span className="text-[10px] text-slate-500">0.8x</span>
          <input
            type="range"
            min="0.8"
            max="1.2"
            step="0.1"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <span className="text-[10px] text-slate-500">1.2x</span>
        </div>
      </div>
    </div>
  );
};
