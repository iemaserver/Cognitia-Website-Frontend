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
    color: '#f4c151',
    borderColor: '#f4c151',
    bgColor: 'rgba(244, 193, 81, 0.05)',
    badgeBg: 'rgba(244, 193, 81, 0.15)',
    summary: 'Mandatory registration details, team size boundaries, venue pass rules, dress attire, and confirmation fee details.',
    rules: [
      'Participants must complete the registration process with accurate personal, institutional, contact details.',
      'Each participating team must consist of 2-4 members.',
      'Participants must carry their valid college ID and hackathon ID/badge throughout the event.',
      'Attendance may be monitored throughout the hackathon, including during overnight hours.',
      'Participants must remain within the designated hackathon venue during the event unless permission is granted by the organizers.',
      'Participants must follow proper dress attire including proper full trousers all throughout the hackathon.',
      'Selected teams are required to pay ₹250 to confirm their selection. A cashback of ₹50 will be provided to each selected team after payment.',
    ],
    enforcement: 'Inaccurate details, refusal of ID verification, or non-compliance with venue rules will invalidate team selection.',
  },
  {
    id: 'rule-submission',
    title: 'Hackathon & Submission Rules',
    category: 'SUBMISSION',
    status: 'ENFORCED',
    icon: GitBranch,
    color: '#00f0ff',
    borderColor: '#00f0ff',
    bgColor: 'rgba(0, 240, 255, 0.05)',
    badgeBg: 'rgba(0, 240, 255, 0.15)',
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
    color: '#a7d38a',
    borderColor: '#a7d38a',
    bgColor: 'rgba(167, 211, 138, 0.05)',
    badgeBg: 'rgba(167, 211, 138, 0.15)',
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
    color: '#f2933d',
    borderColor: '#f2933d',
    bgColor: 'rgba(242, 147, 61, 0.05)',
    badgeBg: 'rgba(242, 147, 61, 0.15)',
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
    color: '#ff77e9',
    borderColor: '#ff77e9',
    bgColor: 'rgba(255, 119, 233, 0.05)',
    badgeBg: 'rgba(255, 119, 233, 0.15)',
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
    <div className="flex flex-col h-full justify-between gap-3 select-none p-3 sm:p-5 overflow-y-auto" id="cartridge-rules">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between pb-3 border-b-2 border-[#2b2e30] gap-2 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[13px] sm:text-[16px] text-[#f4c151] flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#f4c151]" />
              RULES &amp; ETHICS PROTOCOL
            </span>
            <span className="bg-[#241818] text-[#f2933d] border border-[#422525] font-silkscreen text-[9.5px] px-2 py-0.5 rounded-xs font-bold">
              OFFICIAL REVISED PROTOCOL 2026
            </span>
          </div>
          <p className="font-silkscreen text-[10px] sm:text-[11px] text-[#8f9396] mt-0.5">
            Strict guidelines governing registration, team composition, GitHub submissions, safety, conduct, and fee structure.
          </p>
        </div>
        <div className="flex items-center gap-2 font-silkscreen text-[9.5px] text-[#a7d38a] bg-[#142417] border border-[#25522b] px-2.5 py-1 rounded-xs shrink-0">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#a7d38a]" />
          <span>6 DOMAINS ENFORCED</span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-left my-auto shrink-0">
        {/* Left Column: Rule Categories List (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <span className="font-silkscreen text-[10.5px] text-[#8f9396] uppercase tracking-wider flex items-center gap-1.5 px-1">
            <Sparkles className="h-3.5 w-3.5 text-[#f4c151]" /> RULE DOMAINS (6)
          </span>

          <div className="space-y-1.5">
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
                    borderColor: isSelected ? item.color : '#2b2e30',
                    backgroundColor: isSelected ? item.bgColor : '#141618',
                    boxShadow: isSelected ? `0 0 10px ${item.badgeBg}` : 'none',
                  }}
                  className={`w-full text-left p-2.5 rounded-md border-2 transition-all cursor-pointer flex items-center justify-between gap-2.5 group`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      style={{
                        backgroundColor: isSelected ? item.badgeBg : '#1c2024',
                        borderColor: item.color,
                      }}
                      className="w-8 h-8 rounded border flex items-center justify-center shrink-0"
                    >
                      <ItemIcon className="h-4 w-4" style={{ color: item.color }} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-pixel text-[11px] sm:text-[12px] text-white truncate group-hover:text-[#cfe8ff]">
                        {item.title}
                      </h4>
                      <span
                        className="font-silkscreen text-[8.5px] sm:text-[9px] block truncate mt-0.5"
                        style={{ color: item.color }}
                      >
                        {item.category} &bull; {item.status}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      isSelected ? 'translate-x-1' : 'opacity-40 group-hover:opacity-100'
                    }`}
                    style={{ color: item.color }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Rule Category Detailed View (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <div
            style={{
              borderColor: activeCategory.color,
              backgroundColor: '#121417',
            }}
            className="w-full h-full p-4 rounded-lg border-2 shadow-[inset_2px_2px_0_0_#2b2e30,inset_-2px_-2px_0_0_#0a0b0c,4px_4px_0_0_rgba(0,0,0,0.7)] flex flex-col justify-between space-y-3.5"
          >
            {/* Category Header */}
            <div className="space-y-1.5 border-b border-[#23272b] pb-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      backgroundColor: activeCategory.badgeBg,
                      borderColor: activeCategory.color,
                    }}
                    className="w-7 h-7 rounded border flex items-center justify-center"
                  >
                    <IconComponent className="h-4 w-4" style={{ color: activeCategory.color }} />
                  </div>
                  <h3 className="font-pixel text-[15px] sm:text-[17px] text-white">
                    {activeCategory.title}
                  </h3>
                </div>

                <span
                  style={{
                    color: activeCategory.color,
                    borderColor: activeCategory.color,
                    backgroundColor: activeCategory.badgeBg,
                  }}
                  className="font-silkscreen text-[9.5px] px-2 py-0.5 rounded-xs border font-bold uppercase tracking-wider"
                >
                  {activeCategory.status}
                </span>
              </div>
              <p className="font-silkscreen text-[10.5px] sm:text-[11px] text-[#8f9396] leading-relaxed">
                {activeCategory.summary}
              </p>
            </div>

            {/* Rules Bullet List */}
            <div className="space-y-2 grow overflow-y-auto pr-1 max-h-[260px]">
              <span className="font-pixel text-[10px] text-[#a7d38a] flex items-center gap-1.5 uppercase">
                <Terminal className="h-3.5 w-3.5 text-[#a7d38a]" /> OFFICIAL MANDATES &amp; CLAUSES ({activeCategory.rules.length})
              </span>

              <div className="space-y-1.5">
                {activeCategory.rules.map((clause, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 bg-[#090b0d] border border-[#1b1f24] p-2 rounded text-[11px] sm:text-[12px] font-silkscreen text-[#cfe8ff] leading-relaxed"
                  >
                    <span
                      className="font-pixel text-[9px] px-1.5 py-0.5 rounded-xs border shrink-0 mt-0.5"
                      style={{
                        color: activeCategory.color,
                        borderColor: activeCategory.color,
                        backgroundColor: activeCategory.badgeBg,
                      }}
                    >
                      #{idx + 1}
                    </span>
                    <span>{clause}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enforcement Warning Box */}
            <div
              className="p-2.5 rounded border space-y-1"
              style={{
                backgroundColor: 'rgba(28, 20, 20, 0.9)',
                borderColor: '#542222',
              }}
            >
              <span className="font-silkscreen text-[9px] text-[#ef4444] uppercase tracking-wider flex items-center gap-1 font-bold">
                <AlertTriangle className="h-3.5 w-3.5 text-[#ef4444]" /> ENFORCEMENT &amp; PENALTY PROTOCOL:
              </span>
              <p className="font-silkscreen text-[10px] sm:text-[10.5px] text-[#e0a2a2] leading-relaxed">
                {activeCategory.enforcement}
              </p>
            </div>

            {/* Official Judging Rubric Footer */}
            <div className="pt-2 border-t border-[#23272b]">
              <span className="font-silkscreen text-[9.5px] text-[#8f9396] uppercase block mb-1.5 flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-[#f4c151]" /> OFFICIAL JUDGING RUBRIC:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {JUDGING_CRITERIA.map((crit, i) => (
                  <div key={i} className="p-1.5 rounded bg-[#161a1e] border border-[#272d34] text-center">
                    <span className="font-pixel text-[11px] text-[#a7d38a] block">{crit.weight}</span>
                    <span className="font-silkscreen text-[8.5px] text-[#cfe8ff] block truncate">{crit.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Banner */}
      <div className="w-full py-2 px-3 rounded bg-[#101214] border border-[#232629] flex items-center justify-between font-silkscreen text-[9.5px] text-[#7d8285] shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-[#f4c151]" />
          <span>CARTRIDGE: RULES.ROM // ALL RULES ENFORCED BY ORGANIZING COMMITTEE</span>
        </div>
        <span className="text-[#a7d38a]">VERDICT IS FINAL</span>
      </div>
    </div>
  );
}

