import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useTournament } from '../context/TournamentContext';
import { Player, Match } from '../types';
import {
  X,
  Trophy,
  Calendar,
  Clock,
  Swords,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { getCompanyTheme } from '../utils/companyStyles';
import { RulesFaqCard } from './RulesFaqCard';
import { MatchupClashModal } from './MatchupClashModal';

interface PlayerProfileModalProps {
  player?: Player | null;
  isOpen?: boolean;
  onClose?: () => void;
  onSelectMatchForScore?: (match: Match) => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  player: propPlayer,
  isOpen: propIsOpen,
  onClose: propOnClose,
  onSelectMatchForScore
}) => {
  const {
    selectedPlayerForProfile,
    setSelectedPlayerForProfile,
    players,
    matches,
    currentPlayer,
    rematchRequests,
    requestRematch,
    declineRematch,
    scheduleMatchWithOpponent,
    triggerHaptic
  } = useTournament();

  const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [showProfileClash, setShowProfileClash] = useState(false);
  const [clashPendingMatch, setClashPendingMatch] = useState<Match | null>(null);

  const player = propPlayer ?? selectedPlayerForProfile;
  const isOpen = propIsOpen !== undefined ? propIsOpen : Boolean(selectedPlayerForProfile);

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      setSelectedPlayerForProfile(null);
    }
  };

  const handleStartGame = () => {
    if (!player) return;
    triggerHaptic('success');
    const newMatch = scheduleMatchWithOpponent(player.id);
    setClashPendingMatch(newMatch);
    setShowProfileClash(true);
  };

  const handleProfileClashComplete = () => {
    setShowProfileClash(false);
    handleClose();
    if (onSelectMatchForScore && clashPendingMatch) {
      setTimeout(() => {
        onSelectMatchForScore(clashPendingMatch);
        setClashPendingMatch(null);
      }, 50);
    }
  };

  if (!isOpen || !player) return null;

  const companyTheme = getCompanyTheme(player.company);
  const getPlayer = (id: string): Player | undefined => players.find(p => p.id === id);

  // Find all matches for this player
  const playerMatches = matches
    .filter(m => m.player1Id === player.id || m.player2Id === player.id)
    .sort((a, b) => {
      const timeA = new Date(a.result_submitted_at || a.scheduled_at || 0).getTime();
      const timeB = new Date(b.result_submitted_at || b.scheduled_at || 0).getTime();
      return timeB - timeA;
    });

  const filteredMatches = playerMatches.filter(m => {
    if (filterTab === 'upcoming') {
      return m.status === 'scheduled' || m.status === 'live' || m.status === 'warmup';
    }
    if (filterTab === 'completed') {
      return m.status === 'completed' || m.status === 'walkover';
    }
    return true;
  });

  const isMe = currentPlayer?.id === player.id;
  const directMatch = currentPlayer && !isMe
    ? matches.find(
        m =>
          ((m.player1Id === currentPlayer.id && m.player2Id === player.id) ||
            (m.player1Id === player.id && m.player2Id === currentPlayer.id)) &&
          m.type === 'OFFICIAL'
      )
    : null;

  const existingRematchReq = directMatch
    ? rematchRequests.find(r => r.original_match_id === directMatch.id)
    : null;

  const isCurrentP1 = directMatch ? currentPlayer?.id === directMatch.player1Id : false;
  const hasCurrentUserRequestedRematch = existingRematchReq
    ? isCurrentP1
      ? existingRematchReq.player1_requested
      : existingRematchReq.player2_requested
    : false;

  const hasOpponentRequestedRematch = existingRematchReq
    ? isCurrentP1
      ? existingRematchReq.player2_requested
      : existingRematchReq.player1_requested
    : false;

  const isRematchApproved = existingRematchReq?.admin_status === 'APPROVED';
  const isRematchPendingAdmin =
    existingRematchReq?.player1_requested &&
    existingRematchReq?.player2_requested &&
    existingRematchReq.admin_status === 'PENDING';

  const { stats } = player;
  const pointDiff = stats.pointDiff ?? (stats.pointsScored - stats.pointsConceded) ?? (stats.gamesWon - stats.gamesLost);
  const pointsScored = stats.pointsScored ?? stats.gamesWon;
  const pointsConceded = stats.pointsConceded ?? stats.gamesLost;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#000000]/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#ffffff] dark:bg-[#141a24] rounded-t-2xl sm:rounded-2xl border border-[#e5e5e5] dark:border-[#263244] shadow-2xl p-5 sm:p-6 text-[#000000] dark:text-[#f8fafc] max-h-[90vh] overflow-y-auto z-10 pb-safe space-y-4 transition-colors duration-200">
        {/* Mobile handle */}
        <div className="w-10 h-1 bg-[#e5e5e5] dark:bg-[#263244] rounded-full mx-auto mb-2 sm:hidden" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] border border-[#e5e5e5] dark:border-[#263244] text-[#000000] dark:text-[#f8fafc] font-bold flex items-center justify-center text-base shadow-sm flex-shrink-0"
            >
              {player.avatar}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-light font-display-serif text-[#000000] dark:text-[#f8fafc]">
                  {player.name}
                </h3>
                {isMe && (
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-semibold bg-[#5f79ff] dark:bg-[#6378ff] text-white">
                    YOU
                  </span>
                )}
                {player.seed && (
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-semibold bg-[#f5f5f5] dark:bg-[#1a2230] text-[#707070] dark:text-[#94a3b8] border border-[#e5e5e5] dark:border-[#263244]">
                    Seed #{player.seed}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${companyTheme.badgeBg} ${companyTheme.badgeText}`}
                >
                  <span>{player.company}</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              handleClose();
            }}
            className="w-7 h-7 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] text-[#707070] dark:text-[#94a3b8] hover:text-[#000000] dark:hover:text-[#f8fafc] flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tactical Stat Badges */}
        <div className="grid grid-cols-4 gap-2 bg-[#fafafa] dark:bg-[#1a2230] p-2.5 rounded-xl border border-[#ebebeb] dark:border-[#263244]">
          <div className="bg-[#ffffff] dark:bg-[#141a24] p-2 rounded-lg text-center border border-[#e5e5e5] dark:border-[#263244]">
            <p className="text-[9px] text-[#707070] dark:text-[#94a3b8] uppercase font-semibold">Record</p>
            <p className="text-xs sm:text-sm font-bold text-[#000000] dark:text-[#f8fafc] font-mono mt-0.5">
              {stats.won}W - {stats.lost}L
            </p>
          </div>
          <div className="bg-[#ffffff] dark:bg-[#141a24] p-2 rounded-lg text-center border border-[#e5e5e5] dark:border-[#263244]">
            <p className="text-[9px] text-[#707070] dark:text-[#94a3b8] uppercase font-semibold">Points</p>
            <p className="text-xs sm:text-sm font-bold text-[#5f79ff] dark:text-[#7b8eff] font-mono mt-0.5">
              {stats.points} pts
            </p>
          </div>
          <div className="bg-[#ffffff] dark:bg-[#141a24] p-2 rounded-lg text-center border border-[#e5e5e5] dark:border-[#263244]">
            <p className="text-[9px] text-[#707070] dark:text-[#94a3b8] uppercase font-semibold">+/- Diff</p>
            <p className={`text-xs sm:text-sm font-bold font-mono mt-0.5 ${pointDiff >= 0 ? 'text-[#059669] dark:text-[#34d399]' : 'text-[#e11d48] dark:text-[#fb7185]'}`}>
              {pointDiff > 0 ? `+${pointDiff}` : pointDiff}
            </p>
          </div>
          <div className="bg-[#ffffff] dark:bg-[#141a24] p-2 rounded-lg text-center border border-[#e5e5e5] dark:border-[#263244]">
            <p className="text-[9px] text-[#707070] dark:text-[#94a3b8] uppercase font-semibold">PF / PA</p>
            <p className="text-xs sm:text-sm font-bold text-[#000000] dark:text-[#f8fafc] font-mono mt-0.5 truncate">
              {pointsScored}/{pointsConceded}
            </p>
          </div>
        </div>

        {/* Actions Between Logged In User and Viewed Player */}
        {!isMe && currentPlayer && (
          <div className="bg-[#fafafa] dark:bg-[#1a2230] p-3.5 rounded-xl border border-[#ebebeb] dark:border-[#263244] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#707070] dark:text-[#94a3b8] font-medium">
                Your Match Status with {player.name.split(' ')[0]}:
              </span>
              {directMatch?.status === 'completed' ? (
                <span className="text-[#059669] dark:text-[#34d399] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Completed
                </span>
              ) : directMatch ? (
                <span className="text-[#5f79ff] dark:text-[#7b8eff] font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Scheduled ({directMatch.scheduledTime})
                </span>
              ) : (
                <span className="text-[#b45309] dark:text-[#fde68a] font-semibold">Not Scheduled</span>
              )}
            </div>

            {/* If unplayed, allow scheduling */}
            {!directMatch && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartGame}
                className="w-full py-2.5 px-4 bg-[#5f79ff] dark:bg-[#6378ff] hover:bg-[#4d69f0] dark:hover:bg-[#7b8eff] text-white font-medium rounded-full text-xs transition shadow-sm flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Start Game</span>
              </motion.button>
            )}

            {/* If scheduled, allow ending and recording score */}
            {directMatch && directMatch.status !== 'completed' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  triggerHaptic('success');
                  handleClose();
                  if (onSelectMatchForScore) {
                    onSelectMatchForScore(directMatch);
                  }
                }}
                className="w-full py-2.5 px-4 bg-[#5f79ff] dark:bg-[#6378ff] hover:bg-[#4d69f0] dark:hover:bg-[#7b8eff] text-white font-medium rounded-full text-xs transition shadow-sm flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                <span>Record Score</span>
              </motion.button>
            )}

            {/* Rematch Request Section if completed */}
            {directMatch?.status === 'completed' && (
              <div className="pt-2 border-t border-[#ebebeb] dark:border-[#263244] space-y-2">
                {isRematchApproved ? (
                  <div className="bg-[#eef2ff] dark:bg-[#312e81]/30 text-[#5f79ff] dark:text-[#7b8eff] p-2.5 rounded-xl border border-[#c7d2fe] dark:border-[#6366f1]/40 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#5f79ff] dark:text-[#7b8eff]" />
                    <span>Rematch approved! Check your Fixtures tab to play.</span>
                  </div>
                ) : isRematchPendingAdmin ? (
                  <div className="bg-[#fffbeb] dark:bg-[#78350f]/30 text-[#b45309] dark:text-[#fde68a] p-2.5 rounded-xl border border-[#fef3c7] dark:border-[#78350f] text-xs font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#b45309] dark:text-[#fde68a] animate-spin" />
                    <span>Both requested rematch! Awaiting Admin Approval.</span>
                  </div>
                ) : hasOpponentRequestedRematch && !hasCurrentUserRequestedRematch ? (
                  <div className="bg-[#eef2ff] dark:bg-[#312e81]/30 p-3 rounded-xl border border-[#c7d2fe] dark:border-[#6366f1]/40 space-y-2">
                    <p className="text-xs text-[#000000] dark:text-[#f8fafc] font-medium">
                      🎾 <strong>{player.name}</strong> requested a rematch with you!
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          triggerHaptic('success');
                          requestRematch(directMatch.id, currentPlayer.id);
                        }}
                        className="flex-1 py-1.5 bg-[#5f79ff] dark:bg-[#6378ff] hover:bg-[#4d69f0] dark:hover:bg-[#7b8eff] text-white text-xs font-medium rounded-full transition"
                      >
                        Accept Rematch
                      </button>
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          if (existingRematchReq) declineRematch(existingRematchReq.id);
                        }}
                        className="px-3 py-1.5 bg-[#f5f5f5] dark:bg-[#1e293b] hover:bg-[#ebebeb] dark:hover:bg-[#263244] text-[#4d4d4d] dark:text-[#cbd5e1] text-xs font-medium rounded-full transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ) : hasCurrentUserRequestedRematch ? (
                  <div className="bg-[#ffffff] dark:bg-[#141a24] p-2.5 rounded-xl border border-[#e5e5e5] dark:border-[#263244] text-xs text-[#707070] dark:text-[#94a3b8] flex items-center justify-between">
                    <span>Rematch request sent. Waiting for {player.name}...</span>
                    <RefreshCw className="w-3.5 h-3.5 text-[#5f79ff] dark:text-[#7b8eff] animate-spin" />
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      requestRematch(directMatch.id, currentPlayer.id);
                    }}
                    className="w-full py-2.5 px-4 bg-[#f5f5f5] dark:bg-[#1a2230] hover:bg-[#ebebeb] dark:hover:bg-[#1e293b] text-[#000000] dark:text-[#f8fafc] font-medium rounded-full text-xs transition border border-[#e5e5e5] dark:border-[#263244] flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Swords className="w-4 h-4 text-[#5f79ff] dark:text-[#7b8eff]" />
                    <span>Request Rematch</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* MATCHES SECTION (My Matches / Player Fixtures) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-[#707070] dark:text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-[#5f79ff] dark:text-[#7b8eff]" />
              <span>{isMe ? 'My Matches' : 'Matches'} ({playerMatches.length})</span>
            </h4>

            {/* Filter Tabs */}
            <div className="flex bg-[#f5f5f5] dark:bg-[#1a2230] p-0.5 rounded-full border border-[#e5e5e5] dark:border-[#263244] text-[11px]">
              {(['all', 'upcoming', 'completed'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    triggerHaptic('light');
                    setFilterTab(tab);
                  }}
                  className={`px-3 py-1 font-semibold capitalize rounded-full transition ${
                    filterTab === tab
                      ? 'bg-[#5f79ff] dark:bg-[#6378ff] text-white shadow-sm'
                      : 'text-[#707070] dark:text-[#94a3b8] hover:text-[#000000] dark:hover:text-[#f8fafc]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {filteredMatches.length === 0 ? (
            <div className="bg-[#fafafa] dark:bg-[#1a2230] p-6 rounded-xl border border-[#ebebeb] dark:border-[#263244] text-center text-[#707070] dark:text-[#94a3b8] text-xs">
              No matches found in this category.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
              {filteredMatches.map(m => {
                const opponentId = m.player1Id === player.id ? m.player2Id : m.player1Id;
                const opponent = getPlayer(opponentId);
                const isWinner = m.winnerId === player.id;
                const isCompleted = m.status === 'completed';
                const oppTheme = getCompanyTheme(opponent?.company);

                const formattedScores = m.scores
                  .map(s => {
                    const player1IsMe = m.player1Id === player.id;
                    const myGames = player1IsMe ? s.player1 : s.player2;
                    const oppGames = player1IsMe ? s.player2 : s.player1;
                    return `${myGames}–${oppGames}`;
                  })
                  .join(' · ');

                return (
                  <div
                    key={m.id}
                    className="bg-[#fafafa] dark:bg-[#1a2230] hover:bg-[#f5f5f5] dark:hover:bg-[#1e293b] p-3 rounded-xl border border-[#ebebeb] dark:border-[#263244] flex items-center justify-between gap-3 text-xs transition"
                  >
                    {/* W/L Badge */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {isCompleted ? (
                        <div
                          className={`w-7 h-7 rounded-full font-bold font-mono text-xs flex items-center justify-center flex-shrink-0 ${
                            isWinner
                              ? 'bg-[#e6fcf3] dark:bg-[#064e3b]/40 text-[#059669] dark:text-[#34d399] border border-[#a7f3d0] dark:border-[#059669]/40'
                              : 'bg-[#ffe4e6] dark:bg-[#e11d48]/20 text-[#e11d48] dark:text-[#fb7185] border border-[#fecdd3] dark:border-[#e11d48]/30'
                          }`}
                        >
                          {isWinner ? 'W' : 'L'}
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#eef2ff] dark:bg-[#312e81]/40 text-[#5f79ff] dark:text-[#7b8eff] border border-[#c7d2fe] dark:border-[#6366f1]/40 flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
                          SCH
                        </div>
                      )}

                      {/* Opponent & Match Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[#707070] dark:text-[#94a3b8] text-[11px]">vs</span>
                          <span className="font-semibold text-[#000000] dark:text-[#f8fafc] truncate">
                            {opponent?.name || 'Opponent'}
                          </span>
                          {oppTheme && (
                            <span
                              className={`text-[8px] px-1.5 py-0.2 rounded-full font-semibold ${oppTheme.badgeBg} ${oppTheme.badgeText}`}
                            >
                              {oppTheme.shortName}
                            </span>
                          )}
                        </div>

                        {/* Scores or stage */}
                        <div className="text-[11px] font-mono text-[#5f79ff] dark:text-[#7b8eff] font-semibold mt-0.5">
                          {isCompleted ? formattedScores : `${m.stage} • ${m.scheduledTime}`}
                        </div>
                      </div>
                    </div>

                    {/* Right action or status */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isCompleted && (isMe || currentPlayer?.id === opponentId) ? (
                        <button
                          onClick={() => {
                            triggerHaptic('success');
                            handleClose();
                            if (onSelectMatchForScore) {
                              onSelectMatchForScore(m);
                            }
                          }}
                          className="px-3 py-1.5 bg-[#5f79ff] dark:bg-[#6378ff] hover:bg-[#4d69f0] dark:hover:bg-[#7b8eff] text-white rounded-full font-medium text-[11px] shadow-sm transition active:scale-95 flex items-center gap-1"
                        >
                          <Trophy className="w-3 h-3 text-white" />
                          <span>Record Score</span>
                        </button>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                            isCompleted
                              ? isWinner
                                ? 'bg-[#e6fcf3] dark:bg-[#064e3b]/40 text-[#059669] dark:text-[#34d399] border border-[#a7f3d0] dark:border-[#059669]/40'
                                : 'bg-[#ffe4e6] dark:bg-[#e11d48]/20 text-[#e11d48] dark:text-[#fb7185] border border-[#fecdd3] dark:border-[#e11d48]/30'
                              : 'bg-[#f5f5f5] dark:bg-[#1e293b] text-[#707070] dark:text-[#94a3b8]'
                          }`}
                        >
                          {isCompleted ? (isWinner ? 'Victory' : 'Defeat') : m.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tournament Rules & FAQ Accordion */}
        <RulesFaqCard defaultExpanded={false} />
      </div>

      {/* Matchup Clash Animation */}
      {showProfileClash && currentPlayer && player && (
        <MatchupClashModal
          isOpen={showProfileClash}
          player1={currentPlayer}
          player2={player}
          courtName="Court 1"
          onAnimationComplete={handleProfileClashComplete}
        />
      )}
    </div>
  );
};
