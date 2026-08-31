import React, { useEffect, useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Trophy, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface TournamentProgressCardProps {
  compact?: boolean;
}

export const TournamentProgressCard: React.FC<TournamentProgressCardProps> = ({ compact = false }) => {
  const { completedTournamentMatches, totalTournamentMatches, tournamentProgressPercentage } = useTournament();
  const [animatedPercent, setAnimatedPercent] = useState(0);

  // Smooth counter tick-up animation on component mount
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1000;
    const target = tournamentProgressPercentage;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedPercent(Math.round(easeOut * target));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [tournamentProgressPercentage]);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#ffffff] dark:bg-[#141a24] rounded-2xl p-3.5 border border-[#e5e5e5] dark:border-[#263244] transition-colors duration-200"
      >
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#5f79ff] dark:text-[#7b8eff]" />
            <span className="font-semibold text-[#000000] dark:text-[#f8fafc]">Tournament Progress</span>
          </div>
          <span className="font-mono font-bold text-[#5f79ff] dark:text-[#7b8eff]">
            {completedTournamentMatches} / {totalTournamentMatches}
          </span>
        </div>
        <div className="w-full bg-[#f5f5f5] dark:bg-[#1a2230] rounded-full h-2 overflow-hidden border border-[#e5e5e5] dark:border-[#263244]">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${Math.max(4, tournamentProgressPercentage)}%` }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gradient-to-r from-[#5f79ff] to-[#01fe93] dark:from-[#7b8eff] dark:to-[#01fe93] h-full rounded-full"
          />
        </div>
        <div className="flex justify-between items-center mt-1.5 text-[10px] text-[#707070] dark:text-[#94a3b8]">
          <span>Official Round-Robin Matches</span>
          <span className="font-semibold text-[#000000] dark:text-[#f8fafc] font-mono">{animatedPercent}% completed</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="pingpong-table-card pingpong-table-lines p-4 sm:p-5 relative overflow-hidden transition-colors duration-200"
    >
      {/* Subtle Ping Pong Table Watermark */}
      <div className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none opacity-25 dark:opacity-15">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect x="10" y="15" width="80" height="70" fill="none" stroke="currentColor" strokeWidth="1" className="text-[#5f79ff]" />
          <line x1="50" y1="15" x2="50" y2="85" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" className="text-[#d90429]" />
          <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="1" className="text-[#01fe93]" />
        </svg>
      </div>

      <div className="flex items-start justify-between gap-2 mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] border border-[#e5e5e5] dark:border-[#263244] flex items-center justify-center flex-shrink-0 shadow-sm">
            <Trophy className="w-4 h-4 text-[#5f79ff] dark:text-[#7b8eff]" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-[#5f79ff] dark:text-[#7b8eff] uppercase tracking-wider block leading-none">
              Nekenzie Cup 2026
            </span>
            <h4 className="text-sm font-light font-display-serif text-[#000000] dark:text-[#f8fafc] mt-0.5">
              Tournament Progress
            </h4>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xl font-bold text-[#5f79ff] dark:text-[#7b8eff] font-mono block">
            {animatedPercent}%
          </span>
        </div>
      </div>

      {/* Progress Bar Container with Motion */}
      <div className="space-y-1.5">
        <div className="w-full bg-[#f5f5f5] dark:bg-[#1a2230] rounded-full h-2.5 p-0.5 border border-[#e5e5e5] dark:border-[#263244] overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${Math.max(3, tournamentProgressPercentage)}%` }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="bg-gradient-to-r from-[#5f79ff] to-[#01fe93] dark:from-[#7b8eff] dark:to-[#01fe93] h-full rounded-full shadow-sm"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-[#707070] dark:text-[#94a3b8] pt-0.5">
          <span className="flex items-center gap-1 font-mono text-[#4d4d4d] dark:text-[#cbd5e1] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] dark:text-[#34d399]" />
            <strong className="text-[#000000] dark:text-[#f8fafc]">{completedTournamentMatches}</strong> / {totalTournamentMatches} matches completed
          </span>
          <span className="text-[11px] text-[#5f79ff] dark:text-[#7b8eff] font-semibold font-mono">
            {totalTournamentMatches - completedTournamentMatches} remaining
          </span>
        </div>
      </div>
    </motion.div>
  );
};
