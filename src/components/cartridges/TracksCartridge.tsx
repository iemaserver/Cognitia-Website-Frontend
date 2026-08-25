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
      'Engineers neural systems capable of understanding, synthesizing, and reasoning with visual and textual data. Build multi-modal transformers, OCR pipelines, real-time video understanding, and LLM reasoning models.',
    focusAreas: [
      'Multi-Modal LLM Agents & Document Intelligence',
      'Real-Time Object Detection & Video Stream Analysis',
      'Neural Machine Translation & Speech Synthesis',
      'Optical Character Recognition (OCR) & Document Layout Parsing',
    ],
    requirements: [
      'Working inference pipeline with real-time/batch demo',
      'Clear benchmark metric evaluation (Latency/Accuracy)',
      'Clean API wrapper or responsive UI presentation layer',
    ],
  },
  {
    id: 'blockchain-cybersecurity',
    title: 'Blockchain and Cybersecurity',
    tagline: 'Decentralized Ledgers, Zero-Trust Defense & Cryptography',
    tag: 'WEB3 / SECURITY',
    bounty: '₹2,000 Special Bounty',
    color: '#f4c151',
    borderColor: '#f4c151',
    bgColor: 'rgba(244, 193, 81, 0.05)',
    badgeBg: 'rgba(244, 193, 81, 0.15)',
    icon: ShieldCheck,
    description:
      'Pioneer decentralized trust protocols and resilient security HUDs. Build zero-knowledge proofs, smart contract security analyzers, decentralized identity solutions, or automated threat intelligence platforms.',
    focusAreas: [
      'Zero-Knowledge Proofs (zk-SNARKs/zk-STARKs) & Privacy dApps',
      'Smart Contract Security Audit & Vulnerability Scanners',
      'Decentralized Identity (DID) & Access Management HUD',
      'Automated Threat Intelligence & Network Packet Scanners',
    ],
    requirements: [
      'Deployed smart contract on testnet OR live security scanner demo',
      'Cryptographic proof verification or tamper-evident audit logs',
      'Comprehensive vulnerability mitigation report',
    ],
  },
  {
    id: 'geospatial-intelligence',
    title: 'Geospatial Predictive Intelligence',
    tagline: 'GIS Data Analytics, Spatial Modeling & Remote Sensing AI',
    tag: 'GIS / PREDICTIVE',
    bounty: '₹2,000 Special Bounty',
    color: '#a7d38a',
    borderColor: '#a7d38a',
    bgColor: 'rgba(167, 211, 138, 0.05)',
    badgeBg: 'rgba(167, 211, 138, 0.15)',
    icon: Globe,
    description:
      'Harness satellite imagery, telemetry, and spatial ML algorithms to predict real-world geographic phenomena—from disaster response and urban growth to climate risk and precision agriculture.',
    focusAreas: [
      'Satellite Remote Sensing & Environmental Change Tracking',
      'Urban Infrastructure & Traffic Flow Spatial Analytics',
      'Disaster Response & Predictive Hazard Mapping',
      'Climate Risk Modeling & Agricultural Telemetry',
    ],
    requirements: [
      'Integration of open-source GIS, OpenStreetMap, or Satellite data',
      'Predictive spatial-temporal model or heatmap rendering',
      'Interactive map view or dashboard interface layer',
    ],
  },
  {
    id: 'ai-autonomous-systems',
    title: 'AI Autonomous Systems',
    tagline: 'Robotics, Multi-Agent Swarms & Automated Decision Engines',
    tag: 'ROBOTICS / AGENTS',
    bounty: '₹2,000 Special Bounty',
    color: '#ff77e9',
    borderColor: '#ff77e9',
    bgColor: 'rgba(255, 119, 233, 0.05)',
    badgeBg: 'rgba(255, 119, 233, 0.15)',
    icon: Bot,
    description:
      'Construct self-governing intelligent agents and robotic orchestration systems. Build multi-agent coordination protocols, autonomous pathfinding simulations, or automated workflow execution pipelines.',
    focusAreas: [
      'Multi-Agent Consensus & Task Allocation Swarms',
      'Autonomous Drone / Robot Pathfinding Simulations',
      'Self-Healing Code Execution & Workflow Orchestration',
      'Reinforcement Learning Agents in Complex Environments',
    ],
    requirements: [
      'Autonomous decision loop with state-feedback visualization',
      'Agent inter-communication protocol or simulation environment',
      'Fail-safe exception recovery mechanism',
    ],
  },
  {
    id: 'fintech',
    title: 'FinTech',
    tagline: 'Algorithmic Payments, Fraud Intelligence & Automated Trading',
    tag: 'FINTECH / MARKETS',
    bounty: '₹2,000 Special Bounty',
    color: '#ff5555',
    borderColor: '#ff5555',
    bgColor: 'rgba(255, 85, 85, 0.05)',
    badgeBg: 'rgba(255, 85, 85, 0.15)',
    icon: Landmark,
    description:
      'Architect financial tech systems, automated risk engines, and high-speed payment infrastructure. Build AI fraud detection, algorithmic trading bots, automated credit scoring, or micro-loan routing engines.',
    focusAreas: [
      'Real-Time Transaction Fraud Intelligence & Anomaly Scanners',
      'Algorithmic Trading & Portfolio Optimization Bots',
      'Micro-Payment Settlement & Cross-Border Routing Protocols',
      'Automated Risk Assessment & Credit Scoring Models',
    ],
    requirements: [
      'Functional transaction routing or fraud evaluation engine',
      'Real-time simulation dashboard with transaction stream UI',
      'Security & rate-limiting protection mechanisms',
    ],
  },
];

interface TracksCartridgeProps {
  onNavigate?: (cartridgeId: string) => void;
}

export function TracksCartridge({ onNavigate }: TracksCartridgeProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<string>(TRACKS_LIST[0].id);

  const selectedTrack = TRACKS_LIST.find((t) => t.id === selectedTrackId) || TRACKS_LIST[0];

  return (
    <div className="flex flex-col h-full justify-between items-center text-center gap-4 select-none p-3 sm:p-5 overflow-y-auto" id="cartridge-tracks">
      {/* Header Bar */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between pb-3 border-b-2 border-[#2b2e30] gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[14px] sm:text-[16px] text-[#a7d38a] flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#a7d38a]" />
            CHALLENGE TRACKS
          </span>
          <span className="bg-[#1e2f18] text-[#a7d38a] border border-[#2f4f24] font-silkscreen text-[9.5px] sm:text-[10.5px] px-2 py-0.5 rounded-xs font-bold">
            STATUS: UNLOCKED &amp; LIVE
          </span>
        </div>
        <div className="flex items-center gap-2 font-silkscreen text-[9.5px] text-[#7ec7ff] bg-[#101a26] border border-[#1b344d] px-2.5 py-1 rounded-xs">
          <Award className="h-3.5 w-3.5 text-[#f4c151]" />
          <span>5 DOMAINS • ₹2,000 BOUNTY PER TRACK</span>
        </div>
      </div>

      {/* Main Track Showcase Layout */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 text-left my-auto shrink-0">
        {/* Left Column: Track Navigation List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="font-silkscreen text-[11px] text-[#8fa892] uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-[#f4c151]" /> SELECT A TRACK (5)
            </span>
            <span className="font-silkscreen text-[10px] text-[#7d8285]">CLICK TO INSPECT</span>
          </div>

          <div className="space-y-2">
            {TRACKS_LIST.map((track) => {
              const IconComp = track.icon;
              const isSelected = track.id === selectedTrackId;

              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setSelectedTrackId(track.id)}
                  style={{
                    borderColor: isSelected ? track.color : '#23272b',
                    backgroundColor: isSelected ? track.bgColor : '#121417',
                    boxShadow: isSelected ? `0 0 12px ${track.badgeBg}` : 'none',
                  }}
                  className={`w-full text-left p-3 rounded-md border-2 transition-all cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      style={{
                        backgroundColor: isSelected ? track.badgeBg : '#1c2024',
                        borderColor: track.color,
                      }}
                      className="w-10 h-10 rounded-md border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                    >
                      <IconComp className="h-5 w-5" style={{ color: track.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-pixel text-[9px] px-1.5 py-0.5 rounded-xs uppercase tracking-wider border font-bold"
                          style={{
                            color: track.color,
                            borderColor: track.color,
                            backgroundColor: track.badgeBg,
                          }}
                        >
                          {track.tag}
                        </span>
                      </div>
                      <h4 className="font-pixel text-[12px] sm:text-[13px] text-white truncate mt-1 group-hover:text-[#cfe8ff]">
                        {track.title}
                      </h4>
                    </div>
                  </div>

                  <ChevronRight
                    className={`h-5 w-5 shrink-0 transition-transform ${isSelected ? 'translate-x-1' : 'opacity-40 group-hover:opacity-100'
                      }`}
                    style={{ color: track.color }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Track Detail Card (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <div
            style={{
              borderColor: selectedTrack.color,
              backgroundColor: '#121417',
            }}
            className="w-full h-full p-4 sm:p-5 rounded-lg border-2 shadow-[inset_2px_2px_0_0_#2b2e30,inset_-2px_-2px_0_0_#0a0b0c,4px_4px_0_0_rgba(0,0,0,0.7)] flex flex-col justify-between space-y-4"
          >
            {/* Track Header */}
            <div className="space-y-2 border-b border-[#23272b] pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span
                  className="font-silkscreen text-[11px] px-2.5 py-0.5 rounded-xs border font-bold uppercase tracking-wider"
                  style={{
                    color: selectedTrack.color,
                    borderColor: selectedTrack.color,
                    backgroundColor: selectedTrack.badgeBg,
                  }}
                >
                  {selectedTrack.tag}
                </span>

                <span className="font-silkscreen text-[11px] text-[#f4c151] bg-[#241e12] border border-[#544425] px-2.5 py-0.5 rounded-xs font-bold flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-[#f4c151]" />
                  {selectedTrack.bounty}
                </span>
              </div>

              <h3 className="font-pixel text-[18px] sm:text-[22px] text-white tracking-wide">
                {selectedTrack.title}
              </h3>
              <p
                className="font-silkscreen text-[11px] sm:text-[12px] font-semibold tracking-wide"
                style={{ color: selectedTrack.color }}
              >
                {selectedTrack.tagline}
              </p>
            </div>

            {/* Description */}
            <p className="font-silkscreen text-[11.5px] sm:text-[12.5px] text-[#cfe8ff] leading-relaxed bg-[#0c0e10] p-3 rounded border border-[#202428]">
              {selectedTrack.description}
            </p>

            {/* Focus Areas & Sample Use Cases */}
            <div className="space-y-2">
              <span className="font-pixel text-[10.5px] text-[#a7d38a] flex items-center gap-1.5 uppercase">
                <Sparkles className="h-3.5 w-3.5 text-[#a7d38a]" /> KEY FOCUS AREAS &amp; PROBLEM DOMAINS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedTrack.focusAreas.map((area, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 bg-[#0a0c0e] border border-[#1b1e22] p-2 rounded text-[11.5px] font-silkscreen text-gray-300"
                  >
                    <CheckCircle2
                      className="h-3.5 w-3.5 shrink-0 mt-0.5"
                      style={{ color: selectedTrack.color }}
                    />
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evaluation & Requirements */}
            <div className="space-y-2 pt-1 border-t border-[#23272b]">
              <span className="font-pixel text-[10.5px] text-[#7ec7ff] flex items-center gap-1.5 uppercase">
                <Terminal className="h-3.5 w-3.5 text-[#7ec7ff]" /> SUBMISSION CRITERIA &amp; REQUIREMENTS
              </span>
              <ul className="space-y-1 font-silkscreen text-[10.5px] text-gray-400">
                {selectedTrack.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: selectedTrack.color }} />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Phase 2 Problem Statement Notice Banner */}
            <div className="bg-[#241a12] border-2 border-[#f4c151] p-2.5 rounded-md text-[#f4c151] font-silkscreen text-[10.5px] sm:text-[11.5px] flex items-center gap-2.5 shadow-[0_0_12px_rgba(244,193,81,0.25)]">
              <AlertTriangle className="h-4 w-4 text-[#f4c151] shrink-0 animate-pulse" />
              <span>
                <strong className="text-white">PHASE 2 PS RELEASE:</strong> Official Problem Statements (PS) for this track will be given on the day of the hackathon in Phase 2.
              </span>
            </div>

            {/* CTA Button */}
            <div className="pt-2 flex justify-end">
              <a
                href="https://forms.gle/ZZKRsiC9ejDJSw9A9"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: selectedTrack.badgeBg,
                  borderColor: selectedTrack.color,
                  color: selectedTrack.color,
                }}
                className="font-pixel text-[11px] sm:text-[12px] px-4 py-2 rounded border-2 hover:brightness-125 cursor-pointer flex items-center gap-2 shadow-[2px_2px_0_0_#000] transition-all"
              >
                <span>SELECT &amp; REGISTER FOR THIS TRACK</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="w-full py-2 px-3 rounded bg-[#101214] border border-[#232629] flex items-center justify-between font-silkscreen text-[10px] text-[#7d8285] shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-[#a7d38a]" />
          <span>CARTRIDGE: TRACKS.ROM // DOMAIN PROTOCOLS UNLOCKED</span>
        </div>
        <span className="text-[#f4c151]">5 TRACKS • ₹10,000 TOTAL SPECIAL BOUNTIES</span>
      </div>
    </div>
  );
}

