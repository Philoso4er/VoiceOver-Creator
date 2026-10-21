import React, { useState, useRef } from 'react';
import { FileText, Upload, Sparkles, Wand2, Clock, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { ScriptTemplate, ViralTone } from '../types';
import { SCRIPT_TEMPLATES } from '../data/presetVoices';

interface ScriptInputSectionProps {
  script: string;
  setScript: (s: string) => void;
  selectedTone: ViralTone;
  onSelectTemplate: (t: ScriptTemplate) => void;
  onOptimizeScript: () => void;
  isOptimizing: boolean;
  optimizedData?: {
    optimizedScript: string;
    viralHook: string;
    hookScore: number;
    pacingScore: number;
    retentionTips: string[];
  } | null;
  onApplyOptimized: (optScript: string) => void;
}

export const ScriptInputSection: React.FC<ScriptInputSectionProps> = ({
  script,
  setScript,
  selectedTone,
  onSelectTemplate,
  onOptimizeScript,
  isOptimizing,
  optimizedData,
  onApplyOptimized,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;
  const charCount = script.length;
  // Estimate ~150 words per minute spoken
  const estimatedSeconds = Math.round((wordCount / 150) * 60);

  const handleFileUpload = (file: File) => {
    setUploadError(null);
    if (!file) return;

    // Check file extension
    const name = file.name.toLowerCase();
    if (!name.endsWith('.txt') && !name.endsWith('.md') && !name.endsWith('.json') && !name.endsWith('.srt') && !name.endsWith('.vtt') && !name.endsWith('.doc')) {
      setUploadError('Supported file formats: .txt, .md, .srt, .vtt, .json, .doc text files');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setScript(text);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read file contents.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5">
      {/* Header & File Upload trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            Script Editor & File Upload
          </label>
          <p className="text-xs text-slate-400 mt-0.5">
            Write your script, select a template, or upload a file (.txt, .md, .srt)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            accept=".txt,.md,.srt,.vtt,.json,.doc"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            Upload File
          </button>
        </div>
      </div>

      {/* Quick Template Selector */}
      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Viral Script Templates
        </label>
        <div className="flex flex-wrap gap-2">
          {SCRIPT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => onSelectTemplate(tpl)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 hover:border-indigo-500/50 text-slate-300 hover:text-white border border-white/10 transition-all text-left flex items-center gap-1.5 cursor-pointer"
            >
              <span>{tpl.title}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                {tpl.category}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Script Text Area with Drag & Drop Overlay */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-xl transition-all ${
          isDragging ? 'ring-2 ring-indigo-500 bg-indigo-500/5' : ''
        }`}
      >
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Paste or write your voiceover script here... (e.g. 'Ever wondered why some videos just go viral while others disappear? It\'s not just the hook, it\'s the relatable delivery...')"
          rows={6}
          className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80 transition-all resize-y min-h-[140px] font-sans leading-relaxed"
        />

        {isDragging && (
          <div className="absolute inset-0 bg-[#0A0A0A]/95 border-2 border-dashed border-indigo-500 rounded-xl flex items-center justify-center p-4 z-10">
            <div className="text-center space-y-2">
              <Upload className="w-8 h-8 text-indigo-400 mx-auto animate-bounce" />
              <p className="text-sm font-semibold text-white">Drop text file here</p>
              <p className="text-xs text-slate-400">Supports .txt, .md, .srt, .vtt</p>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Word / Char Counter & Optimize Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
          <span>
            CHARACTERS: <strong className="text-slate-300">{charCount}</strong>
          </span>
          <span>
            WORDS: <strong className="text-slate-300">{wordCount}</strong>
          </span>
          <span className="flex items-center gap-1 text-indigo-400 font-medium">
            <Clock className="w-3.5 h-3.5" />
            EST. DURATION: ~{estimatedSeconds}s
          </span>
        </div>

        <button
          onClick={onOptimizeScript}
          disabled={!script.trim() || isOptimizing}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isOptimizing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              Optimizing Virality...
            </>
          ) : (
            <>
              <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
              Optimize Script with AI
            </>
          )}
        </button>
      </div>

      {/* AI Script Optimization Suggestion Card */}
      {optimizedData && (
        <div className="mt-4 p-4 rounded-xl bg-[#0A0A0A] border border-indigo-500/30 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                AI Viral Enhancement Preview
              </h3>
            </div>
            <button
              onClick={() => onApplyOptimized(optimizedData.optimizedScript)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Apply to Script
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded bg-white/5 border border-white/10">
              <span className="text-slate-400">Viral Hook Score:</span>
              <span className="ml-1.5 font-bold text-indigo-400">{optimizedData.hookScore}/100</span>
            </div>
            <div className="p-2 rounded bg-white/5 border border-white/10">
              <span className="text-slate-400">Pacing Score:</span>
              <span className="ml-1.5 font-bold text-emerald-400">{optimizedData.pacingScore}/100</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-medium">3-Second Viral Opening Hook:</span>
            <p className="text-xs text-indigo-200 font-semibold bg-indigo-500/10 p-2 rounded border border-indigo-500/20 mt-1">
              "{optimizedData.viralHook}"
            </p>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-medium">Enhanced Script Version:</span>
            <p className="text-xs text-slate-200 bg-white/5 p-2.5 rounded border border-white/10 mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {optimizedData.optimizedScript}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
