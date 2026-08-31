import React, { useState, useMemo } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { Match, Player } from '../../types';
import {
  Plus,
  Clock,
  X,
  Search,
  CheckCircle2,
  ChevronRight,
  QrCode
} from 'lucide-react';
import { getCompanyTheme } from '../../utils/companyStyles';
import { MatchQRModal } from '../MatchQRModal';

interface FixturesViewProps {
  onSelectMatchForScore: (match: Match) => void;
}

export const FixturesView: React.FC<FixturesViewProps> = ({ onSelectMatchForScore }) => {
  const {
    matches,
    players,
    activeDivision,
    addNewMatch,
    setSelectedPlayerForProfile,
    triggerHaptic
  } = useTournament();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'COMPLETED' | 'REMATCH'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false);
  const [selectedMatchForQR, setSelectedMatchForQR] = useState<Match | null>(null);

  // New match form state
  const [newP1Id, setNewP1Id] = useState('');
  const [newP2Id, setNewP2Id] = useState('');
  const [newTime, setNewTime] = useState('16:00');

  const getPlayer = (id: string): Player | undefined => players.find(p => p.id === id);

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      let matchesFilter = true;
      if (statusFilter === 'SCHEDULED') {
        matchesFilter = m.status === 'scheduled' || m.status === 'live' || m.status === 'warmup';
      } else if (statusFilter === 'COMPLETED') {
        matchesFilter = m.status === 'completed' || m.status === 'walkover';
      } else if (statusFilter === 'REMATCH') {
        matchesFilter = m.type === 'REMATCH';
      }

      const p1 = getPlayer(m.player1Id);
      const p2 = getPlayer(m.player2Id);

      const matchesSearch = searchQuery
        ? (p1?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p2?.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      return matchesFilter && matchesSearch;
    });
  }, [matches, statusFilter, searchQuery]);

  const handleCreateMatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newP1Id || !newP2Id || newP1Id === newP2Id) return;

    addNewMatch({
      division: activeDivision,
      stage: 'Match',
      court: 'Main Court (Court 1)',
      scheduledTime: newTime,
      estimatedDurationMin: 45,
      status: 'scheduled',
      type: 'OFFICIAL',
      player1Id: newP1Id,
      player2Id: newP2Id,
      scores: []
    });

    setIsAddMatchOpen(false);
  };

  return (
    <div className="space-y-4 pb-24 max-w-lg mx-auto px-4 pt-4 transition-colors duration-200">
      {/* 1. Header with Add Match */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-semibold text-[#5f79ff] dark:text-[#7b8eff] uppercase tracking-wider block">
            Schedule & Results
          </span>
          <h3 className="text-xl font-light font-display-serif text-[#000000] dark:text-[#f8fafc]">
            Fixtures
          </h3>
          <p className="text-[11px] text-[#707070] dark:text-[#94a3b8]">
            {matches.length} total matches • {players.length} players
          </p>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            if (players.length >= 2) {
              setNewP1Id(players[0].id);
              setNewP2Id(players[1].id);
            }
            setIsAddMatchOpen(true);
          }}
          className="px-4 py-2 bg-[#5f79ff] dark:bg-[#6378ff] hover:bg-[#4d69f0] dark:hover:bg-[#7b8eff] text-white font-medium rounded-full text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>Add Match</span>
        </button>
      </div>

      {/* 2. Status Filter Tabs & Search */}
      <div className="space-y-2">
        <div className="flex bg-[#f5f5f5] dark:bg-[#1a2230] p-1 rounded-full border border-[#e5e5e5] dark:border-[#263244] gap-1">
          {(
            [
              { id: 'ALL', label: 'All' },
              { id: 'SCHEDULED', label: 'To Play' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'REMATCH', label: 'Rematches' }
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                setStatusFilter(tab.id);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition ${
                statusFilter === tab.id
                  ? 'bg-[#5f79ff] dark:bg-[#6378ff] text-white shadow-sm'
                  : 'text-[#707070] dark:text-[#94a3b8] hover:text-[#000000] dark:hover:text-[#f8fafc]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a6a6a6] dark:text-[#64748b]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search match by player name..."
            className="w-full bg-[#ffffff] dark:bg-[#141a24] border border-[#e5e5e5] dark:border-[#263244] rounded-xl py-2 pl-10 pr-4 text-xs text-[#000000] dark:text-[#f8fafc] placeholder-[#a6a6a6] dark:placeholder-[#64748b] focus:outline-none focus:border-[#5f79ff] dark:focus:border-[#7b8eff] transition"
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
      </div>

      {/* 3. Match List Cards */}
      <div className="space-y-3">
        {filteredMatches.length === 0 ? (
          <div className="text-center py-10 bg-[#ffffff] dark:bg-[#141a24] rounded-2xl border border-[#e5e5e5] dark:border-[#263244] text-[#707070] dark:text-[#94a3b8] text-xs">
            <p>No matches found matching your filter.</p>
          </div>
        ) : (
          filteredMatches.map(match => {
            const p1 = getPlayer(match.player1Id);
            const p2 = getPlayer(match.player2Id);
            const p1Won = match.winnerId === match.player1Id;
            const p2Won = match.winnerId === match.player2Id;
            const p1Theme = getCompanyTheme(p1?.company);
            const p2Theme = getCompanyTheme(p2?.company);

            return (
              <div
                key={match.id}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectMatchForScore(match);
                }}
                className="bg-[#ffffff] dark:bg-[#141a24] hover:border-[#5f79ff] dark:hover:border-[#7b8eff] rounded-2xl p-4 border border-[#e5e5e5] dark:border-[#263244] cursor-pointer transition active:scale-[0.99] space-y-3 shadow-sm"
              >
                {/* Card Top Metadata */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[#707070] dark:text-[#94a3b8] font-mono text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#5f79ff] dark:text-[#7b8eff]" />
                      <span>{match.scheduledTime}</span>
                    </span>
                    {match.type === 'REMATCH' && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-[#eef2ff] dark:bg-[#312e81]/40 text-[#5f79ff] dark:text-[#7b8eff] border border-[#c7d2fe] dark:border-[#6366f1]/40">
                        REMATCH
                      </span>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {match.status === 'live' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#ffe4e6] dark:bg-[#e11d48]/20 text-[#e11d48] dark:text-[#fb7185] border border-[#fecdd3] dark:border-[#e11d48]/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#e11d48] dark:bg-[#fb7185] animate-ping" />
                        <span>IN PROGRESS</span>
                      </span>
                    ) : match.status === 'completed' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#e6fcf3] dark:bg-[#064e3b]/30 text-[#059669] dark:text-[#34d399] border border-[#a7f3d0] dark:border-[#059669]/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>FINAL</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#f5f5f5] dark:bg-[#1a2230] text-[#707070] dark:text-[#94a3b8] border border-[#e5e5e5] dark:border-[#263244]">
                        SCHEDULED
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Players & Scores Grid */}
                <div className="space-y-2 bg-[#f9fafb] dark:bg-[#1a2230] p-3 rounded-xl border border-[#ebebeb] dark:border-[#263244]">
                  {/* Player 1 Row */}
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      onClick={e => {
                        e.stopPropagation();
                        if (p1) setSelectedPlayerForProfile(p1);
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-full bg-white dark:bg-[#141a24] border border-[#e5e5e5] dark:border-[#263244] text-[#000000] dark:text-[#f8fafc] font-bold flex items-center justify-center text-[10px] shadow-sm flex-shrink-0"
                      >
                        {p1?.avatar || 'P1'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs truncate ${
                              p1Won ? 'font-bold text-[#059669] dark:text-[#34d399]' : 'font-semibold text-[#000000] dark:text-[#f8fafc]'
                            }`}
                          >
                            {p1?.name || 'Player 1'}
                          </span>
                          {p1Won && (
                            <span className="text-[10px] text-[#059669] dark:text-[#34d399] font-bold font-mono">
                              ✓
                            </span>
                          )}
                          {p1Theme && (
                            <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-semibold ${p1Theme.badgeBg} ${p1Theme.badgeText}`}>
                              {p1Theme.shortName}
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-[#707070] dark:text-[#94a3b8] truncate">
                          {p1?.company}
                        </p>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {match.scores.map((set, idx) => (
                        <span
                          key={idx}
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-xs ${
                            set.player1 > set.player2
                              ? 'bg-[#5f79ff] dark:bg-[#6378ff] text-white shadow-sm'
                              : 'bg-[#e5e5e5] dark:bg-[#263244] text-[#4d4d4d] dark:text-[#cbd5e1]'
                          }`}
                        >
                          {set.player1}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-[1px] bg-[#e5e5e5] dark:bg-[#263244]" />

                  {/* Player 2 Row */}
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      onClick={e => {
                        e.stopPropagation();
                        if (p2) setSelectedPlayerForProfile(p2);
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-full bg-white dark:bg-[#141a24] border border-[#e5e5e5] dark:border-[#263244] text-[#000000] dark:text-[#f8fafc] font-bold flex items-center justify-center text-[10px] shadow-sm flex-shrink-0"
                      >
                        {p2?.avatar || 'P2'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs truncate ${
                              p2Won ? 'font-bold text-[#059669] dark:text-[#34d399]' : 'font-semibold text-[#000000] dark:text-[#f8fafc]'
                            }`}
                          >
                            {p2?.name || 'Player 2'}
                          </span>
                          {p2Won && (
                            <span className="text-[10px] text-[#059669] dark:text-[#34d399] font-bold font-mono">
                              ✓
                            </span>
                          )}
                          {p2Theme && (
                            <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-semibold ${p2Theme.badgeBg} ${p2Theme.badgeText}`}>
                              {p2Theme.shortName}
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-[#707070] dark:text-[#94a3b8] truncate">
                          {p2?.company}
                        </p>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {match.scores.map((set, idx) => (
                        <span
                          key={idx}
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-xs ${
                            set.player2 > set.player1
                              ? 'bg-[#5f79ff] dark:bg-[#6378ff] text-white shadow-sm'
                              : 'bg-[#e5e5e5] dark:bg-[#263244] text-[#4d4d4d] dark:text-[#cbd5e1]'
                          }`}
                        >
                          {set.player2}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Match Card Bottom Note & CTA */}
                <div className="flex items-center justify-between text-[11px] text-[#707070] dark:text-[#94a3b8] pt-1">
                  <span>{match.court} • First to 12 pts</span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        triggerHaptic('light');
                        setSelectedMatchForQR(match);
                      }}
                      className="px-2 py-0.5 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] hover:bg-[#e5e5e5] dark:hover:bg-[#263244] text-[#5f79ff] dark:text-[#7b8eff] border border-[#e5e5e5] dark:border-[#263244] flex items-center gap-1 text-[10px] font-semibold transition"
                      title="Generate Instant Match QR"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>QR Sync</span>
                    </button>

                    <span className="text-[#5f79ff] dark:text-[#7b8eff] font-medium flex items-center gap-0.5 hover:underline">
                      <span>{match.status === 'completed' ? 'View/Edit Score' : 'Record Score'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Instant Match QR Modal */}
      <MatchQRModal
        isOpen={Boolean(selectedMatchForQR)}
        match={selectedMatchForQR}
        onClose={() => setSelectedMatchForQR(null)}
        onOpenScoreForMatch={m => {
          setSelectedMatchForQR(null);
          onSelectMatchForScore(m);
        }}
      />

      {/* 4. Add Match Modal Dialog */}
      {isAddMatchOpen && (
        <div className="fixed inset-0 z-50 bg-[#000000]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#ffffff] dark:bg-[#141a24] rounded-2xl border border-[#e5e5e5] dark:border-[#263244] p-5 max-w-sm w-full space-y-4 shadow-2xl text-[#000000] dark:text-[#f8fafc]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-light font-display-serif text-[#000000] dark:text-[#f8fafc]">
                Schedule New Match
              </h3>
              <button
                onClick={() => setIsAddMatchOpen(false)}
                className="w-7 h-7 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] text-[#707070] dark:text-[#94a3b8] hover:text-[#000000] dark:hover:text-[#f8fafc] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMatchSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#4d4d4d] dark:text-[#cbd5e1] mb-1">
                  Player 1
                </label>
                <select
                  value={newP1Id}
                  onChange={e => setNewP1Id(e.target.value)}
                  className="w-full bg-[#fafafa] dark:bg-[#1a2230] border border-[#e5e5e5] dark:border-[#263244] rounded-xl p-2 text-[#000000] dark:text-[#f8fafc] focus:outline-none focus:border-[#5f79ff] dark:focus:border-[#7b8eff]"
                >
                  {players.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.company})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4d4d4d] dark:text-[#cbd5e1] mb-1">
                  Player 2 (Opponent)
                </label>
                <select
                  value={newP2Id}
                  onChange={e => setNewP2Id(e.target.value)}
                  className="w-full bg-[#fafafa] dark:bg-[#1a2230] border border-[#e5e5e5] dark:border-[#263244] rounded-xl p-2 text-[#000000] dark:text-[#f8fafc] focus:outline-none focus:border-[#5f79ff] dark:focus:border-[#7b8eff]"
                >
                  {players.map(p => (
                    <option key={p.id} value={p.id} disabled={p.id === newP1Id}>
                      {p.name} ({p.company})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4d4d4d] dark:text-[#cbd5e1] mb-1">
                  Match Time
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="w-full bg-[#fafafa] dark:bg-[#1a2230] border border-[#e5e5e5] dark:border-[#263244] rounded-xl p-2 text-[#000000] dark:text-[#f8fafc] focus:outline-none focus:border-[#5f79ff] dark:focus:border-[#7b8eff]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMatchOpen(false)}
                  className="flex-1 py-2.5 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] text-[#4d4d4d] dark:text-[#cbd5e1] font-medium hover:bg-[#ebebeb] dark:hover:bg-[#263244]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newP1Id || !newP2Id || newP1Id === newP2Id}
                  className="flex-1 py-2.5 rounded-full bg-[#5f79ff] dark:bg-[#6378ff] text-white font-medium hover:bg-[#4d69f0] dark:hover:bg-[#7b8eff] disabled:opacity-50"
                >
                  Create Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
