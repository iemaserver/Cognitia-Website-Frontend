import { CartridgeId } from '../types';
import { sound } from '../utils/audio';

interface TopBarProps {
  currentCartridge: CartridgeId;
  onSelectCartridge: (id: CartridgeId) => void;
  onResetBoot: () => void;
}

export function TopBar({
  onResetBoot,
}: TopBarProps) {
  const handleClick = () => {
    sound.playBlip(740);
    onResetBoot();
  };

  return (
    <header
      className="relative flex items-center justify-center w-full h-[10px] z-40 shrink-0 select-none overflow-visible"
      id="console-top-bar"
    >
      {/* Big Overflowing Cognitia Crest Logo Badge into the Console Screen */}
      <button
        onClick={handleClick}
        type="button"
        className="group absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center px-4 transition-all duration-200 hover:scale-[1.04] active:scale-[0.97] cursor-pointer focus:outline-none"
        title="Cognitia 2026 - Return to Dashboard"
        aria-label="Cognitia 2026 Logo Badge"
      >
        <img
          src="/cognitia_logo.webp"
          alt="Cognitia Logo"
          width={535}
          height={75}
          decoding="async"
          className="w-auto h-16 sm:h-20 md:h-24 lg:h-28 max-w-[300px] sm:max-w-[420px] md:max-w-[520px] object-contain drop-shadow-[0_6px_26px_rgba(126,199,255,0.45)] filter brightness-110 contrast-105 transition-all duration-200 group-hover:brightness-125 group-hover:drop-shadow-[0_8px_32px_rgba(126,199,255,0.7)] pointer-events-none"
          referrerPolicy="no-referrer"
        />
      </button>
    </header>
  );
}





