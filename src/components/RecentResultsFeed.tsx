import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Match, Player } from '../types';
import { CheckCircle2, ChevronDown, ChevronUp, Clock, ChevronRight } from 'lucide-react';
import { getCompanyTheme } from '../utils/companyStyles';

interface RecentResultsFeedProps {
  onSelectMatchForScore?: (match: Match) => void;
}

export const RecentResultsFeed: React.FC<RecentResultsFeedProps> = ({ onSelectMatchForScore }) => {
  const { matches, players, setSelectedPlayerForProfile, getMatchLockStatus, triggerHaptic } = useTournament();
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter ONLY completed matches with valid scores, sorted by result_submitted_at / confirmed_at newest first
  const completedMatches = matches
    .filter(m => m.status === 'completed' && m.winnerId && m.scores && m.scores.length > 0)
    .sort((a, b) => {
      const timeA = new Date(a.result_submitted_at || a.confirmed_at || a.scheduled_at || 0).getTime();
      const timeB = new Date(b.result_submitted_at || b.confirmed_at || b.scheduled_at || 0).getTime();
      return timeB - timeA;
    });

  const getPlayer = (id: string): Player | undefined => players.find(p => p.id === id);

  const displayedMatches = isExpanded ? completedMatches : completedMatches.slice(0, 5);

  if (completedMatches.length === 0) return null;

  return (
    <div className="pingpong-table-card p-4 sm:p-5 space-y-3 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] border border-[#e5e5e5] dark:border-[#263244] flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-[#059669] dark:text-[#34d399]" />
          </div>
          <div>
            <h3 className="text-[10px] font-semibold text-[#5f79ff] dark:text-[#7b8eff] uppercase tracking-wider leading-none">
              Live Feed
            </h3>
            <h4 className="text-sm font-light font-display-serif text-[#000000] dark:text-[#f8fafc] mt-0.5">
              Recent Results
            </h4>
          </div>
        </div>

        <span className="text-[10px] font-semibold text-[#059669] dark:text-[#34d399] bg-[#e6fcf3] dark:bg-[#064e3b]/30 border border-[#a7f3d0] dark:border-[#059669]/40 px-2.5 py-0.5 rounded-full shadow-sm">
          {completedMatches.length} Confirmed
        </span>
      </div>

      {/* Feed List */}
      <div className="space-y-2">
        {displayedMatches.map(match => {
          const winner = getPlayer(match.winnerId || '');
          const loserId = match.player1Id === match.winnerId ? match.player2Id : match.player1Id;
          const loser = getPlayer(loserId);
          const lock = getMatchLockStatus(match);

          if (!winner || !loser) return null;

          const winnerTheme = getCompanyTheme(winner.company);

          const formattedScore = match.scores
            .map(s => {
              const p1IsWinner = match.winnerId === match.player1Id;
              const winGames = p1IsWinner ? s.player1 : s.player2;
              const loseGames = p1IsWinner ? s.player2 : s.player1;
              return `${winGames}–${loseGames}`;
            })
            .join(' · ');

          return (
            <div
              key={match.id}
              className="bg-[#fafafa] dark:bg-[#1a2230] hover:bg-[#f5f5f5] dark:hover:bg-[#1e293b] p-3 rounded-xl border border-[#ebebeb] dark:border-[#263244] transition duration-150 space-y-2"
            >
              {/* Top Result Line: Winner beat Loser */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap flex-1 text-xs">
                  {/* Winner Pill */}
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedPlayerForProfile(winner);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition ${winnerTheme.badgeBg} ${winnerTheme.badgeText} border ${winnerTheme.badgeBorder} hover:opacity-80 active:scale-95`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669] dark:bg-[#34d399]" />
                    <span>{winner.name}</span>
                  </button>

                  <span className="text-[#707070] dark:text-[#94a3b8] text-[11px] font-medium">beat</span>

                  {/* Loser Pill */}
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedPlayerForProfile(loser);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f5f5f5] dark:bg-[#141a24] text-[#707070] dark:text-[#94a3b8] border border-[#e5e5e5] dark:border-[#263244] hover:text-[#000000] dark:hover:text-[#f8fafc] active:scale-95"
                  >
                    <span>{loser.name}</span>
                  </button>
                </div>

                {/* Relative Time */}
                <span className="text-[10px] text-[#a6a6a6] dark:text-[#64748b] font-mono whitespace-nowrap flex-shrink-0">
                  {match.lastUpdated || 'Recently'}
                </span>
              </div>

              {/* Bottom Result Line: Score & Status */}
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#ebebeb] dark:border-[#263244]">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#000000] dark:text-[#f8fafc] text-sm tracking-wide">
                    {formattedScore}
                  </span>
                  {match.type === 'REMATCH' && (
                    <span className="px-2 py-0.2 rounded-full text-[9px] font-semibold bg-[#eef2ff] dark:bg-[#312e81]/40 text-[#5f79ff] dark:text-[#7b8eff] border border-[#c7d2fe] dark:border-[#6366f1]/40">
                      REMATCH
                    </span>
                  )}
                </div>

                {/* 6-Hour Editing Lock Indicator */}
                <div className="flex items-center gap-2">
                  {lock.isLocked ? (
                    <span
                      className="text-[10px] text-[#a6a6a6] dark:text-[#64748b] flex items-center gap-1"
                      title={lock.displayText}
                    >
                      <Clock className="w-3 h-3 text-[#a6a6a6] dark:text-[#64748b]" />
                      <span>Locked</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#5f79ff] dark:text-[#7b8eff] font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#5f79ff] dark:text-[#7b8eff]" />
                      <span>Editable ({Math.floor(lock.timeRemainingMs / 3600000)}h left)</span>
                    </span>
                  )}

                  {onSelectMatchForScore && (
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        onSelectMatchForScore(match);
                      }}
                      className="text-[11px] text-[#5f79ff] dark:text-[#7b8eff] hover:underline font-semibold flex items-center gap-0.5"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View More / View Less Toggle */}
      {completedMatches.length > 5 && (
        <button
          onClick={() => {
            triggerHaptic('light');
            setIsExpanded(!isExpanded);
          }}
          className="w-full py-2 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] hover:bg-[#ebebeb] dark:hover:bg-[#263244] text-[#4d4d4d] dark:text-[#cbd5e1] hover:text-[#000000] dark:hover:text-[#f8fafc] font-medium text-xs transition flex items-center justify-center gap-1 border border-[#e5e5e5] dark:border-[#263244]"
        >
          <span>{isExpanded ? 'View Less' : 'View All'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};
