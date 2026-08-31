import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player } from '../types';
import { Swords, Flame, Sparkles } from 'lucide-react';
import { getCompanyTheme } from '../utils/companyStyles';

interface MatchupClashModalProps {
  isOpen: boolean;
  player1: Player | null;
  player2: Player | null;
  courtName?: string;
  onAnimationComplete: () => void;
}

export const MatchupClashModal: React.FC<MatchupClashModalProps> = ({
  isOpen,
  player1,
  player2,
  courtName = 'Court 1',
  onAnimationComplete
}) => {
  useEffect(() => {
    if (isOpen && player1 && player2) {
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, 950);
      return () => clearTimeout(timer);
    }
  }, [isOpen, player1, player2, onAnimationComplete]);

  if (!isOpen || !player1 || !player2) return null;

  const p1Theme = getCompanyTheme(player1.company);
  const p2Theme = getCompanyTheme(player2.company);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Darkened backdrop with radial illumination */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#0a0d14]/85 backdrop-blur-md"
          onClick={onAnimationComplete}
        />

        {/* Dynamic Matchup Arena Card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 350 }}
          className="relative w-full max-w-md bg-gradient-to-b from-[#141a24] to-[#0d111a] border border-[#3b4d66] rounded-3xl p-6 shadow-2xl overflow-hidden text-center z-10 text-[#f8fafc]"
        >
          {/* Animated Background Aura */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [1, 1.3, 1.1], opacity: [0.3, 0.6, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse' }}
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#5f79ff]/25 rounded-full blur-3xl pointer-events-none"
          />

          {/* Top Stage Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-1.5 mb-5"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#5f79ff]/20 text-[#7b8eff] border border-[#5f79ff]/30 shadow-sm">
              <Flame className="w-3 h-3 text-[#ff5722] animate-bounce" />
              <span>Matchup Initiated • {courtName}</span>
            </span>
          </motion.div>

          {/* VS Head-to-Head Section */}
          <div className="grid grid-cols-7 items-center gap-2 py-3">
            {/* Player 1 (Left Side) */}
            <motion.div
              initial={{ x: -60, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
              className="col-span-3 flex flex-col items-center text-center space-y-2"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, -3, 3, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-[#5f79ff] to-[#3b82f6] text-white font-bold text-lg sm:text-xl flex items-center justify-center shadow-lg shadow-[#5f79ff]/40 border-2 border-white/30"
                >
                  {player1.avatar}
                </motion.div>
                <div className="absolute -bottom-1 -right-1 bg-[#01fe93] text-[#000000] text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-black/40">
                  {player1.stats.won}W
                </div>
              </div>

              <div className="w-full">
                <h4 className="text-sm sm:text-base font-bold text-white truncate max-w-[120px] mx-auto">
                  {player1.name}
                </h4>
                <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-semibold mt-0.5 ${p1Theme.badgeBg} ${p1Theme.badgeText}`}>
                  {p1Theme.shortName}
                </span>
                <p className="text-[10px] text-[#94a3b8] font-mono mt-0.5">
                  {player1.stats.points} pts
                </p>
              </div>
            </motion.div>

            {/* VS Shockwave Center */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 400, delay: 0.15 }}
                className="relative"
              >
                <div className="w-10 h-10 rounded-full bg-[#1a2230] border border-[#5f79ff]/60 flex items-center justify-center shadow-md">
                  <Swords className="w-5 h-5 text-[#7b8eff] animate-pulse" />
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.8, 1.6, 2] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border border-[#5f79ff]/80 pointer-events-none"
                />
              </motion.div>
              <span className="text-[11px] font-black tracking-widest text-[#7b8eff] mt-1">
                VS
              </span>
            </div>

            {/* Player 2 (Right Side) */}
            <motion.div
              initial={{ x: 60, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
              className="col-span-3 flex flex-col items-center text-center space-y-2"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, 3, -3, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-[#ec4899] to-[#8b5cf6] text-white font-bold text-lg sm:text-xl flex items-center justify-center shadow-lg shadow-[#ec4899]/30 border-2 border-white/30"
                >
                  {player2.avatar}
                </motion.div>
                <div className="absolute -bottom-1 -right-1 bg-[#01fe93] text-[#000000] text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-black/40">
                  {player2.stats.won}W
                </div>
              </div>

              <div className="w-full">
                <h4 className="text-sm sm:text-base font-bold text-white truncate max-w-[120px] mx-auto">
                  {player2.name}
                </h4>
                <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-semibold mt-0.5 ${p2Theme.badgeBg} ${p2Theme.badgeText}`}>
                  {p2Theme.shortName}
                </span>
                <p className="text-[10px] text-[#94a3b8] font-mono mt-0.5">
                  {player2.stats.points} pts
                </p>
              </div>
            </motion.div>
          </div>

          {/* Bottom Callout */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-5 pt-3 border-t border-[#263244] flex items-center justify-between text-xs text-[#94a3b8]"
          >
            <div className="flex items-center gap-1.5 text-xs text-[#01fe93]">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Target: First to 12 Points</span>
            </div>
            <button
              onClick={onAnimationComplete}
              className="text-[11px] text-[#7b8eff] hover:underline font-medium"
            >
              Skip →
            </button>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
