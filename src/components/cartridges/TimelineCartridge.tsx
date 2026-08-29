import { Calendar, Clock, Radio, Terminal } from 'lucide-react';

export function TimelineCartridge() {
  return (
    <div className="flex flex-col h-full justify-between items-center text-center gap-3 select-none p-2 sm:p-4 overflow-y-auto overflow-x-hidden max-w-full w-full" id="cartridge-timeline">
      {/* Header */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 pb-2.5 border-b border-[#ef4444]/30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[11px] sm:text-[13px] text-[#ef4444] tracking-wider uppercase flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#ef4444]" />
            EVENT SCHEDULE &amp; TIMELINE
          </span>
          <span className="bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 backdrop-blur-md font-silkscreen text-[8.5px] px-2 py-0.5 rounded-sm font-bold">
            DATES CONFIRMED
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-silkscreen text-[8.5px] text-[#38bdf8] bg-[#38bdf8]/10 border border-[#38bdf8]/30 backdrop-blur-md px-2 py-1 rounded-sm">
          <Clock className="h-3.5 w-3.5 text-[#38bdf8]" />
          <span>24-HOUR SPRINT CALIBRATION</span>
        </div>
      </div>

      {/* Center Event Date Announcement Card */}
      <div className="w-full max-w-xl p-4 sm:p-6 rounded-md bg-[#0a0c0e]/35 backdrop-blur-md border border-[#38bdf8]/20 hover:border-[#38bdf8]/40 flex flex-col items-center justify-center my-auto space-y-3 transition-all break-words">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-md bg-[#38bdf8]/10 border border-[#38bdf8] flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.3)]">
          <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-[#38bdf8] animate-bounce" />
        </div>

        <div className="space-y-1.5">
          <span className="font-silkscreen text-[10px] sm:text-[11px] text-[#ef4444] uppercase tracking-widest block font-bold">
            OFFICIAL HACKATHON DATES
          </span>
          <h3 className="font-pixel text-[18px] sm:text-[22px] md:text-[26px] text-white tracking-wider leading-tight break-words">
            11TH – 12TH SEPTEMBER 2026
          </h3>
          <p className="font-silkscreen text-[9.5px] sm:text-[10.5px] text-[#7dd3fc] max-w-md mx-auto leading-snug break-words">
            Mark your calendars for the 24-hour sprint at IEM Gurukul Building, Salt Lake Sector V, Kolkata. Detailed hour-by-hour schedule will be published prior to sprint launch.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 font-silkscreen text-[9px] sm:text-[10px] text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/30 backdrop-blur-md px-3 py-1 rounded-md font-bold text-center break-words">
            <Radio className="h-3 w-3 animate-ping text-[#ef4444] shrink-0" />
            REGISTRATION IS LIVE &amp; OPEN
          </span>
        </div>
      </div>

      {/* Bottom Status */}
      <div className="w-full py-1.5 px-2.5 rounded-md bg-[#0a0c0e]/30 backdrop-blur-md border border-[#ef4444]/20 flex items-center justify-between font-silkscreen text-[8px] shrink-0">
        <div className="flex items-center gap-1.5 text-[#7d8285]">
          <Terminal className="h-3 w-3 text-[#ef4444]" />
          <span>TIMELINE.ROM · EVENT DATES: 11-12 SEPT 2026</span>
        </div>
        <span className="text-[#38bdf8]">11-12 SEPT 2026</span>
      </div>
    </div>
  );
}
