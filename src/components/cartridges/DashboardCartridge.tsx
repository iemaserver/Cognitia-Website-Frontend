import React from 'react';
import {
  Award,
  Users,
  Zap,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Trophy,
  UserPlus,
} from 'lucide-react';
import { CartridgeId } from '../../types';
import { sound } from '../../utils/audio';
import { firebaseService } from '../../services/firebaseService';

interface DashboardCartridgeProps {
  onNavigate?: (id: CartridgeId) => void;
}

export function DashboardCartridge({ onNavigate }: DashboardCartridgeProps) {
  const activeLeadTeam = firebaseService.getActiveLeadTeam();
  const isLoggedIn = !!activeLeadTeam;

  const handleNav = (id: CartridgeId) => {
    sound.playClick();
    if (onNavigate) {
      onNavigate(id);
    }
  };

  return (
    <div
      className="flex flex-col h-full justify-between items-center text-center gap-2 sm:gap-3 select-none px-1.5 sm:px-3 py-1 max-w-6xl mx-auto w-full overflow-x-hidden"
      id="cartridge-main-view"
    >
      {/* 1. Top Section: Big COGNITIA Logo with fitted top padding */}
      <div className="flex flex-col items-center justify-center space-y-1 pt-6 sm:pt-10 md:pt-12 w-full shrink-0">
        <div className="relative group flex items-center justify-center w-full max-w-[460px] sm:max-w-[580px] md:max-w-[700px] transition-all duration-300">
          <img
            src="/cognitia logo.png"
            alt="COGNITIA 2K26"
            className="w-full h-auto max-h-[220px] sm:max-h-[300px] md:max-h-[360px] object-contain drop-shadow-[0_4px_20px_rgba(239,68,68,0.45)] filter brightness-105 contrast-105 transition-all duration-300 group-hover:brightness-115 group-hover:drop-shadow-[0_6px_28px_rgba(239,68,68,0.7)]"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Prominent REGISTER YOUR TEAM NOW CTA Button */}
      <a
        href="https://forms.gle/ZZKRsiC9ejDJSw9A9"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => sound.playClick()}
        className="w-full max-w-md mx-auto bg-[#ef4444]/15 hover:bg-[#ef4444]/30 backdrop-blur-md border border-[#ef4444]/60 hover:border-[#ef4444] text-[#ef4444] hover:text-white font-pixel text-[10px] xs:text-[11px] sm:text-xs uppercase py-2 sm:py-2.5 px-3 rounded-md shadow-[0_0_20px_rgba(239,68,68,0.25)] flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] cursor-pointer whitespace-normal text-center leading-tight break-words"
      >
        <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#f87171] animate-pulse shrink-0" />
        <span>REGISTER YOUR TEAM NOW</span>
        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#f87171] shrink-0" />
      </a>

      {/* 2. Key Stat Metrics Grid (3 Main Cards - Fully Fitted & Compact Fonts) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3 w-full">
        {/* PRIZE POOL */}
        <div
          className="p-2.5 sm:p-3.5 rounded-md bg-[#0a0c0e]/30 backdrop-blur-md border border-[#ef4444]/25 hover:border-[#ef4444]/60 hover:bg-[#0a0c0e]/45 flex flex-col justify-between items-center text-center transition-all duration-300 hover:-translate-y-0.5 break-words"
        >
          <div className="flex items-center gap-1 text-[#ef4444] pb-0.5">
            <Award className="h-4 w-4 text-[#ef4444]" />
            <span className="font-silkscreen text-[11px] sm:text-[12.5px] uppercase tracking-wider text-[#ef4444] font-bold">
              PRIZE POOL
            </span>
          </div>

          <div className="py-1">
            <span className="font-display font-extrabold text-[24px] sm:text-[28px] md:text-[32px] text-[#f87171] block tracking-wider drop-shadow-[0_0_10px_rgba(239,68,68,0.45)] leading-none">
              ₹20,000
            </span>
            <span className="font-silkscreen text-[10px] sm:text-[11px] text-[#fca5a5] mt-1 block font-medium leading-tight">
              ₹20,000 Total Cash &amp; Bounties
            </span>
          </div>

          <div className="w-full pt-1.5 border-t border-[#ef4444]/20">
            <span className="font-silkscreen text-[9.5px] sm:text-[10.5px] text-[#38bdf8] block leading-tight">
              ₹10K / ₹5K / ₹3K + ₹2K Bounties
            </span>
          </div>
        </div>

        {/* PARTICIPANTS */}
        <div
          className="p-2.5 sm:p-3.5 rounded-md bg-[#0a0c0e]/30 backdrop-blur-md border border-[#38bdf8]/25 hover:border-[#38bdf8]/60 hover:bg-[#0a0c0e]/45 flex flex-col justify-between items-center text-center transition-all duration-300 hover:-translate-y-0.5 break-words"
        >
          <div className="flex items-center gap-1 text-[#38bdf8] pb-0.5">
            <Users className="h-4 w-4 text-[#38bdf8]" />
            <span className="font-silkscreen text-[11px] sm:text-[12.5px] uppercase tracking-wider text-[#38bdf8] font-bold">
              SELECTED BUILDERS
            </span>
          </div>

          <div className="py-1">
            <span className="font-display font-extrabold text-[24px] sm:text-[28px] md:text-[32px] text-[#38bdf8] block tracking-wider drop-shadow-[0_0_10px_rgba(56,189,248,0.45)] leading-none">
              80 HACKERS
            </span>
            <span className="font-silkscreen text-[10px] sm:text-[11px] text-[#7dd3fc] mt-1 block font-medium leading-tight">
              Curated Elite Cohort
            </span>
          </div>

          <div className="w-full pt-1.5 border-t border-[#38bdf8]/20">
            <span className="font-silkscreen text-[9.5px] sm:text-[10.5px] text-[#fca5a5] block leading-tight">
              2 to 4 Members Per Team
            </span>
          </div>
        </div>

        {/* SPRINT DURATION */}
        <div
          className="p-2.5 sm:p-3.5 rounded-md bg-[#0a0c0e]/30 backdrop-blur-md border border-[#ef4444]/25 hover:border-[#ef4444]/60 hover:bg-[#0a0c0e]/45 flex flex-col justify-between items-center text-center transition-all duration-300 hover:-translate-y-0.5 break-words"
        >
          <div className="flex items-center gap-1 text-[#ef4444] pb-0.5">
            <Zap className="h-4 w-4 text-[#ef4444]" />
            <span className="font-silkscreen text-[11px] sm:text-[12.5px] uppercase tracking-wider text-[#ef4444] font-bold">
              SPRINT DURATION
            </span>
          </div>

          <div className="py-1">
            <span className="font-display font-extrabold text-[24px] sm:text-[28px] md:text-[32px] text-[#ef4444] block tracking-wider drop-shadow-[0_0_10px_rgba(239,68,68,0.45)] leading-none">
              24 HOURS
            </span>
            <span className="font-silkscreen text-[10px] sm:text-[11px] text-[#fca5a5] mt-1 block font-medium leading-tight">
              Non-Stop Building &amp; Mentorship
            </span>
          </div>

          <div className="w-full pt-1.5 border-t border-[#ef4444]/20">
            <span className="font-silkscreen text-[9.5px] sm:text-[10.5px] text-[#38bdf8] block leading-tight">
              Ideate &bull; Build &bull; Ship &bull; Win
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}