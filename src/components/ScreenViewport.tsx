import React from "react";
import { Terminal } from "lucide-react";
import { SpideyMenuButton } from "./SpideyMenuButton";

interface ScreenViewportProps {
  children: React.ReactNode;
  activeCartridgeId?: string;
  cartridgeName?: string;
  scanlinesEnabled?: boolean;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
}

export function ScreenViewport({
  children,
  activeCartridgeId = "dashboard",
  cartridgeName = "PIXEL HUD",
  scanlinesEnabled = true,
  isMenuOpen = false,
  onToggleMenu,
}: ScreenViewportProps) {
  return (
    <div
      className="relative flex-1 min-h-0 h-full flex flex-col rounded-md bg-[#222528]
                 border-[4px] sm:border-[5px] border-black shadow-[inset_4px_4px_0_0_#101113,inset_-4px_-4px_0_0_#383d42,0_4px_0_0_rgba(0,0,0,0.5)]
                 p-2.5 sm:p-3.5 md:p-4 overflow-visible"
      id="console-screen-viewport"
    >
      {/* Top-Right Hanging Upside-Down Spidey Spritesheet Menu Button (Prominent & 100% Unclipped) */}
      {onToggleMenu && (
        <div className="absolute top-1 sm:top-1.5 right-1.5 sm:right-3 translate-x-[8px] xs:translate-x-[18px] sm:translate-x-[33px] -translate-y-[25px] z-50 pointer-events-auto">
          <SpideyMenuButton isOpen={isMenuOpen} onClick={onToggleMenu} />
        </div>
      )}

      {/* Internal Viewport Header Bar */}
      {!isMenuOpen && (
        <div className="relative z-20 flex items-center justify-between pb-1 mb-1.5 sm:mb-2 border-b-[3px] border-black text-[9.5px] sm:text-[11px] font-silkscreen bg-[#1a1d20]/60 px-1.5 sm:px-2 py-1 rounded shrink-0 gap-1">
          <div className="flex items-center gap-1.5 min-w-0 max-w-[calc(100%-110px)] sm:max-w-none">
            <span className="inline-block h-2 w-2 sm:h-2.5 sm:w-2.5 bg-[#a7d38a] border border-black shadow-[0_0_4px_#a7d38a] shrink-0" />
            <span className="font-pixel text-[10.5px] sm:text-[12.5px] text-white tracking-wider truncate">
              {cartridgeName}
            </span>
            <span className="text-[#7d8285] text-[8.5px] sm:text-[10.5px] shrink-0 hidden xs:inline">
              [{activeCartridgeId.toUpperCase()}]
            </span>
          </div>
          <div className="flex items-center gap-1.5 pr-2 sm:pr-3 shrink-0">
            <span className="font-silkscreen text-[#a7d38a] text-[9.5px] sm:text-[11px] bg-[#142314] px-1.5 sm:px-2 py-0.5 border border-[#244224]">
              READY
            </span>
          </div>
        </div>
      )}

      {/* Screen Interactive Render Area */}
      <div className="relative z-20 flex-1 min-h-0 h-full flex flex-col overflow-y-auto overflow-x-hidden pr-0.5 sm:pr-1 touch-pan-y retro-viewport-scroll">
        {children}
      </div>

      {/* Permanent Viewport Terminal Status Bar (Shown on cartridges, hidden during boot loading, PWA prompt, swap, and menu deck) */}
      {!isMenuOpen && activeCartridgeId !== 'BOOT' && activeCartridgeId !== 'PWA' && activeCartridgeId !== 'SWAP' && (
        <div className="relative z-20 mt-1.5 pt-1.5 pb-1 px-2.5 bg-[#0d0f12] border-t-2 border-black font-silkscreen flex flex-wrap items-center justify-between gap-1.5 text-[11px] sm:text-[12.5px] shrink-0 rounded-b">
          <div className="flex items-center gap-1.5 min-w-0">
            <Terminal className="h-4 w-4 text-[#a7d38a] shrink-0" />
            <span className="text-[#8e9396] truncate">
              STATUS: <span className="text-[#a7d38a] font-bold">SYSTEM ARMED &amp; ONLINE</span>
            </span>
          </div>
          <div className="text-[#606467] shrink-0 text-[10px] sm:text-[11.5px]">
            HOTKEYS: [TAB] MENU &bull; [R] REBOOT &bull; [M] SOUND
          </div>
        </div>
      )}

      {/* Prominent CRT Scanlines Overlay (Layered on top of all screen viewport content including logos) */}
      {scanlinesEnabled && (
        <div
          className="pointer-events-none absolute inset-0 z-40 opacity-30 scanline-overlay rounded-md overflow-hidden"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
