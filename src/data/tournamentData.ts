import { Player, Match, Announcement, CourtDetail, ScheduleEvent, RematchRequest } from '../types';

export const TOTAL_TOURNAMENT_MATCHES = 1081; // 47 * 46 / 2
export const COMPLETED_MATCHES_BASELINE = 0;

const DEFAULT_ZERO_STATS = {
  played: 0,
  won: 0,
  lost: 0,
  setsWon: 0,
  setsLost: 0,
  gamesWon: 0,
  gamesLost: 0,
  pointsScored: 0,
  pointsConceded: 0,
  pointDiff: 0,
  points: 0
};

// Official 47 Employees: Nexia Mongolia (30) & McKenzie (17)
const NEXIA_NAMES: string[] = [
  'Э.Булган',
  'Н.Ууганбаяр',
  'Э.Батсайхан',
  'Э.Бат-Оргил',
  'Б.Нандинчулуун',
  'Н.Хүсэлсайхан',
  'Б.Эрдэнэ',
  'Б.Булгантамир',
  'М.Нүрзэдгарам',
  'Т.Амина',
  'Б.Болдбаатар',
  'Б.Батцэцэг',
  'С.Энхжин',
  'О.Бумдарь',
  'З.Батзаяа',
  'Э.Халиунаа',
  'Ц.Эрхэмбаяр',
  'Б.Сумъяа',
  'Б.Номинзул',
  'Д.Дэлгэрмаа',
  'Б.Бадрахгэрэл',
  'О.Бадамгарав',
  'Т.Сарантуяа',
  'Ц.Юмжирдулам',
  'М.Пүрэвбат',
  'Э.Баярмаа',
  'С.Дуламсүрэн',
  'М.Мөнхцэцэг',
  'Г.Цолмон',
  'М.Мөнх-Эрдэнэ'
];

const MCKENZIE_NAMES: string[] = [
  'М.Энхмэнд',
  'Д.Ууганбаяр',
  'Д.Баярсайхан',
  'Ц.Буяннэмэх',
  'А.Мөнхжингуа',
  'Б.Баярмаа',
  'Ж.Пүрэвжав',
  'З.Пүрэвсүрэн',
  'М.Индра',
  'Б.Бямбажаргал',
  'М.Чулуунбат',
  'Н.Ану',
  'Б.Эрдэнэтуяа',
  'Э.Рэгзэндорж',
  'Г.Отгондаваа',
  'О.Бямбаноров',
  'Ч.Чингүнжав'
];

function getInitials(name: string): string {
  const parts = name.split('.');
  if (parts.length > 1) {
    return (parts[0] + parts[1].substring(0, 1)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

const RAW_PLAYERS: Omit<Player, 'stats'>[] = [
  ...NEXIA_NAMES.map((name, index) => ({
    id: `nex_${index + 1}`,
    name,
    company: 'Nexia Mongolia' as const,
    avatar: getInitials(name),
    avatarColor: 'from-emerald-500 to-teal-700',
    division: 'mixed_division' as const,
    seed: index === 0 ? 1 : undefined
  })),
  ...MCKENZIE_NAMES.map((name, index) => ({
    id: `mck_${index + 1}`,
    name,
    company: 'McKenzie' as const,
    avatar: getInitials(name),
    avatarColor: 'from-indigo-500 to-blue-700',
    division: 'mixed_division' as const,
    seed: index === 0 ? 2 : undefined
  }))
];

export const INITIAL_PLAYERS: Player[] = RAW_PLAYERS.map(p => ({
  ...p,
  stats: { ...DEFAULT_ZERO_STATS }
}));

export const INITIAL_MATCHES: Match[] = [];

export const INITIAL_REMATCH_REQUESTS: RematchRequest[] = [];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1',
    title: '🏓 Nexia Mongolia × McKenzie Ping Pong Cup',
    content: 'Welcome all 47 players! Nexia Mongolia (30 players) vs McKenzie (17 players) competing in single-game round-robin matches (Target: First to 12 points).',
    time: '09:00',
    category: 'general',
    pinned: true
  },
  {
    id: 'a2',
    title: '⏱️ 6-Hour Score Editing & Result Lock Policy',
    content: 'Scores can be adjusted by players within 6 hours of submission. After 6 hours, results are locked. Contact tournament committee for disputes.',
    time: '09:00',
    category: 'schedule',
    pinned: true
  }
];

export const COURTS_DATA: CourtDetail[] = [
  {
    id: 'c1',
    name: 'Table 1 (Centre Arena)',
    surface: 'ITTF Championship Table (Matte Blue)',
    isCovered: true
  }
];

export const SCHEDULE_EVENTS: ScheduleEvent[] = [
  {
    id: 's1',
    time: '08:30',
    title: 'Player Welcome & Check-in',
    location: 'Tournament Arena',
    description: '47 players check-in & tournament racket check',
    iconName: 'Coffee',
    isCompleted: false
  },
  {
    id: 's2',
    time: '09:15',
    title: 'Opening Ceremony',
    location: 'Table 1 (Centre Arena)',
    description: 'Nexia Mongolia & McKenzie joint table tennis kickoff',
    iconName: 'Activity',
    isCompleted: false
  },
  {
    id: 's3',
    time: '10:00',
    title: 'Round Robin Matches',
    location: 'Table 1 (Centre Arena)',
    description: 'Official tournament fixtures underway on Table 1',
    iconName: 'PlayCircle',
    isCompleted: false
  },
  {
    id: 's4',
    time: '13:00',
    title: 'Company Garden BBQ',
    location: 'Terrace Pavilion',
    description: 'Complimentary buffet & refreshments for all players',
    iconName: 'Utensils',
    isCompleted: false
  },
  {
    id: 's5',
    time: '18:00',
    title: 'Final Standings & Awards Ceremony',
    location: 'Table 1 (Centre Arena)',
    description: 'Trophy presentation for Top Nexia, Top McKenzie & Overall Champions',
    iconName: 'Trophy',
    isCompleted: false
  }
];
