import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Award,
  Terminal,
  UserCheck,
  GitBranch,
  Cpu,
  Ban,
  Users,
  Utensils,
  ChevronRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { sound } from '../../utils/audio';

export interface RuleCategory {
  id: string;
  title: string;
  category: string;
  status: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  bgColor: string;
  badgeBg: string;
  summary: string;
  rules: string[];
  enforcement: string;
}

const OFFICIAL_RULES: RuleCategory[] = [
  {
    id: 'rule-reg',
    title: 'Registration & Participation',
    category: 'REGISTRATION',
    status: 'MANDATORY',
    icon: UserCheck,
    color: '#38bdf8',
    borderColor: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.05)',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    summary: 'Mandatory registration details, team size boundaries, venue pass rules, dress attire, and confirmation fee details.',
    rules: [
      'Participants must complete the registration process with accurate personal, institutional, contact details.',
      'Each participating team must consist of 2-4 members.',
      'Participants must carry their valid college ID and hackathon ID/badge throughout the event.',
      'Attendance may be monitored throughout the hackathon, including during overnight hours.',
      'Participants must remain within the designated hackathon venue during the event unless permission is granted by the organizers.',
      'Participants must follow proper dress attire including proper full trousers all throughout the hackathon.',
      'Phase 2 registration fee is ₹200 for external/mixed teams, and ₹0 (Free Waiver) for verified IEM/UEM student teams.',
    ],
    enforcement: 'Inaccurate details, refusal of ID verification, or non-compliance with venue rules will invalidate team selection.',
  },
  {
    id: 'rule-submission',
    title: 'Hackathon & Submission Rules',
    category: 'SUBMISSION',
    status: 'ENFORCED',
    icon: GitBranch,
    color: '#ef4444',
    borderColor: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.05)',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    summary: 'Official track problem statements, sprint duration development, designated GitHub repositories, and strict freeze deadlines.',
    rules: [
      'Teams must work on the officially released problem statements and follow the designated hackathon tracks.',
      'All projects must be developed within the official hackathon duration.',
      'Teams must use the designated GitHub repository for their project.',
      'Code submissions will be monitored through the designated GitHub repositories.',
      'Teams must submit the required GitHub repository, project documentation, and presentation/demo files before the submission deadline.',
      'Submissions after the official deadline may not be considered for evaluation.',
      'Once submissions are frozen, no further changes or code additions will be permitted unless explicitly allowed by the organizers.',
    ],
    enforcement: 'Late submissions or repositories showing commits outside the sprint timeframe will be ineligible for evaluation.',
  },
  {
    id: 'rule-tech',
    title: 'Technology & Code',
    category: 'CODE ETHICS',
    status: 'REQUIRED',
    icon: Cpu,
    color: '#38bdf8',
    borderColor: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.05)',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    summary: 'Permitted frameworks, AI tool compliance, open-source licensing, strict anti-plagiarism mandates, and project defense.',
    rules: [
      'Participants may use technologies, frameworks, APIs, and tools permitted under the official hackathon rules.',
      'Any use of AI tools, APIs, and open source resources must comply with the rules announced by the organizers.',
      'Projects must comply with applicable copyright and open source licensing requirements.',
      'Plagiarism, copied projects, and pre existing projects presented as original hackathon work are strictly prohibited.',
      'Teams must be able to explain and demonstrate their submitted project.',
    ],
    enforcement: 'Pre-built projects or plagiarized codebases will face immediate disqualification without evaluation.',
  },
  {
    id: 'rule-venue',
    title: 'Venue, Safety & Conduct',
    category: 'SAFETY PROTOCOL',
    status: 'ENFORCED',
    icon: ShieldAlert,
    color: '#ef4444',
    borderColor: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.05)',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    summary: 'Discipline, responsible power equipment usage, facility property care, workspace cleanliness, and resting area rules.',
    rules: [
      'Participants must maintain discipline and follow instructions given by organizers and volunteers.',
      'Participants must use electrical equipment, power outlets, and venue infrastructure responsibly.',
      'Participants must not damage or misuse any venue property or equipment.',
      'Participants must follow all security and emergency protocols communicated by the organizers.',
      'Participants must keep their workspaces clean and dispose of waste in designated bins.',
      'Participants must respect designated sleeping/resting areas and maintain cleanliness of the venue and washrooms.',
    ],
    enforcement: 'Damage to venue property or unsafe electrical load misuse will result in instant ejection from campus.',
  },
  {
    id: 'rule-substances',
    title: 'Prohibited Substances',
    category: 'ZERO TOLERANCE',
    status: 'STRICT BAN',
    icon: Ban,
    color: '#ef4444',
    borderColor: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.08)',
    badgeBg: 'rgba(239, 68, 68, 0.2)',
    summary: 'Absolute prohibition of smoking, vaping, alcohol, and intoxicating substances with instant expulsion.',
    rules: [
      'Smoking, vaping, consumption, possession, or distribution of alcohol and other intoxicating substances is strictly prohibited within the event premises.',
      'Participants are not permitted to enter or remain at the event under the influence of alcohol or any intoxicating substance.',
      'Any violation of this rule may result in immediate disqualification and removal from the event premises.',
    ],
    enforcement: 'Zero tolerance: Immediate disqualification, security escort off premises, and reporting to institutional authorities.',
  },
  {
    id: 'rule-conduct',
    title: 'General Conduct',
    category: 'COMMUNITY',
    status: 'MANDATORY',
    icon: Users,
    color: '#38bdf8',
    borderColor: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.05)',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    summary: 'Mutual respect, zero harassment, personal belongings responsibility, organizer authority, and scheduled meals.',
    rules: [
      'Participants must treat fellow participants, organizers, volunteers, judges, mentors, and guests with respect.',
      'Any form of harassment, misconduct, cheating, plagiarism, substance abuse, or deliberate disruption of the event may result in disqualification.',
      'Participants are responsible for their personal belongings.',
      'Participants must follow all instructions and announcements issued by the organizing committee throughout the event.',
      'Participants will be provided with food at appropriate timings.',
    ],
    enforcement: 'Misconduct or harassment towards any peer or organizer results in immediate revocation of hackathon credentials.',
  },
];

const JUDGING_CRITERIA = [
  { label: 'TECHNICAL CRAFT', weight: '30%', desc: 'Architecture, code quality, stability, and implementation depth.' },
  { label: 'TRACK INNOVATION', weight: '25%', desc: 'Originality, creative problem solving, and domain relevance.' },
  { label: 'UTILITY & IMPACT', weight: '25%', desc: 'Real-world practical utility, viability, and target solution fit.' },
  { label: 'DEMO & PRESENTATION', weight: '20%', desc: 'Live working demonstration, documentation, and technical defense.' },
];

export function RulesCartridge() {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  const activeCategory = OFFICIAL_RULES[selectedIdx] || OFFICIAL_RULES[0];
  const IconComponent = activeCategory.icon;

  return (
    <div className="flex flex-col h-full gap-3 select-none p-2 sm:p-4 overflow-y-auto overflow-x-hidden max-w-full w-full" id="cartridge-rules">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 pb-2.5 border-b border-[#ef4444]/30 shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#ef4444]" />
          <span className="font-pixel text-[11px] sm:text-[13px] text-[#ef4444] tracking-wider uppercase">
            Rules &amp; Ethics Protocol
          </span>
        </div>
        <span className="font-silkscreen text-[8.5px] text-[#38bdf8] border border-[#38bdf8]/40 bg-[#38bdf8]/10 backdrop-blur-md px-2 py-0.5 rounded-sm">
          OFFICIAL 2026 · 6 DOMAINS
        </span>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-left flex-1 min-h-0">

        {/* Left: Category List */}
        <div className="lg:col-span-4 flex flex-col gap-1.5 overflow-y-auto">
          <span className="font-silkscreen text-[8.5px] text-[#38bdf8]/70 uppercase tracking-widest px-0.5">Select Domain</span>
          <div className="space-y-1">
            {OFFICIAL_RULES.map((item, idx) => {
              const ItemIcon = item.icon;
              const isSelected = selectedIdx === idx;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    sound.playBlip(500 + idx * 60);
                    setSelectedIdx(idx);
                  }}
                  style={{
                    borderColor: isSelected ? item.color : 'rgba(56,189,248,0.15)',
                    backgroundColor: isSelected ? `${item.bgColor}` : 'rgba(10,12,14,0.35)',
                    boxShadow: isSelected ? `0 0 12px ${item.badgeBg}` : 'none',
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-md border backdrop-blur-md transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <div
                    style={{ backgroundColor: isSelected ? item.badgeBg : 'rgba(255,255,255,0.04)', borderColor: item.color }}
                    className="w-6 h-6 rounded border flex items-center justify-center shrink-0"
                  >
                    <ItemIcon className="h-3 w-3" style={{ color: item.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-pixel text-[9.5px] sm:text-[10px] text-white truncate group-hover:text-[#cfe8ff]">
                      {item.title}
                    </div>
                    <div className="font-silkscreen text-[7.5px] truncate mt-0.5" style={{ color: item.color }}>
                      {item.category}
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${isSelected ? 'translate-x-0.5' : 'opacity-30 group-hover:opacity-70'}`}
                    style={{ color: item.color }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Rule Detail */}
        <div className="lg:col-span-8 flex flex-col gap-2.5 overflow-y-auto">
          {/* Category header card */}
          <div
            style={{ borderColor: activeCategory.color, backgroundColor: activeCategory.bgColor }}
            className="p-2.5 sm:p-3 rounded-lg border backdrop-blur-md flex items-start justify-between gap-2.5 shrink-0 break-words"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                style={{ backgroundColor: activeCategory.badgeBg, borderColor: activeCategory.color }}
                className="w-7 h-7 rounded border flex items-center justify-center shrink-0"
              >
                <IconComponent className="h-3.5 w-3.5" style={{ color: activeCategory.color }} />
              </div>
              <div className="min-w-0">
                <div className="font-pixel text-[11px] sm:text-[12.5px] text-white leading-tight">{activeCategory.title}</div>
                <p className="font-silkscreen text-[8.5px] text-[#8f9396] mt-0.5 leading-snug break-words">{activeCategory.summary}</p>
              </div>
            </div>
            <span
              style={{ color: activeCategory.color, borderColor: activeCategory.color, backgroundColor: activeCategory.badgeBg }}
              className="font-silkscreen text-[7.5px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider shrink-0"
            >
              {activeCategory.status}
            </span>
          </div>

          {/* Clauses list */}
          <div className="space-y-1.5 flex-1 overflow-y-auto">
            <div className="font-silkscreen text-[8.5px] text-[#38bdf8]/70 uppercase tracking-widest flex items-center gap-1 px-0.5">
              <Terminal className="h-3 w-3" /> Mandates &amp; Clauses ({activeCategory.rules.length})
            </div>
            {activeCategory.rules.map((clause, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 bg-[#0a0c0e]/40 backdrop-blur-md border border-[#38bdf8]/15 hover:border-[#38bdf8]/30 p-2 sm:p-2.5 rounded-md transition-colors break-words"
              >
                <span
                  className="font-pixel text-[7.5px] px-1.5 py-0.5 rounded border shrink-0 mt-0.5"
                  style={{ color: activeCategory.color, borderColor: activeCategory.color, backgroundColor: activeCategory.badgeBg }}
                >
                  #{idx + 1}
                </span>
                <span className="font-silkscreen text-[9px] sm:text-[9.5px] text-[#cfe8ff] leading-snug break-words">{clause}</span>
              </div>
            ))}
          </div>

          {/* Enforcement notice */}
          <div className="p-2.5 rounded-md border border-[#ef4444]/30 bg-[#ef4444]/5 backdrop-blur-md flex items-start gap-2 shrink-0 break-words">
            <AlertTriangle className="h-3.5 w-3.5 text-[#ef4444] shrink-0 mt-0.5" />
            <div>
              <div className="font-silkscreen text-[8px] text-[#ef4444] uppercase tracking-wider font-bold mb-0.5">Enforcement</div>
              <p className="font-silkscreen text-[8.5px] text-[#fca5a5] leading-snug break-words">{activeCategory.enforcement}</p>
            </div>
          </div>

          {/* Judging rubric */}
          <div className="shrink-0">
            <div className="font-silkscreen text-[8.5px] text-[#38bdf8]/70 uppercase tracking-widest flex items-center gap-1 mb-1.5">
              <Award className="h-3 w-3 text-[#38bdf8]" /> Judging Rubric
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {JUDGING_CRITERIA.map((crit, i) => (
                <div key={i} className="p-2 rounded-md bg-[#0a0c0e]/40 backdrop-blur-md border border-[#38bdf8]/15 hover:border-[#38bdf8]/35 text-center transition-colors break-words">
                  <span className="font-pixel text-[11px] text-[#38bdf8] block">{crit.weight}</span>
                  <span className="font-silkscreen text-[7.5px] text-[#7dd3fc] block mt-0.5 leading-tight">{crit.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-1.5 px-2.5 rounded-md bg-[#0a0c0e]/30 backdrop-blur-md border border-[#ef4444]/20 flex items-center justify-between font-silkscreen text-[8px] shrink-0">
        <div className="flex items-center gap-1.5 text-[#7d8285]">
          <Terminal className="h-3 w-3 text-[#ef4444]" />
          <span>RULES.ROM · ALL RULES ENFORCED BY ORGANIZING COMMITTEE</span>
        </div>
        <span className="text-[#38bdf8]">VERDICT IS FINAL</span>
      </div>
    </div>
  );
}
