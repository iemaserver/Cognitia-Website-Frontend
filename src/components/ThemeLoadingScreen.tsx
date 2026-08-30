import React, { useState, useEffect, useRef } from 'react';
import { Crosshair } from 'lucide-react';
import { sound } from '../utils/audio';

export type RetroThemeId = 'cognitia-gold' | 'matrix-terminal' | 'synthwave-pink' | 'gameboy-lcd';

export interface ThemeConfig {
  id: RetroThemeId;
  name: string;
  badge: string;
  bgClass: string;
  containerBorder: string;
  textColor: string;
  accentColor: string;
  progressFill: string;
  logoGlow: string;
  tagline: string;
  hudGlow: string;
}

export const THEMES: Record<RetroThemeId, ThemeConfig> = {
  'cognitia-gold': {
    id: 'cognitia-gold',
    name: 'Cognitia Gold & Cyan',
    badge: 'CLASSIC ARCADE',
    bgClass: 'bg-[#0f141c]',
    containerBorder: 'border-[#00f0ff]',
    textColor: 'text-[#00f0ff]',
    accentColor: 'text-[#f4c151]',
    progressFill: 'bg-gradient-to-r from-[#00f0ff] via-[#7ec7ff] to-[#f4c151]',
    logoGlow: 'drop-shadow-[0_0_24px_rgba(0,240,255,0.7)]',
    tagline: 'QUANTUM NEURAL CORE // V2.026',
    hudGlow: 'rgba(0, 240, 255, 0.4)',
  },
  'matrix-terminal': {
    id: 'matrix-terminal',
    name: 'Matrix Emerald',
    badge: 'HACKER TERMINAL',
    bgClass: 'bg-[#060e08]',
    containerBorder: 'border-[#00ff66]',
    textColor: 'text-[#00ff66]',
    accentColor: 'text-[#33ff99]',
    progressFill: 'bg-gradient-to-r from-[#00aa44] via-[#00ff66] to-[#a7ffb8]',
    logoGlow: 'drop-shadow-[0_0_24px_rgba(0,255,102,0.7)]',
    tagline: 'NEURAL MAINFRAME BUS // V2.026',
    hudGlow: 'rgba(0, 255, 102, 0.4)',
  },
  'synthwave-pink': {
    id: 'synthwave-pink',
    name: 'Synthwave Sunset',
    badge: 'CYBERPUNK NEON',
    bgClass: 'bg-[#15071d]',
    containerBorder: 'border-[#ff007f]',
    textColor: 'text-[#ff007f]',
    accentColor: 'text-[#00f0ff]',
    progressFill: 'bg-gradient-to-r from-[#ff007f] via-[#b5179e] to-[#00f0ff]',
    logoGlow: 'drop-shadow-[0_0_24px_rgba(255,0,127,0.7)]',
    tagline: 'NEON WAVE SYNTH MAINFRAME',
    hudGlow: 'rgba(255, 0, 127, 0.4)',
  },
  'gameboy-lcd': {
    id: 'gameboy-lcd',
    name: 'GameBoy Monochrome',
    badge: '8-BIT HANDHELD',
    bgClass: 'bg-[#8b956d]',
    containerBorder: 'border-[#0f380f]',
    textColor: 'text-[#0f380f]',
    accentColor: 'text-[#306230]',
    progressFill: 'bg-[#0f380f]',
    logoGlow: 'drop-shadow-[0_0_12px_rgba(15,56,15,0.4)]',
    tagline: 'CLASSIC GREEN SCREEN LCD',
    hudGlow: 'rgba(15, 56, 15, 0.3)',
  },
};

export interface ThemeLoadingScreenProps {
  onBootComplete?: () => void;
  currentTheme?: RetroThemeId;
  onThemeChange?: (themeId: RetroThemeId) => void;
  isFastSwitch?: boolean;
  targetCartridgeName?: string;
}

// Generate 8x6 grid covering the entire viewport (48 grid cells)
const GRID_COLS = 8;
const GRID_ROWS = 6;
const CENTER_X = (GRID_COLS - 1) / 2.0;
const CENTER_Y = (GRID_ROWS - 1) / 2.0;

interface FullScreenGridCell {
  id: number;
  row: number;
  col: number;
  threshold: number;
}

const FULL_SCREEN_GRID_CELLS: FullScreenGridCell[] = (() => {
  const cells: FullScreenGridCell[] = [];
  let id = 1;
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const dx = (c - CENTER_X) / CENTER_X;
      const dy = (r - CENTER_Y) / CENTER_Y;
      const dist = Math.hypot(dx, dy);
      const normDist = Math.min(1.0, dist / 1.35);
      const threshold = Math.round(12 + normDist * 80);
      cells.push({ id: id++, row: r, col: c, threshold });
    }
  }
  return cells;
})();

export const ThemeLoadingScreen: React.FC<ThemeLoadingScreenProps> = ({
  onBootComplete,
  isFastSwitch = false,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [isBlending, setIsBlending] = useState<boolean>(false);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    // Play sci-fi audio startup sequence
    try {
      if (isFastSwitch) {
        sound.playClick();
      } else {
        sound.playSciFiStartup();
      }
    } catch (e) {
      /* ignore audio autoplay restriction */
    }

    const intervalTime = isFastSwitch ? 12 : 16;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsBlending(true);
          try {
            sound.playCoin();
          } catch (e) {}

          if (onBootComplete) {
            setTimeout(onBootComplete, isFastSwitch ? 50 : 100);
          }
          return 100;
        }

        const step = isFastSwitch ? 25 : 15;
        const next = Math.min(prev + step, 100);

        // Sound feedback on milestones
        const milestone = Math.floor(next / 20);
        if (milestone > lastTickRef.current) {
          lastTickRef.current = milestone;
          try {
            sound.playConstructionTick(milestone);
          } catch (e) {}
        }

        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isFastSwitch, onBootComplete]);

  return (
    <div
      className="absolute inset-0 w-full h-full flex items-center justify-center select-none overflow-hidden bg-transparent z-10"
      id="theme-loading-screen"
    >
      {/* 1. Underlying Spidey Background Image (1.5x bigger & centered, matching ScreenViewport layout) */}
      <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4 pointer-events-none z-10">
        <img
          src="/spideybg.webp"
          alt=""
          width={720}
          height={720}
          decoding="async"
          className="w-full h-full max-w-[630px] max-h-[630px] sm:max-w-[720px] sm:max-h-[720px] object-contain object-center mix-blend-screen filter brightness-115 contrast-125 saturate-150 transition-opacity duration-700"
          style={{
            opacity: isBlending ? 0.3 : 0.88,
          }}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* 2. Full-Screen Sci-Fi Grid Boxes Covering the Entire ScreenViewport */}
      <div
        className={`absolute inset-0 grid grid-cols-8 grid-rows-6 pointer-events-none z-20 transition-opacity duration-500 ${
          isBlending ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {FULL_SCREEN_GRID_CELLS.map((cell) => {
          const isUnlocked = progress >= cell.threshold;
          return (
            <div
              key={cell.id}
              className={`relative transition-all duration-300 ${
                isUnlocked
                  ? 'border border-cyan-400/20 bg-transparent'
                  : 'border border-cyan-500/10 bg-[#0d0f12]'
              }`}
            >
              {/* Wireframe cross node on locked cells */}
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center opacity-30 font-mono text-[8px] sm:text-[10px] text-cyan-400 animate-pulse">
                  +
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Full-Viewport Sweeping Laser Scanner */}
      <div
        className={`absolute inset-0 pointer-events-none z-30 transition-opacity duration-700 ${
          isBlending ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="absolute inset-x-0 h-1 sm:h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-laser-scan shadow-[0_0_24px_#00f0ff]" />
      </div>

      {/* 4. Full-Viewport Concentric Radar / Gyroscope Rings */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none z-25 transition-opacity duration-700 ${
          isBlending ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="w-[88vmin] h-[88vmin] max-w-[680px] max-h-[680px] rounded-full border border-cyan-400/20 animate-radar-reverse" />
        <div className="absolute w-[68vmin] h-[68vmin] max-w-[520px] max-h-[520px] rounded-full border border-dashed border-cyan-400/30 animate-radar-sweep" />
        <div className="absolute w-[46vmin] h-[46vmin] max-w-[360px] max-h-[360px] rounded-full border border-cyan-400/15" />
      </div>

      {/* 5. Eye Targeting Reticles */}
      {progress >= 15 && !isBlending && (
        <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4 pointer-events-none z-30">
          <div className="relative w-full h-full max-w-[520px] max-h-[520px] sm:max-w-[600px] sm:max-h-[600px]">
            <div className="absolute top-[28%] left-[26%] -translate-x-1/2 -translate-y-1/2">
              <Crosshair className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 animate-spin" style={{ animationDuration: '5s' }} />
            </div>
            <div className="absolute top-[28%] right-[26%] translate-x-1/2 -translate-y-1/2">
              <Crosshair className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 animate-spin" style={{ animationDuration: '5s' }} />
            </div>
          </div>
        </div>
      )}

      {/* 6. Shockwave Flare Ring on Completion */}
      {isBlending && (
        <div
          className="absolute w-[80vmin] h-[80vmin] max-w-[600px] max-h-[600px] rounded-full border-2 border-cyan-400 animate-shockwave pointer-events-none z-40"
          style={{ boxShadow: '0 0 35px #00f0ff' }}
        />
      )}
    </div>
  );
};
