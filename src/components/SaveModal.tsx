import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (saveName: string) => void;
  defaultSaveName?: string;
}

export const SaveModal = ({ isOpen, onClose, onSave, defaultSaveName = '' }: SaveModalProps) => {
  const [name, setName] = useState(defaultSaveName);

  useEffect(() => {
    if (isOpen) {
      setName(defaultSaveName);
    }
  }, [isOpen, defaultSaveName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="brand-shell relative w-full max-w-md overflow-hidden p-6 sm:p-8"
      >
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-500/15">
            <Save className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Save Process</h3>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-white/70">
          Enter a name for this simulation save slot to retrieve it later.
        </p>

        <div className="mt-5">
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My Simulation - Final Match"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-2xl border border-indigo-500/25 bg-indigo-500/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500/30"
          >
            Save Simulation
          </button>
        </div>
      </form>
    </div>
  );
};
