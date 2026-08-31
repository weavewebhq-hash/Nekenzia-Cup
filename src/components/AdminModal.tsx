import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Match, SetScore } from '../types';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Calendar,
  Save,
  Clock,
  Swords,
  Edit3,
  Link,
  Check
} from 'lucide-react';
import { getCompanyTheme } from '../utils/companyStyles';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const {
    rematchRequests,
    matches,
    players,
    adminApproveRematch,
    adminDeclineRematch,
    adminCorrectMatch,
    triggerHaptic,
    getMatchLockStatus
  } = useTournament();

  const [activeAdminTab, setActiveAdminTab] = useState<'rematches' | 'locked' | 'all_matches'>('rematches');
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editScoreP1, setEditScoreP1] = useState(12);
  const [editScoreP2, setEditScoreP2] = useState(6);
  const [editWinnerId, setEditWinnerId] = useState<string>('');
  const [editNotes, setEditNotes] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleCopyAdminLink = async () => {
    try {
      triggerHaptic('success');
      const url = new URL(window.location.href);
      url.searchParams.set('page', 'admin');
      await navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const getPlayer = (id: string) => players.find(p => p.id === id);

  // Filter 2-sided rematch requests where BOTH players requested and status is PENDING
  const pendingTwoSidedRematches = rematchRequests.filter(
    r => r.player1_requested && r.player2_requested && r.admin_status === 'PENDING'
  );

  const completedMatches = matches.filter(m => m.status === 'completed');

  const startEditMatch = (m: Match) => {
    setEditingMatchId(m.id);
    setEditScoreP1(m.scores[0]?.player1 ?? 12);
    setEditScoreP2(m.scores[0]?.player2 ?? 6);
    setEditWinnerId(m.winnerId || m.player1Id);
    setEditNotes(m.notes || 'Corrected by Admin');
  };

  const saveEditedMatch = (m: Match) => {
    const scores: SetScore[] = [
      { player1: Number(editScoreP1), player2: Number(editScoreP2) }
    ];
    adminCorrectMatch(m.id, scores, editWinnerId, editNotes);
    setEditingMatchId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#000000]/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#ffffff] dark:bg-[#141a24] rounded-t-2xl sm:rounded-2xl border border-[#e5e5e5] dark:border-[#263244] shadow-2xl p-5 sm:p-6 text-[#000000] dark:text-[#f8fafc] max-h-[88vh] flex flex-col z-10 pb-safe space-y-3 transition-colors duration-200">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-[#e5e5e5] dark:bg-[#263244] rounded-full mx-auto mb-2 sm:hidden" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#5f79ff] dark:text-[#7b8eff]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-light font-display-serif text-[#000000] dark:text-[#f8fafc]">
                  Tournament Admin Panel
                </h3>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-semibold bg-[#eef2ff] dark:bg-[#312e81]/40 text-[#5f79ff] dark:text-[#7b8eff]">
                  Committee
                </span>
              </div>
              <p className="text-xs text-[#707070] dark:text-[#94a3b8]">
                Manage rematches, override locked scores, and audit results
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAdminLink}
              className="px-2.5 py-1 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] hover:bg-[#eef2ff] dark:hover:bg-[#202b3d] text-[#5f79ff] dark:text-[#7b8eff] border border-[#e5e5e5] dark:border-[#263244] text-[11px] font-medium flex items-center gap-1 transition"
              title="Copy secret direct admin link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3 h-3 text-[#059669]" />
                  <span className="text-[#059669]">Copied!</span>
                </>
              ) : (
                <>
                  <Link className="w-3 h-3" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-7 h-7 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] text-[#707070] dark:text-[#94a3b8] hover:text-[#000000] dark:hover:text-[#f8fafc] flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex bg-[#f5f5f5] dark:bg-[#1a2230] p-1 rounded-full border border-[#e5e5e5] dark:border-[#263244] gap-1">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveAdminTab('rematches');
            }}
            className={`flex-1 py-1 text-xs font-semibold rounded-full transition flex items-center justify-center gap-1.5 ${
              activeAdminTab === 'rematches'
                ? 'bg-[#5f79ff] dark:bg-[#6378ff] text-white shadow-sm'
                : 'text-[#707070] dark:text-[#94a3b8] hover:text-[#000000] dark:hover:text-[#f8fafc]'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Rematches</span>
            {pendingTwoSidedRematches.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-[#01fe93] text-[#000000]">
                {pendingTwoSidedRematches.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveAdminTab('locked');
            }}
            className={`flex-1 py-1 text-xs font-semibold rounded-full transition flex items-center justify-center gap-1.5 ${
              activeAdminTab === 'locked'
                ? 'bg-[#5f79ff] dark:bg-[#6378ff] text-white shadow-sm'
                : 'text-[#707070] dark:text-[#94a3b8] hover:text-[#000000] dark:hover:text-[#f8fafc]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Locked Results</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveAdminTab('all_matches');
            }}
            className={`flex-1 py-1 text-xs font-semibold rounded-full transition flex items-center justify-center gap-1.5 ${
              activeAdminTab === 'all_matches'
                ? 'bg-[#5f79ff] dark:bg-[#6378ff] text-white shadow-sm'
                : 'text-[#707070] dark:text-[#94a3b8] hover:text-[#000000] dark:hover:text-[#f8fafc]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>All Matches</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 min-h-[260px]">
          {/* TAB 1: REMATCH REQUESTS */}
          {activeAdminTab === 'rematches' && (
            <div className="space-y-2.5">
              <div className="bg-[#fafafa] dark:bg-[#1a2230] p-3 rounded-xl border border-[#ebebeb] dark:border-[#263244] text-xs text-[#707070] dark:text-[#94a3b8]">
                💡 <strong>Rematch Rule</strong>: Only matches where <strong>BOTH</strong> players have independently requested a rematch appear here for committee review. Approved rematches do not alter official leaderboard points.
              </div>

              {pendingTwoSidedRematches.length === 0 ? (
                <div className="bg-[#fafafa] dark:bg-[#1a2230] p-8 rounded-xl border border-[#ebebeb] dark:border-[#263244] text-center text-[#707070] dark:text-[#94a3b8] text-xs">
                  No mutual rematch requests awaiting admin review.
                </div>
              ) : (
                pendingTwoSidedRematches.map(req => {
                  const p1 = getPlayer(req.player1_id);
                  const p2 = getPlayer(req.player2_id);

                  if (!p1 || !p2) return null;

                  const p1Theme = getCompanyTheme(p1.company);
                  const p2Theme = getCompanyTheme(p2.company);

                  return (
                    <div
                      key={req.id}
                      className="bg-[#fafafa] dark:bg-[#1a2230] p-3.5 rounded-xl border border-[#ebebeb] dark:border-[#263244] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-[#5f79ff] dark:text-[#7b8eff] uppercase tracking-wider">
                          Rematch Request
                        </span>
                        <span className="text-[10px] text-[#707070] dark:text-[#94a3b8]">
                          {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Matchup visual */}
                      <div className="flex items-center justify-between bg-[#ffffff] dark:bg-[#141a24] p-2.5 rounded-xl border border-[#e5e5e5] dark:border-[#263244]">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] text-[#000000] dark:text-[#f8fafc] font-bold flex items-center justify-center text-xs border border-[#e5e5e5] dark:border-[#263244]">
                            {p1.avatar}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-[#000000] dark:text-[#f8fafc] block">{p1.name}</span>
                            <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-semibold ${p1Theme.badgeBg} ${p1Theme.badgeText}`}>
                              {p1Theme.shortName}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-semibold text-[#5f79ff] dark:text-[#7b8eff]">VS</span>

                        <div className="flex items-center gap-2 text-right">
                          <div>
                            <span className="text-xs font-semibold text-[#000000] dark:text-[#f8fafc] block">{p2.name}</span>
                            <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-semibold ${p2Theme.badgeBg} ${p2Theme.badgeText}`}>
                              {p2Theme.shortName}
                            </span>
                          </div>
                          <div className="w-7 h-7 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] text-[#000000] dark:text-[#f8fafc] font-bold flex items-center justify-center text-xs border border-[#e5e5e5] dark:border-[#263244]">
                            {p2.avatar}
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#059669] dark:text-[#34d399] font-medium text-center">
                        ✓ Both players independently agreed and requested a rematch.
                      </p>

                      {/* Admin Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            triggerHaptic('success');
                            adminApproveRematch(req.id);
                          }}
                          className="flex-1 py-2 rounded-full bg-[#5f79ff] dark:bg-[#6378ff] hover:bg-[#4d69f0] dark:hover:bg-[#7b8eff] text-white font-medium text-xs transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve Rematch</span>
                        </button>

                        <button
                          onClick={() => {
                            triggerHaptic('medium');
                            adminDeclineRematch(req.id);
                          }}
                          className="px-4 py-2 rounded-full bg-[#f5f5f5] dark:bg-[#1e293b] hover:bg-[#ebebeb] dark:hover:bg-[#263244] text-[#4d4d4d] dark:text-[#cbd5e1] font-medium text-xs transition active:scale-95"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: LOCKED MATCHES */}
          {activeAdminTab === 'locked' && (
            <div className="space-y-2.5">
              <div className="bg-[#fafafa] dark:bg-[#1a2230] p-3 rounded-xl border border-[#ebebeb] dark:border-[#263244] text-xs text-[#707070] dark:text-[#94a3b8]">
                🔒 <strong>6-Hour Result Lock</strong>: Normal players cannot edit completed results after 6 hours. As an administrator, you have full authority to correct scores or reassign winners.
              </div>

              {completedMatches.map(m => {
                const p1 = getPlayer(m.player1Id);
                const p2 = getPlayer(m.player2Id);
                const lock = getMatchLockStatus(m);
                const isEditing = editingMatchId === m.id;

                if (!p1 || !p2) return null;

                return (
                  <div
                    key={m.id}
                    className="bg-[#fafafa] dark:bg-[#1a2230] p-3.5 rounded-xl border border-[#ebebeb] dark:border-[#263244] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {lock.isLocked ? (
                          <span className="text-[10px] font-semibold text-[#e11d48] dark:text-[#fb7185] bg-[#ffe4e6] dark:bg-[#e11d48]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>Result Locked</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-[#b45309] dark:text-[#fde68a] bg-[#fef3c7] dark:bg-[#78350f]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Window Open</span>
                          </span>
                        )}
                        <span className="text-[10px] text-[#707070] dark:text-[#94a3b8]">{m.court}</span>
                      </div>

                      <span className="text-[10px] text-[#707070] dark:text-[#94a3b8]">
                        {m.result_submitted_at ? new Date(m.result_submitted_at).toLocaleDateString() : 'Aug 21'}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="bg-[#ffffff] dark:bg-[#141a24] p-3 rounded-xl border border-[#e5e5e5] dark:border-[#263244] space-y-2.5">
                        <span className="text-xs font-semibold text-[#000000] dark:text-[#f8fafc] block">Edit Official Score:</span>

                        <div className="text-xs space-y-1.5">
                          <label className="text-[10px] text-[#707070] dark:text-[#94a3b8] block">Game Score ({p1.name} vs {p2.name})</label>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-semibold text-[#707070] dark:text-[#94a3b8]">{p1.name}:</span>
                              <input
                                type="number"
                                value={editScoreP1}
                                onChange={e => setEditScoreP1(Number(e.target.value))}
                                className="w-14 bg-[#fafafa] dark:bg-[#1a2230] border border-[#e5e5e5] dark:border-[#263244] rounded px-2 py-1 text-center font-mono font-bold text-[#000000] dark:text-[#f8fafc]"
                              />
                            </div>
                            <span className="font-bold text-[#707070] dark:text-[#94a3b8]">-</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-semibold text-[#707070] dark:text-[#94a3b8]">{p2.name}:</span>
                              <input
                                type="number"
                                value={editScoreP2}
                                onChange={e => setEditScoreP2(Number(e.target.value))}
                                className="w-14 bg-[#fafafa] dark:bg-[#1a2230] border border-[#e5e5e5] dark:border-[#263244] rounded px-2 py-1 text-center font-mono font-bold text-[#000000] dark:text-[#f8fafc]"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-[#707070] dark:text-[#94a3b8] block mb-1">Winner</label>
                          <select
                            value={editWinnerId}
                            onChange={e => setEditWinnerId(e.target.value)}
                            className="w-full bg-[#fafafa] dark:bg-[#1a2230] border border-[#e5e5e5] dark:border-[#263244] rounded-lg p-1.5 text-xs text-[#000000] dark:text-[#f8fafc]"
                          >
                            <option value={p1.id}>{p1.name} ({p1.company})</option>
                            <option value={p2.id}>{p2.name} ({p2.company})</option>
                          </select>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => saveEditedMatch(m)}
                            className="flex-1 py-1.5 bg-[#5f79ff] dark:bg-[#6378ff] hover:bg-[#4d69f0] dark:hover:bg-[#7b8eff] text-white font-medium text-xs rounded-full transition flex items-center justify-center gap-1"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Correction</span>
                          </button>
                          <button
                            onClick={() => setEditingMatchId(null)}
                            className="px-3 py-1.5 bg-[#f5f5f5] dark:bg-[#1e293b] hover:bg-[#ebebeb] dark:hover:bg-[#263244] text-[#4d4d4d] dark:text-[#cbd5e1] text-xs rounded-full"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div>
                          <span className="font-semibold text-[#000000] dark:text-[#f8fafc]">{p1.name}</span>
                          <span className="text-[#707070] dark:text-[#94a3b8] mx-1">vs</span>
                          <span className="font-semibold text-[#000000] dark:text-[#f8fafc]">{p2.name}</span>
                          <div className="font-mono text-[#5f79ff] dark:text-[#7b8eff] font-bold mt-0.5">
                            {m.scores.map(s => `${s.player1}-${s.player2}`).join(', ')}
                          </div>
                        </div>

                        <button
                          onClick={() => startEditMatch(m)}
                          className="px-3 py-1.5 rounded-full bg-[#f5f5f5] dark:bg-[#1e293b] hover:bg-[#ebebeb] dark:hover:bg-[#263244] text-[#000000] dark:text-[#f8fafc] text-xs font-medium transition flex items-center gap-1 border border-[#e5e5e5] dark:border-[#263244]"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#5f79ff] dark:text-[#7b8eff]" />
                          <span>Correct</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: ALL MATCHES */}
          {activeAdminTab === 'all_matches' && (
            <div className="space-y-2">
              {matches.map(m => {
                const p1 = getPlayer(m.player1Id);
                const p2 = getPlayer(m.player2Id);
                if (!p1 || !p2) return null;

                return (
                  <div
                    key={m.id}
                    className="bg-[#fafafa] dark:bg-[#1a2230] p-3 rounded-xl border border-[#ebebeb] dark:border-[#263244] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#000000] dark:text-[#f8fafc]">{p1.name}</span>
                        <span className="text-[#707070] dark:text-[#94a3b8]">vs</span>
                        <span className="font-semibold text-[#000000] dark:text-[#f8fafc]">{p2.name}</span>
                        {m.type === 'REMATCH' && (
                          <span className="text-[8px] px-1.5 py-0.2 bg-[#eef2ff] dark:bg-[#312e81]/40 text-[#5f79ff] dark:text-[#7b8eff] rounded-full font-semibold">
                            Rematch
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#707070] dark:text-[#94a3b8] mt-0.5">
                        {m.court} • {m.scheduledTime} • Status: <span className="text-[#5f79ff] dark:text-[#7b8eff] font-semibold">{m.status}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => startEditMatch(m)}
                      className="px-3 py-1 rounded-full bg-[#ffffff] dark:bg-[#141a24] hover:bg-[#f5f5f5] dark:hover:bg-[#1e293b] text-[#000000] dark:text-[#f8fafc] text-[11px] font-medium border border-[#e5e5e5] dark:border-[#263244]"
                    >
                      Edit
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
