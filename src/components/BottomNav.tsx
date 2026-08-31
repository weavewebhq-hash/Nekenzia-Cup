import React from 'react';
import { useTournament } from '../context/TournamentContext';
import { Home, Trophy, BarChart3, Gamepad2 } from 'lucide-react';

export type NavTab = 'home' | 'fixtures' | 'standings' | 'play';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { triggerHaptic } = useTournament();

  const navItems = [
    {
      id: 'home' as NavTab,
      label: 'Home',
      icon: Home
    },
    {
      id: 'fixtures' as NavTab,
      label: 'Fixtures',
      icon: Trophy
    },
    {
      id: 'standings' as NavTab,
      label: 'Standings',
      icon: BarChart3
    },
    {
      id: 'play' as NavTab,
      label: '3D Play',
      icon: Gamepad2
    }
  ];

  return (
    <nav className="fixed bottom-3 left-0 right-0 z-40 px-2.5 sm:px-4 pointer-events-none pb-safe">
      <div className="max-w-md mx-auto bg-[#ffffff]/95 dark:bg-[#141a24]/95 backdrop-blur-md border border-[#e5e5e5] dark:border-[#263244] rounded-full p-1 sm:p-1.5 flex items-center justify-between gap-0.5 sm:gap-1 shadow-lg nav-floating-shadow pointer-events-auto transition-colors duration-200">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => {
                triggerHaptic('light');
                onTabChange(item.id);
              }}
              className={`flex-1 min-w-0 relative flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-1.5 px-2 sm:px-3 rounded-full transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'bg-[#5f79ff] dark:bg-[#6378ff] text-white shadow-xs'
                  : 'text-[#707070] dark:text-[#94a3b8] hover:text-[#000000] dark:hover:text-[#f8fafc] hover:bg-[#f5f5f5] dark:hover:bg-[#1a2230]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#707070] dark:text-[#94a3b8]'}`} />

              {/* Label */}
              <span className={`text-[11px] sm:text-xs font-semibold whitespace-nowrap truncate ${isActive ? 'text-white' : 'text-[#4d4d4d] dark:text-[#cbd5e1]'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
