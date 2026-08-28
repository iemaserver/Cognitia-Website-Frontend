import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Unlock,
  Github,
  Plus,
  Trash2,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Users,
  Send,
  CloudUpload,
  Image as ImageIcon,
  Edit2,
  Save,
  QrCode,
  CreditCard,
  Ticket,
  Printer,
  Check,
  Building,
  Calendar,
  Sparkles,
  Hourglass,
  Hash,
  ArrowRight,
  ArrowLeft,
  Target,
  ShieldCheck,
  Award,
  Zap,
  ChevronUp,
  ChevronDown,
  Clock,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';

const AVAILABLE_TRACKS = [
  {
    id: 'nlp-cv',
    name: 'Natural Language Processing & Computer Vision',
    tagline: 'LLM Architectures, Multi-Modal Vision & Speech Processing',
    bounty: '₹2,000 Special Bounty',
    description: 'Develop cutting-edge NLP engines, multi-modal vision systems, optical recognition tools, image/video processing, or real-time neural translation frameworks.',
  },
  {
    id: 'blockchain-cybersecurity',
    name: 'Blockchain and Cybersecurity',
    tagline: 'Decentralized Ledgers, Zero-Trust Defense & Cryptography',
    bounty: '₹2,000 Special Bounty',
    description: 'Build zero-knowledge smart contracts, decentralized security infrastructure, vulnerability detection tooling, automated threat intelligence, or privacy-preserving cryptography.',
  },
  {
    id: 'geospatial-intelligence',
    name: 'Geospatial Predictive Intelligence',
    tagline: 'GIS Data Analytics, Spatial Modeling & Remote Sensing AI',
    bounty: '₹2,000 Special Bounty',
    description: 'Harness satellite telemetry, GIS mapping, spatial predictive ML, environmental monitoring, or real-time geographic data processing to predict and solve spatial challenges.',
  },
  {
    id: 'ai-autonomous-systems',
    name: 'AI Autonomous Systems',
    tagline: 'Robotics, Multi-Agent Swarms & Automated Decision Engines',
    bounty: '₹2,000 Special Bounty',
    description: 'Engineer autonomous multi-agent networks, robotic pathfinding simulations, self-governing workflows, or automated reinforcement-learning agent swarms.',
  },
  {
    id: 'fintech',
    name: 'FinTech',
    tagline: 'Algorithmic Payments, Fraud Intelligence & Automated Trading',
    bounty: '₹2,000 Special Bounty',
    description: 'Architect next-gen financial engines, micro-payment routing, automated risk assessment algorithms, algorithmic trading strategies, or AI-powered fraud detection HUDs.',
  },
];
import { awsService } from '../../services/awsService';
import { TeamRegistration, TeamMember } from '../../types';
import { sound } from '../../utils/audio';
import { RetroInput } from '../RetroInput';

// Registration Deadline (e.g. Sept 10, 2026 23:59:59 IST)
const REGISTRATION_DEADLINE = new Date('2026-09-10T23:59:59+05:30');

interface RegistrationCartridgeProps {
  defaultLoginMode?: boolean;
}

const EMPTY_TRACK_PREFS = ['', '', '', '', ''];

type TeamDashboardTab = 'team' | 'tracks_selection' | 'fee_payment' | 'submission' | 'phase2' | 'phase2_status';

const TAB_ORDER: TeamDashboardTab[] = [
  'team',
  'tracks_selection',
  'fee_payment',
  'submission',
  'phase2',
  'phase2_status',
];

export const RegistrationCartridge: React.FC<RegistrationCartridgeProps> = ({
  defaultLoginMode = false,
}) => {
  const isDeadlinePassed = new Date() > REGISTRATION_DEADLINE;
  const [activeLeadTeam, setActiveLeadTeam] = useState<TeamRegistration | null>(null);
  const [isLoginMode, setIsLoginMode] = useState<boolean>(defaultLoginMode);
  const [activeTab, setActiveTab] = useState<TeamDashboardTab>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('cognitia_team_dashboard_tab');
      const validTabs: TeamDashboardTab[] = ['team', 'tracks_selection', 'fee_payment', 'submission', 'phase2', 'phase2_status'];
      if (savedTab && validTabs.includes(savedTab as TeamDashboardTab)) {
        return savedTab as TeamDashboardTab;
      }
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cognitia_team_dashboard_tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeLeadTeam) {
      if (activeLeadTeam.paymentStatus === 'payment_verified') {
        const hasSubmittedDeliverables = !!activeLeadTeam.submission;
        const isPhase2Selected = activeLeadTeam.phase2Status === 'selected';
        const savedTab = typeof window !== 'undefined' ? localStorage.getItem('cognitia_team_dashboard_tab') : null;

        if (hasSubmittedDeliverables && !isPhase2Selected) {
          // After submission until selection is done, show Phase 2 page directly from dashboard
          if (!savedTab || savedTab === 'fee_payment' || savedTab === 'submission') {
            setActiveTab('phase2');
          }
        } else if (!hasSubmittedDeliverables) {
          // Payment verified, deliverables pending -> show deliverables page directly
          if (!savedTab || savedTab === 'fee_payment') {
            setActiveTab('submission');
          }
        }
      } else {
        // Payment not verified -> restrict access to fee_payment
        if (activeTab === 'submission' || activeTab === 'phase2' || activeTab === 'phase2_status') {
          setActiveTab('fee_payment');
        }
      }
    }
  }, [activeLeadTeam]);

  const [trackPreferences, setTrackPreferences] = useState<string[]>(EMPTY_TRACK_PREFS);
  const [feeUtrId, setFeeUtrId] = useState<string>('');
  const [feeProofUrl, setFeeProofUrl] = useState<string>('');
  const [feeProofFileName, setFeeProofFileName] = useState<string>('');
  const [isSubmittingFee, setIsSubmittingFee] = useState<boolean>(false);
  const [feeMessage, setFeeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  useEffect(() => {
    if (activeLeadTeam) {
      setEditableTeamName(activeLeadTeam.teamName || '');
      setMembers(activeLeadTeam.members || []);
      setIsMembersLocked(!!activeLeadTeam.isMembersLocked);
      if (activeLeadTeam.trackPreferences && activeLeadTeam.trackPreferences.length === 5) {
        setTrackPreferences(activeLeadTeam.trackPreferences);
      } else {
        setTrackPreferences(EMPTY_TRACK_PREFS);
      }

      // Phase 1 Payment state (blank for new/unpaid team)
      setFeeProofUrl(activeLeadTeam.paymentScreenshotUrl || '');
      setFeeUtrId(activeLeadTeam.paymentTransactionId || '');
      setFeeProofFileName('');
      setFeeMessage(null);

      // Phase 2 Payment state (blank for new/unpaid team)
      setPaymentScreenshot(activeLeadTeam.phase2PaymentScreenshotUrl || '');
      setPaymentTxId(activeLeadTeam.phase2PaymentTransactionId || '');

      // Deliverable submission state (blank for new team)
      if (activeLeadTeam.submission) {
        setProjectTitle(activeLeadTeam.submission.projectTitle || '');
        setTagline(activeLeadTeam.submission.tagline || '');
        setTrackId(activeLeadTeam.submission.trackId || 'Natural Language Processing & Computer Vision');
        setGithubRepoUrl(activeLeadTeam.submission.githubRepoUrl || '');
        setProposedSolution(activeLeadTeam.submission.proposedSolution || '');
        setTechStackJustification(activeLeadTeam.submission.techStackJustification || '');
        setDeploymentStrategy(activeLeadTeam.submission.deploymentStrategy || '');
        setPptUrl(activeLeadTeam.submission.pptUrl || '');
        setPptFileName(activeLeadTeam.submission.pptFileName || '');
        setScreenshots(activeLeadTeam.submission.screenshots || []);
      } else {
        setProjectTitle('');
        setTagline('');
        setTrackId('Natural Language Processing & Computer Vision');
        setGithubRepoUrl('');
        setProposedSolution('');
        setTechStackJustification('');
        setDeploymentStrategy('');
        setPptUrl('');
        setPptFileName('');
        setScreenshots([]);
      }
    } else {
      // Clear all team fields when logged out
      setEditableTeamName('');
      setMembers([]);
      setIsMembersLocked(false);
      setTrackPreferences(EMPTY_TRACK_PREFS);
      setFeeProofUrl('');
      setFeeUtrId('');
      setFeeProofFileName('');
      setFeeMessage(null);
      setPaymentScreenshot('');
      setPaymentTxId('');
      setProjectTitle('');
      setTagline('');
      setTrackId('Natural Language Processing & Computer Vision');
      setGithubRepoUrl('');
      setProposedSolution('');
      setTechStackJustification('');
      setDeploymentStrategy('');
      setPptUrl('');
      setPptFileName('');
      setScreenshots([]);
    }
  }, [activeLeadTeam]);

  useEffect(() => {
    setIsLoginMode(defaultLoginMode);
  }, [defaultLoginMode]);
  const [authError, setAuthError] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState<string>('');

  // Auth Form State
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadPassword, setLeadPassword] = useState('');
  const [leadGithub, setLeadGithub] = useState('');
  const [teamName, setTeamName] = useState('');

  // Team Edit State
  const [editableTeamName, setEditableTeamName] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [isMembersLocked, setIsMembersLocked] = useState<boolean>(false);

  const isPaymentSubmittedOrVerified = Boolean(
    activeLeadTeam && (
      activeLeadTeam.paymentStatus === 'payment_verified' ||
      activeLeadTeam.paymentStatus === 'payment_pending' ||
      activeLeadTeam.paymentTransactionId ||
      activeLeadTeam.paymentScreenshotUrl
    )
  );

  const isRosterLockedEffective = Boolean(
    isMembersLocked ||
    isDeadlinePassed ||
    isPaymentSubmittedOrVerified
  );

  // New Member Form
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Developer');
  const [newMemberGithub, setNewMemberGithub] = useState('');

  // Member Editing State (Editable until deadline)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editGithub, setEditGithub] = useState('');

  // Phone Input Handlers (Numeric & Phone Symbol Only)
  const handleLeadPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^0-9+\s\-()]/g, '');
    setLeadPhone(sanitized);
  };

  const handleNewMemberPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^0-9+\s\-()]/g, '');
    setNewMemberPhone(sanitized);
  };

  // Submission Form State
  const [projectTitle, setProjectTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [trackId, setTrackId] = useState('Natural Language Processing & Computer Vision');
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');
  const [techStackJustification, setTechStackJustification] = useState('');
  const [deploymentStrategy, setDeploymentStrategy] = useState('');
  const [pptUrl, setPptUrl] = useState('');
  const [pptFileName, setPptFileName] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getWordCount = (text: string) => {
    const clean = text.trim();
    if (!clean) return 0;
    return clean.split(/\s+/).length;
  };

  const handleAnswerChange = (val: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const words = val.trim().split(/\s+/);
    if (words.length > 4000 && val.length > 50) {
      alert('⚠️ WORD LIMIT REACHED: Maximum 4000 words allowed per answer.');
    }
    setter(val);
  };

  // Phase 2 State
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [paymentTxId, setPaymentTxId] = useState<string>('');
  const [isUploadingPayment, setIsUploadingPayment] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refreshActiveTeam();
  }, []);

  const refreshActiveTeam = () => {
    const current = awsService.getActiveLeadTeam();
    if (current) {
      setActiveLeadTeam(current);
      setEditableTeamName(current.teamName);
      setMembers(current.members || []);
      setIsMembersLocked(current.isMembersLocked || false);
      // Phase 1 Payment state
      setFeeProofUrl(current.paymentScreenshotUrl || '');
      setFeeUtrId(current.paymentTransactionId || '');

      // Phase 2 Payment state
      setPaymentScreenshot(current.phase2PaymentScreenshotUrl || '');
      setPaymentTxId(current.phase2PaymentTransactionId || '');
      if (current.submission) {
        setProjectTitle(current.submission.projectTitle || '');
        setTagline(current.submission.tagline || '');
        setTrackId(current.submission.trackId || 'Natural Language Processing & Computer Vision');
        setGithubRepoUrl(current.submission.githubRepoUrl || '');
        setProposedSolution(current.submission.proposedSolution || '');
        setTechStackJustification(current.submission.techStackJustification || '');
        setDeploymentStrategy(current.submission.deploymentStrategy || '');
        setPptUrl(current.submission.pptUrl || '');
        setPptFileName(current.submission.pptFileName || '');
        setScreenshots(current.submission.screenshots || []);
      }
    }
  };

  // Handle Team Lead Auth
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (isLoginMode) {
      if (!leadEmail || !leadPassword) {
        setAuthError('Please enter both email and password.');
        return;
      }
      const res = await awsService.loginTeamLead(leadEmail, leadPassword);
      if (res.success && res.team) {
        sound.playBoot();
        setActiveLeadTeam(res.team);
        setEditableTeamName(res.team.teamName);
        setMembers(res.team.members);
        setIsMembersLocked(!!res.team.isMembersLocked);
        setAuthSuccess('Team lead authenticated successfully.');
      } else {
        sound.playBlip(300);
        setAuthError(res.message || 'Authentication failed.');
      }
    } else {
      if (!teamName || !leadName || !leadEmail || !leadPhone || !leadPassword || !leadGithub) {
        setAuthError('Please fill out all mandatory fields.');
        return;
      }
      const leadPhoneDigits = leadPhone.replace(/\D/g, '');
      if (leadPhoneDigits.length < 10) {
        setAuthError('Please enter a valid phone number (at least 10 digits).');
        return;
      }
      const res = await awsService.registerTeamLead({
        teamName,
        leadName,
        leadEmail,
        leadPhone,
        passwordHash: leadPassword,
        leadGitHubId: leadGithub,
      });

      if (res.success && res.team) {
        sound.playBoot();
        setActiveLeadTeam(res.team);
        setEditableTeamName(res.team.teamName);
        setMembers(res.team.members);
        setIsMembersLocked(!!res.team.isMembersLocked);
        setAuthSuccess('Team lead registered successfully.');
      } else {
        sound.playBlip(300);
        setAuthError(res.message || 'Registration failed.');
      }
    }
  };

  const handleLogout = () => {
    sound.playBlip(400);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cognitia_team_dashboard_tab');
    }
    awsService.logoutTeamLead();
    setActiveLeadTeam(null);
  };

  // Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeadlinePassed) {
      alert('Registration deadline has completed. Team members can no longer be added.');
      return;
    }
    if (isPaymentSubmittedOrVerified) {
      alert('Phase 1 entry fee payment has been submitted/verified. Team roster is permanently locked and members cannot be added.');
      return;
    }
    if (isMembersLocked) {
      alert('Team roster is currently locked. Unlock roster to add members before deadline.');
      return;
    }
    if (members.length >= 4) {
      alert('Maximum limit of 4 team members reached. Remove a member or lock your roster.');
      return;
    }
    if (!newMemberName || !newMemberEmail || !newMemberPhone || !newMemberGithub) {
      alert('Please fill out all member details.');
      return;
    }

    const memberPhoneDigits = newMemberPhone.replace(/\D/g, '');
    if (memberPhoneDigits.length < 10) {
      alert('Please enter a valid phone number for the team member (at least 10 digits).');
      return;
    }

    const cleanEmail = newMemberEmail.trim().toLowerCase();
    const cleanGithub = newMemberGithub.trim().replace(/^@/, '').toLowerCase();

    if (
      members.some((m) => m.email.toLowerCase() === cleanEmail) ||
      awsService.isEmailRegistered(cleanEmail, activeLeadTeam?.id)
    ) {
      alert(`Email '${newMemberEmail}' is already registered for another participant or team lead.`);
      return;
    }

    if (
      members.some((m) => m.githubId.toLowerCase() === cleanGithub) ||
      awsService.isGitHubRegistered(cleanGithub, activeLeadTeam?.id)
    ) {
      alert(`GitHub handle '@${cleanGithub}' is already registered for another participant or team lead.`);
      return;
    }

    const newMem: TeamMember = {
      id: `mem-${Date.now()}`,
      name: newMemberName,
      email: cleanEmail,
      phone: newMemberPhone,
      role: newMemberRole,
      githubId: cleanGithub,
      isLead: false,
    };

    const updated = [...members, newMem];
    setMembers(updated);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPhone('');
    setNewMemberGithub('');
    sound.playBlip(700);

    if (activeLeadTeam) {
      const res = await awsService.updateTeamDetails(activeLeadTeam.id, editableTeamName, updated);
      if (!res.success && res.message) {
        alert(res.message);
        setMembers(members);
      }
    }
  };

  const startEditingMember = (m: TeamMember) => {
    if (isDeadlinePassed) {
      alert('Registration deadline has completed. Member details can no longer be edited.');
      return;
    }
    if (isPaymentSubmittedOrVerified) {
      alert('Phase 1 entry fee payment has been submitted/verified. Team roster is permanently locked.');
      return;
    }
    if (isMembersLocked) {
      alert('Team roster is currently locked. Please unlock the roster to edit member details.');
      return;
    }
    sound.playBlip(400);
    setEditingMemberId(m.id);
    setEditName(m.name);
    setEditEmail(m.email);
    setEditPhone(m.phone);
    setEditRole(m.role || 'Member');
    setEditGithub(m.githubId);
  };

  const cancelEditingMember = () => {
    sound.playBlip(300);
    setEditingMemberId(null);
  };

  const handleSaveMemberEdits = async (memberId: string) => {
    if (isDeadlinePassed) {
      alert('Registration deadline has completed. Edits cannot be saved.');
      return;
    }
    if (isPaymentSubmittedOrVerified) {
      alert('Phase 1 entry fee payment has been submitted/verified. Team roster is permanently locked.');
      return;
    }
    if (isMembersLocked) {
      alert('Team roster is currently locked. Please unlock the roster to save member edits.');
      return;
    }
    if (!editName || !editEmail || !editPhone || !editGithub) {
      alert('Please fill out all mandatory member details.');
      return;
    }
    const phoneDigits = editPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      alert('Please enter a valid phone number (at least 10 digits).');
      return;
    }

    const cleanEmail = editEmail.trim().toLowerCase();
    const cleanGithub = editGithub.trim().replace(/^@/, '').toLowerCase();

    // Check duplicate email & github among other members
    const otherMembers = members.filter((m) => m.id !== memberId);
    if (
      otherMembers.some((m) => m.email.toLowerCase() === cleanEmail) ||
      awsService.isEmailRegistered(cleanEmail, activeLeadTeam?.id)
    ) {
      alert(`Email '${editEmail}' is already registered for another participant or lead.`);
      return;
    }

    if (
      otherMembers.some((m) => m.githubId.toLowerCase() === cleanGithub) ||
      awsService.isGitHubRegistered(cleanGithub, activeLeadTeam?.id)
    ) {
      alert(`GitHub handle '@${cleanGithub}' is already registered for another participant or lead.`);
      return;
    }

    const updated = members.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          name: editName,
          email: cleanEmail,
          phone: editPhone,
          role: editRole || m.role,
          githubId: cleanGithub,
        };
      }
      return m;
    });

    setMembers(updated);
    setEditingMemberId(null);
    sound.playBlip(800);

    if (activeLeadTeam) {
      const isTargetLead = members.find((m) => m.id === memberId)?.isLead;
      const res = await awsService.updateTeamDetails(activeLeadTeam.id, editableTeamName, updated, isMembersLocked);
      if (res.success && res.team) {
        if (isTargetLead) {
          setActiveLeadTeam({
            ...res.team,
            leadEmail: cleanEmail,
            leadPhone: editPhone,
          });
        } else {
          setActiveLeadTeam(res.team);
        }
      } else if (res.message) {
        alert(res.message);
      }
    }
  };

  const handleRemoveMember = (id: string) => {
    if (isDeadlinePassed) {
      alert('Registration deadline has completed. Team members can no longer be removed.');
      return;
    }
    if (isPaymentSubmittedOrVerified) {
      alert('Phase 1 entry fee payment has been submitted/verified. Team roster is permanently locked.');
      return;
    }
    if (isMembersLocked) {
      alert('Team roster is currently locked. Unlock roster to remove members before deadline.');
      return;
    }
    sound.playBlip(350);
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    if (activeLeadTeam) {
      awsService.updateTeamDetails(activeLeadTeam.id, editableTeamName, updated, isMembersLocked);
    }
  };

  const handleToggleLockMembers = async () => {
    if (!activeLeadTeam) return;
    if (isDeadlinePassed) {
      alert('Registration deadline has completed. Team roster is permanently locked and cannot be unlocked.');
      return;
    }
    if (isPaymentSubmittedOrVerified) {
      alert('Phase 1 entry fee payment has been submitted/verified. Team roster is permanently locked and cannot be unlocked.');
      return;
    }
    const nextState = !isMembersLocked;
    if (nextState && members.length < 2) {
      alert('⚠️ MINIMUM 2 MEMBERS REQUIRED: Each participating team must consist of 2 to 4 members before locking your roster.');
      return;
    }
    sound.playBlip(nextState ? 900 : 450);
    setIsMembersLocked(nextState);
    const res = await awsService.updateTeamDetails(activeLeadTeam.id, editableTeamName, members, nextState);
    if (res.success && res.team) {
      setActiveLeadTeam(res.team);
    }
  };

  const handleProceedToNextTab = (targetTab: TeamDashboardTab) => {
    if (targetTab === 'team') {
      sound.playBlip(400);
      setActiveTab('team');
      return;
    }
    if (members.length < 2) {
      sound.playBlip(300);
      alert('⚠️ MINIMUM 2 MEMBERS REQUIRED: Your team must add at least 1 more member (2 to 4 members per team) before proceeding.');
      return;
    }
    if (!isRosterLockedEffective) {
      sound.playBlip(300);
      alert('Please LOCK YOUR TEAM ROSTER before proceeding to track selection or next steps.');
      return;
    }
    if ((targetTab === 'fee_payment' || targetTab === 'submission' || targetTab === 'phase2' || targetTab === 'phase2_status') && !activeLeadTeam?.isTrackLocked) {
      sound.playBlip(300);
      alert('Please SELECT AND PERMANENTLY LOCK YOUR TRACK PREFERENCE in Track Selection before proceeding.');
      setActiveTab('tracks_selection');
      return;
    }
    if (targetTab === 'submission' || targetTab === 'phase2' || targetTab === 'phase2_status') {
      if (activeLeadTeam?.paymentStatus !== 'payment_verified') {
        sound.playBlip(300);
        if (activeLeadTeam?.paymentStatus === 'payment_pending') {
          alert('⌛ PAYMENT VERIFICATION PENDING BY ADMIN\n\nYour ₹50 payment details & screenshot proof have been submitted and are currently being verified by the Cognitia Admin team.\n\nPhase 1 Deliverables will unlock automatically once an admin verifies your payment!');
        } else {
          alert('⚠️ ACCESS RESTRICTED\n\nPlease complete and submit your Phase 1 entry fee payment (₹50) and wait for admin verification before accessing Phase 1 Deliverables or Phase 2.');
        }
        setActiveTab('fee_payment');
        return;
      }
    }
    sound.playBlip(600);
    setActiveTab(targetTab);
  };

  const handleFeePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLeadTeam) return;

    const cleanUtr = feeUtrId.trim();
    if (!cleanUtr || cleanUtr.length < 10) {
      setFeeMessage({ type: 'error', text: 'Please enter a valid 12-digit UPI Transaction Reference / UTR ID.' });
      return;
    }

    if (!feeProofUrl) {
      setFeeMessage({ type: 'error', text: 'Please select and upload your payment screenshot image (Max 1 MB) before submitting.' });
      return;
    }

    setIsSubmittingFee(true);
    sound.playBoot();
    const res = await awsService.submitPaymentScreenshot(activeLeadTeam.id, feeProofUrl, cleanUtr);
    setIsSubmittingFee(false);

    if (res.success && res.team) {
      setActiveLeadTeam(res.team);
      setFeeMessage({
        type: 'success',
        text: '₹50 Payment details submitted successfully! Status marked VERIFICATION PENDING BY ADMIN.',
      });
    } else {
      setFeeMessage({ type: 'error', text: 'Payment submission failed. Please try again.' });
    }
  };

  const handlePreferenceChange = (index: number, newTrackName: string) => {
    sound.playBlip(400);
    const updated = [...trackPreferences];

    if (newTrackName) {
      const existingIndex = updated.indexOf(newTrackName);
      if (existingIndex !== -1 && existingIndex !== index) {
        updated[existingIndex] = '';
      }
    }

    updated[index] = newTrackName;

    // Auto-fill remaining choice when 4 preferences have been selected
    const filled = updated.filter((t) => t && t.trim() !== '');
    if (filled.length === 4) {
      const unchosen = AVAILABLE_TRACKS.find((t) => !updated.includes(t.name));
      if (unchosen) {
        const emptyIdx = updated.findIndex((t) => !t || t.trim() === '');
        if (emptyIdx !== -1) {
          updated[emptyIdx] = unchosen.name;
        }
      }
    }

    setTrackPreferences(updated);
  };

  const handleMovePreference = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= trackPreferences.length) return;
    sound.playBlip(450);
    const updated = [...trackPreferences];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setTrackPreferences(updated);
  };

  const handleConfirmLockTrack = async () => {
    if (!activeLeadTeam) return;
    if (activeLeadTeam.isTrackLocked) {
      alert('Track preferences are already permanently locked.');
      return;
    }

    if (trackPreferences.some((t) => !t || !t.trim())) {
      alert('Please select a track for all 5 preference ranks before locking.');
      return;
    }

    const uniqueSet = new Set(trackPreferences);
    if (uniqueSet.size < 5) {
      alert('Each preference rank must have a unique challenge track.');
      return;
    }

    const prefSummary = trackPreferences
      .map((t, idx) => `Preference ${idx + 1}: ${t}`)
      .join('\n');

    const confirmChoice = window.confirm(
      `⚠️ PERMANENT TRACK PREFERENCES LOCK CONFIRMATION:\n\nAre you sure you want to lock the following preference order for your team?\n\n${prefSummary}\n\nThis decision CANNOT be changed or modified under any circumstances — even before the registration deadline ends.`
    );
    if (!confirmChoice) return;

    sound.playBlip(900);
    const res = await awsService.lockTrackPreference(activeLeadTeam.id, trackPreferences);
    if (res.success && res.team) {
      setActiveLeadTeam(res.team);
      setTrackId(trackPreferences[0]);
      alert(`Track preferences (1st Choice: "${trackPreferences[0]}") have been PERMANENTLY LOCKED.`);
    } else if (res.message) {
      alert(res.message);
    }
  };

  const handleSaveTeamDetails = async () => {
    if (!activeLeadTeam) return;
    const res = await awsService.updateTeamDetails(activeLeadTeam.id, editableTeamName, members, isMembersLocked);
    if (res.success && res.team) {
      sound.playBlip(800);
      setActiveLeadTeam(res.team);
      setIsEditingTeam(false);
      alert('Team details saved successfully.');
    } else if (res.message) {
      alert(res.message);
    }
  };

  const handlePptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(true);
    try {
      const res = await awsService.uploadFileToS3(file, 'ppts');
      setPptUrl(res.url);
      setPptFileName(res.fileName);
      sound.playBlip(900);
    } catch {
      alert('PPT upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const res = await awsService.uploadFileToS3(file, 'screenshots');
        newUrls.push(res.url);
      }
      setScreenshots((prev) => [...prev, ...newUrls]);
      sound.playBlip(900);
    } catch {
      alert('Screenshot upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);
    if (!activeLeadTeam) return;

    if (!projectTitle || !proposedSolution.trim() || !techStackJustification.trim() || !deploymentStrategy.trim()) {
      setSubmitMessage({
        type: 'error',
        text: 'Please fill out Project Title and answer all 3 Evaluation Questions.',
      });
      return;
    }

    setIsUploading(true);
    const res = await awsService.saveProjectSubmission(activeLeadTeam.id, {
      projectTitle,
      tagline,
      trackId: activeLeadTeam.selectedTrack || activeLeadTeam.trackPreferences?.[0] || 'General',
      githubRepoUrl,
      proposedSolution,
      techStackJustification,
      deploymentStrategy,
      pptUrl,
      pptFileName,
      screenshots,
    });
    setIsUploading(false);

    if (res.success && res.submission) {
      sound.playBoot();
      if (res.team) {
        setActiveLeadTeam(res.team);
      }
      setSubmitMessage({
        type: 'success',
        text: 'Phase 1 evaluation deliverables submitted successfully!',
      });
      if (!activeLeadTeam.phase2Status || activeLeadTeam.phase2Status !== 'selected') {
        setActiveTab('phase2');
      }
    } else {
      setSubmitMessage({
        type: 'error',
        text: 'Failed to submit project deliverables.',
      });
    }
  };

  // Phase 2 RSVP & Payment Handlers
  const handleConfirmRsvp = async () => {
    if (!activeLeadTeam) return;
    sound.playBoot();
    const res = await awsService.confirmRsvp(activeLeadTeam.id);
    if (res.success && res.team) {
      setActiveLeadTeam(res.team);
    }
  };

  const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB limit = 1,048,576 bytes

  const handlePhase1ScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeLeadTeam) return;
    const file = e.target.files[0];

    if (file.size > MAX_FILE_SIZE_BYTES) {
      sound.playBlip(300);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      alert(`❌ FILE TOO LARGE (${fileSizeMB} MB)\n\nPayment screenshot image size exceeds 1 MB limit. Please compress or select an image under 1 MB.`);
      setFeeMessage({
        type: 'error',
        text: `File size too large (${fileSizeMB} MB). Maximum image size allowed is 1 MB.`,
      });
      return;
    }

    setIsUploadingPayment(true);
    setFeeMessage(null);
    try {
      const res = await awsService.uploadFileToS3(file, 'payments');
      setFeeProofUrl(res.url);
      setFeeProofFileName(res.fileName);
      sound.playBlip(900);
      setFeeMessage({
        type: 'success',
        text: `Payment screenshot '${res.fileName}' (${(file.size / 1024).toFixed(0)} KB) uploaded! Submit 12-digit UTR ID below.`,
      });
    } catch {
      alert('Payment screenshot upload failed.');
    } finally {
      setIsUploadingPayment(false);
    }
  };

  const handlePaymentScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeLeadTeam) return;
    const file = e.target.files[0];

    if (file.size > MAX_FILE_SIZE_BYTES) {
      sound.playBlip(300);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      alert(`❌ FILE TOO LARGE (${fileSizeMB} MB)\n\nPayment screenshot image size exceeds 1 MB limit. Please compress or select an image under 1 MB.`);
      return;
    }

    setIsUploadingPayment(true);
    try {
      const res = await awsService.uploadFileToS3(file, 'payments');
      sound.playBlip(900);
      setPaymentScreenshot(res.url);
    } catch {
      alert('Phase 2 payment screenshot upload failed.');
    } finally {
      setIsUploadingPayment(false);
    }
  };

  const handlePhase2PaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLeadTeam) return;

    const cleanUtr = paymentTxId.trim();
    if (!cleanUtr || cleanUtr.length < 8) {
      alert('Please enter a valid Phase 2 UPI Transaction Reference / UTR ID.');
      return;
    }

    if (!paymentScreenshot) {
      alert('Please select and upload your Phase 2 payment receipt screenshot image before submitting.');
      return;
    }

    setIsUploadingPayment(true);
    sound.playBoot();
    const submitRes = await awsService.submitPhase2PaymentDetails(activeLeadTeam.id, paymentScreenshot, cleanUtr);
    setIsUploadingPayment(false);

    if (submitRes.success && submitRes.team) {
      setActiveLeadTeam(submitRes.team);
      setActiveTab('phase2_status');
      alert('Phase 2 payment details & UTR ID submitted successfully! Verification pending by admin.');
    } else {
      alert('Phase 2 payment submission failed. Please try again.');
    }
  };

  const handlePrintTicket = () => {
    sound.playBlip(700);
    window.print();
  };

  // Dynamic UPI Details
  const upiId = '9434364001@pz';
  const amount = '500';
  const teamNum = activeLeadTeam?.id ? String(activeLeadTeam.id).replace(/^team-/, '') : '0000';
  const remark = `cognitia-p2-tid-${teamNum}`;
  const upiUrl = `upi://pay?pa=${upiId}&pn=Cognitia2026&am=${amount}&tn=${encodeURIComponent(remark)}&cu=INR`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}`;

  // Unauthenticated Lead Login / Signup View
  if (!activeLeadTeam) {
    return (
      <div className="flex flex-col h-full justify-between gap-3 select-none overflow-y-auto" id="cartridge-registration">
        {/* Retro Header */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#2b2e30]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[12px] sm:text-[13px] text-[#f4c151]">
                PARTICIPANT LEAD REGISTRATION &amp; PORTAL
              </span>
              <span className="bg-[#182418] text-[#a7d38a] border border-[#254225] font-silkscreen text-[8px] px-1.5 py-0.5 rounded-xs">
                CLOUD SERVER ACTIVE
              </span>
            </div>
            <p className="font-silkscreen text-[8px] sm:text-[9px] text-[#8f9396]">
              Register your team lead credentials or log in to manage team members and project deliverables.
            </p>
          </div>
        </div>

        {/* Auth Card Container */}
        <div className="flex-1 flex justify-center items-center py-2">
          <div className="w-full max-w-lg bg-[#141618] border-2 border-[#2b2e30] p-4 sm:p-5 rounded-md shadow-[4px_4px_0_0_#000]">
            <div className="flex items-center justify-between border-b border-[#2b2e30] pb-3 mb-4">
              <span className="font-pixel text-[11px] text-[#6fb3d9] flex items-center gap-1.5">
                <User size={14} className="text-[#f4c151]" />
                {isLoginMode ? 'Team Lead Login' : 'New Team Registration'}
              </span>
              <button
                type="button"
                onClick={() => {
                  sound.playBlip(450);
                  setIsLoginMode(!isLoginMode);
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className="font-silkscreen text-[8px] text-[#f4c151] hover:underline bg-[#1c1f24] border border-[#33373a] px-2 py-0.5 rounded-xs"
              >
                {isLoginMode ? 'Switch to Signup' : 'Switch to Login'}
              </button>
            </div>

            {authError && (
              <div className="mb-3 p-2 bg-[#261414] border border-[#522525] text-[#fca5a5] font-silkscreen text-[8px] flex items-center gap-1.5 rounded-xs">
                <AlertTriangle size={12} className="text-[#ef4444] shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="mb-3 p-2 bg-[#142417] border border-[#25522b] text-[#86efac] font-silkscreen text-[8px] flex items-center gap-1.5 rounded-xs">
                <CheckCircle2 size={12} className="text-[#22c55e] shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {!isLoginMode && (
                <>
                  <RetroInput
                    label="Team Name"
                    required
                    placeholder="e.g. Cyber Spiders"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />

                  <RetroInput
                    label="Team Lead Full Name"
                    required
                    placeholder="e.g. Peter Parker"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                  />
                </>
              )}

              <RetroInput
                label="Lead Email Address"
                icon={<Mail size={10} />}
                required
                type="email"
                placeholder="lead@hackathon.org"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
              />

              {!isLoginMode && (
                <RetroInput
                  label="Lead Phone Number"
                  icon={<Phone size={10} />}
                  required
                  type="tel"
                  pattern="[+0-9\s\-\(\)]*"
                  placeholder="e.g. 9876543210"
                  value={leadPhone}
                  onChange={handleLeadPhoneChange}
                />
              )}

              <RetroInput
                label="Password"
                icon={<Lock size={10} />}
                required
                type="password"
                placeholder="••••••••"
                value={leadPassword}
                onChange={(e) => setLeadPassword(e.target.value)}
              />

              {!isLoginMode && (
                <RetroInput
                  label="Lead GitHub Handle"
                  icon={<Github size={10} />}
                  required
                  placeholder="e.g. peterparker-dev"
                  value={leadGithub}
                  onChange={(e) => setLeadGithub(e.target.value)}
                />
              )}

              <button
                type="submit"
                className="w-full bg-[#1e2329] border border-[#3a4149] hover:border-[#f4c151] font-pixel text-[9px] text-[#f4c151] tracking-wider py-2 px-3 rounded-xs flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#000] active:translate-y-0.5 transition-none cursor-pointer mt-2"
              >
                {isLoginMode ? 'AUTHENTICATE LEAD' : 'REGISTER TEAM LEAD'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#26282a] flex items-center justify-between text-[8px] font-silkscreen text-[#7d8285]">
          <span>VERIFIED BY SECURE CLOUD AUTH</span>
          <span className="text-[#a7d38a]">COGNITIA 2026 REGISTRATION PROTOCOL</span>
        </div>
      </div>
    );
  }

  // Authenticated Lead Dashboard View
  return (
    <div className="flex flex-col h-full justify-between gap-3 select-none overflow-y-auto" id="cartridge-registration-dashboard">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-md bg-[#141618] border-2 border-[#2b2e30]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[11px] text-[#f4c151]">
              Team: {activeLeadTeam.teamName}
            </span>
            <span className="bg-[#182418] text-[#a7d38a] border border-[#254225] font-silkscreen text-[7px] px-1.5 py-0.5 rounded-xs">
              REGISTERED
            </span>
            {activeLeadTeam.phase2Status === 'selected' && (
              <span className="bg-[#1a2d42] text-[#6fb3d9] border border-[#2b394d] font-silkscreen text-[7px] px-1.5 py-0.5 rounded-xs flex items-center gap-1">
                <Sparkles size={9} /> PHASE 2 SELECTED
              </span>
            )}
            {activeLeadTeam.phase2Status === 'waitlisted' && (
              <span className="bg-[#241d14] text-[#f2933d] border border-[#423325] font-silkscreen text-[7px] px-1.5 py-0.5 rounded-xs flex items-center gap-1">
                <Hourglass size={9} /> WAITLISTED
              </span>
            )}
          </div>
          <p className="font-silkscreen text-[8px] text-[#8f9396]">
            Lead: {activeLeadTeam.leadEmail} &bull; ID: {activeLeadTeam.id}
          </p>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Step Back / Previous Button */}
          {TAB_ORDER.indexOf(activeTab) > 0 && (
            <button
              onClick={() => {
                const currentIdx = TAB_ORDER.indexOf(activeTab);
                if (currentIdx > 0) {
                  sound.playBlip(400);
                  setActiveTab(TAB_ORDER[currentIdx - 1]);
                }
              }}
              className="font-pixel text-[8px] px-2.5 py-1 rounded-xs border border-[#2b2e30] bg-[#181b1e] text-[#8f9396] hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={11} /> PREV
            </button>
          )}

          {/* Next Step Button */}
          {TAB_ORDER.indexOf(activeTab) < TAB_ORDER.length - 1 && (
            <button
              onClick={() => {
                const currentIdx = TAB_ORDER.indexOf(activeTab);
                if (currentIdx < TAB_ORDER.length - 1) {
                  handleProceedToNextTab(TAB_ORDER[currentIdx + 1]);
                }
              }}
              className="font-pixel text-[8px] px-3 py-1 rounded-xs border border-[#2b4466] hover:border-[#00f0ff] bg-[#1e2838] text-[#00f0ff] hover:bg-[#25354a] flex items-center gap-1 cursor-pointer shadow-[2px_2px_0_0_#000]"
            >
              <span>NEXT</span>
              <ArrowRight size={11} />
            </button>
          )}

          {/* Log Out Button */}
          <button
            onClick={handleLogout}
            className="p-1 px-2 bg-[#261414] border border-[#442222] text-[#eb5147] hover:text-white rounded-xs text-[8px] font-silkscreen flex items-center gap-1 cursor-pointer"
            title="Log Out"
          >
            <LogOut size={12} /> LOG OUT
          </button>
        </div>
      </div>

      {/* TAB 1: TEAM MEMBERS */}
      {activeTab === 'team' && (
        <div className="space-y-3 grow overflow-y-auto">
          {/* Team Name Settings */}
          <div className="p-3 bg-[#141618] border-2 border-[#2b2e30] rounded-md">
            <div className="flex items-center justify-between border-b border-[#2b2e30] pb-2 mb-2">
              <span className="font-pixel text-[10px] text-[#6fb3d9] flex items-center gap-1">
                <Edit2 size={12} /> TEAM NAME &amp; IDENTIFIER
              </span>
              {!isEditingTeam ? (
                <button
                  onClick={() => setIsEditingTeam(true)}
                  className="font-silkscreen text-[8px] text-[#f4c151] hover:underline"
                >
                  [Edit Name]
                </button>
              ) : (
                <button
                  onClick={handleSaveTeamDetails}
                  className="font-pixel text-[8px] bg-[#182418] text-[#a7d38a] border border-[#254225] px-2 py-0.5 rounded-xs flex items-center gap-1"
                >
                  <Save size={10} /> SAVE DETAILS
                </button>
              )}
            </div>
            {isEditingTeam ? (
              <input
                type="text"
                value={editableTeamName}
                onChange={(e) => setEditableTeamName(e.target.value)}
                className="w-full bg-[#0c0e10] border border-[#3a4149] text-[#f4c151] font-silkscreen text-[9.5px] px-2.5 py-1.5 rounded-xs focus:border-[#00f0ff] focus:outline-none"
              />
            ) : (
              <p className="font-pixel text-[12px] text-[#cfe8ff]">{editableTeamName}</p>
            )}
          </div>

          {/* Members Roster */}
          <div className="p-3 bg-[#141618] border-2 border-[#2b2e30] rounded-md">
            <div className="flex items-center justify-between border-b border-[#2b2e30] pb-2 mb-2">
              <span className="font-pixel text-[10px] text-[#f4c151] flex items-center gap-1">
                <Users size={12} /> REGISTERED MEMBERS ({members.length}/4)
              </span>
              <div className="flex items-center gap-1.5">
                {members.length >= 4 && (
                  <span className="bg-[#241d14] text-[#f2933d] border border-[#423325] font-silkscreen text-[7.5px] px-1.5 py-0.5 rounded-xs">
                    4/4 MAX
                  </span>
                )}
                {isDeadlinePassed ? (
                  <span className="bg-[#2a1b1b] text-[#eb5147] border border-[#522525] font-silkscreen text-[7.5px] px-2 py-0.5 rounded-xs flex items-center gap-1">
                    <Lock size={10} /> LOCKED (DEADLINE COMPLETED)
                  </span>
                ) : isPaymentSubmittedOrVerified ? (
                  <span className="bg-[#182418] text-[#a7d38a] border border-[#254225] font-silkscreen text-[7.5px] px-2 py-0.5 rounded-xs flex items-center gap-1">
                    <Lock size={10} /> ROSTER PERMANENTLY LOCKED (PAYMENT SUBMITTED / VERIFIED)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleToggleLockMembers}
                    className={`font-pixel text-[8px] px-2 py-0.5 rounded-xs border flex items-center gap-1 cursor-pointer transition-all ${isMembersLocked
                      ? 'bg-[#261414] border-[#522525] text-[#fca5a5] hover:bg-[#2d1a1a]'
                      : 'bg-[#182418] border-[#254225] text-[#a7d38a] hover:bg-[#1e2e1e]'
                      }`}
                    title={isMembersLocked ? 'Click to unlock roster editing before deadline' : 'Click to lock roster editing'}
                  >
                    {isMembersLocked ? <Lock size={10} /> : <Unlock size={10} />}
                    {isMembersLocked ? 'ROSTER LOCKED' : 'LOCK ROSTER'}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {members.map((m) => {
                const isEditing = editingMemberId === m.id;

                if (isEditing) {
                  return (
                    <div
                      key={m.id}
                      className="bg-[#101721] border-2 border-[#6fb3d9] p-2.5 rounded-xs col-span-1 sm:col-span-2 space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-[#2b3a4a] pb-1.5">
                        <span className="font-pixel text-[9px] text-[#f4c151] flex items-center gap-1">
                          <Edit2 size={10} /> EDITING {m.isLead ? 'TEAM LEAD' : 'TEAM MEMBER'} DETAILS
                        </span>
                        <span className="font-silkscreen text-[7.5px] text-[#a7d38a]">
                          (EDITABLE UNTIL DEADLINE)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                        <div>
                          <label className="block font-silkscreen text-[7px] text-[#8f9396] mb-0.5">Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-[#0c0e10] border border-[#2b2e30] text-[#cfe8ff] font-silkscreen text-[9px] px-2 py-1 rounded-xs focus:border-[#f4c151] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-silkscreen text-[7px] text-[#8f9396] mb-0.5">Email</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full bg-[#0c0e10] border border-[#2b2e30] text-[#cfe8ff] font-silkscreen text-[9px] px-2 py-1 rounded-xs focus:border-[#f4c151] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-silkscreen text-[7px] text-[#8f9396] mb-0.5">Phone (10 digits)</label>
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value.replace(/[^0-9+\s\-()]/g, ''))}
                            className="w-full bg-[#0c0e10] border border-[#2b2e30] text-[#cfe8ff] font-silkscreen text-[9px] px-2 py-1 rounded-xs focus:border-[#f4c151] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-silkscreen text-[7px] text-[#8f9396] mb-0.5">Role</label>
                          <input
                            type="text"
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="w-full bg-[#0c0e10] border border-[#2b2e30] text-[#cfe8ff] font-silkscreen text-[9px] px-2 py-1 rounded-xs focus:border-[#f4c151] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-silkscreen text-[7px] text-[#8f9396] mb-0.5">GitHub Handle</label>
                          <input
                            type="text"
                            value={editGithub}
                            onChange={(e) => setEditGithub(e.target.value)}
                            className="w-full bg-[#0c0e10] border border-[#2b2e30] text-[#cfe8ff] font-silkscreen text-[9px] px-2 py-1 rounded-xs focus:border-[#f4c151] focus:outline-none"
                          />
                        </div>
                        <div className="flex items-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSaveMemberEdits(m.id)}
                            className="font-pixel text-[8px] bg-[#182418] border border-[#254225] text-[#a7d38a] hover:bg-[#203020] px-2.5 py-1 rounded-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Save size={10} /> SAVE
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditingMember}
                            className="font-pixel text-[8px] bg-[#1a1b1d] border border-[#33373b] text-[#8f9396] hover:text-white px-2.5 py-1 rounded-xs cursor-pointer"
                          >
                            CANCEL
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className="bg-[#090b0d] border border-[#2b2e30] p-2.5 rounded-xs flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-pixel text-[11px] sm:text-[12px] text-[#cfe8ff]">{m.name}</span>
                        {m.isLead && (
                          <span className="bg-[#241d14] text-[#f2933d] border border-[#423325] font-silkscreen text-[8.5px] px-1.5 py-0.5 rounded-xs">
                            LEAD
                          </span>
                        )}
                      </div>
                      <span className="font-silkscreen text-[9px] text-[#f4c151] block mt-0.5">{m.role}</span>
                      <div className="mt-1 font-silkscreen text-[9px] text-[#93c5fd] space-y-0.5">
                        <p className="flex items-center gap-1"><Mail size={10} /> {m.email}</p>
                        <p className="flex items-center gap-1"><Phone size={10} /> {m.phone}</p>
                        <p className="flex items-center gap-1 text-[#6fb3d9] font-mono"><Github size={10} /> @{m.githubId}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isRosterLockedEffective && (
                        <button
                          type="button"
                          onClick={() => startEditingMember(m)}
                          className="font-pixel text-[9px] bg-[#181d24] border border-[#2b394d] text-[#6fb3d9] hover:bg-[#202833] hover:text-white px-2 py-1 rounded-xs flex items-center gap-1 cursor-pointer"
                          title="Edit member details"
                        >
                          <Edit2 size={10} /> EDIT
                        </button>
                      )}

                      {!m.isLead && !isRosterLockedEffective && (
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="text-[#eb5147] hover:text-red-300 p-0.5"
                          title="Remove Member"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}

                      {isRosterLockedEffective && (
                        <span className="text-[#6b7280] p-0.5" title={isPaymentSubmittedOrVerified ? 'Permanently Locked (Phase 1 Payment Submitted/Verified)' : isDeadlinePassed ? 'Permanently Locked (Deadline Completed)' : 'Roster Locked'}>
                          <Lock size={10} />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Member Form or Status Banners */}
            {isDeadlinePassed ? (
              <div className="border-t border-[#2b2e30] pt-2.5 mt-2 bg-[#1a1212] p-2.5 rounded-xs border border-[#3d2020] text-center font-silkscreen text-[8px] text-[#fca5a5] flex items-center justify-center gap-1.5">
                <Lock size={12} className="text-[#ef4444]" />
                REGISTRATION DEADLINE COMPLETED. ROSTER IS PERMANENTLY LOCKED &amp; NO MEMBERS CAN BE ADDED OR REMOVED.
              </div>
            ) : isPaymentSubmittedOrVerified ? (
              <div className="border-t border-[#2b2e30] pt-2.5 mt-2 bg-[#182418] p-2.5 rounded-xs border border-[#254225] text-center font-silkscreen text-[8px] text-[#a7d38a] flex items-center justify-center gap-1.5">
                <Lock size={12} className="text-[#4ade80]" />
                TEAM ROSTER IS PERMANENTLY LOCKED FOLLOWING PHASE 1 PAYMENT. MEMBER DETAILS CANNOT BE MODIFIED.
              </div>
            ) : isMembersLocked ? (
              <div className="border-t border-[#2b2e30] pt-2.5 mt-2 bg-[#1c1813] p-2.5 rounded-xs border border-[#3d2c1c] text-center font-silkscreen text-[8px] text-[#f2933d] flex flex-col sm:flex-row items-center justify-between gap-1.5">
                <span className="flex items-center gap-1.5">
                  <Lock size={12} className="text-[#f4c151]" />
                  ROSTER IS LOCKED. YOU CAN UNLOCK AND EDIT MEMBERS UNTIL REGISTRATION DEADLINE.
                </span>
                <button
                  type="button"
                  onClick={handleToggleLockMembers}
                  className="font-pixel text-[7.5px] bg-[#291e14] border border-[#523b25] text-[#f4c151] px-2 py-0.5 rounded-xs hover:bg-[#38281a] cursor-pointer"
                >
                  [UNLOCK TO EDIT]
                </button>
              </div>
            ) : members.length >= 4 ? (
              <div className="border-t border-[#2b2e30] pt-2.5 mt-2 bg-[#1c1813] p-2.5 rounded-xs border border-[#3d2c1c] text-center font-silkscreen text-[8px] text-[#f2933d] flex items-center justify-center gap-1.5">
                <AlertTriangle size={12} className="text-[#f4c151]" />
                MAXIMUM TEAM CAPACITY REACHED (4/4 MEMBERS MAXIMUM).
              </div>
            ) : (
              <form onSubmit={handleAddMember} className="border-t border-[#2b2e30] pt-2 mt-2">
                <span className="font-silkscreen text-[8px] text-[#8f9396] block mb-1.5 flex items-center gap-1">
                  <Plus size={10} /> Add Team Member (Must have unique GitHub ID):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="bg-[#0c0e10] border border-[#2b2e30] text-[#cfe8ff] font-silkscreen text-[9px] px-2 py-1 rounded-xs focus:border-[#f4c151] focus:outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="bg-[#0c0e10] border border-[#2b2e30] text-[#cfe8ff] font-silkscreen text-[9px] px-2 py-1 rounded-xs focus:border-[#f4c151] focus:outline-none"
                  />
                  <input
                    type="tel"
                    pattern="[+0-9\s\-\(\)]*"
                    placeholder="Phone Number (10 digits)"
                    value={newMemberPhone}
                    onChange={handleNewMemberPhoneChange}
                    className="bg-[#0c0e10] border border-[#2b2e30] text-[#cfe8ff] font-silkscreen text-[9px] px-2 py-1 rounded-xs focus:border-[#f4c151] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g. Frontend)"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="bg-[#0c0e10] border border-[#2b2e30] text-[#cfe8ff] font-silkscreen text-[9px] px-2 py-1 rounded-xs focus:border-[#f4c151] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="GitHub Handle"
                    value={newMemberGithub}
                    onChange={(e) => setNewMemberGithub(e.target.value)}
                    className="bg-[#0c0e10] border border-[#2b2e30] text-[#cfe8ff] font-silkscreen text-[9px] px-2 py-1 rounded-xs focus:border-[#f4c151] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-[#1e2329] border border-[#3a4149] hover:border-[#f4c151] font-pixel text-[8px] text-[#a7d38a] uppercase py-1 px-2 rounded-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus size={10} /> ADD MEMBER
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Tab 1 Bottom Navigation Bar */}
          <div className="flex items-center justify-between pt-2.5 border-t border-[#2b2e30] mt-2">
            <span className="font-silkscreen text-[8px] text-[#8f9396]">
              {!isMembersLocked && !isDeadlinePassed
                ? '🔒 Lock team roster above to proceed to Next steps.'
                : members.length >= 4
                  ? 'Full squad registered & roster locked.'
                  : `Roster locked with ${members.length}/4 members.`}
            </span>
            <button
              type="button"
              onClick={() => handleProceedToNextTab('tracks_selection')}
              className={`font-pixel text-[9px] px-3 py-1.5 rounded-xs flex items-center gap-1.5 shadow-[2px_2px_0_0_#000] active:translate-y-0.5 cursor-pointer transition-all ${isMembersLocked || isDeadlinePassed
                ? 'bg-[#1e2838] border border-[#2b4466] hover:border-[#00f0ff] text-[#00f0ff] hover:bg-[#25354a]'
                : 'bg-[#1c1a17] border border-[#423321] text-[#f4c151] hover:border-[#f4c151]'
                }`}
            >
              {!isMembersLocked && !isDeadlinePassed && <Lock size={10} />}
              <span>
                {!isMembersLocked && !isDeadlinePassed ? 'LOCK ROSTER TO PROCEED' : 'NEXT: TRACK SELECTION'}
              </span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* TAB: TRACK PREFERENCE SELECTION */}
      {activeTab === 'tracks_selection' && (
        <div className="space-y-3 grow overflow-y-auto">
          {/* Header Banner */}
          <div className="p-3 bg-[#141618] border-2 border-[#2b2e30] rounded-md space-y-1">
            <div className="flex items-center justify-between border-b border-[#2b2e30] pb-2">
              <span className="font-pixel text-[12px] sm:text-[13px] text-[#f4c151] flex items-center gap-1.5">
                <Target size={15} /> CHALLENGE TRACK PREFERENCE RANKING (1 TO 5)
              </span>
              {activeLeadTeam.isTrackLocked ? (
                <span className="bg-[#182418] text-[#a7d38a] border border-[#254225] font-silkscreen text-[9px] px-2 py-0.5 rounded-xs flex items-center gap-1">
                  <Lock size={11} /> PERMANENTLY LOCKED
                </span>
              ) : (
                <span className="bg-[#241d14] text-[#f2933d] border border-[#423325] font-silkscreen text-[9px] px-2 py-0.5 rounded-xs flex items-center gap-1">
                  <AlertTriangle size={11} /> SELECTION PENDING
                </span>
              )}
            </div>
            <p className="font-silkscreen text-[10.5px] text-[#d0d7e0] pt-1 leading-normal">
              Rank all 5 challenge tracks in order of preference (Preference 1 through 5). <strong className="text-[#eb5147]">ONCE CONFIRMED &amp; LOCKED, YOUR PREFERENCE LIST CANNOT BE CHANGED FOR THE ENTIRE HACKATHON.</strong>
            </p>
          </div>

          {/* Warning Banner if unlocked */}
          {!activeLeadTeam.isTrackLocked ? (
            <div className="p-3 bg-[#1c1414] border border-[#522525] rounded-xs font-silkscreen text-[9.5px] text-[#fca5a5] flex items-start gap-2">
              <AlertTriangle size={15} className="text-[#ef4444] shrink-0 mt-0.5" />
              <div>
                <p className="font-pixel text-[10.5px] text-[#eb5147] uppercase">⚠️ PERMANENT RANKING DECISION WARNING</p>
                <p className="text-[#fca5a5] text-[9.5px] leading-snug">
                  Track preference ordering is binding. Once you click "CONFIRM &amp; PERMANENTLY LOCK TRACK PREFERENCES", your preference list (1 to 5) will be locked forever and cannot be modified even before the registration deadline completes.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#142417] border border-[#25522b] rounded-xs font-silkscreen text-[9.5px] text-[#86efac] flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-pixel text-[11px]">
                <ShieldCheck size={15} className="text-[#4ade80]" />
                CONFIRMED TRACK PREFERENCES (1ST CHOICE: {activeLeadTeam.selectedTrack})
              </span>
              <span className="text-[9px] text-[#86efac] font-silkscreen">
                LOCKED ON {new Date(activeLeadTeam.trackLockedAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Track Preferences List (Ordered 1 to 5) */}
          <div className="space-y-2.5">
            {trackPreferences.map((trackName, index) => {
              const trackInfo = AVAILABLE_TRACKS.find((t) => t.name === trackName);
              const rankLabels = ['1st Preference (Primary Track)', '2nd Preference', '3rd Preference', '4th Preference', '5th Preference'];
              const rankBadges = ['🥇 PREFERENCE 1', '🥈 PREFERENCE 2', '🥉 PREFERENCE 3', '4️⃣ PREFERENCE 4', '5️⃣ PREFERENCE 5'];
              const isPrimary = index === 0;

              // Dynamically decrease options list by excluding tracks chosen in OTHER slots
              const chosenInOtherSlots = trackPreferences.filter((val, idx) => idx !== index && val && val.trim() !== '');
              const availableTracksForSlot = AVAILABLE_TRACKS.filter((t) => !chosenInOtherSlots.includes(t.name));

              return (
                <div
                  key={index}
                  className={`p-3 sm:p-3.5 rounded-md border-2 transition-all ${activeLeadTeam.isTrackLocked
                    ? isPrimary
                      ? 'bg-[#162719] border-[#25522b] shadow-[0_0_12px_rgba(37,82,43,0.4)]'
                      : 'bg-[#101214] border-[#232629]'
                    : isPrimary
                      ? 'bg-[#1e2838] border-[#f4c151] shadow-[2px_2px_0_0_#000]'
                      : 'bg-[#101214] border-[#232629]'
                    }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#232629] pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-pixel text-[11px] px-2.5 py-0.5 rounded-xs border ${isPrimary
                        ? 'bg-[#2a2313] text-[#f4c151] border-[#524425]'
                        : 'bg-[#181b1e] text-[#a0aab3] border-[#2b2e30]'
                        }`}>
                        {rankBadges[index]}
                      </span>
                      <span className="font-silkscreen text-[10px] text-[#00f0ff] font-bold uppercase tracking-wider">
                        {rankLabels[index]}
                      </span>
                    </div>

                    {!activeLeadTeam.isTrackLocked ? (
                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <select
                          value={trackName}
                          onChange={(e) => handlePreferenceChange(index, e.target.value)}
                          className="grow sm:grow-0 bg-[#090b0d] border border-[#3a4149] text-[#cfe8ff] font-sans text-xs sm:text-sm px-2.5 py-1.5 rounded-xs focus:border-[#f4c151] focus:outline-none"
                        >
                          <option value="">-- Select Preference {index + 1} ({availableTracksForSlot.length} available) --</option>
                          {availableTracksForSlot.map((t) => (
                            <option key={t.id} value={t.name}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMovePreference(index, 'up')}
                            className="p-1.5 bg-[#181b1e] border border-[#2b2e30] text-[#cfe8ff] hover:bg-[#252a30] disabled:opacity-30 disabled:cursor-not-allowed rounded-xs"
                            title="Move Up"
                          >
                            <ChevronUp size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={index === trackPreferences.length - 1}
                            onClick={() => handleMovePreference(index, 'down')}
                            className="p-1.5 bg-[#181b1e] border border-[#2b2e30] text-[#cfe8ff] hover:bg-[#252a30] disabled:opacity-30 disabled:cursor-not-allowed rounded-xs"
                            title="Move Down"
                          >
                            <ChevronDown size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="bg-[#182418] text-[#a7d38a] border border-[#254225] font-silkscreen text-[9px] px-2 py-0.5 rounded-xs flex items-center gap-1">
                        <Lock size={10} /> PERMANENTLY LOCKED
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      {trackName ? (
                        <>
                          <h4 className="font-pixel text-[13px] sm:text-[14px] text-[#f4c151] mb-0.5 flex items-center gap-1.5">
                            <Award size={14} className="text-[#f4c151]" /> {trackName}
                          </h4>
                          <p className="font-silkscreen text-[9.5px] text-[#00f0ff] mb-1">
                            {trackInfo?.tagline}
                          </p>
                          <p className="font-silkscreen text-[10px] text-[#b4c2d3] leading-relaxed mb-1.5">
                            {trackInfo?.description}
                          </p>
                        </>
                      ) : (
                        <p className="font-silkscreen text-[10px] text-[#f4c151] italic py-1">
                          Please choose a track for Preference {index + 1} from the dropdown above.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Lock Action Bar or Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-[#2b2e30] gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                sound.playBlip(500);
                setActiveTab('team');
              }}
              className="font-pixel text-[10.5px] bg-[#181b1e] border border-[#2b2e30] text-[#8f9396] hover:text-white px-3.5 py-2 rounded-xs flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={13} /> BACK TO MEMBERS
            </button>

            {!activeLeadTeam.isTrackLocked ? (
              <button
                type="button"
                onClick={handleConfirmLockTrack}
                className="w-full sm:w-auto font-pixel text-[11px] bg-[#261414] border-2 border-[#eb5147] text-[#fca5a5] hover:bg-[#381a1a] hover:text-white px-4 py-2.5 rounded-xs flex items-center justify-center gap-2 shadow-[2px_2px_0_0_#000] cursor-pointer"
              >
                <Lock size={13} className="text-[#eb5147]" />
                CONFIRM &amp; PERMANENTLY LOCK TRACK PREFERENCES (1 TO 5)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleProceedToNextTab('fee_payment')}
                className="w-full sm:w-auto font-pixel text-[10.5px] bg-[#1e2838] border border-[#2b4466] hover:border-[#f4c151] text-[#f4c151] px-4 py-2 rounded-xs flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#000] cursor-pointer hover:bg-[#25354a]"
              >
                NEXT: PHASE 1 - FEES PAYMENT <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB: REGISTRATION FEE PAYMENT (UPI QR CODE FOR ₹50) */}
      {activeTab === 'fee_payment' && (
        <div className="space-y-3 grow overflow-y-auto">
          {/* Header Banner */}
          <div className="p-3 bg-[#141618] border-2 border-[#2b2e30] rounded-md space-y-1">
            <div className="flex items-center justify-between border-b border-[#2b2e30] pb-2">
              <span className="font-pixel text-[12px] sm:text-[13px] text-[#f4c151] flex items-center gap-1.5">
                <CreditCard size={15} /> STEP 3: REGISTRATION ENTRY FEE (₹50)
              </span>
              {activeLeadTeam.paymentStatus === 'payment_verified' ? (
                <span className="bg-[#182418] text-[#a7d38a] border border-[#254225] font-silkscreen text-[9px] px-2 py-0.5 rounded-xs flex items-center gap-1">
                  <CheckCircle2 size={11} /> REGISTRATION CONFIRMED BY ADMIN
                </span>
              ) : activeLeadTeam.paymentStatus === 'payment_pending' ? (
                <span className="bg-[#241d14] text-[#f2933d] border border-[#423325] font-silkscreen text-[9px] px-2 py-0.5 rounded-xs flex items-center gap-1 animate-pulse">
                  <Clock size={11} /> VERIFICATION PENDING BY ADMIN
                </span>
              ) : (
                <span className="bg-[#241818] text-[#eb5147] border border-[#422525] font-silkscreen text-[9px] px-2 py-0.5 rounded-xs flex items-center gap-1">
                  <AlertTriangle size={11} /> FEE UNPAID
                </span>
              )}
            </div>
            <p className="font-silkscreen text-[10.5px] text-[#d0d7e0] pt-1 leading-normal">
              Scan the UPI QR code below to pay the mandatory <strong className="text-[#f4c151]">₹50 Team Entry Fee</strong>. After paying via GPay/PhonePe/Paytm, enter your 12-digit UTR Transaction Ref ID below for admin verification.
            </p>
          </div>

          {/* Verified / Confirmed Success Card */}
          {activeLeadTeam.paymentStatus === 'payment_verified' && (
            <div className="p-4 bg-[#142417] border-2 border-[#25522b] rounded-md shadow-[0_0_16px_rgba(37,82,43,0.5)] space-y-3">
              <div className="flex items-center gap-2 text-[#a7d38a]">
                <ShieldCheck size={20} className="text-[#4ade80]" />
                <span className="font-pixel text-[13px] sm:text-[14px] text-[#4ade80]">
                  🎉 PHASE 1 FEE VERIFIED &amp; REGISTRATION CONFIRMED!
                </span>
              </div>
              <p className="font-silkscreen text-[11px] text-[#cfe8ff] leading-relaxed">
                Your ₹50 registration fee has been verified by the Cognitia Admin team. Your team <strong>{activeLeadTeam.teamName}</strong> is officially unlocked to submit Phase 1 Project Deliverables!
              </p>

              <div className="pt-1">
                <a
                  href="https://www.whatsapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sound.playBlip(800)}
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-black font-pixel text-[10px] sm:text-[11px] font-bold px-3.5 py-2 rounded-xs shadow-[2px_2px_0_0_#000] transition-all cursor-pointer"
                >
                  <MessageCircle size={15} /> JOIN PHASE 1 WHATSAPP COMMUNITY <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}

          {/* Verification Pending Warning Card */}
          {activeLeadTeam.paymentStatus === 'payment_pending' && (
            <div className="p-3.5 bg-[#241d14] border-2 border-[#544622] rounded-md space-y-1.5">
              <div className="flex items-center gap-2 text-[#f2933d]">
                <Clock size={18} className="text-[#f4c151] animate-spin" />
                <span className="font-pixel text-[11.5px] sm:text-[12.5px] text-[#f4c151]">
                  ⌛ PAYMENT SUBMITTED — VERIFICATION PENDING BY ADMIN
                </span>
              </div>
              <p className="font-silkscreen text-[10.5px] text-[#ffd17d] leading-snug">
                Your ₹50 payment details (UTR ID: <strong className="font-mono text-white">{activeLeadTeam.paymentTransactionId}</strong>) have been received. The Cognitia Admin team is currently verifying the transaction. Your registration will automatically update to <strong>REGISTRATION CONFIRMED</strong> once verified.
              </p>
            </div>
          )}

          {/* UPI QR Code Card & Payment Details Form */}
          {(() => {
            const phase1Amount = 50;
            const phase1UpiId = '9434364001@pz';
            const phase1TeamNum = activeLeadTeam?.id ? String(activeLeadTeam.id).replace(/^team-/, '') : '0000';
            const phase1Remark = `cognitia-p1-tid-${phase1TeamNum}`;
            const phase1QrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
              `upi://pay?pa=${phase1UpiId}&pn=Cognitia%20Hackathon&am=${phase1Amount}&cu=INR&tn=${phase1Remark}`
            )}`;

            return (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Left: Dynamic UPI QR Code Display */}
                <div className="md:col-span-5 p-3.5 bg-[#141618] border-2 border-[#2b2e30] rounded-md flex flex-col items-center justify-between text-center space-y-2.5">
                  <span className="font-pixel text-[11px] text-[#f4c151] flex items-center gap-1.5">
                    <QrCode size={14} /> UPI QR CODE
                  </span>

                  {/* Generated Dynamic UPI QR Code */}
                  <div className="p-2.5 bg-white rounded-md border-4 border-[#3a4149] shadow-[0_0_12px_rgba(244,193,81,0.3)]">
                    <img
                      src={phase1QrUrl}
                      alt="Dynamic UPI QR Code ₹50"
                      className="w-44 h-44 sm:w-48 sm:h-48 object-contain pixelated"
                    />
                  </div>

                  {/* UPI Details Box */}
                  <div className="w-full space-y-1">
                    <div className="flex items-center justify-between bg-[#090b0d] border border-[#2b2e30] px-2.5 py-1.5 rounded-xs font-mono text-[10px]">
                      <span className="text-[#8f9396] font-silkscreen text-[9px]">UPI ID:</span>
                      <span className="text-[#00f0ff] font-bold">{phase1UpiId}</span>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playBlip(700);
                          navigator.clipboard.writeText(phase1UpiId);
                          setCopiedUpi(true);
                          setTimeout(() => setCopiedUpi(false), 2000);
                        }}
                        className="text-[#f4c151] hover:underline font-pixel text-[9px] cursor-pointer"
                      >
                        {copiedUpi ? 'COPIED!' : 'COPY'}
                      </button>
                    </div>
                    <div className="font-mono text-[9px] text-[#a7d38a] space-y-0.5 pt-0.5">
                      <p>ENTRY FEE: <span className="font-bold text-[#f4c151]">₹{phase1Amount} INR</span></p>
                      <p className="text-[8.5px] text-[#8f9396]">REMARK: <span className="text-white font-bold">{phase1Remark}</span></p>
                    </div>
                  </div>
                </div>

                {/* Right: Payment Reference ID / UTR Form */}
                <div className="md:col-span-7 p-3.5 bg-[#141618] border-2 border-[#2b2e30] rounded-md flex flex-col justify-between space-y-3">
                  <div>
                    <span className="font-pixel text-[11px] text-[#6fb3d9] block border-b border-[#2b2e30] pb-1.5 mb-2.5">
                      ENTER PAYMENT TRANSACTION DETAILS
                    </span>

                    {feeMessage && (
                      <div
                        className={`p-2.5 rounded-xs border font-silkscreen text-[9.5px] flex items-center gap-1.5 mb-2.5 ${feeMessage.type === 'success'
                          ? 'bg-[#142417] border-[#25522b] text-[#86efac]'
                          : 'bg-[#261414] border-[#522525] text-[#fca5a5]'
                          }`}
                      >
                        {feeMessage.type === 'success' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                        <span>{feeMessage.text}</span>
                      </div>
                    )}

                    <form onSubmit={handleFeePaymentSubmit} className="space-y-2.5">
                      <div>
                        <label className="block font-silkscreen text-[9.5px] text-[#8f9396] mb-1">
                          12-Digit UPI UTR / Ref ID <span className="text-[#eb5147]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={12}
                          disabled={activeLeadTeam.paymentStatus !== 'unpaid'}
                          placeholder="e.g. 423910582910"
                          value={feeUtrId}
                          onChange={(e) => setFeeUtrId(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-[#0c0e10] border border-[#2b2e30] text-[#00f0ff] font-mono text-sm px-2.5 py-1.5 rounded-xs focus:border-[#00f0ff] focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                        />
                        <span className="font-silkscreen text-[8.5px] text-[#7d8285] block mt-0.5">
                          Enter the 12-digit UTR/Ref number from GPay, PhonePe, or Paytm receipt.
                        </span>
                      </div>

                      <div>
                        <label className="block font-silkscreen text-[9.5px] text-[#8f9396] mb-1">
                          Payment Screenshot Proof (Max 1 MB) <span className="text-[#a7d38a]">*</span>
                        </label>

                        {/* Direct File Upload Button */}
                        {activeLeadTeam.paymentStatus === 'unpaid' && (
                          <label className="cursor-pointer font-pixel text-[9px] bg-[#1e2329] border border-[#3a4149] hover:border-[#a7d38a] text-[#a7d38a] py-2 px-3 rounded-xs flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#000] w-full transition-all">
                            <CloudUpload size={14} />
                            {isUploadingPayment
                              ? 'UPLOADING SCREENSHOT...'
                              : feeProofUrl
                                ? 'CHANGE PAYMENT SCREENSHOT (MAX 1 MB)'
                                : 'SELECT & UPLOAD SCREENSHOT IMAGE (MAX 1 MB)'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhase1ScreenshotUpload}
                              className="hidden"
                            />
                          </label>
                        )}

                        {/* Screenshot Preview Card */}
                        {feeProofUrl && (
                          <div className="mt-2 p-2 bg-[#090b0d] border border-[#254225] rounded-xs space-y-1.5">
                            <div className="flex items-center justify-between font-silkscreen text-[8px] text-[#a7d38a]">
                              <span>📷 ATTACHED RECEIPT PREVIEW (MAX 1 MB VERIFIED):</span>
                              {activeLeadTeam.paymentStatus === 'unpaid' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFeeProofUrl('');
                                    setFeeProofFileName('');
                                  }}
                                  className="text-[#eb5147] hover:underline"
                                >
                                  [Remove]
                                </button>
                              )}
                            </div>
                            <div className="border border-[#2b2e30] rounded-xs overflow-hidden h-28 bg-black">
                              <img src={feeProofUrl} alt="Phase 1 Payment Screenshot" className="w-full h-full object-contain" />
                            </div>
                            {feeProofFileName && (
                              <span className="font-mono text-[8px] text-[#8f9396] block truncate">
                                File: {feeProofFileName}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {activeLeadTeam.paymentStatus === 'unpaid' ? (
                        <button
                          type="submit"
                          disabled={isSubmittingFee}
                          className="w-full bg-[#182418] border-2 border-[#254225] hover:border-[#a7d38a] font-pixel text-[11px] text-[#a7d38a] uppercase py-2.5 px-3 rounded-xs flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#000] cursor-pointer mt-3"
                        >
                          <CheckCircle2 size={13} /> SUBMIT ₹50 PAYMENT FOR ADMIN VERIFICATION
                        </button>
                      ) : (
                        <div className="p-2.5 bg-[#142417] border border-[#25522b] rounded-xs font-silkscreen text-[9.5px] text-[#86efac] flex items-center justify-center gap-1.5 mt-3">
                          <CheckCircle2 size={13} className="text-[#4ade80]" />
                          <span>
                            {activeLeadTeam.paymentStatus === 'payment_verified'
                              ? 'PAYMENT VERIFIED BY ADMIN — REGISTRATION CONFIRMED'
                              : 'PAYMENT SUBMITTED — VERIFICATION PENDING BY ADMIN'}
                          </span>
                        </div>
                      )}
                    </form>
                  </div>

                  <div className="pt-2 border-t border-[#2b2e30] flex items-center justify-between text-[9px] font-silkscreen text-[#7d8285]">
                    <span>PAYMENT ENCRYPTED BY UPI GATEWAY</span>
                    <span className="text-[#f4c151]">₹50 ENTRY FEE</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Bottom Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-[#2b2e30] gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                sound.playBlip(500);
                setActiveTab('tracks_selection');
              }}
              className="font-pixel text-[10.5px] bg-[#181b1e] border border-[#2b2e30] text-[#8f9396] hover:text-white px-3.5 py-2 rounded-xs flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={13} /> BACK TO TRACK PREFERENCES
            </button>

            {activeLeadTeam.paymentStatus === 'payment_verified' && (
              <button
                type="button"
                onClick={() => handleProceedToNextTab('submission')}
                className="w-full sm:w-auto font-pixel text-[10.5px] bg-[#1e2838] border border-[#2b4466] hover:border-[#00f0ff] text-[#00f0ff] px-4 py-2 rounded-xs flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#000] cursor-pointer hover:bg-[#25354a]"
              >
                NEXT: PHASE 1 - DELIVERABLES <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DELIVERABLES */}
      {activeTab === 'submission' && (
        activeLeadTeam.paymentStatus !== 'payment_verified' ? (
          <div className="p-6 bg-[#141618] border-2 border-[#544622] rounded-md text-center space-y-4 my-auto">
            <div className="flex justify-center">
              <Clock size={44} className="animate-spin text-[#f4c151]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-pixel text-[13px] sm:text-[14px] text-[#f4c151] uppercase">
                {activeLeadTeam.paymentStatus === 'payment_pending'
                  ? '⌛ PAYMENT VERIFICATION PENDING BY ADMIN'
                  : '🔒 PHASE 1 FEES PAYMENT REQUIRED'}
              </h3>
              <p className="font-silkscreen text-[10.5px] text-[#ffd17d] max-w-lg mx-auto leading-relaxed">
                {activeLeadTeam.paymentStatus === 'payment_pending'
                  ? `Your ₹50 payment details (UTR ID: ${activeLeadTeam.paymentTransactionId || 'Submitted'}) have been received and are currently being verified by the Cognitia Admin team. Deliverables submission will unlock automatically as soon as your payment is verified.`
                  : 'You must pay and verify your ₹50 registration fee in Phase 1 Fees Payment before you can submit Phase 1 Deliverables.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playBlip(500);
                setActiveTab('fee_payment');
              }}
              className="font-pixel text-[10.5px] bg-[#241d14] border-2 border-[#f4c151] text-[#f4c151] hover:bg-[#382b1c] px-4 py-2 rounded-xs cursor-pointer shadow-[2px_2px_0_0_#000]"
            >
              GO TO PHASE 1 FEES PAYMENT
            </button>
          </div>
        ) : (
          <form onSubmit={handleProjectSubmit} className="space-y-3 grow overflow-y-auto">
            {submitMessage && (
              <div
                className={`p-2.5 rounded-xs border font-silkscreen text-[8px] flex items-center gap-1.5 ${submitMessage.type === 'success'
                  ? 'bg-[#142417] border-[#25522b] text-[#86efac]'
                  : 'bg-[#261414] border-[#522525] text-[#fca5a5]'
                  }`}
              >
                {submitMessage.type === 'success' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                <span>{submitMessage.text}</span>
              </div>
            )}

            {/* Project Overview */}
            <div className="p-3 bg-[#141618] border-2 border-[#2b2e30] rounded-md space-y-2">
              <span className="font-pixel text-[10px] text-[#f4c151] block border-b border-[#2b2e30] pb-1">
                PHASE 1 PROJECT TITLE &amp; OVERVIEW
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block font-silkscreen text-[8px] text-[#8f9396] mb-1">
                    Project Title <span className="text-[#eb5147]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Spider-Sense AI"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full bg-[#0c0e10] border border-[#2b2e30] text-[#cfe8ff] font-silkscreen text-[9px] px-2 py-1 rounded-xs focus:border-[#f4c151] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-silkscreen text-[8px] text-[#8f9396] mb-1">
                    Project Pitch Tagline
                  </label>
                  <input
                    type="text"
                    placeholder="Brief one-line summary of project"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full bg-[#0c0e10] border border-[#2b2e30] text-[#cfe8ff] font-silkscreen text-[9px] px-2 py-1 rounded-xs focus:border-[#f4c151] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* PHASE 1 EVALUATION QUESTIONS */}
            <div className="p-3.5 bg-[#141618] border-2 border-[#a7d38a]/40 rounded-md space-y-3">
              <div className="border-b border-[#254225] pb-1.5 flex items-center justify-between">
                <span className="font-pixel text-[10.5px] text-[#a7d38a] flex items-center gap-1.5">
                  <FileText size={14} /> PHASE 1 PROJECT EVALUATION QUESTIONS (MANDATORY)
                </span>
                <span className="font-silkscreen text-[8px] bg-[#142417] text-[#86efac] border border-[#25522b] px-2 py-0.5 rounded-xs">
                  4000 WORDS LIMIT PER ANSWER
                </span>
              </div>

              {/* Question 1 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-pixel text-[9px] text-[#f4c151]">
                    1. Proposed Solution &amp; Implementation Architecture <span className="text-[#eb5147]">*</span>
                  </label>
                  <span className={`font-silkscreen text-[7.5px] ${getWordCount(proposedSolution) > 4000 ? 'text-[#eb5147] font-bold' : 'text-[#8f9396]'}`}>
                    {getWordCount(proposedSolution)} / 4000 WORDS
                  </span>
                </div>
                <p className="font-silkscreen text-[8px] text-[#8f9396]">
                  What is your proposed solution and detailed technical implementation?
                </p>
                <textarea
                  required
                  rows={5}
                  placeholder="Describe your proposed solution, core implementation features, data flow, and architecture (Max 4000 words)..."
                  value={proposedSolution}
                  onChange={(e) => handleAnswerChange(e.target.value, setProposedSolution)}
                  className="w-full bg-[#090b0d] border border-[#2b2e30] text-[#cfe8ff] font-silkscreen text-xs p-2.5 rounded-xs focus:border-[#f4c151] focus:outline-none leading-relaxed min-h-[110px]"
                />
              </div>

              {/* Question 2 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-pixel text-[9px] text-[#00f0ff]">
                    2. Technology Stack &amp; Justification <span className="text-[#eb5147]">*</span>
                  </label>
                  <span className={`font-silkscreen text-[7.5px] ${getWordCount(techStackJustification) > 4000 ? 'text-[#eb5147] font-bold' : 'text-[#8f9396]'}`}>
                    {getWordCount(techStackJustification)} / 4000 WORDS
                  </span>
                </div>
                <p className="font-silkscreen text-[8px] text-[#8f9396]">
                  What technology stack are you using and justify its selection for this project?
                </p>
                <textarea
                  required
                  rows={5}
                  placeholder="List your programming languages, frameworks, databases, APIs, and explain why they were selected (Max 4000 words)..."
                  value={techStackJustification}
                  onChange={(e) => handleAnswerChange(e.target.value, setTechStackJustification)}
                  className="w-full bg-[#090b0d] border border-[#2b2e30] text-[#cfe8ff] font-silkscreen text-xs p-2.5 rounded-xs focus:border-[#00f0ff] focus:outline-none leading-relaxed min-h-[110px]"
                />
              </div>

              {/* Question 3 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-pixel text-[9px] text-[#a7d38a]">
                    3. Scalable Deployment Strategy <span className="text-[#eb5147]">*</span>
                  </label>
                  <span className={`font-silkscreen text-[7.5px] ${getWordCount(deploymentStrategy) > 4000 ? 'text-[#eb5147] font-bold' : 'text-[#8f9396]'}`}>
                    {getWordCount(deploymentStrategy)} / 4000 WORDS
                  </span>
                </div>
                <p className="font-silkscreen text-[8px] text-[#8f9396]">
                  What is your deployment strategy to run, maintain, and scale the application under high traffic?
                </p>
                <textarea
                  required
                  rows={5}
                  placeholder="Explain your cloud hosting, CI/CD pipeline, caching layers, containerization, and scaling strategy (Max 4000 words)..."
                  value={deploymentStrategy}
                  onChange={(e) => handleAnswerChange(e.target.value, setDeploymentStrategy)}
                  className="w-full bg-[#090b0d] border border-[#2b2e30] text-[#cfe8ff] font-silkscreen text-xs p-2.5 rounded-xs focus:border-[#a7d38a] focus:outline-none leading-relaxed min-h-[110px]"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isUploading}
              className="w-full bg-[#182418] border-2 border-[#254225] hover:border-[#a7d38a] font-pixel text-[10px] text-[#a7d38a] uppercase py-2.5 px-3 rounded-xs flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#000] cursor-pointer"
            >
              <Send size={14} /> {isUploading ? 'UPLOADING DELIVERABLES...' : 'SUBMIT PROJECT DELIVERABLES'}
            </button>

            {/* Tab 2 Navigation Bar */}
            <div className="flex items-center justify-between pt-2.5 border-t border-[#2b2e30] mt-3">
              <button
                type="button"
                onClick={() => {
                  sound.playBlip(400);
                  setActiveTab('team');
                }}
                className="font-pixel text-[9px] bg-[#181c22] border border-[#2b2e30] hover:border-[#6fb3d9] text-[#9ad4ff] px-3 py-1.5 rounded-xs flex items-center gap-1.5 cursor-pointer hover:bg-[#202730] transition-all"
              >
                <ArrowLeft size={12} /> BACK TO MEMBERS
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playBlip(600);
                  setActiveTab('phase2');
                }}
                className="font-pixel text-[9px] bg-[#221a2c] border border-[#482b66] hover:border-[#b180ff] text-[#b180ff] px-3 py-1.5 rounded-xs flex items-center gap-1.5 shadow-[2px_2px_0_0_#000] active:translate-y-0.5 cursor-pointer hover:bg-[#2f223d] transition-all"
              >
                NEXT: PHASE 2 <ArrowRight size={12} />
              </button>
            </div>
          </form>
        )
      )}

      {/* TAB 3: PHASE 2 OFFLINE ROUND & DYNAMIC UPI QR PAYMENT & TICKET */}
      {activeTab === 'phase2' && (
        <div className="space-y-3 grow overflow-y-auto">
          {/* Phase 2 Selection Status Card */}
          {(!activeLeadTeam.phase2Status || activeLeadTeam.phase2Status === 'pending') && (
            <div className="p-4 bg-[#141618] border-2 border-[#2b2e30] rounded-md text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-[#241d14] text-[#f2933d] border border-[#423325] font-pixel text-[9px] px-3 py-1 rounded-xs">
                <Clock size={14} /> PHASE 1 EVALUATION IN PROGRESS
              </div>
              <p className="font-silkscreen text-[8px] text-[#8f9396]">
                Your Phase 1 project deliverables are under evaluation by the Cognitia Jury. Selection status for the offline round will be updated soon.
              </p>
            </div>
          )}

          {activeLeadTeam.phase2Status === 'waitlisted' && (
            <div className="p-4 bg-[#141618] border-2 border-[#423325] rounded-md text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-[#241d14] text-[#f2933d] border border-[#423325] font-pixel text-[9px] px-3 py-1 rounded-xs">
                <Hourglass size={14} /> WAITLISTED FOR PHASE 2 OFFLINE ROUND
              </div>
              <p className="font-silkscreen text-[8px] text-[#cfe8ff]">
                Your team is currently on the official Cognitia Phase 2 Waitlist. If a confirmed spot opens up, the jury will promote your team, and you will be notified to confirm RSVP &amp; proceed to payment!
              </p>
            </div>
          )}

          {activeLeadTeam.phase2Status === 'not_selected' && (
            <div className="p-4 bg-[#141618] border-2 border-[#422525] rounded-md text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-[#261414] text-[#eb5147] border border-[#522525] font-pixel text-[9px] px-3 py-1 rounded-xs">
                <AlertTriangle size={14} /> PHASE 1 COMPLETED
              </div>
              <p className="font-silkscreen text-[8px] text-[#8f9396]">
                Thank you for participating in Cognitia 2026! Unfortunately, your team was not selected for the Phase 2 Offline Round.
              </p>
            </div>
          )}

          {activeLeadTeam.phase2Status === 'selected' && (
            <div className="space-y-3">
              {/* Step 1: RSVP Confirmation */}
              {!activeLeadTeam.rsvpConfirmed ? (
                <div className="p-4 bg-[#141618] border-2 border-[#b180ff] rounded-md space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-[#b180ff]" size={18} />
                    <span className="font-pixel text-[11px] text-[#b180ff]">
                      CONGRATULATIONS! SELECTED FOR PHASE 2 OFFLINE ROUND
                    </span>
                  </div>
                  <p className="font-silkscreen text-[8px] text-[#cfe8ff]">
                    Phase 2 takes place live at the Campus Auditorium. Please confirm your team's offline participation RSVP to proceed to payment and ticket pass generation.
                  </p>
                  <button
                    onClick={handleConfirmRsvp}
                    className="w-full bg-[#2b1f3d] border-2 border-[#b180ff] hover:bg-[#392854] font-pixel text-[9px] text-[#b180ff] uppercase py-2 px-3 rounded-xs flex items-center justify-center gap-2 shadow-[2px_2px_0_0_#000] cursor-pointer"
                  >
                    <Check size={14} /> CONFIRM OFFLINE PARTICIPATION RSVP
                  </button>
                </div>
              ) : (
                <>
                  {/* Step 2: Payment Submitted & Verification Pending */}
                  {activeLeadTeam.phase2PaymentStatus === 'payment_pending' &&
                   (activeLeadTeam.phase2PaymentTransactionId || activeLeadTeam.phase2PaymentScreenshotUrl) ? (
                    <div className="p-4 bg-[#141618] border-2 border-[#544622] rounded-md space-y-3">
                      <div className="flex items-center justify-between border-b border-[#2b2e30] pb-2">
                        <span className="font-pixel text-[10px] text-[#f4c151] flex items-center gap-1.5">
                          <Clock size={14} className="text-[#f4c151] animate-spin" /> PHASE 2 PAYMENT SUBMITTED
                        </span>
                        <span className="font-silkscreen text-[8px] px-2 py-0.5 rounded-xs border bg-[#241d14] text-[#f2933d] border-[#423325]">
                          VERIFICATION PENDING
                        </span>
                      </div>

                      <div className="p-3 bg-[#090b0d] border border-[#2b2e30] rounded-xs font-silkscreen text-[9px] text-[#cfe8ff] space-y-1.5">
                        <p>Your Phase 2 offline entry fee payment details (₹500) have been submitted to Cognitia Admin for verification.</p>
                        {activeLeadTeam.phase2PaymentTransactionId && (
                          <p className="font-mono text-[10px] text-[#f4c151]">
                            SUBMITTED UTR / TRANS ID: <span className="font-bold text-white">{activeLeadTeam.phase2PaymentTransactionId}</span>
                          </p>
                        )}
                      </div>

                      <div className="p-2.5 bg-[#1c1813] border border-[#3d2c1c] rounded-xs text-[8.5px] font-silkscreen text-[#f2933d] flex items-center gap-1.5">
                        <Clock size={13} className="text-[#f4c151] shrink-0" />
                        <span>Admin verification is in progress. Your official offline pass will generate automatically upon verification.</span>
                      </div>
                    </div>
                  ) : activeLeadTeam.phase2PaymentStatus !== 'payment_verified' ? (
                    <div className="p-4 bg-[#141618] border-2 border-[#2b2e30] rounded-md space-y-3">
                      <div className="flex items-center justify-between border-b border-[#2b2e30] pb-2">
                        <span className="font-pixel text-[10px] text-[#f4c151] flex items-center gap-1.5">
                          <CreditCard size={14} /> PHASE 2 OFFLINE ENTRY FEE &amp; DYNAMIC UPI QR
                        </span>
                        <span className="font-silkscreen text-[8px] bg-[#241d14] text-[#f2933d] border border-[#423325] px-2 py-0.5 rounded-xs">
                          PAYMENT REQUIRED
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                        {/* Dynamic UPI QR Code Box */}
                        <div className="bg-[#090b0d] border border-[#2b2e30] p-3 rounded-xs flex flex-col items-center justify-center text-center space-y-2">
                          <span className="font-pixel text-[8px] text-[#6fb3d9]">SCAN TO PAY VIA ANY UPI APP</span>
                          <div className="p-1 bg-white rounded-md border-2 border-[#f4c151]">
                            <img src={qrCodeImageUrl} alt="Dynamic UPI Payment QR" className="w-40 h-40" />
                          </div>
                          <div className="font-mono text-[9px] text-[#a7d38a] space-y-0.5">
                            <p>UPI ID: <span className="font-bold text-white">{upiId}</span></p>
                            <p>AMOUNT: <span className="font-bold text-[#f4c151]">₹{amount} INR</span></p>
                            <p className="text-[8px] text-[#8f9396]">REMARK: {remark}</p>
                          </div>
                        </div>

                        {/* Payment Instructions & Receipt Upload */}
                        <div className="space-y-3">
                          <div className="bg-[#090b0d] border border-[#2b2e30] p-2.5 rounded-xs text-[8px] font-silkscreen text-[#8f9396] space-y-1">
                            <p className="text-[#cfe8ff] font-pixel text-[8px]">PAYMENT INSTRUCTIONS:</p>
                            <p>1. Open Google Pay, PhonePe, Paytm, or BHIM.</p>
                            <p>2. Scan the dynamic QR code above. Amount &amp; Remark will be auto-filled.</p>
                            <p>3. Complete ₹500 payment and copy the Transaction / UTR ID.</p>
                            <p>4. Enter Transaction ID &amp; upload receipt screenshot below.</p>
                          </div>

                          <div>
                            <label className="block font-silkscreen text-[8px] text-[#8f9396] mb-1 flex items-center gap-1">
                              <Hash size={10} /> UPI Transaction ID / UTR Ref Number <span className="text-[#eb5147]">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 429183749012 or UPI/123456"
                              value={paymentTxId}
                              onChange={(e) => setPaymentTxId(e.target.value)}
                              className="w-full bg-[#090b0d] border border-[#2b2e30] text-[#f4c151] font-mono text-xs px-2.5 py-1.5 rounded-xs focus:border-[#f4c151] focus:outline-none"
                            />
                          </div>

                          <label className="cursor-pointer font-pixel text-[8px] bg-[#1e2329] border border-[#3a4149] hover:border-[#f4c151] text-[#f4c151] py-2 px-3 rounded-xs flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#000] w-full">
                            <CloudUpload size={14} />
                            {isUploadingPayment
                              ? 'UPLOADING RECEIPT...'
                              : 'UPLOAD PAYMENT SCREENSHOT'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePaymentScreenshotUpload}
                              className="hidden"
                            />
                          </label>

                          {paymentScreenshot && (
                            <div className="space-y-2">
                              <div className="border border-[#2b2e30] rounded-xs overflow-hidden h-24 bg-black">
                                <img src={paymentScreenshot} alt="Phase 2 Payment Receipt" className="w-full h-full object-contain" />
                              </div>

                              <button
                                type="button"
                                onClick={handlePhase2PaymentSubmit}
                                disabled={isUploadingPayment}
                                className="w-full font-pixel text-[9px] bg-[#1a2e1d] hover:bg-[#25452a] border border-[#a7d38a] text-[#a7d38a] py-2 px-3 rounded-xs flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#000] cursor-pointer transition-colors"
                              >
                                <Send size={12} />
                                <span>SUBMIT PHASE 2 PAYMENT FOR VERIFICATION</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Step 3: Verified Downloadable Offline Pass Ticket */}
                  {activeLeadTeam.phase2PaymentStatus === 'payment_verified' && (
                    <div className="space-y-3">
                      <div className="p-2.5 bg-[#182418] border border-[#254225] text-[#a7d38a] font-silkscreen text-[8px] flex flex-wrap items-center justify-between gap-2 rounded-xs">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 size={12} /> PAYMENT VERIFIED! OFFICIAL OFFLINE PASS GENERATED.
                        </span>
                        <div className="flex items-center gap-2">
                          <a
                            href="https://www.whatsapp.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => sound.playBlip(800)}
                            className="font-pixel text-[7.5px] bg-[#25D366] text-black font-bold px-2.5 py-1 rounded-xs flex items-center gap-1 cursor-pointer hover:bg-[#20ba5a] transition-all"
                          >
                            <MessageCircle size={11} /> JOIN PHASE 2 WHATSAPP <ExternalLink size={9} />
                          </a>
                          <button
                            onClick={handlePrintTicket}
                            className="font-pixel text-[7.5px] bg-[#1a2d42] border border-[#f4c151] text-[#f4c151] px-2.5 py-1 rounded-xs flex items-center gap-1 cursor-pointer hover:bg-[#25354a]"
                          >
                            <Printer size={10} /> PRINT / DOWNLOAD
                          </button>
                        </div>
                      </div>

                      {/* TICKET CARD PASS */}
                      <div
                        ref={ticketRef}
                        className="bg-[#141618] border-4 border-[#f4c151] p-4 rounded-md shadow-[6px_6px_0_0_#000] space-y-3 text-[#cfe8ff] relative overflow-hidden"
                      >
                        {/* Background Watermark */}
                        <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none font-pixel text-[80px] text-[#f4c151]">
                          2026
                        </div>

                        {/* Ticket Header */}
                        <div className="flex items-center justify-between border-b-2 border-[#f4c151] pb-2">
                          <div>
                            <span className="font-pixel text-[12px] text-[#f4c151] block">
                              COGNITIA 2026 &bull; OFFLINE PASS
                            </span>
                            <span className="font-silkscreen text-[7px] text-[#8f9396]">
                              OFFICIAL PARTICIPANT ENTRY TICKET
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="bg-[#182418] text-[#a7d38a] border border-[#254225] font-mono text-[9px] font-bold px-2 py-0.5 rounded-xs">
                              {activeLeadTeam.ticketPassId || `PASS-COG26-${activeLeadTeam.id.slice(-4).toUpperCase()}`}
                            </span>
                            {activeLeadTeam.attendanceStatus === 'checked_in' && (
                              <span className="bg-[#182418] text-[#a7d38a] border border-[#254225] font-silkscreen text-[7px] px-1.5 py-0.5 rounded-xs flex items-center gap-1">
                                <CheckCircle2 size={8} /> VENUE CHECKED IN ({activeLeadTeam.checkInTimestamp || 'CONFIRMED'})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Team Info & Event Metadata */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                          <div className="sm:col-span-2 space-y-1 font-silkscreen text-[8px]">
                            <p className="font-pixel text-[11px] text-[#6fb3d9]">
                              TEAM: {activeLeadTeam.teamName}
                            </p>
                            <p className="text-[#8f9396]">
                              LEAD: {activeLeadTeam.leadEmail} ({activeLeadTeam.leadPhone})
                            </p>
                            {activeLeadTeam.paymentTransactionId && (
                              <p className="text-[#f4c151] font-mono">
                                TX ID: {activeLeadTeam.paymentTransactionId}
                              </p>
                            )}

                            <div className="pt-1.5 space-y-1 text-[#cfe8ff]">
                              <p className="flex items-center gap-1 text-[#a7d38a]">
                                <Building size={10} /> VENUE: Campus Main Auditorium, Hall B
                              </p>
                              <p className="flex items-center gap-1 text-[#f4c151]">
                                <Calendar size={10} /> DATE: September 11–12, 2026
                              </p>
                              <p className="flex items-center gap-1 text-[#6fb3d9]">
                                <Clock size={10} /> TIME: 09:00 AM IST
                              </p>
                            </div>
                          </div>

                          {/* Venue Check-In QR */}
                          <div className="bg-[#090b0d] border border-[#2b2e30] p-2 rounded-xs flex flex-col items-center justify-center text-center">
                            <span className="font-pixel text-[7px] text-[#f4c151] mb-1">VENUE CHECK-IN</span>
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                                activeLeadTeam.ticketPassId || activeLeadTeam.id
                              )}`}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `https://quickchart.io/qr?text=${encodeURIComponent(
                                  activeLeadTeam.ticketPassId || activeLeadTeam.id
                                )}&size=200`;
                              }}
                              alt="Ticket Pass QR"
                              className="w-20 h-20 bg-white p-1 rounded-xs border-2 border-[#f4c151] object-contain shadow-md"
                            />
                            <span className="font-mono text-[6px] text-[#8f9396] mt-1">SCAN AT ENTRANCE</span>
                          </div>
                        </div>

                        {/* Full Track Preferences List */}
                        <div className="border-t border-[#2b2e30] pt-2 space-y-1">
                          <span className="font-silkscreen text-[7.5px] text-[#f4c151] uppercase block">
                            FULL TRACK PREFERENCES ORDER:
                          </span>
                          <div className="flex flex-wrap gap-1 font-silkscreen text-[7.5px]">
                            {activeLeadTeam.trackPreferences && activeLeadTeam.trackPreferences.filter(Boolean).length > 0 ? (
                              activeLeadTeam.trackPreferences.filter(Boolean).map((track, idx) => (
                                <span key={idx} className="bg-[#090b0d] border border-[#2b2e30] text-[#cfe8ff] px-2 py-0.5 rounded-xs flex items-center gap-1">
                                  <span className="text-[#f4c151] font-bold">#{idx + 1}:</span> {track}
                                </span>
                              ))
                            ) : (
                              <span className="text-[#cfe8ff] bg-[#090b0d] px-2 py-0.5 border border-[#2b2e30] rounded-xs">
                                {activeLeadTeam.selectedTrack || 'General Track'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Full Team Roster & Member Details */}
                        <div className="border-t border-[#2b2e30] pt-2 space-y-1">
                          <span className="font-silkscreen text-[7.5px] text-[#a7d38a] uppercase block">
                            ADMITTED PARTICIPANTS ROSTER ({activeLeadTeam.members.length}):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-silkscreen text-[7.5px]">
                            {activeLeadTeam.members.map((m, idx) => (
                              <div key={m.id || idx} className="bg-[#090b0d] border border-[#2b2e30] p-1.5 rounded-xs text-[#cfe8ff]">
                                <div className="flex items-center justify-between font-bold">
                                  <span>{m.name} {m.isLead ? '(LEAD)' : ''}</span>
                                  <span className="text-[#8f9396] font-normal">{m.role || 'Member'}</span>
                                </div>
                                <div className="text-[7px] text-[#8f9396] font-mono mt-0.5 flex flex-wrap gap-x-2">
                                  {m.email && <span>{m.email}</span>}
                                  {m.phone && <span>{m.phone}</span>}
                                  {m.githubId && <span className="text-[#6fb3d9]">@{m.githubId}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: PHASE 2 VERIFY STATUS & OFFICIAL PASS */}
      {activeTab === 'phase2_status' && (
        <div className="space-y-4 grow overflow-y-auto">
          {/* Status Banner Card */}
          {activeLeadTeam.phase2PaymentStatus === 'payment_verified' && activeLeadTeam.ticketPassId ? (
            <div className="p-4 bg-[#142414] border-2 border-[#a7d38a] rounded-md space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#254225] pb-2">
                <span className="font-pixel text-[11px] text-[#a7d38a] flex items-center gap-2">
                  <ShieldCheck size={16} /> PHASE 2 PAYMENT VERIFIED &amp; CONFIRMED!
                </span>
                <span className="bg-[#244224] text-[#a7d38a] border border-[#3b6b3b] font-silkscreen text-[8.5px] px-2.5 py-0.5 rounded-xs font-bold">
                  VERIFIED BY ADMIN
                </span>
              </div>

              <p className="font-silkscreen text-[9px] text-[#d1d5db]">
                Congratulations! Your Phase 2 offline entry fee payment (₹500) has been verified by the Cognitia Admin team. Your official Offline Pass Ticket is generated below.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href="https://www.whatsapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sound.playBlip(800)}
                  className="font-pixel text-[8.5px] bg-[#25D366] text-black font-bold px-3 py-1.5 rounded-xs flex items-center gap-1.5 cursor-pointer hover:bg-[#20ba5a] transition-all shadow-[2px_2px_0_0_#000]"
                >
                  <MessageCircle size={13} /> JOIN PHASE 2 WHATSAPP COMMUNITY <ExternalLink size={10} />
                </a>
                <button
                  onClick={handlePrintTicket}
                  className="font-pixel text-[8.5px] bg-[#1a2d42] border border-[#f4c151] text-[#f4c151] px-3 py-1.5 rounded-xs flex items-center gap-1.5 cursor-pointer hover:bg-[#25354a] shadow-[2px_2px_0_0_#000]"
                >
                  <Printer size={12} /> PRINT / DOWNLOAD OFFICIAL TICKET PASS
                </button>
              </div>

              {/* TICKET PASS DISPLAY */}
              <div
                ref={ticketRef}
                className="bg-[#090b0d] border-4 border-[#f4c151] p-4 rounded-md shadow-[6px_6px_0_0_#000] space-y-3 text-[#cfe8ff] relative overflow-hidden mt-3"
              >
                {/* Background Watermark */}
                <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none font-pixel text-[80px] text-[#f4c151]">
                  2026
                </div>

                {/* Ticket Header */}
                <div className="flex items-center justify-between border-b-2 border-[#f4c151] pb-2">
                  <div>
                    <span className="font-pixel text-[13px] text-[#f4c151] block">
                      COGNITIA 2026 &bull; OFFLINE ENTRY PASS
                    </span>
                    <span className="font-silkscreen text-[8px] text-[#8f9396]">
                      OFFICIAL PARTICIPANT VENUE TICKET
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="bg-[#182418] text-[#a7d38a] border border-[#254225] font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-xs">
                      {activeLeadTeam.ticketPassId}
                    </span>
                    {activeLeadTeam.attendanceStatus === 'checked_in' && (
                      <span className="bg-[#182418] text-[#a7d38a] border border-[#254225] font-silkscreen text-[7.5px] px-1.5 py-0.5 rounded-xs flex items-center gap-1">
                        <CheckCircle2 size={9} /> VENUE CHECKED IN ({activeLeadTeam.checkInTimestamp || 'CONFIRMED'})
                      </span>
                    )}
                  </div>
                </div>

                {/* Team Info & Event Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="sm:col-span-2 space-y-1.5 font-silkscreen text-[8.5px]">
                    <p className="font-pixel text-[12px] text-[#6fb3d9]">
                      TEAM: {activeLeadTeam.teamName}
                    </p>
                    <p className="text-[#8f9396]">
                      LEAD: {activeLeadTeam.leadEmail} ({activeLeadTeam.leadPhone})
                    </p>
                    {activeLeadTeam.phase2PaymentTransactionId && (
                      <p className="text-[#f4c151] font-mono">
                        PHASE 2 UTR: {activeLeadTeam.phase2PaymentTransactionId}
                      </p>
                    )}
                    <p className="text-[#a7d38a]">
                      TRACK: {activeLeadTeam.selectedTrack || activeLeadTeam.trackPreferences?.[0] || 'General Track'}
                    </p>
                    <p className="text-[#8f9396]">
                      VENUE: IEM Gurukul Building, Salt Lake Sector V, Kolkata
                    </p>
                  </div>

                  {/* Venue Check-In QR */}
                  <div className="bg-[#090b0d] border border-[#2b2e30] p-2 rounded-xs flex flex-col items-center justify-center text-center">
                    <span className="font-pixel text-[7px] text-[#f4c151] mb-1">VENUE CHECK-IN</span>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        activeLeadTeam.ticketPassId || activeLeadTeam.id
                      )}`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://quickchart.io/qr?text=${encodeURIComponent(
                          activeLeadTeam.ticketPassId || activeLeadTeam.id
                        )}&size=200`;
                      }}
                      alt="Ticket Pass QR"
                      className="w-20 h-20 bg-white p-1 rounded-xs border-2 border-[#f4c151] object-contain shadow-md"
                    />
                    <span className="font-mono text-[6px] text-[#8f9396] mt-1">SCAN AT ENTRANCE</span>
                  </div>
                </div>

                {/* Full Track Preferences List */}
                <div className="border-t border-[#2b2e30] pt-2 space-y-1">
                  <span className="font-silkscreen text-[7.5px] text-[#f4c151] uppercase block">
                    FULL TRACK PREFERENCES ORDER:
                  </span>
                  <div className="flex flex-wrap gap-1 font-silkscreen text-[7.5px]">
                    {activeLeadTeam.trackPreferences && activeLeadTeam.trackPreferences.filter(Boolean).length > 0 ? (
                      activeLeadTeam.trackPreferences.filter(Boolean).map((track, idx) => (
                        <span key={idx} className="bg-[#090b0d] border border-[#2b2e30] text-[#cfe8ff] px-2 py-0.5 rounded-xs flex items-center gap-1">
                          <span className="text-[#f4c151] font-bold">#{idx + 1}:</span> {track}
                        </span>
                      ))
                    ) : (
                      <span className="text-[#cfe8ff] bg-[#090b0d] px-2 py-0.5 border border-[#2b2e30] rounded-xs">
                        {activeLeadTeam.selectedTrack || 'General Track'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Full Team Roster & Member Details */}
                <div className="border-t border-[#2b2e30] pt-2 space-y-1">
                  <span className="font-silkscreen text-[7.5px] text-[#a7d38a] uppercase block">
                    ADMITTED PARTICIPANTS ROSTER ({activeLeadTeam.members.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-silkscreen text-[7.5px]">
                    {activeLeadTeam.members.map((m, idx) => (
                      <div key={m.id || idx} className="bg-[#090b0d] border border-[#2b2e30] p-1.5 rounded-xs text-[#cfe8ff]">
                        <div className="flex items-center justify-between font-bold">
                          <span>{m.name} {m.isLead ? '(LEAD)' : ''}</span>
                          <span className="text-[#8f9396] font-normal">{m.role || 'Member'}</span>
                        </div>
                        <div className="text-[7px] text-[#8f9396] font-mono mt-0.5 flex flex-wrap gap-x-2">
                          {m.email && <span>{m.email}</span>}
                          {m.phone && <span>{m.phone}</span>}
                          {m.githubId && <span className="text-[#6fb3d9]">@{m.githubId}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : activeLeadTeam.phase2PaymentStatus === 'payment_pending' && (activeLeadTeam.phase2PaymentTransactionId || activeLeadTeam.phase2PaymentScreenshotUrl || paymentTxId) ? (
            <div className="p-4 bg-[#241d14] border-2 border-[#f4c151] rounded-md space-y-3">
              <div className="flex items-center justify-between border-b border-[#423325] pb-2">
                <span className="font-pixel text-[11px] text-[#f4c151] flex items-center gap-2">
                  <Clock size={16} className="text-[#f4c151] animate-spin" /> PHASE 2 PAYMENT VERIFICATION PENDING
                </span>
                <span className="bg-[#382b18] text-[#f4c151] border border-[#594424] font-silkscreen text-[8.5px] px-2.5 py-0.5 rounded-xs font-bold">
                  UNDER REVIEW
                </span>
              </div>

              <div className="p-3 bg-[#141618] border border-[#2b2e30] rounded-xs space-y-2 font-silkscreen text-[9px]">
                <p className="text-[#d1d5db]">
                  Your Phase 2 entry fee payment details (₹500) have been received and logged for admin verification.
                </p>
                {(activeLeadTeam.phase2PaymentTransactionId || paymentTxId) && (
                  <p className="text-[#f4c151] font-mono text-[10px]">
                    SUBMITTED UTR / REF ID: <span className="font-bold text-white">{activeLeadTeam.phase2PaymentTransactionId || paymentTxId}</span>
                  </p>
                )}
                {activeLeadTeam.phase2PaymentSubmittedAt && (
                  <p className="text-[#8f9396]">
                    SUBMITTED AT: {new Date(activeLeadTeam.phase2PaymentSubmittedAt).toLocaleString()}
                  </p>
                )}
              </div>

              {(activeLeadTeam.phase2PaymentScreenshotUrl || paymentScreenshot) && (
                <div className="space-y-1">
                  <span className="font-pixel text-[8.5px] text-[#f4c151]">SUBMITTED RECEIPT SCREENSHOT:</span>
                  <div className="border border-[#2b2e30] rounded-xs overflow-hidden h-40 bg-black max-w-md">
                    <img src={activeLeadTeam.phase2PaymentScreenshotUrl || paymentScreenshot} alt="Phase 2 Payment Receipt" className="w-full h-full object-contain" />
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('phase2')}
                  className="font-pixel text-[8.5px] bg-[#1c1f24] hover:bg-[#282d34] border border-[#3a4149] text-[#f4c151] px-3 py-1.5 rounded-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 size={12} />
                  <span>UPDATE / CHANGE PHASE 2 PAYMENT DETAILS</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#141618] border-2 border-[#2b2e30] rounded-md space-y-3 text-center py-8">
              <Ticket size={32} className="text-[#b180ff] mx-auto animate-pulse" />
              <h4 className="font-pixel text-[12px] text-[#f4c151]">NO PHASE 2 PAYMENT SUBMITTED YET</h4>
              <p className="font-silkscreen text-[9.5px] text-[#8f9396] max-w-md mx-auto">
                You have not submitted your Phase 2 offline entry fee payment details (₹500) yet. Please navigate to the Phase 2 tab to complete your payment and submit your UTR ID &amp; receipt screenshot.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('phase2')}
                className="font-pixel text-[9px] bg-[#2b1f3d] hover:bg-[#3d2c57] border border-[#b180ff] text-[#b180ff] px-4 py-2 rounded-xs cursor-pointer inline-flex items-center gap-1.5 shadow-[2px_2px_0_0_#000]"
              >
                <ArrowRight size={12} />
                <span>GO TO PHASE 2 FEES PAYMENT &amp; RSVP</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-[#26282a] flex items-center justify-between text-[8px] font-silkscreen text-[#7d8285]">
        <span>ALL TEAM DATA SYNCED TO CLOUD</span>
        <span className="text-[#a7d38a]">COGNITIA 2026</span>
      </div>
    </div>
  );
};

export const LoginCartridge: React.FC = () => {
  return <RegistrationCartridge defaultLoginMode={true} />;
};
