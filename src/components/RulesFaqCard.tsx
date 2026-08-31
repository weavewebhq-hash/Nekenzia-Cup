import React, { useState } from 'react';
import { BookOpen, ChevronDown, Shield, Trophy, Swords, Sparkles, HelpCircle } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';

interface RulesFaqCardProps {
  defaultExpanded?: boolean;
}

export const RulesFaqCard: React.FC<RulesFaqCardProps> = ({ defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { triggerHaptic } = useTournament();

  const rules = [
    {
      icon: Trophy,
      title: '1 Game Per Match: First to 12 (Win: 1, Loss: 0)',
      details:
        'Official ping pong tournament rule: Each match consists of exactly 1 single game. The first player to reach 12 points wins the match (e.g. 12:8, 12:10). The winner receives 1 tournament point on the leaderboard, and the loser receives 0 points.'
    },
    {
      icon: Sparkles,
      title: 'Point Hunter Award (+/-)',
      details:
        'We celebrate the Point Hunter! The leaderboard ranks players by total wins (pts), followed by their +/- Point Differential (Points Scored minus Points Conceded) and total points scored (PF).'
    },
    {
      icon: Swords,
      title: 'Service & Match Play',
      details:
        'Service alternates every 2 points. The ball must bounce once on the server’s side, clear the net, and land on the receiver’s side. At 11:11, serve alternates after every point.'
    },
    {
      icon: Shield,
      title: 'Fair Play & Table Edge Calls',
      details:
        'Self-officiated tournament. Balls hitting the table top edge are in; balls striking the vertical side of the table are out. In case of mutual doubt on edge balls or net touches, replay the point gracefully.'
    }
  ];

  return (
    <div className="pingpong-table-card overflow-hidden transition-colors duration-200">
      <button
        onClick={() => {
          triggerHaptic('light');
          setIsExpanded(!isExpanded);
        }}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-[#fafafa] dark:hover:bg-[#1a2230] transition active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] border border-[#e5e5e5] dark:border-[#263244] flex items-center justify-center shadow-sm">
            <BookOpen className="w-4 h-4 text-[#5f79ff] dark:text-[#7b8eff]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d90429]"></span>
              <span className="text-sm font-light font-display-serif text-[#000000] dark:text-[#f8fafc] block">
                Ping Pong Rules
              </span>
            </div>
            <span className="text-[10px] text-[#707070] dark:text-[#94a3b8] block">First to 12 • 2-serve rotation • +/- differential</span>
          </div>
        </div>

        <div className={`p-1.5 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] text-[#707070] dark:text-[#94a3b8] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-[#ebebeb] dark:border-[#263244]">
          {rules.map((rule, idx) => {
            const Icon = rule.icon;
            return (
              <div
                key={idx}
                className="bg-[#fafafa] dark:bg-[#1a2230] p-3 rounded-xl border border-[#ebebeb] dark:border-[#263244] space-y-1"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-[#000000] dark:text-[#f8fafc]">
                  <Icon className="w-3.5 h-3.5 text-[#5f79ff] dark:text-[#7b8eff]" />
                  <span>{rule.title}</span>
                </div>
                <p className="text-[11px] text-[#4d4d4d] dark:text-[#cbd5e1] leading-relaxed pl-5">
                  {rule.details}
                </p>
              </div>
            );
          })}

          <div className="pt-1 text-center">
            <p className="text-[10px] text-[#707070] dark:text-[#94a3b8] flex items-center justify-center gap-1">
              <HelpCircle className="w-3 h-3 text-[#a6a6a6] dark:text-[#64748b] inline" />
              <span>Need help or score corrections? Contact tournament admin.</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
