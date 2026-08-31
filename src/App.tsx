import React, { useState, useEffect } from 'react';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { HomeView } from './components/views/HomeView';
import { FixturesView } from './components/views/FixturesView';
import { StandingsView } from './components/views/StandingsView';
import { LiveScoreModal } from './components/LiveScoreModal';
import { PlayerSelectorModal } from './components/PlayerSelectorModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { MatchQRModal } from './components/MatchQRModal';
import { AdminModal } from './components/AdminModal';
import { CinematicPingPongBackground } from './components/CinematicPingPongBackground';
import { PingPong3DGame } from './components/PingPong3DGame';
import { Match } from './types';

const MainApp: React.FC = () => {
  const {
    currentPlayerId,
    setCurrentPlayerId,
    selectedPlayerForProfile,
    setSelectedPlayerForProfile,
    matches,
    players,
    scheduleMatchWithOpponent,
    setIsAdminMode
  } = useTournament();

  // Tab state with URL query support
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'scores' || tabParam === 'fixtures') return 'fixtures';
      if (tabParam === 'standings') return 'standings';
    } catch {
      // ignore
    }
    return 'home';
  });

  const [selectedMatchForScore, setSelectedMatchForScore] = useState<Match | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [qrModalMatch, setQrModalMatch] = useState<Match | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Admin Link URL Detection (e.g. ?page=admin, ?admin=true, ?tab=admin, #admin, /admin)
  useEffect(() => {
    const checkAdminUrl = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const pageParam = params.get('page');
        const adminParam = params.get('admin');
        const tabParam = params.get('tab');
        const viewParam = params.get('view');
        const hash = window.location.hash;
        const pathname = window.location.pathname;

        const isAdminRequested =
          pageParam === 'admin' ||
          adminParam === 'true' ||
          adminParam === '1' ||
          tabParam === 'admin' ||
          viewParam === 'admin' ||
          hash === '#admin' ||
          pathname.endsWith('/admin');

        if (isAdminRequested) {
          setIsAdminMode(true);
          setIsAdminModalOpen(true);
        }
      } catch {
        // ignore
      }
    };

    checkAdminUrl();
    window.addEventListener('popstate', checkAdminUrl);
    window.addEventListener('hashchange', checkAdminUrl);
    return () => {
      window.removeEventListener('popstate', checkAdminUrl);
      window.removeEventListener('hashchange', checkAdminUrl);
    };
  }, [setIsAdminMode]);

  // Support Instant Match URL Query Deep Linking (e.g. ?match=m_123 or ?p1=nex_1&p2=mck_1&action=score)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const matchId = params.get('match');
      const p1 = params.get('p1');
      const p2 = params.get('p2');
      const action = params.get('action');

      if (matchId && matchId !== 'instant') {
        const found = matches.find(m => m.id === matchId);
        if (found) {
          setSelectedMatchForScore(found);
          return;
        }
      }

      if (p1 && p2 && action === 'score') {
        // If current user is not set, set to p2 (the scanning player)
        if (!currentPlayerId) {
          setCurrentPlayerId(p2);
        }

        // Find existing match or create one
        const existing = matches.find(
          m => (m.player1Id === p1 && m.player2Id === p2) || (m.player1Id === p2 && m.player2Id === p1)
        );

        if (existing) {
          setSelectedMatchForScore(existing);
        } else {
          // Schedule and open
          try {
            const created = scheduleMatchWithOpponent(p1 === currentPlayerId ? p2 : p1);
            setSelectedMatchForScore(created);
          } catch {
            // fallback
          }
        }
      }
    } catch {
      // ignore query parsing errors
    }
  }, [matches, currentPlayerId]);

  // Auto-open player selection on first launch if user hasn't selected their name yet
  useEffect(() => {
    if (!currentPlayerId) {
      const params = new URLSearchParams(window.location.search);
      if (!params.get('p1') && !params.get('p2')) {
        const timer = setTimeout(() => {
          setIsPlayerModalOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentPlayerId]);

  return (
    <div className="flex flex-col h-full w-full bg-[#ffffff] dark:bg-[#0a0d14] text-[#000000] dark:text-[#f8fafc] overflow-hidden select-none font-sans relative transition-colors duration-200">
      {/* Signature OpenServ Top Accent Stripe */}
      <div className="openserv-stripe flex-shrink-0 z-40" />

      {/* Top Bar */}
      <Header onOpenPlayerModal={() => setIsPlayerModalOpen(true)} />

      {/* Cinematic 3D Table Tennis World Background */}
      <CinematicPingPongBackground scrollContainerId="main-scroll-container" />

      {/* Main View Scroll Area */}
      <main
        id="main-scroll-container"
        className="flex-1 overflow-y-auto overscroll-none relative z-10 bg-[#fafafa]/70 dark:bg-[#0a0d14]/75 backdrop-blur-[2px] transition-colors duration-200"
      >
        {activeTab === 'home' && (
          <HomeView
            onSelectMatchForScore={match => setSelectedMatchForScore(match)}
            onNavigateTab={tab => setActiveTab(tab)}
            onOpenPlayerModal={() => setIsPlayerModalOpen(true)}
          />
        )}

        {activeTab === 'fixtures' && (
          <FixturesView onSelectMatchForScore={match => setSelectedMatchForScore(match)} />
        )}

        {activeTab === 'standings' && (
          <StandingsView onSelectMatchForScore={match => setSelectedMatchForScore(match)} />
        )}

        {activeTab === 'play' && (
          <div className="w-full h-[calc(100dvh-4rem)] md:h-[calc(100dvh-4.5rem)] flex flex-col pb-16 md:pb-20">
            <PingPong3DGame isEmbedded={false} />
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Modals & Sheets */}
      <LiveScoreModal
        match={selectedMatchForScore}
        isOpen={Boolean(selectedMatchForScore)}
        onClose={() => setSelectedMatchForScore(null)}
      />

      <MatchQRModal
        isOpen={Boolean(qrModalMatch)}
        match={qrModalMatch}
        onClose={() => setQrModalMatch(null)}
        onOpenScoreForMatch={m => {
          setQrModalMatch(null);
          setSelectedMatchForScore(m);
        }}
      />

      <PlayerSelectorModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
      />

      <PlayerProfileModal
        player={selectedPlayerForProfile}
        isOpen={Boolean(selectedPlayerForProfile)}
        onClose={() => setSelectedPlayerForProfile(null)}
        onSelectMatchForScore={match => {
          setSelectedPlayerForProfile(null);
          setSelectedMatchForScore(match);
        }}
      />

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <TournamentProvider>
        <MainApp />
      </TournamentProvider>
    </ThemeProvider>
  );
}
