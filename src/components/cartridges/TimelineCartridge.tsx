import { Calendar, Clock, Radio, Terminal } from 'lucide-react';

export function TimelineCartridge() {
  return (
    <div className="flex flex-col h-full justify-between items-center text-center gap-4 select-none p-3 sm:p-6" id="cartridge-timeline">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-2 border-b-2 border-[#2b2e30]">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[14px] sm:text-[16px] text-[#7ec7ff]">
            EVENT SCHEDULE &amp; TIMELINE
          </span>
          <span className="bg-[#182418] text-[#a7d38a] border border-[#254225] font-silkscreen text-[9.5px] sm:text-[10.5px] px-2 py-0.5 rounded-xs font-bold">
            STATUS: DATES CONFIRMED
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-silkscreen text-[9.5px] text-[#7d8285]">
          <Clock className="h-3.5 w-3.5 text-[#f4c151]" />
          <span>24-HOUR SPRINT CALIBRATION</span>
        </div>
      </div>

      {/* Center Event Date Announcement Card */}
      <div className="w-full max-w-xl p-6 sm:p-8 rounded-lg bg-[#141618] border-[3px] border-black shadow-[inset_3px_3px_0_0_#2b2e30,inset_-3px_-3px_0_0_#0a0b0c,4px_4px_0_0_rgba(0,0,0,0.7)] flex flex-col items-center justify-center my-auto space-y-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1b2533] border-2 border-[#7ec7ff] flex items-center justify-center shadow-[0_0_16px_rgba(126,199,255,0.3)]">
          <Calendar className="h-7 w-7 sm:h-8 sm:w-8 text-[#7ec7ff] animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="font-silkscreen text-[12px] sm:text-[13px] text-[#f4c151] uppercase tracking-widest block font-bold">
            [ OFFICIAL HACKATHON DATES ]
          </span>
          <h3 className="font-pixel text-[24px] sm:text-[28px] md:text-[34px] text-white tracking-wider">
            11TH – 12TH SEPTEMBER 2026
          </h3>
          <p className="font-silkscreen text-[11px] sm:text-[12.5px] text-[#9bb7d4] max-w-md mx-auto leading-relaxed">
            Mark your calendars for the 24-hour sprint at IEM Gurukul Building, Salt Lake Sector V, Kolkata. Detailed hour-by-hour schedule will be published prior to sprint launch.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <span className="inline-flex items-center gap-1.5 font-silkscreen text-[10.5px] sm:text-[11.5px] text-[#a7d38a] bg-[#1e2f18] border border-[#2f4f24] px-3.5 py-1.5 rounded-sm font-bold">
            <Radio className="h-3.5 w-3.5 animate-ping text-[#a7d38a]" />
            REGISTRATION IS LIVE &amp; OPEN
          </span>
        </div>
      </div>

      {/* Bottom Status */}
      <div className="w-full py-2 px-3 rounded bg-[#101214] border border-[#232629] flex items-center justify-between font-silkscreen text-[10px] text-[#7d8285]">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-[#7ec7ff]" />
          <span>CARTRIDGE: TIMELINE.ROM // EVENT DATES: 11-12 SEPT 2026</span>
        </div>
        <span className="text-[#a7d38a]">11-12 SEPT 2026</span>
      </div>
    </div>
  );
}
