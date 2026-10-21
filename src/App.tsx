import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ScriptInputSection } from './components/ScriptInputSection';
import { VoiceSelector } from './components/VoiceSelector';
import { CaptionPreviewPlayer } from './components/CaptionPreviewPlayer';
import { TranscriptionAndCaptions } from './components/TranscriptionAndCaptions';
import { HistoryDrawer } from './components/HistoryDrawer';
import { VoiceName, ViralTone, VoiceoverResult, ScriptTemplate } from './types';
import { SCRIPT_TEMPLATES } from './data/presetVoices';
import { pcmBase64ToWavBlobUrl } from './utils/wavConverter';
import { optimizeScript, generateVoiceover, MissingApiKeyError } from './lib/gemini';
import { ApiKeySettings } from './components/ApiKeySettings';
import { Sparkles, Mic, Wand2, RefreshCw, AlertCircle, Play } from 'lucide-react';

export default function App() {
  const [script, setScript] = useState<string>(SCRIPT_TEMPLATES[0].script);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [selectedTone, setSelectedTone] = useState<ViralTone>('tiktok_viral');
  const [speed, setSpeed] = useState<number>(1.0);

  // Multi-Speaker options
  const [multiSpeaker, setMultiSpeaker] = useState<boolean>(false);
  const [speaker2Voice, setSpeaker2Voice] = useState<VoiceName>('Puck');
  const [speaker2Script, setSpeaker2Script] = useState<string>(
    'Wait, are you serious? Let me test this right now!'
  );

  // Generation & AI states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [optimizedData, setOptimizedData] = useState<any | null>(null);

  // Active Voiceover Result & Audio Blob URL
  const [currentVoiceover, setCurrentVoiceover] = useState<VoiceoverResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [seekRequest, setSeekRequest] = useState<{ time: number; id: number } | null>(null);

  const handleSeekToTime = (time: number) => {
    setSeekRequest({ time, id: Date.now() });
  };

  // History Drawer state & localStorage
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<VoiceoverResult[]>([]);

  // Load history from localStorage on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem('viral_voiceovers_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage:', e);
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (item: VoiceoverResult) => {
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.id !== item.id);
      const updated = [item, ...filtered].slice(0, 20); // Keep last 20
      try {
        localStorage.setItem('viral_voiceovers_history', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
      return updated;
    });
  };

  // Select script template
  const handleSelectTemplate = (tpl: ScriptTemplate) => {
    setScript(tpl.script);
    setSelectedVoice(tpl.suggestedVoice);
    setSelectedTone(tpl.suggestedTone);
    setOptimizedData(null);
  };

  // Optimize script via Gemini (client-side)
  const handleOptimizeScript = async () => {
    if (!script.trim()) return;
    setIsOptimizing(true);
    setGenerationError(null);

    try {
      const data = await optimizeScript(script, selectedTone);
      setOptimizedData(data);
    } catch (err: any) {
      console.error('Optimize script error:', err);
      if (err instanceof MissingApiKeyError) setIsSettingsOpen(true);
      setGenerationError(err.message || 'Failed to optimize script.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Generate voiceover via Gemini (client-side)
  const handleGenerateVoiceover = async () => {
    if (!script.trim()) return;
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const result: VoiceoverResult = await generateVoiceover({
          script,
          voice: selectedVoice,
          tone: selectedTone,
          speed,
          multiSpeaker,
          speaker2Voice,
          speaker2Script,
      });

      // Convert PCM Base64 to Blob URL for audio player
      const { url, durationSeconds } = pcmBase64ToWavBlobUrl(result.audioBase64);
      result.audioDurationSeconds = durationSeconds;

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      setAudioUrl(url);
      setCurrentVoiceover(result);
      saveToHistory(result);
    } catch (err: any) {
      console.error('Generate voiceover error:', err);
      if (err instanceof MissingApiKeyError) setIsSettingsOpen(true);
      setGenerationError(err.message || 'Failed to generate voiceover.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Load past item from history
  const handleSelectHistoryItem = (item: VoiceoverResult) => {
    setCurrentVoiceover(item);
    setScript(item.script);
    setSelectedVoice(item.voice);
    setSelectedTone(item.tone);

    if (item.audioBase64) {
      const { url } = pcmBase64ToWavBlobUrl(item.audioBase64);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(url);
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      localStorage.setItem('viral_voiceovers_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem('viral_voiceovers_history');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <ApiKeySettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTemplates={() => {
          const section = document.getElementById('script-section');
          section?.scrollIntoView({ behavior: 'smooth' });
        }}
        savedCount={history.length}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner */}
        <div className="relative rounded-3xl bg-[#0D0D0D] border border-white/10 p-6 sm:p-8 overflow-hidden shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Gemini 3.1 TTS Engine • Studio Audio • Timed Captions
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Turn Scripts into <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">Viral & Relatable</span> Voiceovers
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Create instant studio-quality voiceovers with prebuilt AI voice actors, timestamped captions, transcriptions, and downloadable audio for TikTok, Instagram Reels, and YouTube Shorts.
            </p>
          </div>
        </div>

        {/* Form Controls Grid */}
        <div id="script-section" className="space-y-8">
          <ScriptInputSection
            script={script}
            setScript={setScript}
            selectedTone={selectedTone}
            onSelectTemplate={handleSelectTemplate}
            onOptimizeScript={handleOptimizeScript}
            isOptimizing={isOptimizing}
            optimizedData={optimizedData}
            onApplyOptimized={(opt) => {
              setScript(opt);
              setOptimizedData(null);
            }}
          />

          <VoiceSelector
            selectedVoice={selectedVoice}
            onSelectVoice={setSelectedVoice}
            selectedTone={selectedTone}
            onSelectTone={setSelectedTone}
            speed={speed}
            onSpeedChange={setSpeed}
            multiSpeaker={multiSpeaker}
            onToggleMultiSpeaker={setMultiSpeaker}
            speaker2Voice={speaker2Voice}
            onSelectSpeaker2Voice={setSpeaker2Voice}
            speaker2Script={speaker2Script}
            onSpeaker2ScriptChange={setSpeaker2Script}
          />

          {/* Big Action Bar */}
          <div className="flex flex-col items-center justify-center p-6 bg-[#0D0D0D] border border-white/10 rounded-2xl shadow-2xl space-y-3">
            {generationError && (
              <div className="w-full flex items-center justify-between gap-3 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{generationError}</span>
                </div>
                <button
                  onClick={handleGenerateVoiceover}
                  disabled={isGenerating}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                >
                  Retry Now
                </button>
              </div>
            )}

            <button
              onClick={handleGenerateVoiceover}
              disabled={!script.trim() || isGenerating}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base bg-indigo-500 hover:bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                  Generating Audio & Aligning Timestamps...
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Generate Viral Voiceover & Captions
                </>
              )}
            </button>
            <p className="text-xs text-slate-400 text-center">
              Generates high-resolution audio, exact word timestamps, and downloadable .WAV & .SRT files
            </p>
          </div>
        </div>

        {/* Results Section: Live Player & Captions */}
        {currentVoiceover && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CaptionPreviewPlayer voiceover={currentVoiceover} audioUrl={audioUrl} seekRequest={seekRequest} />
            <TranscriptionAndCaptions voiceover={currentVoiceover} onSeekToTime={handleSeekToTime} />
          </div>
        )}
      </main>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectVoiceover={handleSelectHistoryItem}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onClearAllHistory={handleClearAllHistory}
      />
    </div>
  );
}
