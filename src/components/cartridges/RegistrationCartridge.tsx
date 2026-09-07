import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Eye,
  X,
  Download,
  Utensils,
  ExternalLink,
} from 'lucide-react';
import { FoodCouponsTabScreen } from '../FoodCouponsTabScreen';
import { MealType, isIemUemMember, isIemUemAllStudentTeam } from '../../types';
import { downloadTicketPdf, printTicketPdf } from '../../utils/ticketPdfGenerator';

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
import { firebaseService, calculateFcfsTrackAllocations, TRACK_PROBLEM_STATEMENTS } from '../../services/firebaseService';
import { TeamRegistration, TeamMember } from '../../types';
import { sound } from '../../utils/audio';
import { RetroInput } from '../RetroInput';

// Registration Deadline (e.g. Sept 10, 2026 23:59:59 IST)
const REGISTRATION_DEADLINE = new Date('2026-09-10T23:59:59+05:30');

interface RegistrationCartridgeProps {
  defaultLoginMode?: boolean;
}

const EMPTY_TRACK_PREFS = ['', '', '', '', ''];

type TeamDashboardTab = 'rsvp' | 'fee_payment' | 'phase2_status' | 'team';

const TAB_ORDER: TeamDashboardTab[] = [
  'rsvp',
  'fee_payment',
  'phase2_status',
];

export const RegistrationCartridge: React.FC<RegistrationCartridgeProps> = ({
  defaultLoginMode = true,
}) => {
  const isDeadlinePassed = new Date() > REGISTRATION_DEADLINE;
  const [activeLeadTeam, setActiveLeadTeam] = useState<TeamRegistration | null>(null);
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [showTeamRosterModal, setShowTeamRosterModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TeamDashboardTab>('rsvp');
  const [ticketSubTab, setTicketSubTab] = useState<'pass' | 'food_coupons' | 'problem_statement'>('pass');

  const [trackPreferences, setTrackPreferences] = useState<string[]>(EMPTY_TRACK_PREFS);
  const [feeUtrId, setFeeUtrId] = useState<string>('');
  const [feeProofUrl, setFeeProofUrl] = useState<string>('');
  const [feeProofFileName, setFeeProofFileName] = useState<string>('');
  const [isSubmittingFee, setIsSubmittingFee] = useState<boolean>(false);
  const [feeMessage, setFeeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [activeMealSession, setActiveMealSession] = useState<MealType | 'none'>('none');
  const [showFoodPassModal, setShowFoodPassModal] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToMealSession((session) => {
      setActiveMealSession(session);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeLeadTeam) {
      setEditableTeamName(activeLeadTeam.teamName || '');
      setMembers(activeLeadTeam.members || []);

      if (activeLeadTeam.trackPreferences && activeLeadTeam.trackPreferences.length === 5) {
        setTrackPreferences(activeLeadTeam.trackPreferences);
      } else {
        setTrackPreferences(EMPTY_TRACK_PREFS);
      }

      setFeeProofUrl(activeLeadTeam.paymentScreenshotUrl || '');
      setFeeUtrId(activeLeadTeam.paymentTransactionId || '');
      setFeeProofFileName('');
      setFeeMessage(null);

      setPaymentScreenshot(activeLeadTeam.phase2PaymentScreenshotUrl || '');
      setPaymentTxId(activeLeadTeam.phase2PaymentTransactionId || '');

      // Strict Sequential Lockdown Rules:
      // 1. If Ticket Pass is verified & issued -> Lock strictly to phase2_status (No previous navigation)
      if (activeLeadTeam.phase2PaymentStatus === 'payment_verified' && activeLeadTeam.ticketPassId) {
        setActiveTab('phase2_status');
      }
      // 2. Else if RSVP is confirmed and not waitlisted -> Move to fee_payment
      else if (activeLeadTeam.rsvpConfirmed && activeLeadTeam.phase2Status !== 'waitlisted') {
        setActiveTab('fee_payment');
      }
      // 3. Else -> Start at rsvp (Step 1 RSVP Confirmation Page)
      else {
        setActiveTab('rsvp');
      }
    } else {
      setEditableTeamName('');
      setMembers([]);
      setTrackPreferences(EMPTY_TRACK_PREFS);
      setFeeProofUrl('');
      setFeeUtrId('');
      setFeeProofFileName('');
      setFeeMessage(null);
      setPaymentScreenshot('');
      setPaymentTxId('');
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
  const [leadIsIemUem, setLeadIsIemUem] = useState<boolean>(true);
  const [leadCollegeName, setLeadCollegeName] = useState<string>('IEM / UEM');
  const [leadEnrollmentNo, setLeadEnrollmentNo] = useState<string>('');

  // Team Edit State
  const [editableTeamName, setEditableTeamName] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [isMembersLocked, setIsMembersLocked] = useState<boolean>(false);

  const isRosterLockedEffective = Boolean(
    isMembersLocked ||
    isDeadlinePassed
  );


  // Member Editing State (Editable until deadline)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editIsIemUem, setEditIsIemUem] = useState<boolean>(true);
  const [editCollegeName, setEditCollegeName] = useState<string>('IEM / UEM');
  const [editEnrollmentNo, setEditEnrollmentNo] = useState<string>('');

  // IEMCRP Verification Screenshot State
  const [iemcrpScreenshots, setIemcrpScreenshots] = useState<{ [memberId: string]: string }>({});
  const [uploadingMemberId, setUploadingMemberId] = useState<string | null>(null);
  const [iemcrpSubmitMessage, setIemcrpSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (activeLeadTeam?.members) {
      const initialScreenshots: { [memberId: string]: string } = {};
      activeLeadTeam.members.forEach((m) => {
        if (m.iemcrpScreenshotUrl) {
          initialScreenshots[m.id] = m.iemcrpScreenshotUrl;
        }
      });
      setIemcrpScreenshots(initialScreenshots);
    } else {
      setIemcrpScreenshots({});
    }
  }, [activeLeadTeam]);

  const handleIemcrpScreenshotSelect = async (memberId: string, file: File) => {
    if (!file) return;
    try {
      setUploadingMemberId(memberId);
      const res = await firebaseService.uploadFileToGCS(file, 'screenshots');
      setIemcrpScreenshots((prev) => ({
        ...prev,
        [memberId]: res.url,
      }));
    } catch (err: any) {
      alert(`Failed to process image: ${err?.message || 'Unknown error'}`);
    } finally {
      setUploadingMemberId(null);
    }
  };

  const handleSubmitIemcrpVerifications = async () => {
    if (!activeLeadTeam) return;
    sound.playBoot();
    setIsSubmittingFee(true);
    setIemcrpSubmitMessage(null);

    try {
      const updatedMembers = activeLeadTeam.members.map((m) => ({
        ...m,
        iemcrpScreenshotUrl: iemcrpScreenshots[m.id] || m.iemcrpScreenshotUrl || '',
      }));

      const res = await firebaseService.submitIemcrpVerifications(activeLeadTeam.id, updatedMembers);

      if (res.success && res.team) {
        setActiveLeadTeam(res.team);
        sound.playBoot();
        setIemcrpSubmitMessage({
          type: 'success',
          text: `✅ Verification details submitted! Awaiting administrator approval.`,
        });
        alert(`✅ PROOFS SUBMITTED FOR ADMIN VERIFICATION\n\nYour enrollment numbers and IEMCRP screenshots have been submitted. An event administrator will review and verify your proof to issue your official Phase 2 Pass Ticket.`);
      } else {
        setIemcrpSubmitMessage({ type: 'error', text: 'Failed to submit IEMCRP verifications. Please try again.' });
      }
    } catch (err: any) {
      setIemcrpSubmitMessage({ type: 'error', text: err?.message || 'Submission error.' });
    } finally {
      setIsSubmittingFee(false);
    }
  };

  // Phone Input Handlers (Numeric & Phone Symbol Only)
  const handleLeadPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^0-9+\s\-()]/g, '');
    setLeadPhone(sanitized);
  };

  // Phase 2 State
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [paymentTxId, setPaymentTxId] = useState<string>('');
  const [isUploadingPayment, setIsUploadingPayment] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refreshActiveTeam();
    const unsubscribeTeams = firebaseService.subscribeToTeams(() => {
      refreshActiveTeam();
    });
    return () => unsubscribeTeams();
  }, []);

  const refreshActiveTeam = () => {
    const current = firebaseService.getActiveLeadTeam();
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
      const res = await firebaseService.loginTeamLead(leadEmail, leadPassword);
      if (res.success && res.team) {
        sound.playBoot();
        setActiveLeadTeam(res.team);
        setEditableTeamName(res.team.teamName);
        setMembers(res.team.members);
        setIsMembersLocked(!!res.team.isMembersLocked);
        setAuthSuccess('Team lead authenticated successfully.');
        if (res.team.phase2PaymentStatus === 'payment_verified' && res.team.ticketPassId) {
          setActiveTab('phase2_status');
        } else if (res.team.rsvpConfirmed) {
          setActiveTab('fee_payment');
        } else {
          setActiveTab('rsvp');
        }
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
      const res = await firebaseService.registerTeamLead({
        teamName,
        leadName,
        leadEmail,
        leadPhone,
        passwordHash: leadPassword,
        leadGitHubId: leadGithub,
        collegeName: leadIsIemUem ? 'IEM / UEM' : leadCollegeName,
        isIemUemStudent: leadIsIemUem,
        enrollmentNo: '',
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
    firebaseService.logoutTeamLead();
    setActiveLeadTeam(null);
  };

  const startEditingMember = (m: TeamMember) => {
    if (isDeadlinePassed) {
      alert('Registration deadline has completed. Member details can no longer be edited.');
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
      firebaseService.isEmailRegistered(cleanEmail, activeLeadTeam?.id)
    ) {
      alert(`Email '${editEmail}' is already registered for another participant or lead.`);
      return;
    }

    if (
      otherMembers.some((m) => m.githubId.toLowerCase() === cleanGithub) ||
      firebaseService.isGitHubRegistered(cleanGithub, activeLeadTeam?.id)
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
      const res = await firebaseService.updateTeamDetails(activeLeadTeam.id, editableTeamName, updated, isMembersLocked);
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

  const handleUpdateMemberIemDetails = async (
    memberId: string,
    isIemUem: boolean,
    enrollmentNo: string,
    screenshotUrl?: string
  ) => {
    if (!activeLeadTeam) return;
    const updatedMembers = members.map((m) => {
      if (m.id === memberId || m.memberPassId === memberId) {
        return {
          ...m,
          isIemUemStudent: isIemUem,
          collegeName: isIemUem ? 'IEM / UEM' : (m.collegeName || 'External'),
          enrollmentNo: isIemUem ? enrollmentNo : '',
          iemcrpScreenshotUrl: screenshotUrl !== undefined ? screenshotUrl : m.iemcrpScreenshotUrl,
        };
      }
      return m;
    });

    setMembers(updatedMembers);
    sound.playBoot();
    const res = await firebaseService.updateTeamDetails(activeLeadTeam.id, editableTeamName, updatedMembers);
    if (res.success && res.team) {
      setActiveLeadTeam(res.team);
    }
  };

  const handleRemoveMember = (id: string) => {
    if (isDeadlinePassed) {
      alert('Registration deadline has completed. Team members can no longer be removed.');
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
      firebaseService.updateTeamDetails(activeLeadTeam.id, editableTeamName, updated, isMembersLocked);
    }
  };

  const handleToggleLockMembers = async () => {
    if (!activeLeadTeam) return;
    if (isDeadlinePassed) {
      alert('Registration deadline has completed. Team roster is permanently locked and cannot be unlocked.');
      return;
    }
    const nextState = !isMembersLocked;
    if (nextState && members.length < 2) {
      alert('⚠️ MINIMUM 2 MEMBERS REQUIRED: Each participating team must consist of 2 to 4 members before locking your roster.');
      return;
    }
    sound.playBlip(nextState ? 900 : 450);
    setIsMembersLocked(nextState);
    const res = await firebaseService.updateTeamDetails(activeLeadTeam.id, editableTeamName, members, nextState);
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
    if (activeLeadTeam?.phase2Status === 'waitlisted') {
      sound.playBlip(300);
      alert('⚠️ REGISTRATION LOCKED: Your team is currently WAITLISTED for Phase 2. Waitlisted teams cannot confirm RSVP or proceed to registration steps.');
      return;
    }
    if ((targetTab === 'fee_payment' || targetTab === 'phase2_status') && !activeLeadTeam?.rsvpConfirmed) {
      sound.playBlip(300);
      alert('Please CONFIRM YOUR PHASE 2 OFFLINE PARTICIPATION RSVP in Step 1 before proceeding.');
      setActiveTab('rsvp');
      return;
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
      setFeeMessage({ type: 'error', text: 'Please select and upload your payment screenshot image (Max 5 MB) before submitting.' });
      return;
    }

    setIsSubmittingFee(true);
    sound.playBoot();
    const res = await firebaseService.submitPhase2PaymentDetails(activeLeadTeam.id, feeProofUrl, cleanUtr);
    setIsSubmittingFee(false);

    if (res.success && res.team) {
      setActiveLeadTeam(res.team);
      setFeeMessage({
        type: 'success',
        text: '₹200 Phase 2 Payment details submitted successfully! Status marked VERIFICATION PENDING BY ADMIN.',
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
    if (!activeLeadTeam.rsvpConfirmed) {
      alert('Please confirm your team\'s Phase 2 Offline Participation RSVP above before locking track preferences.');
      return;
    }
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
    const res = await firebaseService.lockTrackPreference(activeLeadTeam.id, trackPreferences);
    if (res.success && res.team) {
      setActiveLeadTeam(res.team);
      alert(`Track preferences (1st Choice: "${trackPreferences[0]}") have been PERMANENTLY LOCKED.`);
    } else if (res.message) {
      alert(res.message);
    }
  };

  const handleSaveTeamDetails = async () => {
    if (!activeLeadTeam) return;
    const res = await firebaseService.updateTeamDetails(activeLeadTeam.id, editableTeamName, members, isMembersLocked);
    if (res.success && res.team) {
      sound.playBlip(800);
      setActiveLeadTeam(res.team);
      setIsEditingTeam(false);
      alert('Team details saved successfully.');
    } else if (res.message) {
      alert(res.message);
    }
  };

  // Phase 2 RSVP & Payment Handlers
  const handleConfirmRsvp = async () => {
    if (!activeLeadTeam) return;
    if (activeLeadTeam.phase2Status === 'waitlisted') {
      sound.playBlip(300);
      alert('⚠️ RSVP LOCKED: Your team is currently WAITLISTED and cannot confirm RSVP at this time.');
      return;
    }
    sound.playBoot();
    const res = await firebaseService.confirmRsvp(activeLeadTeam.id);
    if (res.success && res.team) {
      setActiveLeadTeam(res.team);
    }
  };

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit

  const handleFeeScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeLeadTeam) return;
    const file = e.target.files[0];

    if (file.size > MAX_FILE_SIZE_BYTES) {
      sound.playBlip(300);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      alert(`❌ FILE TOO LARGE (${fileSizeMB} MB)\n\nPayment screenshot image size exceeds 5 MB limit. Please compress or select an image under 5 MB.`);
      setFeeMessage({
        type: 'error',
        text: `File size too large (${fileSizeMB} MB). Maximum image size allowed is 5 MB.`,
      });
      return;
    }

    setIsUploadingPayment(true);
    setFeeMessage(null);
    try {
      const res = await firebaseService.uploadFileToGCS(file, 'payments');
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
      alert(`❌ FILE TOO LARGE (${fileSizeMB} MB)\n\nPayment screenshot image size exceeds 5 MB limit. Please compress or select an image under 5 MB.`);
      return;
    }

    setIsUploadingPayment(true);
    try {
      const res = await firebaseService.uploadFileToGCS(file, 'payments');
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
    const submitRes = await firebaseService.submitPhase2PaymentDetails(activeLeadTeam.id, paymentScreenshot, cleanUtr);
    setIsUploadingPayment(false);

    if (submitRes.success && submitRes.team) {
      setActiveLeadTeam(submitRes.team);
      setActiveTab('phase2_status');
      alert('Phase 2 payment details & UTR ID submitted successfully! Verification pending by admin.');
    } else {
      alert('Phase 2 payment submission failed. Please try again.');
    }
  };

  const handleDownloadPdf = async () => {
    if (!activeLeadTeam) return;
    try {
      setIsGeneratingPdf(true);
      sound.playBlip(700);
      await downloadTicketPdf(activeLeadTeam);
    } catch (err) {
      console.error('Failed to generate PDF ticket pass:', err);
      alert('Failed to generate PDF pass. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintTicket = async () => {
    if (!activeLeadTeam) return;
    try {
      setIsGeneratingPdf(true);
      sound.playBlip(700);
      await printTicketPdf(activeLeadTeam);
    } catch (err) {
      console.error('Failed to print PDF ticket pass:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Dynamic UPI Details
  const upiId = 'saptadip456mukherjee@okaxis';
  const amount = '200';
  const teamNum = activeLeadTeam?.id ? String(activeLeadTeam.id).replace(/^team-/, '') : '0000';
  const remark = `cognitia-p2-tid-${teamNum}`;
  const upiUrl = `upi://pay?pa=${upiId}&pn=Cognitia2026&am=${amount}&tn=${encodeURIComponent(remark)}&cu=INR`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}`;

  // Unauthenticated Lead Login / Signup View
  if (!activeLeadTeam) {
    return (
      <div className="flex flex-col h-full justify-between gap-3 select-none overflow-y-auto overflow-x-hidden max-w-full w-full" id="cartridge-registration">
        {/* Retro Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-[#ef4444]/30 gap-1 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[11px] sm:text-[13px] text-[#ef4444] tracking-wider uppercase leading-tight">
                PARTICIPANT LEAD REGISTRATION &amp; PORTAL
              </span>
              <span className="bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 backdrop-blur-md font-silkscreen text-[8px] px-2 py-0.5 rounded-sm font-bold shrink-0">
                CLOUD SERVER ACTIVE
              </span>
            </div>
            <p className="font-silkscreen text-[8.5px] sm:text-[9px] text-[#8f9396] mt-0.5 leading-snug break-words">
              Log in with your Unique Team ID (TID) &amp; Password to manage track preferences and claim Phase 2 pass.
            </p>
          </div>
        </div>

        {/* Auth Card Container */}
        <div className="flex-1 flex justify-center items-center py-2">
          <div className="w-full max-w-lg bg-[#0a0c0e]/35 backdrop-blur-md border border-[#38bdf8]/30 hover:border-[#38bdf8]/60 p-4 sm:p-5 rounded-md transition-all break-words">
            <div className="flex items-center justify-between border-b border-[#38bdf8]/20 pb-3 mb-3 gap-2">
              <span className="font-pixel text-[11px] sm:text-[12px] text-[#38bdf8] flex items-center gap-1.5 leading-tight uppercase">
                <User size={14} className="text-[#38bdf8] shrink-0" />
                PHASE 2 TEAM PORTAL LOGIN
              </span>
              <span className="font-silkscreen text-[8px] bg-[#182418] text-[#86efac] border border-[#254225] px-2 py-0.5 rounded-xs">
                TEAM ID LOGIN
              </span>
            </div>

            <div className="mb-3.5 p-3 bg-[#0d1620] border border-[#2b4466] rounded-xs font-silkscreen text-[9.5px] text-[#93c5fd] leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 text-[#38bdf8] font-pixel text-[10px]">
                <Sparkles size={13} /> TEAM LOGIN CREDENTIALS
              </div>
              <p>
                Phase 1 team submissions were verified externally. Your Unique Team ID (TID) and Password have been assigned by the organizers.
              </p>
              <p className="text-[#f2933d] font-bold border-t border-[#2b4466] pt-1.5 mt-1.5 flex items-center gap-1.5">
                <span>🚫</span> Phase 1 Registration has been closed.
              </p>
            </div>

            {authError && (
              <div className="mb-3 p-2 bg-[#ef4444]/15 border border-[#ef4444]/40 text-[#fca5a5] font-silkscreen text-[8px] flex items-center gap-1.5 rounded-sm break-words">
                <AlertTriangle size={12} className="text-[#ef4444] shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="mb-3 p-2 bg-[#38bdf8]/15 border border-[#38bdf8]/40 text-[#7dd3fc] font-silkscreen text-[8px] flex items-center gap-1.5 rounded-sm break-words">
                <CheckCircle2 size={12} className="text-[#38bdf8] shrink-0" />
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
                label="Unique Team ID (TID) *"
                icon={<Hash size={10} />}
                required
                type="text"
                placeholder="e.g. COG26-T101"
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
                <>
                  <RetroInput
                    label="Lead GitHub Handle"
                    icon={<Github size={10} />}
                    required
                    placeholder="e.g. peterparker-dev"
                    value={leadGithub}
                    onChange={(e) => setLeadGithub(e.target.value)}
                  />

                  <div className="bg-[#0b0e11] p-2.5 border border-[#2b3545] rounded-xs space-y-2">
                    <label className="block font-silkscreen text-[8.5px] text-[#f4c151]">
                      Lead Student Institution &amp; Category:
                    </label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 text-[8.5px] font-silkscreen text-[#cfe8ff]">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="leadStudentType"
                          checked={leadIsIemUem}
                          onChange={() => setLeadIsIemUem(true)}
                          className="accent-[#38bdf8]"
                        />
                        <span className="text-[#86efac]">🎓 IEM Student (Salt Lake Campus) - ₹0 FREE</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="leadStudentType"
                          checked={!leadIsIemUem}
                          onChange={() => setLeadIsIemUem(false)}
                          className="accent-[#ef4444]"
                        />
                        <span className="text-[#93c5fd]">🏫 External College Student (₹200 Fee)</span>
                      </label>
                    </div>

                    {leadIsIemUem ? (
                      <div className="p-2 bg-[#0c180e] border border-[#25522b] rounded-xs font-silkscreen text-[8px] text-[#86efac]">
                        🎓 IEM Salt Lake Student Free Pass Eligible (Automatically verified upon RSVP confirmation).
                      </div>
                    ) : (
                      <div>
                        <label className="block font-silkscreen text-[7.5px] text-[#93c5fd] mb-0.5">
                          College / University Name*
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Techno India / Heritage / NIT"
                          value={leadCollegeName}
                          onChange={(e) => setLeadCollegeName(e.target.value)}
                          className="w-full bg-[#050709] border border-[#2b3545] text-[#cfe8ff] font-silkscreen text-[9px] px-2 py-1 rounded-xs focus:border-[#38bdf8] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-[#ef4444]/15 border border-[#ef4444]/40 hover:border-[#ef4444] hover:bg-[#ef4444]/25 font-pixel text-[9.5px] sm:text-[10px] text-[#ef4444] tracking-wider py-2 px-3 rounded-md flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.2)] cursor-pointer mt-2 transition-all leading-tight text-center break-words"
              >
                {isLoginMode ? 'AUTHENTICATE LEAD' : 'REGISTER TEAM LEAD'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#ef4444]/20 flex items-center justify-between text-[8px] font-silkscreen text-[#7d8285] shrink-0">
          <span>VERIFIED BY SECURE CLOUD AUTH</span>
          <span className="text-[#38bdf8]">COGNITIA 2026 REGISTRATION PROTOCOL</span>
        </div>
      </div>
    );
  }

  // Authenticated Lead Dashboard View
  return (
    <div className="flex flex-col h-full justify-between gap-3 select-none overflow-y-auto overflow-x-hidden max-w-full w-full" id="cartridge-registration-dashboard">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-md bg-[#0a0c0e]/35 backdrop-blur-md border border-[#ef4444]/30 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[12px] text-[#ef4444] tracking-wider">
              Team: {activeLeadTeam.teamName}
            </span>
            <span className="bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 backdrop-blur-sm font-silkscreen text-[7.5px] px-1.5 py-0.5 rounded-sm font-bold">
              REGISTERED
            </span>
            {activeLeadTeam.phase2Status === 'selected' && (
              <span className="bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 backdrop-blur-sm font-silkscreen text-[7.5px] px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                <Sparkles size={9} /> PHASE 2 SELECTED
              </span>
            )}
            {activeLeadTeam.phase2Status === 'waitlisted' && (
              <span className="bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/30 backdrop-blur-sm font-silkscreen text-[7.5px] px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                <Hourglass size={9} /> WAITLISTED
              </span>
            )}
          </div>
          <p className="font-silkscreen text-[8.5px] text-[#8f9396] mt-0.5">
            Lead: {activeLeadTeam.leadEmail} &bull; ID: {activeLeadTeam.id}
          </p>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* View Roster Button */}
          <button
            type="button"
            onClick={() => {
              sound.playBlip(500);
              setShowTeamRosterModal(true);
            }}
            className="font-pixel text-[8.5px] px-2.5 py-1 rounded-sm border border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#38bdf8] hover:bg-[#38bdf8]/20 flex items-center gap-1 cursor-pointer"
            title="View Team Members Roster"
          >
            <Users size={11} /> ROSTER
          </button>

          {/* Step Back / Previous Button - Hidden once tracks are locked or ticket pass is verified */}
          {TAB_ORDER.indexOf(activeTab) > 0 &&
            !activeLeadTeam.isTrackLocked &&
            activeLeadTeam.phase2PaymentStatus !== 'payment_verified' && (
              <button
                onClick={() => {
                  const currentIdx = TAB_ORDER.indexOf(activeTab);
                  if (currentIdx > 0) {
                    sound.playBlip(400);
                    setActiveTab(TAB_ORDER[currentIdx - 1]);
                  }
                }}
                className="font-pixel text-[8.5px] px-2.5 py-1 rounded-sm border border-[#38bdf8]/30 bg-[#38bdf8]/10 text-[#38bdf8] hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={11} /> PREV
              </button>
            )}

          {/* Next Step Button - Hidden once tracks are locked, ticket pass is verified, or team is waitlisted */}
          {TAB_ORDER.indexOf(activeTab) < TAB_ORDER.length - 1 &&
            !activeLeadTeam.isTrackLocked &&
            activeLeadTeam.phase2PaymentStatus !== 'payment_verified' &&
            activeLeadTeam.phase2Status !== 'waitlisted' && (
              <button
                onClick={() => {
                  const currentIdx = TAB_ORDER.indexOf(activeTab);
                  if (currentIdx < TAB_ORDER.length - 1) {
                    handleProceedToNextTab(TAB_ORDER[currentIdx + 1]);
                  }
                }}
                className="font-pixel text-[8.5px] px-3 py-1 rounded-sm border border-[#38bdf8]/40 hover:border-[#38bdf8] bg-[#38bdf8]/20 text-[#38bdf8] hover:bg-[#38bdf8]/30 flex items-center gap-1 cursor-pointer transition-all"
              >
                <span>NEXT</span>
                <ArrowRight size={11} />
              </button>
            )}

          {/* Log Out Button */}
          <button
            onClick={handleLogout}
            className="p-1 px-2 bg-[#ef4444]/15 border border-[#ef4444]/40 text-[#ef4444] hover:text-white rounded-sm text-[8px] font-silkscreen flex items-center gap-1 cursor-pointer transition-colors"
            title="Log Out"
          >
            <LogOut size={12} /> LOG OUT
          </button>
        </div>
      </div>

      {/* STEP 1: OFFLINE PARTICIPATION RSVP */}
      {activeTab === 'rsvp' && (
        <div className="space-y-3 grow overflow-y-auto">
          {/* Main Card Header */}
          <div className="p-3.5 bg-[#141618] border-2 border-[#b180ff] rounded-md space-y-2 shadow-[0_0_15px_rgba(177,128,255,0.15)]">
            <div className="flex items-center justify-between border-b border-[#2b1f3d] pb-2">
              <span className="font-pixel text-[12px] sm:text-[13px] text-[#b180ff] flex items-center gap-1.5">
                <Sparkles size={16} className="text-[#b180ff]" /> STEP 1 OF 3: CONFIRM OFFLINE PARTICIPATION RSVP
              </span>
              {activeLeadTeam.phase2Status === 'waitlisted' ? (
                <span className="bg-[#3b1d14] text-[#f97316] border border-[#7c2d12] font-silkscreen text-[9px] px-2.5 py-0.5 rounded-xs font-bold flex items-center gap-1">
                  <Hourglass size={11} className="animate-spin" /> TEAM WAITLISTED
                </span>
              ) : activeLeadTeam.rsvpConfirmed ? (
                <span className="bg-[#142417] text-[#4ade80] border border-[#25522b] font-silkscreen text-[9px] px-2 py-0.5 rounded-xs font-bold flex items-center gap-1">
                  <CheckCircle2 size={11} /> RSVP CONFIRMED
                </span>
              ) : (
                <span className="bg-[#2b1f3d] text-[#b180ff] border border-[#482b66] font-silkscreen text-[8.5px] px-2 py-0.5 rounded-xs font-bold animate-pulse">
                  RSVP REQUIRED
                </span>
              )}
            </div>
            <p className="font-silkscreen text-[10.5px] text-[#cfe8ff] leading-relaxed">
              Cognitia 2026 Phase 2 takes place live at the IEM Campus Auditorium, Kolkata. Please review your team selection status and confirm offline participation RSVP below.
            </p>
          </div>

          {/* WAITLISTED TEAM PROVISION */}
          {activeLeadTeam.phase2Status === 'waitlisted' ? (
            <div className="p-5 bg-[#1a1410] border-2 border-[#f97316] rounded-md space-y-4 text-center shadow-[0_0_20px_rgba(249,115,22,0.15)]">
              <Hourglass className="text-[#f97316] size-9 mx-auto animate-pulse" />
              <div className="space-y-1">
                <span className="font-silkscreen text-[8.5px] text-[#f97316] uppercase tracking-wider block">
                  PHASE 2 SELECTION STATUS
                </span>
                <h4 className="font-pixel text-[14px] text-[#fb923c]">TEAM IS CURRENTLY WAITLISTED</h4>
              </div>
              <p className="font-silkscreen text-[10.5px] text-[#fdba74] max-w-lg mx-auto leading-relaxed">
                Team <strong>{activeLeadTeam.teamName}</strong> is currently on the Waitlist for Phase 2 Offline Participation.
                Waitlisted teams cannot confirm RSVP or proceed to Track Selection and Fee Payment at this time.
              </p>

              <div className="p-3 bg-[#2a1b12] border border-[#f97316]/40 rounded-xs max-w-md mx-auto space-y-1.5 text-left">
                <div className="flex items-center gap-1.5 text-[#f97316] font-pixel text-[9.5px]">
                  <AlertTriangle size={13} />
                  <span>REGISTRATION STEPS LOCKED</span>
                </div>
                <p className="font-silkscreen text-[9px] text-[#fed7aa] leading-normal">
                  If selected slots open up, event organizers will update your team status from Waitlisted to Selected. Please check back later.
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  disabled
                  className="w-full sm:w-auto bg-[#2e1a14] border-2 border-[#f97316]/40 text-[#f97316]/60 font-pixel text-[10.5px] uppercase py-2.5 px-6 rounded-xs inline-flex items-center justify-center gap-2 cursor-not-allowed opacity-75"
                >
                  <Lock size={14} /> RSVP LOCKED &amp; DISABLED (TEAM WAITLISTED)
                </button>
              </div>
            </div>
          ) : !activeLeadTeam.rsvpConfirmed ? (
            /* SELECTED TEAM PROVISION - RSVP NOT YET CONFIRMED */
            <div className="p-4 bg-[#141618] border-2 border-[#b180ff] rounded-md space-y-3 text-center shadow-[0_0_15px_rgba(177,128,255,0.1)]">
              <Sparkles className="text-[#b180ff] size-7 mx-auto animate-pulse" />
              {activeLeadTeam.phase2Status === 'selected' && (
                <div className="inline-block bg-[#1e1b2e] border border-[#b180ff]/40 px-3 py-1 rounded-xs mb-1">
                  <span className="font-pixel text-[9px] text-[#38bdf8] flex items-center gap-1.5">
                    <Sparkles size={11} className="text-[#38bdf8]" /> SELECTION STATUS: SELECTED FOR PHASE 2
                  </span>
                </div>
              )}
              <h4 className="font-pixel text-[13px] text-[#b180ff]">CONFIRM OFFLINE ATTENDANCE</h4>
              <p className="font-silkscreen text-[10px] text-[#d0d7e0] max-w-md mx-auto leading-relaxed">
                By confirming RSVP, team <strong>{activeLeadTeam.teamName}</strong> commits to participating in-person at the IEM Campus Auditorium during event days.
              </p>
              <button
                type="button"
                onClick={async () => {
                  await handleConfirmRsvp();
                  if (activeLeadTeam.phase2Status !== 'waitlisted') {
                    const isIemTeam = isIemUemAllStudentTeam(activeLeadTeam.members);
                    setActiveTab(isIemTeam ? 'phase2_status' : 'fee_payment');
                  }
                }}
                className="w-full sm:w-auto bg-[#2b1f3d] border-2 border-[#b180ff] hover:bg-[#392854] font-pixel text-[10.5px] text-[#b180ff] hover:text-white uppercase py-2.5 px-6 rounded-xs inline-flex items-center justify-center gap-2 shadow-[2px_2px_0_0_#000] cursor-pointer transition-all"
              >
                <Check size={14} /> CONFIRM OFFLINE PARTICIPATION RSVP &amp; PROCEED
              </button>
            </div>
          ) : (
            /* SELECTED TEAM PROVISION - RSVP CONFIRMED */
            <div className="p-4 bg-[#142417] border-2 border-[#25522b] rounded-md space-y-3 text-center">
              <CheckCircle2 size={28} className="text-[#4ade80] mx-auto" />
              <h4 className="font-pixel text-[13px] text-[#4ade80]">OFFLINE PARTICIPATION RSVP CONFIRMED!</h4>
              <p className="font-silkscreen text-[10px] text-[#cfe8ff] max-w-md mx-auto">
                {isIemUemAllStudentTeam(activeLeadTeam.members)
                  ? 'Your team RSVP is recorded. As a full IEM / UEM Student Team, your ₹0 Free Phase 2 Pass Ticket has been automatically verified and generated!'
                  : 'Your team RSVP is recorded. You can now proceed to Step 2 to complete fee payment.'}
              </p>

              {/* Track Assignment Information Notice */}
              <div className="p-3 bg-[#132338] border border-[#38bdf8]/40 rounded-xs font-silkscreen text-[9.5px] text-[#cfe8ff] text-left flex items-start gap-2">
                <Sparkles size={16} className="text-[#38bdf8] shrink-0 mt-0.5" />
                <div>
                  <p className="font-pixel text-[10.5px] text-[#38bdf8] uppercase">ℹ️ VENUE TRACK ASSIGNMENT WORKFLOW</p>
                  <p className="text-[#93c5fd] text-[9.5px] leading-snug">
                    Challenge tracks are assigned at venue gate check-in by Event Administrators based on real-time slot availability. <strong>At least 2 team members must be present</strong> at check-in for track assignment.
                  </p>
                </div>
              </div>

              {isIemUemAllStudentTeam(activeLeadTeam.members) ? (
                <button
                  type="button"
                  onClick={() => {
                    sound.playBlip(600);
                    setActiveTab('phase2_status');
                  }}
                  className="font-[#4ade80] font-pixel text-[10.5px] bg-[#1e2838] border border-[#2b4466] hover:border-[#4ade80] text-[#4ade80] py-2.5 px-5 rounded-xs inline-flex items-center gap-2 cursor-pointer shadow-[2px_2px_0_0_#000] transition-all"
                >
                  <Ticket size={14} />
                  <span>VIEW OFFICIAL PASS TICKET</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    sound.playBlip(600);
                    setActiveTab('fee_payment');
                  }}
                  className="font-[#4ade80] font-pixel text-[10.5px] bg-[#1e2838] border border-[#2b4466] hover:border-[#4ade80] text-[#4ade80] py-2.5 px-5 rounded-xs inline-flex items-center gap-2 cursor-pointer shadow-[2px_2px_0_0_#000] transition-all"
                >
                  <span>PROCEED TO STEP 2: REGISTRATION FEE PAYMENT</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: READ-ONLY TEAM MEMBERS */}
      {activeTab === 'team' && (
        <div className="space-y-3 grow overflow-y-auto">
          {/* Team Name Settings */}
          <div className="p-3 bg-[#0a0c0e]/35 backdrop-blur-md border border-[#38bdf8]/20 rounded-md">
            <div className="flex items-center justify-between border-b border-[#2b2e30] pb-2 mb-2">
              <span className="font-pixel text-[10px] text-[#6fb3d9] flex items-center gap-1">
                <Users size={12} /> TEAM NAME &amp; IDENTIFIER
              </span>
              <span className="font-silkscreen text-[8px] text-[#a7d38a] bg-[#182418] border border-[#254225] px-2 py-0.5 rounded-xs">
                OFFICIAL TEAM
              </span>
            </div>
            <p className="font-pixel text-[12px] text-[#cfe8ff]">{editableTeamName}</p>
          </div>

          {/* Members Roster */}
          <div className="p-3 bg-[#141618] border-2 border-[#2b2e30] rounded-md">
            <div className="flex items-center justify-between border-b border-[#2b2e30] pb-2 mb-2">
              <span className="font-pixel text-[10px] text-[#f4c151] flex items-center gap-1">
                <Users size={12} /> REGISTERED MEMBERS ({members.length}/4)
              </span>
              <span className="bg-[#2a1b1b] text-[#eb5147] border border-[#522525] font-silkscreen text-[7.5px] px-2 py-0.5 rounded-xs flex items-center gap-1">
                <Lock size={10} /> READ-ONLY ROSTER
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {members.map((m) => {
                return (
                  <div
                    key={m.id}
                    className="bg-[#090b0d] border border-[#2b2e30] p-2.5 rounded-xs flex items-start justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-pixel text-[11px] sm:text-[12px] text-[#cfe8ff]">{m.name}</span>
                        {m.isLead && (
                          <span className="bg-[#241d14] text-[#f2933d] border border-[#423325] font-silkscreen text-[8.5px] px-1.5 py-0.5 rounded-xs">
                            LEAD
                          </span>
                        )}
                        {isIemUemMember(m) ? (
                          <span className="bg-[#142417] text-[#86efac] border border-[#25522b] font-silkscreen text-[8px] px-1.5 py-0.5 rounded-xs">
                            🎓 IEM Student (Salt Lake)
                          </span>
                        ) : (
                          <span className="bg-[#1a1c20] text-[#93c5fd] border border-[#2d3748] font-silkscreen text-[8px] px-1.5 py-0.5 rounded-xs">
                            🏫 External College ({m.collegeName || 'Other'})
                          </span>
                        )}
                      </div>
                      <span className="font-silkscreen text-[9px] text-[#f4c151] block mt-0.5">{m.role || 'Member'}</span>
                      <div className="mt-1 font-silkscreen text-[9px] text-[#93c5fd] space-y-0.5">
                        <p className="flex items-center gap-1"><Mail size={10} /> {m.email}</p>
                        <p className="flex items-center gap-1"><Phone size={10} /> {m.phone}</p>
                        <p className="flex items-center gap-1 text-[#6fb3d9] font-mono"><Github size={10} /> @{m.githubId}</p>
                        {m.enrollmentNo && (
                          <p className="text-[#86efac] font-mono">ENROLLMENT: {m.enrollmentNo}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[#8f9396] font-silkscreen text-[7.5px] px-1.5 py-0.5 bg-[#141618] border border-[#2b2e30] rounded-xs flex items-center gap-1">
                        <Lock size={9} className="text-[#6fb3d9]" /> OFFICIAL MEMBER
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Admin Managed Roster Informational Banner */}
            <div className="border-t border-[#2b2e30] pt-2.5 mt-2 bg-[#0e141d] p-2.5 rounded-xs border border-[#1e344d] text-center font-silkscreen text-[8px] text-[#93c5fd] flex items-center justify-center gap-1.5">
              <Lock size={12} className="text-[#38bdf8]" />
              TEAM ROSTER IS MANAGED BY EVENT ADMINISTRATORS. PARTICIPANTS CANNOT ADD, REMOVE, OR ALTER MEMBER DETAILS OR COLLEGE AFFILIATION.
            </div>
          </div>
        </div>
      )}

      {/* TAB: REGISTRATION FEE PAYMENT (IEM FREE vs EXTERNAL ₹200) */}
      {activeTab === 'fee_payment' && (
        <div className="space-y-3 grow overflow-y-auto">
          {(() => {
            const isIemUemAllStudentTeamStatus = isIemUemAllStudentTeam(activeLeadTeam?.members);
            const feeAmount = isIemUemAllStudentTeamStatus ? 0 : 200;

            if (isIemUemAllStudentTeamStatus) {
              return (
                <div className="p-4 bg-[#142417] border-2 border-[#25522b] rounded-md shadow-[0_0_20px_rgba(37,82,43,0.5)] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#25522b] pb-2.5">
                    <div className="flex items-center gap-2 text-[#4ade80]">
                      <Sparkles size={20} className="text-[#4ade80]" />
                      <span className="font-pixel text-[13px] sm:text-[14px] text-[#4ade80]">
                        🎓 IEM SALTLAKE ALL-STUDENT TEAM: ₹0 FREE PHASE 2 REGISTRATION
                      </span>
                    </div>
                    <span className="bg-[#1e4620] text-[#86efac] border border-[#34783a] font-silkscreen text-[9px] px-2.5 py-1 rounded-xs">
                      ₹0 FREE WAIVER
                    </span>
                  </div>

                  {activeLeadTeam.paymentStatus === 'payment_verified' ? (
                    <div className="p-4 bg-[#142417] border-2 border-[#25522b] rounded-md shadow-[0_0_16px_rgba(37,82,43,0.5)] space-y-3">
                      <div className="flex items-center gap-2 text-[#a7d38a]">
                        <ShieldCheck size={22} className="text-[#4ade80]" />
                        <span className="font-pixel text-[13px] sm:text-[14px] text-[#4ade80]">
                          🎉 IEM SALTLAKE AUTOMATICALLY VERIFIED &amp; OFFICIAL PASS ISSUED!
                        </span>
                      </div>
                      <p className="font-silkscreen text-[11px] text-[#cfe8ff] leading-relaxed">
                        Your IEM Salt Lake student credentials have been automatically verified. Your team <strong>{activeLeadTeam.teamName}</strong> has been issued Official Pass: <strong className="font-mono text-white">{activeLeadTeam.ticketPassId}</strong>.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playBlip(600);
                          setActiveTab('phase2_status');
                        }}
                        className="bg-[#1e4620] hover:bg-[#275c2a] border-2 border-[#4ade80] text-[#86efac] font-pixel text-[11px] py-2.5 px-5 rounded-xs shadow-[2px_2px_0_0_#000] cursor-pointer transition-all inline-flex items-center gap-2 mt-2"
                      >
                        <Ticket size={16} /> [ VIEW OFFICIAL PASS TICKET ]
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-[#0d1a0e] border border-[#25522b] rounded-xs space-y-3 font-silkscreen text-[10.5px] text-[#bbf7d0]">
                      <p className="font-bold text-[#4ade80] flex items-center gap-1.5 font-pixel text-[12px]">
                        <Sparkles size={16} className="text-[#4ade80]" />
                        AUTOMATIC FREE VERIFICATION READY:
                      </p>
                      <p className="leading-relaxed text-[#cfe8ff]">
                        No proof upload or enrollment number verification is required for full IEM / UEM student teams. Simply confirm your Phase 2 Offline Participation RSVP in Step 1 to automatically verify your team and generate your Official Pass Ticket instantly!
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleConfirmRsvp();
                          setActiveTab('phase2_status');
                        }}
                        className="bg-[#1e4620] hover:bg-[#275c2a] border-2 border-[#4ade80] text-[#86efac] font-pixel text-[10.5px] py-2.5 px-5 rounded-xs shadow-[2px_2px_0_0_#000] cursor-pointer transition-all inline-flex items-center gap-2 mt-1"
                      >
                        <CheckCircle2 size={15} /> [ CONFIRM RSVP &amp; GENERATE TICKET PASS NOW ]
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            const upiId = 'saptadip456mukherjee@okaxis';
            const teamNum = activeLeadTeam?.id ? String(activeLeadTeam.id).replace(/^team-/, '') : '0000';
            const upiRemark = `cognitia-p2-tid-${teamNum}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
              `upi://pay?pa=${upiId}&pn=Cognitia%20Hackathon&am=${feeAmount}&cu=INR&tn=${upiRemark}`
            )}`;

            return (
              <div className="space-y-3">
                {/* Header Banner */}
                <div className="p-3 bg-[#141618] border-2 border-[#2b2e30] rounded-md space-y-1">
                  <div className="flex items-center justify-between border-b border-[#2b2e30] pb-2">
                    <span className="font-pixel text-[12px] sm:text-[13px] text-[#f4c151] flex items-center gap-1.5">
                      <CreditCard size={15} /> STEP 3: PHASE 2 ENTRY FEE (₹200) &amp; PAYMENT SCREENSHOT UPLOAD
                    </span>
                    {activeLeadTeam.paymentStatus === 'payment_verified' ? (
                      <span className="bg-[#182418] text-[#a7d38a] border border-[#254225] font-silkscreen text-[9px] px-2 py-0.5 rounded-xs flex items-center gap-1">
                        <CheckCircle2 size={11} /> PAYMENT VERIFIED BY ADMIN
                      </span>
                    ) : activeLeadTeam.paymentStatus === 'payment_pending' ? (
                      <span className="bg-[#241d14] text-[#f2933d] border border-[#423325] font-silkscreen text-[9px] px-2 py-0.5 rounded-xs flex items-center gap-1 animate-pulse">
                        <Clock size={11} /> VERIFICATION PENDING BY ADMIN
                      </span>
                    ) : (
                      <span className="bg-[#241818] text-[#eb5147] border border-[#422525] font-silkscreen text-[9px] px-2 py-0.5 rounded-xs flex items-center gap-1">
                        <AlertTriangle size={11} /> PHASE 2 FEE UNPAID (₹200)
                      </span>
                    )}
                  </div>
                  <p className="font-silkscreen text-[10.5px] text-[#d0d7e0] pt-1 leading-normal">
                    Scan the UPI QR code below to pay the mandatory <strong className="text-[#f4c151]">Phase 2 Team Entry Fee (₹200)</strong>. After paying via GPay/PhonePe/Paytm, upload your payment receipt screenshot and enter your 12-digit UTR Transaction Ref ID below for admin verification.
                  </p>
                </div>

                {/* Verified Success Card */}
                {activeLeadTeam.paymentStatus === 'payment_verified' && (
                  <div className="p-4 bg-[#142417] border-2 border-[#25522b] rounded-md shadow-[0_0_16px_rgba(37,82,43,0.5)] space-y-3">
                    <div className="flex items-center gap-2 text-[#a7d38a]">
                      <ShieldCheck size={20} className="text-[#4ade80]" />
                      <span className="font-pixel text-[13px] sm:text-[14px] text-[#4ade80]">
                        🎉 PHASE 2 FEE VERIFIED &amp; ENTRY CONFIRMED!
                      </span>
                    </div>
                    <p className="font-silkscreen text-[11px] text-[#cfe8ff] leading-relaxed">
                      Your Phase 2 entry fee has been verified by the Cognitia Admin team. Your team <strong>{activeLeadTeam.teamName}</strong> is officially confirmed for Phase 2!
                    </p>
                  </div>
                )}

                {/* Verification Pending Warning Card */}
                {activeLeadTeam.paymentStatus === 'payment_pending' && (
                  <div className="p-3.5 bg-[#241d14] border-2 border-[#544622] rounded-md space-y-1.5">
                    <div className="flex items-center gap-2 text-[#f2933d]">
                      <Clock size={18} className="text-[#f4c151] animate-spin" />
                      <span className="font-pixel text-[11.5px] sm:text-[12.5px] text-[#f4c151]">
                        ⌛ PAYMENT VERIFICATION PENDING BY ADMIN
                      </span>
                    </div>
                    <p className="font-silkscreen text-[10px] text-[#d0d7e0] leading-relaxed">
                      Your Phase 2 payment details (UTR ID: <strong className="font-mono text-white">{activeLeadTeam.paymentTransactionId}</strong>) have been received. The Cognitia Admin team is currently verifying the transaction.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Left: Dynamic UPI QR Code Display */}
                  <div className="md:col-span-5 p-3.5 bg-[#141618] border-2 border-[#2b2e30] rounded-md flex flex-col items-center justify-between text-center space-y-2.5">
                    <span className="font-pixel text-[11px] text-[#f4c151] flex items-center gap-1.5">
                      <QrCode size={14} /> UPI QR CODE (₹200)
                    </span>

                    <div
                      className="p-2.5 bg-white rounded-md border-4 border-[#3a4149] hover:border-[#f4c151] shadow-[0_0_12px_rgba(244,193,81,0.3)] cursor-pointer group transition-all"
                      onClick={() => {
                        sound.playBlip(500);
                        setPreviewImageModal({
                          url: qrUrl,
                          title: `UPI Payment QR Code (₹200) - Ref: ${upiRemark}`,
                        });
                      }}
                    >
                      <img
                        src={qrUrl}
                        alt="Dynamic UPI QR Code ₹200"
                        className="w-44 h-44 sm:w-48 sm:h-48 object-contain pixelated group-hover:scale-105 transition-transform"
                      />
                      <span className="block font-mono text-[8px] text-[#2b2e30] group-hover:text-black font-bold text-center mt-1">CLICK TO ZOOM</span>
                    </div>

                    <div className="w-full space-y-1">
                      <div className="flex items-center justify-between bg-[#090b0d] border border-[#2b2e30] px-2.5 py-1.5 rounded-xs font-mono text-[10px]">
                        <span className="text-[#8f9396] font-silkscreen text-[9px]">UPI ID:</span>
                        <span className="text-[#00f0ff] font-bold">{upiId}</span>
                        <button
                          type="button"
                          onClick={() => {
                            sound.playBlip(700);
                            navigator.clipboard.writeText(upiId);
                            setCopiedUpi(true);
                            setTimeout(() => setCopiedUpi(false), 2000);
                          }}
                          className="text-[#f4c151] hover:underline font-pixel text-[9px] cursor-pointer"
                        >
                          {copiedUpi ? 'COPIED!' : 'COPY'}
                        </button>
                      </div>
                      <div className="font-mono text-[9px] text-[#a7d38a] space-y-0.5 pt-0.5">
                        <p>EXTERNAL ENTRY FEE: <span className="font-bold text-[#f4c151]">₹{feeAmount} INR</span></p>
                        <p className="text-[8.5px] text-[#8f9396]">REMARK: <span className="text-white font-bold">{upiRemark}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Payment Reference ID / UTR Form */}
                  <div className="md:col-span-7 p-3.5 bg-[#141618] border-2 border-[#2b2e30] rounded-md flex flex-col justify-between space-y-3">
                    <div>
                      <span className="font-pixel text-[11px] text-[#6fb3d9] block border-b border-[#2b2e30] pb-1.5 mb-2.5">
                        ENTER PHASE 2 PAYMENT TRANSACTION DETAILS
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
                            Payment Screenshot Proof (Max 5 MB) <span className="text-[#a7d38a]">*</span>
                          </label>

                          {/* Direct File Upload Button */}
                          {activeLeadTeam.paymentStatus === 'unpaid' && (
                            <label className="cursor-pointer font-pixel text-[9px] bg-[#1e2329] border border-[#3a4149] hover:border-[#a7d38a] text-[#a7d38a] py-2 px-3 rounded-xs flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#000] w-full transition-all">
                              <CloudUpload size={14} />
                              {isUploadingPayment
                                ? 'UPLOADING SCREENSHOT...'
                                : feeProofUrl
                                  ? 'CHANGE PAYMENT SCREENSHOT (MAX 5 MB)'
                                  : 'SELECT & UPLOAD SCREENSHOT IMAGE (MAX 5 MB)'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFeeScreenshotUpload}
                                className="hidden"
                              />
                            </label>
                          )}

                          {/* Screenshot Preview Card */}
                          {feeProofUrl && (
                            <div className="mt-2 p-2 bg-[#090b0d] border border-[#254225] rounded-xs space-y-1.5">
                              <div className="flex items-center justify-between font-silkscreen text-[8px] text-[#a7d38a]">
                                <span>📷 ATTACHED RECEIPT PREVIEW (MAX 5 MB VERIFIED):</span>
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
                                <img src={feeProofUrl} alt="Payment Screenshot" className="w-full h-full object-contain" />
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
                            <CheckCircle2 size={13} /> SUBMIT ₹200 PAYMENT FOR ADMIN VERIFICATION
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
                      <span className="text-[#f4c151]">₹200 ENTRY FEE</span>
                    </div>
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
                setActiveTab('rsvp');
              }}
              className="font-pixel text-[10.5px] bg-[#181b1e] border border-[#2b2e30] text-[#8f9396] hover:text-white px-3.5 py-2 rounded-xs flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={13} /> BACK TO STEP 1 RSVP
            </button>

            {(activeLeadTeam.paymentStatus === 'payment_verified' || activeLeadTeam.phase2PaymentStatus === 'payment_verified' || activeLeadTeam.ticketPassId) && (
              <button
                type="button"
                onClick={() => handleProceedToNextTab('phase2_status')}
                className="w-full sm:w-auto font-pixel text-[10.5px] bg-[#1e2838] border border-[#2b4466] hover:border-[#f4c151] text-[#f4c151] px-4 py-2 rounded-xs flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#000] cursor-pointer hover:bg-[#25354a] ml-auto"
              >
                VIEW PASS TICKET <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      )}





      {/* TAB 6: PHASE 2 VERIFY STATUS, OFFICIAL PASS & PROBLEM STATEMENT */}
      {activeTab === 'phase2_status' && (
        <div className="space-y-4 grow overflow-y-auto">
          {/* Sub-Tab Navigation Bar */}
          <div className="flex items-center gap-2 border-b border-[#2b2e30] pb-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                sound.playBlip(500);
                setTicketSubTab('pass');
              }}
              className={`font-pixel text-[9px] sm:text-[10px] px-3.5 py-2 rounded-xs border transition-all flex items-center gap-1.5 cursor-pointer ${ticketSubTab === 'pass'
                ? 'bg-[#182418] text-[#86efac] border-[#4ade80] shadow-[2px_2px_0_0_#000]'
                : 'bg-[#141618] text-[#8f9396] border-[#2b2e30] hover:text-white'
                }`}
            >
              <Ticket size={13} /> 🎟️ OFFICIAL TICKET PASS
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playBlip(500);
                setTicketSubTab('food_coupons');
              }}
              className={`font-pixel text-[9px] sm:text-[10px] px-3.5 py-2 rounded-xs border transition-all flex items-center gap-1.5 cursor-pointer ${ticketSubTab === 'food_coupons'
                ? 'bg-[#142417] text-[#4ade80] border-[#4ade80] shadow-[2px_2px_0_0_#000]'
                : 'bg-[#141618] text-[#8f9396] border-[#2b2e30] hover:text-white'
                }`}
            >
              <Utensils size={13} /> 🍱 FOOD COUPONS
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playBlip(500);
                setTicketSubTab('problem_statement');
              }}
              className={`font-pixel text-[9px] sm:text-[10px] px-3.5 py-2 rounded-xs border transition-all flex items-center gap-1.5 cursor-pointer ${ticketSubTab === 'problem_statement'
                ? 'bg-[#1e1b2e] text-[#38bdf8] border-[#38bdf8] shadow-[2px_2px_0_0_#000]'
                : 'bg-[#141618] text-[#8f9396] border-[#2b2e30] hover:text-white'
                }`}
            >
              <FileText size={13} /> 📜 PROBLEM STATEMENT &amp; TRACK
            </button>
          </div>

          {/* SUB-TAB 1: OFFICIAL TICKET PASS */}
          {ticketSubTab === 'pass' && (
            <div className="space-y-4">
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
                    Congratulations! Your Phase 2 offline entry fee payment (₹200) has been verified by the Cognitia Admin team. Your official Offline Pass Ticket is generated below.
                  </p>

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
                          TRACK: {activeLeadTeam.adminTrackOverride || activeLeadTeam.selectedTrack || 'Pending Venue Gate Assignment'}
                        </p>
                        <p className="text-[#8f9396]">
                          VENUE: IEM Aegis Building, College More, Salt Lake Sector V, Kolkata
                        </p>

                        {/* Venue Gate Check-In & FCFS Track Allocation Rule Banner */}
                        {(() => {
                          const members = activeLeadTeam.members || [];
                          const checkedCount = members.filter((m) => m.checkInStatus === 'checked_in').length;
                          const totalCount = members.length;
                          const minReq = Math.min(2, totalCount || 1);
                          const isQualified = checkedCount >= minReq;

                          return (
                            <div className={`mt-2 p-2 rounded-xs border font-silkscreen text-[7.5px] space-y-1 ${isQualified
                              ? 'bg-[#122314] text-[#86efac] border-[#27662c]'
                              : 'bg-[#241d14] text-[#f4c151] border-[#423325]'
                              }`}>
                              <div className="flex items-center gap-1 font-bold">
                                <AlertTriangle size={11} className={isQualified ? 'text-[#4ade80]' : 'text-[#f4c151]'} />
                                <span>FCFS TRACK ALLOCATION GATE RULE (4 SLOTS/TRACK)</span>
                              </div>
                              <p className="leading-normal text-[#cfe8ff]">
                                At least <strong>2 members of your team</strong> must check in at the venue gate on event day to qualify for First-Come-First-Serve (FCFS) track distribution (4 slots/track).
                              </p>
                              <div className="pt-0.5 flex items-center justify-between text-[7px] font-mono">
                                <span>GATE CHECKED IN: <strong>{checkedCount} / {totalCount} MEMBERS</strong></span>
                                <span className={isQualified ? 'text-[#4ade80] font-bold' : 'text-[#f4c151] font-bold'}>
                                  {isQualified ? '✓ TRACK ALLOCATION READY' : `⚠️ PENDING (${checkedCount}/${totalCount} - MIN 2 REQUIRED)`}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Venue Check-In QR */}
                      {(() => {
                        const venueQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                          activeLeadTeam.ticketPassId || activeLeadTeam.id
                        )}`;
                        return (
                          <div
                            className="bg-[#090b0d] border border-[#2b2e30] hover:border-[#f4c151] p-2 rounded-xs flex flex-col items-center justify-center text-center cursor-pointer group transition-all"
                            onClick={() => {
                              sound.playBlip(500);
                              setPreviewImageModal({
                                url: venueQrUrl,
                                title: `Official Venue Check-In QR - Team ${activeLeadTeam.teamName} (${activeLeadTeam.ticketPassId || activeLeadTeam.id})`,
                              });
                            }}
                          >
                            <span className="font-pixel text-[7px] text-[#f4c151] mb-1">VENUE CHECK-IN</span>
                            <img
                              src={venueQrUrl}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `https://quickchart.io/qr?text=${encodeURIComponent(
                                  activeLeadTeam.ticketPassId || activeLeadTeam.id
                                )}&size=300`;
                              }}
                              alt="Ticket Pass QR"
                              className="w-20 h-20 bg-white p-1 rounded-xs border-2 border-[#f4c151] object-contain shadow-md group-hover:scale-105 transition-transform"
                            />
                            <span className="font-mono text-[6px] text-[#4ade80] group-hover:text-white transition-colors mt-1 font-bold">CLICK ZOOM</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Hackathon Track Assignment Status */}
                    <div className="border-t border-[#2b2e30] pt-2 space-y-1">
                      <span className="font-silkscreen text-[7.5px] text-[#f4c151] uppercase block">
                        HACKATHON TRACK ASSIGNMENT:
                      </span>
                      <div className="font-silkscreen text-[7.5px]">
                        {activeLeadTeam.adminTrackOverride || activeLeadTeam.selectedTrack ? (
                          <span className="bg-[#142417] border border-[#25522b] text-[#86efac] px-2 py-1 rounded-xs flex items-center gap-1 font-bold">
                            🎯 ASSIGNED TRACK: {activeLeadTeam.adminTrackOverride || activeLeadTeam.selectedTrack}
                          </span>
                        ) : (
                          <span className="text-[#f4c151] bg-[#241d14] px-2 py-1 border border-[#423325] rounded-xs flex items-center gap-1">
                            ℹ️ PENDING VENUE GATE CHECK-IN (Admin assigns track upon 2+ members present)
                          </span>
                        )}
                      </div>
                    </div>



                    {/* Individual Member Pass Badges & Unique Gate QRs */}
                    <div className="border-t border-[#2b2e30] pt-3 space-y-2">
                      <span className="font-silkscreen text-[8.5px] text-[#a7d38a] uppercase block tracking-wider">
                        INDIVIDUAL MEMBER PASS BADGES &amp; UNIQUE GATE SCAN QR CODES ({activeLeadTeam.members.length}):
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeLeadTeam.members.map((m, idx) => {
                          const memberPassId = m.memberPassId || `COG26-M${String(activeLeadTeam.id).slice(-3)}-${idx + 1}`;
                          const qrContent = `COGNITIA-2026-PASS-MEMBER:${memberPassId}:${activeLeadTeam.id}:${m.name}:${m.enrollmentNo || 'N/A'}`;
                          const memberQrUrl = m.memberQrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrContent)}`;

                          return (
                            <div key={m.id || idx} className="bg-[#0e1215] border-2 border-[#2b4466] p-3 rounded-xs text-[#cfe8ff] space-y-2 relative overflow-hidden">
                              <div className="flex items-center justify-between border-b border-[#2b2e30] pb-1.5">
                                <span className="font-pixel text-[9.5px] text-[#f4c151] flex items-center gap-1">
                                  {m.isLead ? '👑 TEAM LEAD PASS' : `👤 MEMBER PASS #${idx + 1}`}
                                </span>
                                <span className="font-mono text-[8.5px] text-[#4ade80] bg-[#142417] px-2 py-0.5 border border-[#25522b] rounded-xs font-bold">
                                  {memberPassId}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <div className="space-y-1 font-silkscreen text-[8px] grow">
                                  <p className="font-bold text-white text-[10.5px]">{m.name}</p>
                                  <p className="text-[#8f9396]">{m.role || 'Participant'}</p>
                                  {m.enrollmentNo && (
                                    <p className="text-[#86efac] font-mono font-bold">
                                      ENROLLMENT: {m.enrollmentNo}
                                    </p>
                                  )}
                                  <p className="text-[#6fb3d9]">{m.email}</p>
                                  {m.checkInStatus === 'checked_in' ? (
                                    <span className="inline-flex items-center gap-1 bg-[#182418] text-[#a7d38a] border border-[#25522b] text-[7.5px] px-1.5 py-0.5 rounded-xs mt-1">
                                      <CheckCircle2 size={9} /> GATE CHECKED IN ({m.checkInTimestamp || 'OK'})
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-[#1c1f24] text-[#8f9396] border border-[#2b2e30] text-[7.5px] px-1.5 py-0.5 rounded-xs mt-1">
                                      ⚪ NOT CHECKED IN
                                    </span>
                                  )}
                                </div>

                                {/* Member Unique Gate QR */}
                                <div
                                  className="bg-black p-1 rounded-xs border border-[#4ade80] flex flex-col items-center shrink-0 cursor-pointer group"
                                  onClick={() => {
                                    sound.playBlip(500);
                                    setPreviewImageModal({
                                      url: memberQrUrl,
                                      title: `Official Pass QR - ${m.name} (${memberPassId})`,
                                    });
                                  }}
                                >
                                  <img
                                    src={memberQrUrl}
                                    alt={`${m.name} Pass QR`}
                                    className="w-16 h-16 bg-white p-0.5 rounded-xs object-contain group-hover:scale-105 transition-transform"
                                  />
                                  <span className="font-mono text-[6px] text-[#4ade80] mt-0.5">CLICK ZOOM</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
                      Your Phase 2 entry fee payment details (₹200) have been received and logged for admin verification.
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
                </div>
              ) : (
                <div className="p-4 bg-[#141618] border-2 border-[#2b2e30] rounded-md space-y-3 text-center py-8">
                  <Ticket size={32} className="text-[#b180ff] mx-auto animate-pulse" />
                  <h4 className="font-pixel text-[12px] text-[#f4c151]">NO PHASE 2 PAYMENT SUBMITTED YET</h4>
                  <p className="font-silkscreen text-[9.5px] text-[#8f9396] max-w-md mx-auto">
                    You have not submitted your Phase 2 offline entry fee payment details (₹200) yet. Please navigate to the Phase 2 tab to complete your payment and submit your UTR ID &amp; receipt screenshot.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('fee_payment')}
                    className="font-pixel text-[9px] bg-[#2b1f3d] hover:bg-[#3d2c57] border border-[#b180ff] text-[#b180ff] px-4 py-2 rounded-xs cursor-pointer inline-flex items-center gap-1.5 shadow-[2px_2px_0_0_#000]"
                  >
                    <ArrowRight size={12} />
                    <span>GO TO PHASE 2 FEES PAYMENT &amp; RSVP</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 2: FOOD COUPONS & MEAL PASS */}
          {ticketSubTab === 'food_coupons' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#0e1216] p-3.5 border-2 border-[#2b4466] rounded-md gap-3 font-silkscreen text-[9px] shadow-[0_0_20px_rgba(74,222,128,0.12)]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#142417] border border-[#25522b] text-[#4ade80] rounded-xs">
                    <Utensils size={18} />
                  </div>
                  <div>
                    <span className="font-pixel text-[11px] text-[#f4c151] block uppercase">
                      OFFICIAL TEAM FOOD COUPONS &amp; MEAL PASS
                    </span>
                    <span className="text-[#8f9396] text-[8px]">
                      View your team &amp; member food coupons below or pop out into a new browser tab
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playBoot();
                      window.open(`/food-coupons?teamId=${activeLeadTeam.id}`, '_blank');
                    }}
                    className="bg-[#1c2836] hover:bg-[#25374d] text-[#00f0ff] border border-[#00f0ff]/40 font-pixel text-[8.5px] uppercase px-3 py-1.5 rounded-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                  >
                    <ExternalLink size={12} /> OPEN IN NEW TAB ↗
                  </button>
                </div>
              </div>

              <FoodCouponsTabScreen teamIdFromProp={activeLeadTeam.id} />
            </div>
          )}

          {/* SUB-TAB 3: PROBLEM STATEMENT & TRACK ASSIGNMENT */}
          {ticketSubTab === 'problem_statement' && (
            <div className="space-y-4">
              {(() => {
                const members = activeLeadTeam.members || [];
                const checkedCount = members.filter((m) => m.checkInStatus === 'checked_in').length;
                const totalCount = members.length;
                const minReq = Math.min(2, totalCount || 1);
                const isQualified = checkedCount >= minReq;

                // Determine team allocated track & problem statement using FCFS allocation logic
                const rawTrack = activeLeadTeam.selectedTrack || activeLeadTeam.trackPreferences?.[0] || 'nlp-cv';
                const psData =
                  Object.values(TRACK_PROBLEM_STATEMENTS).find(
                    (p) =>
                      p.trackId.toLowerCase() === rawTrack.toLowerCase() ||
                      p.trackName.toLowerCase().includes(rawTrack.toLowerCase()) ||
                      rawTrack.toLowerCase().includes(p.trackId.toLowerCase())
                  ) || Object.values(TRACK_PROBLEM_STATEMENTS)[0];

                if (!isQualified) {
                  return (
                    <div className="p-5 bg-[#17130c] border-2 border-[#f4c151] rounded-md space-y-4">
                      <div className="flex items-center gap-2 text-[#f4c151] font-pixel text-[12px] border-b border-[#423325] pb-2">
                        <Lock size={18} className="text-[#f4c151]" />
                        <span>🔒 PROBLEM STATEMENT &amp; TRACK ASSIGNMENT LOCKED</span>
                      </div>

                      <div className="p-3.5 bg-[#241c10] border border-[#544122] rounded-xs space-y-2 font-silkscreen text-[9px] text-[#fed7aa]">
                        <p className="font-bold text-[#f4c151]">
                          ⚠️ VENUE GATE CHECK-IN REQUIRED (MINIMUM 2 MEMBERS)
                        </p>
                        <p className="leading-relaxed">
                          Problem statements and track allocations will be revealed on hackathon day upon physical venue arrival. At least <strong>2 members of your team</strong> must check in at the venue registration desk to unlock your team's assigned track and problem statement.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="p-3 bg-[#0d1013] border border-[#2b2e30] rounded-xs space-y-1.5 font-silkscreen text-[8.5px]">
                          <span className="text-[#6fb3d9] block font-bold">GATE CHECK-IN STATUS:</span>
                          <div className="flex items-center justify-between">
                            <span className="text-[#8f9396]">CHECKED-IN MEMBERS:</span>
                            <span className="font-mono text-[#f4c151] font-bold text-[10px]">
                              {checkedCount} / {totalCount}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#8f9396]">MINIMUM REQUIRED:</span>
                            <span className="font-mono text-[#4ade80] font-bold text-[10px]">
                              {minReq} MEMBERS
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-[#0d1013] border border-[#2b2e30] rounded-xs space-y-1.5 font-silkscreen text-[8.5px]">
                          <span className="text-[#f4c151] block font-bold">FCFS ALLOCATION RULE:</span>
                          <p className="text-[#8f9396] leading-normal text-[7.5px]">
                            Each track has a hard limit of <strong>4 team slots</strong>. Slot allocation is determined strictly on First-Come-First-Serve (FCFS) order based on the timestamp when your 2nd team member completes venue gate check-in.
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-[#2b2e30] pt-3 space-y-2">
                        <span className="font-silkscreen text-[8.5px] text-[#a7d38a] uppercase block">
                          YOUR SUBMITTED TRACK PREFERENCE ORDER:
                        </span>
                        <div className="flex flex-wrap gap-1.5 font-silkscreen text-[8px]">
                          {activeLeadTeam.trackPreferences && activeLeadTeam.trackPreferences.filter(Boolean).length > 0 ? (
                            activeLeadTeam.trackPreferences.filter(Boolean).map((t, idx) => (
                              <span key={idx} className="bg-[#090b0d] border border-[#2b2e30] text-[#cfe8ff] px-2.5 py-1 rounded-xs flex items-center gap-1">
                                <span className="text-[#f4c151] font-bold">#{idx + 1}:</span> {t}
                              </span>
                            ))
                          ) : (
                            <span className="bg-[#090b0d] border border-[#2b2e30] text-[#cfe8ff] px-2.5 py-1 rounded-xs">
                              {activeLeadTeam.selectedTrack || 'General Track'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="p-5 bg-[#0a1118] border-2 border-[#38bdf8] rounded-md space-y-4 shadow-[0_0_30px_rgba(56,189,248,0.15)]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e3a5f] pb-3">
                      <div className="flex items-center gap-2">
                        <Unlock size={18} className="text-[#38bdf8]" />
                        <span className="font-pixel text-[13px] sm:text-[14px] text-[#38bdf8]">
                          🔓 OFFICIAL PROBLEM STATEMENT &amp; TRACK ASSIGNED
                        </span>
                      </div>
                      <span className="bg-[#102a45] text-[#38bdf8] border border-[#2563eb] font-silkscreen text-[9px] sm:text-[9.5px] px-2.5 py-1 rounded-xs font-bold self-start sm:self-auto">
                        FCFS SLOT CONFIRMED (SLOT #{activeLeadTeam.fcfsQueuePosition || 1})
                      </span>
                    </div>

                    {/* Track Header Card */}
                    <div className="p-4 bg-[#0f1d2e] border border-[#2563eb] rounded-xs space-y-2.5 font-silkscreen">
                      <div className="flex items-center justify-between">
                        <span className="text-[#86efac] text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider">
                          ALLOCATED HACKATHON TRACK:
                        </span>
                        <span className="bg-[#143419] text-[#4ade80] border border-[#22542a] text-[9px] px-2 py-0.5 rounded-xs font-mono">
                          MAX 4 TEAMS ALLOCATED
                        </span>
                      </div>
                      <h3 className="font-pixel text-[16px] sm:text-[18px] text-[#f4c151] leading-tight">
                        {psData.trackName} ({psData.trackId.toUpperCase()})
                      </h3>
                      <p className="text-[#cfe8ff] text-[10.5px] sm:text-[11.5px] leading-relaxed">
                        {psData.trackDescription || psData.tagline}
                      </p>
                    </div>

                    {/* Problem Statement Detail */}
                    <div className="p-4 sm:p-5 bg-[#090b0d] border border-[#2b2e30] rounded-xs space-y-4 font-silkscreen">
                      <div className="border-b border-[#2b2e30] pb-2.5">
                        <span className="text-[#8f9396] text-[9px] sm:text-[9.5px] block mb-1">CHALLENGE TITLE</span>
                        <h4 className="font-pixel text-[15px] sm:text-[17px] text-[#38bdf8] leading-snug">
                          PS-{psData.trackId.toUpperCase()}: {psData.title}
                        </h4>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[#f4c151] font-bold block text-[10.5px] sm:text-[11.5px]">CHALLENGE OVERVIEW &amp; CONTEXT:</span>
                        <p className="text-[#d1d5db] text-[10.5px] sm:text-[11.5px] leading-relaxed">{psData.description || psData.detailedDescription}</p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[#4ade80] font-bold block text-[10.5px] sm:text-[11.5px]">KEY OBJECTIVES &amp; REQUIREMENTS:</span>
                        <ul className="list-disc list-inside space-y-1.5 text-[#cfe8ff] text-[10.5px] sm:text-[11.5px] leading-relaxed">
                          {psData.requirements.map((req, i) => (
                            <li key={i}>{req}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[#b180ff] font-bold block font-mono text-[10.5px] sm:text-[11.5px]">EXPECTED TECHNICAL DELIVERABLES:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {psData.deliverables.map((deliv, i) => (
                            <div key={i} className="bg-[#141618] p-2.5 border border-[#26282a] rounded-xs text-[#86efac] font-mono text-[9.5px] sm:text-[10.5px] flex items-start gap-2 leading-snug">
                              <span className="text-[#f4c151] font-bold shrink-0">✓</span>
                              <span>{deliv}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-[#26282a] flex items-center justify-between text-[8px] font-silkscreen text-[#7d8285]">
        <span>ALL TEAM DATA SYNCED TO CLOUD</span>
        <span className="text-[#a7d38a]">COGNITIA 2026</span>
      </div>

      {/* LIGHTBOX FULL RESOLUTION IMAGE INSPECTOR */}
      {previewImageModal &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-[9999999] flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setPreviewImageModal(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] w-full bg-[#0a0c0e] border-2 border-[#f4c151] rounded-md p-3 sm:p-4 flex flex-col space-y-2 shadow-[0_0_50px_rgba(0,0,0,0.95)] cursor-default z-[9999999]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#2b2e30] pb-2">
                <span className="font-pixel text-[11px] text-[#f4c151] flex items-center gap-1.5 truncate pr-2">
                  <Eye size={14} className="shrink-0" /> {previewImageModal.title || 'FULL RESOLUTION IMAGE INSPECTOR'}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={previewImageModal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-silkscreen text-[8.5px] bg-[#1e2329] text-[#00f0ff] border border-[#3a4149] hover:border-[#00f0ff] px-2.5 py-1 rounded-xs flex items-center gap-1"
                  >
                    <ExternalLink size={11} /> OPEN ORIGINAL
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewImageModal(null)}
                    className="text-[#8f9396] hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="overflow-auto max-h-[76vh] flex justify-center items-center bg-black/80 rounded-xs p-2">
                <img
                  src={previewImageModal.url}
                  alt={previewImageModal.title || 'Preview'}
                  className="max-w-full max-h-[72vh] object-contain rounded-xs border border-[#2b2e30]"
                />
              </div>

              <div className="font-silkscreen text-[8px] text-[#8f9396] text-center pt-1">
                Click anywhere outside or press CLOSE to exit image inspector.
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* READ-ONLY TEAM ROSTER MODAL */}
      {showTeamRosterModal &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999999] flex items-center justify-center p-3 sm:p-4 cursor-default overflow-y-auto"
            onClick={() => setShowTeamRosterModal(false)}
          >
            <div
              className="relative max-w-2xl w-full bg-[#0d1013] border-2 border-[#38bdf8] rounded-md p-4 space-y-3 shadow-[0_0_30px_rgba(56,189,248,0.3)] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#2b3a4a] pb-2">
                <span className="font-pixel text-[12px] text-[#38bdf8] flex items-center gap-1.5">
                  <Users size={14} /> TEAM ROSTER ({activeLeadTeam?.teamName || 'Team Members'})
                </span>
                <button
                  type="button"
                  onClick={() => setShowTeamRosterModal(false)}
                  className="text-[#8f9396] hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-2.5 bg-[#09121a] border border-[#1e344d] rounded-xs font-silkscreen text-[8.5px] text-[#93c5fd] flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-[#38bdf8] shrink-0" />
                <span>ROSTER READ-ONLY VIEW: Team members &amp; college status are managed by event administrators.</span>
              </div>

              <div className="space-y-2">
                {activeLeadTeam?.members.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="bg-[#14181d] border border-[#2b3a4a] p-3 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-1 font-silkscreen text-[9px]">
                      <div className="flex items-center gap-2">
                        <span className="font-pixel text-[11px] text-white font-bold">{m.name}</span>
                        {m.isLead && (
                          <span className="bg-[#241d14] text-[#f2933d] border border-[#423325] text-[7.5px] px-1.5 py-0.5 rounded-xs font-bold">
                            LEAD
                          </span>
                        )}
                        {isIemUemMember(m) ? (
                          <span className="bg-[#142417] text-[#86efac] border border-[#25522b] text-[7.5px] px-1.5 py-0.5 rounded-xs">
                            🎓 IEM Student
                          </span>
                        ) : (
                          <span className="bg-[#1a1c20] text-[#93c5fd] border border-[#2d3748] text-[7.5px] px-1.5 py-0.5 rounded-xs">
                            🏫 External ({m.collegeName || 'Other'})
                          </span>
                        )}
                      </div>
                      <p className="text-[#8f9396]"><Mail size={10} className="inline mr-1" />{m.email} &bull; <Phone size={10} className="inline mr-1" />{m.phone}</p>
                      <p className="text-[#6fb3d9] font-mono"><Github size={10} className="inline mr-1" />@{m.githubId}</p>
                      {m.enrollmentNo && (
                        <p className="text-[#86efac] font-mono">ENROLLMENT NO: {m.enrollmentNo}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#2b3a4a] flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowTeamRosterModal(false)}
                  className="font-pixel text-[9px] bg-[#1a202c] border border-[#38bdf8]/40 text-[#38bdf8] hover:bg-[#2a3447] px-3 py-1.5 rounded-xs cursor-pointer"
                >
                  CLOSE ROSTER
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL: FOOD COUPONS PASS PREVIEW */}
      {showFoodPassModal && activeLeadTeam &&
        createPortal(
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto">
            <div className="max-w-4xl w-full my-auto">
              <FoodCouponsTabScreen
                teamIdFromProp={activeLeadTeam.id}
                isModal={true}
                onCloseModal={() => setShowFoodPassModal(false)}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export const LoginCartridge: React.FC = () => {
  return <RegistrationCartridge defaultLoginMode={true} />;
};
