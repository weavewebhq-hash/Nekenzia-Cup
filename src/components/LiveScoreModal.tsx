import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useTournament } from '../context/TournamentContext';
import { Match, SetScore } from '../types';
import {
  X,
  Trophy,
  CheckCircle2,
  Lock,
  Clock,
  Plus,
  Minus,
  Check,
  Sparkles,
  QrCode
} from 'lucide-react';
import { getCompanyTheme } from '../utils/companyStyles';
import { MatchQRModal } from './MatchQRModal';

interface LiveScoreModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LiveScoreModal: React.FC<LiveScoreModalProps> = ({ match, isOpen, onClose }) => {
  const {
    players,
    updateMatchScore,
    triggerCelebration,
    triggerHaptic,
    getMatchLockStatus,
    isAdminMode,
    currentPlayerId
  } = useTournament();

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  if (!isOpen || !match) return null;

  const player1 = players.find(p => p.id === match.player1Id);
  const player2 = players.find(p => p.id === match.player2Id);

  const p1Name = player1 ? player1.name : 'Player 1';
  const p2Name = player2 ? player2.name : 'Player 2';
  const p1Theme = getCompanyTheme(player1?.company);
  const p2Theme = getCompanyTheme(player2?.company);

  const lock = getMatchLockStatus(match);
  const isLocked = match.status === 'completed' && lock.isLocked && !isAdminMode;

  // Single game scores state (1 game match, target 12 points)
  const initialP1 = match.scores && match.scores[0] ? match.scores[0].player1 : 12;
  const initialP2 = match.scores && match.scores[0] ? match.scores[0].player2 : 6;

  const [p1Score, setP1Score] = useState<number>(initialP1);
  const [p2Score, setP2Score] = useState<number>(initialP2);

  // Selected Winner State (defaults to existing winner or whoever has higher score)
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>(
    match.winnerId || (initialP1 >= initialP2 ? match.player1Id : match.player2Id)
  );

  const [matchNotes] = useState(match.notes || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Score Presets (First to 12 points)
  const applyPreset = (winScore: number, loseScore: number) => {
    if (isLocked) return;
    triggerHaptic('light');
    const isP1Winner = selectedWinnerId === match.player1Id;
    if (isP1Winner) {
      setP1Score(winScore);
      setP2Score(loseScore);
    } else {
      setP1Score(loseScore);
      setP2Score(winScore);
    }
  };

  const handleScoreChange = (player: 'player1' | 'player2', delta: number) => {
    if (isLocked) return;
    triggerHaptic('light');

    if (player === 'player1') {
      const nextP1 = Math.max(0, Math.min(25, p1Score + delta));
      setP1Score(nextP1);
      if (nextP1 >= 12 && nextP1 > p2Score) {
        setSelectedWinnerId(match.player1Id);
      }
    } else {
      const nextP2 = Math.max(0, Math.min(25, p2Score + delta));
      setP2Score(nextP2);
      if (nextP2 >= 12 && nextP2 > p1Score) {
        setSelectedWinnerId(match.player2Id);
      }
    }
  };

  const handleSubmitFinalScore = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isLocked) {
      setErrorMessage('This match was completed more than 6 hours ago and is locked.');
      return;
    }

    if (!selectedWinnerId) {
      setErrorMessage('Please select the winning player.');
      return;
    }

    // Auto-determine winner from scores if unambiguous
    let finalWinnerId = selectedWinnerId;
    if (p1Score > p2Score) {
      finalWinnerId = match.player1Id;
    } else if (p2Score > p1Score) {
      finalWinnerId = match.player2Id;
    }

    // Record single game match score (1 game)
    const singleGameScores: SetScore[] = [
      { player1: p1Score, player2: p2Score }
    ];

    triggerHaptic('success');
    const res = updateMatchScore(
      match.id,
      singleGameScores,
      undefined,
      'completed',
      finalWinnerId,
      matchNotes.trim() || `Game score: ${p1Score} - ${p2Score}`,
      currentPlayerId || undefined
    );

    if (!res.success) {
      setErrorMessage(res.message || 'Could not save score');
      return;
    }

    triggerCelebration();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#000000]/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="relative w-full max-w-lg bg-[#ffffff] dark:bg-[#141a24] rounded-t-2xl sm:rounded-2xl border border-[#e5e5e5] dark:border-[#263244] shadow-2xl p-5 sm:p-6 text-[#000000] dark:text-[#f8fafc] max-h-[92vh] overflow-y-auto z-10 pb-safe transition-colors duration-200 space-y-4"
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-[#e5e5e5] dark:bg-[#263244] rounded-full mx-auto mb-1 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] flex items-center justify-center">
              <Trophy className="w-4 h-4 text-[#5f79ff] dark:text-[#7b8eff]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-semibold text-[#5f79ff] dark:text-[#7b8eff] uppercase tracking-wider">
                  1 Game Match
                </span>
                <span className="text-[9px] px-2 py-0.2 rounded-full font-semibold bg-[#eef2ff] dark:bg-[#312e81]/40 text-[#5f79ff] dark:text-[#7b8eff] border border-[#c7d2fe] dark:border-[#6366f1]/40">
                  Target: 12 Pts
                </span>
              </div>
              <h3 className="text-base font-light font-display-serif text-[#000000] dark:text-[#f8fafc]">
                Record Match Result
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsQRModalOpen(true);
              }}
              className="p-1.5 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] text-[#5f79ff] dark:text-[#7b8eff] hover:bg-[#eef2ff] dark:hover:bg-[#202b3d] border border-[#e5e5e5] dark:border-[#263244] transition flex items-center gap-1 text-xs px-2.5 font-medium"
              title="Share match QR code"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Link</span>
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

        {/* Match QR Sub-modal */}
        <MatchQRModal
          isOpen={isQRModalOpen}
          match={match}
          onClose={() => setIsQRModalOpen(false)}
        />

        {/* Lock Notice */}
        {match.status === 'completed' && (
          <div
            className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between ${
              isLocked
                ? 'bg-[#ffe4e6] dark:bg-[#e11d48]/20 border-[#fecdd3] dark:border-[#e11d48]/30 text-[#e11d48] dark:text-[#fb7185]'
                : 'bg-[#fffbeb] dark:bg-[#78350f]/30 border-[#fef3c7] dark:border-[#78350f] text-[#b45309] dark:text-[#fde68a]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              <span>{lock.displayText}</span>
            </span>
            {isLocked && <span className="font-semibold uppercase text-[10px]">Read-Only</span>}
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-[#ffe4e6] dark:bg-[#e11d48]/20 border border-[#fecdd3] dark:border-[#e11d48]/30 text-[#e11d48] dark:text-[#fb7185] text-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmitFinalScore} className="space-y-4">
          {/* 1. SELECT MATCH WINNER */}
          <div>
            <label className="block text-[11px] font-semibold text-[#707070] dark:text-[#94a3b8] uppercase tracking-wider mb-2">
              1. Match Winner (Receives 1 Tournament Pt)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Player 1 Card */}
              <button
                type="button"
                disabled={isLocked}
                onClick={() => {
                  triggerHaptic('medium');
                  setSelectedWinnerId(match.player1Id);
                  if (p1Score < 12) setP1Score(12);
                }}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  selectedWinnerId === match.player1Id
                    ? 'bg-[#e6fcf3] dark:bg-[#064e3b]/30 border-[#a7f3d0] dark:border-[#059669]/40 ring-1 ring-[#059669]'
                    : 'bg-[#fafafa] dark:bg-[#1a2230] border-[#ebebeb] dark:border-[#263244] hover:bg-[#f5f5f5] dark:hover:bg-[#1e293b]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-[#141a24] border border-[#e5e5e5] dark:border-[#263244] text-[#000000] dark:text-[#f8fafc] font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
                    {player1?.avatar || 'P1'}
                  </div>
                  <div className="min-w-0">
                    <span className="block font-semibold text-xs text-[#000000] dark:text-[#f8fafc] truncate">
                      {p1Name}
                    </span>
                    {p1Theme && (
                      <span className={`text-[8px] font-semibold ${p1Theme.badgeText}`}>
                        {p1Theme.shortName}
                      </span>
                    )}
                  </div>
                </div>
                {selectedWinnerId === match.player1Id && (
                  <div className="w-5 h-5 rounded-full bg-[#059669] dark:bg-[#34d399] text-white dark:text-black flex items-center justify-center flex-shrink-0 ml-1 shadow-sm">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>

              {/* Player 2 Card */}
              <button
                type="button"
                disabled={isLocked}
                onClick={() => {
                  triggerHaptic('medium');
                  setSelectedWinnerId(match.player2Id);
                  if (p2Score < 12) setP2Score(12);
                }}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  selectedWinnerId === match.player2Id
                    ? 'bg-[#e6fcf3] dark:bg-[#064e3b]/30 border-[#a7f3d0] dark:border-[#059669]/40 ring-1 ring-[#059669]'
                    : 'bg-[#fafafa] dark:bg-[#1a2230] border-[#ebebeb] dark:border-[#263244] hover:bg-[#f5f5f5] dark:hover:bg-[#1e293b]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-[#141a24] border border-[#e5e5e5] dark:border-[#263244] text-[#000000] dark:text-[#f8fafc] font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
                    {player2?.avatar || 'P2'}
                  </div>
                  <div className="min-w-0">
                    <span className="block font-semibold text-xs text-[#000000] dark:text-[#f8fafc] truncate">
                      {p2Name}
                    </span>
                    {p2Theme && (
                      <span className={`text-[8px] font-semibold ${p2Theme.badgeText}`}>
                        {p2Theme.shortName}
                      </span>
                    )}
                  </div>
                </div>
                {selectedWinnerId === match.player2Id && (
                  <div className="w-5 h-5 rounded-full bg-[#059669] dark:bg-[#34d399] text-white dark:text-black flex items-center justify-center flex-shrink-0 ml-1 shadow-sm">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* 2. QUICK SCORE PRESETS (Target: 12 Pts) */}
          {!isLocked && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-[#707070] dark:text-[#94a3b8] uppercase tracking-wider">
                  2. Quick 1-Tap Score Presets
                </label>
                <span className="text-[10px] text-[#5f79ff] dark:text-[#7b8eff]">First to 12</span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[
                  { label: '12-6', win: 12, lose: 6 },
                  { label: '12-8', win: 12, lose: 8 },
                  { label: '12-10', win: 12, lose: 10 },
                  { label: '12-4', win: 12, lose: 4 },
                  { label: '12-2', win: 12, lose: 2 },
                  { label: '12-0', win: 12, lose: 0 }
                ].map(p => (
                  <motion.button
                    key={p.label}
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={() => applyPreset(p.win, p.lose)}
                    className="py-2 px-1 rounded-xl bg-[#f5f5f5] dark:bg-[#1a2230] hover:bg-[#eef2ff] dark:hover:bg-[#312e81]/40 hover:text-[#5f79ff] dark:hover:text-[#7b8eff] border border-[#e5e5e5] dark:border-[#263244] text-xs font-mono font-bold text-[#000000] dark:text-[#f8fafc] text-center transition"
                  >
                    {p.label}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* 3. GAME SCOREBOARD STEPPERS */}
          <div className="bg-[#fafafa] dark:bg-[#1a2230] p-4 rounded-xl border border-[#ebebeb] dark:border-[#263244] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#000000] dark:text-[#f8fafc] uppercase tracking-wider">
                3. Final Points (1 Game)
              </label>
              <span className="text-[10px] font-mono text-[#059669] dark:text-[#34d399] bg-[#e6fcf3] dark:bg-[#064e3b]/30 px-2 py-0.5 rounded-full border border-[#a7f3d0] dark:border-[#059669]/40 font-semibold">
                Winner: {selectedWinnerId === match.player1Id ? p1Name : p2Name}
              </span>
            </div>

            {/* Scoreboard Card */}
            <div className="bg-[#ffffff] dark:bg-[#141a24] p-3.5 rounded-xl border border-[#e5e5e5] dark:border-[#263244] flex items-center justify-around gap-2">
              {/* Player 1 Stepper */}
              <div className="flex flex-col items-center space-y-2">
                <span className="text-xs font-semibold text-[#000000] dark:text-[#f8fafc] text-center truncate max-w-[110px]">
                  {p1Name}
                </span>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleScoreChange('player1', -1)}
                    className="w-8 h-8 rounded-xl bg-[#f5f5f5] dark:bg-[#1e293b] text-[#000000] dark:text-[#f8fafc] flex items-center justify-center hover:bg-[#ebebeb] dark:hover:bg-[#263244] disabled:opacity-30 border border-[#e5e5e5] dark:border-[#263244]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </motion.button>
                  <div
                    className={`w-12 h-12 rounded-xl border font-mono font-bold text-xl flex items-center justify-center shadow-inner ${
                      p1Score >= 12
                        ? 'bg-[#e6fcf3] dark:bg-[#064e3b]/30 border-[#a7f3d0] dark:border-[#059669]/40 text-[#059669] dark:text-[#34d399]'
                        : 'bg-[#fafafa] dark:bg-[#1a2230] border-[#e5e5e5] dark:border-[#263244] text-[#000000] dark:text-[#f8fafc]'
                    }`}
                  >
                    {p1Score}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleScoreChange('player1', 1)}
                    className="w-8 h-8 rounded-xl bg-[#f5f5f5] dark:bg-[#1e293b] text-[#000000] dark:text-[#f8fafc] flex items-center justify-center hover:bg-[#ebebeb] dark:hover:bg-[#263244] disabled:opacity-30 border border-[#e5e5e5] dark:border-[#263244]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </div>

              {/* VS Divider */}
              <div className="flex flex-col items-center justify-center px-1">
                <span className="text-xs font-bold text-[#a6a6a6] dark:text-[#64748b]">VS</span>
                <span className="text-[9px] text-[#707070] dark:text-[#94a3b8]">1 Game</span>
              </div>

              {/* Player 2 Stepper */}
              <div className="flex flex-col items-center space-y-2">
                <span className="text-xs font-semibold text-[#000000] dark:text-[#f8fafc] text-center truncate max-w-[110px]">
                  {p2Name}
                </span>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleScoreChange('player2', -1)}
                    className="w-8 h-8 rounded-xl bg-[#f5f5f5] dark:bg-[#1e293b] text-[#000000] dark:text-[#f8fafc] flex items-center justify-center hover:bg-[#ebebeb] dark:hover:bg-[#263244] disabled:opacity-30 border border-[#e5e5e5] dark:border-[#263244]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </motion.button>
                  <div
                    className={`w-12 h-12 rounded-xl border font-mono font-bold text-xl flex items-center justify-center shadow-inner ${
                      p2Score >= 12
                        ? 'bg-[#e6fcf3] dark:bg-[#064e3b]/30 border-[#a7f3d0] dark:border-[#059669]/40 text-[#059669] dark:text-[#34d399]'
                        : 'bg-[#fafafa] dark:bg-[#1a2230] border-[#e5e5e5] dark:border-[#263244] text-[#000000] dark:text-[#f8fafc]'
                    }`}
                  >
                    {p2Score}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleScoreChange('player2', 1)}
                    className="w-8 h-8 rounded-xl bg-[#f5f5f5] dark:bg-[#1e293b] text-[#000000] dark:text-[#f8fafc] flex items-center justify-center hover:bg-[#ebebeb] dark:hover:bg-[#263244] disabled:opacity-30 border border-[#e5e5e5] dark:border-[#263244]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#f5f5f5] dark:bg-[#1a2230] hover:bg-[#ebebeb] dark:hover:bg-[#263244] text-[#4d4d4d] dark:text-[#cbd5e1] rounded-full font-medium text-xs transition"
            >
              Cancel
            </button>
            {!isLocked && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="submit"
                className="flex-1 py-3 bg-[#5f79ff] dark:bg-[#6378ff] hover:bg-[#4d69f0] dark:hover:bg-[#7b8eff] text-white font-medium rounded-full text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Score</span>
              </motion.button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};
