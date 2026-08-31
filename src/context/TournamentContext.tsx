import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  Player,
  Match,
  Announcement,
  Division,
  MatchStatus,
  SetScore,
  LiveGameScore,
  RematchRequest,
  Company,
  MatchType
} from '../types';
import {
  INITIAL_PLAYERS,
  INITIAL_MATCHES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_REMATCH_REQUESTS,
  TOTAL_TOURNAMENT_MATCHES,
  COMPLETED_MATCHES_BASELINE
} from '../data/tournamentData';
import confetti from 'canvas-confetti';

interface LockStatusInfo {
  isLocked: boolean;
  canEdit: boolean;
  timeRemainingMs: number;
  displayText: string;
  submittedAtFormatted: string;
}

interface TournamentContextType {
  players: Player[];
  matches: Match[];
  rematchRequests: RematchRequest[];
  announcements: Announcement[];
  currentPlayerId: string | null;
  currentPlayer: Player | null;
  activeDivision: Division;
  isOffline: boolean;
  isAdminMode: boolean;
  selectedPlayerForProfile: Player | null;
  totalTournamentMatches: number;
  completedTournamentMatches: number;
  tournamentProgressPercentage: number;
  
  // Setters
  setCurrentPlayerId: (id: string | null) => void;
  setActiveDivision: (div: Division) => void;
  setIsAdminMode: (isAdmin: boolean) => void;
  setSelectedPlayerForProfile: (player: Player | null) => void;
  
  // UI & Feedback
  triggerCelebration: () => void;
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy' | 'success') => void;
  
  // Match & Score Management
  updateMatchScore: (
    matchId: string,
    scores: SetScore[],
    liveGame?: LiveGameScore,
    status?: MatchStatus,
    winnerId?: string,
    notes?: string,
    submittedByPlayerId?: string
  ) => { success: boolean; message?: string };
  
  pointWon: (matchId: string, player: 'player1' | 'player2') => void;
  changeServer: (matchId: string) => void;
  setMatchStatus: (matchId: string, status: MatchStatus, winnerId?: string) => void;
  addNewMatch: (match: Omit<Match, 'id'>) => Match;
  scheduleMatchWithOpponent: (opponentId: string, scheduledTime?: string, court?: Match['court']) => Match;
  
  // 6-Hour Lock Helpers
  getMatchLockStatus: (match: Match) => LockStatusInfo;
  adminCorrectMatch: (
    matchId: string,
    scores: SetScore[],
    winnerId: string,
    notes?: string
  ) => void;
  adminResolveDispute: (matchId: string, status: MatchStatus) => void;
  
  // Rematch System
  requestRematch: (originalMatchId: string, playerId: string) => void;
  declineRematch: (requestId: string) => void;
  adminApproveRematch: (requestId: string) => void;
  adminDeclineRematch: (requestId: string) => void;
  getRematchStatusForMatch: (originalMatchId: string) => RematchRequest | undefined;
  
  // Opponent Helpers
  getUnplayedOpponentsForPlayer: (playerId: string) => {
    player: Player;
    status: 'not_scheduled' | 'scheduled' | 'awaiting_confirmation' | 'live';
    existingMatch?: Match;
  }[];
  
  // Player Registration & Reset
  registerPlayer: (player: Omit<Player, 'id' | 'stats'>) => Player;
  updatePlayerProfile: (playerId: string, updates: Partial<Player>) => void;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'time'>) => void;
  resetTournamentData: () => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

const STORAGE_KEYS = {
  VERSION: 'nekenzie_cup_v4_actual_roster',
  PLAYER_ID: 'nekenzie_cup_v4_player_id',
  PLAYERS: 'nekenzie_cup_v4_players',
  MATCHES: 'nekenzie_cup_v4_matches',
  REMATCH_REQUESTS: 'nekenzie_cup_v4_rematches',
  ANNOUNCEMENTS: 'nekenzie_cup_v4_announcements',
  ADMIN_MODE: 'nekenzie_cup_v4_admin_mode'
};

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export const TournamentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Clear legacy mock data caches if transitioning to clean slate
  useEffect(() => {
    try {
      const legacyKeys = [
        'nekenzie_cup_v3_clean_init',
        'nekenzie_cup_v3_player_id',
        'nekenzie_cup_v3_players',
        'nekenzie_cup_v3_matches',
        'nekenzie_cup_v3_rematches',
        'nekenzie_cup_v3_announcements',
        'nekenzie_cup_v3_admin_mode',
        'nekenzie_cup_2026_player_id',
        'nekenzie_cup_2026_players',
        'nekenzie_cup_2026_matches',
        'nekenzie_cup_2026_rematches',
        'nekenzie_cup_2026_announcements',
        'nekenzie_cup_2026_admin_mode',
        'tennis_tournament_player_id',
        'tennis_tournament_players',
        'tennis_tournament_matches',
        'tennis_tournament_rematches'
      ];
      legacyKeys.forEach(k => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }, []);

  // 1. Current Player State - defaults to null on first visit so user must select name & job title
  const [currentPlayerId, setCurrentPlayerIdState] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAYER_ID);
      return saved || null;
    } catch {
      return null;
    }
  });

  // 2. Core Tournament Data
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAYERS);
      return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
    } catch {
      return INITIAL_PLAYERS;
    }
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MATCHES);
      return saved ? JSON.parse(saved) : INITIAL_MATCHES;
    } catch {
      return INITIAL_MATCHES;
    }
  });

  const [rematchRequests, setRematchRequests] = useState<RematchRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REMATCH_REQUESTS);
      return saved ? JSON.parse(saved) : INITIAL_REMATCH_REQUESTS;
    } catch {
      return INITIAL_REMATCH_REQUESTS;
    }
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  });

  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_MODE) === 'true';
    } catch {
      return false;
    }
  });

  const [activeDivision, setActiveDivision] = useState<Division>('mixed_division');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [selectedPlayerForProfile, setSelectedPlayerForProfile] = useState<Player | null>(null);

  // Sync to LocalStorage
  const setCurrentPlayerId = (id: string | null) => {
    setCurrentPlayerIdState(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEYS.PLAYER_ID, id);
      else localStorage.removeItem(STORAGE_KEYS.PLAYER_ID);
    } catch (e) {
      console.warn('Error saving player identity', e);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    } catch (e) {
      console.warn('Error saving players', e);
    }
  }, [players]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
    } catch (e) {
      console.warn('Error saving matches', e);
    }
  }, [matches]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REMATCH_REQUESTS, JSON.stringify(rematchRequests));
    } catch (e) {
      console.warn('Error saving rematches', e);
    }
  }, [rematchRequests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
    } catch (e) {
      console.warn('Error saving announcements', e);
    }
  }, [announcements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_MODE, String(isAdminMode));
    } catch (e) {
      console.warn('Error saving admin mode', e);
    }
  }, [isAdminMode]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' = 'light') => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        if (type === 'light') navigator.vibrate(12);
        else if (type === 'medium') navigator.vibrate(28);
        else if (type === 'heavy') navigator.vibrate([40, 20, 40]);
        else if (type === 'success') navigator.vibrate([30, 40, 60]);
      }
    } catch {
      // safe fallback
    }
  }, []);

  const triggerCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#fbbf24', '#ffffff', '#6366f1']
      });
    } catch {
      // safe fallback
    }
  }, []);

  // 6-Hour Lock Helper (Requirement 7)
  const getMatchLockStatus = useCallback((match: Match): LockStatusInfo => {
    if (!match.result_submitted_at) {
      return {
        isLocked: false,
        canEdit: true,
        timeRemainingMs: SIX_HOURS_MS,
        displayText: 'Draft',
        submittedAtFormatted: ''
      };
    }

    const submittedTime = new Date(match.result_submitted_at).getTime();
    const now = Date.now();
    const elapsed = now - submittedTime;
    const timeRemainingMs = Math.max(0, SIX_HOURS_MS - elapsed);
    const isLocked = elapsed >= SIX_HOURS_MS || Boolean(match.locked_at);

    const submitDate = new Date(match.result_submitted_at);
    const month = submitDate.toLocaleString('en-US', { month: 'short' });
    const day = submitDate.getDate();
    const hoursStr = String(submitDate.getHours()).padStart(2, '0');
    const minsStr = String(submitDate.getMinutes()).padStart(2, '0');
    const submittedAtFormatted = `${month} ${day}, ${hoursStr}:${minsStr}`;

    let displayText = '';
    if (isLocked) {
      displayText = `RESULT LOCKED · Submitted ${submittedAtFormatted}`;
    } else {
      const remainingHours = Math.floor(timeRemainingMs / (1000 * 60 * 60));
      const remainingMinutes = Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60));
      displayText = `Result editable for: ${remainingHours}h ${remainingMinutes}m`;
    }

    const canEdit = !isLocked || isAdminMode;

    return {
      isLocked,
      canEdit,
      timeRemainingMs,
      displayText,
      submittedAtFormatted
    };
  }, [isAdminMode]);

  // Recalculate player stats from OFFICIAL matches only (Win = 1 pt, Loss = 0 pts, +/- Point Differential)
  const recalculateStats = (currentMatches: Match[], currentPlayers: Player[]) => {
    const playerStatsMap: { [id: string]: Player['stats'] } = {};

    currentPlayers.forEach(p => {
      playerStatsMap[p.id] = {
        played: 0,
        won: 0,
        lost: 0,
        pointsScored: 0,
        pointsConceded: 0,
        pointDiff: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        points: 0
      };
    });

    currentMatches.forEach(m => {
      // ONLY OFFICIAL matches count for official standings
      if (m.type === 'OFFICIAL' && m.status === 'completed' && m.scores && m.scores.length > 0) {
        const p1 = m.player1Id;
        const p2 = m.player2Id;

        if (playerStatsMap[p1]) playerStatsMap[p1].played += 1;
        if (playerStatsMap[p2]) playerStatsMap[p2].played += 1;

        if (m.winnerId === p1) {
          if (playerStatsMap[p1]) {
            playerStatsMap[p1].won += 1;
            playerStatsMap[p1].points += 1; // 1 point for winning the game
          }
          if (playerStatsMap[p2]) {
            playerStatsMap[p2].lost += 1;
            // 0 points for losing
          }
        } else if (m.winnerId === p2) {
          if (playerStatsMap[p2]) {
            playerStatsMap[p2].won += 1;
            playerStatsMap[p2].points += 1; // 1 point for winning the game
          }
          if (playerStatsMap[p1]) {
            playerStatsMap[p1].lost += 1;
            // 0 points for losing
          }
        }

        // Add each game points (e.g. 12:6)
        m.scores.forEach(s => {
          if (s.player1 > s.player2) {
            if (playerStatsMap[p1]) playerStatsMap[p1].setsWon += 1;
            if (playerStatsMap[p2]) playerStatsMap[p2].setsLost += 1;
          } else if (s.player2 > s.player1) {
            if (playerStatsMap[p2]) playerStatsMap[p2].setsWon += 1;
            if (playerStatsMap[p1]) playerStatsMap[p1].setsLost += 1;
          }

          if (playerStatsMap[p1]) {
            playerStatsMap[p1].pointsScored += s.player1;
            playerStatsMap[p1].pointsConceded += s.player2;
            playerStatsMap[p1].gamesWon += s.player1;
            playerStatsMap[p1].gamesLost += s.player2;
            playerStatsMap[p1].pointDiff = playerStatsMap[p1].pointsScored - playerStatsMap[p1].pointsConceded;
          }
          if (playerStatsMap[p2]) {
            playerStatsMap[p2].pointsScored += s.player2;
            playerStatsMap[p2].pointsConceded += s.player1;
            playerStatsMap[p2].gamesWon += s.player2;
            playerStatsMap[p2].gamesLost += s.player1;
            playerStatsMap[p2].pointDiff = playerStatsMap[p2].pointsScored - playerStatsMap[p2].pointsConceded;
          }
        });
      }
    });

    return currentPlayers.map(p => ({
      ...p,
      stats: playerStatsMap[p.id] || p.stats
    }));
  };

  // Ping Pong Score Update with 6-Hour Lock Enforcement
  const updateMatchScore = (
    matchId: string,
    scores: SetScore[],
    liveGame?: LiveGameScore,
    status?: MatchStatus,
    winnerId?: string,
    notes?: string,
    submittedByPlayerId?: string
  ) => {
    const targetMatch = matches.find(m => m.id === matchId);
    if (!targetMatch) return { success: false, message: 'Match not found' };

    // Check lock status
    if (targetMatch.status === 'completed' && !isAdminMode) {
      const lock = getMatchLockStatus(targetMatch);
      if (lock.isLocked) {
        triggerHaptic('heavy');
        return {
          success: false,
          message: 'This match result is locked (6-hour editing window has passed). Contact Admin to request changes.'
        };
      }
    }

    triggerHaptic('medium');
    const nowIso = new Date().toISOString();

    setMatches(prev => {
      const updated = prev.map(m => {
        if (m.id !== matchId) return m;

        const isNewlyCompleted = status === 'completed' && m.status !== 'completed';
        const resultSubmittedAt = m.result_submitted_at || (status === 'completed' ? nowIso : undefined);
        const resultSubmittedBy = m.result_submitted_by || (status === 'completed' ? (submittedByPlayerId || currentPlayerId || undefined) : undefined);

        return {
          ...m,
          scores,
          liveGame,
          status: status || m.status,
          winnerId: winnerId !== undefined ? winnerId : m.winnerId,
          notes: notes !== undefined ? notes : m.notes,
          result_submitted_at: resultSubmittedAt,
          result_submitted_by: resultSubmittedBy,
          confirmed_at: isNewlyCompleted ? nowIso : m.confirmed_at,
          lastUpdated: 'Just now'
        };
      });

      setPlayers(prevP => recalculateStats(updated, prevP));
      return updated;
    });

    if (status === 'completed' && winnerId) {
      triggerCelebration();
    }

    return { success: true };
  };

  // Live Point Logic
  const pointWon = (matchId: string, winningPlayer: 'player1' | 'player2') => {
    triggerHaptic('medium');
    setMatches(prevMatches => {
      const updated = prevMatches.map(m => {
        if (m.id !== matchId) return m;

        const currentLive = m.liveGame || {
          player1Points: '0',
          player2Points: '0',
          server: 'player1',
          currentSet: Math.max(1, m.scores.length || 1)
        };

        const otherPlayer = winningPlayer === 'player1' ? 'player2' : 'player1';
        let p1Pt = winningPlayer === 'player1' ? currentLive.player1Points : currentLive.player2Points;
        let p2Pt = winningPlayer === 'player1' ? currentLive.player2Points : currentLive.player1Points;

        let newScores = [...m.scores];
        if (newScores.length === 0) {
          newScores = [{ player1: 0, player2: 0 }];
        }
        let setIdx = newScores.length - 1;
        let currentSetScore = { ...newScores[setIdx] };

        let gameWon = false;
        let nextP1Pt = p1Pt;
        let nextP2Pt = p2Pt;

        if (p1Pt === '0') nextP1Pt = '15';
        else if (p1Pt === '15') nextP1Pt = '30';
        else if (p1Pt === '30') nextP1Pt = '40';
        else if (p1Pt === '40') {
          if (p2Pt === '40') nextP1Pt = 'AD';
          else if (p2Pt === 'AD') nextP2Pt = '40';
          else gameWon = true;
        } else if (p1Pt === 'AD') {
          gameWon = true;
        }

        if (gameWon) {
          triggerHaptic('success');
          if (winningPlayer === 'player1') currentSetScore.player1 += 1;
          else currentSetScore.player2 += 1;

          nextP1Pt = '0';
          nextP2Pt = '0';

          const s1 = currentSetScore.player1;
          const s2 = currentSetScore.player2;
          let setFinished = false;

          if ((s1 >= 6 && s1 - s2 >= 2) || s1 === 7) setFinished = true;
          else if ((s2 >= 6 && s2 - s1 >= 2) || s2 === 7) setFinished = true;

          newScores[setIdx] = currentSetScore;

          if (setFinished) {
            let p1Sets = 0;
            let p2Sets = 0;
            newScores.forEach(s => {
              if (s.player1 > s.player2) p1Sets++;
              else if (s.player2 > s.player1) p2Sets++;
            });

            if (p1Sets === 2 || p2Sets === 2) {
              const winnerId = p1Sets === 2 ? m.player1Id : m.player2Id;
              triggerCelebration();
              const nowIso = new Date().toISOString();
              return {
                ...m,
                status: 'completed' as MatchStatus,
                scores: newScores,
                winnerId,
                liveGame: undefined,
                result_submitted_at: nowIso,
                result_submitted_by: currentPlayerId || undefined,
                confirmed_at: nowIso,
                lastUpdated: 'Just now'
              };
            } else {
              newScores.push({ player1: 0, player2: 0 });
            }
          }
        }

        const finalP1Pt = winningPlayer === 'player1' ? nextP1Pt : nextP2Pt;
        const finalP2Pt = winningPlayer === 'player1' ? nextP2Pt : nextP1Pt;

        return {
          ...m,
          status: 'live' as MatchStatus,
          scores: newScores,
          liveGame: {
            player1Points: finalP1Pt,
            player2Points: finalP2Pt,
            server: gameWon ? (currentLive.server === 'player1' ? 'player2' : 'player1') : currentLive.server,
            currentSet: newScores.length
          },
          lastUpdated: 'Live right now'
        };
      });

      setPlayers(prevPlayers => recalculateStats(updated, prevPlayers));
      return updated;
    });
  };

  const changeServer = (matchId: string) => {
    triggerHaptic('light');
    setMatches(prev =>
      prev.map(m => {
        if (m.id !== matchId) return m;
        const currentLive = m.liveGame || {
          player1Points: '0',
          player2Points: '0',
          server: 'player1',
          currentSet: 1
        };
        return {
          ...m,
          liveGame: {
            ...currentLive,
            server: currentLive.server === 'player1' ? 'player2' : 'player1'
          }
        };
      })
    );
  };

  const setMatchStatus = (matchId: string, status: MatchStatus, winnerId?: string) => {
    triggerHaptic('medium');
    const nowIso = new Date().toISOString();
    setMatches(prev => {
      const updated = prev.map(m => {
        if (m.id !== matchId) return m;
        if (status === 'completed' && winnerId) {
          triggerCelebration();
        }
        return {
          ...m,
          status,
          winnerId: winnerId || m.winnerId,
          result_submitted_at: status === 'completed' ? (m.result_submitted_at || nowIso) : m.result_submitted_at,
          result_submitted_by: status === 'completed' ? (m.result_submitted_by || currentPlayerId || undefined) : m.result_submitted_by,
          confirmed_at: status === 'completed' ? (m.confirmed_at || nowIso) : m.confirmed_at,
          lastUpdated: status === 'live' ? 'In progress' : 'Completed'
        };
      });
      setPlayers(prevP => recalculateStats(updated, prevP));
      return updated;
    });
  };

  // Schedule match with an opponent (Requirement 4)
  const scheduleMatchWithOpponent = (
    opponentId: string,
    scheduledTime?: string,
    court: Match['court'] = 'Court 1 (Centre)'
  ): Match => {
    if (!currentPlayerId) throw new Error('Must select a player first');
    triggerHaptic('success');

    const newId = 'm_sch_' + Date.now();
    const timeStr = scheduledTime || new Date(Date.now() + 2 * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMatch: Match = {
      id: newId,
      division: currentPlayer?.division || 'mixed_division',
      stage: 'Round Robin',
      court,
      scheduledTime: timeStr,
      estimatedDurationMin: 50,
      status: 'scheduled',
      type: 'OFFICIAL',
      player1Id: currentPlayerId,
      player2Id: opponentId,
      scores: [],
      notes: 'Scheduled via Find Opponent',
      lastUpdated: 'Scheduled'
    };

    setMatches(prev => [newMatch, ...prev]);
    return newMatch;
  };

  const addNewMatch = (matchData: Omit<Match, 'id'>) => {
    triggerHaptic('success');
    const newId = 'm_' + Date.now();
    const newMatch: Match = {
      ...matchData,
      id: newId
    };
    setMatches(prev => [newMatch, ...prev]);
    return newMatch;
  };

  // Admin Override of Locked Match (Requirement 7 & 10)
  const adminCorrectMatch = (
    matchId: string,
    scores: SetScore[],
    winnerId: string,
    notes?: string
  ) => {
    triggerHaptic('heavy');
    const nowIso = new Date().toISOString();
    setMatches(prev => {
      const updated = prev.map(m => {
        if (m.id !== matchId) return m;
        return {
          ...m,
          scores,
          winnerId,
          status: 'completed' as MatchStatus,
          notes: notes || m.notes || 'Corrected by Tournament Admin',
          result_submitted_at: m.result_submitted_at || nowIso,
          confirmed_at: nowIso,
          lastUpdated: 'Admin corrected'
        };
      });
      setPlayers(prevP => recalculateStats(updated, prevP));
      return updated;
    });
  };

  const adminResolveDispute = (matchId: string, status: MatchStatus) => {
    triggerHaptic('medium');
    setMatches(prev =>
      prev.map(m => {
        if (m.id !== matchId) return m;
        return {
          ...m,
          status,
          isDisputed: false,
          lastUpdated: 'Dispute resolved'
        };
      })
    );
  };

  // Rematch Request Management (Requirement 6)
  const requestRematch = (originalMatchId: string, playerId: string) => {
    triggerHaptic('success');
    const originalMatch = matches.find(m => m.id === originalMatchId);
    if (!originalMatch) return;

    const existingReq = rematchRequests.find(r => r.original_match_id === originalMatchId);

    if (existingReq) {
      // Update existing request
      const isP1 = playerId === existingReq.player1_id;
      const isP2 = playerId === existingReq.player2_id;

      const updatedReq: RematchRequest = {
        ...existingReq,
        player1_requested: isP1 ? true : existingReq.player1_requested,
        player2_requested: isP2 ? true : existingReq.player2_requested,
        player1_requested_at: isP1 ? new Date().toISOString() : existingReq.player1_requested_at,
        player2_requested_at: isP2 ? new Date().toISOString() : existingReq.player2_requested_at
      };

      setRematchRequests(prev => prev.map(r => (r.id === existingReq.id ? updatedReq : r)));
    } else {
      // Create new request
      const isP1 = playerId === originalMatch.player1Id;
      const newReq: RematchRequest = {
        id: 'rematch_req_' + Date.now(),
        original_match_id: originalMatchId,
        player1_id: originalMatch.player1Id,
        player2_id: originalMatch.player2Id,
        player1_requested: isP1,
        player2_requested: !isP1,
        player1_requested_at: isP1 ? new Date().toISOString() : undefined,
        player2_requested_at: !isP1 ? new Date().toISOString() : undefined,
        admin_status: 'PENDING',
        created_at: new Date().toISOString()
      };

      setRematchRequests(prev => [newReq, ...prev]);
    }
  };

  const declineRematch = (requestId: string) => {
    triggerHaptic('light');
    setRematchRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, admin_status: 'DECLINED' } : r))
    );
  };

  const adminApproveRematch = (requestId: string) => {
    triggerHaptic('success');
    const req = rematchRequests.find(r => r.id === requestId);
    if (!req) return;

    const originalMatch = matches.find(m => m.id === req.original_match_id);
    if (!originalMatch) return;

    // Create the approved REMATCH (Requirement 6)
    const newRematchId = 'm_rematch_' + Date.now();
    const newRematch: Match = {
      id: newRematchId,
      division: originalMatch.division,
      stage: originalMatch.stage,
      court: 'Court 1 (Centre)',
      scheduledTime: new Date(Date.now() + 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimatedDurationMin: 50,
      status: 'scheduled',
      type: 'REMATCH',
      player1Id: req.player1_id,
      player2Id: req.player2_id,
      scores: [],
      notes: '★ Friendly Rematch approved by Admin',
      lastUpdated: 'Rematch approved'
    };

    setMatches(prev => [newRematch, ...prev]);
    setRematchRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? { ...r, admin_status: 'APPROVED', admin_reviewed_at: new Date().toISOString() }
          : r
      )
    );
  };

  const adminDeclineRematch = (requestId: string) => {
    triggerHaptic('medium');
    setRematchRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? { ...r, admin_status: 'DECLINED', admin_reviewed_at: new Date().toISOString() }
          : r
      )
    );
  };

  const getRematchStatusForMatch = (originalMatchId: string) => {
    return rematchRequests.find(r => r.original_match_id === originalMatchId);
  };

  // Find Opponents for player (Requirement 4)
  const getUnplayedOpponentsForPlayer = (playerId: string) => {
    const otherPlayers = players.filter(p => p.id !== playerId);

    return otherPlayers
      .map(other => {
        // Find if there is an existing match between these two
        const existingMatch = matches.find(
          m =>
            ((m.player1Id === playerId && m.player2Id === other.id) ||
              (m.player1Id === other.id && m.player2Id === playerId)) &&
            m.type === 'OFFICIAL'
        );

        if (existingMatch && existingMatch.status === 'completed') {
          // Already completed official match -> hide from Unplayed
          return null;
        }

        let status: 'not_scheduled' | 'scheduled' | 'awaiting_confirmation' | 'live' = 'not_scheduled';
        if (existingMatch) {
          if (existingMatch.status === 'live') status = 'live';
          else if (existingMatch.status === 'awaiting_confirmation') status = 'awaiting_confirmation';
          else if (existingMatch.status === 'scheduled' || existingMatch.status === 'warmup') status = 'scheduled';
        }

        return {
          player: other,
          status,
          existingMatch
        };
      })
      .filter(Boolean) as {
        player: Player;
        status: 'not_scheduled' | 'scheduled' | 'awaiting_confirmation' | 'live';
        existingMatch?: Match;
      }[];
  };

  const registerPlayer = (playerData: Omit<Player, 'id' | 'stats'>): Player => {
    triggerHaptic('success');
    const newId = 'p_' + Date.now();
    const newPlayer: Player = {
      ...playerData,
      id: newId,
      stats: {
        played: 0,
        won: 0,
        lost: 0,
        pointsScored: 0,
        pointsConceded: 0,
        pointDiff: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        points: 0
      }
    };
    setPlayers(prev => [...prev, newPlayer]);
    setCurrentPlayerId(newId);
    return newPlayer;
  };

  const updatePlayerProfile = (playerId: string, updates: Partial<Player>) => {
    triggerHaptic('success');
    setPlayers(prev =>
      prev.map(p => {
        if (p.id !== playerId) return p;
        return {
          ...p,
          ...updates,
          stats: p.stats
        };
      })
    );
  };

  const addAnnouncement = (annData: Omit<Announcement, 'id' | 'time'>) => {
    const newAnn: Announcement = {
      ...annData,
      id: 'a_' + Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAnnouncements(prev => [newAnn, ...prev]);
  };

  const resetTournamentData = () => {
    triggerHaptic('heavy');
    setPlayers(INITIAL_PLAYERS);
    setMatches(INITIAL_MATCHES);
    setRematchRequests(INITIAL_REMATCH_REQUESTS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    localStorage.removeItem(STORAGE_KEYS.PLAYERS);
    localStorage.removeItem(STORAGE_KEYS.MATCHES);
    localStorage.removeItem(STORAGE_KEYS.REMATCH_REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.ANNOUNCEMENTS);
  };

  // Tournament Progress calculation
  // Real-time calculation from active completed official tournament matches
  const completedTournamentMatches = matches.filter(
    m => m.type === 'OFFICIAL' && m.status === 'completed'
  ).length;

  const tournamentProgressPercentage = TOTAL_TOURNAMENT_MATCHES > 0
    ? Math.round((completedTournamentMatches / TOTAL_TOURNAMENT_MATCHES) * 100)
    : 0;

  const currentPlayer = players.find(p => p.id === currentPlayerId) || null;

  return (
    <TournamentContext.Provider
      value={{
        players,
        matches,
        rematchRequests,
        announcements,
        currentPlayerId,
        currentPlayer,
        activeDivision,
        isOffline,
        isAdminMode,
        selectedPlayerForProfile,
        totalTournamentMatches: TOTAL_TOURNAMENT_MATCHES,
        completedTournamentMatches,
        tournamentProgressPercentage,
        setCurrentPlayerId,
        setActiveDivision,
        setIsAdminMode,
        setSelectedPlayerForProfile,
        triggerCelebration,
        triggerHaptic,
        updateMatchScore,
        pointWon,
        changeServer,
        setMatchStatus,
        addNewMatch,
        scheduleMatchWithOpponent,
        getMatchLockStatus,
        adminCorrectMatch,
        adminResolveDispute,
        requestRematch,
        declineRematch,
        adminApproveRematch,
        adminDeclineRematch,
        getRematchStatusForMatch,
        getUnplayedOpponentsForPlayer,
        registerPlayer,
        updatePlayerProfile,
        addAnnouncement,
        resetTournamentData
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
