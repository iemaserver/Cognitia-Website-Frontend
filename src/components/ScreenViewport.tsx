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
      {/* Futuristic Spidey Outline Background Screen (Always covers viewport & children) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-md select-none"
        aria-hidden="true"
      >
        {/* Deep futuristic dark base */}
        <div className="absolute inset-0 bg-[#0d0f12]" />

        {/* Spidey Outline Logo Graphic (1.5x bigger & centered) */}
        <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4 pointer-events-none">
          <img
            src="/spideybg.jpg"
            alt=""
            decoding="async"
            className="w-full h-full max-w-[630px] max-h-[630px] sm:max-w-[720px] sm:max-h-[720px] object-contain object-center mix-blend-screen opacity-25 sm:opacity-30 filter brightness-110 contrast-125 saturate-150"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Cyber micro-grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(126,199,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(126,199,255,0.025)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>





      {/* Screen Interactive Render Area */}
      <div className="relative z-20 flex-1 min-h-0 h-full flex flex-col overflow-y-auto overflow-x-hidden pr-0.5 sm:pr-1 touch-pan-y retro-viewport-scroll">
        {children}
      </div>



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
