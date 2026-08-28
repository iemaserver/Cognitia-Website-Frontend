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
import { awsService } from '../../services/awsService';

interface DashboardCartridgeProps {
  onNavigate?: (id: CartridgeId) => void;
}

export function DashboardCartridge({ onNavigate }: DashboardCartridgeProps) {
  const activeLeadTeam = awsService.getActiveLeadTeam();
  const isLoggedIn = !!activeLeadTeam;

  const handleNav = (id: CartridgeId) => {
    sound.playClick();
    if (onNavigate) {
      onNavigate(id);
    }
  };

  return (
    <div
      className="flex flex-col h-full justify-between items-center text-center gap-3 sm:gap-4 md:gap-5 select-none px-2 sm:px-4 py-2 sm:py-3 max-w-6xl mx-auto w-full"
      id="cartridge-main-view"
    >
      {/* 1. Top Section: Prominent Big COGNITIA Logo & Event Badges */}
      <div className="flex flex-col items-center justify-center space-y-2 pt-1 w-full shrink-0">
        <div className="relative group flex items-center justify-center w-full max-w-[580px] sm:max-w-[750px] md:max-w-[880px] transition-all duration-300">
          <img
            src="/dashboard_logo.png"
            alt="COGNITIA 2K26"
            className="w-full h-auto max-h-[105px] sm:max-h-[135px] md:max-h-[160px] object-contain drop-shadow-[0_6px_28px_rgba(126,199,255,0.45)] filter brightness-105 contrast-105 transition-all duration-300 group-hover:brightness-115 group-hover:drop-shadow-[0_8px_36px_rgba(126,199,255,0.7)]"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Event Meta Badges */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap pt-0.5">
          <span className="inline-flex items-center gap-1.5 bg-[#142338] text-[#7ec7ff] border border-[#1f4066] font-silkscreen text-[10.5px] sm:text-[11.5px] px-3 py-1 rounded-sm shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            <span className="h-2 w-2 rounded-full bg-[#7ec7ff] animate-pulse shadow-[0_0_6px_#7ec7ff]" />
            HACKATHON 2026
          </span>
          <span className="inline-flex items-center gap-1.5 bg-[#1e2f18] text-[#a7d38a] border border-[#2f4f24] font-silkscreen text-[10.5px] sm:text-[11.5px] px-3 py-1 rounded-sm shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            <Sparkles className="h-3 w-3 text-[#f4c151]" />
            OFFICIAL STAGE
          </span>
          <span className="inline-flex items-center gap-1.5 bg-[#2b182b] text-[#ff77e9] border border-[#522352] font-silkscreen text-[10.5px] sm:text-[11.5px] px-3 py-1 rounded-sm shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            <Zap className="h-3 w-3 text-[#ff77e9]" />
            24-HR SPRINT
          </span>
        </div>
      </div>

      {/* Prominent REGISTER YOUR TEAM NOW CTA Button */}
      <a
        href="https://forms.gle/ZZKRsiC9ejDJSw9A9"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => sound.playClick()}
        className="w-full max-w-lg mx-auto bg-[#182a1b] hover:bg-[#223d27] border-2 border-[#a7d38a] hover:border-[#86efac] text-[#a7d38a] hover:text-white font-pixel text-[11px] xs:text-xs sm:text-sm uppercase py-2.5 sm:py-3 px-3 sm:px-5 rounded-xs shadow-[0_0_22px_rgba(167,211,138,0.45),3px_3px_0_0_#000] flex items-center justify-center gap-2 sm:gap-2.5 transition-all transform hover:scale-[1.02] cursor-pointer whitespace-nowrap"
      >
        <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-[#86efac] animate-pulse shrink-0" />
        <span>REGISTER YOUR TEAM NOW</span>
        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#86efac] shrink-0" />
      </a>

      {/* 2. Key Stat Metrics Grid (3 Main Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 w-full">
        {/* PRIZE POOL */}
        <div
          className="p-3.5 sm:p-4 rounded-lg bg-[#141618] border-[2.5px] border-black flex flex-col justify-between items-center text-center
                     shadow-[inset_2px_2px_0_0_#2b2e30,inset_-2px_-2px_0_0_#0a0b0c,3px_3px_0_0_rgba(0,0,0,0.6)]
                     transition-transform hover:-translate-y-1 hover:border-[#f4c151]"
        >
          <div className="flex items-center gap-1.5 text-[#f4c151] pb-1">
            <Award className="h-4.5 w-4.5 text-[#f4c151]" />
            <span className="font-silkscreen text-[13px] sm:text-[14.5px] uppercase tracking-wider text-[#d4af37] font-bold">
              PRIZE POOL
            </span>
          </div>

          <div className="py-2">
            <span className="font-display font-extrabold text-[32px] sm:text-[38px] md:text-[42px] text-[#a7d38a] block tracking-wider drop-shadow-[0_0_12px_rgba(167,211,138,0.45)] leading-none">
              ₹20,000
            </span>
            <span className="font-silkscreen text-[12.5px] sm:text-[13.5px] text-[#8fa892] mt-2 block font-medium">
              ₹20,000 Total Cash &amp; Bounties
            </span>
          </div>

          <div className="w-full pt-2 border-t border-[#23272a]">
            <span className="font-silkscreen text-[11.5px] sm:text-[12.5px] text-[#9aa0b0]">
              ₹10K / ₹5K / ₹3K + ₹2K Bounties
            </span>
          </div>
        </div>

        {/* PARTICIPANTS */}
        <div
          className="p-3.5 sm:p-4 rounded-lg bg-[#141618] border-[2.5px] border-black flex flex-col justify-between items-center text-center
                     shadow-[inset_2px_2px_0_0_#2b2e30,inset_-2px_-2px_0_0_#0a0b0c,3px_3px_0_0_rgba(0,0,0,0.6)]
                     transition-transform hover:-translate-y-1 hover:border-[#7ec7ff]"
        >
          <div className="flex items-center gap-1.5 text-[#7ec7ff] pb-1">
            <Users className="h-4.5 w-4.5 text-[#7ec7ff]" />
            <span className="font-silkscreen text-[13px] sm:text-[14.5px] uppercase tracking-wider text-[#6fb3d9] font-bold">
              SELECTED BUILDERS
            </span>
          </div>

          <div className="py-2">
            <span className="font-display font-extrabold text-[32px] sm:text-[38px] md:text-[42px] text-[#7ec7ff] block tracking-wider drop-shadow-[0_0_12px_rgba(126,199,255,0.45)] leading-none">
              80 HACKERS
            </span>
            <span className="font-silkscreen text-[12.5px] sm:text-[13.5px] text-[#9ad4ff] mt-2 block font-medium">
              Curated Elite Cohort
            </span>
          </div>

          <div className="w-full pt-2 border-t border-[#23272a]">
            <span className="font-silkscreen text-[11.5px] sm:text-[12.5px] text-[#9aa0b0]">
              2 to 4 Members Per Team
            </span>
          </div>
        </div>

        {/* SPRINT DURATION */}
        <div
          className="p-3.5 sm:p-4 rounded-lg bg-[#141618] border-[2.5px] border-black flex flex-col justify-between items-center text-center
                     shadow-[inset_2px_2px_0_0_#2b2e30,inset_-2px_-2px_0_0_#0a0b0c,3px_3px_0_0_rgba(0,0,0,0.6)]
                     transition-transform hover:-translate-y-1 hover:border-[#f2933d]"
        >
          <div className="flex items-center gap-1.5 text-[#f2933d] pb-1">
            <Zap className="h-4.5 w-4.5 text-[#f2933d]" />
            <span className="font-silkscreen text-[13px] sm:text-[14.5px] uppercase tracking-wider text-[#e68a35] font-bold">
              SPRINT DURATION
            </span>
          </div>

          <div className="py-2">
            <span className="font-display font-extrabold text-[32px] sm:text-[38px] md:text-[42px] text-[#f4c151] block tracking-wider drop-shadow-[0_0_12px_rgba(244,193,81,0.45)] leading-none">
              24 HOURS
            </span>
            <span className="font-silkscreen text-[12.5px] sm:text-[13.5px] text-[#ffd17d] mt-2 block font-medium">
              Non-Stop Building &amp; Mentorship
            </span>
          </div>

          <div className="w-full pt-2 border-t border-[#23272a]">
            <span className="font-silkscreen text-[11.5px] sm:text-[12.5px] text-[#9aa0b0]">
              Ideate &bull; Build &bull; Ship &bull; Win
            </span>
          </div>
        </div>
      </div>

      {/* 4. Challenge Highlights & Feature Spotlight Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
        {/* Track Spotlight Box */}
        <div className="bg-[#121417] border border-[#23272b] p-3 rounded space-y-1.5 shadow-[3px_3px_0_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between">
            <span className="font-silkscreen text-[11.5px] text-[#f4c151] flex items-center gap-1.5 uppercase font-bold">
              <Trophy className="w-4 h-4 text-[#f4c151]" /> FEATURED TRACKS
            </span>
            <button
              onClick={() => handleNav('tracks')}
              className="font-silkscreen text-[10.5px] text-[#7ec7ff] hover:text-[#00f0ff] hover:underline flex items-center gap-1 cursor-pointer"
            >
              VIEW ALL <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="font-silkscreen text-[11px] sm:text-[12px] text-gray-300 leading-relaxed">
            Choose from <strong className="text-[#00f0ff]">NLP &amp; Vision</strong>, <strong className="text-[#f4c151]">Blockchain &amp; Security</strong>, <strong className="text-[#a7d38a]">Geospatial Intelligence</strong>, <strong className="text-[#ff77e9]">Autonomous AI</strong>, or <strong className="text-[#ff5555]">FinTech</strong>.
          </p>
        </div>

        {/* Rules & Code of Conduct Spotlight Box */}
        <div className="bg-[#121417] border border-[#23272b] p-3 rounded space-y-1.5 shadow-[3px_3px_0_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between">
            <span className="font-silkscreen text-[11.5px] text-[#a7d38a] flex items-center gap-1.5 uppercase font-bold">
              <ShieldAlert className="w-4 h-4 text-[#a7d38a]" /> RULES &amp; ETHICS
            </span>
            <button
              onClick={() => handleNav('rules')}
              className="font-silkscreen text-[10.5px] text-[#7ec7ff] hover:text-[#00f0ff] hover:underline flex items-center gap-1 cursor-pointer"
            >
              READ RULES <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="font-silkscreen text-[11px] sm:text-[12px] text-gray-300 leading-relaxed">
            All project code must be initiated within the 24-hour sprint window. Teams of 2–4 members permitted with original work.
          </p>
        </div>
      </div>
    </div>
  );
}