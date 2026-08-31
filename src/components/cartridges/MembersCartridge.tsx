import React, { useState } from 'react';
import { Users, Crown, Award, Code, Palette, Share2, Megaphone, Terminal, Sparkles, UserCheck } from 'lucide-react';
import { sound } from '../../utils/audio';

export interface MemberGroup {
  id: string;
  category: string;
  roleTitle: string;
  badge: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  bgColor: string;
  badgeBg: string;
  members: { name: string; designation?: string; institution?: string }[];
}

const COMMITTEE_GROUPS: MemberGroup[] = [
  {
    id: 'chief-patron',
    category: 'PATRONS',
    roleTitle: 'CHIEF PATRON',
    badge: 'UNIVERSITY LEADERSHIP',
    icon: Crown,
    color: '#ef4444',
    borderColor: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.06)',
    badgeBg: 'rgba(239, 68, 68, 0.18)',
    members: [
      { name: 'Mrs. Banani Chakraborti', designation: 'Chancellor', institution: 'UEM, Kolkata' }
    ]
  },
  {
    id: 'patron',
    category: 'PATRONS',
    roleTitle: 'PATRON',
    badge: 'INSTITUTE LEADERSHIP',
    icon: Crown,
    color: '#ef4444',
    borderColor: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.06)',
    badgeBg: 'rgba(239, 68, 68, 0.18)',
    members: [
      { name: 'Dr. Satyajit Chakrabarti', designation: 'Director', institution: 'IEM, Kolkata' }
    ]
  },
  {
    id: 'convener',
    category: 'FACULTY',
    roleTitle: 'CONVENER',
    badge: 'DEPARTMENT HEAD',
    icon: Award,
    color: '#38bdf8',
    borderColor: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.06)',
    badgeBg: 'rgba(56, 189, 248, 0.18)',
    members: [
      { name: 'Prof. Dr. Moutushi Singh', designation: 'Head of Department', institution: 'Department of IT, IEM, Kolkata' }
    ]
  },
  {
    id: 'program-coordinators',
    category: 'FACULTY',
    roleTitle: 'PROGRAM COORDINATORS',
    badge: 'FACULTY LEADERSHIP',
    icon: UserCheck,
    color: '#38bdf8',
    borderColor: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.06)',
    badgeBg: 'rgba(56, 189, 248, 0.18)',
    members: [
      { name: 'Dr. Koushik Dutta' },
      { name: 'Dr. Avipsita Chatterjee' },
      { name: 'Dr. Susovan Jana' }
    ]
  },
  {
    id: 'co-coordinators',
    category: 'FACULTY',
    roleTitle: 'CO COORDINATORS',
    badge: 'FACULTY MENTORS',
    icon: UserCheck,
    color: '#38bdf8',
    borderColor: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.06)',
    badgeBg: 'rgba(56, 189, 248, 0.18)',
    members: [
      { name: 'Prof. Subindu Saha' },
      { name: 'Prof. Dr. Ardhendu Sarkar' },
      { name: 'Prof. Gaidinlung Kamei' }
    ]
  },
  {
    id: 'core-organizers',
    category: 'STUDENT LEADS',
    roleTitle: 'CORE ORGANIZERS',
    badge: 'EVENT EXECUTIVES',
    icon: Users,
    color: '#f87171',
    borderColor: '#f87171',
    bgColor: 'rgba(248, 113, 113, 0.06)',
    badgeBg: 'rgba(248, 113, 113, 0.18)',
    members: [
      { name: 'Medimi Nishit Kumar' },
      { name: 'Saptadip Mukherjee' },
      { name: 'Trishit Ghosh' }
    ]
  },
  {
    id: 'tech-team',
    category: 'STUDENT LEADS',
    roleTitle: 'TECH TEAM',
    badge: 'PLATFORM & ARCHITECTURE',
    icon: Code,
    color: '#00f0ff',
    borderColor: '#00f0ff',
    bgColor: 'rgba(0, 240, 255, 0.06)',
    badgeBg: 'rgba(0, 240, 255, 0.18)',
    members: [
      { name: 'Debarghaya Mitra' }
    ]
  },
  {
    id: 'graphics-team',
    category: 'STUDENT LEADS',
    roleTitle: 'GRAPHICS TEAM',
    badge: 'UI & CREATIVE DESIGN',
    icon: Palette,
    color: '#38bdf8',
    borderColor: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.06)',
    badgeBg: 'rgba(56, 189, 248, 0.18)',
    members: [
      { name: 'Subhashree Das' },
      { name: 'Alokparna Mitra' }
    ]
  },
  {
    id: 'social-media-team',
    category: 'STUDENT LEADS',
    roleTitle: 'SOCIAL MEDIA TEAM',
    badge: 'COMMUNITY & OUTREACH',
    icon: Share2,
    color: '#ef4444',
    borderColor: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.06)',
    badgeBg: 'rgba(239, 68, 68, 0.18)',
    members: [
      { name: 'Sinjini Datta' },
      { name: 'Jitesh Jana' },
      { name: 'Banhita Chakraborty' }
    ]
  },
  {
    id: 'pr-team',
    category: 'STUDENT LEADS',
    roleTitle: 'PR TEAM',
    badge: 'PUBLIC RELATIONS',
    icon: Megaphone,
    color: '#ef4444',
    borderColor: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.06)',
    badgeBg: 'rgba(239, 68, 68, 0.18)',
    members: [
      { name: 'Aryan Banerjee' },
      { name: 'Lahari Guin' },
      { name: 'Samim Khan' },
      { name: 'Aagnik Sengupta' }
    ]
  }
];

export function MembersCartridge() {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const filteredGroups = activeCategory === 'ALL'
    ? COMMITTEE_GROUPS
    : COMMITTEE_GROUPS.filter((g) => g.category === activeCategory);

  return (
    <div className="flex flex-col h-full justify-between gap-3 select-none p-2 sm:p-4 overflow-y-auto overflow-x-hidden max-w-full w-full" id="cartridge-members">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2.5 border-b border-[#ef4444]/30 gap-1.5 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[11px] sm:text-[13px] text-[#ef4444] tracking-wider uppercase flex items-center gap-2">
              <Users className="h-4 w-4 text-[#ef4444]" />
              COGNITIA CORE TEAM &amp; DIRECTORY
            </span>
            <span className="bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 backdrop-blur-md font-silkscreen text-[8.5px] px-2 py-0.5 rounded-sm font-bold">
              VERIFIED ROSTER
            </span>
          </div>
          <p className="font-silkscreen text-[8.5px] sm:text-[9px] text-[#8f9396] mt-0.5 leading-snug break-words">
            Meet the patrons, faculty conveners, program coordinators, and student leads behind Cognitia 2026.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1 flex-wrap font-silkscreen text-[8px]">
          {['ALL', 'PATRONS', 'FACULTY', 'STUDENT LEADS'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                sound.playBlip(600);
                setActiveCategory(cat);
              }}
              className={`px-2 py-0.5 rounded-sm border cursor-pointer transition-colors ${
                activeCategory === cat
                  ? 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444] font-bold'
                  : 'bg-[#0a0c0e]/50 text-[#8f9396] border-[#38bdf8]/20 hover:bg-[#38bdf8]/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-left my-auto shrink-0">
        {filteredGroups.map((group) => {
          const GroupIcon = group.icon;

          return (
            <div
              key={group.id}
              style={{
                borderColor: group.borderColor,
                backgroundColor: 'rgba(10, 12, 14, 0.35)',
              }}
              className="p-3 rounded-md border backdrop-blur-md flex flex-col justify-between space-y-2.5 relative overflow-hidden group hover:brightness-110 transition-all break-words"
            >
              {/* Tape Accent */}
              <div
                style={{ backgroundColor: group.color }}
                className="absolute top-0 right-4 w-10 h-1 rounded-b-xs opacity-70"
              />

              {/* Title Header */}
              <div className="space-y-0.5 border-b border-[#ef4444]/20 pb-1.5">
                <div className="flex items-center justify-between">
                  <span
                    style={{
                      color: group.color,
                      borderColor: group.borderColor,
                      backgroundColor: group.badgeBg,
                    }}
                    className="font-silkscreen text-[7.5px] px-1.5 py-0.5 rounded-sm border font-bold uppercase tracking-wider flex items-center gap-1"
                  >
                    <GroupIcon className="h-3 w-3" style={{ color: group.color }} />
                    {group.badge}
                  </span>
                  <span className="font-pixel text-[8px] text-[#7d8285]">
                    {group.members.length} {group.members.length === 1 ? 'MEMBER' : 'MEMBERS'}
                  </span>
                </div>

                <h3 className="font-pixel text-[11px] sm:text-[12px] text-white pt-0.5 leading-tight break-words">
                  {group.roleTitle}
                </h3>
              </div>

              {/* Member List */}
              <div className="space-y-1">
                {group.members.map((mem, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0a0c0e]/40 border border-[#38bdf8]/15 p-1.5 rounded-md flex items-center justify-between gap-2 break-words"
                  >
                    <div className="min-w-0">
                      <span className="font-silkscreen text-[9px] sm:text-[9.5px] text-[#cfe8ff] font-bold block leading-tight break-words">
                        {mem.name}
                      </span>
                      {(mem.designation || mem.institution) && (
                        <span className="font-silkscreen text-[8px] text-[#8f9396] block leading-tight break-words">
                          {mem.designation ? `${mem.designation}, ` : ''}{mem.institution || ''}
                        </span>
                      )}
                    </div>
                    <Sparkles className="h-3 w-3 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: group.color }} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Status Bar */}
      <div className="w-full py-2 px-3 rounded-md bg-[#0a0c0e]/30 backdrop-blur-md border border-[#ef4444]/20 flex items-center justify-between font-silkscreen text-[8.5px] shrink-0">
        <div className="flex items-center gap-2 text-[#7d8285]">
          <Terminal className="h-3 w-3 text-[#ef4444]" />
          <span>MEMBERS.ROM · OFFICIAL TEAM DIRECTORY</span>
        </div>
        <span className="text-[#38bdf8]">COGNITIA 2026 • IEM IT DEPARTMENT</span>
      </div>
    </div>
  );
}

