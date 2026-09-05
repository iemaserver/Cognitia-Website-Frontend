import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  Lock,
  User,
  Search,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Github,
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
  LogOut,
  CreditCard,
  Ticket,
  Check,
  Sparkles,
  QrCode,
  UserCheck,
  Hourglass,
  Hash,
  Target,
  Mail,
  Phone,
  Plus,
  Trash2,
  Camera,
  Clock,
  Upload,
  RefreshCw,
  Utensils,
} from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { TeamRegistration, TeamMember, Phase2SelectionStatus, Phase2PaymentStatus, AttendanceStatus, MealType } from '../../types';
import { sound } from '../../utils/audio';

export const AdminCartridge: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  const [teams, setTeams] = useState<TeamRegistration[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [selectedTeamModal, setSelectedTeamModal] = useState<TeamRegistration | null>(null);

  // Insert Team Modal State
  const [showAddTeamModal, setShowAddTeamModal] = useState<boolean>(false);
  const [newTeamId, setNewTeamId] = useState<string>('');
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newLeadName, setNewLeadName] = useState<string>('');
  const [newLeadEmail, setNewLeadEmail] = useState<string>('');
  const [newLeadPhone, setNewLeadPhone] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [createdCredentialsModal, setCreatedCredentialsModal] = useState<{ teamId?: string; teamName: string; leadName: string; leadEmail: string; password: string } | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);
  const [previewImageModal, setPreviewImageModal] = useState<{ url: string; title: string } | null>(null);

  // Attendance Scanner Bar & Verification Popup Modal State
  const [scanQuery, setScanQuery] = useState<string>('');
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showLiveScannerModal, setShowLiveScannerModal] = useState<boolean>(false);
  const [attendanceModalData, setAttendanceModalData] = useState<{
    matchedTeam: TeamRegistration;
    matchedMember?: TeamMember;
    scanQueryStr: string;
  } | null>(null);

  // Live Camera Scanner State & Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Food Coupons State
  const [activeMealSession, setActiveMealSession] = useState<MealType | 'none'>('none');
  const [foodCouponModalData, setFoodCouponModalData] = useState<{
    matchedTeam: TeamRegistration;
    matchedMember?: TeamMember;
    mealType: MealType;
    passId: string;
    alreadyRedeemed?: boolean;
    redeemedAt?: string;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToMealSession((session) => {
      setActiveMealSession(session);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!showLiveScannerModal) {
      setIsCameraActive(false);
      setCameraError(null);
      return;
    }

    let currentStream: MediaStream | null = null;
    let isMounted = true;

    const startStream = async () => {
      setCameraError(null);
      setIsCameraActive(false);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isMounted) {
          setCameraError('Camera access requires HTTPS or localhost browser environment.');
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        }).catch(async () => {
          return await navigator.mediaDevices.getUserMedia({ video: true });
        });

        currentStream = stream;
        if (videoRef.current && isMounted) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play().catch(() => {});
          setIsCameraActive(true);
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        if (isMounted) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setCameraError('Camera permission was denied by browser. Please allow camera access in address bar / site settings.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setCameraError('No video camera device was detected on your hardware.');
          } else {
            setCameraError(`Camera error: ${err.message || 'Unable to open camera'}. Check permissions or use file scanner.`);
          }
        }
      }
    };

    startStream();

    return () => {
      isMounted = false;
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [showLiveScannerModal, facingMode]);

  // Frame detection loop for live video stream
  useEffect(() => {
    if (!showLiveScannerModal || !isCameraActive) return;

    let isScanning = true;
    const intervalId = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0 && isScanning) {
            const code = barcodes[0].rawValue;
            if (code) {
              handleAttendanceScanSubmit(undefined, code);
            }
          }
        } catch (e) {
          // Frame capture error ignored silently
        }
      }
    }, 300);

    return () => {
      isScanning = false;
      clearInterval(intervalId);
    };
  }, [showLiveScannerModal, isCameraActive, teams]);

  const handleFileUploadQR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imageBitmap = await createImageBitmap(file);
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(imageBitmap);
        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
          handleAttendanceScanSubmit(undefined, barcodes[0].rawValue);
          return;
        }
      }
      alert('Could not detect a QR code from this image. Try a clearer photo or enter the Pass ID manually.');
    } catch (err) {
      console.error('File QR scan error:', err);
      alert('Error parsing uploaded image file.');
    }
  };

  useEffect(() => {
    const authSession = sessionStorage.getItem('cognitia_admin_auth');
    if (authSession === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = firebaseService.subscribeToTeamsChange((updatedTeams) => {
        setTeams(updatedTeams);
      });
      return () => unsubscribe();
    }
  }, [isAuthenticated]);

  const loadAdminData = () => {
    const data = firebaseService.getAllRegistrations();
    setTeams(data);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (username === 'Cognitia2026Admin' && password === 'fuckoff') {
      sound.playBoot();
      setIsAuthenticated(true);
      sessionStorage.setItem('cognitia_admin_auth', 'true');
      loadAdminData();
    } else {
      sound.playBlip(300);
      setLoginError('ACCESS DENIED: Invalid Admin Credentials');
    }
  };

  const handleAdminLogout = () => {
    sound.playBlip(400);
    setIsAuthenticated(false);
    sessionStorage.removeItem('cognitia_admin_auth');
  };

  const handlePhase2StatusChange = async (teamId: string, newStatus: Phase2SelectionStatus) => {
    sound.playBlip(600);
    await firebaseService.updatePhase2Selection(teamId, newStatus);
    loadAdminData();
    if (selectedTeamModal && selectedTeamModal.id === teamId) {
      setSelectedTeamModal({ ...selectedTeamModal, phase2Status: newStatus });
    }
  };


  const handlePhase2PaymentStatusChange = async (teamId: string, newStatus: Phase2PaymentStatus) => {
    const team = teams.find((t) => t.id === teamId);
    if (newStatus === 'payment_verified' && team) {
      if (!team.rsvpConfirmed) {
        sound.playBlip(300);
        alert(`❌ CANNOT VERIFY PHASE 2 PAYMENT:\n\nTeam '${team.teamName}' has not confirmed Phase 2 offline participation RSVP yet.`);
        return;
      }
      const hasProof = team.phase2PaymentTransactionId || (team.phase2PaymentScreenshotUrl && !team.phase2PaymentScreenshotUrl.includes('placeholder'));
      if (!hasProof) {
        sound.playBlip(300);
        alert(`❌ CANNOT VERIFY PHASE 2 PAYMENT:\n\nTeam '${team.teamName}' has not submitted Phase 2 payment details (UTR ID or receipt screenshot) yet.`);
        return;
      }
    }
    sound.playBoot();
    const res = await firebaseService.updatePhase2PaymentStatus(teamId, newStatus);
    if (res.success && res.team) {
      loadAdminData();
      if (selectedTeamModal && selectedTeamModal.id === teamId) {
        setSelectedTeamModal(res.team);
      }
      if (newStatus === 'payment_verified' && res.ticketId) {
        alert(`🎉 Phase 2 Payment Verified! Ticket pass generated: ${res.ticketId}`);
      }
    }
  };

  const handleVerifyPaymentAndGenerateTicket = async (teamId: string) => {
    sound.playBoot();
    const res = await firebaseService.verifyPaymentAndGenerateTicket(teamId);
    if (res.success && res.team) {
      loadAdminData();
      setSelectedTeamModal(res.team);
      alert(`Payment verified! Ticket pass issued: ${res.ticketId}`);
    }
  };

  // QR / Ticket Pass ID Attendance Scan
  const handleAttendanceScanSubmit = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToSearch = (customQuery || scanQuery).trim();
    if (!queryToSearch) return;

    sound.playBlip(600);

    // Food Coupon QR Detection
    if (queryToSearch.includes('COG26-FOOD:')) {
      const parts = queryToSearch.split(':');
      // Format: COG26-FOOD:day1_dinner:passId:memberId
      const targetMealType = (parts[1] || 'day1_dinner') as MealType;
      const targetPassId = parts[2] || queryToSearch;
      const targetMemberId = parts[3];

      let foodMember: TeamMember | undefined = undefined;
      const foodTeam = teams.find((t) => {
        if (t.id.toLowerCase() === targetPassId.toLowerCase() || (t.ticketPassId && t.ticketPassId.toLowerCase() === targetPassId.toLowerCase())) return true;
        const found = t.members.find(
          (m) =>
            m.id === targetMemberId ||
            (m.memberPassId && m.memberPassId.toLowerCase() === targetPassId.toLowerCase()) ||
            m.id.toLowerCase() === targetPassId.toLowerCase()
        );
        if (found) {
          foodMember = found;
          return true;
        }
        return false;
      });

      if (!foodTeam) {
        sound.playBlip(300);
        setScanMessage({
          type: 'error',
          text: `Food Coupon Invalid: No registered team or participant matching pass '${targetPassId}' was found.`,
        });
        return;
      }

      // Check venue check-in status
      const isCheckedIn = foodMember ? foodMember.checkInStatus === 'checked_in' : foodTeam.attendanceStatus === 'checked_in';
      if (!isCheckedIn) {
        sound.playBlip(300);
        setScanMessage({
          type: 'error',
          text: `🛑 CANNOT SERVE MEAL: Participant '${foodMember ? foodMember.name : foodTeam.teamName}' HAS NOT CHECKED IN AT VENUE GATE YET!`,
        });
        return;
      }

      const existingMeals = foodMember ? foodMember.meals || {} : foodTeam.meals || {};
      const redemption = existingMeals[targetMealType];

      sound.playBoot();
      setShowLiveScannerModal(false);
      setFoodCouponModalData({
        matchedTeam: foodTeam,
        matchedMember: foodMember,
        mealType: targetMealType,
        passId: targetPassId,
        alreadyRedeemed: !!redemption?.redeemed,
        redeemedAt: redemption?.redeemedAt,
      });
      return;
    }

    const clean = queryToSearch.toLowerCase();
    let matchedMember: TeamMember | undefined = undefined;

    const matchedTeam = teams.find((t) => {
      if (t.id.toLowerCase() === clean || (t.ticketPassId && t.ticketPassId.toLowerCase() === clean)) {
        return true;
      }
      const foundMem = t.members.find(
        (m) =>
          m.id.toLowerCase() === clean ||
          (m.memberPassId && m.memberPassId.toLowerCase() === clean) ||
          (m.enrollmentNo && m.enrollmentNo.toLowerCase() === clean)
      );
      if (foundMem) {
        matchedMember = foundMem;
        return true;
      }
      return false;
    });

    if (matchedTeam) {
      sound.playBoot();
      setAttendanceModalData({
        matchedTeam,
        matchedMember,
        scanQueryStr: queryToSearch,
      });
      setScanMessage(null);
      setShowLiveScannerModal(false);
    } else {
      sound.playBlip(300);
      setScanMessage({
        type: 'error',
        text: `No registered participant team or member matching '${queryToSearch}' was found.`,
      });
    }
  };

  const handleToggleAttendanceStatus = async (targetId: string, currentStatus?: string) => {
    sound.playBoot();
    const newStatus: AttendanceStatus = currentStatus === 'checked_in' ? 'not_checked_in' : 'checked_in';
    const res = await firebaseService.markAttendance(targetId, newStatus);
    if (res.success) {
      loadAdminData();
      if (selectedTeamModal) {
        if (selectedTeamModal.id === targetId || selectedTeamModal.ticketPassId === targetId) {
          setSelectedTeamModal({
            ...selectedTeamModal,
            attendanceStatus: newStatus,
            checkInTimestamp: newStatus === 'checked_in' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          });
        } else if (selectedTeamModal.members) {
          const updatedMembers = selectedTeamModal.members.map((m) => {
            if (m.memberPassId === targetId || m.id === targetId) {
              return {
                ...m,
                checkInStatus: newStatus,
                checkInTimestamp: newStatus === 'checked_in' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
              };
            }
            return m;
          });
          setSelectedTeamModal({ ...selectedTeamModal, members: updatedMembers });
        }
      }
    }
  };

  const generateNextTeamId = () => {
    const allTeams = firebaseService.getAllRegistrations();
    let maxNum = 100;
    allTeams.forEach((t) => {
      const match = (t.id || '').match(/COG26-T(\d+)/i) || (t.id || '').match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num >= maxNum && num < 9999) {
          maxNum = num;
        }
      }
    });
    return `COG26-T${maxNum + 1}`;
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `Cognitia#${rand}`;
  };

  const handleOpenAddTeamModal = () => {
    sound.playBlip(500);
    setNewTeamId(generateNextTeamId());
    setNewTeamName('');
    setNewLeadName('');
    setNewLeadEmail('');
    setNewLeadPhone('');
    setNewPassword(generateRandomPassword());
    setShowAddTeamModal(true);
  };

  const handleAdminCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newLeadEmail.trim() || !newPassword.trim()) {
      alert('Please enter Team Name, Lead Email, and Password.');
      return;
    }

    sound.playBoot();
    const res = await firebaseService.adminCreateTeam({
      customTeamId: newTeamId.trim() || undefined,
      teamName: newTeamName.trim(),
      leadName: newLeadName.trim() || 'Team Lead',
      leadEmail: newLeadEmail.trim(),
      leadPhone: newLeadPhone.trim(),
      passwordHash: newPassword.trim(),
    });

    if (res.success && res.team) {
      loadAdminData();
      setShowAddTeamModal(false);
      setCreatedCredentialsModal({
        teamId: res.team.id,
        teamName: res.team.teamName,
        leadName: newLeadName.trim() || 'Team Lead',
        leadEmail: res.team.leadEmail,
        password: newPassword.trim(),
      });
    } else {
      alert(res.message || 'Failed to create team credentials.');
    }
  };

  // Admin Member Addition Form State
  const [showAdminAddMemberForm, setShowAdminAddMemberForm] = useState<boolean>(false);
  const [adminMemName, setAdminMemName] = useState<string>('');
  const [adminMemEmail, setAdminMemEmail] = useState<string>('');
  const [adminMemPhone, setAdminMemPhone] = useState<string>('');
  const [adminMemRole, setAdminMemRole] = useState<string>('Developer');
  const [adminMemGithub, setAdminMemGithub] = useState<string>('');
  const [adminMemEnrollment, setAdminMemEnrollment] = useState<string>('');
  const [adminMemIsIemUem, setAdminMemIsIemUem] = useState<boolean>(true);

  const handleAdminAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamModal) return;
    if (!adminMemName.trim() || !adminMemEmail.trim()) {
      alert('Please enter Member Name and Email.');
      return;
    }

    const cleanEmail = adminMemEmail.trim().toLowerCase();
    const newMember: TeamMember = {
      id: `mem-${Date.now()}`,
      name: adminMemName.trim(),
      email: cleanEmail,
      phone: adminMemPhone.trim(),
      role: adminMemRole || 'Developer',
      githubId: adminMemGithub.trim().replace(/^@/, ''),
      isLead: false,
      isIemUemStudent: adminMemIsIemUem,
      collegeName: adminMemIsIemUem ? 'IEM / UEM' : 'External',
      enrollmentNo: adminMemIsIemUem ? adminMemEnrollment.trim() : '',
    };

    const updatedMembers = [...(selectedTeamModal.members || []), newMember];
    sound.playBoot();
    const res = await firebaseService.updateTeamDetails(selectedTeamModal.id, selectedTeamModal.teamName, updatedMembers);
    if (res.success && res.team) {
      loadAdminData();
      setSelectedTeamModal(res.team);
      setShowAdminAddMemberForm(false);
      setAdminMemName('');
      setAdminMemEmail('');
      setAdminMemPhone('');
      setAdminMemGithub('');
      setAdminMemEnrollment('');
    } else {
      alert(res.message || 'Failed to add member.');
    }
  };

  const handleAdminRemoveMember = async (memberId: string) => {
    if (!selectedTeamModal) return;
    sound.playBlip(350);
    const updatedMembers = selectedTeamModal.members.filter((m) => m.id !== memberId && m.memberPassId !== memberId);
    const res = await firebaseService.updateTeamDetails(selectedTeamModal.id, selectedTeamModal.teamName, updatedMembers);
    if (res.success && res.team) {
      loadAdminData();
      setSelectedTeamModal(res.team);
    }
  };

  const getEmailTemplateText = (teamName: string, leadName: string, leadEmail: string, pass: string, teamId?: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cognitia-2026.web.app';
    const tidBlock = teamId ? `• Unique Team ID (TID): ${teamId}\n` : '';
    return `Subject: Cognitia 2026 - Phase 2 Team Credentials & Dashboard Access

Dear Team Lead (${leadName}),

Your team '${teamName}' has been enrolled for Phase 2 of Cognitia 2026!

Your Phase 2 Team Portal credentials are:
• Portal Link: ${origin}
${tidBlock}• Login ID (TID): ${teamId || leadEmail}
• Lead Email: ${leadEmail}
• Login Password: ${pass}

Next Steps:
1. Log in to your Phase 2 Dashboard at ${origin} using your Unique Team ID (TID) and Password.
2. Submit IEMCRP Student Information screenshots (for ₹0 free registration waiver) or complete ₹200 fee payment for external teams.
3. Access your official Phase 2 Pass Ticket & unique member QR codes for venue entry.

Best regards,
Cognitia 2026 Organizing Team`;
  };

  const filteredTeams = teams.filter((t) => {
    const matchesSearch =
      t.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.leadEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.ticketPassId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.paymentTransactionId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.submission?.projectTitle || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTrack =
      selectedTrack === 'all' || (t.submission && t.submission.trackId === selectedTrack);

    return matchesSearch && matchesTrack;
  });

  const exportToCSV = () => {
    sound.playBlip(700);
    const escapeCSV = (val: string | number | boolean | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = [
      // Section 1: Team Identification & Pass Credentials
      'Team ID (TID)',
      'Team Name',
      'Official Pass Ticket ID',
      'Ticket Issued At',
      'Selected Track',
      'Track Preferences',
      'Phase 2 Selection Status',
      'RSVP Confirmed',
      'Enrolled At',
      // Section 2: Financial & IEMCRP Audit
      'Team Type',
      'IEM/UEM Free Waiver Verified?',
      'Phase 2 Fee Amount',
      'Phase 2 Payment Status',
      'UPI UTR Ref Transaction ID',
      'Payment Receipt Proof URL',
      'Payment Submitted At',
      'IEMCRP Proof Screenshots Submitted?',
      'IEMCRP Submitted At',
      // Section 3: Team Attendance Status
      'Venue Attendance Status',
      'Venue Check-in Timestamp',
      'Total Members Count',
      // Section 4: Member 1 (Team Lead)
      'M1 Name (Lead)',
      'M1 Role',
      'M1 Email',
      'M1 Phone',
      'M1 GitHub',
      'M1 Institution',
      'M1 IEM Student?',
      'M1 IEM Enrollment No',
      'M1 Member Pass ID',
      'M1 Gate Check-in Status',
      'M1 IEMCRP Proof URL',
      // Section 5: Member 2
      'M2 Name',
      'M2 Role',
      'M2 Email',
      'M2 Phone',
      'M2 GitHub',
      'M2 Institution',
      'M2 IEM Student?',
      'M2 IEM Enrollment No',
      'M2 Member Pass ID',
      'M2 Gate Check-in Status',
      'M2 IEMCRP Proof URL',
      // Section 6: Member 3
      'M3 Name',
      'M3 Role',
      'M3 Email',
      'M3 Phone',
      'M3 GitHub',
      'M3 Institution',
      'M3 IEM Student?',
      'M3 IEM Enrollment No',
      'M3 Member Pass ID',
      'M3 Gate Check-in Status',
      'M3 IEMCRP Proof URL',
      // Section 7: Member 4
      'M4 Name',
      'M4 Role',
      'M4 Email',
      'M4 Phone',
      'M4 GitHub',
      'M4 Institution',
      'M4 IEM Student?',
      'M4 IEM Enrollment No',
      'M4 Member Pass ID',
      'M4 Gate Check-in Status',
      'M4 IEMCRP Proof URL',
      // Section 8: Complete Roster Summary Log
      'Complete Roster Summary Log',
    ];

    const rows = teams.map((t) => {
      const extractMemberCols = (m: any) => [
        escapeCSV(m ? m.name : 'N/A'),
        escapeCSV(m ? m.role : 'N/A'),
        escapeCSV(m ? m.email || 'N/A' : 'N/A'),
        escapeCSV(m ? m.phone || 'N/A' : 'N/A'),
        escapeCSV(m ? `@${m.githubId}` : 'N/A'),
        escapeCSV(m ? (m.isIemUemStudent ? 'IEM / UEM' : m.collegeName || 'External') : 'N/A'),
        escapeCSV(m ? (m.isIemUemStudent ? 'YES' : 'NO') : 'N/A'),
        escapeCSV(m ? (m.isIemUemStudent ? m.enrollmentNo || 'N/A' : 'N/A') : 'N/A'),
        escapeCSV(m ? m.memberPassId || 'N/A' : 'N/A'),
        escapeCSV(m ? (m.checkInStatus === 'checked_in' ? 'CHECKED_IN' : 'PENDING') : 'N/A'),
        escapeCSV(m ? m.iemcrpScreenshotUrl || 'N/A' : 'N/A'),
      ];

      const isIemUemTeamVerified = Boolean(
        t.isIemUemTeam ||
        (t.members && t.members.length > 0 && t.members.every((m) => Boolean(m.isIemUemStudent && m.enrollmentNo && m.enrollmentNo.trim().length >= 4)))
      );
      const teamType = isIemUemTeamVerified ? 'IEM/UEM Student Team (Free Waiver)' : 'External / Mixed Team (₹200 Fee)';
      const feeAmt = isIemUemTeamVerified ? '₹0' : '₹200';
      const trackPrefs = t.trackPreferences ? t.trackPreferences.join(' > ') : t.selectedTrack || 'N/A';

      const rosterSummary = t.members
        .map(
          (m, idx) =>
            `[M${idx + 1}] ${m.name} (${m.role}) - Email: ${m.email || 'N/A'}, Phone: ${m.phone || 'N/A'}, GitHub: @${m.githubId}, Institution: ${m.isIemUemStudent ? `IEM/UEM [Roll: ${m.enrollmentNo || 'N/A'}, Proof: ${m.iemcrpScreenshotUrl || 'N/A'}]` : `External (${m.collegeName || 'N/A'})`}, Pass ID: ${m.memberPassId || 'N/A'}, Gate Check-in: ${m.checkInStatus || 'not_checked_in'}`
        )
        .join(' ; ');

      return [
        // Section 1: Team Identification & Pass Credentials
        escapeCSV(t.id),
        escapeCSV(t.teamName),
        escapeCSV(t.ticketPassId || 'N/A'),
        escapeCSV(t.ticketIssuedAt || 'N/A'),
        escapeCSV(t.selectedTrack || 'N/A'),
        escapeCSV(trackPrefs),
        escapeCSV((t.phase2Status || 'pending').toUpperCase()),
        escapeCSV(t.rsvpConfirmed ? 'YES' : 'NO'),
        escapeCSV(t.registeredAt),
        // Section 2: Financial & IEMCRP Audit
        escapeCSV(teamType),
        escapeCSV(isIemUemTeamVerified ? 'YES (₹0 WAIVER)' : 'NO (₹200 FEE)'),
        escapeCSV(feeAmt),
        escapeCSV(t.phase2PaymentStatus || t.paymentStatus || 'unpaid'),
        escapeCSV(t.phase2PaymentTransactionId || t.paymentTransactionId || 'N/A'),
        escapeCSV(t.phase2PaymentScreenshotUrl || t.paymentScreenshotUrl || 'N/A'),
        escapeCSV(t.phase2PaymentSubmittedAt || t.paymentSubmittedAt || 'N/A'),
        escapeCSV(t.iemcrpScreenshotsSubmitted ? 'YES' : 'NO'),
        escapeCSV(t.iemcrpScreenshotsSubmittedAt || 'N/A'),
        // Section 3: Team Attendance Status
        escapeCSV(t.attendanceStatus === 'checked_in' ? 'Present' : 'Absent'),
        escapeCSV(t.checkInTimestamp || 'N/A'),
        escapeCSV(t.members.length),
        // Section 4 to 7: Individual Members
        ...extractMemberCols(t.members[0]),
        ...extractMemberCols(t.members[1]),
        ...extractMemberCols(t.members[2]),
        ...extractMemberCols(t.members[3]),
        // Section 8: Summary
        escapeCSV(rosterSummary),
      ];
    });

    const csvString = [headers.map(escapeCSV).join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Cognitia2026_Full_Database_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Unauthenticated Admin Login Screen
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4 text-center select-none" id="cartridge-admin-login">
        <div className="w-full max-w-sm bg-[#0a0c0e]/35 backdrop-blur-md border border-[#ef4444]/40 hover:border-[#ef4444] p-5 sm:p-6 rounded-md shadow-[0_0_24px_rgba(239,68,68,0.2)] space-y-4 transition-all">
          <div className="flex justify-center text-[#ef4444]">
            <ShieldCheck size={48} className="animate-pulse" />
          </div>

          <div>
            <h2 className="font-pixel text-[13px] text-[#ef4444] uppercase tracking-wider">
              ADMIN CONTROL PANEL
            </h2>
            <p className="font-silkscreen text-[9px] text-[#8f9396] mt-1">
              AUTHORIZED PERSONNEL ONLY &bull; RESTRICTED ACCESS
            </p>
          </div>

          {loginError && (
            <div className="p-2 bg-[#ef4444]/15 border border-[#ef4444]/40 text-[#fca5a5] font-silkscreen text-[8.5px] rounded-sm">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-3 text-left">
            <div>
              <label className="block font-silkscreen text-[8.5px] text-[#8f9396] mb-1">
                ADMIN IDENTIFIER
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Admin Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#0c0e10] border border-[#2b2e30] text-[#cfe8ff] font-mono text-xs px-2.5 py-1.5 rounded-xs focus:border-[#eb5147] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-silkscreen text-[8.5px] text-[#8f9396] mb-1">
                CLEARANCE PASSWORD
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Master Key"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0c0e10] border border-[#2b2e30] text-[#cfe8ff] font-mono text-xs px-2.5 py-1.5 rounded-xs focus:border-[#eb5147] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#261414] border-2 border-[#522525] hover:border-[#eb5147] font-pixel text-[10px] text-[#eb5147] hover:text-white uppercase py-2 px-3 rounded-xs flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#000] cursor-pointer transition-all"
            >
              <Lock size={12} /> AUTHENTICATE ADMIN ACCESS
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans text-[#cfe8ff]">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-[#141618] border-2 border-[#2b2e30] rounded-md gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#261414] border border-[#522525] text-[#eb5147] rounded-xs">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="font-pixel text-[12px] sm:text-[14px] text-[#f4c151] uppercase">
              COGNITIA 2026 &bull; ADMIN CONTROL &amp; AUDIT PORTAL
            </h1>
            <p className="font-silkscreen text-[8px] sm:text-[9px] text-[#8f9396]">
              REAL-TIME PARTICIPANTS, PAYMENTS &amp; VENUE ATTENDANCE MANAGEMENT
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              sound.playBlip(600);
              setShowLiveScannerModal(true);
            }}
            className="font-pixel text-[8px] sm:text-[9px] bg-[#1c2836] border border-[#00f0ff] text-[#00f0ff] hover:bg-[#25374d] px-3 py-1.5 rounded-xs flex items-center gap-1 cursor-pointer"
          >
            <Camera size={12} /> LIVE SCANNER
          </button>
          <button
            onClick={exportToCSV}
            className="font-pixel text-[8px] sm:text-[9px] bg-[#182418] border border-[#254225] text-[#a7d38a] hover:bg-[#203320] px-3 py-1.5 rounded-xs flex items-center gap-1 cursor-pointer"
          >
            <Download size={12} /> EXPORT CSV
          </button>
          <button
            onClick={handleAdminLogout}
            className="font-pixel text-[8px] sm:text-[9px] bg-[#261414] border border-[#522525] text-[#eb5147] hover:bg-[#381c1c] px-3 py-1.5 rounded-xs flex items-center gap-1 cursor-pointer"
          >
            <LogOut size={12} /> EXIT ADMIN
          </button>
        </div>
      </div>

      {/* GLOBAL FOOD COUPONS SESSION CONTROLLER */}
      <div className="p-3.5 bg-[#141d18] border-2 border-[#4ade80]/60 rounded-md space-y-2.5 shadow-[0_0_20px_rgba(74,222,128,0.15)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#25522b] pb-2 gap-2">
          <div className="flex items-center gap-2 text-[#4ade80]">
            <Utensils size={16} />
            <span className="font-pixel text-[11px] sm:text-[12px]">
              FOOD COUPONS ACTIVE SESSION CONTROLLER
            </span>
          </div>
          <div className="font-silkscreen text-[8px] bg-[#1a2d1e] text-[#86efac] border border-[#2e5934] px-2.5 py-1 rounded-xs">
            CURRENTLY ACTIVE: <strong className="text-[#4ade80] uppercase font-bold">{activeMealSession === 'none' ? 'OFF (NO COUPONS REVEALED)' : activeMealSession.replace('_', ' ')}</strong>
          </div>
        </div>

        <p className="font-silkscreen text-[8.5px] text-[#cfe8ff]">
          Click any meal button below to enable that food coupon QR for all checked-in attendees across the app:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            type="button"
            onClick={async () => {
              sound.playBoot();
              await firebaseService.setActiveMealSession('day1_dinner');
            }}
            className={`font-pixel text-[8.5px] uppercase py-2 px-2 rounded-xs border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
              activeMealSession === 'day1_dinner'
                ? 'bg-[#1e4620] border-[#4ade80] text-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.4)]'
                : 'bg-[#0f1712] border-[#25522b] text-[#86efac] hover:border-[#4ade80]'
            }`}
          >
            <span>🍱 DAY 1 DINNER</span>
            {activeMealSession === 'day1_dinner' && <span className="text-[7px] text-[#4ade80] font-silkscreen">● ACTIVE NOW</span>}
          </button>

          <button
            type="button"
            onClick={async () => {
              sound.playBoot();
              await firebaseService.setActiveMealSession('day1_snacks');
            }}
            className={`font-pixel text-[8.5px] uppercase py-2 px-2 rounded-xs border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
              activeMealSession === 'day1_snacks'
                ? 'bg-[#1e4620] border-[#4ade80] text-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.4)]'
                : 'bg-[#0f1712] border-[#25522b] text-[#86efac] hover:border-[#4ade80]'
            }`}
          >
            <span>🍕 DAY 1 SNACKS</span>
            {activeMealSession === 'day1_snacks' && <span className="text-[7px] text-[#4ade80] font-silkscreen">● ACTIVE NOW</span>}
          </button>

          <button
            type="button"
            onClick={async () => {
              sound.playBoot();
              await firebaseService.setActiveMealSession('day2_breakfast');
            }}
            className={`font-pixel text-[8.5px] uppercase py-2 px-2 rounded-xs border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
              activeMealSession === 'day2_breakfast'
                ? 'bg-[#1e4620] border-[#4ade80] text-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.4)]'
                : 'bg-[#0f1712] border-[#25522b] text-[#86efac] hover:border-[#4ade80]'
            }`}
          >
            <span>🥐 DAY 2 BREAKFAST</span>
            {activeMealSession === 'day2_breakfast' && <span className="text-[7px] text-[#4ade80] font-silkscreen">● ACTIVE NOW</span>}
          </button>

          <button
            type="button"
            onClick={async () => {
              sound.playBoot();
              await firebaseService.setActiveMealSession('day2_lunch');
            }}
            className={`font-pixel text-[8.5px] uppercase py-2 px-2 rounded-xs border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
              activeMealSession === 'day2_lunch'
                ? 'bg-[#1e4620] border-[#4ade80] text-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.4)]'
                : 'bg-[#0f1712] border-[#25522b] text-[#86efac] hover:border-[#4ade80]'
            }`}
          >
            <span>🍱 DAY 2 LUNCH</span>
            {activeMealSession === 'day2_lunch' && <span className="text-[7px] text-[#4ade80] font-silkscreen">● ACTIVE NOW</span>}
          </button>

          <button
            type="button"
            onClick={async () => {
              sound.playBlip(300);
              await firebaseService.setActiveMealSession('none');
            }}
            className={`col-span-2 sm:col-span-1 font-pixel text-[8.5px] uppercase py-2 px-2 rounded-xs border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
              activeMealSession === 'none'
                ? 'bg-[#261414] border-[#eb5147] text-[#eb5147]'
                : 'bg-[#170f0f] border-[#522525] text-[#fca5a5] hover:border-[#eb5147]'
            }`}
          >
            <span>🚫 DISABLE ALL</span>
            {activeMealSession === 'none' && <span className="text-[7px] text-[#eb5147] font-silkscreen">● OFF</span>}
          </button>
        </div>
      </div>

      {/* QUICK VENUE ATTENDANCE CHECK-IN SCANNER */}
      <div className="p-3.5 bg-[#141618] border-2 border-[#254225] rounded-md space-y-2">
        <div className="flex items-center justify-between border-b border-[#254225] pb-1.5">
          <span className="font-pixel text-[10px] sm:text-[11px] text-[#a7d38a] flex items-center gap-1.5">
            <UserCheck size={14} /> LIVE VENUE ATTENDANCE SCANNER &amp; SEARCH
          </span>
          <span className="font-silkscreen text-[7.5px] text-[#8fa892]">
            ENTER TICKET PASS ID (e.g. COGNITIA-2026-PASS-XXXX) OR TEAM ID
          </span>
        </div>

        {scanMessage && (
          <div
            className={`p-2 rounded-xs border font-silkscreen text-[8.5px] flex items-center gap-1.5 ${scanMessage.type === 'success'
                ? 'bg-[#142417] border-[#25522b] text-[#86efac]'
                : 'bg-[#261414] border-[#522525] text-[#fca5a5]'
              }`}
          >
            {scanMessage.type === 'success' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
            <span>{scanMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleAttendanceScanSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Scan QR or enter Ticket Pass ID / Team ID (e.g. COGNITIA-2026-PASS-8192)"
            value={scanQuery}
            onChange={(e) => setScanQuery(e.target.value)}
            className="grow bg-[#0c0e10] border border-[#254225] text-[#00f0ff] font-mono text-xs px-3 py-1.5 rounded-xs focus:border-[#a7d38a] focus:outline-none"
          />
          <button
            type="submit"
            className="font-pixel text-[9px] bg-[#182418] border border-[#254225] text-[#a7d38a] hover:bg-[#203320] px-4 py-1.5 rounded-xs flex items-center gap-1 cursor-pointer shrink-0"
          >
            <CheckCircle2 size={12} /> MARK PRESENT
          </button>
        </form>
      </div>

      {/* Filters & Search & Insert Team Button */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-[#141618] p-3 border-2 border-[#2b2e30] rounded-md items-center">
        <div className="sm:col-span-6 relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-[#7d8285]" />
          <input
            type="text"
            placeholder="Search teams by name, lead email, ticket pass ID, UTR ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0e10] border border-[#2b2e30] text-[#cfe8ff] font-mono text-xs pl-8 pr-3 py-1.5 rounded-xs focus:border-[#f4c151] focus:outline-none"
          />
        </div>

        <div className="sm:col-span-3 flex items-center gap-1.5">
          <span className="font-silkscreen text-[8px] text-[#8f9396] shrink-0">FILTER:</span>
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            className="bg-[#0c0e10] border border-[#2b2e30] text-[#cfe8ff] font-silkscreen text-[8.5px] px-2 py-1.5 rounded-xs w-full focus:border-[#f4c151] focus:outline-none"
          >
            <option value="all">ALL TRACKS</option>
            <option value="AI / Machine Learning">AI / ML</option>
            <option value="Web3 / Blockchain">Web3 / Blockchain</option>
            <option value="Cybersecurity">Cybersecurity</option>
            <option value="Open Innovation">Open Innovation</option>
          </select>
        </div>

        <div className="sm:col-span-3 flex justify-end">
          <button
            type="button"
            onClick={handleOpenAddTeamModal}
            className="w-full bg-[#1b351d] hover:bg-[#254d28] border border-[#34783a] text-[#86efac] font-pixel text-[9.5px] py-1.5 px-3 rounded-xs shadow-[2px_2px_0_0_#000] cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles size={12} className="text-[#86efac]" /> ➕ INSERT TEAM CREDENTIALS
          </button>
        </div>
      </div>

      {/* Teams Data Table */}
      <div className="bg-[#141618] border-2 border-[#2b2e30] rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1c1f24] border-b-2 border-[#2b2e30] font-pixel text-[8px] text-[#8f9396] uppercase">
                <th className="p-2.5">Team Name</th>
                <th className="p-2.5">Lead Email</th>
                <th className="p-2.5">IEM/UEM Status</th>
                <th className="p-2.5">Phase 2 Registration Fee</th>
                <th className="p-2.5">Venue Gate Attendance</th>
                <th className="p-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2b2e30] font-sans text-xs text-[#cfe8ff]">
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[#8f9396] font-silkscreen text-[8px]">
                    No Phase 2 registrations or teams found.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((t) => {
                  const isIemUemTeam = t.isIemUemTeam || (t.members && t.members.length > 0 && t.members.every(m => m.isIemUemStudent && m.enrollmentNo));

                  return (
                    <tr key={t.id} className="hover:bg-[#1b1f24]">
                      <td className="p-2 font-semibold text-[#cfe8ff]">
                        {t.teamName}
                        {t.ticketPassId && (
                          <span className="block font-mono text-[9px] text-[#86efac]">{t.ticketPassId}</span>
                        )}
                      </td>
                      <td className="p-2 text-[#6fb3d9] font-mono">{t.leadEmail}</td>

                      {/* IEM / UEM Affiliation Badge */}
                      <td className="p-2">
                        {isIemUemTeam ? (
                          <span className="bg-[#182418] text-[#86efac] border border-[#25522b] font-silkscreen text-[7.5px] px-2 py-0.5 rounded-xs flex items-center gap-1 w-fit">
                            🎓 IEM/UEM (FREE WAIVER)
                          </span>
                        ) : (
                          <span className="bg-[#241d14] text-[#f2933d] border border-[#423325] font-silkscreen text-[7.5px] px-2 py-0.5 rounded-xs flex items-center gap-1 w-fit">
                            🏫 EXTERNAL/MIXED (₹200 FEE)
                          </span>
                        )}
                      </td>

                      {/* Phase 2 Fee Status */}
                      <td className="p-2">
                        <select
                          value={t.phase2PaymentStatus || t.paymentStatus || 'unpaid'}
                          onChange={(e) => handlePhase2PaymentStatusChange(t.id, e.target.value as Phase2PaymentStatus)}
                          className={`font-silkscreen text-[7.5px] px-1.5 py-0.5 rounded-xs border cursor-pointer ${t.phase2PaymentStatus === 'payment_verified' || t.paymentStatus === 'payment_verified'
                              ? 'bg-[#182418] text-[#a7d38a] border-[#254225]'
                              : t.phase2PaymentStatus === 'payment_pending' || t.paymentStatus === 'payment_pending'
                                ? 'bg-[#241d14] text-[#f2933d] border-[#423325]'
                                : 'bg-[#241818] text-[#eb5147] border-[#422525]'
                            }`}
                        >
                          <option value="unpaid">P2: UNPAID</option>
                          <option value="payment_pending">P2: VERIFICATION PENDING</option>
                          <option value="payment_verified">P2: VERIFIED &amp; TICKET ISSUED</option>
                        </select>
                      </td>

                      {/* Attendance Status */}
                      <td className="p-2">
                        <button
                          onClick={() => handleToggleAttendanceStatus(t.id, t.attendanceStatus)}
                          className={`font-silkscreen text-[7px] px-2 py-0.5 rounded-xs border flex items-center gap-1 cursor-pointer ${t.attendanceStatus === 'checked_in'
                              ? 'bg-[#182418] text-[#a7d38a] border-[#254225]'
                              : 'bg-[#1c1f24] text-[#8f9396] border-[#2b2e30] hover:text-[#a7d38a]'
                            }`}
                        >
                          <UserCheck size={10} />
                          {t.attendanceStatus === 'checked_in'
                            ? `PRESENT (${t.checkInTimestamp || 'OK'})`
                            : 'MARK PRESENT'}
                        </button>
                      </td>

                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              sound.playBlip(500);
                              setCopiedTemplate(false);
                              setCreatedCredentialsModal({
                                teamName: t.teamName,
                                leadName: t.members?.[0]?.name || 'Team Lead',
                                leadEmail: t.leadEmail,
                                password: t.leadPasswordHash || 'Cognitia2026',
                              });
                            }}
                            className="bg-[#182418] border border-[#254225] hover:border-[#4ade80] font-pixel text-[7px] text-[#86efac] px-2 py-0.5 rounded-xs cursor-pointer"
                            title="View & Copy Email Credentials Template"
                          >
                            🔑 Creds
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              sound.playBlip(600);
                              setSelectedTeamModal(t);
                            }}
                            className="bg-[#1e2329] border border-[#3a4149] hover:border-[#f4c151] font-pixel text-[7px] text-[#f4c151] px-2 py-0.5 rounded-xs cursor-pointer"
                          >
                            INSPECT
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECTOR MODAL */}
      {selectedTeamModal &&
        createPortal(
          <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6 overflow-y-auto">
            <div className="w-full max-w-2xl bg-[#141618] border-2 border-[#f4c151] p-4 sm:p-5 pb-6 rounded-md shadow-[0_0_50px_rgba(0,0,0,0.95)] max-h-[82vh] overflow-y-auto space-y-4 my-auto relative z-[999999]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#2b2e30] pb-2">
                <div>
                  <span className="font-silkscreen text-[8px] text-[#8f9396] uppercase block">
                    SUBMISSION &amp; ATTENDANCE INSPECTOR
                  </span>
                  <span className="font-pixel text-[13px] sm:text-[14px] text-[#f4c151]">
                    {selectedTeamModal.teamName}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTeamModal(null)}
                  className="p-1 bg-[#261414] text-[#eb5147] hover:text-white rounded-xs cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* EVENT STAGE 1: BASIC TEAM REGISTRATION */}
              <div className="bg-[#090b0d] border border-[#2b2e30] p-3 rounded-xs space-y-1.5 font-silkscreen text-[8.5px]">
                <span className="font-pixel text-[9px] text-[#f4c151] block border-b border-[#2b2e30] pb-1">
                  STAGE 1: TEAM REGISTRATION &amp; IDENTIFIER
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[#cfe8ff]">
                  <p>TEAM ID: <span className="font-mono text-white font-bold">{selectedTeamModal.id}</span></p>
                  <p>REGISTERED AT: <span className="text-[#8f9396]">{selectedTeamModal.registeredAt || 'Phase 1 Launch'}</span></p>
                  <p>LEAD EMAIL: <span className="text-[#6fb3d9] font-mono">{selectedTeamModal.leadEmail}</span></p>
                  <p>LEAD PHONE: <span className="text-[#a7d38a] font-mono">{selectedTeamModal.leadPhone}</span></p>
                </div>
              </div>

              {/* EVENT STAGE 2: TEAM MEMBERS ROSTER & DETAILS */}
              <div className="bg-[#090b0d] border border-[#2b2e30] p-3 rounded-xs space-y-2">
                <div className="flex items-center justify-between border-b border-[#2b2e30] pb-1.5">
                  <span className="font-pixel text-[9px] text-[#6fb3d9] flex items-center gap-1.5">
                    <Users size={12} /> STAGE 2: TEAM MEMBERS ROSTER ({selectedTeamModal.members.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAdminAddMemberForm(!showAdminAddMemberForm)}
                      className="bg-[#182418] hover:bg-[#254225] border border-[#34783a] text-[#86efac] font-silkscreen text-[7.5px] px-2 py-0.5 rounded-xs cursor-pointer flex items-center gap-1"
                    >
                      <Plus size={10} /> {showAdminAddMemberForm ? 'CANCEL ADD' : '➕ ADD MEMBER'}
                    </button>
                    <span className={`font-silkscreen text-[7.5px] px-2 py-0.5 rounded-xs border ${selectedTeamModal.isMembersLocked ? 'bg-[#182418] text-[#a7d38a] border-[#254225]' : 'bg-[#241d14] text-[#f2933d] border-[#423325]'
                      }`}>
                      {selectedTeamModal.isMembersLocked ? 'ROSTER LOCKED' : 'ROSTER UNLOCKED'}
                    </span>
                  </div>
                </div>

                {/* Inline Admin Add Member Form */}
                {showAdminAddMemberForm && (
                  <form onSubmit={handleAdminAddMemberSubmit} className="p-3 bg-[#141618] border border-[#34783a] rounded-xs font-silkscreen text-[8.5px] space-y-2 mb-2">
                    <span className="font-pixel text-[9px] text-[#86efac] block border-b border-[#254225] pb-1">
                      ➕ ADD NEW MEMBER TO TEAM ({selectedTeamModal.teamName})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Member Full Name *"
                        value={adminMemName}
                        onChange={(e) => setAdminMemName(e.target.value)}
                        className="bg-[#090b0d] border border-[#2b2e30] text-white p-1.5 rounded-xs"
                      />
                      <input
                        type="email"
                        required
                        placeholder="Member Email Address *"
                        value={adminMemEmail}
                        onChange={(e) => setAdminMemEmail(e.target.value)}
                        className="bg-[#090b0d] border border-[#2b2e30] text-[#6fb3d9] p-1.5 rounded-xs"
                      />
                      <input
                        type="text"
                        placeholder="Phone Number"
                        value={adminMemPhone}
                        onChange={(e) => setAdminMemPhone(e.target.value)}
                        className="bg-[#090b0d] border border-[#2b2e30] text-white p-1.5 rounded-xs"
                      />
                      <input
                        type="text"
                        placeholder="Role (e.g. Developer, Designer)"
                        value={adminMemRole}
                        onChange={(e) => setAdminMemRole(e.target.value)}
                        className="bg-[#090b0d] border border-[#2b2e30] text-[#f4c151] p-1.5 rounded-xs"
                      />
                      <input
                        type="text"
                        placeholder="GitHub Handle (e.g. octocat)"
                        value={adminMemGithub}
                        onChange={(e) => setAdminMemGithub(e.target.value)}
                        className="bg-[#090b0d] border border-[#2b2e30] text-[#cfe8ff] p-1.5 rounded-xs font-mono"
                      />
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={adminMemIsIemUem}
                            onChange={(e) => setAdminMemIsIemUem(e.target.checked)}
                          />
                          <span className="text-[#86efac]">IEM/UEM Student</span>
                        </label>
                        {adminMemIsIemUem && (
                          <input
                            type="text"
                            placeholder="Enrollment No."
                            value={adminMemEnrollment}
                            onChange={(e) => setAdminMemEnrollment(e.target.value)}
                            className="bg-[#090b0d] border border-[#254225] text-[#86efac] p-1.5 rounded-xs grow font-mono"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAdminAddMemberForm(false)}
                        className="px-2.5 py-1 bg-[#1a1b1d] border border-[#2b2e30] text-[#8f9396] rounded-xs cursor-pointer"
                      >
                        CANCEL
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-[#1e4620] border border-[#4ade80] text-[#86efac] font-pixel text-[8px] rounded-xs cursor-pointer"
                      >
                        SAVE &amp; ADD MEMBER
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedTeamModal.members.map((m, idx) => {
                    const memberPassId = m.memberPassId || `COG26-M${String(selectedTeamModal.id).slice(-3)}-${idx + 1}`;
                    const qrContent = `COGNITIA-2026-PASS-MEMBER:${memberPassId}:${selectedTeamModal.id}:${m.name}:${m.enrollmentNo || 'N/A'}`;
                    const memberQrUrl = m.memberQrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrContent)}`;

                    return (
                      <div key={m.id || idx} className="p-2.5 bg-[#141618] border border-[#2b2e30] rounded-xs font-sans text-xs space-y-1.5 relative">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#cfe8ff] text-sm flex items-center gap-1">
                            {m.name}
                            {m.isLead && <span className="text-[#f2933d] font-silkscreen text-[8px] px-1 py-0.5 bg-[#241d14] border border-[#423325] rounded-xs">(LEAD)</span>}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#4ade80] font-mono text-[8.5px] bg-[#142417] px-1.5 py-0.5 rounded-xs border border-[#25522b] font-bold">
                              {memberPassId}
                            </span>
                            {!m.isLead && (
                              <button
                                type="button"
                                onClick={() => handleAdminRemoveMember(m.id || memberPassId)}
                                className="text-[#eb5147] hover:text-white p-0.5 cursor-pointer"
                                title="Remove Member (Admin)"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5 font-silkscreen text-[8px] text-[#8f9396] grow">
                            {m.email && <p className="text-[#cfe8ff] flex items-center gap-1"><Mail size={9} className="text-[#6fb3d9]" /> {m.email}</p>}
                            {m.phone && <p className="text-[#cfe8ff] flex items-center gap-1"><Phone size={9} className="text-[#a7d38a]" /> {m.phone}</p>}
                            {m.githubId && <p className="text-[#6fb3d9] font-mono flex items-center gap-1"><Github size={9} /> @{m.githubId}</p>}
                            {m.isIemUemStudent ? (
                              <div className="pt-0.5 space-y-1">
                                <p className="text-[#86efac] font-mono flex items-center gap-1 font-bold">
                                  🎓 ENROLLMENT: {m.enrollmentNo || 'N/A'}
                                </p>
                                {m.iemcrpScreenshotUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      sound.playBlip(500);
                                      setPreviewImageModal({
                                        url: m.iemcrpScreenshotUrl!,
                                        title: `${m.name}'s IEMCRP Student Info Screenshot (Enrollment: ${m.enrollmentNo || 'N/A'})`,
                                      });
                                    }}
                                    className="inline-flex items-center gap-1 bg-[#1e4620] hover:bg-[#275c2a] text-[#86efac] border border-[#34783a] font-silkscreen text-[7.5px] px-1.5 py-0.5 rounded-xs transition-colors cursor-pointer"
                                  >
                                    <Eye size={9} /> 📸 VIEW IEMCRP SCREENSHOT
                                  </button>
                                ) : (
                                  <p className="text-[#f4c151] font-silkscreen text-[7.5px] italic">
                                    ⚠️ IEMCRP Screenshot Pending
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-[#93c5fd] font-mono flex items-center gap-1 pt-0.5">
                                🏫 COLLEGE: {m.collegeName || 'External'}
                              </p>
                            )}

                            {/* Member Attendance Toggle Button */}
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => handleToggleAttendanceStatus(memberPassId, m.checkInStatus)}
                                className={`font-silkscreen text-[7px] px-2 py-0.5 rounded-xs border flex items-center gap-1 cursor-pointer ${m.checkInStatus === 'checked_in'
                                    ? 'bg-[#182418] text-[#a7d38a] border-[#254225]'
                                    : 'bg-[#1c1f24] text-[#8f9396] border-[#2b2e30] hover:text-[#a7d38a]'
                                  }`}
                              >
                                <UserCheck size={9} />
                                {m.checkInStatus === 'checked_in' ? `PRESENT (${m.checkInTimestamp || 'OK'})` : 'MARK MEMBER PRESENT'}
                              </button>
                            </div>
                          </div>

                          {/* Member Unique QR */}
                          <div
                            className="bg-black p-1 rounded-xs border border-[#38bdf8] flex flex-col items-center shrink-0 cursor-pointer group"
                            onClick={() => {
                              sound.playBlip(500);
                              setPreviewImageModal({
                                url: memberQrUrl,
                                title: `Official Member Gate Pass QR - ${m.name} (${memberPassId})`,
                              });
                            }}
                          >
                            <img
                              src={memberQrUrl}
                              alt={`${m.name} Member QR`}
                              className="w-14 h-14 bg-white p-0.5 rounded-xs object-contain group-hover:scale-105 transition-transform"
                            />
                            <span className="font-mono text-[5.5px] text-[#38bdf8] mt-0.5">PASS QR</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* EVENT STAGE 3: TRACK PREFERENCES ORDER */}
              <div className="bg-[#090b0d] border border-[#2b2e30] p-3 rounded-xs space-y-2">
                <div className="flex items-center justify-between border-b border-[#2b2e30] pb-1.5">
                  <span className="font-pixel text-[9px] text-[#f4c151] flex items-center gap-1.5">
                    <Target size={12} /> STAGE 3: TRACK PREFERENCES ORDER
                  </span>
                  <span className={`font-silkscreen text-[7.5px] px-2 py-0.5 rounded-xs border ${selectedTeamModal.isTrackLocked ? 'bg-[#182418] text-[#a7d38a] border-[#254225]' : 'bg-[#241d14] text-[#f2933d] border-[#423325]'
                    }`}>
                    {selectedTeamModal.isTrackLocked ? 'LOCKED & CONFIRMED' : 'UNLOCKED PREFERENCES'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-silkscreen text-[8.5px]">
                  {selectedTeamModal.trackPreferences && selectedTeamModal.trackPreferences.filter(Boolean).length > 0 ? (
                    selectedTeamModal.trackPreferences.filter(Boolean).map((track, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-1.5 bg-[#141618] border border-[#2b2e30] rounded-xs">
                        <span className="font-pixel text-[8px] text-[#f4c151] px-1.5 py-0.5 bg-[#2b2414] rounded-xs border border-[#423325] shrink-0">
                          #{idx + 1} CHOICE
                        </span>
                        <span className="text-[#cfe8ff] font-bold truncate">{track}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[#8f9396] italic col-span-2 p-1 bg-[#141618]">
                      Selected Track: {selectedTeamModal.selectedTrack || 'General Track (No preferences locked)'}
                    </div>
                  )}
                </div>
              </div>

              {/* EVENT STAGE 4: PHASE 2 REGISTRATION FEE (₹200 / IEM-UEM FREE WAIVER) & PASS */}
              <div className="bg-[#090b0d] border border-[#2b2e30] p-3 rounded-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#2b2e30] pb-2">
                  <span className="font-pixel text-[9.5px] text-[#f4c151] flex items-center gap-1.5">
                    <Ticket size={13} /> STAGE 4: PHASE 2 REGISTRATION FEE &amp; PASS
                  </span>
                  <span className={`font-silkscreen text-[8px] px-2 py-0.5 rounded-xs border ${selectedTeamModal.phase2PaymentStatus === 'payment_verified' || selectedTeamModal.paymentStatus === 'payment_verified'
                      ? 'bg-[#182418] text-[#a7d38a] border-[#254225]'
                      : selectedTeamModal.phase2PaymentStatus === 'payment_pending' || selectedTeamModal.paymentStatus === 'payment_pending'
                        ? 'bg-[#241d14] text-[#f2933d] border-[#423325]'
                        : 'bg-[#241818] text-[#eb5147] border-[#422525]'
                    }`}>
                    {selectedTeamModal.phase2PaymentStatus === 'payment_verified' || selectedTeamModal.paymentStatus === 'payment_verified'
                      ? 'OFFLINE PASS ISSUED'
                      : selectedTeamModal.phase2PaymentStatus === 'payment_pending' || selectedTeamModal.paymentStatus === 'payment_pending'
                        ? 'PENDING VERIFICATION'
                        : 'UNPAID'}
                  </span>
                </div>

                {/* UTR / Ref ID */}
                {(selectedTeamModal.phase2PaymentTransactionId || selectedTeamModal.paymentTransactionId) ? (
                  <div className="p-2 bg-[#141618] border border-[#2b2e30] rounded-xs font-mono text-xs text-[#86efac] flex items-center justify-between">
                    <span>PHASE 2 PAYMENT UTR / REF ID:</span>
                    <span className="font-bold text-white">{selectedTeamModal.phase2PaymentTransactionId || selectedTeamModal.paymentTransactionId}</span>
                  </div>
                ) : (
                  <div className="p-1.5 bg-[#141618] border border-[#2b2e30] rounded-xs font-silkscreen text-[8px] text-[#7d8285]">
                    No Phase 2 UTR / Ref ID submitted yet.
                  </div>
                )}

                {/* Payment Receipt */}
                {(selectedTeamModal.phase2PaymentScreenshotUrl || selectedTeamModal.paymentScreenshotUrl) && (
                  <div className="space-y-1">
                    <span className="font-silkscreen text-[8px] text-[#86efac] block">PHASE 2 SUBMITTED RECEIPT:</span>
                    <div
                      className="relative group border border-[#2b2e30] rounded-xs overflow-hidden h-40 bg-black cursor-pointer"
                      onClick={() => {
                        sound.playBlip(500);
                        const url = selectedTeamModal.phase2PaymentScreenshotUrl || selectedTeamModal.paymentScreenshotUrl!;
                        setPreviewImageModal({
                          url,
                          title: `Phase 2 Payment Receipt - ${selectedTeamModal.teamName}`,
                        });
                      }}
                    >
                      <img
                        src={selectedTeamModal.phase2PaymentScreenshotUrl || selectedTeamModal.paymentScreenshotUrl}
                        alt="Phase 2 Payment Receipt"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-silkscreen text-[#86efac] gap-1 transition-opacity">
                        <Eye size={13} /> CLICK TO ZOOM RECEIPT
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <span className="font-silkscreen text-[8px] text-[#8f9396] shrink-0">SET PHASE 2 STATUS:</span>
                  <select
                    value={selectedTeamModal.phase2PaymentStatus || selectedTeamModal.paymentStatus || 'unpaid'}
                    onChange={(e) => handlePhase2PaymentStatusChange(selectedTeamModal.id, e.target.value as Phase2PaymentStatus)}
                    className="font-pixel text-[8.5px] bg-[#1c1f24] border border-[#3a4149] text-[#f4c151] px-2 py-1.5 rounded-xs w-full cursor-pointer"
                  >
                    <option value="unpaid">MARK PHASE 2: UNPAID</option>
                    <option value="payment_pending">MARK PHASE 2: PENDING VERIFICATION</option>
                    <option value="payment_verified">MARK PHASE 2: VERIFIED &amp; ISSUE TICKET PASS</option>
                  </select>
                </div>

                {selectedTeamModal.ticketPassId && (
                  <div className="p-2 bg-[#182418] border border-[#254225] text-[#a7d38a] font-silkscreen text-[8.5px] text-center rounded-xs">
                    OFFICIAL TICKET PASS ID: <span className="font-mono text-white font-bold">{selectedTeamModal.ticketPassId}</span>
                  </div>
                )}
              </div>

              {/* EVENT STAGE 8: VENUE ATTENDANCE & GATE CHECK-IN CONTROL */}
              <div className="flex items-center justify-between bg-[#090b0d] border border-[#254225] p-2.5 rounded-xs">
                <div>
                  <span className="font-pixel text-[9px] text-[#a7d38a] block">STAGE 8: VENUE GATE CHECK-IN CONTROL</span>
                  <span className="font-silkscreen text-[8px] text-[#8f9396]">
                    Status: {selectedTeamModal.attendanceStatus === 'checked_in' ? `Checked in at ${selectedTeamModal.checkInTimestamp || 'Venue'}` : 'Not Checked In'}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleAttendanceStatus(selectedTeamModal.id, selectedTeamModal.attendanceStatus)}
                  className={`font-pixel text-[8px] px-2.5 py-1 rounded-xs border cursor-pointer ${selectedTeamModal.attendanceStatus === 'checked_in'
                      ? 'bg-[#182418] text-[#a7d38a] border-[#254225]'
                      : 'bg-[#1c1f24] text-[#8f9396] border-[#2b2e30] hover:text-[#a7d38a]'
                    }`}
                >
                  {selectedTeamModal.attendanceStatus === 'checked_in' ? 'TOGGLE ABSENT' : 'MARK PRESENT AT VENUE'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL: INSERT NEW TEAM CREDENTIALS */}
      {showAddTeamModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#0c0e10] border-2 border-[#34783a] rounded-md max-w-lg w-full p-4 sm:p-5 space-y-4 shadow-[0_0_30px_rgba(52,120,58,0.4)]">
              <div className="flex items-center justify-between border-b border-[#254225] pb-2">
                <span className="font-pixel text-[11px] text-[#86efac] flex items-center gap-1.5">
                  <Sparkles size={14} /> INSERT PHASE 2 TEAM CREDENTIALS
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="text-[#8f9396] hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAdminCreateTeamSubmit} className="space-y-3 font-silkscreen text-[10px]">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#cfe8ff]">UNIQUE TEAM ID (TID) *</label>
                    <button
                      type="button"
                      onClick={() => setNewTeamId(generateNextTeamId())}
                      className="text-[#86efac] hover:underline text-[8.5px]"
                    >
                      [ 🎲 New ID ]
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. COG26-T105"
                    value={newTeamId}
                    onChange={(e) => setNewTeamId(e.target.value)}
                    className="w-full bg-[#141618] border border-[#34783a] text-[#86efac] font-mono text-xs px-3 py-1.5 rounded-xs focus:border-[#4ade80] focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[#cfe8ff] mb-1">TEAM NAME *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cyber Spiders"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full bg-[#141618] border border-[#2b2e30] text-white font-mono text-xs px-3 py-1.5 rounded-xs focus:border-[#4ade80] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#cfe8ff] mb-1">TEAM LEAD NAME *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Peter Parker"
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    className="w-full bg-[#141618] border border-[#2b2e30] text-white font-mono text-xs px-3 py-1.5 rounded-xs focus:border-[#4ade80] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#cfe8ff] mb-1">LEAD EMAIL ADDRESS (LOGIN ID) *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. peter@gmail.com"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    className="w-full bg-[#141618] border border-[#2b2e30] text-[#6fb3d9] font-mono text-xs px-3 py-1.5 rounded-xs focus:border-[#4ade80] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#cfe8ff] mb-1">LEAD PHONE NUMBER</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    className="w-full bg-[#141618] border border-[#2b2e30] text-white font-mono text-xs px-3 py-1.5 rounded-xs focus:border-[#4ade80] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[#cfe8ff]">LOGIN PASSWORD *</label>
                    <button
                      type="button"
                      onClick={() => setNewPassword(generateRandomPassword())}
                      className="text-[#f4c151] hover:underline text-[8.5px]"
                    >
                      [ 🎲 Generate Random Password ]
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#141618] border border-[#f4c151] text-[#f4c151] font-mono text-xs px-3 py-1.5 rounded-xs focus:border-[#4ade80] focus:outline-none font-bold"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTeamModal(false)}
                    className="bg-[#1c1f24] text-[#8f9396] font-pixel text-[9px] px-3 py-1.5 rounded-xs border border-[#2b2e30]"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="bg-[#1e4620] hover:bg-[#275c2a] text-[#86efac] border border-[#4ade80] font-pixel text-[9px] px-4 py-1.5 rounded-xs shadow-[2px_2px_0_0_#000] cursor-pointer"
                  >
                    ➕ SAVE CREDENTIALS &amp; ENROLL TEAM
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL: VIEW / COPY CREDENTIALS EMAIL TEMPLATE */}
      {createdCredentialsModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#0c0e10] border-2 border-[#f4c151] rounded-md max-w-xl w-full p-4 sm:p-5 space-y-3 shadow-[0_0_30px_rgba(244,193,81,0.3)]">
              <div className="flex items-center justify-between border-b border-[#423325] pb-2">
                <span className="font-pixel text-[11px] text-[#f4c151] flex items-center gap-1.5">
                  <Sparkles size={14} /> TEAM LOGIN CREDENTIALS &amp; EMAIL TEMPLATE
                </span>
                <button
                  type="button"
                  onClick={() => setCreatedCredentialsModal(null)}
                  className="text-[#8f9396] hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-2.5 bg-[#141618] border border-[#2b2e30] rounded-xs font-mono text-xs text-[#cfe8ff] space-y-1">
                {createdCredentialsModal.teamId && (
                  <p>Team ID (TID): <strong className="text-[#86efac]">{createdCredentialsModal.teamId}</strong></p>
                )}
                <p>Team Name: <strong className="text-white">{createdCredentialsModal.teamName}</strong></p>
                <p>Lead Email: <strong className="text-[#6fb3d9]">{createdCredentialsModal.leadEmail}</strong></p>
                <p>Password: <strong className="text-[#f4c151] bg-black px-2 py-0.5 border border-[#423325] rounded-xs">{createdCredentialsModal.password}</strong></p>
              </div>

              <div className="space-y-1">
                <label className="font-silkscreen text-[9px] text-[#8f9396] block">
                  READY-TO-SEND EMAIL TEMPLATE FOR TEAM LEAD:
                </label>
                <textarea
                  readOnly
                  rows={10}
                  value={getEmailTemplateText(
                    createdCredentialsModal.teamName,
                    createdCredentialsModal.leadName,
                    createdCredentialsModal.leadEmail,
                    createdCredentialsModal.password,
                    createdCredentialsModal.teamId
                  )}
                  className="w-full bg-[#07090b] border border-[#2b2e30] text-[#a7d38a] font-mono text-[10px] p-3 rounded-xs focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                {copiedTemplate ? (
                  <span className="text-[#86efac] font-silkscreen text-[9px] flex items-center gap-1">
                    <CheckCircle2 size={12} /> COPIED TO CLIPBOARD!
                  </span>
                ) : (
                  <span className="text-[#8f9396] font-silkscreen text-[8px]">
                    Click below to copy full email to clipboard
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const fullText = getEmailTemplateText(
                        createdCredentialsModal.teamName,
                        createdCredentialsModal.leadName,
                        createdCredentialsModal.leadEmail,
                        createdCredentialsModal.password,
                        createdCredentialsModal.teamId
                      );
                      const bodyIndex = fullText.indexOf('\n\n');
                      const body = fullText.slice(bodyIndex + 2);
                      const mailtoUrl = `mailto:${encodeURIComponent(createdCredentialsModal.leadEmail)}?subject=${encodeURIComponent('Cognitia 2026 - Phase 2 Team Credentials')}&body=${encodeURIComponent(body)}`;
                      window.open(mailtoUrl, '_blank');
                    }}
                    className="bg-[#1c1f24] hover:bg-[#282d35] text-[#6fb3d9] border border-[#38bdf8] font-pixel text-[8.5px] px-3 py-2 rounded-xs cursor-pointer flex items-center gap-1"
                  >
                    <Mail size={12} /> 📧 MAIL LEAD
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const text = getEmailTemplateText(
                        createdCredentialsModal.teamName,
                        createdCredentialsModal.leadName,
                        createdCredentialsModal.leadEmail,
                        createdCredentialsModal.password,
                        createdCredentialsModal.teamId
                      );
                      navigator.clipboard.writeText(text);
                      sound.playBoot();
                      setCopiedTemplate(true);
                      setTimeout(() => setCopiedTemplate(false), 3000);
                    }}
                    className="bg-[#1e4620] hover:bg-[#275c2a] text-[#86efac] border border-[#4ade80] font-pixel text-[9.5px] px-4 py-2 rounded-xs shadow-[2px_2px_0_0_#000] cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={13} /> [ 📋 COPY EMAIL TEMPLATE ]
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Footer */}
      <div className="pt-2 border-t border-[#26282a] flex items-center justify-between text-[8px] font-silkscreen text-[#7d8285]">
        <span>COGNITIA ATTENDANCE &amp; TICKETING CONTROL</span>
        <span className="text-[#a7d38a]">COGNITIA 2026 ADMIN</span>
      </div>

      {/* LIGHTBOX FULL RESOLUTION IMAGE INSPECTOR */}
      {previewImageModal &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setPreviewImageModal(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] w-full bg-[#0a0c0e] border-2 border-[#f4c151] rounded-md p-3 sm:p-4 flex flex-col space-y-2 shadow-[0_0_40px_rgba(0,0,0,0.9)] cursor-default"
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

      {/* INTERACTIVE VENUE ATTENDANCE VERIFICATION POPUP MODAL */}
      {attendanceModalData &&
        createPortal(
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
            <div className="bg-[#0c0e11] border-2 border-[#4ade80] rounded-md max-w-lg w-full p-4 space-y-4 shadow-[0_0_40px_rgba(74,222,128,0.4)] font-sans">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#25522b] pb-2.5">
                <div className="flex items-center gap-2 text-[#4ade80]">
                  <UserCheck size={22} className="text-[#4ade80]" />
                  <span className="font-pixel text-[12px] sm:text-[14px] text-[#4ade80]">
                    GATE ATTENDANCE VERIFICATION
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttendanceModalData(null)}
                  className="text-[#8f9396] hover:text-white cursor-pointer p-1"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Participant & Team Info Card */}
              <div className="bg-[#142417] border border-[#25522b] p-3.5 rounded-xs space-y-2.5">
                <div className="flex items-center justify-between font-silkscreen text-[9px]">
                  <span className="text-[#86efac] font-bold">
                    TEAM ID: {attendanceModalData.matchedTeam.id}
                  </span>
                  <span className="bg-[#1e4620] text-[#86efac] border border-[#34783a] px-2 py-0.5 rounded-xs">
                    PASS: {attendanceModalData.matchedMember?.memberPassId || attendanceModalData.matchedTeam.ticketPassId || 'N/A'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-pixel text-[13px] sm:text-[14px] text-white">
                    {attendanceModalData.matchedMember
                      ? `${attendanceModalData.matchedMember.name} (${attendanceModalData.matchedMember.role})`
                      : `TEAM: ${attendanceModalData.matchedTeam.teamName} (ALL MEMBERS)`}
                  </h3>
                  <p className="font-silkscreen text-[10px] text-[#cfe8ff]">
                    TEAM NAME: <strong className="text-[#f4c151]">{attendanceModalData.matchedTeam.teamName}</strong>
                  </p>
                  {attendanceModalData.matchedMember && (
                    <div className="space-y-0.5 font-silkscreen text-[9px] text-[#bbf7d0]">
                      <p>INSTITUTION: {attendanceModalData.matchedMember.isIemUemStudent ? `IEM / UEM (Roll: ${attendanceModalData.matchedMember.enrollmentNo || 'N/A'})` : attendanceModalData.matchedMember.collegeName || 'External'}</p>
                      {attendanceModalData.matchedMember.email && <p className="text-[#93c5fd]">EMAIL: {attendanceModalData.matchedMember.email}</p>}
                      {attendanceModalData.matchedMember.phone && <p className="text-[#93c5fd]">PHONE: {attendanceModalData.matchedMember.phone}</p>}
                    </div>
                  )}
                </div>

                {/* Current Status Indicator */}
                <div className="pt-2 border-t border-[#25522b] flex items-center justify-between font-silkscreen text-[9.5px]">
                  <span className="text-[#8fa892]">CURRENT GATE STATUS:</span>
                  {(attendanceModalData.matchedMember ? attendanceModalData.matchedMember.checkInStatus === 'checked_in' : attendanceModalData.matchedTeam.attendanceStatus === 'checked_in') ? (
                    <span className="bg-[#1e4620] text-[#4ade80] border border-[#34783a] px-2.5 py-1 rounded-xs flex items-center gap-1 font-bold shadow-[0_0_10px_rgba(74,222,128,0.3)]">
                      <CheckCircle2 size={13} /> PRESENT AT VENUE
                    </span>
                  ) : (
                    <span className="bg-[#382b18] text-[#f4c151] border border-[#594424] px-2.5 py-1 rounded-xs flex items-center gap-1 font-bold">
                      <Clock size={13} /> NOT CHECKED IN (ABSENT)
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    const query = attendanceModalData.matchedMember?.memberPassId || attendanceModalData.matchedTeam.id;
                    const res = await firebaseService.markAttendance(query, 'checked_in');
                    if (res.success && res.team) {
                      sound.playBoot();
                      loadAdminData();
                      setAttendanceModalData({
                        ...attendanceModalData,
                        matchedTeam: res.team,
                        matchedMember: res.matchedMember || attendanceModalData.matchedMember,
                      });
                    }
                  }}
                  className="bg-[#182418] hover:bg-[#203820] text-[#4ade80] border-2 border-[#25522b] hover:border-[#4ade80] font-pixel text-[10.5px] uppercase py-2.5 px-3 rounded-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#000]"
                >
                  <UserCheck size={14} /> MARK PRESENT
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const query = attendanceModalData.matchedMember?.memberPassId || attendanceModalData.matchedTeam.id;
                    const res = await firebaseService.markAttendance(query, 'not_checked_in');
                    if (res.success && res.team) {
                      sound.playBlip(300);
                      loadAdminData();
                      setAttendanceModalData({
                        ...attendanceModalData,
                        matchedTeam: res.team,
                        matchedMember: res.matchedMember || attendanceModalData.matchedMember,
                      });
                    }
                  }}
                  className="bg-[#261414] hover:bg-[#3d1d1d] text-[#eb5147] border-2 border-[#522525] hover:border-[#eb5147] font-pixel text-[10.5px] uppercase py-2.5 px-3 rounded-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-[2px_2px_0_0_#000]"
                >
                  <X size={14} /> MARK ABSENT
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-[#25522b] pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTeamModal(attendanceModalData.matchedTeam);
                    setAttendanceModalData(null);
                  }}
                  className="text-[#6fb3d9] hover:underline font-pixel text-[9px] cursor-pointer flex items-center gap-1"
                >
                  <Eye size={12} /> INSPECT TEAM DETAILS
                </button>

                <button
                  type="button"
                  onClick={() => setAttendanceModalData(null)}
                  className="bg-[#1c1f24] hover:bg-[#2b2e35] text-white border border-[#3a4149] font-pixel text-[9px] px-3 py-1.5 rounded-xs cursor-pointer"
                >
                  CLOSE / SCAN NEXT
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* LIVE QR CAMERA SCANNER MODAL */}
      {showLiveScannerModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
            <div className="bg-[#0a0c0e] border-2 border-[#00f0ff] rounded-md max-w-md w-full p-4 space-y-3 shadow-[0_0_40px_rgba(0,240,255,0.4)]">
              <div className="flex items-center justify-between border-b border-[#2b2e30] pb-2">
                <span className="font-pixel text-[12px] text-[#00f0ff] flex items-center gap-2">
                  <Camera size={18} /> LIVE CAMERA QR SCANNER
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="Switch Front/Rear Camera"
                    onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                    className="text-[#8f9396] hover:text-[#00f0ff] p-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLiveScannerModal(false)}
                    className="text-[#8f9396] hover:text-white cursor-pointer p-1"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#141618] border border-[#2b2e30] rounded-xs text-center space-y-2">
                <span className="font-silkscreen text-[9.5px] text-[#8f9396] block">
                  POINT DEVICE CAMERA AT PARTICIPANT TICKET PASS OR MEMBER QR CODE
                </span>

                <div className="relative w-full h-56 bg-black border-2 border-dashed border-[#00f0ff] rounded-xs flex items-center justify-center overflow-hidden">
                  {cameraError ? (
                    <div className="p-4 text-center space-y-2 font-silkscreen text-[9.5px] text-[#fca5a5]">
                      <AlertTriangle size={28} className="mx-auto text-[#eb5147]" />
                      <p className="leading-relaxed">{cameraError}</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 bg-[#1c2836] border border-[#00f0ff] text-[#00f0ff] font-pixel text-[9px] px-3 py-1.5 rounded-xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Upload size={13} /> UPLOAD QR IMAGE INSTEAD
                      </button>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {!isCameraActive && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 font-pixel text-[10px] text-[#00f0ff]">
                          <Camera size={32} className="animate-bounce" />
                          <span>INITIALIZING CAMERA FEED...</span>
                        </div>
                      )}
                      {isCameraActive && (
                        <>
                          <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-0.5 bg-[#00f0ff] shadow-[0_0_12px_#00f0ff] animate-pulse" />
                          <div className="absolute bottom-2 right-2 bg-black/70 border border-[#00f0ff]/40 text-[#00f0ff] font-silkscreen text-[8px] px-2 py-0.5 rounded-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-ping" /> LIVE SCANNING
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Hidden file input for QR upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUploadQR}
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-[#182330] hover:bg-[#203042] text-[#00f0ff] border border-[#00f0ff]/40 font-pixel text-[9px] py-2 rounded-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload size={13} /> UPLOAD QR PHOTO FROM DEVICE
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAttendanceScanSubmit(e);
                }}
                className="space-y-2"
              >
                <label className="font-silkscreen text-[8.5px] text-[#8f9396] block">
                  MANUAL / SCANNER INPUT FALLBACK:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Paste/scan QR string or enter Pass ID..."
                    value={scanQuery}
                    onChange={(e) => setScanQuery(e.target.value)}
                    className="grow bg-[#0c0e10] border border-[#2b2e30] text-[#00f0ff] font-mono text-xs px-3 py-1.5 rounded-xs focus:border-[#00f0ff] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-[#1c2836] border border-[#00f0ff] text-[#00f0ff] font-pixel text-[9px] px-3 py-1.5 rounded-xs cursor-pointer"
                  >
                    VERIFY
                  </button>
                </div>
              </form>

              <button
                type="button"
                onClick={() => setShowLiveScannerModal(false)}
                className="w-full bg-[#1c1f24] hover:bg-[#282d34] text-[#8f9396] border border-[#3a4149] font-pixel text-[9px] py-2 rounded-xs cursor-pointer"
              >
                CANCEL &amp; CLOSE SCANNER
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* INTERACTIVE FOOD COUPON VERIFICATION & REDEMPTION MODAL */}
      {foodCouponModalData &&
        createPortal(
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
            <div className={`bg-[#0c0e11] border-2 rounded-md max-w-lg w-full p-4 space-y-4 shadow-[0_0_40px_rgba(74,222,128,0.4)] font-sans ${foodCouponModalData.alreadyRedeemed ? 'border-[#eb5147]' : 'border-[#4ade80]'}`}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#2b2e30] pb-2.5">
                <div className="flex items-center gap-2 text-[#4ade80]">
                  <Utensils size={22} className={foodCouponModalData.alreadyRedeemed ? 'text-[#eb5147]' : 'text-[#4ade80]'} />
                  <span className={`font-pixel text-[12px] sm:text-[14px] ${foodCouponModalData.alreadyRedeemed ? 'text-[#eb5147]' : 'text-[#4ade80]'}`}>
                    FOOD COUPON VALIDATION &bull; {foodCouponModalData.mealType.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFoodCouponModalData(null)}
                  className="text-[#8f9396] hover:text-white cursor-pointer p-1"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Already Redeemed Alert Banner */}
              {foodCouponModalData.alreadyRedeemed ? (
                <div className="bg-[#261414] border-2 border-[#522525] p-3 rounded-xs text-center space-y-1 font-silkscreen text-[9.5px] text-[#fca5a5]">
                  <AlertTriangle size={24} className="mx-auto text-[#eb5147]" />
                  <p className="font-bold text-[11px] text-[#eb5147]">🛑 MEAL ALREADY SERVED &amp; REDEEMED!</p>
                  <p>This coupon was previously redeemed on: <span className="font-mono text-white font-bold">{foodCouponModalData.redeemedAt || 'Earlier Session'}</span></p>
                  <p className="text-[8px] text-[#8f9396]">Duplicate meal claim blocked by Cognitia Catering Audit.</p>
                </div>
              ) : (
                <div className="bg-[#142417] border border-[#25522b] p-3 rounded-xs text-center space-y-1 font-silkscreen text-[9.5px] text-[#86efac]">
                  <CheckCircle2 size={24} className="mx-auto text-[#4ade80]" />
                  <p className="font-bold text-[11px] text-[#4ade80]">VALID MEAL COUPON VERIFIED ✓</p>
                  <p>Participant is checked in at venue and eligible for <strong className="text-white uppercase font-bold">{foodCouponModalData.mealType.replace('_', ' ')}</strong>.</p>
                </div>
              )}

              {/* Participant & Team Info Card */}
              <div className="bg-[#141618] border border-[#2b2e30] p-3.5 rounded-xs space-y-2.5">
                <div className="flex items-center justify-between font-silkscreen text-[9px]">
                  <span className="text-[#6fb3d9] font-bold">
                    TEAM ID: {foodCouponModalData.matchedTeam.id}
                  </span>
                  <span className="bg-[#1c2836] text-[#00f0ff] border border-[#00f0ff]/40 px-2 py-0.5 rounded-xs font-mono font-bold">
                    PASS: {foodCouponModalData.passId}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-pixel text-[13px] sm:text-[14px] text-white">
                    {foodCouponModalData.matchedMember
                      ? `${foodCouponModalData.matchedMember.name} (${foodCouponModalData.matchedMember.role})`
                      : `TEAM: ${foodCouponModalData.matchedTeam.teamName} (FULL TEAM PASS)`}
                  </h3>
                  <p className="font-silkscreen text-[10px] text-[#cfe8ff]">
                    TEAM NAME: <strong className="text-[#f4c151]">{foodCouponModalData.matchedTeam.teamName}</strong>
                  </p>
                  {foodCouponModalData.matchedMember && (
                    <div className="space-y-0.5 font-silkscreen text-[9px] text-[#bbf7d0]">
                      <p>COLLEGE / INSTITUTION: {foodCouponModalData.matchedMember.isIemUemStudent ? `IEM / UEM (Roll: ${foodCouponModalData.matchedMember.enrollmentNo || 'N/A'})` : foodCouponModalData.matchedMember.collegeName || 'External'}</p>
                      {foodCouponModalData.matchedMember.email && <p className="text-[#93c5fd]">EMAIL: {foodCouponModalData.matchedMember.email}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {!foodCouponModalData.alreadyRedeemed ? (
                  <button
                    type="button"
                    onClick={async () => {
                      sound.playBoot();
                      const res = await firebaseService.markMealRedeemed(
                        foodCouponModalData.passId,
                        foodCouponModalData.mealType
                      );
                      if (res.success && res.team) {
                        loadAdminData();
                        setFoodCouponModalData({
                          ...foodCouponModalData,
                          alreadyRedeemed: true,
                          redeemedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        });
                      } else if (res.message) {
                        alert(res.message);
                      }
                    }}
                    className="w-full bg-[#182418] hover:bg-[#203820] text-[#4ade80] border-2 border-[#25522b] hover:border-[#4ade80] font-pixel text-[11px] uppercase py-3 px-3 rounded-xs cursor-pointer flex items-center justify-center gap-2 shadow-[2px_2px_0_0_#000]"
                  >
                    <Utensils size={16} /> CONFIRM &amp; MARK MEAL SERVED
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setFoodCouponModalData(null)}
                  className="w-full bg-[#1c1f24] hover:bg-[#2b2e35] text-white border border-[#3a4149] font-pixel text-[9.5px] py-2 rounded-xs cursor-pointer"
                >
                  CLOSE / SCAN NEXT COUPON
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
