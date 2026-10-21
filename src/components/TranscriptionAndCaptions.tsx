import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Download,
  Copy,
  Check,
  Flame,
  Hash,
  MessageSquare,
  Sparkles,
  BarChart3,
  ExternalLink,
  Play
} from 'lucide-react';
import { VoiceoverResult, CaptionSegment } from '../types';
import { formatTime } from '../utils/wavConverter';
import { generateSrt, generateVtt, generateFormattedTranscript, downloadFile } from '../utils/captionExporter';

interface TranscriptionAndCaptionsProps {
  voiceover: VoiceoverResult;
  onSeekToTime?: (time: number) => void;
}

export const TranscriptionAndCaptions: React.FC<TranscriptionAndCaptionsProps> = ({ voiceover, onSeekToTime }) => {
  const [activeTab, setActiveTab] = useState<'captions' | 'transcript' | 'export' | 'analysis'>('captions');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedSrt, setCopiedSrt] = useState(false);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(voiceover.script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleCopySrt = () => {
    const srt = generateSrt(voiceover.captions);
    navigator.clipboard.writeText(srt);
    setCopiedSrt(true);
    setTimeout(() => setCopiedSrt(false), 2000);
  };

  const srtContent = generateSrt(voiceover.captions);
  const vttContent = generateVtt(voiceover.captions);

  return (
    <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5">
      {/* Tab Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex flex-wrap gap-1 bg-[#0A0A0A] p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('captions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'captions'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Timestamped Captions ({voiceover.captions.length})
          </button>

          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'transcript'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Transcription
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Export Captions
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'analysis'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Virality Score
          </button>
        </div>
      </div>

      {/* Tab 1: Timestamped Captions Table */}
      {activeTab === 'captions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Click any timestamp to jump audio player to that exact second</span>
            <button
              onClick={handleCopySrt}
              className="flex items-center gap-1 text-indigo-400 hover:underline font-medium cursor-pointer"
            >
              {copiedSrt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSrt ? 'Copied SRT' : 'Copy SRT Format'}
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-[#0A0A0A] divide-y divide-white/5">
            {voiceover.captions.map((seg) => (
              <div
                key={seg.id}
                onClick={() => onSeekToTime?.(seg.start)}
                className="p-3 hover:bg-indigo-500/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer group"
                title={`Jump to ${formatTime(seg.start)}`}
              >
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-[11px] font-bold text-indigo-400 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-all flex items-center gap-1.5 shrink-0">
                    <Play className="w-3 h-3 fill-indigo-400 text-indigo-400 group-hover:scale-110 transition-transform" />
                    {formatTime(seg.start)} → {formatTime(seg.end)}
                  </span>
                  <p className="text-xs text-slate-200 font-medium group-hover:text-white transition-colors">
                    {seg.text}
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono self-end sm:self-center shrink-0">
                  {(seg.end - seg.start).toFixed(1)}s
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Full Transcription */}
      {activeTab === 'transcript' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Complete spoken text transcription</span>
            <button
              onClick={handleCopyScript}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors cursor-pointer"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              {copiedScript ? 'Copied!' : 'Copy Script'}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0A0A] border border-white/10 text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap max-h-80 overflow-y-auto">
            {voiceover.transcription || voiceover.script}
          </div>
        </div>
      )}

      {/* Tab 3: Export Captions Files */}
      {activeTab === 'export' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Download standard subtitle caption formats ready for CapCut, Premiere Pro, DaVinci Resolve, or YouTube:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* SRT Export */}
            <div className="p-4 rounded-xl bg-[#0A0A0A] border border-white/10 space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  SubRip Subtitles (.SRT)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Universal subtitle format for video editors and social platforms.
                </p>
              </div>
              <button
                onClick={() => downloadFile(srtContent, `captions_${voiceover.id}.srt`, 'text/plain')}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download .SRT
              </button>
            </div>

            {/* VTT Export */}
            <div className="p-4 rounded-xl bg-[#0A0A0A] border border-white/10 space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  WebVTT Subtitles (.VTT)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Optimized for web video players and modern streaming apps.
                </p>
              </div>
              <button
                onClick={() => downloadFile(vttContent, `captions_${voiceover.id}.vtt`, 'text/vtt')}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download .VTT
              </button>
            </div>

            {/* Timestamps TXT Export */}
            <div className="p-4 rounded-xl bg-[#0A0A0A] border border-white/10 space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Timestamped Transcript (.TXT)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Readable text transcript with start and end seconds.
                </p>
              </div>
              <button
                onClick={() =>
                  downloadFile(
                    generateFormattedTranscript(voiceover.captions, voiceover.allWords),
                    `transcript_${voiceover.id}.txt`,
                    'text/plain'
                  )
                }
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download .TXT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Virality Analysis Scorecard */}
      {activeTab === 'analysis' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#0A0A0A] border border-white/10 text-center">
              <span className="text-xs text-slate-400 block mb-1">Hook Score (First 3s)</span>
              <span className="text-2xl font-black font-mono text-indigo-400">
                {voiceover.analysis?.hookScore || 90}/100
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#0A0A0A] border border-white/10 text-center">
              <span className="text-xs text-slate-400 block mb-1">Spoken Cadence Score</span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                {voiceover.analysis?.pacingScore || 88}/100
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#0A0A0A] border border-white/10 text-center">
              <span className="text-xs text-slate-400 block mb-1">Relatability Index</span>
              <span className="text-2xl font-black font-mono text-purple-400">
                {voiceover.analysis?.relatabilityScore || 92}/100
              </span>
            </div>
          </div>

          {voiceover.analysis?.retentionTips && (
            <div className="p-4 rounded-xl bg-[#0A0A0A] border border-white/10 space-y-2">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Retention & Editing Tips
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {voiceover.analysis.retentionTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {voiceover.analysis?.suggestedHashtags && (
            <div className="p-4 rounded-xl bg-[#0A0A0A] border border-white/10 space-y-2">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                Suggested Hashtags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {voiceover.analysis.suggestedHashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded-lg bg-white/5 text-indigo-300 border border-white/10 font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
