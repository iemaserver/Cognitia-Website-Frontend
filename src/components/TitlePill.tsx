import { sound } from '../utils/audio';

interface TitlePillProps {
  logoUrl?: string;
  onClick?: () => void;
}

export function TitlePill({ logoUrl = '/cognitia_logo.png', onClick }: TitlePillProps) {
  const handleClick = () => {
    sound.playBlip(740);
    if (onClick) onClick();
  };

  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      id="console-title-pill"
      onClick={onClick ? handleClick : undefined}
      className={`group relative flex items-center justify-center w-full max-w-[500px] sm:max-w-[720px] md:max-w-[880px] lg:max-w-[1020px] px-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none select-none overflow-visible ${onClick ? 'cursor-pointer' : ''}`}
      aria-label="Cognitia Logo - Click to reset dashboard"
      title="Click to return to Dashboard"
    >
      <img
        src={logoUrl}
        alt="Cognitia Logo"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-auto h-70 sm:h-74 md:h-78 lg:h-82 object-contain filter brightness-110 contrast-105 transition-all duration-200 group-hover:brightness-125 pointer-events-none"
        referrerPolicy="no-referrer"
      />
      {/* invisible spacer to preserve button width/click target if needed */}
      <span className="opacity-0 h-11 pointer-events-none">.</span>
    </Comp>
  );
}


