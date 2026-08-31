import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { useTournament } from '../context/TournamentContext';
import { Player, Division, Company } from '../types';
import {
  Search,
  UserCheck,
  UserPlus,
  X,
  Check,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { getCompanyTheme } from '../utils/companyStyles';

interface PlayerSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerSelectorModal: React.FC<PlayerSelectorModalProps> = ({ isOpen, onClose }) => {
  const {
    players,
    currentPlayer,
    setCurrentPlayerId,
    registerPlayer,
    triggerHaptic,
    triggerCelebration
  } = useTournament();

  const [step, setStep] = useState<'roster' | 'register'>('roster');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');

  // New player registration state
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState<Company>('Nexia Mongolia');
  const [newDivision] = useState<Division>('mixed_division');
  const [formError, setFormError] = useState<string | null>(null);

  // Reset or initialize step when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('roster');
      setFormError(null);
      setSearchQuery('');
    }
  }, [isOpen]);

  const nexiaCount = useMemo(() => players.filter(p => p.company === 'Nexia Mongolia').length, [players]);
  const mckenzieCount = useMemo(() => players.filter(p => p.company === 'McKenzie').length, [players]);

  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCompany = selectedCompany === 'ALL' || p.company === selectedCompany;
      return matchesSearch && matchesCompany;
    });
  }, [players, searchQuery, selectedCompany]);

  if (!isOpen) return null;

  // Direct 1-tap player selection
  const handleSelectPlayer = (player: Player) => {
    triggerHaptic('success');
    setCurrentPlayerId(player.id);
    triggerCelebration();
    onClose();
  };

  // Submit brand new player registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError('Please enter your full name.');
      triggerHaptic('heavy');
      return;
    }

    const parts = newName.trim().split('.');
    const avatar = parts.length > 1
      ? (parts[0] + parts[1].substring(0, 1)).toUpperCase()
      : newName.trim().substring(0, 2).toUpperCase();

    const created = registerPlayer({
      name: newName.trim(),
      company: newCompany,
      avatar: avatar || 'PL',
      avatarColor: newCompany === 'Nexia Mongolia' ? 'from-emerald-500 to-teal-700' : 'from-indigo-500 to-blue-700',
      division: newDivision
    });

    setCurrentPlayerId(created.id);
    triggerCelebration();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#000000]/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop (dismissible only if user already has a claimed profile) */}
      <div
        className="absolute inset-0"
        onClick={() => {
          if (currentPlayer) onClose();
        }}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="relative w-full max-w-lg bg-[#ffffff] dark:bg-[#141a24] rounded-t-2xl sm:rounded-2xl border border-[#e5e5e5] dark:border-[#263244] shadow-2xl p-5 sm:p-6 text-[#000000] dark:text-[#f8fafc] max-h-[90vh] flex flex-col z-10 pb-safe space-y-3 transition-colors duration-200"
      >
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-[#e5e5e5] dark:bg-[#263244] rounded-full mx-auto mb-2 sm:hidden" />

        {/* STEP 1: ROSTER SELECTION */}
        {step === 'roster' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-[#5f79ff] dark:text-[#7b8eff]" />
                </div>
                <div>
                  <h3 className="text-base font-light font-display-serif text-[#000000] dark:text-[#f8fafc]">
                    {currentPlayer ? 'Switch Player' : 'Select Your Name'}
                  </h3>
                  <p className="text-xs text-[#707070] dark:text-[#94a3b8]">
                    {currentPlayer
                      ? 'Tap your name to switch active player'
                      : 'Tap your name to enter the tournament'}
                  </p>
                </div>
              </div>
              {currentPlayer && (
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                  }}
                  className="w-7 h-7 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] text-[#707070] dark:text-[#94a3b8] hover:text-[#000000] dark:hover:text-[#f8fafc] flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Current Active Player Bar */}
            {currentPlayer && (
              <div className="p-3 rounded-xl bg-[#fafafa] dark:bg-[#1a2230] border border-[#ebebeb] dark:border-[#263244] flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-[#141a24] border border-[#e5e5e5] dark:border-[#263244] text-[#000000] dark:text-[#f8fafc] font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
                    {currentPlayer.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#000000] dark:text-[#f8fafc] text-xs truncate">{currentPlayer.name}</span>
                      <span className="px-2 py-0.2 rounded-full text-[8px] bg-[#5f79ff] dark:bg-[#6378ff] text-white font-semibold flex-shrink-0">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-[#707070] dark:text-[#94a3b8] truncate">
                      {currentPlayer.company}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#5f79ff] dark:text-[#7b8eff]">
                  {currentPlayer.stats.points} pts
                </span>
              </div>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col flex-1 min-h-0 space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#a6a6a6] dark:text-[#64748b]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search player name..."
                  className="w-full pl-9 pr-3 py-2 bg-[#ffffff] dark:bg-[#1a2230] border border-[#e5e5e5] dark:border-[#263244] rounded-xl text-[#000000] dark:text-[#f8fafc] placeholder-[#a6a6a6] dark:placeholder-[#64748b] text-xs focus:outline-none focus:border-[#5f79ff] dark:focus:border-[#7b8eff]"
                />
              </div>

              {/* Company Tabs */}
              <div className="flex bg-[#f5f5f5] dark:bg-[#1a2230] p-1 rounded-full border border-[#e5e5e5] dark:border-[#263244] gap-1">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedCompany('ALL');
                  }}
                  className={`flex-1 py-1 text-xs font-semibold rounded-full transition ${
                    selectedCompany === 'ALL'
                      ? 'bg-[#5f79ff] dark:bg-[#6378ff] text-white shadow-sm'
                      : 'text-[#707070] dark:text-[#94a3b8] hover:text-[#000000] dark:hover:text-[#f8fafc]'
                  }`}
                >
                  All ({players.length})
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedCompany('Nexia Mongolia');
                  }}
                  className={`flex-1 py-1 text-xs font-semibold rounded-full transition ${
                    selectedCompany === 'Nexia Mongolia'
                      ? 'bg-[#5f79ff] dark:bg-[#6378ff] text-white shadow-sm'
                      : 'text-[#707070] dark:text-[#94a3b8] hover:text-[#000000] dark:hover:text-[#f8fafc]'
                  }`}
                >
                  Nexia ({nexiaCount})
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedCompany('McKenzie');
                  }}
                  className={`flex-1 py-1 text-xs font-semibold rounded-full transition ${
                    selectedCompany === 'McKenzie'
                      ? 'bg-[#5f79ff] dark:bg-[#6378ff] text-white shadow-sm'
                      : 'text-[#707070] dark:text-[#94a3b8] hover:text-[#000000] dark:hover:text-[#f8fafc]'
                  }`}
                >
                  McKenzie ({mckenzieCount})
                </button>
              </div>

              {/* Roster List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 min-h-[220px] max-h-[360px]">
                {filteredPlayers.length === 0 ? (
                  <div className="text-center py-8 text-[#707070] dark:text-[#94a3b8] text-xs space-y-2">
                    <p>No player found matching "{searchQuery}"</p>
                    <button
                      type="button"
                      onClick={() => {
                        setNewName(searchQuery);
                        setStep('register');
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#5f79ff] text-white font-medium text-xs"
                    >
                      Add Player
                    </button>
                  </div>
                ) : (
                  filteredPlayers.map(player => {
                    const isCurrent = currentPlayer?.id === player.id;
                    const theme = getCompanyTheme(player.company);
                    return (
                      <motion.button
                        key={player.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectPlayer(player)}
                        className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition border ${
                          isCurrent
                            ? 'bg-[#eef2ff] dark:bg-[#312e81]/30 border-[#c7d2fe] dark:border-[#6366f1]/40'
                            : 'bg-[#fafafa] dark:bg-[#1a2230] hover:bg-[#f5f5f5] dark:hover:bg-[#1e293b] border-[#ebebeb] dark:border-[#263244]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-white dark:bg-[#141a24] border border-[#e5e5e5] dark:border-[#263244] text-[#000000] dark:text-[#f8fafc] font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
                            {player.avatar}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-[#000000] dark:text-[#f8fafc] text-xs truncate">
                                {player.name}
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded-full text-[8px] font-semibold flex-shrink-0 ${theme.badgeBg} ${theme.badgeText}`}
                              >
                                {theme.shortName}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#707070] dark:text-[#94a3b8] truncate">
                              {player.company}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right font-mono">
                            <span className="text-[10px] font-semibold text-[#000000] dark:text-[#f8fafc] block">
                              {player.stats.won}W - {player.stats.lost}L
                            </span>
                            <p className="text-[9px] text-[#5f79ff] dark:text-[#7b8eff]">
                              {player.stats.points} pts
                            </p>
                          </div>
                          {isCurrent ? (
                            <div className="w-5 h-5 rounded-full bg-[#059669] text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-[#f5f5f5] dark:bg-[#1e293b] flex items-center justify-center text-[#707070] dark:text-[#94a3b8]">
                              <Check className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                            </div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-[#ebebeb] dark:border-[#263244] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setStep('register');
                  }}
                  className="w-full py-2.5 px-4 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] hover:bg-[#ebebeb] dark:hover:bg-[#263244] text-[#000000] dark:text-[#f8fafc] text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-[#e5e5e5] dark:border-[#263244]"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#5f79ff] dark:text-[#7b8eff]" />
                  <span>Add Player</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* STEP 2: REGISTER NEW PLAYER */}
        {step === 'register' && (
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setStep('roster');
                  }}
                  className="w-8 h-8 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] flex items-center justify-center text-[#707070] dark:text-[#94a3b8] hover:text-[#000000] dark:hover:text-[#f8fafc] transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-base font-light font-display-serif text-[#000000] dark:text-[#f8fafc]">
                    Add New Player
                  </h3>
                  <p className="text-xs text-[#707070] dark:text-[#94a3b8]">
                    Enter player name & company
                  </p>
                </div>
              </div>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-[#ffe4e6] dark:bg-[#e11d48]/20 border border-[#fecdd3] dark:border-[#e11d48]/30 text-[#e11d48] dark:text-[#fb7185] text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#4d4d4d] dark:text-[#cbd5e1] mb-1">
                  Full Name (Монгол нэр) *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Т.Болд"
                  className="w-full px-3 py-2 bg-[#ffffff] dark:bg-[#1a2230] border border-[#e5e5e5] dark:border-[#263244] rounded-xl text-[#000000] dark:text-[#f8fafc] placeholder-[#a6a6a6] dark:placeholder-[#64748b] text-xs focus:outline-none focus:border-[#5f79ff] dark:focus:border-[#7b8eff]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4d4d4d] dark:text-[#cbd5e1] mb-1">
                  Company *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCompany('Nexia Mongolia')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                      newCompany === 'Nexia Mongolia'
                        ? 'bg-[#e6fcf3] dark:bg-[#064e3b]/40 border-[#059669] text-[#059669] dark:text-[#34d399]'
                        : 'bg-[#fafafa] dark:bg-[#1a2230] border-[#e5e5e5] dark:border-[#263244] text-[#707070] dark:text-[#94a3b8]'
                    }`}
                  >
                    Nexia Mongolia
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCompany('McKenzie')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                      newCompany === 'McKenzie'
                        ? 'bg-[#eef2ff] dark:bg-[#312e81]/40 border-[#5f79ff] text-[#5f79ff] dark:text-[#7b8eff]'
                        : 'bg-[#fafafa] dark:bg-[#1a2230] border-[#e5e5e5] dark:border-[#263244] text-[#707070] dark:text-[#94a3b8]'
                    }`}
                  >
                    McKenzie
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('roster')}
                  className="py-2.5 px-4 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] text-[#4d4d4d] dark:text-[#cbd5e1] font-medium text-xs hover:bg-[#ebebeb] dark:hover:bg-[#263244]"
                >
                  Back
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#5f79ff] dark:bg-[#6378ff] hover:bg-[#4d69f0] dark:hover:bg-[#7b8eff] text-white font-medium text-xs shadow-md flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>Join Tournament</span>
                </motion.button>
              </div>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};
