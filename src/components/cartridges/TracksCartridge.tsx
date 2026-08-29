import React, { useState } from 'react';
import {
  Brain,
  ShieldCheck,
  Globe,
  Bot,
  Landmark,
  Terminal,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Layers,
  ChevronRight,
  Zap,
  AlertTriangle,
} from 'lucide-react';

export interface TrackDefinition {
  id: string;
  title: string;
  tagline: string;
  tag: string;
  bounty: string;
  color: string;
  borderColor: string;
  bgColor: string;
  badgeBg: string;
  icon: React.ElementType;
  description: string;
  focusAreas: string[];
  requirements: string[];
}

const TRACKS_LIST: TrackDefinition[] = [
  {
    id: 'nlp-cv',
    title: 'Natural Language Processing & Computer Vision',
    tagline: 'LLM Architectures, Multi-Modal Vision & Speech Processing',
    tag: 'AI / VISION & NLP',
    bounty: '₹2,000 Special Bounty',
    color: '#00f0ff',
    borderColor: '#00f0ff',
    bgColor: 'rgba(0, 240, 255, 0.05)',
    badgeBg: 'rgba(0, 240, 255, 0.15)',
    icon: Brain,
    description:
      'Engineers neural systems capable of understanding, synthesizing, and reasoning with visual and textual data. Expect problems that challenge you to apply language models, vision algorithms, and multimodal reasoning in real-world contexts.',
    focusAreas: [
      'Concepts in large language models, prompt engineering & multi-modal reasoning',
      'Image recognition, object detection & real-time video understanding',
      'Natural language understanding, translation & speech-to-text systems',
      'Document parsing, OCR & automated information extraction',
    ],
    requirements: [],
  },
  {
    id: 'blockchain-cybersecurity',
    title: 'Blockchain and Cybersecurity',
    tagline: 'Decentralized Ledgers, Zero-Trust Defense & Cryptography',
    tag: 'WEB3 / SECURITY',
    bounty: '₹2,000 Special Bounty',
    color: '#ef4444',
    borderColor: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.05)',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    icon: ShieldCheck,
    description:
      'Pioneer decentralized trust protocols and resilient security systems. Expect problems that test your knowledge of cryptography, smart contracts, identity management, and network threat detection.',
    focusAreas: [
      'Cryptography fundamentals, zero-knowledge proofs & privacy-preserving tech',
      'Smart contract design, on-chain logic & decentralized application concepts',
      'Network security, vulnerability detection & threat intelligence pipelines',
      'Decentralized identity, access control & tamper-evident audit systems',
    ],
    requirements: [],
  },
  {
    id: 'geospatial-intelligence',
    title: 'Geospatial Predictive Intelligence',
    tagline: 'GIS Data Analytics, Spatial Modeling & Remote Sensing AI',
    tag: 'GIS / PREDICTIVE',
    bounty: '₹2,000 Special Bounty',
    color: '#38bdf8',
    borderColor: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.05)',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    icon: Globe,
    description:
      'Harness satellite imagery, telemetry, and spatial ML algorithms to solve geographic real-world problems. Expect challenges around predictive modeling, spatial data processing, and environmental intelligence.',
    focusAreas: [
      'Satellite imagery analysis, remote sensing & change detection concepts',
      'Spatial data modeling, GIS integration & geographic pattern recognition',
      'Predictive risk mapping for climate, disaster or urban planning scenarios',
      'Telemetry-driven dashboards & real-time spatial visualization',
    ],
    requirements: [],
  },
  {
    id: 'ai-autonomous-systems',
    title: 'AI Autonomous Systems',
    tagline: 'Robotics, Multi-Agent Swarms & Automated Decision Engines',
    tag: 'ROBOTICS / AGENTS',
    bounty: '₹2,000 Special Bounty',
    color: '#f87171',
    borderColor: '#f87171',
    bgColor: 'rgba(248, 113, 113, 0.05)',
    badgeBg: 'rgba(248, 113, 113, 0.15)',
    icon: Bot,
    description:
      'Construct self-governing intelligent agents and robotic orchestration systems. Expect problem statements focused on autonomous decision-making, reinforcement learning, agent coordination, and workflow automation.',
    focusAreas: [
      'Autonomous agent design, decision loops & state-feedback systems',
      'Multi-agent coordination, task allocation & swarm intelligence concepts',
      'Reinforcement learning, environment simulation & policy optimization',
      'Self-healing workflows, exception handling & automated execution pipelines',
    ],
    requirements: [],
  },
  {
    id: 'fintech',
    title: 'FinTech',
    tagline: 'Algorithmic Payments, Fraud Intelligence & Automated Trading',
    tag: 'FINTECH / MARKETS',
    bounty: '₹2,000 Special Bounty',
    color: '#0284c7',
    borderColor: '#0284c7',
    bgColor: 'rgba(2, 132, 199, 0.05)',
    badgeBg: 'rgba(2, 132, 199, 0.15)',
    icon: Landmark,
    description:
      'Architect financial tech systems, automated risk engines, and payment infrastructure. Expect problems related to fraud detection, algorithmic analysis, credit risk modeling, and real-time financial data processing.',
    focusAreas: [
      'Fraud detection concepts, anomaly scoring & transaction risk intelligence',
      'Algorithmic trading logic, portfolio optimization & market simulation',
      'Payment routing, settlement protocols & cross-border transfer concepts',
      'Automated credit risk assessment & financial data modeling',
    ],
    requirements: [],
  },
];

interface TracksCartridgeProps {
  onNavigate?: (cartridgeId: string) => void;
}

export function TracksCartridge({ onNavigate }: TracksCartridgeProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<string>(TRACKS_LIST[0].id);

  const selectedTrack = TRACKS_LIST.find((t) => t.id === selectedTrackId) || TRACKS_LIST[0];

  return (
    <div
      className="flex flex-col h-full gap-3 select-none p-2 sm:p-4 overflow-y-auto overflow-x-hidden max-w-full w-full"
      id="cartridge-tracks"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 pb-2.5 border-b border-[#ef4444]/30 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#ef4444]" />
          <span className="font-pixel text-[11px] sm:text-[13px] text-[#ef4444] tracking-wider uppercase">
            HACKATHON TRACKS &amp; BOUNTIES
          </span>
        </div>
        <span className="font-silkscreen text-[8.5px] text-[#38bdf8] border border-[#38bdf8]/40 bg-[#38bdf8]/10 backdrop-blur-md px-2 py-0.5 rounded-sm">
          5 COMPETITIVE DOMAINS
        </span>
      </div>

      {/* Main Layout (12 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-left flex-1 min-h-0">
        {/* Left Column: Track Navigation List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-1.5 overflow-y-auto">
          <span className="font-silkscreen text-[8.5px] text-[#38bdf8]/70 uppercase tracking-widest px-0.5">
            SELECT HACKATHON TRACK
          </span>

          <div className="space-y-1">
            {TRACKS_LIST.map((track) => {
              const IconComp = track.icon;
              const isSelected = track.id === selectedTrackId;

              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setSelectedTrackId(track.id)}
                  style={{
                    borderColor: isSelected ? track.color : 'rgba(56,189,248,0.15)',
                    backgroundColor: isSelected ? track.bgColor : 'rgba(10,12,14,0.35)',
                    boxShadow: isSelected ? `0 0 12px ${track.badgeBg}` : 'none',
                  }}
                  className="w-full text-left p-2 rounded-md border backdrop-blur-md transition-all cursor-pointer flex items-center justify-between gap-2.5 group relative break-words"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      style={{
                        backgroundColor: isSelected ? track.badgeBg : 'rgba(255,255,255,0.04)',
                        borderColor: track.color,
                      }}
                      className="w-7 h-7 rounded-md border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                    >
                      <IconComp className="h-3.5 w-3.5" style={{ color: track.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-pixel text-[7.5px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider border font-bold"
                          style={{
                            color: track.color,
                            borderColor: track.color,
                            backgroundColor: track.badgeBg,
                          }}
                        >
                          {track.tag}
                        </span>
                      </div>
                      <h4 className="font-pixel text-[10px] sm:text-[11px] text-white truncate mt-0.5 group-hover:text-[#cfe8ff] leading-tight">
                        {track.title}
                      </h4>
                    </div>
                  </div>

                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${isSelected ? 'translate-x-0.5' : 'opacity-40 group-hover:opacity-100'}`}
                    style={{ color: track.color }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Track Detail Card (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full overflow-y-auto">
          <div
            style={{
              borderColor: selectedTrack.color,
              backgroundColor: 'rgba(10, 12, 14, 0.35)',
            }}
            className="w-full h-full p-3 sm:p-3.5 rounded-md border backdrop-blur-md flex flex-col justify-between space-y-2.5 break-words"
          >
            {/* Track Header */}
            <div className="space-y-1 border-b border-[#ef4444]/20 pb-2">
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <span
                  className="font-silkscreen text-[8px] px-1.5 py-0.5 rounded-sm border font-bold uppercase tracking-wider"
                  style={{
                    color: selectedTrack.color,
                    borderColor: selectedTrack.color,
                    backgroundColor: selectedTrack.badgeBg,
                  }}
                >
                  {selectedTrack.tag}
                </span>

                <span className="font-silkscreen text-[8px] text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/30 backdrop-blur-md px-2 py-0.5 rounded-sm font-bold flex items-center gap-1">
                  <Award className="h-3 w-3 text-[#ef4444]" />
                  {selectedTrack.bounty}
                </span>
              </div>

              <h3 className="font-pixel text-[14px] sm:text-[16px] text-white tracking-wide leading-tight break-words">
                {selectedTrack.title}
              </h3>
              <p
                className="font-silkscreen text-[9px] sm:text-[9.5px] font-semibold tracking-wide leading-snug break-words"
                style={{ color: selectedTrack.color }}
              >
                {selectedTrack.tagline}
              </p>
            </div>

            {/* Description */}
            <p className="font-silkscreen text-[9px] sm:text-[9.5px] text-[#cfe8ff] leading-snug bg-[#0a0c0e]/40 p-2 rounded-md border border-[#38bdf8]/15 break-words">
              {selectedTrack.description}
            </p>

            {/* Focus Areas */}
            <div className="space-y-1">
              <span className="font-silkscreen text-[8px] text-[#38bdf8] flex items-center gap-1 uppercase font-bold">
                <Sparkles className="h-3 w-3 text-[#38bdf8]" /> KEY FOCUS AREAS &amp; PROBLEM DOMAINS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {selectedTrack.focusAreas.map((area, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-1.5 bg-[#0a0c0e]/40 backdrop-blur-md border border-[#38bdf8]/15 p-1.5 rounded-md text-[8.5px] sm:text-[9px] font-silkscreen text-[#cfe8ff] leading-snug break-words"
                  >
                    <CheckCircle2
                      className="h-3 w-3 shrink-0 mt-0.5"
                      style={{ color: selectedTrack.color }}
                    />
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase 2 Banner */}
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/40 backdrop-blur-md p-1.5 sm:p-2 rounded-md text-[#ef4444] font-silkscreen text-[8px] sm:text-[8.5px] flex items-center gap-1.5 leading-snug break-words">
              <AlertTriangle className="h-3.5 w-3.5 text-[#ef4444] shrink-0 animate-pulse" />
              <span>
                <strong className="text-white">PHASE 2 PS RELEASE:</strong> Official Problem Statements (PS) for this track will be released in Phase 2 on hackathon day.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-1.5 px-2.5 rounded-md bg-[#0a0c0e]/30 backdrop-blur-md border border-[#ef4444]/20 flex items-center justify-between font-silkscreen text-[8px] shrink-0">
        <div className="flex items-center gap-1.5 text-[#7d8285]">
          <Terminal className="h-3 w-3 text-[#ef4444]" />
          <span>TRACKS.ROM · COGNITIA 2026 TRACK REGISTRY</span>
        </div>
        <span className="text-[#38bdf8]">5 ACTIVE DOMAINS</span>
      </div>
    </div>
  );
}
