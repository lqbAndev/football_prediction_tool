import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Play, Calendar, Trophy, TrendingUp, FolderHeart, AlertTriangle } from 'lucide-react';
import {
  getSavedSimulations,
  deleteSimulation,
  loadSimulation,
  getCompetitionName,
  SavedSimulation,
} from '../utils/saveManager';
import { Toast } from '../components/Toast';

export default function SavedSimulations() {
  const navigate = useNavigate();
  const [saves, setSaves] = useState<SavedSimulation[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SavedSimulation | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load saves from localStorage on mount
  useEffect(() => {
    setSaves(getSavedSimulations());
  }, []);

  const handleLoad = (save: SavedSimulation) => {
    loadSimulation(save);
    setToastMessage(`Loaded: "${save.saveName}" successfully!`);
    
    // Redirect to correct URL based on competitionId and type
    setTimeout(() => {
      if (save.competitionId === 'wc26') {
        navigate('/competition/wc26');
      } else if (save.competitionId === 'test-league') {
        navigate('/competition/test-league');
      } else {
        navigate(`/competition/${save.competitionId}`);
      }
    }, 800);
  };

  const handleDeleteClick = (save: SavedSimulation) => {
    setDeleteTarget(save);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const success = deleteSimulation(deleteTarget.saveId);
    if (success) {
      setSaves(getSavedSimulations());
      setToastMessage('Simulation deleted successfully.');
    }
    setDeleteTarget(null);
  };

  const formatTimestamp = (ts: number): string => {
    const date = new Date(ts);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#060b13] via-[#091526] to-[#040810] text-white">
      {/* Glow effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/hub')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:-translate-x-0.5 hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                <FolderHeart className="h-8 w-8 text-indigo-400" />
                Saved Simulations
              </h1>
              <p className="mt-1 text-sm text-white/50">Manage your saved tournament and league predictions</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          {saves.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02] py-20 px-4 text-center backdrop-blur-md">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-white/30">
                <FolderHeart className="h-8 w-8" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-white">No saved simulations</h3>
              <p className="mt-2 max-w-sm text-sm text-white/40">
                Simulate a tournament or league, then click the "Save Process" button in the header to save your progress.
              </p>
              <button
                type="button"
                onClick={() => navigate('/hub')}
                className="mt-8 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Go to Competition Hub
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {saves.map((save) => {
                const compName = getCompetitionName(save.competitionId, save.competitionType);
                const isCup = save.competitionType === 'cup';

                return (
                  <div
                    key={save.saveId}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c1626]/80 p-6 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-indigo-500/5"
                  >
                    {/* Glowing highlight indicator */}
                    <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-indigo-500 to-transparent opacity-60 group-hover:from-indigo-400 group-hover:to-purple-500" />

                    <div className="flex flex-col h-full justify-between">
                      <div>
                        {/* Type Badge */}
                        <div className="flex items-center justify-between mb-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              isCup
                                ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20'
                                : 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20'
                            }`}
                          >
                            {isCup ? (
                              <>
                                <Trophy className="h-3 w-3" /> Cup Tournament
                              </>
                            ) : (
                              <>
                                <TrendingUp className="h-3 w-3" /> League Season
                              </>
                            )}
                          </span>
                        </div>

                        {/* Save Name */}
                        <h3 className="text-lg font-bold text-white leading-snug group-hover:text-indigo-300 transition-colors line-clamp-2">
                          {save.saveName}
                        </h3>

                        {/* Competition Name */}
                        <p className="mt-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
                          {compName}
                        </p>
                      </div>

                      <div className="mt-6">
                        {/* Timestamp */}
                        <div className="flex items-center gap-1.5 text-xs text-white/40 mb-5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatTimestamp(save.timestamp)}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleLoad(save)}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/12 py-2.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20 active:scale-[0.98]"
                          >
                            <Play className="h-3.5 w-3.5 fill-emerald-300" /> Load
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(save)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 transition hover:bg-rose-500/20 active:scale-[0.98]"
                            title="Delete Save File"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setDeleteTarget(null)} />

          <div className="brand-shell relative w-full max-w-md overflow-hidden p-6 sm:p-8">
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-rose-500 via-red-500 to-pink-500" />

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-500/15">
                <AlertTriangle className="h-6 w-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Delete Save</h3>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-white/70">
              Are you sure you want to delete <strong className="text-white">"{deleteTarget.saveName}"</strong>? This action is permanent and cannot be undone.
            </p>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 rounded-2xl border border-rose-500/25 bg-rose-500/20 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/35"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
}
