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
  FileText,
  Copy,
  Check,
  ShieldAlert,
  HelpCircle,
  Code2,
} from 'lucide-react';

export interface ProblemStatementDetail {
  psCode: string;
  psNumber: 'PS1' | 'PS2';
  title: string;
  context?: string;
  background?: string;
  problemStatement: string;
  requirements: string[];
  vulnerabilityTesting?: string;
  scoringNotes: string;
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
  problemStatements: ProblemStatementDetail[];
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
        context:
          'Investigators in crime scene analysis collect numerous data points. These often are photographic images taken from various uncalibrated viewpoints, audio/video documentation of the investigator walking through the scene or through various monitored locations, drawn or CAD sketches, transcripts from interviews with witnesses (which frequently offer conflicting accounts of events), and forensic reports detailing characteristics such as the direction of blood spatter or the path of a bullet. The current standard for reconciling this information involves manual effort with no standardized format, thus allowing for inconsistencies in the temporal and spatial record of events and a complete absence of a mechanism to present bona fide uncertainty or discrepancies.',
        problemStatement:
          'Develop a computer program and user interface that is capable of ingesting a disparate collection of conflicting and incomplete crime scene evidence. Reconstruct from this information a 3D digital twin of the crime scene which can be traversed in both space and time. This digital replica should allow users to query for specific objects, events, and trajectories placed on the 3D canvas while retaining information regarding how each entity was brought to the canvas and its level of certainty. Conflicting evidence should be highlighted as such, so that no definitive claim may be made from incongruous accounts or materials.',
        requirements: [
          '3D reconstruction: Use a mixture of low-detail uncalibrated photographs, investigator walkthrough videos, and multiple external CCTV or bystanders\' footage to construct a 1:1 metric scale 3D recreation of a crime scene even in the absence of any calibration equipment.',
          'CCTV camera feeds: Take into account and precisely register the spatial relation of one or more unlinked, arbitrary cameras to stitch together a trail of a tracked object across the camera views.',
          'Witness descriptions into 3D coordinates and times: Extract structured temporal and spatial assertions made in witness accounts, including witness descriptions of occurrences made in multiple interviews across multiple days/months that sometimes contradict previous or later witness statements and reconcile them to geometry from visual evidence.',
          'Conflicts reporting: Identify and weight the credibility of evidence contradictions (between multiple witnesses, between witnesses and visual evidence, between current and prior witness descriptions). Investigators should be able to override the automated weighting schema.',
          'Tracking within the scene: Accurately track and attribute known actors/objects between sources and synchronize tracked movement on a unique temporal axis relative to sequences derived from witness assertions.',
          'Forensic analysis translation: Import written reports of physical evidence into physical constraints in the scene including bullet trajectories or bloodspatter angles, and integrate those constraints as consistency measures for location claims made about witnesses/objects.',
          'Honest uncertainty projection: Use a probability distribution instead of a single value (such as a trajectory) where evidence for a witness/object doesn\'t fully constraint its placement or movement through time.',
          '3D geometry import: Align hand drawn or CAD renderings to metric 3D scene constructions.',
          'Natural language queries: Answer complex natural language queries on an integrated crime scene reconstruction, for example "show witness A\'s estimate of the perpetrator\'s location at noon", and return appropriately filtered information from the model.',
          'Branching hypothesis support: Use the system to present alternate interpretations of the crime scene and evidence as a structure of competing hypotheses.',
          'Handling poor quality sources: Gracefully deal with poor quality sources: sparsely recorded images, noisy or jerky camera data, unclarified witness languages, or truly missing/ambiguous evidence items.',
        ],
        scoringNotes:
          'Score the system for: Real data utilization, and adherence to ethical crime scene investigative principles by: clearly communicating evidence source and confidence and not being dogmatic about unsupported positions. All solutions should run in an online hosted version published via GitHub Actions. Solutions running solely locally are not acceptable.',
      },
      {
        psCode: 'NLP-CV-PS2',
        psNumber: 'PS2',
        title: 'Real-Time Autonomous Hazard Alerting & Conversational Assistant for Low-Vision Pedestrians',
        background:
          'Worldwide, more than 250 million people live with moderate to severe vision loss or blindness (WHO), and safe outdoor mobility is among the most recurring expressed user needs in disability tech research. White canes and guide dogs can help navigate current environments and surroundings, but the methods are reactive in that they cannot forecast approaching hazards or interpret visual information such as text signs. Applications developed so far, meanwhile either rely on a remote human helper for interaction (not autonomous) or cannot address on-going, simultaneous hazards but only single event queries such as, "describe what\'s in the photo." A blind or low-vision pedestrian often depends on sound cues for hazard perception outside of the camera\'s range; this functionality must be supported beyond the camera\'s direct field-of-view in a useful system.',
        problemStatement:
          'The task is to create a system for blind and low-vision pedestrians that takes live (or near-live) camera footage, combines this with directional audio from the microphone to continuously and intelligently alert the user to hazards. The output should be spoken instructions ranked by urgency, with sequential ordering where multiple hazards require the user to pause for a prior, more urgent issue.',
        requirements: [
          'Visual hazard scanning & prioritization: Constantly scan for visual hazards in the live video feed and issue spoken warnings that are prioritized by urgency and ordered when multiple hazards are encountered (e.g. "car approaching from the right, wait-then the pavement here is lower"), optimized for a strictly defined information density and latency budget appropriate for real-time walking.',
          'Hazard approach vector & urgency estimation: Estimate the hazards\' approach vector and urgency (e.g., where the hazard is going, how fast and if it is approaching the pedestrian\'s path) without relying on depth-sensing, allowing customizable sensitivity to balance false positives and false negatives.',
          'Time-series hazard perseverance: Persevere in detecting specific hazards across a time series and not just in individual frames; avoid repeating alerts for the same event and prevent re-alerting a hazard that was momentarily not detected.',
          'Directional audio hazard channel: Utilize environmental sound, separately of the video, as another hazard detection channel; localizing sounds (vehicles approaching, sirens, honking), and cross-checking audio signals against visual detections to track and alert to hazards out of camera range.',
          'Mid-stride natural language speech interaction: Provide natural language speech interaction mid-stride for user queries such as "what does the sign say?", "is it okay to proceed through the crosswalk?", or "there is an accessible seating area near me" with continuous hazard detection uninterrupted, correctly prioritizing simultaneous safety alerts and conversational requests.',
          'Abstract speech reference recognition: Recognize the subject of abstract speech references, such as "that sign" or "the street crossing", without requiring specific gestural gestures or positional information from the user.',
          'In-scene text & sign reading: Read on-screen/in-scene text (signs, traffic signals, crossing indications) in variable real-world visual environments: motion blur, oblique viewing angles and diverse lighting conditions, ignoring irrelevant objects and noise while reading content of useful textual information.',
          'Explicit system failure notifications: Provide explicit failure notifications if camera visibility or a relevant system component is obstructed or unreliable due to conditions like physical blocking, glare or darkness.',
          'Staged evaluation framework: Employ a staged approach to evaluation with replayed, annotated recorded footage (not direct real-time interaction with blind subjects during development), focusing on recall, precision, false alarm rates, and end-to-end latency on a test corpus.',
          'Reliable & non-repetitive operation: Operate reliably in realistic situations without lapsing into silent operation without confidence, avoiding constant re-alerts for persistent visual stimuli.',
        ],
        scoringNotes:
          'Using actual recorded footages and data from navigating or accessibility research in place of synthetic models is valuable and awarded bonus points. The quality of hazard detection (recall, precision, false alarm rate), the responsiveness to obstacles (latency tolerance), the transparency in communicating failures, and the intelligibility of sequential and conversational interactions are key evaluation criteria, not the specific programming languages, platforms, or tools employed. All solutions must be available online through GitHub Actions.',
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
        background:
          'Cross-chain bridges have become a critical but highly vulnerable component of the cryptocurrency ecosystem. A history of significant exploits, including those at Ronin, Wormhole, Nomad, and Poly Network, has resulted in the loss of billions of dollars. These attacks are often facilitated by vulnerabilities in smart contracts, compromise of validator keys or multisig infrastructure, or manipulation of market prices and liquidity. Critically, bridges are typically drained within minutes, far outpacing the response time of any human governance mechanism. The challenge of blockchain interoperability is defined by four key areas: Technology, Functionality, Security, and Standardization.',
        problemStatement:
          'We propose to design and build Bridge Guard, a system that addresses cross-chain vulnerabilities by implementing a resilient bridge between heterogeneous chains, supporting programmable transfers, strict finality, multi-approach validation, independent monitoring, and autonomous on-chain pausing.',
        requirements: [
          'Resilient Heterogeneous Bridge: Develop a functioning bridge between two distinct heterogeneous chains with differing finality rules and token handling mechanisms (avoiding simple chain forks).',
          'Advanced Token Handling & Programmability: Offer multiple selectable token-handling mechanisms per asset (lock-and-mint, burn-and-mint); enable programmable cross-chain transfers triggering immediate atomic downstream actions (auto-staking) with safe rollback.',
          'Standardized Pluggable Interface: Design a pluggable interoperability interface allowing seamless integration of third chains without modifying core bridge logic, demonstrated by integrating a 3rd chain.',
          'Strict Finality Enforcement: Ensure destination actions occur only after source chain finality rules are met and safeguard against reorg attacks.',
          'Cross-Chain Validation Comparison: Implement and compare at least two distinct validation strategies (committee/relayer vs. lightweight proof-based) with concrete metrics on latency, cost, and trust trade-offs.',
          'Independent Monitoring Pathway: Develop a secondary validation pathway that independently re-derives bridge state from raw chain data.',
          'Diverse Real-Time Detection Mechanisms: Utilize volume/velocity anomaly detection, invariant violations, signature/replay errors, finality breaches, and suspicious fund flow tracking.',
          'Configurable Compliance Layer: Implement a compliance layer with user-defined rules in flexible "enforced" and "advisory-only" modes.',
          'Autonomous On-Chain Circuit-Breaker Pausing: Develop an autonomous on-chain pause mechanism executing within seconds of credible attack detection, with griefing safeguards and immutable logging.',
          'Operational Failure Recovery: Ensure system recovers from real operational failures (e.g. event monitor restarts) without data loss or duplicate processing.',
          'Live Operational Dashboard: Build a live dashboard showing bridge activity, transfer finality status, validation trade-offs, real-time alerts with evidence, incident history, and alert management interface.',
        ],
        vulnerabilityTesting:
          'To rigorously test Bridge Guard, introduce at least two seeded, demo-safe vulnerabilities (e.g., signature replay, missing nonce checks, finality-window bypasses, or price-oracle manipulation). The system must detect these vulnerabilities, trigger a circuit-breaker pause, and mitigate the attack end-to-end.',
        scoringNotes:
          'Solutions leveraging real testnets, real chain data, or real-world exploit patterns receive higher scores. Emphasis on end-to-end functionality of bridge and monitoring/response system, accurate finality handling, detection accuracy, response speed, and automatic pause safety. All submitted solutions must be deployable and accessible via GitHub Actions; local-only solutions are incomplete.',
      },
      {
        psCode: 'BLOCKCHAIN-PS2',
        psNumber: 'PS2',
        title: 'Pre-Execution Transaction Interceptor & Malicious Signature Simulator',
        background:
          'Most wallet compromises aren\'t the result of an exploit in a smart contract, but of a user signing a malicious transaction. Fake "claim airdrop" sites masquerade as legitimate contracts to initiate unlimited token transfers, setApprovalForAll for NFTs, or signed permits authorizing wallet draining at a later date. Analyzing on-chain event logs after funds disappear is useless. We must catch malicious transactions before the user signs, simulate their effect, and present human-readable risk warnings prior to signing.',
        problemStatement:
          'Design and implement a system that intercepts unsigned transactions and signature requests from a user\'s wallet, simulates their potential true effect against live blockchain state without broadcasting, and provides a clear, severity-ranked risk report prior to signing.',
        requirements: [
          'Live State Fork Simulation: Simulate unsigned transactions or signature requests against a real state fork (live mainnet/testnet state without broadcasting on-chain).',
          'Comprehensive Before/After State Diff Engine: Compute native token balances, ERC-20 balances, ERC-20/721/1155 allowances, isApprovedForAll states, and ownership/transfer shifts.',
          'Intent Deciphering & Calldata Decoding: Perform calldata decoding (handling unknown functions) and map dangerous patterns (limitless approvals to unverified contracts, transferFrom to non-owners, delegatecalls to unverified bytecode) into straightforward danger statements.',
          'Drainer Kit Signature Database Matching: Detect known malicious patterns targeting specific contract addresses or unverified bytecode against a database of drainer kit signatures.',
          'Deploy Malicious Demo Contract: Create and deploy your own malicious smart contract (e.g., fake "claim rewards" contract calling setApprovalForAll) to intercept a live malicious transaction request.',
          'Real Wallet Interception Flow: Intercept real wallet transaction/signature requests between a legitimate wallet (e.g., MetaMask) and the user\'s confirmation screen, halt the process, run simulation and risk assessment, and display the report before allowing signing to proceed.',
          'Severity-Ranked User Risk Report: Deliver risk information as a clear, severity-ranked user report rather than raw balance and approval diffs alone.',
        ],
        scoringNotes:
          'Utilizing real Mainnet, testnet, or actual documented transaction data (instead of only synthetic data) contributes additional points. Final reports evaluated on accuracy, extent of state diff calculation, clarity and validity of risk reports, and live wallet interception prior to signing. All projects must be deployable to a live state using GitHub Actions.',
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
        background:
          'Farmers typically irrigate on fixed schedules or guesswork rather than actual crop water need, causing wasted water and yield loss. Simple vegetation-index approaches (raw NDVI heatmaps) show stress but don\'t explain why, don\'t quantify yield at risk, and don\'t tell a farmer whether to irrigate now or wait. Real agronomic advisory systems rely on physics-based soil-water-balance modeling.',
        problemStatement:
          'Design and build a system that estimates real, plot-level crop water stress using a physics-based soil-water-balance model, cross-validated against independent satellite vegetation signals, to produce an actionable irrigate/wait recommendation along with a projected yield-loss estimate for a farmer\'s specific plot.',
        requirements: [
          'Root-Zone Soil Water Balance Modeling: Model root-zone soil water balance over time accounting for effective rainfall, irrigation applied, evapotranspiration by growth stage, and losses below root zone using literature-grounded water balance approaches.',
          'Soil-Specific Water Characteristic Thresholds: Determine soil water-holding capacity and readily available water thresholds from soil-type data to define water stress onset.',
          'Quantified Yield-Loss Translation: Translate accumulated seasonal water stress into quantified yield-loss estimates using established literature-grounded relationships.',
          'Independent Satellite Remote-Sensing Cross-Validation: Cross-validate water-balance stress predictions against independent remote-sensing signals (satellite vegetation health/water content trends) as a genuine two-source check.',
          'Daily Forward Stress Projections: Run forward daily using live rainfall and forecast data, projecting current stress status and estimated days until stress onset.',
          'Farmer-Facing Actionable Advisory Interface: Produce clear recommendations (irrigate now, safe to wait, no action needed) with projected yield loss in a simple, accessible interface.',
          'Data Fallbacks & Honest Confidence Flagging: Fall back to reasonable proxies when inputs are missing, explicitly flag recommendations as lower-confidence, and never silently assume "no stress".',
          'Interface Limitation Disclaimers: Communicate clearly that the tool is a screening/advisory aid, not a substitute for field-level agronomic trials.',
        ],
        scoringNotes:
          'Use of real public soil, weather, satellite, and published agronomic reference data earns extra points. Judged on soundness of water-balance and yield-loss modeling, genuineness of satellite cross-validation, and honesty about data limitations. Mandatory GitHub Actions deployment.',
      },
      {
        psCode: 'GEOSPATIAL-PS2',
        psNumber: 'PS2',
        title: 'Physics-Based Slope Stability & Live Rainfall Highway Landslide Early Warning System',
        background:
          'Hill highways (Himachal Pradesh, NE India, Western Ghats) are vulnerable to sudden closures due to landslides. Existing hackathon solutions produce simple weighted heatmaps based on static risk factors, lacking physical models for why or when a slope will fail.',
        problemStatement:
          'Design and build a tool that precisely identifies high-risk road segments on a selected hill highway by integrating a physics-based model of slope stability with live rainfall data, continuously generating a risk-ranked, segment-level list.',
        requirements: [
          'Terrain Attribute & Geotechnical Extraction: Derive slope angle, aspect, and terrain attributes from elevation data. Assign soil-mechanical properties (cohesion, friction angle, unit weight, soil depth) based on soil classification data.',
          'Physically Grounded Factor of Safety (FoS): Calculate a physically grounded slope stability metric (Factor of Safety) using recognized slope-stability models considering geometry and soil strength.',
          'Live Rainfall Hydrology & Pore-Water Pressure Coupling: Link FoS with live rainfall data via pore-water pressure dynamics (estimating rainfall infiltration effects on subsurface water pressure and FoS reduction).',
          'User-Tunable Risk Classification Tiers: Categorize risks into distinct tiers (unstable, marginal, stable) with user-tunable cutoff parameters.',
          'Highway Segment Risk Aggregation: Aggregate risk to specific road segments along actual highway alignments, providing a ranked list of high-risk sections.',
          'Continuous Real-Time Risk Updates: Continuously update segment risks on a schedule or as new rainfall data becomes available.',
          'Map-Based Dashboard with Risk Threshold Sliders: Display results on a color-coded map dashboard with adjustable user-defined risk thresholds.',
          'Data Transparency & Confidence Flagging: Transparently flag locations with missing/low-confidence inputs rather than assuming "safe".',
          'Clear Interface Limitations: Clearly articulate screening tool limitations within the interface.',
          'Incident Feedback Loop Mechanism: Support future validation by recording confirmed incidents vs. false alarms.',
        ],
        scoringNotes:
          'Use of real elevation, soil, road-network, rainfall, and historical landslide reference data awarded bonus points. Evaluated on robustness of slope stability and rainfall coupling models, clarity of segment ranking, and honest acknowledgement of data resolution limits. Mandatory GitHub Actions deployment.',
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
        background:
          'Today\'s market validation is sluggish, expensive and flawed. Surveys suffer from social desirability bias and small sample sizes; focus groups don\'t scale; real market data emerges long after launch when costs of being wrong are sunk. AI persona panels provide directionally accurate and statistically defensible artificial response with clearly established limitations.',
        problemStatement:
          'Construct an agentic system that produces a population of autonomous AI personas—representing demographic, psychographic, and behavioral data distributions from actual market populations as opposed to typical LLM stereotypes—while guaranteeing persistent identity, memory, and internally consistent decision policies across a series of interactions.',
        requirements: [
          'Independent Population Orchestration: Orchestrate entire persona population responses independently (simulated survey responses, social network opinion spreading over simulated time, competitive purchasing decisions against alternatives) rather than querying individual agents one by one.',
          'Population Heterogeneity & Persistent Identity: Prevent personas from collapsing into bland templates; sustain consistent responses across different contexts without ungrounded opinion drift.',
          'Social Network Opinion Spreading: Simulate opinion dynamics over simulated time through a network exhibiting clustered neighborhoods, influential hubs, and homophilic connections.',
          'Competitive Purchase Simulation & Reproducibility: Simulate purchase trade-offs against alternative options with reproducible agent behavior to distinguish strategy variance from random noise.',
          'Opposing Critic Agent Integration: Integrate a dedicated critic agent to challenge adoption plans and flag/offset positive sample biases.',
          'Autonomous Strategy Search Engine: Autonomously search for enhanced strategy variations (proposing novel pricing/positioning concepts) using actual search techniques rather than trial-and-error.',
          'Extended Timeline Adoption Forecasting: Forecast adoption metrics over extended timelines based on short-horizon simulated interaction dynamics, transparently distinguishing empirical observations from extrapolations.',
          'Evidence-Based Summarized Report: Generate reports with adoption metrics & calculated margins of error, deduplicated taxonomy of unique objections with examples, persona audit against target segments, multi-run consistency analysis, and explicit indicators warning when entering unfamiliar territory.',
          'Historical Backtesting & Post-Launch Feedback Loop: Enable historical backtesting against actual launch outcomes and provide mechanisms to input post-launch data for ongoing segment prediction refinement.',
        ],
        scoringNotes:
          'Submissions incorporating verifiable data (census/psychometric data, past survey responses, historical market launch data) receive additional recognition. Prioritizes statistical transparency, attributability in reports, true variability/robustness in persona behavior, and functional search and backtesting capabilities. Mandatory GitHub Actions deployment.',
      },
      {
        psCode: 'AUTONOMOUS-PS2',
        psNumber: 'PS2',
        title: 'Runtime Firewall & Provenance Verification Layer for Agent Tools & MCP Servers',
        background:
          'Organizations are increasingly using LLM agents calling external tools via protocols like MCP. Malicious tool servers sneak malicious instructions in descriptions, parameters, or outputs (prompt/metadata injection, allowlist poisoning, cross-server shadowing, gradual trust-and-betray updates). Traditional anti-malware software is ineffective against agent-specific attacks.',
        problemStatement:
          'Create and develop a runtime firewall and provenance verification layer situated between an agent and any tool/MCP server/skill it has access to, performing continuous verification of integrity and behavior lacking in existing agent-tool communication protocols.',
        requirements: [
          'Static & Semantic Intent Analysis: Perform static and semantic analysis on descriptions, metadata, and parameters of tools to identify hidden malicious instructions based on reasoning over intent rather than keyword/pattern matching.',
          'Behavioral Shift & Trust-and-Betray Detection: Recognize changes in tool behavior by comparing actual responses against previous proven baselines to flag gradual trust-and-betray attacks while permitting legitimate updates.',
          'Ecosystem Graph Trust Modeling: Model trust relationships across the entire tool ecosystem as a graph to detect cross-server "tool shadowing" (where a malicious tool mimics/manipulates calls to a trusted tool).',
          'Dynamic Task-Based Least-Privilege Enforcement: Enforce dynamic principle of least privilege based on agent tasks at time of call, replacing static allowlists vulnerable to targeted command poisoning.',
          'Autonomous Quarantine & Rollback Engine: Autonomously quarantine affected tools and revert to last known good version upon high confidence detection; escalate to human operator with comprehensive forensic data if uncertain.',
          'Firewall Self-Defense & Data Isolation: Design operational mechanisms so they cannot be maliciously influenced by analyzed data, maintaining strict separation between observed information and analysis processes.',
          'Adversarial Attack Benchmark Evaluation: Evaluated against a test suite of adversarial attacks including prompt/metadata injection, allowlist poisoning, cross-server shadowing, and gradual trust-and-betray versions.',
        ],
        scoringNotes:
          'Prioritizes solutions grounding detection logic, fingerprinting baselines, and red-team scenarios using real-world documented attack patterns, real malware catalogues, or existing real MCP/agent ecosystems. Evaluated on detection accuracy, false positive rates, firewall self-defense, and end-to-end quarantine and rollback functionality. Mandatory GitHub Actions deployment.',
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
        background:
          'Banks and NBFCs have cash and collateral sitting idle in dozens of Nostro/Vostro accounts, CCPs, and payment rails (RTGS, NEFT, UPI, CBLO, repo). Manual optimization causes real losses (idle money in one pool while another pays penal interest, fixed settlement batches missing cutoffs, regulatory LCR/CRR/SLR constraints). This is a real-time optimization and orchestration problem.',
        problemStatement:
          'Design and build a system capable of optimizing the intraday movement of cash and collateral in real time for a bank or NBFC\'s accounts, CCPs, and payment rails, while meeting real regulatory, timing, and market risk constraints.',
        requirements: [
          'Real-Time Multi-Account View: Maintain a single real-time view of cash and collateral positions across accounts, CCPs, margin accounts, and collateral pools updated continuously with multi-source latency.',
          'Constraint-Based Optimization Algorithm: Compute optimal transfers and collateral substitutions minimizing real costs (opportunity cost, overdraft fees, repo interest) while meeting CRR/SLR/LCR constraints.',
          'Cutoff-Aware Settlement Scheduling: Schedule transfers against cutoff times and settlement dates, modeling interbank transfer latency.',
          'Dynamic Collateral Revaluation & Haircut Pricing: Dynamically revalue eligible collateral types per CCP, adapting haircut pricing to live/simulated market data.',
          'Multi-Party Stress Testing & Cascading Failure Simulation: Simulate multi-entity systemic stress test scenarios (e.g., large settlement failure by another entity) to model multi-party dynamics.',
          'Treasury Officer Explainability: Explain all recommendations in simple terms, detailing mitigated risk and operational cost/value.',
          'Transaction Lifecycle & Data Consistency: Manage partial failures and cross-entity consistency with logical lifecycles (initiated, pending confirmed, confirmed, rejected).',
          'Cross-Currency FX Risk & Conversion Costs: Incorporate FX conversion transaction costs and exchange rate risks into optimization algorithms.',
          'Cash Flow Uncertainty Modeling: Model expected non-deterministic client payments and incoming settlements under uncertainty.',
          'Proactive Settlement Failure Prevention: Identify at-risk transfers based on historical rail latency and re-route or re-sequence BEFORE missing cutoffs.',
          'Automated Regulatory Return Generation: Automatically produce regulatory reports (LCR-style returns) directly from optimization state.',
          'Multi-Tenant Account State Isolation: Strictly isolate state for each bank/NBFC entity while modeling systemic multi-party interactions.',
        ],
        scoringNotes:
          'Utilizing real market data, observed transaction latencies, published regulatory limits, or real payment rail behaviors improves score. Realism of optimization formulation & systemic stress testing weighted heavily. Mandatory GitHub Actions deployment.',
      },
      {
        psCode: 'FINTECH-PS2',
        psNumber: 'PS2',
        title: 'Real-Time Authorised Push Payment (APP) Fraud Interceptor & Mule-Chain Tracer',
        background:
          'Authorised Push Payment (APP) fraud (users coaxed into authorizing payments quickly moved through mule accounts) is viewed as a systemic risk by RBI. RBI\'s shift toward compensation frameworks covering small fraudulent transactions requires real-time proof of coerced payment, demanding rapid detection, interception, and fund tracing through mule chains before post-facto fraud reporting.',
        problemStatement:
          'Develop and implement a real-time transaction interceptor capable of evaluating in-flight UPI-style push payments for APP fraud likelihood, taking decisive action, tracing intended paths of flagged funds, and quantifying actual financial risk using real currency units.',
        requirements: [
          'Multi-Signal Behavioral Evaluation: Evaluate each transaction with multiple independent signals (payee/amount/time/device pattern deviations, payee risk from multiple incoming sources, contextual urgency like active calls/app switches, transaction structuring below thresholds).',
          'Defendable Risk Score Fusion: Fuse individual signals into a unified risk score with documented signal contributions.',
          'Time-Decay Mule Chain Recoverability Model: Simulate movement of flagged funds through mule networks with time-decayed models of onward transactions across chain lengths to calculate "recoverable vs. lost" estimates over time.',
          'Expected Financial Cost Decision Engine: Compare friction cost to legitimate payments against compensation liability if fraudulent payments pass (based on recoverability estimates), deciding action (approve / delay with verification / block).',
          'Tunable Policy Trade-Off Interface: Provide an interface for modifying false positive vs compensation liability trade-offs, dynamically updating decision boundaries.',
          'Realistic Step-Up Friction Protocol: Implement soft holds followed by alternative-factor re-confirmation, with protocol handling for further transaction attempts while on hold.',
          'Auditable Compliance Explainability Trail: Maintain complete explainability records per held transaction (fired signals, fused score, decision rationale, hold outcome) suitable for regulatory compliance querying.',
          'Adversarial Countermeasure Evaluation: Test system against gamed scoring (structuring evasion, false baseline building, delayed suspicious transactions) with quantifiable catch-rate improvements.',
          'Portfolio Risk & Financial Impact Reporting: Generate portfolio-level reports showing screened transactions, held count, avoided compensation liability (in real currency), and false-positive/friction rates.',
          'Justified Modeling Choices: Fully document and justify all modeling choices (decay estimates, cost calculations, fusion weighting).',
        ],
        scoringNotes:
          'Grounding in real UPI/payment-fraud typologies, published RBI guidance, or realistic transaction/mule data earns extra points. Discriminatory power of fusion score, expected-cost decision logic, adversarial evaluation, explainability trail. Mandatory GitHub Actions deployment.',
      },
    ],
  },
];

interface TracksCartridgeProps {
  onNavigate?: (cartridgeId: string) => void;
}

export function TracksCartridge({ onNavigate }: TracksCartridgeProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<string>(TRACKS_LIST[0].id);
  const [activePsTab, setActivePsTab] = useState<'PS1' | 'PS2'>('PS1');
  const [copiedPsCode, setCopiedPsCode] = useState<string | null>(null);

  const selectedTrack = TRACKS_LIST.find((t) => t.id === selectedTrackId) || TRACKS_LIST[0];
  const psList: ProblemStatementDetail[] = selectedTrack.problemStatements || [];
  const currentPs = psList.find((p) => p.psNumber === activePsTab) || psList[0];

  const handleCopyPs = (ps: ProblemStatementDetail) => {
    const textToCopy = `[COGNITIA 2026 - ${selectedTrack.title}]\n${ps.psCode}: ${ps.title}\n\nPROBLEM STATEMENT:\n${ps.problemStatement}\n\nREQUIREMENTS:\n${ps.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nSCORING:\n${ps.scoringNotes}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedPsCode(ps.psCode);
    setTimeout(() => setCopiedPsCode(null), 2500);
  };

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
            HACKATHON TRACKS &amp; OFFICIAL PROBLEM STATEMENTS
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
              const psCount = track.problemStatements?.length || 2;

              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => {
                    setSelectedTrackId(track.id);
                    setActivePsTab('PS1');
                  }}
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
                          {psCount} PS AVAILABLE
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

        {/* Right Column: Track Overview & Both Problem Statements (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-full overflow-y-auto space-y-3">
          {/* Track Summary Banner */}
          <div
            style={{
              borderColor: selectedTrack.color,
              backgroundColor: 'rgba(10, 12, 14, 0.45)',
            }}
            className="w-full p-3 sm:p-4 rounded-md border backdrop-blur-md space-y-2.5 break-words"
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
                <h3 className="font-pixel text-[15px] sm:text-[17px] text-white tracking-wide leading-tight">
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
            <div className="space-y-1">
              <span className="font-silkscreen text-[8px] text-[#38bdf8] flex items-center gap-1 uppercase font-bold">
                <Sparkles className="h-3 w-3 text-[#38bdf8]" /> CORE FOCUS DOMAINS &amp; ARCHITECTURAL PATTERNS
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
          </div>

          {/* Problem Statement Explorer Header & Tabs */}
          <div className="bg-[#090c10]/80 border border-[#38bdf8]/30 rounded-md p-3 space-y-3 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#38bdf8]/20 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#38bdf8]" />
                <span className="font-pixel text-[12px] sm:text-[13.5px] text-white uppercase tracking-wider">
                  OFFICIAL PROBLEM STATEMENTS (PS1 &amp; PS2)
                </span>
              </div>
              <span className="font-silkscreen text-[8px] text-[#a7d38a] bg-[#142417] border border-[#25522b] px-2 py-0.5 rounded-xs font-mono font-bold self-start sm:self-auto">
                ONLINE HOSTING (GITHUB ACTIONS) MANDATORY
              </span>
            </div>

            {/* PS Selection Tabs */}
            <div className="grid grid-cols-2 gap-2">
              {psList.map((ps) => {
                const isActive = ps.psNumber === activePsTab;
                return (
                  <button
                    key={ps.psCode}
                    type="button"
                    onClick={() => setActivePsTab(ps.psNumber)}
                    className={`p-2.5 rounded-md border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 break-words ${isActive
                        ? 'bg-[#0f1d2e] border-[#38bdf8] text-white shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                        : 'bg-[#0a0c0e]/50 border-[#2b2e30] text-[#8f9396] hover:border-[#38bdf8]/40 hover:text-[#cfe8ff]'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`font-pixel text-[9px] sm:text-[10px] px-2 py-0.5 rounded-xs font-bold ${isActive
                            ? 'bg-[#38bdf8] text-[#090c10]'
                            : 'bg-[#141618] text-[#8f9396] border border-[#2b2e30]'
                          }`}
                      >
                        {ps.psNumber} · {ps.psCode}
                      </span>
                      {isActive && (
                        <span className="font-silkscreen text-[7.5px] text-[#4ade80] flex items-center gap-1 font-bold">
                          <Check className="h-3 w-3 text-[#4ade80]" /> VIEWING
                        </span>
                      )}
                    </div>
                    <h4 className="font-pixel text-[10.5px] sm:text-[11.5px] line-clamp-2 leading-snug mt-1">
                      {ps.title}
                    </h4>
                  </button>
                );
              })}
            </div>

            {/* Detailed Selected PS View */}
            {currentPs && (
              <div className="space-y-3 pt-1 text-left">
                {/* PS Header Bar */}
                <div className="p-3 bg-[#0a1118] border border-[#2563eb]/40 rounded-md space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-silkscreen text-[9px] text-[#38bdf8] bg-[#38bdf8]/10 border border-[#38bdf8]/40 px-2 py-0.5 rounded-xs font-bold font-mono">
                      CODE: {currentPs.psCode}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopyPs(currentPs)}
                      className="font-silkscreen text-[8px] text-[#cfe8ff] bg-[#102a45] hover:bg-[#1e4d7b] border border-[#2563eb] px-2.5 py-1 rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedPsCode === currentPs.psCode ? (
                        <>
                          <Check className="h-3 w-3 text-[#4ade80]" />
                          <span className="text-[#4ade80] font-bold">COPIED TO CLIPBOARD</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-[#38bdf8]" />
                          <span>COPY PS SPECIFICATIONS</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h3 className="font-pixel text-[15px] sm:text-[18px] text-[#f4c151] leading-tight">
                    {currentPs.psNumber}: {currentPs.title}
                  </h3>
                </div>

                {/* Context / Background Section */}
                {(currentPs.context || currentPs.background) && (
                  <div className="p-3 bg-[#0c1015] border border-[#38bdf8]/20 rounded-md space-y-1.5">
                    <span className="font-silkscreen text-[8.5px] text-[#38bdf8] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-[#38bdf8]" />
                      CONTEXT &amp; INDUSTRY BACKGROUND
                    </span>
                    <p className="font-silkscreen text-[9px] sm:text-[10px] text-[#cfe8ff] leading-relaxed break-words">
                      {currentPs.context || currentPs.background}
                    </p>
                  </div>
                )}

                {/* Problem Statement Section */}
                <div className="p-3 bg-[#17130c] border-2 border-[#f4c151]/60 rounded-md space-y-1.5 shadow-[0_0_15px_rgba(244,193,81,0.1)]">
                  <span className="font-silkscreen text-[8.5px] text-[#f4c151] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-[#f4c151]" />
                    PROBLEM STATEMENT &amp; OBJECTIVE
                  </span>
                  <p className="font-silkscreen text-[9.5px] sm:text-[10.5px] text-[#fef08a] leading-relaxed font-semibold break-words">
                    {currentPs.problemStatement}
                  </p>
                </div>

                {/* Vulnerability Seeding & Testing Section (if present) */}
                {currentPs.vulnerabilityTesting && (
                  <div className="p-3 bg-[#241310] border border-[#ef4444]/50 rounded-md space-y-1.5">
                    <span className="font-silkscreen text-[8.5px] text-[#ef4444] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-[#ef4444]" />
                      VULNERABILITY SEEDING &amp; ADVERSARIAL TESTING
                    </span>
                    <p className="font-silkscreen text-[9px] sm:text-[9.5px] text-[#fca5a5] leading-relaxed break-words">
                      {currentPs.vulnerabilityTesting}
                    </p>
                  </div>
                )}

                {/* System Capabilities & Key Requirements List */}
                <div className="p-3 bg-[#0c141d] border border-[#2563eb]/40 rounded-md space-y-2">
                  <span className="font-silkscreen text-[8.5px] text-[#60a5fa] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-[#1e3a5f] pb-1.5">
                    <Code2 className="h-3.5 w-3.5 text-[#60a5fa]" />
                    SYSTEM CAPABILITIES &amp; MANDATORY TECHNICAL SPECIFICATIONS
                  </span>
                  <div className="space-y-1.5">
                    {currentPs.requirements.map((req, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 bg-[#090d14] p-2 rounded-xs border border-[#1e3a5f]/60 text-[8.5px] sm:text-[9.5px] font-silkscreen text-[#cfe8ff] leading-relaxed break-words"
                      >
                        <span className="font-mono text-[#38bdf8] font-bold shrink-0 mt-0.5">
                          #{idx + 1}.
                        </span>
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scoring Guide & Evaluation Notes */}
                <div className="p-3 bg-[#0e1f18] border border-[#4ade80]/50 rounded-md space-y-1.5">
                  <span className="font-silkscreen text-[8.5px] text-[#4ade80] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-[#4ade80]" />
                    SCORING GUIDE &amp; EVALUATION CRITERIA
                  </span>
                  <p className="font-silkscreen text-[9px] sm:text-[9.5px] text-[#dcfce7] leading-relaxed break-words">
                    {currentPs.scoringNotes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-1.5 px-2.5 rounded-md bg-[#0a0c0e]/30 backdrop-blur-md border border-[#ef4444]/20 flex items-center justify-between font-silkscreen text-[8px] shrink-0">
        <div className="flex items-center gap-1.5 text-[#7d8285]">
          <Terminal className="h-3 w-3 text-[#ef4444]" />
          <span>TRACKS.ROM · COGNITIA 2026 TRACK &amp; PS REGISTRY</span>
        </div>
        <span className="text-[#38bdf8]">10 OFFICIAL PROBLEM STATEMENTS LOADED</span>
      </div>
    </div>
  );
}
