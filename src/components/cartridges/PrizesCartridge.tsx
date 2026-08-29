import { useState } from 'react';
import { Trophy, Crown, Sparkles, IndianRupee, ShieldCheck, Gift, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { sound } from '../../utils/audio';

interface PrizeCardData {
  id: string;
  rank: string;
  amount: string;
  rawAmount: number;
  title: string;
  category: 'podium' | 'track';
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  badge: string;
  tagline: string;
  perks: string[];
  isGrand?: boolean;
}

const PODIUM_PRIZES: PrizeCardData[] = [
  {
    id: 'rank-1',
    rank: '1ST PLACE GRAND CHAMPION',
    amount: '₹10,000',
    rawAmount: 10000,
    title: 'OVERALL HACKATHON WINNER',
    category: 'podium',
    color: '#ef4444',
    bgColor: 'rgba(10, 12, 14, 0.35)',
    borderColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.3)',
    badge: 'GOLD TROPHY',
    tagline: 'Highest overall jury score across technical execution, originality & demo presentation.',
    isGrand: true,
    perks: [
      '₹10,000 Cash Prize (Direct UPI / Wire)',
      'Cognitia Grand Champion Gold Trophy',
      'Official Certificate of Honor for Team',
      'Mentorship & Winner Hall of Fame Entry',
    ],
  },
  {
    id: 'rank-2',
    rank: '2ND PLACE RUNNER UP',
    amount: '₹5,000',
    rawAmount: 5000,
    title: 'SECOND PLACE WINNER',
    category: 'podium',
    color: '#38bdf8',
    bgColor: 'rgba(10, 12, 14, 0.35)',
    borderColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.2)',
    badge: 'SILVER MEDAL',
    tagline: 'Exceptional build quality, sleek architecture & strong problem impact.',
    perks: [
      '₹5,000 Cash Prize (Direct UPI / Wire)',
      'Cognitia Runner-Up Silver Trophy',
      'Official Certificate of Excellence',
      'Dev Swag Box & Hall of Fame Entry',
    ],
  },
  {
    id: 'rank-3',
    rank: '3RD PLACE PODIUM',
    amount: '₹3,000',
    rawAmount: 3000,
    title: 'THIRD PLACE WINNER',
    category: 'podium',
    color: '#f87171',
    bgColor: 'rgba(10, 12, 14, 0.35)',
    borderColor: '#f87171',
    glowColor: 'rgba(248, 113, 113, 0.2)',
    badge: 'BRONZE MEDAL',
    tagline: 'Outstanding technical implementation and creative solution design.',
    perks: [
      '₹3,000 Cash Prize (Direct UPI / Wire)',
      'Cognitia Podium Bronze Trophy',
      'Official Certificate of Achievement',
      'Dev Swag Pack & Hall of Fame Entry',
    ],
  },
];

const TRACK_BOUNTIES: PrizeCardData[] = [
  {
    id: 'track-1',
    rank: 'SPECIAL TRACK BOUNTY',
    amount: '₹2,000',
    rawAmount: 2000,
    title: 'BEST SOLUTION & EXECUTION AWARD',
    category: 'track',
    color: '#38bdf8',
    bgColor: 'rgba(10, 12, 14, 0.35)',
    borderColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.2)',
    badge: 'TRACK BOUNTY',
    tagline: 'Single prize awarded to the team with the most innovative solution and best technical execution combined.',
    perks: [
      '₹2,000 Pure Cash Bounty',
      'Best Solution & Execution Certificate',
      'Cognitia Featured Project Showcase',
    ],
  },
];

export function PrizesCartridge() {
  const [selectedPrizeId, setSelectedPrizeId] = useState<string | null>('rank-1');

  const renderCard = (prize: PrizeCardData) => {
    const isSelected = selectedPrizeId === prize.id;
    const isGrand = prize.isGrand;

    return (
      <div
        key={prize.id}
        onClick={() => {
          sound.playBlip(850);
          setSelectedPrizeId(prize.id);
        }}
        style={{
          borderColor: isSelected ? prize.color : 'rgba(56,189,248,0.15)',
          boxShadow: isSelected ? `0 0 16px ${prize.glowColor}` : undefined,
        }}
        className={`p-3.5 sm:p-4 rounded-md border backdrop-blur-md flex flex-col justify-between cursor-pointer transition-all duration-200 group relative overflow-hidden h-full bg-[#0a0c0e]/35 ${
          isSelected ? 'z-10 ring-1 ring-white/10' : 'hover:border-[#38bdf8]/40'
        }`}
      >
        {/* Integrated Top Banner for Grand Champion */}
        {isGrand && (
          <div className="bg-[#ef4444] text-white font-pixel text-[8.5px] px-2.5 py-1 -mx-3.5 -mt-3.5 sm:-mx-4 sm:-mt-4 mb-2 flex items-center justify-between font-bold shadow-xs">
            <span className="flex items-center gap-1">
              <Crown className="h-3.5 w-3.5 text-white shrink-0" />
              GRAND CHAMPION PRIZE
            </span>
            <span className="font-silkscreen text-[8px] bg-black/30 text-white px-1.5 py-0.5 rounded-xs">
              TOP RANK
            </span>
          </div>
        )}

        <div className="space-y-1.5">
          {/* Header Badge & Pin */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <img
                src={isSelected ? '/red_pin.png' : '/white_pin.png'}
                alt="pointer pin"
                className={`w-3.5 h-3.5 object-contain pixelated transition-transform ${
                  isSelected ? 'scale-110' : 'opacity-60 group-hover:opacity-100'
                }`}
              />
              <span
                className="font-silkscreen text-[7.5px] px-1.5 py-0.5 rounded-sm border uppercase tracking-wide"
                style={{
                  color: prize.color,
                  borderColor: prize.color,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                }}
              >
                {prize.badge}
              </span>
            </div>

            {isGrand ? (
              <Crown className="h-4 w-4" style={{ color: prize.color }} />
            ) : prize.category === 'podium' ? (
              <Trophy className="h-4 w-4" style={{ color: prize.color }} />
            ) : (
              <Sparkles className="h-4 w-4" style={{ color: prize.color }} />
            )}
          </div>

          {/* Amount & Title */}
          <div className="break-words">
            <span className="font-pixel text-[8px] sm:text-[8.5px] text-[#9ca3af] uppercase tracking-wider block">
              {prize.rank}
            </span>
            <div className="flex items-baseline gap-1 my-0.5">
              <span
                className="font-pixel text-[18px] sm:text-[22px] tracking-wide font-bold"
                style={{ color: prize.color }}
              >
                {prize.amount}
              </span>
              <span className="font-silkscreen text-[8.5px] text-[#9ca3af]">CASH</span>
            </div>
            <span className="font-silkscreen font-bold text-[9px] sm:text-[9.5px] text-[#e2e8f0] block leading-tight break-words">
              {prize.title}
            </span>
          </div>

          {/* Tagline */}
          <p className="font-silkscreen text-[8.5px] sm:text-[9px] text-[#9ca3af] leading-snug break-words">
            {prize.tagline}
          </p>

          {/* Perks Checklist */}
          <div className="pt-1.5 border-t border-white/10 space-y-0.5">
            <div className="font-pixel text-[8px] text-[#9ca3af] uppercase tracking-wider flex items-center gap-1">
              <img src="/red_pin.png" alt="pin" className="w-2.5 h-2.5 pixelated pointer-events-none select-none shrink-0" draggable={false} />
              Included Perks &amp; Rewards:
            </div>
            {prize.perks.map((perk, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[8.5px] sm:text-[9px] font-silkscreen text-[#d1d5db] leading-snug break-words">
                <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" style={{ color: prize.color }} />
                <span>{perk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full justify-between gap-2.5 select-none p-2 sm:p-4 overflow-y-auto overflow-x-hidden max-w-full w-full" id="cartridge-prizes">
      {/* Top Banner Header */}
      <div className="flex flex-col gap-1 pb-2 border-b border-[#ef4444]/30 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[11px] sm:text-[13px] text-[#ef4444] tracking-wider uppercase flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-[#ef4444]" />
                PRIZES &amp; CASH BOUNTIES
              </span>
              <span className="bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 backdrop-blur-md font-silkscreen text-[8px] px-2 py-0.5 rounded-sm font-bold flex items-center gap-1">
                <Zap className="h-3 w-3 text-[#ef4444]" />
                ₹20,000 TOTAL CASH POOL
              </span>
            </div>
            <p className="font-silkscreen text-[8.5px] sm:text-[9px] text-[#9ca3af] mt-0.5 leading-snug break-words">
              Direct monetary awards disbursed in cash/UPI following technical jury score verification.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="hidden lg:flex items-center gap-2 bg-[#0a0c0e]/50 border border-[#38bdf8]/20 backdrop-blur-md px-2 py-1 rounded-md text-[8px] font-silkscreen text-[#38bdf8]">
            <span className="flex items-center gap-1 text-[#ef4444]">
              <Crown className="h-3 w-3 text-[#ef4444]" />
              5 WINNER SLOTS
            </span>
            <span className="text-[#38bdf8]/40">|</span>
            <span className="text-[#38bdf8] flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> 100% GUARANTEED
            </span>
          </div>
        </div>
      </div>

      {/* Main Prize Cards Section */}
      <div className="grow overflow-y-auto space-y-2.5 pr-0.5">
        {/* Podium Champions Grid (3 Columns) */}
        <div>
          <div className="font-silkscreen text-[8.5px] text-[#ef4444] mb-1 flex items-center gap-1 uppercase tracking-wider font-bold">
            <Crown className="h-3.5 w-3.5 text-[#ef4444]" />
            <span>PODIUM CHAMPION PRIZES (₹18,000)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 items-stretch">
            {PODIUM_PRIZES.map((prize) => renderCard(prize))}
          </div>
        </div>

        {/* Special Track Bounty (Single Prize) */}
        <div className="pt-0.5">
          <div className="font-silkscreen text-[8.5px] text-[#38bdf8] mb-1 flex items-center gap-1 uppercase tracking-wider font-bold">
            <Sparkles className="h-3.5 w-3.5 text-[#38bdf8]" />
            <span>SPECIAL TRACK BOUNTY (₹2,000)</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 items-stretch">
            {TRACK_BOUNTIES.map((prize) => renderCard(prize))}
          </div>
        </div>
      </div>

      {/* Footer Support & Claim Ribbon */}
      <div className="pt-1.5 border-t border-[#ef4444]/20 flex flex-col sm:flex-row items-center justify-between gap-1 text-[8px] font-silkscreen text-[#9ca3af] shrink-0">
        <div className="flex items-center gap-1.5">
          <Gift className="h-3.5 w-3.5 text-[#ef4444]" />
          <span>ALL CASH PRIZES DISBURSED WITHIN 7 DAYS POST-CEREMONY</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#38bdf8] font-pixel text-[8.5px] flex items-center gap-1">
            <img src="/red_pin.png" alt="pin" className="w-2.5 h-2.5 pixelated pointer-events-none select-none" draggable={false} />
            ₹20,000 TOTAL PURSE
          </span>
        </div>
      </div>
    </div>
  );
}


