import { useState, useEffect } from 'react';
import { ConsoleShell } from './components/ConsoleShell';
import { ScreenViewport } from './components/ScreenViewport';
import { BottomBar } from './components/BottomBar';
import { Footer } from './components/Footer';
import { CartridgeDeckScreen } from './components/cartridges/CartridgeDeckScreen';
import { DashboardCartridge } from './components/cartridges/DashboardCartridge';
import { RulesCartridge } from './components/cartridges/RulesCartridge';
import { TracksCartridge } from './components/cartridges/TracksCartridge';
import { TimelineCartridge } from './components/cartridges/TimelineCartridge';
import { SponsorsCartridge } from './components/cartridges/SponsorsCartridge';
import { MembersCartridge } from './components/cartridges/MembersCartridge';
import { PrizesCartridge } from './components/cartridges/PrizesCartridge';
import { FAQCartridge } from './components/cartridges/FAQCartridge';
import { RegistrationCartridge, LoginCartridge } from './components/cartridges/RegistrationCartridge';
import { AdminCartridge } from './components/cartridges/AdminCartridge';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { PWAConsoleScreen } from './components/PWAConsoleScreen';
import { ThemeLoadingScreen, RetroThemeId } from './components/ThemeLoadingScreen';
import { CartridgeSwapLoader } from './components/CartridgeSwapLoader';
import { CartridgeId } from './types';
import { sound } from './utils/audio';
import { firebaseService } from './services/firebaseService';

export default function App() {
  const [currentCartridge, setCurrentCartridge] = useState<CartridgeId>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('admin')) return 'admin';
      if (path.includes('login')) return 'login';
      if (path.includes('register') || path.includes('submit')) return 'register';

      const saved = localStorage.getItem('cognitia_last_cartridge') as CartridgeId;
      const validCartridges: CartridgeId[] = [
        'dashboard',
        'register',
        'login',
        'rules',
        'tracks',
        'timeline',
        'sponsors',
        'members',
        'prizes',
        'faq',
        'admin',
      ];
      if (saved && validCartridges.includes(saved)) {
        return saved;
      }
    }
    return 'dashboard';
  });
  const [isDeckOpen, setIsDeckOpen] = useState<boolean>(false);
  const [isBooting, setIsBooting] = useState<boolean>(true);
  const [showPwaScreen, setShowPwaScreen] = useState<boolean>(false);
  const [isSwitchingCartridge, setIsSwitchingCartridge] = useState<boolean>(false);
  const [targetCartridgeName, setTargetCartridgeName] = useState<string>('');
  const [activeTheme, setActiveTheme] = useState<RetroThemeId>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('cognitia_theme') as RetroThemeId) || 'cognitia-gold';
    }
    return 'cognitia-gold';
  });
  const [showScanlines] = useState<boolean>(true);
  const [countdown, setCountdown] = useState({ days: 12, hours: 8, mins: 44, secs: 20 });

  const handleThemeChange = (th: RetroThemeId) => {
    setActiveTheme(th);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cognitia_theme', th);
    }
  };

  const handleBootComplete = () => {
    setIsBooting(false);
    setShowPwaScreen(false);
  };

  const getCartridgeNameById = (id: CartridgeId) => {
    const isLoggedIn = !!firebaseService.getActiveLeadTeam();
    switch (id) {
      case 'dashboard': return 'DASHBOARD';
      case 'register': return isLoggedIn ? 'TEAM DASHBOARD' : 'REGISTER TEAM';
      case 'login': return isLoggedIn ? 'TEAM DASHBOARD' : 'TEAM LOGIN';
      case 'rules': return 'RULES & REGS';
      case 'tracks': return 'TRACKS';
      case 'timeline': return 'SCHEDULE';
      case 'sponsors': return 'SPONSORS';
      case 'members': return 'MEMBERS';
      case 'prizes': return 'PRIZES';
      case 'faq': return 'FAQ';
      case 'admin': return 'ADMIN PORTAL';
    }
  };

  // Sync cartridge selection to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cognitia_last_cartridge', currentCartridge);
    }
  }, [currentCartridge]);

  // Initial path routing check (e.g., /admin, /login, /register)
  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('admin')) {
      setCurrentCartridge('admin');
    } else if (path.includes('login')) {
      setCurrentCartridge('login');
    } else if (path.includes('register') || path.includes('submit')) {
      setCurrentCartridge('register');
    }
  }, []);

  // Live countdown timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: 59, secs: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, mins: 59, secs: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectCartridge = (id: CartridgeId) => {
    if (id !== currentCartridge) {
      sound.playClick();
      const targetName = getCartridgeNameById(id);
      setTargetCartridgeName(targetName);
      setIsSwitchingCartridge(true);
      setShowPwaScreen(false);

      setTimeout(() => {
        setCurrentCartridge(id);
        setIsSwitchingCartridge(false);
      }, 420);
    } else {
      setShowPwaScreen(false);
    }
  };

  const handleResetBoot = () => {
    sound.playBoot();
    setIsBooting(true);
    setShowPwaScreen(false);
    setIsSwitchingCartridge(false);
    setCurrentCartridge('dashboard');
    setIsDeckOpen(false);
  };

  // Keyboard shortcut listener for hot-swapping cartridges
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'm' || e.key === 'M') {
        sound.toggleMute();
      } else if (e.key === 'r' || e.key === 'R') {
        handleResetBoot();
      } else if (e.key === 'Escape') {
        setIsDeckOpen(false);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setIsDeckOpen((prev) => !prev);
      } else if (e.key === '1') {
        handleSelectCartridge('dashboard');
        setIsDeckOpen(false);
      } else if (e.key === '2') {
        handleSelectCartridge('register');
        setIsDeckOpen(false);
      } else if (e.key === '3') {
        handleSelectCartridge('login');
        setIsDeckOpen(false);
      } else if (e.key === '4') {
        handleSelectCartridge('rules');
        setIsDeckOpen(false);
      } else if (e.key === '5') {
        handleSelectCartridge('tracks');
        setIsDeckOpen(false);
      } else if (e.key === '6') {
        handleSelectCartridge('timeline');
        setIsDeckOpen(false);
      } else if (e.key === '7') {
        handleSelectCartridge('sponsors');
        setIsDeckOpen(false);
      } else if (e.key === '8') {
        handleSelectCartridge('members');
        setIsDeckOpen(false);
      } else if (e.key === '9') {
        handleSelectCartridge('prizes');
        setIsDeckOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const getStatusText = () => {
    if (isBooting) return 'COGNITIA 2026 • INITIALIZING CONSOLE HARDWARE...';
    if (isSwitchingCartridge) return `MOUNTING ${targetCartridgeName} CARTRIDGE...`;
    if (showPwaScreen) return 'COGNITIA 2K26 PWA INSTALLATION MODULE';
    if (isDeckOpen) return 'SELECTING ROM CARTRIDGE MODULE...';
    switch (currentCartridge) {
      case 'dashboard':
        return 'COGNITIA 2026 • 30-HOUR SPRINT • ₹20,000 CASH POOL';
      case 'register':
        return 'TEAM LEADER REGISTRATION PORTAL';
      case 'login':
        return 'PARTICIPANT TEAM LOGIN & SUBMISSION PORTAL';
      case 'rules':
        return 'RULES & ETHICS PROTOCOL';
      case 'tracks':
        return 'CHALLENGE TRACKS // 5 SPECIALIZED SPRINT DOMAINS';
      case 'timeline':
        return 'SPRINT SCHEDULE [TO BE ANNOUNCED]';
      case 'sponsors':
        return 'SPONSORS & PARTNERS [TO BE ANNOUNCED]';
      case 'members':
        return 'COGNITIA CORE TEAM & DIRECTORY';
      case 'prizes':
        return '₹20,000 TOTAL CASH PRIZE POOL';
      case 'faq':
        return 'KNOWLEDGE BASE FAQ';
      case 'admin':
        return 'RESTRICTED ADMIN CONSOLE [Cognitia2026Admin]';
    }
  };

  const getCartridgeName = () => {
    const isLoggedIn = !!firebaseService.getActiveLeadTeam();
    if (isBooting) return 'INITIALIZING';
    if (isSwitchingCartridge) return targetCartridgeName || 'SWAPPING ROM';
    if (showPwaScreen) return 'INSTALL PWA';
    switch (currentCartridge) {
      case 'dashboard': return 'DASHBOARD';
      case 'register': return isLoggedIn ? 'TEAM DASHBOARD' : 'REGISTER TEAM';
      case 'login': return isLoggedIn ? 'TEAM DASHBOARD' : 'TEAM LOGIN';
      case 'rules': return 'RULES & REGS';
      case 'tracks': return 'TRACKS';
      case 'timeline': return 'SCHEDULE';
      case 'sponsors': return 'SPONSORS';
      case 'members': return 'MEMBERS';
      case 'prizes': return 'PRIZES';
      case 'faq': return 'FAQ';
      case 'admin': return 'ADMIN PORTAL';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b132b] via-[#0d1b3e] to-[#040817] text-white flex flex-col items-center relative">
      {/* 
        SCREEN 1: Full-Viewport Fitted Pixel Console HUD
        - Fits 100% inside screen window with internal cartridge viewport scrolling
      */}
      <section className="w-full h-screen min-h-[580px] max-h-[100dvh] flex flex-col justify-center items-center p-1.5 sm:p-3 md:p-4 box-border shrink-0">
        <ConsoleShell
          currentCartridge={currentCartridge}
          onSelectCartridge={(id) => {
            handleSelectCartridge(id);
            setIsDeckOpen(false);
          }}
          onOpenCartridgeMenu={() => setIsDeckOpen((prev) => !prev)}
          isMenuOpen={isDeckOpen && !isBooting && !showPwaScreen && !isSwitchingCartridge}
          onToggleMenu={() => !isBooting && !showPwaScreen && !isSwitchingCartridge && setIsDeckOpen((prev) => !prev)}
        >
          <div className="flex flex-col gap-1 grow h-full min-h-0" id="pixel-console-app-root">
            {/* Full-width Swappable Screen Viewport */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full">
              <ScreenViewport
                scanlinesEnabled={showScanlines}
                activeCartridgeId={isBooting ? 'BOOT' : isSwitchingCartridge ? 'SWAP' : showPwaScreen ? 'PWA' : currentCartridge}
                cartridgeName={getCartridgeName()}
              >
                {/* Content Area - Main Cartridge Rendered Immediately (LCP Optimized) */}
                {isDeckOpen ? (
                  <CartridgeDeckScreen
                    currentCartridge={currentCartridge}
                    onSelectCartridge={(id) => {
                      handleSelectCartridge(id);
                      setIsDeckOpen(false);
                    }}
                    onCloseDeck={() => setIsDeckOpen(false)}
                  />
                ) : showPwaScreen ? (
                  <PWAConsoleScreen
                    onContinueToDashboard={() => setShowPwaScreen(false)}
                  />
                ) : (
                  <>
                    {currentCartridge === 'dashboard' && (
                      <DashboardCartridge
                        onNavigate={(id) => {
                          handleSelectCartridge(id);
                          setIsDeckOpen(false);
                        }}
                      />
                    )}
                    {currentCartridge === 'register' && <RegistrationCartridge defaultLoginMode={false} />}
                    {currentCartridge === 'login' && <LoginCartridge />}
                    {currentCartridge === 'rules' && <RulesCartridge />}
                    {currentCartridge === 'tracks' && (
                      <TracksCartridge
                        onNavigate={(id) => {
                          handleSelectCartridge(id as any);
                          setIsDeckOpen(false);
                        }}
                      />
                    )}
                    {currentCartridge === 'timeline' && <TimelineCartridge />}
                    {currentCartridge === 'sponsors' && <SponsorsCartridge />}
                    {currentCartridge === 'members' && <MembersCartridge />}
                    {currentCartridge === 'prizes' && <PrizesCartridge />}
                    {currentCartridge === 'faq' && <FAQCartridge />}
                    {currentCartridge === 'admin' && <AdminCartridge />}
                  </>
                )}

                {/* Boot / Swap Loader Overlay (Positioned on top so LCP element is never delayed) */}
                {isBooting && (
                  <ThemeLoadingScreen
                    currentTheme={activeTheme}
                    onThemeChange={handleThemeChange}
                    onBootComplete={handleBootComplete}
                  />
                )}
                {isSwitchingCartridge && (
                  <ThemeLoadingScreen
                    isFastSwitch={true}
                    currentTheme={activeTheme}
                    onThemeChange={handleThemeChange}
                    targetCartridgeName={targetCartridgeName}
                    onBootComplete={() => setIsSwitchingCartridge(false)}
                  />
                )}
              </ScreenViewport>
            </div>

            {/* Bottom Bar: Full-Width Countdown Timer */}
            <BottomBar countdown={countdown} />

          </div>
        </ConsoleShell>
      </section>

      {/* Centered Cognitia Brand Logo (Just after console, just above footer) */}
      <div className="w-full flex items-center justify-center py-6 sm:py-10 px-4 shrink-0">
        <img
          src="/cognitia logo.png"
          alt="Cognitia Official Crest Logo"
          loading="lazy"
          decoding="async"
          className="h-20 sm:h-28 md:h-36 lg:h-44 w-auto max-w-[94vw] object-contain drop-shadow-[0_6px_32px_rgba(126,199,255,0.55)] filter brightness-110 contrast-105 transition-all duration-300 hover:scale-[1.03]"
        />
      </div>

      {/* 
        SCREEN 2: Real-World Marketing & Design System Footer (Outside Console)
        - Visible upon scrolling down
      */}
      <footer className="w-full px-2 sm:px-4 md:px-6 pb-8 pt-4 shrink-0">
        <Footer />
      </footer>
    </div>
  );
}



