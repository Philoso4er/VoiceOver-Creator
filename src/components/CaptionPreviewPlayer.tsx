import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Download,
  Volume2,
  VolumeX,
  Smartphone,
  Palette,
  Sparkles,
  Music,
  Maximize2
} from 'lucide-react';
import { VoiceoverResult, WordTimestamp } from '../types';
import { formatTime, formatTimeShort } from '../utils/wavConverter';
import { downloadFile } from '../utils/captionExporter';

interface CaptionPreviewPlayerProps {
  voiceover: VoiceoverResult;
  audioUrl: string | null;
  seekRequest?: { time: number; id: number } | null;
}

export type CaptionStyle = 'tiktok_yellow' | 'cyber_neon' | 'minimal_bold' | 'comic_bubble' | 'clean_white';

export const CaptionPreviewPlayer: React.FC<CaptionPreviewPlayerProps> = ({ voiceover, audioUrl, seekRequest }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(voiceover.audioDurationSeconds || 5);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>('tiktok_yellow');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync duration when audio metadata is loaded or when voiceover changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (voiceover.audioDurationSeconds) {
      setDuration(voiceover.audioDurationSeconds);
    }
  }, [voiceover, audioUrl]);

  // Handle external seek request (e.g., clicking timestamp in captions list)
  useEffect(() => {
    if (seekRequest && audioRef.current) {
      audioRef.current.currentTime = seekRequest.time;
      setCurrentTime(seekRequest.time);
      audioRef.current.play().catch((err) => console.log('Audio play on seek error:', err));
      setIsPlaying(true);
    }
  }, [seekRequest]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => console.error('Audio play error:', err));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const jumpSeconds = (sec: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + sec));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleDownloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `viral_voiceover_${voiceover.voice.toLowerCase()}_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Find currently active word or segment smoothly without resetting in gaps
  const activeSegment =
    voiceover.captions.find((c) => currentTime >= c.start && currentTime <= c.end) ||
    voiceover.captions.find((c, idx) => {
      const nextSeg = voiceover.captions[idx + 1];
      return currentTime >= c.start && (!nextSeg || currentTime < nextSeg.start);
    }) ||
    voiceover.captions[0];

  // Word-level karaoke highlighting
  const activeWord =
    voiceover.allWords.find((w) => currentTime >= w.start && currentTime <= w.end) ||
    voiceover.allWords.find((w, idx) => {
      const nextW = voiceover.allWords[idx + 1];
      return currentTime >= w.start && (!nextW || currentTime < nextW.start);
    });

  return (
    <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
      {/* Hidden native audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Header & Style Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Live Voiceover & Caption Player
          </label>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time 9:16 mobile caption preview, player controls & audio download
          </p>
        </div>

        <button
          onClick={handleDownloadAudio}
          disabled={!audioUrl}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Download Audio (.wav)
        </button>
      </div>

      {/* Grid: 9:16 Preview + Audio Player Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 9:16 Vertical Video Frame Simulation */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[280px] aspect-[9/16] bg-[#050505] rounded-3xl border-2 border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-between p-4 group">
            {/* Top Video Status & Waveform indicator */}
            <div className="flex items-center justify-between z-10 text-[10px] text-white/70 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <span className="flex items-center gap-1 font-semibold text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                REEL PREVIEW
              </span>
              <span className="font-mono text-indigo-300">
                {formatTimeShort(currentTime)} / {formatTimeShort(duration)}
              </span>
            </div>

            {/* Dynamic Background Atmosphere */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/30 via-[#050505] to-[#050505] pointer-events-none" />
            <div className="absolute -inset-10 bg-indigo-500/10 blur-3xl pointer-events-none" />

            {/* Animated Audio Equalizer Bars in center background */}
            <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20 pointer-events-none">
              {[40, 70, 30, 90, 60, 80, 50, 95, 45, 85, 35, 75].map((h, i) => (
                <div
                  key={i}
                  style={{
                    height: isPlaying ? `${Math.max(15, (h * (currentTime % 1)) + 10)}%` : '20%',
                  }}
                  className="w-1.5 bg-indigo-500 rounded-full transition-all duration-150"
                />
              ))}
            </div>

            {/* Center / Lower-Third Karaoke Captions Overlay */}
            <div className="relative z-10 my-auto text-center px-3 py-4 w-full">
              {activeSegment ? (
                <div className="space-y-2">
                  {/* Style 1: TikTok Yellow Highlight */}
                  {captionStyle === 'tiktok_yellow' && (
                    <p className="text-lg font-black uppercase tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] leading-snug">
                      {activeSegment.text.split(' ').map((w, idx) => {
                        const cleanWord = w.replace(/[^a-zA-Z0-9']/g, '').toLowerCase();
                        const activeClean = activeWord?.word.replace(/[^a-zA-Z0-9']/g, '').toLowerCase();
                        const isCurrent = activeClean === cleanWord;

                        return (
                          <span
                            key={idx}
                            className={`inline-block mx-0.5 px-1 py-0.5 rounded ${
                              isCurrent
                                ? 'bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/50'
                                : 'text-white'
                            } transition-transform duration-100`}
                          >
                            {w}{' '}
                          </span>
                        );
                      })}
                    </p>
                  )}

                  {/* Style 2: Cyber Neon */}
                  {captionStyle === 'cyber_neon' && (
                    <p className="text-lg font-bold text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)] tracking-wide">
                      {activeSegment.text}
                    </p>
                  )}

                  {/* Style 3: Minimalist Bold */}
                  {captionStyle === 'minimal_bold' && (
                    <p className="text-base font-extrabold text-white bg-black/80 px-3 py-2 rounded-xl backdrop-blur-md border border-white/10 shadow-xl">
                      {activeSegment.text}
                    </p>
                  )}

                  {/* Style 4: Comic Bubble */}
                  {captionStyle === 'comic_bubble' && (
                    <p className="text-sm font-black text-slate-950 bg-indigo-300 px-3 py-2 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      {activeSegment.text}
                    </p>
                  )}

                  {/* Style 5: Clean White */}
                  {captionStyle === 'clean_white' && (
                    <p className="text-base font-semibold text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      {activeSegment.text}
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic">Captions will display here...</span>
              )}
            </div>

            {/* Bottom Audio Info Badge */}
            <div className="relative z-10 flex items-center justify-between text-[10px] text-white/80 bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 truncate">
                <Music className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                <span className="font-medium truncate">{voiceover.voice} Voiceover</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px]">
                {voiceover.tone}
              </span>
            </div>
          </div>

          {/* Caption Style Customizer Buttons */}
          <div className="mt-4 space-y-2 w-full max-w-[280px]">
            <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              Caption Overlay Style
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'tiktok_yellow', label: 'Viral Highlight' },
                { id: 'cyber_neon', label: 'Cyber Neon' },
                { id: 'minimal_bold', label: 'Minimal Box' },
                { id: 'comic_bubble', label: 'Comic Pop' },
                { id: 'clean_white', label: 'Clean Shadow' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setCaptionStyle(st.id as CaptionStyle)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                    captionStyle === st.id
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audio Player Controls & Waveform */}
        <div className="lg:col-span-7 space-y-5 bg-[#0A0A0A] p-5 rounded-2xl border border-white/10">
          {/* Main Scrubber */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="text-indigo-400 font-bold">{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            <input
              type="range"
              min="0"
              max={duration || 10}
              step="0.05"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Main Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Jump -5s / Play / Jump +5s */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => jumpSeconds(-5)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                title="Rewind 5s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black shadow-lg hover:scale-105 transition-all cursor-pointer"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-0.5" />}
              </button>

              <button
                onClick={() => jumpSeconds(5)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                title="Forward 5s"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Playback Rate Selector */}
            <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-xl border border-white/10 text-xs font-mono">
              <span className="text-slate-500 text-[10px] uppercase font-bold px-1">Speed:</span>
              {[0.8, 1, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => changePlaybackRate(rate)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    playbackRate === rate
                      ? 'bg-indigo-500 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Mute button */}
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Quick Active Caption Bar */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
              Active Speaking Sentence:
            </span>
            <p className="text-sm font-medium text-slate-200 italic">
              {activeSegment ? `"${activeSegment.text}"` : 'Press play to listen...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
