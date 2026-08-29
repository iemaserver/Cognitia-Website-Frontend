import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { TeamRegistration, Phase2SelectionStatus, Phase2PaymentStatus, AttendanceStatus } from '../../types';
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

  // Attendance Scanner Bar State
  const [scanQuery, setScanQuery] = useState<string>('');
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const authSession = sessionStorage.getItem('cognitia_admin_auth');
    if (authSession === 'true') {
      setIsAuthenticated(true);
      loadAdminData();
    }
  }, []);

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
      setLoginError('Invalid admin credentials. Access denied.');
    }
  };

  const handleAdminLogout = () => {
    sound.playBlip(400);
    setIsAuthenticated(false);
    sessionStorage.removeItem('cognitia_admin_auth');
  };

  const handlePhase2StatusChange = async (teamId: string, newStatus: Phase2SelectionStatus) => {
    const team = teams.find((t) => t.id === teamId);
    if (newStatus === 'selected' && team) {
      if (!team.submission || !team.submission.projectTitle) {
        sound.playBlip(300);
        alert(`❌ CANNOT SELECT FOR PHASE 2:\n\nTeam '${team.teamName}' has not submitted Phase 1 Project Deliverables yet.`);
        return;
      }
    }
    sound.playBlip(600);
    await firebaseService.updatePhase2Selection(teamId, newStatus);
    loadAdminData();
    if (selectedTeamModal && selectedTeamModal.id === teamId) {
      setSelectedTeamModal({ ...selectedTeamModal, phase2Status: newStatus });
    }
  };

  const handlePhase1PaymentStatusChange = async (teamId: string, newStatus: Phase2PaymentStatus) => {
    const team = teams.find((t) => t.id === teamId);
    if (newStatus === 'payment_verified' && team) {
      const hasProof = team.paymentTransactionId || (team.paymentScreenshotUrl && !team.paymentScreenshotUrl.includes('placeholder'));
      if (!hasProof) {
        sound.playBlip(300);
        alert(`❌ CANNOT VERIFY PHASE 1 PAYMENT:\n\nTeam '${team.teamName}' has not submitted Phase 1 payment details (UTR ID or receipt screenshot) yet.`);
        return;
      }
    }
    sound.playBoot();
    const res = await firebaseService.updatePhase1PaymentStatus(teamId, newStatus);
    if (res.success && res.team) {
      loadAdminData();
      if (selectedTeamModal && selectedTeamModal.id === teamId) {
        setSelectedTeamModal(res.team);
      }
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
  const handleAttendanceScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScanMessage(null);

    if (!scanQuery.trim()) {
      setScanMessage({ type: 'error', text: 'Please scan or enter a Pass Ticket ID or Team ID.' });
      return;
    }

    const res = await firebaseService.markAttendance(scanQuery, 'checked_in');
    if (res.success && res.team) {
      sound.playBoot();
      loadAdminData();
      setScanMessage({
        type: 'success',
        text: `✓ ATTENDANCE MARKED PRESENT: Team '${res.team.teamName}' (${res.team.ticketPassId || res.team.id})`,
      });
      setScanQuery('');
    } else {
      sound.playBlip(300);
      setScanMessage({ type: 'error', text: res.message || 'Verification failed.' });
    }
  };

  const handleToggleAttendanceStatus = async (teamId: string, currentStatus?: AttendanceStatus) => {
    sound.playBlip(500);
    const nextStatus: AttendanceStatus = currentStatus === 'checked_in' ? 'not_checked_in' : 'checked_in';
    const res = await firebaseService.markAttendance(teamId, nextStatus);
    if (res.success) {
      loadAdminData();
      if (selectedTeamModal && selectedTeamModal.id === teamId) {
        setSelectedTeamModal({ ...selectedTeamModal, attendanceStatus: nextStatus });
      }
    }
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
      'Team ID',
      'Team Name',
      'Registered At',
      'Selected Track',
      'Lead Email',
      'Lead Phone',
      'Members Count',
      'Phase 1 Payment Status',
      'Phase 1 UTR Ref ID',
      'Phase 1 Receipt Screenshot URL',
      'Phase 1 Payment Submitted At',
      'Project Submission Status',
      'Project Title',
      'Project Tagline',
      'GitHub Repo URL',
      'Q1 Proposed Solution & Implementation',
      'Q2 Tech Stack & Justification',
      'Q3 Scalable Deployment Strategy',
      'PPT File Name',
      'PPT File URL',
      'Project Screenshots URLs',
      'Phase 2 Selection Status',
      'Phase 2 RSVP Confirmed',
      'Phase 2 Payment Status',
      'Phase 2 UTR Ref ID',
      'Phase 2 Receipt Screenshot URL',
      'Phase 2 Payment Submitted At',
      'Official Ticket Pass ID',
      'Ticket Issued At',
      'Venue Attendance Status',
      'Venue Check-in Timestamp',
      'Member 1 (Lead)',
      'Member 2',
      'Member 3',
      'Member 4',
      'Complete Roster Summary Log',
    ];

    const rows = teams.map((t) => {
      const formatMember = (m: any) => m ? `${m.name} [${m.role}] | Email: ${m.email || 'N/A'} | Phone: ${m.phone || 'N/A'} | GitHub: @${m.githubId}` : 'N/A';
      const m1 = formatMember(t.members[0]);
      const m2 = formatMember(t.members[1]);
      const m3 = formatMember(t.members[2]);
      const m4 = formatMember(t.members[3]);
      const rosterSummary = t.members.map((m, idx) => `[M${idx + 1}] ${m.name} (${m.role}) - Email: ${m.email || 'N/A'}, Phone: ${m.phone || 'N/A'}, GitHub: @${m.githubId}`).join(' ; ');

      return [
        escapeCSV(t.id),
        escapeCSV(t.teamName),
        escapeCSV(t.registeredAt),
        escapeCSV(t.selectedTrack || t.submission?.trackId || 'N/A'),
        escapeCSV(t.leadEmail),
        escapeCSV(t.leadPhone),
        escapeCSV(t.members.length),
        escapeCSV(t.paymentStatus || 'unpaid'),
        escapeCSV(t.paymentTransactionId || 'N/A'),
        escapeCSV(t.paymentScreenshotUrl || 'N/A'),
        escapeCSV(t.paymentSubmittedAt || 'N/A'),
        escapeCSV(t.submission ? 'SUBMITTED' : 'NOT SUBMITTED'),
        escapeCSV(t.submission?.projectTitle || 'N/A'),
        escapeCSV(t.submission?.tagline || 'N/A'),
        escapeCSV(t.submission?.githubRepoUrl || 'N/A'),
        escapeCSV(t.submission?.proposedSolution || 'N/A'),
        escapeCSV(t.submission?.techStackJustification || 'N/A'),
        escapeCSV(t.submission?.deploymentStrategy || 'N/A'),
        escapeCSV(t.submission?.pptFileName || 'N/A'),
        escapeCSV(t.submission?.pptUrl || 'N/A'),
        escapeCSV(t.submission?.screenshots ? t.submission.screenshots.join(' | ') : 'N/A'),
        escapeCSV(t.phase2Status || 'pending'),
        escapeCSV(t.rsvpConfirmed ? 'YES' : 'NO'),
        escapeCSV(t.phase2PaymentStatus || 'unpaid'),
        escapeCSV(t.phase2PaymentTransactionId || 'N/A'),
        escapeCSV(t.phase2PaymentScreenshotUrl || 'N/A'),
        escapeCSV(t.phase2PaymentSubmittedAt || 'N/A'),
        escapeCSV(t.ticketPassId || 'N/A'),
        escapeCSV(t.ticketIssuedAt || 'N/A'),
        escapeCSV(t.attendanceStatus === 'checked_in' ? 'Present' : 'Absent'),
        escapeCSV(t.checkInTimestamp || 'N/A'),
        escapeCSV(m1),
        escapeCSV(m2),
        escapeCSV(m3),
        escapeCSV(m4),
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
            className={`p-2 rounded-xs border font-silkscreen text-[8.5px] flex items-center gap-1.5 ${
              scanMessage.type === 'success'
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

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-[#141618] p-3 border-2 border-[#2b2e30] rounded-md items-center">
        <div className="sm:col-span-8 relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-[#7d8285]" />
          <input
            type="text"
            placeholder="Search teams by name, lead email, ticket pass ID, UTR ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0e10] border border-[#2b2e30] text-[#cfe8ff] font-mono text-xs pl-8 pr-3 py-1.5 rounded-xs focus:border-[#f4c151] focus:outline-none"
          />
        </div>

        <div className="sm:col-span-4 flex items-center justify-end gap-2">
          <span className="font-silkscreen text-[8px] text-[#8f9396] shrink-0">FILTER TRACK:</span>
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
      </div>

      {/* Teams Data Table */}
      <div className="bg-[#141618] border-2 border-[#2b2e30] rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1c1f24] border-b-2 border-[#2b2e30] font-pixel text-[8px] text-[#8f9396] uppercase">
                <th className="p-2.5">Team Name</th>
                <th className="p-2.5">Lead Email</th>
                <th className="p-2.5">P1 Fee (₹50)</th>
                <th className="p-2.5">Phase 2 Eval</th>
                <th className="p-2.5">P2 Fee</th>
                <th className="p-2.5">Venue Attendance</th>
                <th className="p-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2b2e30] font-sans text-xs text-[#cfe8ff]">
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-[#8f9396] font-silkscreen text-[8px]">
                    No registrations or submissions found.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((t) => (
                  <tr key={t.id} className="hover:bg-[#1b1f24]">
                    <td className="p-2 font-semibold text-[#cfe8ff]">
                      {t.teamName}
                      {t.ticketPassId && (
                        <span className="block font-mono text-[9px] text-[#8f9396]">{t.ticketPassId}</span>
                      )}
                    </td>
                    <td className="p-2 text-[#6fb3d9] font-mono">{t.leadEmail}</td>
                    
                    {/* Phase 1 Fee Status */}
                    <td className="p-2">
                      <select
                        value={t.paymentStatus || 'unpaid'}
                        onChange={(e) => handlePhase1PaymentStatusChange(t.id, e.target.value as Phase2PaymentStatus)}
                        className={`font-silkscreen text-[7.5px] px-1.5 py-0.5 rounded-xs border cursor-pointer ${
                          t.paymentStatus === 'payment_verified'
                            ? 'bg-[#182418] text-[#a7d38a] border-[#254225]'
                            : t.paymentStatus === 'payment_pending'
                            ? 'bg-[#241d14] text-[#f2933d] border-[#423325]'
                            : 'bg-[#241818] text-[#eb5147] border-[#422525]'
                        }`}
                      >
                        <option value="unpaid">P1: UNPAID</option>
                        <option value="payment_pending">P1: PENDING</option>
                        <option value="payment_verified">P1: VERIFIED</option>
                      </select>
                    </td>

                    {/* Phase 2 Eval Status */}
                    <td className="p-2">
                      <select
                        value={t.phase2Status || 'pending'}
                        onChange={(e) => handlePhase2StatusChange(t.id, e.target.value as Phase2SelectionStatus)}
                        className={`font-silkscreen text-[7px] px-1.5 py-0.5 rounded-xs border cursor-pointer ${
                          t.phase2Status === 'selected'
                            ? 'bg-[#2b1f3d] text-[#b180ff] border-[#b180ff]'
                            : t.phase2Status === 'waitlisted'
                            ? 'bg-[#241d14] text-[#f2933d] border-[#423325]'
                            : t.phase2Status === 'not_selected'
                            ? 'bg-[#261414] text-[#eb5147] border-[#522525]'
                            : 'bg-[#181b1e] text-[#8f9396] border-[#2b2e30]'
                        }`}
                      >
                        <option value="pending">PENDING EVAL</option>
                        <option value="selected">SELECTED</option>
                        <option value="waitlisted">WAITLISTED</option>
                        <option value="not_selected">NOT SELECTED</option>
                      </select>
                    </td>

                    {/* Phase 2 Fee Status */}
                    <td className="p-2">
                      <select
                        value={t.phase2PaymentStatus || 'unpaid'}
                        onChange={(e) => handlePhase2PaymentStatusChange(t.id, e.target.value as Phase2PaymentStatus)}
                        className={`font-silkscreen text-[7.5px] px-1.5 py-0.5 rounded-xs border cursor-pointer ${
                          t.phase2PaymentStatus === 'payment_verified'
                            ? 'bg-[#182418] text-[#a7d38a] border-[#254225]'
                            : t.phase2PaymentStatus === 'payment_pending'
                            ? 'bg-[#241d14] text-[#f2933d] border-[#423325]'
                            : 'bg-[#241818] text-[#eb5147] border-[#422525]'
                        }`}
                      >
                        <option value="unpaid">P2: UNPAID</option>
                        <option value="payment_pending">P2: PENDING</option>
                        <option value="payment_verified">P2: VERIFIED</option>
                      </select>
                    </td>

                    {/* Attendance Status */}
                    <td className="p-2">
                      <button
                        onClick={() => handleToggleAttendanceStatus(t.id, t.attendanceStatus)}
                        className={`font-silkscreen text-[7px] px-2 py-0.5 rounded-xs border flex items-center gap-1 cursor-pointer ${
                          t.attendanceStatus === 'checked_in'
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
                      <button
                        onClick={() => {
                          sound.playBlip(600);
                          setSelectedTeamModal(t);
                        }}
                        className="bg-[#1e2329] border border-[#3a4149] hover:border-[#f4c151] font-pixel text-[7px] text-[#f4c151] px-2 py-0.5 rounded-xs cursor-pointer"
                      >
                        INSPECT
                      </button>
                    </td>
                  </tr>
                ))
              )}
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
                  <span className={`font-silkscreen text-[7.5px] px-2 py-0.5 rounded-xs border ${
                    selectedTeamModal.isMembersLocked ? 'bg-[#182418] text-[#a7d38a] border-[#254225]' : 'bg-[#241d14] text-[#f2933d] border-[#423325]'
                  }`}>
                    {selectedTeamModal.isMembersLocked ? 'ROSTER LOCKED' : 'ROSTER UNLOCKED'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedTeamModal.members.map((m, idx) => (
                    <div key={m.id || idx} className="p-2.5 bg-[#141618] border border-[#2b2e30] rounded-xs font-sans text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#cfe8ff] text-sm flex items-center gap-1">
                          {m.name}
                          {m.isLead && <span className="text-[#f2933d] font-silkscreen text-[8px] px-1 py-0.5 bg-[#241d14] border border-[#423325] rounded-xs">(LEAD)</span>}
                        </span>
                        <span className="text-[#8f9396] font-silkscreen text-[8px] bg-[#1c1f24] px-1.5 py-0.5 rounded-xs border border-[#2b2e30]">
                          {m.role || 'Member'}
                        </span>
                      </div>
                      
                      <div className="space-y-0.5 font-silkscreen text-[8px] text-[#8f9396] pt-0.5">
                        {m.email && <p className="text-[#cfe8ff] flex items-center gap-1"><Mail size={9} className="text-[#6fb3d9]" /> {m.email}</p>}
                        {m.phone && <p className="text-[#cfe8ff] flex items-center gap-1"><Phone size={9} className="text-[#a7d38a]" /> {m.phone}</p>}
                        {m.githubId && <p className="text-[#6fb3d9] font-mono flex items-center gap-1"><Github size={9} /> @{m.githubId}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* EVENT STAGE 3: TRACK PREFERENCES ORDER */}
              <div className="bg-[#090b0d] border border-[#2b2e30] p-3 rounded-xs space-y-2">
                <div className="flex items-center justify-between border-b border-[#2b2e30] pb-1.5">
                  <span className="font-pixel text-[9px] text-[#f4c151] flex items-center gap-1.5">
                    <Target size={12} /> STAGE 3: TRACK PREFERENCES ORDER
                  </span>
                  <span className={`font-silkscreen text-[7.5px] px-2 py-0.5 rounded-xs border ${
                    selectedTeamModal.isTrackLocked ? 'bg-[#182418] text-[#a7d38a] border-[#254225]' : 'bg-[#241d14] text-[#f2933d] border-[#423325]'
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

              {/* EVENT STAGE 4: PHASE 1 REGISTRATION FEE (₹50) PAYMENT VERIFICATION */}
              <div className="bg-[#090b0d] border border-[#2b2e30] p-3 rounded-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#2b2e30] pb-2">
                  <span className="font-pixel text-[9.5px] text-[#f4c151] flex items-center gap-1.5">
                    <CreditCard size={13} /> STAGE 4: PHASE 1 ENTRY FEE (₹50) VERIFICATION
                  </span>
                  <span className={`font-silkscreen text-[8px] px-2 py-0.5 rounded-xs border ${
                    selectedTeamModal.paymentStatus === 'payment_verified'
                      ? 'bg-[#182418] text-[#a7d38a] border-[#254225]'
                      : selectedTeamModal.paymentStatus === 'payment_pending'
                        ? 'bg-[#241d14] text-[#f2933d] border-[#423325]'
                        : 'bg-[#241818] text-[#eb5147] border-[#422525]'
                  }`}>
                    {selectedTeamModal.paymentStatus === 'payment_verified'
                      ? 'VERIFIED'
                      : selectedTeamModal.paymentStatus === 'payment_pending'
                        ? 'PENDING VERIFICATION'
                        : 'UNPAID'}
                  </span>
                </div>

                {selectedTeamModal.paymentTransactionId && (
                  <div className="p-2 bg-[#141618] border border-[#2b2e30] rounded-xs font-mono text-xs text-[#a7d38a] flex items-center justify-between">
                    <span>PHASE 1 UTR / REF ID:</span>
                    <span className="font-bold text-white">{selectedTeamModal.paymentTransactionId}</span>
                  </div>
                )}

                {selectedTeamModal.paymentScreenshotUrl &&
                  (selectedTeamModal.paymentScreenshotUrl.startsWith('http') || selectedTeamModal.paymentScreenshotUrl.startsWith('data:image')) &&
                  !selectedTeamModal.paymentScreenshotUrl.includes('placeholder') && (
                  <div className="space-y-1">
                    <span className="font-silkscreen text-[8px] text-[#a7d38a] block">PHASE 1 SUBMITTED RECEIPT:</span>
                    <div className="border border-[#2b2e30] rounded-xs overflow-hidden h-40 bg-black">
                      <img src={selectedTeamModal.paymentScreenshotUrl} alt="Phase 1 Payment Receipt" className="w-full h-full object-contain" />
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <span className="font-silkscreen text-[8px] text-[#8f9396] shrink-0">SET PHASE 1 STATUS:</span>
                  <select
                    value={selectedTeamModal.paymentStatus || 'unpaid'}
                    onChange={(e) => handlePhase1PaymentStatusChange(selectedTeamModal.id, e.target.value as Phase2PaymentStatus)}
                    className="font-pixel text-[8.5px] bg-[#1c1f24] border border-[#3a4149] text-[#f4c151] px-2 py-1.5 rounded-xs w-full cursor-pointer"
                  >
                    <option value="unpaid">MARK PHASE 1: UNPAID</option>
                    <option value="payment_pending">MARK PHASE 1: PENDING VERIFICATION</option>
                    <option value="payment_verified">MARK PHASE 1: VERIFIED &amp; CONFIRMED</option>
                  </select>
                </div>
              </div>

              {/* EVENT STAGE 5: PHASE 1 PROJECT DELIVERABLES & EVALUATION */}
              <div className="bg-[#090b0d] border border-[#2b2e30] p-3 rounded-xs space-y-2">
                <span className="font-pixel text-[9px] text-[#a7d38a] uppercase block border-b border-[#2b2e30] pb-1">
                  STAGE 5: PROJECT DELIVERABLES &amp; EVALUATION RESPONSES
                </span>

                {selectedTeamModal.submission ? (
                  <div className="space-y-2 pt-1">
                    <div className="p-2.5 bg-[#141618] border border-[#2b2e30] rounded-xs space-y-1">
                      <p className="font-pixel text-[11px] text-[#f4c151]">{selectedTeamModal.submission.projectTitle}</p>
                      {selectedTeamModal.submission.tagline && (
                        <p className="font-sans text-xs text-[#8f9396] italic">{selectedTeamModal.submission.tagline}</p>
                      )}
                      {selectedTeamModal.submission.githubRepoUrl && (
                        <p className="font-mono text-[9px] text-[#6fb3d9] pt-1">
                          GITHUB REPO: <a href={selectedTeamModal.submission.githubRepoUrl} target="_blank" rel="noopener noreferrer" className="underline">{selectedTeamModal.submission.githubRepoUrl}</a>
                        </p>
                      )}
                    </div>

                    {selectedTeamModal.submission.proposedSolution && (
                      <div className="p-2.5 bg-[#141618] border border-[#2b2e30] rounded-xs space-y-1">
                        <span className="font-pixel text-[8.5px] text-[#f4c151] block">1. PROPOSED SOLUTION &amp; IMPLEMENTATION:</span>
                        <p className="font-sans text-xs text-[#cfe8ff] whitespace-pre-wrap bg-[#090b0d] p-2 rounded-xs border border-[#2b2e30] leading-relaxed">
                          {selectedTeamModal.submission.proposedSolution}
                        </p>
                      </div>
                    )}

                    {selectedTeamModal.submission.techStackJustification && (
                      <div className="p-2.5 bg-[#141618] border border-[#2b2e30] rounded-xs space-y-1">
                        <span className="font-pixel text-[8.5px] text-[#00f0ff] block">2. TECH STACK &amp; JUSTIFICATION:</span>
                        <p className="font-sans text-xs text-[#cfe8ff] whitespace-pre-wrap bg-[#090b0d] p-2 rounded-xs border border-[#2b2e30] leading-relaxed">
                          {selectedTeamModal.submission.techStackJustification}
                        </p>
                      </div>
                    )}

                    {selectedTeamModal.submission.deploymentStrategy && (
                      <div className="p-2.5 bg-[#141618] border border-[#2b2e30] rounded-xs space-y-1">
                        <span className="font-pixel text-[8.5px] text-[#a7d38a] block">3. SCALABLE DEPLOYMENT STRATEGY:</span>
                        <p className="font-sans text-xs text-[#cfe8ff] whitespace-pre-wrap bg-[#090b0d] p-2 rounded-xs border border-[#2b2e30] leading-relaxed">
                          {selectedTeamModal.submission.deploymentStrategy}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-2 bg-[#241d14] border border-[#423325] text-[#f2933d] font-silkscreen text-[8px] text-center rounded-xs">
                    THIS TEAM HAS NOT UPLOADED FINAL PROJECT DELIVERABLES YET.
                  </div>
                )}
              </div>

              {/* EVENT STAGE 6: PHASE 2 SELECTION & RSVP */}
              <div className="flex items-center justify-between bg-[#090b0d] border border-[#2b2e30] p-2.5 rounded-xs">
                <div>
                  <span className="font-pixel text-[9px] text-[#b180ff] block">STAGE 6: PHASE 2 SELECTION STATUS</span>
                  <span className="font-silkscreen text-[8px] text-[#8f9396]">
                    Status: {selectedTeamModal.phase2Status || 'pending'} &bull; RSVP: {selectedTeamModal.rsvpConfirmed ? 'CONFIRMED' : 'NOT CONFIRMED'}
                  </span>
                </div>
                <select
                  value={selectedTeamModal.phase2Status || 'pending'}
                  onChange={(e) => handlePhase2StatusChange(selectedTeamModal.id, e.target.value as Phase2SelectionStatus)}
                  className="font-pixel text-[8px] bg-[#1c1f24] border border-[#3a4149] text-[#b180ff] px-2 py-1 rounded-xs cursor-pointer"
                >
                  <option value="pending">PENDING EVAL</option>
                  <option value="selected">SELECTED FOR PHASE 2</option>
                  <option value="waitlisted">WAITLISTED FOR PHASE 2</option>
                  <option value="not_selected">NOT SELECTED</option>
                </select>
              </div>

              {/* EVENT STAGE 7: PHASE 2 ENTRY FEE (₹500) & TICKET PASS */}
              <div className="bg-[#090b0d] border border-[#2b2e30] p-3 rounded-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#2b2e30] pb-2">
                  <span className="font-pixel text-[9.5px] text-[#b180ff] flex items-center gap-1.5">
                    <Ticket size={13} /> STAGE 7: PHASE 2 ENTRY FEE (₹500) &amp; PASS
                  </span>
                  <span className={`font-silkscreen text-[8px] px-2 py-0.5 rounded-xs border ${
                    selectedTeamModal.phase2PaymentStatus === 'payment_verified'
                      ? 'bg-[#182418] text-[#a7d38a] border-[#254225]'
                      : selectedTeamModal.phase2PaymentStatus === 'payment_pending'
                        ? 'bg-[#241d14] text-[#f2933d] border-[#423325]'
                        : 'bg-[#241818] text-[#eb5147] border-[#422525]'
                  }`}>
                    {selectedTeamModal.phase2PaymentStatus === 'payment_verified'
                      ? 'OFFLINE PASS ISSUED'
                      : selectedTeamModal.phase2PaymentStatus === 'payment_pending'
                        ? 'PENDING VERIFICATION'
                        : 'UNPAID'}
                  </span>
                </div>

                {selectedTeamModal.phase2PaymentTransactionId ? (
                  <div className="p-2 bg-[#141618] border border-[#2b2e30] rounded-xs font-mono text-xs text-[#b180ff] flex items-center justify-between">
                    <span>PHASE 2 UTR / REF ID:</span>
                    <span className="font-bold text-white">{selectedTeamModal.phase2PaymentTransactionId}</span>
                  </div>
                ) : (
                  <div className="p-1.5 bg-[#141618] border border-[#2b2e30] rounded-xs font-silkscreen text-[8px] text-[#7d8285]">
                    No Phase 2 UTR / Ref ID submitted yet.
                  </div>
                )}

                {selectedTeamModal.phase2PaymentScreenshotUrl &&
                  (selectedTeamModal.phase2PaymentScreenshotUrl.startsWith('http') || selectedTeamModal.phase2PaymentScreenshotUrl.startsWith('data:image')) &&
                  !selectedTeamModal.phase2PaymentScreenshotUrl.includes('placeholder') && (
                  <div className="space-y-1">
                    <span className="font-silkscreen text-[8px] text-[#b180ff] block">PHASE 2 SUBMITTED RECEIPT:</span>
                    <div className="border border-[#2b2e30] rounded-xs overflow-hidden h-40 bg-black">
                      <img src={selectedTeamModal.phase2PaymentScreenshotUrl} alt="Phase 2 Payment Receipt" className="w-full h-full object-contain" />
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <span className="font-silkscreen text-[8px] text-[#8f9396] shrink-0">SET PHASE 2 STATUS:</span>
                  <select
                    value={selectedTeamModal.phase2PaymentStatus || 'unpaid'}
                    onChange={(e) => handlePhase2PaymentStatusChange(selectedTeamModal.id, e.target.value as Phase2PaymentStatus)}
                    className="font-pixel text-[8.5px] bg-[#1c1f24] border border-[#3a4149] text-[#b180ff] px-2 py-1.5 rounded-xs w-full cursor-pointer"
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
                  className={`font-pixel text-[8px] px-2.5 py-1 rounded-xs border cursor-pointer ${
                    selectedTeamModal.attendanceStatus === 'checked_in'
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

      {/* Footer */}
      <div className="pt-2 border-t border-[#26282a] flex items-center justify-between text-[8px] font-silkscreen text-[#7d8285]">
        <span>COGNITIA ATTENDANCE &amp; TICKETING CONTROL</span>
        <span className="text-[#a7d38a]">COGNITIA 2026 ADMIN</span>
      </div>
    </div>
  );
};
