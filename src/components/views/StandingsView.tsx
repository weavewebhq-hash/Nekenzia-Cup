import React, { useState, useMemo } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Match } from '../../types';
import {
  Trophy,
  Search,
  Crosshair
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TournamentProgressCard } from '../TournamentProgressCard';
import { getCompanyTheme } from '../../utils/companyStyles';

interface StandingsViewProps {
  onSelectMatchForScore?: (match: Match) => void;
}

export const StandingsView: React.FC<StandingsViewProps> = () => {
  const {
    players,
    currentPlayer,
    setSelectedPlayerForProfile,
    triggerHaptic
  } = useTournament();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<'ALL' | 'Nexia Mongolia' | 'McKenzie'>('ALL');

  // Overall sorted players according to Nekenzie Cup 2026 rules:
  // 1. Points / Wins (1 pt per win, 0 for loss)
  // 2. Point Differential (+/- = Points Scored - Points Conceded)
  // 3. Points Scored (PF)
  // 4. Fewest Losses
  const overallSortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      // 1. Points (Wins = 1 pt each)
      if (b.stats.points !== a.stats.points) {
        return b.stats.points - a.stats.points;
      }
      // 2. Point Differential (+/-)
      const aDiff = a.stats.pointDiff ?? (a.stats.pointsScored - a.stats.pointsConceded) ?? (a.stats.gamesWon - a.stats.gamesLost);
      const bDiff = b.stats.pointDiff ?? (b.stats.pointsScored - b.stats.pointsConceded) ?? (b.stats.gamesWon - b.stats.gamesLost);
      if (bDiff !== aDiff) {
        return bDiff - aDiff;
      }
      // 3. Total Points Scored (PF)
      const aScored = a.stats.pointsScored ?? a.stats.gamesWon;
      const bScored = b.stats.pointsScored ?? b.stats.gamesWon;
      if (bScored !== aScored) {
        return bScored - aScored;
      }
      // 4. Matches Won
      if (b.stats.won !== a.stats.won) {
        return b.stats.won - a.stats.won;
      }
      // 5. Fewest Losses
      return a.stats.lost - b.stats.lost;
    });
  }, [players]);

  // Find the current "Point Hunter" (#1 in + / - Point Differential)
  const pointHunter = useMemo(() => {
    if (players.length === 0) return null;
    return [...players].sort((a, b) => {
      const aDiff = a.stats.pointDiff ?? (a.stats.pointsScored - a.stats.pointsConceded) ?? (a.stats.gamesWon - a.stats.gamesLost);
      const bDiff = b.stats.pointDiff ?? (b.stats.pointsScored - b.stats.pointsConceded) ?? (b.stats.gamesWon - b.stats.gamesLost);
      if (bDiff !== aDiff) return bDiff - aDiff;
      return (b.stats.pointsScored ?? b.stats.gamesWon) - (a.stats.pointsScored ?? a.stats.gamesWon);
    })[0];
  }, [players]);

  // Filtered players list
  const filteredPlayers = useMemo(() => {
    return overallSortedPlayers.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCompany =
        selectedCompanyFilter === 'ALL' || p.company === selectedCompanyFilter;
      return matchesSearch && matchesCompany;
    });
  }, [overallSortedPlayers, searchQuery, selectedCompanyFilter]);

  return (
    <div className="space-y-4 pb-24 max-w-lg mx-auto px-4 pt-4 transition-colors duration-200">
      {/* 1. Tournament Progress Card */}
      <TournamentProgressCard compact={true} />

      {/* 2. Point Hunter Celebration Spotlight */}
      {pointHunter && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          onClick={() => {
            triggerHaptic('medium');
            setSelectedPlayerForProfile(pointHunter);
          }}
          className="bg-[#ffffff] dark:bg-[#141a24] border border-[#e5e5e5] dark:border-[#263244] hover:border-[#5f79ff] dark:hover:border-[#7b8eff] rounded-2xl p-4 sm:p-5 cursor-pointer active:scale-[0.99] transition space-y-3 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#e6fcf3] dark:bg-[#064e3b]/30 border border-[#a7f3d0] dark:border-[#059669]/40 text-[10px] font-semibold text-[#059669] dark:text-[#34d399] uppercase">
                <Crosshair className="w-3 h-3 text-[#059669] dark:text-[#34d399]" />
                Point Hunter Award Leader
              </span>
            </div>
            <span className="text-[10px] text-[#707070] dark:text-[#94a3b8] font-medium">
              Highest +/- Diff
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Player Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div
                  className="w-11 h-11 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] border border-[#e5e5e5] dark:border-[#263244] text-[#000000] dark:text-[#f8fafc] font-bold flex items-center justify-center text-sm shadow-sm"
                >
                  {pointHunter.avatar}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#01fe93] text-black flex items-center justify-center text-[10px] font-bold border border-white dark:border-[#141a24]">
                  🎯
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-semibold text-[#000000] dark:text-[#f8fafc] truncate">
                    {pointHunter.name}
                  </h4>
                  {currentPlayer?.id === pointHunter.id && (
                    <span className="px-1.5 py-0.2 rounded-full text-[8px] font-semibold bg-[#5f79ff] text-white">
                      YOU
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#707070] dark:text-[#94a3b8] truncate">
                  {pointHunter.company}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-[#707070] dark:text-[#94a3b8]">
                  <span>PF: <strong className="text-[#000000] dark:text-[#f8fafc]">{pointHunter.stats.pointsScored ?? pointHunter.stats.gamesWon}</strong></span>
                  <span>•</span>
                  <span>PA: <strong className="text-[#000000] dark:text-[#f8fafc]">{pointHunter.stats.pointsConceded ?? pointHunter.stats.gamesLost}</strong></span>
                </div>
              </div>
            </div>

            {/* Differential Pill */}
            <div className="text-right flex-shrink-0">
              <div className="px-3.5 py-1.5 rounded-2xl bg-[#e6fcf3] dark:bg-[#064e3b]/30 border border-[#a7f3d0] dark:border-[#059669]/40">
                <span className="block text-[9px] font-semibold uppercase tracking-wider text-[#059669] dark:text-[#34d399]">
                  Differential
                </span>
                <span className="text-base font-bold font-mono text-[#059669] dark:text-[#34d399]">
                  +{(pointHunter.stats.pointDiff ?? (pointHunter.stats.pointsScored - pointHunter.stats.pointsConceded) ?? (pointHunter.stats.gamesWon - pointHunter.stats.gamesLost))}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. Unified Leaderboard Container (Filters + Toggle + Table in ONE box) */}
      <div className="bg-[#ffffff] dark:bg-[#141a24] rounded-2xl p-4 sm:p-5 border border-[#e5e5e5] dark:border-[#263244] space-y-4 shadow-sm transition-colors duration-200">
        {/* Header with Title and Player Count */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] flex items-center justify-center flex-shrink-0">
              <Trophy className="w-4 h-4 text-[#5f79ff] dark:text-[#7b8eff]" />
            </div>
            <div>
              <h2 className="text-base font-light font-display-serif text-[#000000] dark:text-[#f8fafc] leading-tight">
                Leaderboard
              </h2>
              <p className="text-[11px] text-[#707070] dark:text-[#94a3b8]">
                1 Pt/Win • First to 12 • +/- Point Hunter
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono text-[#5f79ff] dark:text-[#7b8eff] font-semibold bg-[#eef2ff] dark:bg-[#312e81]/40 border border-[#d9defc] dark:border-[#6366f1]/40 px-2.5 py-0.5 rounded-full flex-shrink-0">
            {filteredPlayers.length} Players
          </span>
        </div>

        {/* Company Quick Filter Tabs & Search Bar */}
        <div className="space-y-2">
          {/* Company Toggle Switch */}
          <div className="flex items-center gap-1 p-1 bg-[#f5f5f5] dark:bg-[#1a2230] rounded-full border border-[#e5e5e5] dark:border-[#263244]">
            {(['ALL', 'Nexia Mongolia', 'McKenzie'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedCompanyFilter(tab);
                }}
                className={`flex-1 py-1 rounded-full text-xs font-semibold transition ${
                  selectedCompanyFilter === tab
                    ? 'bg-[#5f79ff] dark:bg-[#6378ff] text-white shadow-sm'
                    : 'text-[#707070] dark:text-[#94a3b8] hover:text-[#000000] dark:hover:text-[#f8fafc]'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab === 'Nexia Mongolia' ? 'Nexia' : 'McKenzie'}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a6a6a6] dark:text-[#64748b]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search player name..."
              className="w-full bg-[#ffffff] dark:bg-[#1a2230] border border-[#e5e5e5] dark:border-[#263244] rounded-xl py-2 pl-9 pr-14 text-xs text-[#000000] dark:text-[#f8fafc] placeholder-[#a6a6a6] dark:placeholder-[#64748b] focus:outline-none focus:border-[#5f79ff] dark:focus:border-[#7b8eff] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a6a6a6] dark:text-[#64748b] hover:text-[#000000] dark:hover:text-[#f8fafc] text-xs font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table Column Headers */}
        <div className="pt-1">
          <div className="grid grid-cols-12 text-[10px] sm:text-[11px] text-[#707070] dark:text-[#94a3b8] font-semibold px-2 uppercase tracking-wider pb-2 border-b border-[#ebebeb] dark:border-[#263244]">
            <span className="col-span-5">Rank • Player</span>
            <span className="col-span-2 text-center">W - L</span>
            <span className="col-span-2 text-center">PF - PA</span>
            <span className="col-span-2 text-center">+/-</span>
            <span className="col-span-1 text-right">Pts</span>
          </div>

          {/* Rows */}
          <div className="space-y-1.5 mt-2">
            <AnimatePresence>
              {filteredPlayers.map((player, index) => {
                const rank = overallSortedPlayers.findIndex(p => p.id === player.id) + 1;
                const isMe = currentPlayer?.id === player.id;
                const isPointHunter = pointHunter?.id === player.id;
                const diff = player.stats.pointDiff ?? (player.stats.pointsScored - player.stats.pointsConceded) ?? (player.stats.gamesWon - player.stats.gamesLost);
                const scored = player.stats.pointsScored ?? player.stats.gamesWon;
                const conceded = player.stats.pointsConceded ?? player.stats.gamesLost;

                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.25) }}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedPlayerForProfile(player);
                    }}
                    className={`p-2.5 rounded-xl border transition grid grid-cols-12 items-center gap-1 cursor-pointer active:scale-[0.99] ${
                      isMe
                        ? 'bg-[#eef2ff] dark:bg-[#312e81]/30 border-[#c7d2fe] dark:border-[#6366f1]/40'
                        : isPointHunter
                        ? 'bg-[#f0fdf4] dark:bg-[#064e3b]/30 border-[#bbf7d0] dark:border-[#059669]/40'
                        : 'bg-[#fafafa] dark:bg-[#1a2230] border-[#ebebeb] dark:border-[#263244] hover:border-[#d4d4d4] dark:hover:border-[#3b4d66]'
                    }`}
                  >
                    {/* Left: Ranking number + Player Info (5 cols) */}
                    <div className="col-span-5 flex items-center gap-2 min-w-0">
                      <div className="flex flex-col items-center justify-center w-5 flex-shrink-0">
                        <span
                          className={`text-xs font-bold font-mono ${
                            rank === 1
                              ? 'text-[#5f79ff] dark:text-[#7b8eff]'
                              : rank === 2
                              ? 'text-[#059669] dark:text-[#34d399]'
                              : rank === 3
                              ? 'text-[#4d4d4d] dark:text-[#cbd5e1]'
                              : 'text-[#707070] dark:text-[#94a3b8]'
                          }`}
                        >
                          #{rank}
                        </span>
                      </div>

                      {/* Avatar */}
                      <div
                        className="w-7 h-7 rounded-full bg-white dark:bg-[#141a24] border border-[#e5e5e5] dark:border-[#263244] text-[#000000] dark:text-[#f8fafc] font-bold flex items-center justify-center text-[10px] shadow-sm flex-shrink-0"
                      >
                        {player.avatar}
                      </div>

                      {/* Name & Badge */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-xs font-semibold text-[#000000] dark:text-[#f8fafc] truncate">
                            {player.name}
                          </span>
                          {isPointHunter && (
                            <span className="px-1.5 py-0.2 rounded-full text-[8px] font-semibold bg-[#01fe93] text-black">
                              Hunter
                            </span>
                          )}
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded-full text-[8px] font-semibold bg-[#5f79ff] text-white">
                              YOU
                            </span>
                          )}
                        </div>

                        <p className="text-[9px] text-[#707070] dark:text-[#94a3b8] truncate">
                          {player.company}
                        </p>
                      </div>
                    </div>

                    {/* W - L (2 cols) */}
                    <div className="col-span-2 text-center font-mono text-xs font-semibold text-[#000000] dark:text-[#f8fafc]">
                      {player.stats.won}-{player.stats.lost}
                    </div>

                    {/* PF - PA (2 cols) */}
                    <div className="col-span-2 text-center font-mono text-[11px] text-[#707070] dark:text-[#94a3b8] truncate">
                      {scored}-{conceded}
                    </div>

                    {/* +/- Point Differential (2 cols) */}
                    <div className="col-span-2 text-center font-mono text-xs">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-md font-semibold text-[11px] ${
                          diff > 0
                            ? 'bg-[#e6fcf3] dark:bg-[#064e3b]/30 text-[#059669] dark:text-[#34d399] border border-[#a7f3d0] dark:border-[#059669]/40'
                            : diff < 0
                            ? 'bg-[#ffe4e6] dark:bg-[#e11d48]/20 text-[#e11d48] dark:text-[#fb7185] border border-[#fecdd3] dark:border-[#e11d48]/30'
                            : 'bg-[#f5f5f5] dark:bg-[#1e293b] text-[#707070] dark:text-[#94a3b8]'
                        }`}
                      >
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    </div>

                    {/* Points (1 col) */}
                    <div className="col-span-1 text-right font-mono">
                      <span className="font-bold text-sm text-[#5f79ff] dark:text-[#7b8eff] block leading-tight">
                        {player.stats.points}
                      </span>
                      <span className="text-[8px] text-[#707070] dark:text-[#94a3b8] block leading-none">pts</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
