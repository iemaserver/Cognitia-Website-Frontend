interface CountdownData {
  days: number;
  hours: number;
  mins: number;
  secs: number;
}

interface BottomBarProps {
  statusText?: string;
  isCountdown?: boolean;
  countdown?: CountdownData;
  onOpenQuickMenu?: () => void;
  onReboot?: () => void;
}

export function BottomBar({
  countdown = { days: 12, hours: 8, mins: 44, secs: 20 },
}: BottomBarProps) {
  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <footer
      className="relative flex items-center justify-center pt-1.5 sm:pt-2 px-1 z-30 w-full overflow-hidden"
      id="console-bottom-bar"
    >
      <div className="flex items-center justify-center max-w-4xl w-full">
        {/* Full-Width Countdown Timer Boxes */}
        <div className="w-full flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-3 min-w-0 pl-7 xs:pl-9 sm:pl-0 pr-0.5 sm:pr-0">
          {/* DAYS BOX */}
          <div
            className="grow min-w-0 flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 bg-[#181c22] border-2 sm:border-[3px] border-black rounded-md sm:rounded-xl py-1 sm:py-2 px-0.5 xs:px-1.5 sm:px-4
                       shadow-[inset_2px_2px_0_0_#101114,inset_-2px_-2px_0_0_#383c44,0_0_10px_rgba(0,0,0,0.5)]"
          >
            <span className="font-pixel text-[10px] xs:text-[12px] sm:text-[18px] md:text-[21px] text-[#00f0ff] tracking-tight xs:tracking-wider leading-none drop-shadow-[0_0_8px_rgba(0,240,255,0.7)] font-bold shrink-0">
              {pad(countdown.days)}
            </span>
            <span className="font-silkscreen text-[6.5px] xs:text-[8px] sm:text-[11px] md:text-[12px] text-[#f4c151] uppercase font-bold tracking-tight xs:tracking-wider leading-none shrink-0">
              DAYS
            </span>
          </div>

          {/* HOURS BOX */}
          <div
            className="grow min-w-0 flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 bg-[#181c22] border-2 sm:border-[3px] border-black rounded-md sm:rounded-xl py-1 sm:py-2 px-0.5 xs:px-1.5 sm:px-4
                       shadow-[inset_2px_2px_0_0_#101114,inset_-2px_-2px_0_0_#383c44,0_0_10px_rgba(0,0,0,0.5)]"
          >
            <span className="font-pixel text-[10px] xs:text-[12px] sm:text-[18px] md:text-[21px] text-[#00f0ff] tracking-tight xs:tracking-wider leading-none drop-shadow-[0_0_8px_rgba(0,240,255,0.7)] font-bold shrink-0">
              {pad(countdown.hours)}
            </span>
            <span className="font-silkscreen text-[6.5px] xs:text-[8px] sm:text-[11px] md:text-[12px] text-[#f4c151] uppercase font-bold tracking-tight xs:tracking-wider leading-none shrink-0">
              HOURS
            </span>
          </div>

          {/* MINS BOX */}
          <div
            className="grow min-w-0 flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 bg-[#181c22] border-2 sm:border-[3px] border-black rounded-md sm:rounded-xl py-1 sm:py-2 px-0.5 xs:px-1.5 sm:px-4
                       shadow-[inset_2px_2px_0_0_#101114,inset_-2px_-2px_0_0_#383c44,0_0_10px_rgba(0,0,0,0.5)]"
          >
            <span className="font-pixel text-[10px] xs:text-[12px] sm:text-[18px] md:text-[21px] text-[#00f0ff] tracking-tight xs:tracking-wider leading-none drop-shadow-[0_0_8px_rgba(0,240,255,0.7)] font-bold shrink-0">
              {pad(countdown.mins)}
            </span>
            <span className="font-silkscreen text-[6.5px] xs:text-[8px] sm:text-[11px] md:text-[12px] text-[#f4c151] uppercase font-bold tracking-tight xs:tracking-wider leading-none shrink-0">
              MINS
            </span>
          </div>

          {/* SECONDS BOX */}
          <div
            className="grow min-w-0 flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 bg-[#181c22] border-2 sm:border-[3px] border-black rounded-md sm:rounded-xl py-1 sm:py-2 px-0.5 xs:px-1.5 sm:px-4
                       shadow-[inset_2px_2px_0_0_#101114,inset_-2px_-2px_0_0_#383c44,0_0_10px_rgba(0,0,0,0.5)]"
          >
            <span className="font-pixel text-[10px] xs:text-[12px] sm:text-[18px] md:text-[21px] text-[#00f0ff] tracking-tight xs:tracking-wider leading-none drop-shadow-[0_0_8px_rgba(0,240,255,0.7)] font-bold shrink-0">
              {pad(countdown.secs)}
            </span>
            <span className="font-silkscreen text-[6.5px] xs:text-[8px] sm:text-[11px] md:text-[12px] text-[#f4c151] uppercase font-bold tracking-tight xs:tracking-wider leading-none shrink-0">
              SECS
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}


