import { useState } from 'react';
import useStore from '../store/useStore.ts';
import type { Page } from '../types/index.ts';
import RoundDropdown from './RoundDropdown.tsx';
import PinModal from './PinModal.tsx';
import SyncPanel from './SyncPanel.tsx';

export default function Header() {
  const { currentPage, setPage, hostUnlocked, setHostUnlocked } = useStore();
  const [pinModalOpen, setPinModalOpen] = useState(false);

  const navigate = (page: Page) => {
    if (page === 'scoring' && !hostUnlocked) {
      setPinModalOpen(true);
      return;
    }
    setPage(page);
    window.location.hash = `#/${page}`;
  };

  const toggleHost = () => {
    if (hostUnlocked) {
      setHostUnlocked(false);
      if (currentPage === 'scoring') {
        setPage('running');
        window.location.hash = '#/running';
      }
    } else {
      setPinModalOpen(true);
    }
  };

  const tabs: { page: Page; label: string; icon: string; hostOnly?: boolean }[] = [
    { page: 'running', label: 'Order', icon: '📋' },
    { page: 'scoring', label: 'Scoring', icon: '✏️', hostOnly: true },
    { page: 'competitors', label: 'Competitors', icon: '🐕', hostOnly: true },
    { page: 'ranking', label: 'Rankings', icon: '🏆' },
  ];

  return (
    <>
      <header
        className="sticky top-0 z-[100]"
        style={{
          background: 'rgba(12,14,18,0.88)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #2a2f40',
          padding: '0 24px',
        }}
      >
        <div className="max-w-[1440px] mx-auto flex items-center justify-between h-16 gap-4 max-[900px]:flex-wrap max-[900px]:h-auto max-[900px]:py-3 max-[900px]:gap-2">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="w-9 h-9 flex items-center justify-center text-[18px] -rotate-6"
              style={{ background: '#ff6b2c', borderRadius: '10px' }}
            >
              🐾
            </div>
            <div className="font-display text-[18px] tracking-[-0.5px]" style={{ color: '#f0f2f8' }}>
              Paws<span style={{ color: '#ff6b2c' }}>&</span>Speed
            </div>
          </div>

          {/* Nav Tabs */}
          <nav
            className="flex gap-1 p-1 max-[900px]:order-3 max-[900px]:w-full max-[900px]:justify-center max-[900px]:overflow-x-auto"
            style={{ background: '#1c2030', borderRadius: '10px' }}
          >
            {tabs.map((tab) => {
              if (tab.hostOnly && !hostUnlocked) return null;
              const isActive = currentPage === tab.page;
              return (
                <button
                  key={tab.page}
                  onClick={() => navigate(tab.page)}
                  className="flex items-center gap-[7px] whitespace-nowrap cursor-pointer transition-all duration-200"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? '#ff6b2c' : 'transparent',
                    color: isActive ? '#fff' : '#8b90a5',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => { if (!isActive) { (e.target as HTMLElement).style.color = '#f0f2f8'; (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; } }}
                  onMouseLeave={(e) => { if (!isActive) { (e.target as HTMLElement).style.color = '#8b90a5'; (e.target as HTMLElement).style.background = 'transparent'; } }}
                >
                  {tab.icon} {tab.label}
                  {tab.hostOnly && (
                    <span
                      className="text-[9px] uppercase tracking-[0.5px]"
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      Host
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-3 shrink-0">
            <SyncPanel />
            <RoundDropdown />
            <button
              onClick={toggleHost}
              className="cursor-pointer transition-all duration-200 text-[11px] font-bold tracking-[0.5px]"
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                border: 'none',
                background: hostUnlocked ? 'rgba(45,212,160,0.15)' : 'rgba(85,91,115,0.2)',
                color: hostUnlocked ? '#2dd4a0' : '#555b73',
              }}
            >
              {hostUnlocked ? '🔓 Host Mode' : '🔒 Locked'}
            </button>
          </div>
        </div>
      </header>

      <PinModal
        open={pinModalOpen}
        onClose={() => {
          setPinModalOpen(false);
          // If host became unlocked from modal, navigate to scoring
          const state = useStore.getState();
          if (state.hostUnlocked && currentPage !== 'scoring') {
            setPage('scoring');
            window.location.hash = '#/scoring';
          }
        }}
      />
    </>
  );
}
