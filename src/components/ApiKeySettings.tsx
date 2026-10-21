import React, { useEffect, useState } from 'react';
import { KeyRound, X, ExternalLink, Trash2, Eye, EyeOff } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey, clearStoredApiKey } from '../lib/gemini';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeySettings: React.FC<Props> = ({ isOpen, onClose }) => {
  const [value, setValue] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const k = getStoredApiKey();
      setValue(k);
      setHasKey(!!k);
      setStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const save = () => {
    if (!value.trim()) return;
    setStoredApiKey(value);
    setHasKey(true);
    setStatus('Saved in this browser.');
  };

  const clear = () => {
    clearStoredApiKey();
    setValue('');
    setHasKey(false);
    setStatus('Key cleared from this browser.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-[#151515] border border-white/10 p-6 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-white">
            <KeyRound className="w-4 h-4 text-indigo-400" /> Gemini API Key
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          This app runs entirely in your browser and calls Gemini with your own key. The key is stored only in
          this browser's localStorage and is sent only to Google.
        </p>

        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
        >
          Get a free key at aistudio.google.com <ExternalLink className="w-3 h-3" />
        </a>

        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="Paste your Gemini API key"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            aria-label={show ? 'Hide key' : 'Show key'}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={clear}
            disabled={!hasKey}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear key
          </button>
          <button
            onClick={save}
            disabled={!value.trim()}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            Save key
          </button>
        </div>

        {status && <p className="text-[11px] text-emerald-400">{status}</p>}
        <p className="text-[11px] text-slate-500">{hasKey ? 'A key is currently saved.' : 'No key saved yet.'}</p>
      </div>
    </div>
  );
};
