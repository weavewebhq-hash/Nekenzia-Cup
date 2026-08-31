export type Division = 'mixed_division';

export type MatchStage = 'Round Robin' | 'Group A' | 'Group B' | 'Group C' | 'Quarterfinal' | 'Semifinal' | 'Bronze Match' | 'Final';

export type MatchStatus = 'not_scheduled' | 'scheduled' | 'warmup' | 'live' | 'awaiting_confirmation' | 'completed' | 'walkover';

export type Company = 'Nexia Mongolia' | 'McKenzie';

export type MatchType = 'OFFICIAL' | 'REMATCH';

export interface Player {
  id: string;
  name: string;
  company: Company;
  department?: string;
  role?: string;
  avatar: string;
  avatarColor: string;
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
  seed?: number;
  division: Division;
  partnerName?: string;
  stats: {
    played: number;
    won: number; // Wins (1 point per win)
    lost: number; // Losses (0 points)
    pointsScored: number; // Points For (PF)
    pointsConceded: number; // Points Against (PA)
    pointDiff: number; // +/- Point Differential (PF - PA)
    setsWon: number;
    setsLost: number;
    gamesWon: number;
    gamesLost: number;
    points: number; // Tournament Points (= wins: 1 for win, 0 for loss)
  };
}

export interface SetScore {
  player1: number;
  player2: number;
  tiebreak?: {
    player1: number;
    player2: number;
  };
}

export interface LiveGameScore {
  player1Points: string; // '0', '15', '30', '40', 'AD'
  player2Points: string;
  server: 'player1' | 'player2';
  currentSet: number;
}

export type CourtName = 'Main Court (Court 1)' | 'Court 1 (Centre)';

export interface Match {
  id: string;
  division: Division;
  stage: MatchStage;
  court: CourtName;
  scheduledTime: string;
  estimatedDurationMin: number;
  status: MatchStatus;
  type: MatchType;
  player1Id: string;
  player2Id: string;
  scores: SetScore[];
  liveGame?: LiveGameScore;
  winnerId?: string;
  notes?: string;
  umpire?: string;
  lastUpdated?: string;
  
  // Requirement 9 fields
  scheduled_at?: string;
  result_submitted_at?: string; // ISO string
  result_submitted_by?: string; // player id
  confirmed_at?: string; // ISO string
  locked_at?: string; // ISO string
  isDisputed?: boolean;
}

export interface RematchRequest {
  id: string;
  original_match_id: string;
  player1_id: string;
  player2_id: string;
  player1_requested: boolean;
  player2_requested: boolean;
  player1_requested_at?: string;
  player2_requested_at?: string;
  admin_status: 'PENDING' | 'APPROVED' | 'DECLINED';
  admin_reviewed_at?: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  time: string;
  category: 'urgent' | 'schedule' | 'food' | 'ceremony' | 'weather' | 'general';
  pinned?: boolean;
}

export interface CourtDetail {
  id: string;
  name: string;
  surface: string;
  isCovered: boolean;
  currentMatchId?: string;
  nextMatchId?: string;
}

export interface ScheduleEvent {
  id: string;
  time: string;
  title: string;
  location: string;
  description: string;
  iconName: string;
  isCompleted?: boolean;
  isCurrent?: boolean;
}
