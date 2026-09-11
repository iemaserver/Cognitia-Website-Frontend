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
  CheckCircle2,
  Layers,
  ChevronRight,
  Zap,
  Lock,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { sound } from '../../utils/audio';

export interface TrackSummaryPs {
  psCode: string;
  psNumber: 'PS1' | 'PS2';
  title: string;
  tagline: string;
}

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
  problemStatements: TrackSummaryPs[];
}

const TRACKS_LIST: TrackDefinition[] = [
  {
    id: 'nlp-cv',
    title: 'Natural Language Processing & Computer Vision',
    tagline: '3D Scene Digital Twins & Autonomous Low-Vision Mobility Assist',
    tag: 'AI / VISION & NLP',
    bounty: '₹2,000 Special Bounty',
    color: '#00f0ff',
    borderColor: '#00f0ff',
    bgColor: 'rgba(0, 240, 255, 0.05)',
    badgeBg: 'rgba(0, 240, 255, 0.15)',
    icon: Brain,
    description:
      'Engineers neural systems capable of understanding, synthesizing, and reasoning with visual and textual data. Solutions ingest uncalibrated photographic feeds, CCTV video, witness statements, or real-time camera/audio streams to address complex spatial and accessibility challenges.',
    focusAreas: [
      '3D Digital Twin crime scene reconstruction & metric spatial mapping',
      'Multimodal witness account assertion extraction & temporal alignment',
      'Real-time autonomous visual hazard scanning & approach vector estimation',
      'Directional environmental audio tracking & mid-stride natural language interaction',
    ],
    problemStatements: [
      {
        psCode: 'NLP-CV-PS1',
        psNumber: 'PS1',
        title: '3D Digital Twin of Crime Scene Reconstruction & Multimodal Evidence Fusion',
        tagline: 'Metric 3D scene spatial mapping, CCTV trail stitching & witness account conflict reporting',
      },
      {
        psCode: 'NLP-CV-PS2',
        psNumber: 'PS2',
        title: 'Real-Time Autonomous Hazard Alerting & Conversational Assistant for Low-Vision Pedestrians',
        tagline: 'Live visual hazard prioritization, approach vector estimation & mid-stride natural language interaction',
      },
    ],
  },
  {
    id: 'blockchain-cybersecurity',
    title: 'Blockchain and Cybersecurity',
    tagline: 'Resilient Cross-Chain Bridges & Pre-Execution Transaction Defense',
    tag: 'WEB3 / SECURITY',
    bounty: '₹2,000 Special Bounty',
    color: '#ef4444',
    borderColor: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.05)',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    icon: ShieldCheck,
    description:
      'Pioneer zero-trust security infrastructure, resilient cross-chain bridge protocols, and transaction interceptors. Build autonomous circuit breakers, multi-approach validation, or pre-execution transaction simulation engines.',
    focusAreas: [
      'Resilient heterogeneous cross-chain bridge architecture & finality enforcement',
      'Autonomous on-chain circuit-breaker pausing & seeded vulnerability defense',
      'Pre-execution wallet transaction interception & real state-fork simulation',
      'Calldata intent decoding, balance/approval diffing & drainer signature matching',
    ],
    problemStatements: [
      {
        psCode: 'BLOCKCHAIN-PS1',
        psNumber: 'PS1',
        title: 'Bridge Guard: A Robust and Secure Cross-Chain Bridging System',
        tagline: 'Heterogeneous chain bridge, programmable auto-staking, circuit-breaker pausing & live telemetry',
      },
      {
        psCode: 'BLOCKCHAIN-PS2',
        psNumber: 'PS2',
        title: 'Pre-Execution Transaction Interceptor & Malicious Signature Simulator',
        tagline: 'Live mainnet state-fork simulation, balance/approval diffing & drainer signature matching',
      },
    ],
  },
  {
    id: 'geospatial-intelligence',
    title: 'Geospatial Predictive Intelligence',
    tagline: 'Physics-Based Crop Water Stress & Highway Landslide Early Warning',
    tag: 'GIS / PREDICTIVE',
    bounty: '₹2,000 Special Bounty',
    color: '#38bdf8',
    borderColor: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.05)',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    icon: Globe,
    description:
      'Harness satellite imagery, telemetry, elevation data, and physics-based models to solve spatial real-world problems. Develop plot-level agronomic water balance advisories or segment-level hill highway landslide early warning systems.',
    focusAreas: [
      'Root-zone soil water balance modeling & satellite remote sensing cross-validation',
      'Plot-level crop water stress estimation & quantified yield-loss projection',
      'Physically grounded slope stability metric (Factor of Safety) calculation',
      'Live rainfall pore-water pressure coupling & highway road-segment risk ranking',
    ],
    problemStatements: [
      {
        psCode: 'GEOSPATIAL-PS1',
        psNumber: 'PS1',
        title: 'Physics-Based Soil-Water-Balance & Satellite Cross-Validated Crop Water Stress Engine',
        tagline: 'Root-zone soil water balance, quantified yield-loss translation & satellite cross-validation',
      },
      {
        psCode: 'GEOSPATIAL-PS2',
        psNumber: 'PS2',
        title: 'Physics-Based Slope Stability & Live Rainfall Highway Landslide Early Warning System',
        tagline: 'DEM terrain geotechnical extraction, Factor of Safety calculation & live rainfall coupling',
      },
    ],
  },
  {
    id: 'ai-autonomous-systems',
    title: 'AI Autonomous Systems',
    tagline: 'Autonomous AI Persona Market Swarms & Agent Tool Security Firewalls',
    tag: 'ROBOTICS / AGENTS',
    bounty: '₹2,000 Special Bounty',
    color: '#f87171',
    borderColor: '#f87171',
    bgColor: 'rgba(248, 113, 113, 0.05)',
    badgeBg: 'rgba(248, 113, 113, 0.15)',
    icon: Bot,
    description:
      'Construct self-governing intelligent agent swarms and security verification layers. Architect autonomous AI persona populations for market validation and strategy search, or continuous runtime firewalls for agent tools & MCP servers.',
    focusAreas: [
      'Heterogeneous persona swarm orchestration, persistent identity & opinion dynamics',
      'Opposing critic agent integration, strategy space search & historical backtesting',
      'Static & semantic intent analysis on tool descriptions, parameters & metadata',
      'Graph-based ecosystem trust modeling, dynamic least privilege & tool quarantine',
    ],
    problemStatements: [
      {
        psCode: 'AUTONOMOUS-PS1',
        psNumber: 'PS1',
        title: 'Autonomous AI Persona Swarms for Market Validation & Strategy Search',
        tagline: 'Population heterogeneity, persistent memory, social network opinion dynamics & strategy search',
      },
      {
        psCode: 'AUTONOMOUS-PS2',
        psNumber: 'PS2',
        title: 'Runtime Firewall & Provenance Verification Layer for Agent Tools & MCP Servers',
        tagline: 'Static/semantic intent analysis, trust-and-betray detection, graph trust modeling & quarantine',
      },
    ],
  },
  {
    id: 'fintech',
    title: 'FinTech',
    tagline: 'Real-Time Intraday Cash/Collateral Optimizer & Real-Time APP Fraud Interceptor',
    tag: 'FINTECH / MARKETS',
    bounty: '₹2,000 Special Bounty',
    color: '#0284c7',
    borderColor: '#0284c7',
    bgColor: 'rgba(2, 132, 199, 0.05)',
    badgeBg: 'rgba(2, 132, 199, 0.15)',
    icon: Landmark,
    description:
      'Architect financial tech real-time optimization engines and multi-signal transaction risk interceptors. Build intraday liquidity/collateral movement optimizers or in-flight UPI Authorised Push Payment (APP) fraud interceptors with mule-chain tracing.',
    focusAreas: [
      'Real-time cash & collateral position optimization under regulatory/timing constraints',
      'Multi-party liquidity cascade stress testing & dynamic collateral haircut revaluation',
      'Multi-signal behavioral APP fraud scoring (deviation, payee risk, urgency, structuring)',
      'Time-decay mule chain recoverability modeling & expected financial cost decision engine',
    ],
    problemStatements: [
      {
        psCode: 'FINTECH-PS1',
        psNumber: 'PS1',
        title: 'Real-Time Intraday Cash & Collateral Optimization Engine',
        tagline: 'Multi-account intraday position tracking, cutoff-aware settlement & regulatory return generation',
      },
      {
        psCode: 'FINTECH-PS2',
        psNumber: 'PS2',
        title: 'Real-Time Authorised Push Payment (APP) Fraud Interceptor & Mule-Chain Tracer',
        tagline: 'Multi-signal behavioral scoring, time-decay mule chain recoverability & expected cost decision engine',
      },
    ],
  },
];

interface TracksCartridgeProps {
  onNavigate?: (cartridgeId: string) => void;
}

export function TracksCartridge({ onNavigate }: TracksCartridgeProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<string>(TRACKS_LIST[0].id);

  const selectedTrack = TRACKS_LIST.find((t) => t.id === selectedTrackId) || TRACKS_LIST[0];

  const handleGoToDashboard = () => {
    sound.playClick();
    if (onNavigate) {
      onNavigate('login');
    }
  };

  return (
    <div
      className="flex flex-col h-full gap-3 select-none p-2 sm:p-4 overflow-y-auto overflow-x-hidden max-w-full w-full text-left"
      id="cartridge-tracks"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 pb-2.5 border-b border-[#ef4444]/30 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#ef4444]" />
          <span className="font-pixel text-[11px] sm:text-[13px] text-[#ef4444] tracking-wider uppercase">
            HACKATHON TRACKS REGISTRY
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-silkscreen text-[8.5px] text-[#4ade80] border border-[#4ade80]/40 bg-[#4ade80]/10 backdrop-blur-md px-2 py-0.5 rounded-sm font-bold flex items-center gap-1">
            <Zap className="h-3 w-3 text-[#4ade80]" /> 10 OFFICIAL PROBLEM STATEMENTS RELEASED
          </span>
          <span className="font-silkscreen text-[8.5px] text-[#38bdf8] border border-[#38bdf8]/40 bg-[#38bdf8]/10 backdrop-blur-md px-2 py-0.5 rounded-sm">
            5 DOMAINS
          </span>
        </div>
      </div>

      {/* Main Layout (12 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-left flex-1 min-h-0">
        {/* Left Column: Track Navigation List (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-1.5 overflow-y-auto">
          <span className="font-silkscreen text-[8.5px] text-[#38bdf8]/70 uppercase tracking-widest px-0.5">
            SELECT HACKATHON TRACK
          </span>

          <div className="space-y-1.5">
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
                  className="w-full text-left p-2.5 rounded-md border backdrop-blur-md transition-all cursor-pointer flex items-center justify-between gap-2.5 group relative break-words"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      style={{
                        backgroundColor: isSelected ? track.badgeBg : 'rgba(255,255,255,0.04)',
                        borderColor: track.color,
                      }}
                      className="w-8 h-8 rounded-md border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                    >
                      <IconComp className="h-4 w-4" style={{ color: track.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="font-pixel text-[7px] sm:text-[7.5px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider border font-bold"
                          style={{
                            color: track.color,
                            borderColor: track.color,
                            backgroundColor: track.badgeBg,
                          }}
                        >
                          {track.tag}
                        </span>
                        <span className="font-silkscreen text-[7px] text-[#4ade80] bg-[#4ade80]/10 border border-[#4ade80]/30 px-1 py-0.2 rounded-xs font-bold">
                          2 PS AVAILABLE
                        </span>
                      </div>
                      <h4 className="font-pixel text-[10.5px] sm:text-[11.5px] text-white truncate mt-0.5 group-hover:text-[#cfe8ff] leading-tight">
                        {track.title}
                      </h4>
                    </div>
                  </div>

                  <ChevronRight
                    className={`h-4 w-4 shrink-0 transition-transform ${isSelected ? 'translate-x-0.5' : 'opacity-40 group-hover:opacity-100'}`}
                    style={{ color: track.color }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Track Overview & PS Dashboard Callout (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-3.5 overflow-y-auto pr-1">
          {/* Track Summary Banner */}
          <div
            style={{
              borderColor: selectedTrack.color,
              backgroundColor: 'rgba(10, 12, 14, 0.45)',
            }}
            className="w-full p-3.5 sm:p-4 rounded-md border backdrop-blur-md space-y-3 break-words shrink-0"
          >
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#ef4444]/20 pb-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
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
                  <span className="font-silkscreen text-[8px] text-[#4ade80] bg-[#4ade80]/10 border border-[#4ade80]/30 px-2 py-0.5 rounded-sm font-bold">
                    2 ACTIVE PROBLEM STATEMENTS
                  </span>
                </div>
                <h3 className="font-pixel text-[16px] sm:text-[19px] text-white tracking-wide leading-tight">
                  {selectedTrack.title}
                </h3>
              </div>

              <span className="font-silkscreen text-[8.5px] text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/30 backdrop-blur-md px-2.5 py-1 rounded-sm font-bold flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-[#ef4444]" />
                {selectedTrack.bounty}
              </span>
            </div>

            <p className="font-silkscreen text-[9px] sm:text-[9.5px] text-[#cfe8ff] leading-relaxed bg-[#0a0c0e]/60 p-2.5 rounded-md border border-[#38bdf8]/15">
              {selectedTrack.description}
            </p>

            {/* Key Focus Areas */}
            <div className="space-y-1.5">
              <span className="font-silkscreen text-[8px] text-[#38bdf8] flex items-center gap-1 uppercase font-bold">
                <Sparkles className="h-3 w-3 text-[#38bdf8]" /> CORE FOCUS DOMAINS &amp; ARCHITECTURAL PATTERNS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {selectedTrack.focusAreas.map((area, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-1.5 bg-[#0a0c0e]/40 backdrop-blur-md border border-[#38bdf8]/15 p-2 rounded-md text-[8.5px] sm:text-[9px] font-silkscreen text-[#cfe8ff] leading-snug break-words"
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
          </div>

          {/* Section Header: Track Problem Statements */}
          <div className="flex items-center justify-between gap-2 border-b-2 border-[#38bdf8]/40 pb-1.5">
            <div className="flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-[#38bdf8]" />
              <span className="font-pixel text-[13px] sm:text-[15px] text-[#38bdf8] uppercase tracking-wider">
                AVAILABLE PROBLEM STATEMENTS
              </span>
            </div>
            <span className="font-silkscreen text-[8px] text-[#4ade80] bg-[#142417] border border-[#25522b] px-2 py-0.5 rounded-xs font-mono font-bold">
              2 OFFICIAL PS RELEASED
            </span>
          </div>

          {/* PS Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedTrack.problemStatements.map((ps) => (
              <div
                key={ps.psCode}
                className="bg-[#090c10]/90 border border-[#38bdf8]/40 rounded-md p-3.5 space-y-2 backdrop-blur-md text-left flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-pixel text-[9px] bg-[#38bdf8] text-[#090c10] px-2 py-0.5 rounded-xs font-bold">
                      {ps.psNumber}
                    </span>
                    <span className="font-silkscreen text-[8.5px] text-[#38bdf8] bg-[#38bdf8]/10 border border-[#38bdf8]/30 px-2 py-0.5 rounded-xs font-bold font-mono">
                      {ps.psCode}
                    </span>
                  </div>
                  <h4 className="font-pixel text-[12px] sm:text-[13px] text-[#f4c151] leading-snug">
                    {ps.title}
                  </h4>
                  <p className="font-silkscreen text-[8.5px] sm:text-[9px] text-[#cfe8ff] leading-relaxed">
                    {ps.tagline}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#1e3a5f]/60 flex items-center justify-between text-[8px] font-silkscreen text-[#4ade80]">
                  <span className="flex items-center gap-1 font-bold">
                    <CheckCircle2 className="h-3 w-3 text-[#4ade80]" /> GITHUB ACTIONS DEPLOYMENT
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Team Dashboard Access Callout */}
          <div className="bg-[#0f1923] border-2 border-[#38bdf8] rounded-md p-4 space-y-3 shadow-[0_0_25px_rgba(56,189,248,0.15)] text-left">
            <div className="flex items-center gap-2 text-[#38bdf8] border-b border-[#1e3a5f] pb-2">
              <Lock className="h-4.5 w-4.5 text-[#38bdf8]" />
              <span className="font-pixel text-[13px] sm:text-[14.5px] uppercase tracking-wider">
                ACCESS FULL TECHNICAL SPECIFICATIONS &amp; PROBLEM STATEMENTS
              </span>
            </div>

            <p className="font-silkscreen text-[9px] sm:text-[10px] text-[#cfe8ff] leading-relaxed">
              Complete problem statement specifications, mandatory technical requirements, vulnerability seeding protocols, and scoring rubrics are unlocked in your <strong className="text-[#f4c151]">Team Dashboard</strong> for your team's assigned track.
            </p>

            <button
              type="button"
              onClick={handleGoToDashboard}
              className="w-full bg-[#102a45] hover:bg-[#1e4d7b] border-2 border-[#38bdf8] text-[#38bdf8] hover:text-white font-pixel text-[10px] sm:text-[11px] uppercase py-2.5 px-4 rounded-md shadow-[0_0_15px_rgba(56,189,248,0.3)] flex items-center justify-center gap-2 transition-all cursor-pointer font-bold"
            >
              <ArrowRight className="h-4 w-4 text-[#38bdf8]" />
              <span>GO TO TEAM DASHBOARD TO VIEW ASSIGNED PS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-1.5 px-2.5 rounded-md bg-[#0a0c0e]/30 backdrop-blur-md border border-[#ef4444]/20 flex items-center justify-between font-silkscreen text-[8px] shrink-0">
        <div className="flex items-center gap-1.5 text-[#7d8285]">
          <Terminal className="h-3 w-3 text-[#ef4444]" />
          <span>TRACKS.ROM · COGNITIA 2026 TRACK &amp; PS REGISTRY</span>
        </div>
        <span className="text-[#38bdf8]">OFFICIAL PS VIEWABLE IN TEAM DASHBOARD</span>
      </div>
    </div>
  );
}
