import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTournament } from '../context/TournamentContext';
import { Player, Match } from '../types';
import {
  X,
  Search,
  Swords,
  Sparkles,
  Zap,
  QrCode
} from 'lucide-react';
import { getCompanyTheme } from '../utils/companyStyles';
import { MatchupClashModal } from './MatchupClashModal';
import { MatchQRModal } from './MatchQRModal';

interface FindOpponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMatchForScore?: (match: Match) => void;
}

export const FindOpponentModal: React.FC<FindOpponentModalProps> = ({
  isOpen,
  onClose,
  onSelectMatchForScore
}) => {
  const {
    currentPlayer,
    getUnplayedOpponentsForPlayer,
    scheduleMatchWithOpponent,
    setSelectedPlayerForProfile,
    triggerHaptic,
    triggerCelebration
  } = useTournament();

  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState<'ALL' | 'Nexia Mongolia' | 'McKenzie'>('ALL');
  const [selectedOpponent, setSelectedOpponent] = useState<Player | null>(null);
  const [pendingMatch, setPendingMatch] = useState<Match | null>(null);
  const [showClashAnimation, setShowClashAnimation] = useState(false);
  const [qrOpponent, setQrOpponent] = useState<Player | null>(null);

  if (!isOpen || !currentPlayer) return null;

  const unplayedOpponents = getUnplayedOpponentsForPlayer(currentPlayer.id);

  const filteredOpponents = unplayedOpponents.filter(item => {
    const matchesSearch = item.player.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany =
      companyFilter === 'ALL' ? true : item.player.company === companyFilter;
    return matchesSearch && matchesCompany;
  });

  const handlePlayAndScore = (opponentPlayer: Player) => {
    triggerHaptic('success');
    triggerCelebration();
    const createdMatch = scheduleMatchWithOpponent(opponentPlayer.id);
    setSelectedOpponent(opponentPlayer);
    setPendingMatch(createdMatch);
    setShowClashAnimation(true);
  };

  const handleClashComplete = () => {
    setShowClashAnimation(false);
    onClose();
    if (onSelectMatchForScore && pendingMatch) {
      setTimeout(() => {
        onSelectMatchForScore(pendingMatch);
        setSelectedOpponent(null);
        setPendingMatch(null);
      }, 50);
    }
  };

  return (
    <>
      {/* 1. MATCHUP CLASH CINEMATIC ANIMATION */}
      {showClashAnimation && selectedOpponent && (
        <MatchupClashModal
          isOpen={showClashAnimation}
          player1={currentPlayer}
          player2={selectedOpponent}
          courtName="Court 1"
          onAnimationComplete={handleClashComplete}
        />
      )}

      {/* 2. OPPONENT SELECTOR MODAL SHEET */}
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop with fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#000000]/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Sheet with Spring Physics */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-lg bg-[#ffffff] dark:bg-[#141a24] rounded-t-2xl sm:rounded-2xl border border-[#e5e5e5] dark:border-[#263244] shadow-2xl p-5 sm:p-6 text-[#000000] dark:text-[#f8fafc] max-h-[88vh] flex flex-col z-10 pb-safe transition-colors duration-200"
          >
            {/* Mobile handle */}
            <div className="w-10 h-1 bg-[#e5e5e5] dark:bg-[#263244] rounded-full mx-auto mb-3 sm:hidden" />

            {/* Modal Header with Animated Icon */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <motion.div
                  initial={{ rotate: -45, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                  className="w-10 h-10 rounded-full bg-[#f0f4ff] dark:bg-[#1a2230] border border-[#d9defc] dark:border-[#263244] flex items-center justify-center shadow-sm"
                >
                  <Swords className="w-5 h-5 text-[#5f79ff] dark:text-[#7b8eff]" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-light font-display-serif text-[#000000] dark:text-[#f8fafc]">
                      Select Opponent to Play
                    </h3>
                    <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-[#01fe93]/20 text-[#059669] dark:text-[#34d399] border border-[#01fe93]/30">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-[#5f79ff] dark:text-[#7b8eff] flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-current" />
                    <span>{unplayedOpponents.length} unplayed opponents ready</span>
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="w-7 h-7 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] text-[#707070] dark:text-[#94a3b8] hover:text-[#000000] dark:hover:text-[#f8fafc] flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a6a6a6] dark:text-[#64748b]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search opponent name..."
                className="w-full bg-[#ffffff] dark:bg-[#1a2230] border border-[#e5e5e5] dark:border-[#263244] rounded-xl py-2 pl-10 pr-4 text-xs text-[#000000] dark:text-[#f8fafc] placeholder-[#a6a6a6] dark:placeholder-[#64748b] focus:outline-none focus:border-[#5f79ff] dark:focus:border-[#7b8eff] transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a6a6a6] dark:text-[#64748b] hover:text-[#000000] dark:hover:text-[#f8fafc] text-xs font-medium"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Company Quick Filter Pills */}
            <div className="flex bg-[#f5f5f5] dark:bg-[#1a2230] p-1 rounded-full border border-[#e5e5e5] dark:border-[#263244] gap-1 mb-3">
              {(['ALL', 'Nexia Mongolia', 'McKenzie'] as const).map(filter => (
                <motion.button
                  key={filter}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    triggerHaptic('light');
                    setCompanyFilter(filter);
                  }}
                  className={`flex-1 py-1 text-xs font-semibold rounded-full transition ${
                    companyFilter === filter
                      ? 'bg-[#5f79ff] dark:bg-[#6378ff] text-white shadow-sm'
                      : 'text-[#707070] dark:text-[#94a3b8] hover:text-[#000000] dark:hover:text-[#f8fafc]'
                  }`}
                >
                  {filter === 'ALL' ? 'All' : filter === 'Nexia Mongolia' ? 'Nexia' : 'McKenzie'}
                </motion.button>
              ))}
            </div>

            {/* Staggered Opponents List */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.04
                  }
                }
              }}
              className="flex-1 overflow-y-auto space-y-2 pr-0.5"
            >
              {filteredOpponents.length === 0 ? (
                <div className="text-center py-8 text-[#707070] dark:text-[#94a3b8] text-xs">
                  <p>No available opponents matching your filter.</p>
                </div>
              ) : (
                filteredOpponents.map(({ player }, index) => {
                  const companyTheme = getCompanyTheme(player.company);
                  return (
                    <motion.div
                      key={player.id}
                      variants={{
                        hidden: { opacity: 0, y: 15, scale: 0.98 },
                        visible: { opacity: 1, y: 0, scale: 1 }
                      }}
                      transition={{ duration: 0.25, delay: index * 0.02 }}
                      whileHover={{ scale: 1.012, x: 2 }}
                      className="bg-[#fafafa] dark:bg-[#1a2230] hover:bg-[#f5f5f5] dark:hover:bg-[#1e293b] p-3 rounded-xl border border-[#ebebeb] dark:border-[#263244] flex items-center justify-between gap-3 transition shadow-sm group"
                    >
                      {/* Player info */}
                      <div
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                        onClick={() => {
                          triggerHaptic('light');
                          setSelectedPlayerForProfile(player);
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-full bg-white dark:bg-[#141a24] border border-[#e5e5e5] dark:border-[#263244] text-[#000000] dark:text-[#f8fafc] font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0 group-hover:border-[#5f79ff] dark:group-hover:border-[#7b8eff] transition"
                        >
                          {player.avatar}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-xs text-[#000000] dark:text-[#f8fafc] truncate">
                              {player.name}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[8px] font-semibold ${companyTheme.badgeBg} ${companyTheme.badgeText}`}
                            >
                              {companyTheme.shortName}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#707070] dark:text-[#94a3b8] truncate font-mono">
                            {player.company} • {player.stats.won}W-{player.stats.lost}L ({player.stats.points} pts)
                          </p>
                        </div>
                      </div>

                      {/* Opponent Action Buttons: QR sync & Play */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={e => {
                            e.stopPropagation();
                            triggerHaptic('light');
                            setQrOpponent(player);
                          }}
                          className="p-2 rounded-full bg-[#f0f4ff] dark:bg-[#1a2230] text-[#5f79ff] dark:text-[#7b8eff] border border-[#d9defc] dark:border-[#263244] hover:bg-[#e0e7ff] transition"
                          title="Instant QR sync"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </motion.button>

                        {/* Direct 1-Tap Animated Play & Score Button */}
                        <motion.button
                          whileHover={{ scale: 1.06, boxShadow: '0 4px 14px rgba(95, 121, 255, 0.35)' }}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => handlePlayAndScore(player)}
                          className="px-3.5 py-1.5 bg-[#5f79ff] dark:bg-[#6378ff] hover:bg-[#4d69f0] dark:hover:bg-[#7b8eff] text-white font-medium rounded-full text-xs shadow-sm transition flex items-center gap-1.5"
                        >
                          <Swords className="w-3 h-3 text-white animate-pulse" />
                          <span>Play</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Match QR Modal for selected opponent */}
      <MatchQRModal
        isOpen={Boolean(qrOpponent)}
        opponent={qrOpponent}
        onClose={() => setQrOpponent(null)}
        onOpenScoreForMatch={m => {
          setQrOpponent(null);
          onClose();
          if (onSelectMatchForScore) {
            onSelectMatchForScore(m);
          }
        }}
      />
    </>
  );
};
