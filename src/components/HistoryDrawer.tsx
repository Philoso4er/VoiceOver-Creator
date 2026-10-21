import React from 'react';
import { X, Play, Trash2, Clock, Download, Volume2 } from 'lucide-react';
import { VoiceoverResult } from '../types';
import { formatTimeShort } from '../utils/wavConverter';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: VoiceoverResult[];
  onSelectVoiceover: (vo: VoiceoverResult) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearAllHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectVoiceover,
  onDeleteHistoryItem,
  onClearAllHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-[#0D0D0D] border-l border-white/10 h-full flex flex-col justify-between p-5 sm:p-6 shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Voiceover Library</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-300 font-mono border border-white/10">
                {history.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* History List */}
          {history.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Volume2 className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No saved voiceovers yet</p>
              <p className="text-xs text-slate-500">
                Generated voiceovers will automatically save here for fast access.
              </p>
            </div>
          ) : (
            <div className="max-h-[calc(100vh-180px)] overflow-y-auto space-y-3 pr-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectVoiceover(item);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl bg-[#0A0A0A] border border-white/10 hover:border-indigo-500/50 hover:bg-white/5 transition-all cursor-pointer group space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-bold">
                        {item.voice}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatTimeShort(item.audioDurationSeconds)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHistoryItem(item.id);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-sans">
                    "{item.script}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Tone: {item.tone}</span>
                    <span className="text-indigo-400 font-medium group-hover:underline flex items-center gap-1">
                      <Play className="w-3 h-3 fill-indigo-400" />
                      Load & Play
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Clear All */}
        {history.length > 0 && (
          <div className="pt-3 border-t border-white/10">
            <button
              onClick={onClearAllHistory}
              className="w-full py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors cursor-pointer"
            >
              Clear Library History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
