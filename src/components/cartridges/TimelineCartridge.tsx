import React from 'react';
import { Calendar, Clock, Radio, Terminal, Sparkles } from 'lucide-react';

interface TimelineEvent {
  date: string;
  time: string;
  title: string;
  description: string;
  badge?: string;
  highlight?: boolean;
}

const DAY_1_EVENTS: TimelineEvent[] = [
  {
    date: 'SEPT 11',
    time: '3:30 PM',
    title: 'Reporting & Registration',
    description: 'Participant check in and team verification',
    badge: 'GATE OPEN',
  },
  {
    date: 'SEPT 11',
    time: '4:00 PM - 4:30 PM',
    title: 'Opening Ceremony & Welcome',
    description: 'Speech; Introduction to Cognitia and the hackathon',
    badge: 'CEREMONY',
  },
  {
    date: 'SEPT 11',
    time: '4:30 PM - 5:00 PM',
    title: 'Problem Statement Reveal',
    description: 'GitHub Repository Setup and Controlled Code Submission Setup',
    badge: 'SETUP',
  },
  {
    date: 'SEPT 11',
    time: '5:00 PM',
    title: 'Hackathon Begins',
    description: 'Let the building begin!',
    badge: 'START 🚀',
    highlight: true,
  },
  {
    date: 'SEPT 11',
    time: '11:00 PM - 12:00 AM',
    title: 'Interactive Activity 1',
    description: 'Details to be revealed during the event',
    badge: 'FUN SESSION',
  },
];

const DAY_2_EVENTS: TimelineEvent[] = [
  {
    date: 'SEPT 12',
    time: '5:00 AM - 6:00 AM',
    title: 'Interactive Activity 2',
    description: 'Details to be revealed during the event',
    badge: 'FUN SESSION',
  },
  {
    date: 'SEPT 12',
    time: '1:00 PM',
    title: 'Hackathon Ends',
    description: 'Final submission of projects',
    badge: 'STOP CODING 🏁',
    highlight: true,
  },
  {
    date: 'SEPT 12',
    time: '1:00 PM - 2:30 PM',
    title: 'Round 1 Evaluation',
    description: 'Initial project evaluation',
    badge: 'JURY EVALUATION',
  },
  {
    date: 'SEPT 12',
    time: '3:30 PM - 5:00 PM',
    title: 'Round 2 Evaluation',
    description: 'Presentation by shortlisted 10 teams',
    badge: 'FINALS 🎤',
    highlight: true,
  },
  {
    date: 'SEPT 12',
    time: '5:00 PM - 6:00 PM',
    title: 'Results & Prize Distribution',
    description: 'Winner announcement, trophies, certificates, goodies and swags',
    badge: 'CEREMONY 🏆',
    highlight: true,
  },
];

export function TimelineCartridge() {
  const renderEventCard = (evt: TimelineEvent, idx: number) => {
    const isHighlight = evt.highlight;
    return (
      <div
        key={idx}
        className={`p-3 sm:p-3.5 rounded-md border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          isHighlight
            ? 'bg-[#181b22] border-[#f4c151] shadow-[0_0_15px_rgba(244,193,81,0.2)]'
            : 'bg-[#0b0e11]/80 border-[#2b3545] hover:border-[#38bdf8]/60'
        }`}
      >
        {/* Date, Time & Badge Column */}
        <div className="flex items-center gap-2 sm:w-2/5 shrink-0 flex-wrap">
          <span className="font-pixel text-[9px] sm:text-[10px] bg-[#1a2332] text-[#38bdf8] border border-[#2b4466] px-2 py-0.5 rounded-xs font-bold">
            📅 {evt.date}
          </span>
          <span className={`font-pixel text-[11px] sm:text-[12px] px-2.5 py-1 rounded-xs border font-mono ${
            isHighlight
              ? 'bg-[#2b2210] text-[#f4c151] border-[#544422]'
              : 'bg-[#141a24] text-[#cfe8ff] border-[#203248]'
          }`}>
            {evt.time}
          </span>
          {evt.badge && (
            <span className={`font-silkscreen text-[8px] px-2 py-0.5 rounded-xs border font-bold uppercase ${
              isHighlight
                ? 'bg-[#241a10] text-[#f2933d] border-[#48321b]'
                : 'bg-[#14202c] text-[#86efac] border-[#223d2b]'
            }`}>
              {evt.badge}
            </span>
          )}
        </div>

        {/* Title & Description Column */}
        <div className="grow sm:w-3/5">
          <h4 className={`font-pixel text-[12px] sm:text-[14px] ${
            isHighlight ? 'text-[#f4c151]' : 'text-white'
          }`}>
            {evt.title}
          </h4>
          {evt.description && (
            <p className="font-silkscreen text-[9px] sm:text-[10px] text-[#cfe8ff] mt-0.5 leading-relaxed">
              {evt.description}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full justify-between items-center text-center gap-3 select-none p-2 sm:p-4 overflow-y-auto overflow-x-hidden max-w-full w-full" id="cartridge-timeline">
      {/* Header */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 pb-2.5 border-b border-[#ef4444]/30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[11px] sm:text-[13px] text-[#ef4444] tracking-wider uppercase flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#ef4444]" />
            COGNITIA 2026 OFFICIAL TIMELINE
          </span>
          <span className="bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 backdrop-blur-md font-silkscreen text-[8.5px] px-2 py-0.5 rounded-sm font-bold">
            CONFIRMED DATES
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-silkscreen text-[8.5px] text-[#38bdf8] bg-[#38bdf8]/10 border border-[#38bdf8]/30 backdrop-blur-md px-2 py-1 rounded-sm">
          <Clock className="h-3.5 w-3.5 text-[#38bdf8]" />
          <span>24-HOUR SPRINT SCHEDULE</span>
        </div>
      </div>

      {/* Main Banner */}
      <div className="w-full bg-[#0a0c0e]/40 backdrop-blur-md border border-[#38bdf8]/30 rounded-md p-3 sm:p-4 text-left space-y-1.5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-silkscreen text-[9px] sm:text-[10px] text-[#ef4444] font-bold uppercase tracking-wider block">
              OFFICIAL HACKATHON DATES
            </span>
            <h3 className="font-pixel text-[16px] sm:text-[20px] text-white">
              SEPTEMBER 11TH – SEPTEMBER 12TH, 2026
            </h3>
          </div>
          <span className="bg-[#182418] text-[#86efac] border border-[#25522b] font-silkscreen text-[8.5px] px-2.5 py-1 rounded-xs flex items-center gap-1">
            <Radio className="h-3 w-3 text-[#4ade80] animate-ping" /> LIVE EVENT AGENDA
          </span>
        </div>
        <p className="font-silkscreen text-[9px] sm:text-[10px] text-[#93c5fd]">
          Venue: IEM Aegis Building, College More, Salt Lake Sector V, Kolkata. Please review the 2-day schedule below.
        </p>
      </div>

      {/* Timeline List Grouped By Date */}
      <div className="w-full grow overflow-y-auto space-y-4 text-left pr-1 max-h-[60vh]">
        {/* DAY 1 SECTION */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 border-b border-[#38bdf8]/30 pb-1.5 pt-1">
            <Sparkles className="h-4 w-4 text-[#38bdf8]" />
            <span className="font-pixel text-[12px] sm:text-[13px] text-[#38bdf8] uppercase tracking-wider">
              DAY 1: FRIDAY, SEPTEMBER 11, 2026
            </span>
            <span className="bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 font-silkscreen text-[8px] px-2 py-0.5 rounded-xs font-bold">
              SPRINT LAUNCH
            </span>
          </div>
          <div className="space-y-2">
            {DAY_1_EVENTS.map(renderEventCard)}
          </div>
        </div>

        {/* DAY 2 SECTION */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 border-b border-[#f4c151]/30 pb-1.5 pt-1">
            <Sparkles className="h-4 w-4 text-[#f4c151]" />
            <span className="font-pixel text-[12px] sm:text-[13px] text-[#f4c151] uppercase tracking-wider">
              DAY 2: SATURDAY, SEPTEMBER 12, 2026
            </span>
            <span className="bg-[#f4c151]/10 text-[#f4c151] border border-[#f4c151]/30 font-silkscreen text-[8px] px-2 py-0.5 rounded-xs font-bold">
              FINALS &amp; RESULTS
            </span>
          </div>
          <div className="space-y-2">
            {DAY_2_EVENTS.map(renderEventCard)}
          </div>
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
