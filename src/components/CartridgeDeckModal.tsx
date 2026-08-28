import {
  X,
  LayoutDashboard,
  ShieldAlert,
  Code,
  Calendar,
  Sparkles,
  Users,
  Award,
  HelpCircle,
  Check,
} from 'lucide-react';
import { CartridgeId, Cartridge } from '../types';
import { sound } from '../utils/audio';

interface CartridgeDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCartridge: CartridgeId;
  onSelectCartridge: (id: CartridgeId) => void;
}

const CARTRIDGES: Cartridge[] = [
  {
    id: 'dashboard',
    title: 'COGNITIA 2026',
    code: 'ROM-001',
    romSize: '512 KB',
    genre: 'Main Arena & Stats',
    iconName: 'Sparkles',
    description: 'Event highlights, Rs.40K+ prize pool, 80 participants, and 30-hour sprint details.',
  },
  {
    id: 'rules',
    title: 'RULES & REGULATIONS',
    code: 'ROM-002',
    romSize: '256 KB',
    genre: 'Protocol & Rubric',
    iconName: 'ShieldAlert',
    description: 'Official rules, team limits, AI disclosure, and judging criteria.',
  },
  {
    id: 'tracks',
    title: 'COMPETITION TRACKS',
    code: 'ROM-003',
    romSize: '256 KB',
    genre: 'Bounty Domains',
    iconName: 'Code',
    description: '5 specialized tracks covering NLP & CV, Blockchain & Cybersecurity, Geospatial Intelligence, AI Autonomous Systems, and FinTech.',
  },
  {
    id: 'timeline',
    title: 'TIMELINE & SCHEDULE',
    code: 'ROM-004',
    romSize: '128 KB',
    genre: 'Sprint Milestones',
    iconName: 'Calendar',
    description: '48-hour event schedule, workshop times, and submission deadlines in UTC.',
  },
  {
    id: 'sponsors',
    title: 'SPONSOR ALLIANCES',
    code: 'ROM-005',
    romSize: '256 KB',
    genre: 'Partners & Grants',
    iconName: 'Sparkles',
    description: 'Titanium & Gold sponsors providing cloud compute, tool licenses, and bounties.',
  },
  {
    id: 'members',
    title: 'HACKER DIRECTORY',
    code: 'ROM-006',
    romSize: '512 KB',
    genre: 'Teams & Builders',
    iconName: 'Users',
    description: 'Official patrons, faculty conveners, program coordinators, and student team leads.',
  },
  {
    id: 'prizes',
    title: 'PRIZES & BOUNTIES',
    code: 'ROM-007',
    romSize: '256 KB',
    genre: 'Cash & Hardware Pool',
    iconName: 'Award',
    description: '$50,000 prize pool, podium cups, and $3,000 category bounties.',
  },
  {
    id: 'faq',
    title: 'FREQUENTLY ASKED FAQ',
    code: 'ROM-008',
    romSize: '128 KB',
    genre: 'Knowledge Base',
    iconName: 'HelpCircle',
    description: 'Comprehensive answers to common questions about eligibility, tech stacks, and rules.',
  },
];

export function CartridgeDeckModal({
  isOpen,
  onClose,
  currentCartridge,
  onSelectCartridge,
}: CartridgeDeckModalProps) {
  if (!isOpen) return null;

  const handleSelect = (id: CartridgeId) => {
    sound.playBoot();
    onSelectCartridge(id);
    onClose();
  };

  const getIcon = (id: CartridgeId) => {
    switch (id) {
      case 'dashboard': return <LayoutDashboard className="h-4 w-4 text-[#f4c151]" />;
      case 'rules': return <ShieldAlert className="h-4 w-4 text-[#f2933d]" />;
      case 'tracks': return <Code className="h-4 w-4 text-[#a7d38a]" />;
      case 'timeline': return <Calendar className="h-4 w-4 text-[#6fb3d9]" />;
      case 'sponsors': return <Sparkles className="h-4 w-4 text-[#f4c151]" />;
      case 'members': return <Users className="h-4 w-4 text-[#6ee7b7]" />;
      case 'prizes': return <Award className="h-4 w-4 text-[#f2933d]" />;
      case 'faq': return <HelpCircle className="h-4 w-4 text-[#cfe8ff]" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none"
      id="cartridge-deck-modal"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-xl border-[5px] border-[var(--color-shell-border-outer)]
                   bg-gradient-to-b from-[var(--color-shell-fill)] to-[var(--color-shell-border-inner)] p-4
                   pixel-shadow-shell space-y-3"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#1f3a5f]">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[11px] text-[#cfe8ff]">CARTRIDGE DECK</span>
            <span className="bg-[#0f2133] text-[#78a6c8] font-silkscreen text-[9px] px-1.5 py-0.5 rounded border border-[#1f3a5f]">
              8 AVAILABLE
            </span>
          </div>
          <button
            id="btn-close-cartridge-deck"
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="h-8 w-8 rounded-lg bg-[var(--color-badge-white)] border-[3px] border-[var(--color-shell-border-inner)]
                       flex items-center justify-center text-[#1c1c1c] shadow-[2px_2px_0_0_rgba(0,0,0,0.4)]
                       active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
          >
            <X className="h-4 w-4 stroke-[3]" />
          </button>
        </div>

        {/* Cartridge List */}
        <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
          {CARTRIDGES.map((cart) => {
            const isLoaded = currentCartridge === cart.id;
            return (
              <div
                key={cart.id}
                id={`cartridge-slot-${cart.id}`}
                onClick={() => handleSelect(cart.id)}
                className={`p-2.5 rounded-lg border-[2px] cursor-pointer transition-none flex items-center justify-between gap-3
                  ${
                    isLoaded
                      ? 'bg-[#18314e] border-[var(--color-cta-from)] shadow-[3px_3px_0_0_#4a3410] translate-x-[2px]'
                      : 'bg-[#284a6b] border-[#18314b] text-[#cfe8ff] hover:bg-[#325a80] shadow-[2px_2px_0_0_rgba(0,0,0,0.4)]'
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-[#142333] border-2 border-[#1f3a5f] flex items-center justify-center shrink-0">
                    {getIcon(cart.id)}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-pixel text-[9px] text-[#f4c151] truncate">{cart.title}</span>
                      <span className="font-silkscreen text-[7.5px] text-[#8ea7c2]">[{cart.code}]</span>
                    </div>
                    <p className="font-silkscreen text-[8px] text-[#cbd5e1] truncate mt-0.5">{cart.description}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  {isLoaded ? (
                    <span className="flex items-center gap-1 rounded bg-[#1e2f18] px-2 py-0.5 border border-[#2f4f24] font-pixel text-[7.5px] text-[#a7d38a]">
                      <Check className="h-2.5 w-2.5" /> ACTIVE
                    </span>
                  ) : (
                    <span className="rounded bg-[#1c2d3d] px-2 py-0.5 border border-[#2b445c] font-pixel text-[7.5px] text-[#cfe8ff]">
                      LOAD
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info in modal */}
        <div className="pt-2 border-t-2 border-[#1f3a5f] flex items-center justify-between text-[8px] font-silkscreen text-[#78a6c8]">
          <span>SELECT TO SWAP VIEWPORT</span>
          <span className="text-[#a7d38a]">HOT-SWAP READY</span>
        </div>
      </div>
    </div>
  );
}
