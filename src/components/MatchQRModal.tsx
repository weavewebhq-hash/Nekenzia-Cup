import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Share2,
  Copy,
  Check,
  X,
  Swords,
  Link as LinkIcon,
  Smartphone,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Player, Match } from '../types';
import { getCompanyTheme } from '../utils/companyStyles';
import { useTournament } from '../context/TournamentContext';

interface MatchQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  opponent?: Player | null;
  match?: Match | null;
  onOpenScoreForMatch?: (match: Match) => void;
}

export const MatchQRModal: React.FC<MatchQRModalProps> = ({
  isOpen,
  onClose,
  opponent,
  match,
  onOpenScoreForMatch
}) => {
  const {
    currentPlayer,
    scheduleMatchWithOpponent,
    matches,
    triggerHaptic,
    triggerCelebration
  } = useTournament();

  const [copied, setCopied] = useState(false);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);

  // When modal opens, find or create the match for currentPlayer & opponent
  useEffect(() => {
    if (!isOpen || !currentPlayer) return;

    if (match) {
      setActiveMatch(match);
      return;
    }

    if (opponent) {
      // Check if match already exists
      const existing = matches.find(
        m =>
          (m.player1Id === currentPlayer.id && m.player2Id === opponent.id) ||
          (m.player1Id === opponent.id && m.player2Id === currentPlayer.id)
      );

      if (existing) {
        setActiveMatch(existing);
      } else {
        const created = scheduleMatchWithOpponent(opponent.id);
        setActiveMatch(created);
      }
    }
  }, [isOpen, opponent, match, currentPlayer, matches]);

  if (!isOpen || !currentPlayer) return null;

  const otherPlayer = opponent || (activeMatch ? (
    activeMatch.player1Id === currentPlayer.id
      ? { id: activeMatch.player2Id, name: 'Opponent', company: 'McKenzie' as const }
      : { id: activeMatch.player1Id, name: 'Opponent', company: 'Nexia Mongolia' as const }
  ) : null);

  const p1Theme = getCompanyTheme(currentPlayer.company);
  const p2Theme = getCompanyTheme(otherPlayer?.company || 'McKenzie');

  // Build the instant match scoring URL
  const baseUrl = window.location.origin + window.location.pathname;
  const matchIdParam = activeMatch ? activeMatch.id : 'instant';
  const shareUrl = `${baseUrl}?match=${matchIdParam}&p1=${currentPlayer.id}&p2=${otherPlayer?.id || ''}&action=score`;

  const handleCopyLink = async () => {
    triggerHaptic('success');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback
        const el = document.createElement('textarea');
        el.value = shareUrl;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    triggerHaptic('medium');
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Nekenzie Cup: ${currentPlayer.name} vs ${otherPlayer?.name || 'Opponent'}`,
          text: `Join the match scoring on Court 1! First to 12 points.`,
          url: shareUrl
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  const handleStartScoringNow = () => {
    triggerHaptic('success');
    triggerCelebration();
    onClose();
    if (activeMatch && onOpenScoreForMatch) {
      onOpenScoreForMatch(activeMatch);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/70 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm bg-[#ffffff] dark:bg-[#141a24] rounded-2xl border border-[#e5e5e5] dark:border-[#263244] shadow-2xl p-6 text-[#000000] dark:text-[#f8fafc] z-10 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] flex items-center justify-center text-[#5f79ff] dark:text-[#7b8eff]">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#000000] dark:text-[#f8fafc]">
                  Instant Match QR
                </h3>
                <p className="text-[11px] text-[#707070] dark:text-[#94a3b8]">
                  Court 1 • First to 12 pts
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] text-[#707070] dark:text-[#94a3b8] hover:text-[#000000] dark:hover:text-[#f8fafc] flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Versus Header */}
          <div className="bg-[#fafafa] dark:bg-[#1a2230] border border-[#ebebeb] dark:border-[#263244] rounded-xl p-3 flex items-center justify-between">
            <div className="text-left min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#000000] dark:text-[#f8fafc] truncate">
                  {currentPlayer.name}
                </span>
                <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-semibold ${p1Theme.badgeBg} ${p1Theme.badgeText}`}>
                  {p1Theme.shortName}
                </span>
              </div>
              <span className="text-[10px] text-[#707070] dark:text-[#94a3b8] font-mono">
                {currentPlayer.stats.points} pts
              </span>
            </div>

            <div className="w-6 h-6 rounded-full bg-[#5f79ff]/10 text-[#5f79ff] dark:text-[#7b8eff] flex items-center justify-center font-bold text-[10px] flex-shrink-0 mx-2">
              VS
            </div>

            <div className="text-right min-w-0 flex-1">
              <div className="flex items-center justify-end gap-1.5">
                <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-semibold ${p2Theme.badgeBg} ${p2Theme.badgeText}`}>
                  {p2Theme.shortName}
                </span>
                <span className="text-xs font-bold text-[#000000] dark:text-[#f8fafc] truncate">
                  {otherPlayer?.name || 'Opponent'}
                </span>
              </div>
              <span className="text-[10px] text-[#707070] dark:text-[#94a3b8] font-mono">
                {otherPlayer && 'stats' in otherPlayer ? (otherPlayer as Player).stats.points : 0} pts
              </span>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-4 rounded-xl border border-[#e5e5e5] shadow-inner flex flex-col items-center justify-center space-y-2">
            <div className="p-2 bg-white rounded-lg">
              <QRCodeSVG
                value={shareUrl}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#555555]">
              <Smartphone className="w-3.5 h-3.5 text-[#5f79ff]" />
              <span>Scan with phone camera to sync & score</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleStartScoringNow}
              className="w-full py-2.5 px-4 bg-[#5f79ff] dark:bg-[#6378ff] hover:bg-[#4d69f0] dark:hover:bg-[#7b8eff] text-white font-medium rounded-full text-xs transition flex items-center justify-center gap-2 shadow-md shadow-[#5f79ff]/20"
            >
              <Swords className="w-3.5 h-3.5 text-white" />
              <span>Score Now</span>
            </motion.button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyLink}
                className="py-2 px-3 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] hover:bg-[#ebebeb] dark:hover:bg-[#263244] border border-[#e5e5e5] dark:border-[#263244] text-[#000000] dark:text-[#f8fafc] text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#059669]" />
                    <span className="text-[#059669]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#707070] dark:text-[#94a3b8]" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <button
                onClick={handleNativeShare}
                className="py-2 px-3 rounded-full bg-[#f5f5f5] dark:bg-[#1a2230] hover:bg-[#ebebeb] dark:hover:bg-[#263244] border border-[#e5e5e5] dark:border-[#263244] text-[#000000] dark:text-[#f8fafc] text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Share2 className="w-3.5 h-3.5 text-[#5f79ff] dark:text-[#7b8eff]" />
                <span>Share Link</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
