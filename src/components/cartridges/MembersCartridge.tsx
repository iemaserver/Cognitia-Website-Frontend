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
    color: '#f4c151',
    borderColor: '#f4c151',
    bgColor: 'rgba(244, 193, 81, 0.06)',
    badgeBg: 'rgba(244, 193, 81, 0.18)',
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
    color: '#f4c151',
    borderColor: '#f4c151',
    bgColor: 'rgba(244, 193, 81, 0.06)',
    badgeBg: 'rgba(244, 193, 81, 0.18)',
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
    color: '#a7d38a',
    borderColor: '#a7d38a',
    bgColor: 'rgba(167, 211, 138, 0.06)',
    badgeBg: 'rgba(167, 211, 138, 0.18)',
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
    color: '#a7d38a',
    borderColor: '#a7d38a',
    bgColor: 'rgba(167, 211, 138, 0.06)',
    badgeBg: 'rgba(167, 211, 138, 0.18)',
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
    color: '#a7d38a',
    borderColor: '#a7d38a',
    bgColor: 'rgba(167, 211, 138, 0.06)',
    badgeBg: 'rgba(167, 211, 138, 0.18)',
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
    color: '#00f0ff',
    borderColor: '#00f0ff',
    bgColor: 'rgba(0, 240, 255, 0.06)',
    badgeBg: 'rgba(0, 240, 255, 0.18)',
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
    color: '#ff77e9',
    borderColor: '#ff77e9',
    bgColor: 'rgba(255, 119, 233, 0.06)',
    badgeBg: 'rgba(255, 119, 233, 0.18)',
    members: [
      { name: 'Subhashree Das' },
      { name: 'Alokparna Mitra' },
      { name: 'Sahitya Pan' }
    ]
  },
  {
    id: 'social-media-team',
    category: 'STUDENT LEADS',
    roleTitle: 'SOCIAL MEDIA TEAM',
    badge: 'COMMUNITY & OUTREACH',
    icon: Share2,
    color: '#ff9d42',
    borderColor: '#ff9d42',
    bgColor: 'rgba(255, 157, 66, 0.06)',
    badgeBg: 'rgba(255, 157, 66, 0.18)',
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
    color: '#ff9d42',
    borderColor: '#ff9d42',
    bgColor: 'rgba(255, 157, 66, 0.06)',
    badgeBg: 'rgba(255, 157, 66, 0.18)',
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
    <div className="flex flex-col h-full justify-between gap-3 select-none p-3 sm:p-5 overflow-y-auto" id="cartridge-members">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between pb-3 border-b-2 border-[#2b2e30] gap-2 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[14px] sm:text-[16px] text-[#cfe8ff] flex items-center gap-2">
              <Users className="h-4 w-4 text-[#00f0ff]" />
              COGNITIA CORE TEAM &amp; DIRECTORY
            </span>
            <span className="bg-[#142338] text-[#7ec7ff] border border-[#1f4066] font-silkscreen text-[9.5px] px-2 py-0.5 rounded-xs font-bold">
              VERIFIED ROSTER
            </span>
          </div>
          <p className="font-silkscreen text-[10px] sm:text-[11px] text-[#8f9396] mt-0.5">
            Meet the patrons, faculty conveners, program coordinators, and student leads behind Cognitia 2026.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap font-silkscreen text-[9px]">
          {['ALL', 'PATRONS', 'FACULTY', 'STUDENT LEADS'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                sound.playBlip(600);
                setActiveCategory(cat);
              }}
              className={`px-2.5 py-1 rounded-xs border cursor-pointer transition-colors ${
                activeCategory === cat
                  ? 'bg-[#1e2f45] text-[#00f0ff] border-[#00f0ff] font-bold'
                  : 'bg-[#101214] text-[#8f9396] border-[#2b2e30] hover:bg-[#181b1e]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-left my-auto shrink-0">
        {filteredGroups.map((group) => {
          const GroupIcon = group.icon;

          return (
            <div
              key={group.id}
              style={{
                borderColor: group.borderColor,
                backgroundColor: '#121417',
                boxShadow: `inset 0 0 12px ${group.bgColor}`,
              }}
              className="p-3.5 rounded-lg border-2 shadow-[inset_2px_2px_0_0_#2b2e30,inset_-2px_-2px_0_0_#0a0b0c,4px_4px_0_0_rgba(0,0,0,0.6)] flex flex-col justify-between space-y-3 relative overflow-hidden group hover:brightness-110 transition-all"
            >
              {/* Tape Accent */}
              <div
                style={{ backgroundColor: group.color }}
                className="absolute top-0 right-4 w-12 h-1.5 rounded-b-xs opacity-70"
              />

              {/* Title Header */}
              <div className="space-y-1 border-b border-[#23272b] pb-2">
                <div className="flex items-center justify-between">
                  <span
                    style={{
                      color: group.color,
                      borderColor: group.borderColor,
                      backgroundColor: group.badgeBg,
                    }}
                    className="font-silkscreen text-[8.5px] px-2 py-0.5 rounded-xs border font-bold uppercase tracking-wider flex items-center gap-1"
                  >
                    <GroupIcon className="h-3 w-3" style={{ color: group.color }} />
                    {group.badge}
                  </span>
                  <span className="font-pixel text-[9px] text-[#7d8285]">
                    {group.members.length} {group.members.length === 1 ? 'MEMBER' : 'MEMBERS'}
                  </span>
                </div>

                <h3 className="font-pixel text-[13px] sm:text-[14px] text-white pt-1">
                  {group.roleTitle}
                </h3>
              </div>

              {/* Member List */}
              <div className="space-y-1.5">
                {group.members.map((mem, idx) => (
                  <div
                    key={idx}
                    className="bg-[#090b0d] border border-[#1b1f24] p-2 rounded-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-silkscreen text-[11px] sm:text-[12px] text-[#cfe8ff] font-bold block">
                        {mem.name}
                      </span>
                      {(mem.designation || mem.institution) && (
                        <span className="font-silkscreen text-[9.5px] text-[#8f9396] block">
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
      <div className="w-full py-2 px-3 rounded bg-[#101214] border border-[#232629] flex items-center justify-between font-silkscreen text-[10px] text-[#7d8285] shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-[#00f0ff]" />
          <span>CARTRIDGE: MEMBERS.ROM // OFFICIAL TEAM DIRECTORY</span>
        </div>
        <span className="text-[#f4c151]">COGNITIA 2026 • IEM IT DEPARTMENT</span>
      </div>
    </div>
  );
}

