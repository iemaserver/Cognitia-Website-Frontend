import { useState, useMemo } from 'react';
import {
  HelpCircle,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Terminal,
  Sparkles,
  Search,
  X,
  Users,
  Cpu,
  UploadCloud,
  Trophy,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Headphones,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface FAQItem {
  id: number;
  category: 'GENERAL' | 'TEAMS' | 'TECHNICAL' | 'AI ETHICS' | 'SUBMISSION' | 'PRIZES' | 'HARDWARE';
  question: string;
  answer: string;
  highlights?: string[];
  actionLink?: { label: string; url: string; external?: boolean };
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 1,
    category: 'GENERAL',
    question: 'WHEN AND WHERE IS COGNITIA 2026 TAKING PLACE?',
    answer:
      'Cognitia 2026 takes place on 11th and 12th September 2026 at the IEM Gurukul Building, Salt Lake Sector V, Kolkata. It is an intensive 24-hour offline hackathon sprint.',
    highlights: ['11th-12th September 2026', 'IEM Gurukul Kolkata', '24-Hour Offline Sprint'],
  },
  {
    id: 2,
    category: 'GENERAL',
    question: 'IS THERE ANY REGISTRATION OR CONFIRMATION FEE?',
    answer:
      'Phase 2 offline round registration is completely FREE (₹0 Waiver) for verified IEM/UEM student teams. For external/mixed teams, the Phase 2 team entry fee is ₹200.',
    highlights: ['₹0 Free Waiver for IEM/UEM teams', '₹200 Phase 2 fee for external teams'],
  },
  {
    id: 3,
    category: 'TEAMS',
    question: 'WHAT ARE THE TEAM SIZE REQUIREMENTS?',
    answer:
      'Each participating team must consist of 2 to 4 members. Solo participation is not permitted. All team members must carry valid college IDs and official hackathon badges throughout the event.',
    highlights: ['2 to 4 members per team', 'No solo participation', 'Mandatory College ID & Badge'],
  },
  {
    id: 4,
    category: 'TECHNICAL',
    question: 'WHAT ARE THE 5 TRACKS AND WHEN ARE PROBLEM STATEMENTS RELEASED?',
    answer:
      'The 5 official tracks are: 1) Natural Language Processing & Computer Vision, 2) Blockchain and Cybersecurity, 3) Geospatial Predictive Intelligence, 4) AI Autonomous Systems, and 5) FinTech. Specific Problem Statements (PS) will be officially released on the day of the hackathon in Phase 2.',
    highlights: ['5 specialized tracks', 'PS released on day of hackathon', 'Phase 2 release'],
  },
  {
    id: 5,
    category: 'PRIZES',
    question: 'WHAT IS THE TOTAL PRIZE POOL AND BOUNTY STRUCTURE?',
    answer:
      'The total cash prize pool is ₹20,000! Winners receive ₹10,000 (1st Place), ₹5,000 (2nd Place), ₹3,000 (3rd Place), plus ₹2,000 in special domain bounties across competition tracks.',
    highlights: ['₹20,000 Total Cash Pool', '₹10K Winner / ₹5K Runner-Up', '₹2K Domain Bounties'],
  },
  {
    id: 6,
    category: 'TECHNICAL',
    question: 'WHAT ARE THE VENUE CONDUCT & DRESS CODE RULES?',
    answer:
      'Participants must follow proper dress attire including full trousers at all times throughout the hackathon. Attendance is monitored including overnight hours. Smoking, vaping, alcohol, or prohibited substances are strictly banned with instant disqualification.',
    highlights: ['Full trousers mandatory', 'Overnight attendance monitored', 'Strict zero-substance policy'],
  },
  {
    id: 7,
    category: 'SUBMISSION',
    question: 'WHAT ARE THE MANDATORY SUBMISSION DELIVERABLES?',
    answer:
      'Teams must work on the officially released problem statements using their designated GitHub repository. All project code must be developed within the 24-hour sprint. Final submission includes open-source code, project demo, and project defense.',
    highlights: ['Official Problem Statements', 'Designated GitHub repository', '24-Hour sprint duration'],
  },
  {
    id: 8,
    category: 'AI ETHICS',
    question: 'CAN WE USE AI TOOLS AND THIRD-PARTY APIS?',
    answer:
      'Yes! Permitted AI tools, open-source libraries, and APIs can be used provided all AI code assistance is transparently cited and disclosed in your team submission. Core project work must be created within the official sprint.',
    highlights: ['Permitted AI & APIs', 'Transparent AI citation', 'Original sprint code'],
  },
];

const CATEGORY_META: Record<
  string,
  { label: string; icon: typeof HelpCircle; color: string; bg: string; border: string }
> = {
  GENERAL: {
    label: 'GENERAL',
    icon: HelpCircle,
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.35)',
  },
  TEAMS: {
    label: 'TEAMS',
    icon: Users,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.35)',
  },
  TECHNICAL: {
    label: 'TECHNICAL',
    icon: Cpu,
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.35)',
  },
  'AI ETHICS': {
    label: 'AI ETHICS',
    icon: Sparkles,
    color: '#f87171',
    bg: 'rgba(248, 113, 113, 0.12)',
    border: 'rgba(248, 113, 113, 0.35)',
  },
  SUBMISSION: {
    label: 'SUBMISSION',
    icon: UploadCloud,
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.35)',
  },
  PRIZES: {
    label: 'PRIZES',
    icon: Trophy,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.35)',
  },
  HARDWARE: {
    label: 'HARDWARE',
    icon: Terminal,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.35)',
  },
};

export function FAQCartridge() {
  const [expandedIds, setExpandedIds] = useState<number[]>([1]);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<number, 'yes' | 'no'>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    sound.playBlip(expandedIds.includes(id) ? 450 : 700);
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleVote = (id: number, vote: 'yes' | 'no') => {
    sound.playCoin();
    setHelpfulVotes((prev) => ({ ...prev, [id]: vote }));
  };

  const handleCopyLink = (id: number, questionText: string) => {
    sound.playBlip(880);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}#faq-${id}`);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      className="flex flex-col h-full justify-between gap-2.5 select-none p-2 sm:p-4 overflow-y-auto overflow-x-hidden max-w-full w-full"
      id="cartridge-faq"
    >
      {/* Top Banner Header */}
      <div className="flex flex-col gap-1 pb-2 border-b border-[#ef4444]/30 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[11px] sm:text-[13px] text-[#ef4444] tracking-wider uppercase flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-[#ef4444]" />
                KNOWLEDGE BASE &amp; FAQ
              </span>
              <span className="bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 backdrop-blur-md font-silkscreen text-[8px] px-2 py-0.5 rounded-sm font-bold uppercase">
                OFFICIAL DIRECTORY
              </span>
            </div>
            <p className="font-silkscreen text-[8.5px] sm:text-[9px] text-[#9ca3af] mt-0.5 leading-snug break-words">
              Comprehensive guidelines on eligibility, teams, tools, AI policies, deliverables &amp; prizes.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="hidden lg:flex items-center gap-2 bg-[#0a0c0e]/50 border border-[#38bdf8]/20 backdrop-blur-md px-2 py-1 rounded-md text-[8px] font-silkscreen text-[#38bdf8]">
            <span className="flex items-center gap-1 text-[#ef4444]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse"></span>
              {FAQ_ITEMS.length} MODULES
            </span>
            <span className="text-[#38bdf8]/40">|</span>
            <span className="text-[#38bdf8]">24/7 SUPPORT</span>
          </div>
        </div>
      </div>

      {/* Main FAQ Accordion List */}
      <div className="space-y-1.5 grow overflow-y-auto pr-0.5">
        {FAQ_ITEMS.map((faq) => {
          const isExpanded = expandedIds.includes(faq.id);
          const meta = CATEGORY_META[faq.category];
          const CategoryIcon = meta?.icon || HelpCircle;
          const vote = helpfulVotes[faq.id];

          return (
            <div
              key={faq.id}
              id={`faq-${faq.id}`}
              style={{
                borderLeftColor: meta?.color || '#38bdf8',
                borderLeftWidth: '3px',
              }}
              className={`rounded-md border backdrop-blur-md transition-all overflow-hidden group/card break-words ${
                isExpanded
                  ? 'bg-[#0a0c0e]/60 border-[#38bdf8]/30 shadow-md'
                  : 'bg-[#0a0c0e]/35 border-[#38bdf8]/15 hover:bg-[#0a0c0e]/50 hover:border-[#38bdf8]/35'
              }`}
            >
              {/* Question Row Header */}
              <button
                type="button"
                onClick={() => toggleExpand(faq.id)}
                className="w-full p-2 sm:p-2.5 flex items-center justify-between text-left cursor-pointer gap-2 group/btn break-words"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 break-words">
                  {/* 8-Bit Pixel Pin Pointer on Question Header */}
                  <img
                    src={isExpanded ? '/red_pin.png' : '/white_pin.png'}
                    alt="pointer pin"
                    className={`w-3.5 h-3.5 object-contain pixelated shrink-0 transition-transform duration-150 ${
                      isExpanded
                        ? 'scale-110'
                        : 'opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5'
                    } pointer-events-none select-none`}
                    draggable={false}
                  />

                  {/* Category Tag */}
                  <span
                    style={{
                      backgroundColor: meta?.bg || 'rgba(56, 189, 248, 0.1)',
                      borderColor: meta?.border || '#38bdf8',
                      color: meta?.color || '#38bdf8',
                    }}
                    className="font-silkscreen text-[7.5px] sm:text-[8px] px-1.5 py-0.5 rounded-sm border flex items-center gap-1 shrink-0"
                  >
                    <CategoryIcon className="h-3 w-3" />
                    <span>{faq.category}</span>
                  </span>

                  {/* Question text */}
                  <span
                    className={`font-pixel text-[9.5px] sm:text-[10.5px] leading-snug transition-colors break-words flex-1 ${
                      isExpanded ? 'text-[#ef4444]' : 'text-[#cfe8ff] group-hover/btn:text-[#38bdf8]'
                    }`}
                  >
                    {faq.question}
                  </span>
                </div>

                {/* Toggle Indicator */}
                <div
                  className={`p-1 rounded-sm transition-transform duration-200 shrink-0 ${
                    isExpanded ? 'bg-[#ef4444]/15 text-[#ef4444]' : 'bg-[#0a0c0e] text-[#8f9396]'
                  }`}
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Expanded Answer Content */}
              {isExpanded && (
                <div className="px-3 sm:px-4 pb-3 pt-2 border-t border-[#ef4444]/20 bg-[#0a0c0e]/90 text-[10px] sm:text-[11px] font-silkscreen text-[#cfe8ff] leading-relaxed flex flex-col gap-2.5">
                  <p className="text-[#cfe8ff]">{faq.answer}</p>

                  {/* Highlighted tags */}
                  {faq.highlights && faq.highlights.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[8.5px] text-[#9ca3af] uppercase tracking-wider font-mono flex items-center gap-1">
                        <img src="/red_pin.png" alt="pin" className="w-3 h-3 pixelated" />
                        Key Takeaways:
                      </span>
                      {faq.highlights.map((h, i) => (
                        <span
                          key={i}
                          className="bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 text-[8.5px] px-2 py-0.5 rounded-sm font-mono flex items-center gap-1"
                        >
                          <span className="text-[#ef4444]">►</span>
                          <span>{h}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Interactive Action Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#38bdf8]/15 text-[9px]">
                    {/* Helpful Feedback */}
                    <div className="flex items-center gap-2 text-[#9ca3af]">
                      <span>Was this helpful?</span>
                      <button
                        type="button"
                        onClick={() => handleVote(faq.id, 'yes')}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-sm cursor-pointer border transition-colors ${
                          vote === 'yes'
                            ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8]'
                            : 'bg-[#0a0c0e] border-[#38bdf8]/20 hover:bg-[#38bdf8]/10 text-[#9ca3af]'
                        }`}
                      >
                        <ThumbsUp className="h-3 w-3" />
                        <span>YES</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVote(faq.id, 'no')}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-sm cursor-pointer border transition-colors ${
                          vote === 'no'
                            ? 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444]'
                            : 'bg-[#0a0c0e] border-[#ef4444]/20 hover:bg-[#ef4444]/10 text-[#9ca3af]'
                        }`}
                      >
                        <ThumbsDown className="h-3 w-3" />
                        <span>NO</span>
                      </button>
                      {vote && (
                        <span className="text-[#38bdf8] font-pixel text-[8.5px] flex items-center gap-1">
                          <img src="/red_pin.png" alt="pin" className="w-3 h-3 pixelated" />
                          THANKS FOR FEEDBACK!
                        </span>
                      )}
                    </div>

                    {/* Copy Link Button */}
                    <button
                      type="button"
                      onClick={() => handleCopyLink(faq.id, faq.question)}
                      className="flex items-center gap-1 bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/30 text-[#38bdf8] px-2 py-0.5 rounded-sm cursor-pointer transition-colors"
                    >
                      {copiedId === faq.id ? (
                        <>
                          <Check className="h-3 w-3 text-[#38bdf8]" />
                          <span className="text-[#38bdf8]">LINK COPIED!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>COPY LINK</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

