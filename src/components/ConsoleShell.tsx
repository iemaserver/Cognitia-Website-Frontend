import React from 'react';
import { SpideyCornerSprite } from './SpideyCornerSprite';
import { CartridgeId } from '../types';

interface ConsoleShellProps {
  children: React.ReactNode;
  currentCartridge: CartridgeId;
  onSelectCartridge: (id: CartridgeId) => void;
  onOpenCartridgeMenu?: () => void;
}

export function ConsoleShell({
  children,
  onSelectCartridge,
}: ConsoleShellProps) {
  return (
    <div
      className="relative w-full max-w-[1550px] h-full max-h-full mx-auto select-none flex flex-col items-center justify-center"
      id="pixel-console-hud-root"
    >
      {/* BOTTOM-LEFT CORNER PERCHED SPIDEY MASCOT */}
      <div className="absolute -left-3 sm:-left-4 -bottom-3 sm:-bottom-4 z-40">
        <SpideyCornerSprite onClick={() => onSelectCartridge('dashboard')} />
      </div>

      {/* 
        MAIN LIGHT BLUE OUTER HUD CHASSIS
        - Fits within parent viewport
        - Heavily distorted & stepped 8-bit pixelated perimeter lines
      */}
      <div
        className="w-full h-full max-h-full bg-[#2c85d8] border-[3px] sm:border-[7px] border-black p-1 xs:p-2 sm:p-2.5 md:p-3.5
                   shadow-[inset_3px_3px_0_0_#7ec7ff,inset_-3px_-3px_0_0_#104172,4px_5px_0_0_#000,6px_10px_0_0_rgba(0,0,0,0.5)]
                   relative z-20 flex flex-col justify-between"
        style={{
          // Distorted, jagged 8-bit stepped pixel boundary
          clipPath: `polygon(
            0 16px, 6px 16px, 6px 10px, 12px 10px, 12px 6px, 18px 6px, 18px 0,
            calc(50% - 60px) 0, calc(50% - 60px) 4px, calc(50% - 40px) 4px, calc(50% - 40px) 0,
            calc(100% - 18px) 0, calc(100% - 18px) 6px, calc(100% - 12px) 6px, calc(100% - 12px) 10px, calc(100% - 6px) 10px, calc(100% - 6px) 16px, 100% 16px,
            100% calc(50% - 40px), calc(100% - 4px) calc(50% - 40px), calc(100% - 4px) calc(50% + 40px), 100% calc(50% + 40px),
            100% calc(100% - 16px), calc(100% - 6px) calc(100% - 16px), calc(100% - 6px) calc(100% - 10px), calc(100% - 12px) calc(100% - 10px), calc(100% - 12px) calc(100% - 6px), calc(100% - 18px) calc(100% - 6px), calc(100% - 18px) 100%,
            calc(50% + 40px) 100%, calc(50% + 40px) calc(100% - 4px), calc(50% - 40px) calc(100% - 4px), calc(50% - 40px) 100%,
            18px 100%, 18px calc(100% - 6px), 12px calc(100% - 6px), 12px calc(100% - 10px), 6px calc(100% - 10px), 6px calc(100% - 16px), 0 calc(100% - 16px),
            0 calc(50% + 40px), 4px calc(50% + 40px), 4px calc(50% - 40px), 0 calc(50% - 40px)
          )`,
        }}
      >
        {/* Console Content Root */}
        {children}
      </div>
    </div>
  );
}
