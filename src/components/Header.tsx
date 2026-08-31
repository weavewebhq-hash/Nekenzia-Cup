import React from 'react';
import { useTournament } from '../context/TournamentContext';
import { useTheme } from '../context/ThemeContext';
import { Trophy, User, WifiOff, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onOpenPlayerModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenPlayerModal }) => {
  const {
    currentPlayer,
    setSelectedPlayerForProfile,
    isOffline,
    triggerHaptic
  } = useTournament();

  const { theme, toggleTheme, isDark } = useTheme();

  const handleThemeToggle = () => {
    triggerHaptic('light');
    toggleTheme();
  };

  return (
    <header className="sticky top-0 z-30 bg-[#ffffff]/95 dark:bg-[#0a0d14]/95 backdrop-blur-md border-b border-[#e5e5e5] dark:border-[#263244] pt-safe transition-colors duration-200">
      {/* Offline Alert Strip if network drops */}
      {isOffline && (
        <div className="bg-[#fffbeb] dark:bg-[#78350f]/30 text-[#92400e] dark:text-[#fde68a] text-xs font-semibold px-3 py-1 flex items-center justify-center gap-1.5 border-b border-[#fde68a] dark:border-[#78350f]">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode Active • Saved locally on your device</span>
        </div>
      )}

      {/* Main Top Bar */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 max-w-lg mx-auto">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#5f79ff] dark:bg-[#6378ff] text-white flex items-center justify-center shadow-sm flex-shrink-0">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-[#707070] dark:text-[#94a3b8] uppercase tracking-wider block leading-none">
              Nexia & McKenzie
            </span>
            <h1 className="text-base font-light tracking-tight text-[#000000] dark:text-[#f8fafc] font-display-serif mt-0.5 leading-tight">
              Nekenzie Cup 2026
            </h1>
          </div>
        </div>

        {/* Right Action Icons: Theme Toggle & Player Profile Button */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            id="theme-toggle-btn"
            onClick={handleThemeToggle}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-8 h-8 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] hover:bg-[#ebebeb] dark:hover:bg-[#263244] border border-[#e5e5e5] dark:border-[#263244] text-[#707070] dark:text-[#94a3b8] hover:text-[#000000] dark:hover:text-[#f8fafc] flex items-center justify-center transition-all duration-200 active:scale-90 shadow-sm"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[#fbbf24] animate-in spin-in-45 duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-[#5f79ff] animate-in spin-in-45 duration-200" />
            )}
          </button>

          {/* Current Player Profile Button */}
          <button
            id="header-player-btn"
            onClick={() => {
              triggerHaptic('light');
              if (currentPlayer) {
                setSelectedPlayerForProfile(currentPlayer);
              } else {
                onOpenPlayerModal();
              }
            }}
            className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-[#f5f5f5] dark:bg-[#141a24] hover:bg-[#ebebeb] dark:hover:bg-[#1a2230] border border-[#e5e5e5] dark:border-[#263244] text-[#000000] dark:text-[#f8fafc] text-xs font-medium transition active:scale-95 shadow-sm"
          >
            {currentPlayer ? (
              <>
                <div
                  className={`w-6 h-6 rounded-full ${currentPlayer.avatarColor || 'bg-[#5f79ff] text-white'} flex items-center justify-center font-bold text-[9px] shadow-sm`}
                >
                  {currentPlayer.avatar}
                </div>
                <div className="text-left leading-tight">
                  <span className="block max-w-[80px] truncate font-semibold text-[#000000] dark:text-[#f8fafc] text-xs">
                    {currentPlayer.name.split(' ')[0]}
                  </span>
                  <span className="block text-[9px] text-[#5f79ff] dark:text-[#7b8eff] font-mono font-semibold">
                    {currentPlayer.stats.won}W-{currentPlayer.stats.lost}L
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-full bg-[#eef2ff] dark:bg-[#312e81]/40 text-[#5f79ff] dark:text-[#7b8eff] flex items-center justify-center border border-[#d9defc] dark:border-[#6366f1]/40">
                  <User className="w-3 h-3" />
                </div>
                <span className="text-[#4d4d4d] dark:text-[#cbd5e1] text-xs font-medium">Select Player</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
