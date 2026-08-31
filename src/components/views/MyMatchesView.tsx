import React, { useState, useMemo } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Match, Player } from '../../types';
import {
  UserCheck,
  Zap,
  Clock,
  Swords,
  UserPlus,
  Lock,
  RefreshCw,
  Trophy,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { getCompanyTheme } from '../../utils/companyStyles';

interface MyMatchesViewProps {
  onSelectMatchForScore: (match: Match) => void;
  onOpenPlayerModal: () => void;
}

export const MyMatchesView: React.FC<MyMatchesViewProps> = ({
  onSelectMatchForScore,
  onOpenPlayerModal
}) => {
  const {
    currentPlayer,
    matches,
    players,
    rematchRequests,
    requestRematch,
    declineRematch,
    getMatchLockStatus,
    setSelectedPlayerForProfile,
    triggerHaptic
  } = useTournament();

  const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'completed'>('all');

  const myMatches = useMemo(() => {
    if (!currentPlayer) return [];
    return matches.filter(
      m => m.player1Id === currentPlayer.id || m.player2Id === currentPlayer.id
    );
  }, [matches, currentPlayer]);

  const filteredMatches = useMemo(() => {
    if (filterTab === 'upcoming') {
      return myMatches.filter(m => m.status === 'scheduled' || m.status === 'live' || m.status === 'warmup');
    }
    if (filterTab === 'completed') {
      return myMatches.filter(m => m.status === 'completed' || m.status === 'walkover');
    }
    return myMatches;
  }, [myMatches, filterTab]);

  const getPlayer = (id: string): Player | undefined => players.find(p => p.id === id);

  if (!currentPlayer) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-4 pb-20">
        <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/15 backdrop-blur-2xl flex items-center justify-center mx-auto text-blue-400 shadow-2xl">
          <UserCheck className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white font-['Outfit']">
            Select Your Player Profile
          </h3>
          <p className="text-xs text-white/50 max-w-xs mx-auto">
            Choose your name from the 47 employee roster to manage your matches, record results, and request rematches.
          </p>
        </div>
        <button
          onClick={() => {
            triggerHaptic('success');
            onOpenPlayerModal();
          }}
          className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-2xl shadow-xl transition active:scale-95 text-xs inline-flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4 text-blue-600" />
          <span>Select Profile</span>
        </button>
      </div>
    );
  }

  const { stats } = currentPlayer;
  const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
  const setsDiff = stats.setsWon - stats.setsLost;
  const myCompanyTheme = getCompanyTheme(currentPlayer.company);

  return (
    <div className="space-y-4 pb-24 max-w-lg mx-auto px-4 pt-3">
      {/* 1. Player Card with Company Tint */}
      <div
        className={`backdrop-blur-2xl rounded-3xl p-5 border shadow-2xl relative overflow-hidden ${myCompanyTheme.cardBg} ${myCompanyTheme.cardBorder}`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${currentPlayer.avatarColor} text-white font-bold flex items-center justify-center text-lg shadow-lg border border-white/20`}
            >
              {currentPlayer.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-white font-['Outfit']">
                  {currentPlayer.name}
                </h3>
                <span
                  className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${myCompanyTheme.badgeBg} ${myCompanyTheme.badgeText} border ${myCompanyTheme.badgeBorder}`}
                >
                  {myCompanyTheme.name}
                </span>
              </div>
              <p className="text-xs text-teal-300 font-medium">
                {currentPlayer.company}
              </p>
              <p className="text-[11px] text-white/50 mt-0.5">
                Tournament Seed: <span className="text-white font-semibold">#{currentPlayer.seed || 'Unseeded'}</span>
              </p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-300 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span>Court 1</span>
            </span>
          </div>
        </div>

        {/* Tactical Stat Badges */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/10">
          <div className="bg-black/30 p-2 rounded-2xl text-center border border-white/5">
            <p className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Record</p>
            <p className="text-sm font-bold text-white font-mono mt-0.5">
              {stats.won}W - {stats.lost}L
            </p>
          </div>
          <div className="bg-black/30 p-2 rounded-2xl text-center border border-white/5">
            <p className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Win Rate</p>
            <p className="text-sm font-bold text-teal-300 font-mono mt-0.5">
              {winRate}%
            </p>
          </div>
          <div className="bg-black/30 p-2 rounded-2xl text-center border border-white/5">
            <p className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Sets Diff</p>
            <p className={`text-sm font-bold font-mono mt-0.5 ${setsDiff >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
              {setsDiff > 0 ? `+${setsDiff}` : setsDiff}
            </p>
          </div>
          <div className="bg-black/30 p-2 rounded-2xl text-center border border-white/5">
            <p className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Points</p>
            <p className="text-sm font-bold text-amber-400 font-mono mt-0.5">
              {stats.points} pts
            </p>
          </div>
        </div>
      </div>

      {/* 2. Match Filters */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
          <Swords className="w-4 h-4 text-blue-400" />
          <span>My Matches ({myMatches.length})</span>
        </h4>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
          {(['all', 'upcoming', 'completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                triggerHaptic('light');
                setFilterTab(tab);
              }}
              className={`px-3 py-1 text-xs font-bold capitalize rounded-xl transition ${
                filterTab === tab
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Match List */}
      <div className="space-y-3">
        {filteredMatches.length === 0 ? (
          <div className="text-center py-10 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl text-white/50 text-xs">
            <p>No matches found in this category.</p>
            <p className="text-[11px] text-white/40 mt-1">
              Use "Find Opponent" on Home to schedule a fixture!
            </p>
          </div>
        ) : (
          filteredMatches.map(match => {
            const isP1 = match.player1Id === currentPlayer.id;
            const opponentId = isP1 ? match.player2Id : match.player1Id;
            const opponent = getPlayer(opponentId);
            const isWon = match.winnerId === currentPlayer.id;
            const oppTheme = getCompanyTheme(opponent?.company);
            const lock = getMatchLockStatus(match);

            const rematchReq = rematchRequests.find(r => r.original_match_id === match.id);
            const isCurrentP1 = currentPlayer.id === match.player1Id;
            const hasRequestedRematch = rematchReq
              ? isCurrentP1
                ? rematchReq.player1_requested
                : rematchReq.player2_requested
              : false;
            const opponentRequestedRematch = rematchReq
              ? isCurrentP1
                ? rematchReq.player2_requested
                : rematchReq.player1_requested
              : false;

            return (
              <div
                key={match.id}
                className="bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-3xl p-4 border border-white/10 shadow-xl space-y-3 transition"
              >
                {/* Header */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">{match.court}</span>
                    <span className="text-white/50">• {match.stage}</span>
                    {match.type === 'REMATCH' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                        REMATCH
                      </span>
                    )}
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      match.status === 'live'
                        ? 'bg-rose-500 text-white animate-pulse'
                        : match.status === 'completed'
                        ? isWon
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                        : 'bg-white/10 text-white/60 border border-white/10'
                    }`}
                  >
                    {match.status === 'completed' ? (isWon ? 'VICTORY' : 'DEFEAT') : match.status}
                  </span>
                </div>

                {/* Opponent Card */}
                <div
                  onClick={() => {
                    if (opponent) {
                      triggerHaptic('light');
                      setSelectedPlayerForProfile(opponent);
                    }
                  }}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                    oppTheme ? `${oppTheme.cardBg} ${oppTheme.cardBorder}` : 'bg-black/20 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${opponent?.avatarColor || 'from-purple-500 to-indigo-600'} text-white font-bold flex items-center justify-center text-xs shadow border border-white/20`}
                    >
                      {opponent?.avatar || 'OP'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-white">{opponent?.name}</span>
                        {oppTheme && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${oppTheme.badgeBg} ${oppTheme.badgeText} border ${oppTheme.badgeBorder}`}
                          >
                            {oppTheme.shortName}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/50">
                        {opponent?.company} • {opponent?.stats.won}W-{opponent?.stats.lost}L
                      </p>
                    </div>
                  </div>

                  {/* Score breakdown if played */}
                  {match.scores.length > 0 ? (
                    <div className="flex items-center gap-1.5">
                      {match.scores.map((set, idx) => {
                        const myGames = isP1 ? set.player1 : set.player2;
                        const oppGames = isP1 ? set.player2 : set.player1;
                        return (
                          <div
                            key={idx}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs border ${
                              myGames > oppGames
                                ? 'bg-blue-500/30 border-blue-400/40 text-blue-200'
                                : 'bg-black/30 border-white/10 text-white/50'
                            }`}
                          >
                            {myGames}-{oppGames}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {match.scheduledTime}
                      </span>
                    </div>
                  )}
                </div>

                {/* Rematch Notification Banner (Requirement 6) */}
                {match.status === 'completed' && opponentRequestedRematch && !hasRequestedRematch && (
                  <div className="bg-blue-500/20 p-2.5 rounded-xl border border-blue-500/30 flex items-center justify-between text-xs">
                    <span className="text-blue-200 font-semibold">
                      🎾 {opponent?.name.split(' ')[0]} requested a rematch!
                    </span>
                    <button
                      onClick={() => {
                        triggerHaptic('success');
                        requestRematch(match.id, currentPlayer.id);
                      }}
                      className="px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg text-xs"
                    >
                      Accept
                    </button>
                  </div>
                )}

                {/* Action footer */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div>
                    {match.status === 'completed' ? (
                      lock.isLocked ? (
                        <span className="text-[10px] text-white/40 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-white/30" />
                          <span>Locked</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Editable ({Math.floor(lock.timeRemainingMs / 3600000)}h left)</span>
                        </span>
                      )
                    ) : (
                      <span className="text-white/40 text-[11px]">{match.notes || 'Wilson balls'}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {match.status === 'completed' && !hasRequestedRematch && !rematchReq && (
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          requestRematch(match.id, currentPlayer.id);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-semibold text-xs transition"
                      >
                        Rematch?
                      </button>
                    )}

                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        onSelectMatchForScore(match);
                      }}
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-xl shadow-lg transition active:scale-95 flex items-center gap-1 text-xs"
                    >
                      <Zap className="w-3.5 h-3.5 text-blue-600" />
                      <span>{match.status === 'completed' ? 'Details' : 'Score'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
