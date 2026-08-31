import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useTournament } from '../../context/TournamentContext';
import { Match, Player } from '../../types';
import {
  Trophy,
  Calendar,
  Swords,
  Sparkles,
  QrCode
} from 'lucide-react';
import { NavTab } from '../BottomNav';
import { TournamentProgressCard } from '../TournamentProgressCard';
import { RecentResultsFeed } from '../RecentResultsFeed';
import { RulesFaqCard } from '../RulesFaqCard';
import { FindOpponentModal } from '../FindOpponentModal';
import { MatchupClashModal } from '../MatchupClashModal';
import { MatchQRModal } from '../MatchQRModal';
import { getCompanyTheme } from '../../utils/companyStyles';

interface HomeViewProps {
  onSelectMatchForScore: (match: Match) => void;
  onNavigateTab: (tab: NavTab) => void;
  onOpenPlayerModal?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectMatchForScore,
  onNavigateTab
}) => {
  const {
    matches,
    players,
    currentPlayer,
    getUnplayedOpponentsForPlayer,
    scheduleMatchWithOpponent,
    triggerHaptic,
    triggerCelebration
  } = useTournament();

  const [isFindOpponentOpen, setIsFindOpponentOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedOpponentForQR, setSelectedOpponentForQR] = useState<Player | null>(null);

  // Quick select matchup clash animation state
  const [quickSelectedOpponent, setQuickSelectedOpponent] = useState<Player | null>(null);
  const [quickPendingMatch, setQuickPendingMatch] = useState<Match | null>(null);
  const [showQuickClash, setShowQuickClash] = useState(false);

  // Find active or upcoming match for current player
  const myUpcomingMatch = currentPlayer
    ? matches.find(
        m =>
          (m.player1Id === currentPlayer.id || m.player2Id === currentPlayer.id) &&
          (m.status === 'live' || m.status === 'warmup' || m.status === 'scheduled')
      )
    : null;

  const getPlayer = (id: string): Player | undefined => players.find(p => p.id === id);

  // Unplayed opponents for 1-tap quick matchmaking
  const unplayedOpponents = currentPlayer
    ? getUnplayedOpponentsForPlayer(currentPlayer.id).slice(0, 6)
    : [];

  const handleQuickOpponentSelect = (opponentPlayer: Player) => {
    triggerHaptic('success');
    triggerCelebration();
    const createdMatch = scheduleMatchWithOpponent(opponentPlayer.id);
    setQuickSelectedOpponent(opponentPlayer);
    setQuickPendingMatch(createdMatch);
    setShowQuickClash(true);
  };

  const handleQuickClashComplete = () => {
    setShowQuickClash(false);
    if (onSelectMatchForScore && quickPendingMatch) {
      setTimeout(() => {
        onSelectMatchForScore(quickPendingMatch);
        setQuickSelectedOpponent(null);
        setQuickPendingMatch(null);
      }, 50);
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-lg mx-auto px-4 pt-4 transition-colors duration-200">
      {/* 1. EDITORIAL HERO MOMENT WITH PING PONG TABLE BLUEPRINT & TEXTURE */}
      <div className="pingpong-table-card pingpong-table-lines p-5 relative overflow-hidden transition-colors duration-200">
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#d90429] border border-[#ff4d6d] shadow-sm"></span>
              <span className="text-[11px] font-semibold text-[#5f79ff] dark:text-[#7b8eff] uppercase tracking-wider block">
                Ping Pong Cup • First to 12
              </span>
            </div>
            <h2 className="text-2xl font-light tracking-tight text-[#000000] dark:text-[#f8fafc] font-display-serif mt-0.5">
              Build • Compete • Win
            </h2>
            <p className="text-xs text-[#4d4d4d] dark:text-[#94a3b8] mt-1">
              Nexia Mongolia & McKenzie 2026 Table Tennis Championship
            </p>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] border border-[#e5e5e5] dark:border-[#263244] flex items-center justify-center flex-shrink-0 shadow-sm">
            <Trophy className="w-5 h-5 text-[#5f79ff] dark:text-[#7b8eff]" />
          </div>
        </div>
      </div>

      {/* 2. ACTIVE / OPEN MATCH BANNER: END GAME & ENTER FINAL SCORE */}
      {currentPlayer && myUpcomingMatch && (
        <div className="bg-[#f6f8ff] dark:bg-[#1a2230] border border-[#d9defc] dark:border-[#263244] rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#01fe93]" />
              <span className="text-xs font-semibold text-[#5f79ff] dark:text-[#7b8eff] uppercase tracking-wider">
                Match in Progress
              </span>
            </div>
            <span className="text-[11px] text-[#707070] dark:text-[#94a3b8] font-mono">
              {myUpcomingMatch.scheduledTime}
            </span>
          </div>

          {(() => {
            const isP1 = myUpcomingMatch.player1Id === currentPlayer.id;
            const opponentId = isP1 ? myUpcomingMatch.player2Id : myUpcomingMatch.player1Id;
            const opponent = getPlayer(opponentId);
            const oppTheme = getCompanyTheme(opponent?.company);

            return (
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full bg-white dark:bg-[#141a24] border border-[#e5e5e5] dark:border-[#263244] flex items-center justify-center text-[#000000] dark:text-[#f8fafc] font-bold text-xs shadow-sm flex-shrink-0">
                    {opponent?.avatar || 'OP'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#000000] dark:text-[#f8fafc] truncate">
                        vs {opponent ? opponent.name : 'Opponent'}
                      </span>
                      {oppTheme && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${oppTheme.badgeBg} ${oppTheme.badgeText} border ${oppTheme.badgeBorder}`}>
                          {oppTheme.shortName}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#707070] dark:text-[#94a3b8] truncate">Round-Robin Official</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    triggerHaptic('success');
                    onSelectMatchForScore(myUpcomingMatch);
                  }}
                  className="px-4 py-2 rounded-full bg-[#5f79ff] dark:bg-[#6378ff] hover:bg-[#4d69f0] dark:hover:bg-[#7b8eff] text-white font-medium text-xs transition active:scale-95 flex items-center gap-1.5 flex-shrink-0 shadow-sm"
                >
                  <Trophy className="w-3.5 h-3.5 text-white" />
                  <span>Record Score</span>
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* 4. PRIMARY MATCH LAUNCHER (100px Signal Violet Pill) */}
      {currentPlayer && (
        <div className="pingpong-table-card p-5 space-y-4 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#01fe93]"></span>
                <span className="text-[10px] font-semibold text-[#5f79ff] dark:text-[#7b8eff] uppercase tracking-wider block leading-none">
                  Instant Match
                </span>
              </div>
              <h3 className="text-base font-light font-display-serif text-[#000000] dark:text-[#f8fafc]">
                Start a New Game
              </h3>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] text-[#5f79ff] dark:text-[#7b8eff] flex items-center justify-center border border-[#e5e5e5] dark:border-[#263244] shadow-sm">
              <Swords className="w-4 h-4" />
            </div>
          </div>

          {/* Action Buttons: Find Opponent and Quick QR Match */}
          <div className="space-y-2">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                triggerHaptic('success');
                setIsFindOpponentOpen(true);
              }}
              className="w-full py-3 px-5 bg-[#5f79ff] dark:bg-[#6378ff] hover:bg-[#4d69f0] dark:hover:bg-[#7b8eff] text-white font-medium rounded-full text-sm flex items-center justify-center gap-2 transition shadow-md shadow-[#5f79ff]/20 relative overflow-hidden group"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Swords className="w-4 h-4 text-white" />
              </motion.div>
              <span className="font-semibold tracking-wide">Play Match</span>
              <Sparkles className="w-3.5 h-3.5 text-white/80 opacity-0 group-hover:opacity-100 transition" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                triggerHaptic('light');
                setSelectedOpponentForQR(null);
                setIsQRModalOpen(true);
              }}
              className="w-full py-2.5 px-4 bg-[#fafafa] dark:bg-[#1a2230] hover:bg-[#f0f4ff] dark:hover:bg-[#202b3d] border border-[#e5e5e5] dark:border-[#263244] text-[#5f79ff] dark:text-[#7b8eff] font-medium rounded-full text-xs flex items-center justify-center gap-2 transition"
            >
              <QrCode className="w-3.5 h-3.5 text-[#5f79ff] dark:text-[#7b8eff]" />
              <span>Show QR</span>
            </motion.button>
          </div>

          {/* Quick-Pick Unplayed Opponents */}
          {unplayedOpponents.length > 0 && (
            <div className="pt-2 border-t border-[#f0f0f0] dark:border-[#263244]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#4d4d4d] dark:text-[#cbd5e1] font-semibold">
                  Quick Opponent Select:
                </span>
                <span className="text-[10px] text-[#a6a6a6] dark:text-[#64748b]">1-tap to start</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {unplayedOpponents.map(({ player }) => {
                  const theme = getCompanyTheme(player.company);
                  return (
                    <motion.button
                      key={player.id}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => handleQuickOpponentSelect(player)}
                      className="p-2 rounded-xl border border-[#e5e5e5] dark:border-[#263244] bg-[#fafafa] dark:bg-[#1a2230] hover:bg-[#f5f5f5] dark:hover:bg-[#1e293b] flex items-center gap-2 transition flex-shrink-0 shadow-sm"
                    >
                      <div
                        className="w-7 h-7 rounded-full bg-[#ffffff] dark:bg-[#141a24] border border-[#e5e5e5] dark:border-[#263244] text-[#000000] dark:text-[#f8fafc] font-bold flex items-center justify-center text-[10px] shadow-sm"
                      >
                        {player.avatar}
                      </div>
                      <div className="text-left pr-1">
                        <span className="text-xs font-semibold text-[#000000] dark:text-[#f8fafc] block max-w-[85px] truncate">
                          {player.name.split(' ')[0]}
                        </span>
                        <span className="text-[9px] text-[#707070] dark:text-[#94a3b8] block">
                          {theme.shortName}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. PINGPONG 3D ARCADE / TRAINING CALLOUT (Based on ibra-kdbra/PingPong-3D) */}
      <div className="pingpong-table-card p-4.5 relative overflow-hidden bg-gradient-to-br from-[#5f79ff]/10 via-[#ffffff] to-[#d90429]/5 dark:from-[#5f79ff]/15 dark:via-[#141a24] dark:to-[#d90429]/10 border border-[#d9defc] dark:border-[#263244] shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#01fe93] animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f79ff] dark:text-[#7b8eff]">
                3D Interactive Arcade
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#000000] dark:text-[#f8fafc] flex items-center gap-1.5">
              <span>🏓</span> PingPong 3D Arena
            </h3>
            <p className="text-[11px] text-[#4d4d4d] dark:text-[#94a3b8] max-w-[260px]">
              Full Three.js match simulation, AI rally bot, and target training drills.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic('medium');
              onNavigateTab('play');
            }}
            className="px-4 py-2.5 rounded-xl bg-[#5f79ff] hover:bg-[#4d69f0] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 flex-shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Play 3D</span>
          </motion.button>
        </div>
      </div>

      {/* 6. RECENT RESULTS FEED (Live & Verified Match Scores) */}
      <RecentResultsFeed onSelectMatchForScore={onSelectMatchForScore} />

      {/* 7. TOURNAMENT OVERALL PROGRESS CARD */}
      <TournamentProgressCard />

      {/* 7. QUICK ACCESS CARDS */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            triggerHaptic('light');
            onNavigateTab('standings');
          }}
          className="p-4 pingpong-table-card hover:bg-[#fafafa] dark:hover:bg-[#1a2230] text-left transition flex items-center gap-3 shadow-sm"
        >
          <div className="w-8 h-8 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] border border-[#e5e5e5] dark:border-[#263244] flex items-center justify-center flex-shrink-0 shadow-sm">
            <Trophy className="w-4 h-4 text-[#5f79ff] dark:text-[#7b8eff]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#000000] dark:text-[#f8fafc] block">Leaderboard</span>
            <span className="text-[10px] text-[#707070] dark:text-[#94a3b8] block">Standings & Ranks</span>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            triggerHaptic('light');
            onNavigateTab('fixtures');
          }}
          className="p-4 pingpong-table-card hover:bg-[#fafafa] dark:hover:bg-[#1a2230] text-left transition flex items-center gap-3 shadow-sm"
        >
          <div className="w-8 h-8 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] border border-[#e5e5e5] dark:border-[#263244] flex items-center justify-center flex-shrink-0 shadow-sm">
            <Calendar className="w-4 h-4 text-[#5f79ff] dark:text-[#7b8eff]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#000000] dark:text-[#f8fafc] block">Fixtures</span>
            <span className="text-[10px] text-[#707070] dark:text-[#94a3b8] block">Tables & Results</span>
          </div>
        </motion.button>
      </div>

      {/* 8. TOURNAMENT RULES & FAQ */}
      <RulesFaqCard defaultExpanded={false} />

      {/* Matchup Quick Clash Overlay */}
      {showQuickClash && currentPlayer && quickSelectedOpponent && (
        <MatchupClashModal
          isOpen={showQuickClash}
          player1={currentPlayer}
          player2={quickSelectedOpponent}
          courtName="Court 1"
          onAnimationComplete={handleQuickClashComplete}
        />
      )}

      {/* Modals */}
      <MatchQRModal
        isOpen={isQRModalOpen}
        opponent={selectedOpponentForQR}
        onClose={() => {
          setIsQRModalOpen(false);
          setSelectedOpponentForQR(null);
        }}
        onOpenScoreForMatch={onSelectMatchForScore}
      />

      <FindOpponentModal
        isOpen={isFindOpponentOpen}
        onClose={() => setIsFindOpponentOpen(false)}
        onSelectMatchForScore={onSelectMatchForScore}
      />
    </div>
  );
};
