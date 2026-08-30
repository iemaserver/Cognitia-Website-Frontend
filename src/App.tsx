import { useState, useEffect, lazy, Suspense } from 'react';
import { ConsoleShell } from './components/ConsoleShell';
import { ScreenViewport } from './components/ScreenViewport';
import { BottomBar } from './components/BottomBar';
import { Footer } from './components/Footer';
import { CartridgeDeckScreen } from './components/cartridges/CartridgeDeckScreen';
import { DashboardCartridge } from './components/cartridges/DashboardCartridge';
import { PWAConsoleScreen } from './components/PWAConsoleScreen';
import { ThemeLoadingScreen, RetroThemeId } from './components/ThemeLoadingScreen';
import { CartridgeId } from './types';
import { sound } from './utils/audio';
import { firebaseService } from './services/firebaseService';

// Lazy load non-initial cartridges to optimize initial bundle size & load speed
const RulesCartridge = lazy(() => import('./components/cartridges/RulesCartridge').then(m => ({ default: m.RulesCartridge })));
const TracksCartridge = lazy(() => import('./components/cartridges/TracksCartridge').then(m => ({ default: m.TracksCartridge })));
const TimelineCartridge = lazy(() => import('./components/cartridges/TimelineCartridge').then(m => ({ default: m.TimelineCartridge })));
const SponsorsCartridge = lazy(() => import('./components/cartridges/SponsorsCartridge').then(m => ({ default: m.SponsorsCartridge })));
const MembersCartridge = lazy(() => import('./components/cartridges/MembersCartridge').then(m => ({ default: m.MembersCartridge })));
const PrizesCartridge = lazy(() => import('./components/cartridges/PrizesCartridge').then(m => ({ default: m.PrizesCartridge })));
const FAQCartridge = lazy(() => import('./components/cartridges/FAQCartridge').then(m => ({ default: m.FAQCartridge })));
const AdminCartridge = lazy(() => import('./components/cartridges/AdminCartridge').then(m => ({ default: m.AdminCartridge })));
const RegistrationCartridge = lazy(() => import('./components/cartridges/RegistrationCartridge').then(m => ({ default: m.RegistrationCartridge })));
const LoginCartridge = lazy(() => import('./components/cartridges/RegistrationCartridge').then(m => ({ default: m.LoginCartridge })));

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
  // Target Event Start Date: September 11, 2026 at 4:00 PM IST (16:00:00)
  const TARGET_DATE_TIME = new Date('2026-09-11T16:00:00+05:30').getTime();

  const calculateRemainingTime = () => {
    const now = Date.now();
    const diff = Math.max(0, TARGET_DATE_TIME - now);

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      mins: Math.floor((diff / (1000 * 60)) % 60),
      secs: Math.floor((diff / 1000) % 60),
    };
  };

  const [showScanlines] = useState<boolean>(true);
  const [countdown, setCountdown] = useState(calculateRemainingTime);

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

  // Live real-time countdown timer ticker targeting September 11, 2026 4:00 PM IST
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateRemainingTime());
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
      }, 180);
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
                  <Suspense fallback={null}>
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
                  </Suspense>
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
          src="/footer_logo.webp"
          alt="Cognitia Official Crest Logo"
          width={535}
          height={75}
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



