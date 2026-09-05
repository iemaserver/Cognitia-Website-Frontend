import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import {
  TeamRegistration,
  ProjectSubmission,
  TeamMember,
  Phase2SelectionStatus,
  Phase2PaymentStatus,
  AttendanceStatus,
} from '../types';

const STORAGE_KEY_TEAMS = 'cognitia_firebase_teams_v1';
const STORAGE_KEY_AUTH = 'cognitia_lead_session_v1';

type TeamsChangeListener = (teams: TeamRegistration[]) => void;

class FirebaseService {
  private teams: TeamRegistration[] = [];
  private listeners: TeamsChangeListener[] = [];
  private isFirestoreConnected: boolean = false;

  constructor() {
    this.loadFromStorage();
    this.initFirestoreSync();
  }

  private loadFromStorage() {
    try {
      const legacyAwsTeams = localStorage.getItem('cognitia_aws_teams_v2');
      const stored = localStorage.getItem(STORAGE_KEY_TEAMS);

      if (stored) {
        const parsed = JSON.parse(stored);
        this.teams = parsed.filter(
          (t: TeamRegistration) => !t.id.startsWith('team-spidey-') && !t.id.startsWith('team-cyber-')
        );
      } else if (legacyAwsTeams) {
        const parsed = JSON.parse(legacyAwsTeams);
        this.teams = parsed.filter(
          (t: TeamRegistration) => !t.id.startsWith('team-spidey-') && !t.id.startsWith('team-cyber-')
        );
        this.saveToStorage();
      } else {
        this.teams = [];
      }

      localStorage.removeItem('cognitia_aws_teams_v1');
      localStorage.removeItem('cognitia_aws_teams_v2');
    } catch {
      this.teams = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(this.teams));
    } catch (e) {
      console.warn('[FirebaseService] Failed to save to local storage', e);
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener([...this.teams]);
      } catch (err) {
        console.error('[FirebaseService] Listener error:', err);
      }
    });
  }

  public subscribeToTeamsChange(listener: TeamsChangeListener): () => void {
    this.listeners.push(listener);
    listener([...this.teams]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private initFirestoreSync() {
    if (!db) {
      console.warn('[FirebaseService] Firestore DB instance not initialized');
      return;
    }

    try {
      const teamsRef = collection(db, 'teams');
      onSnapshot(
        teamsRef,
        (snapshot) => {
          this.isFirestoreConnected = true;
          const remoteTeams: TeamRegistration[] = [];
          snapshot.forEach((docSnap) => {
            if (docSnap.exists()) {
              remoteTeams.push(docSnap.data() as TeamRegistration);
            }
          });

          // Sort by registeredAt descending
          remoteTeams.sort((a, b) => {
            const timeA = new Date(a.registeredAt || 0).getTime();
            const timeB = new Date(b.registeredAt || 0).getTime();
            return timeB - timeA;
          });

          if (remoteTeams.length > 0) {
            this.teams = remoteTeams;
            this.saveToStorage();
            this.notifyListeners();
          }
        },
        (error) => {
          console.warn('[FirebaseService] Firestore real-time listener notice:', error.message);
        }
      );
    } catch (err) {
      console.warn('[FirebaseService] Error setting up Firestore listener:', err);
    }
  }

  // Google Cloud Storage (GCS) / Firebase Storage Upload Layer
  public async uploadFileToGCS(
    file: File,
    folder: 'ppts' | 'screenshots' | 'payments' | 'iemcrp'
  ): Promise<{ url: string; fileName: string }> {
    const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`FILE_TOO_LARGE: File size ${(file.size / (1024 * 1024)).toFixed(2)} MB exceeds 10 MB limit.`);
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `submissions/${folder}/${Date.now()}_${sanitizedName}`;

    // Option 1: Direct Google Cloud Storage (GCS) Signed URL Endpoint if provided
    const gcsApiUrl = import.meta.env.VITE_GCS_UPLOAD_API_URL;
    if (gcsApiUrl) {
      try {
        const res = await fetch(gcsApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, path: storagePath, contentType: file.type }),
        });
        if (res.ok) {
          const { uploadUrl, publicUrl } = await res.json();
          const putRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
          });
          if (putRes.ok) {
            console.log(`[Google Cloud Storage Upload] Direct GCS Success: ${publicUrl}`);
            return { url: publicUrl || uploadUrl.split('?')[0], fileName: file.name };
          }
        }
      } catch (gcsErr) {
        console.warn('[GCS Signed Upload] Signed URL upload failed, attempting Firebase GCS SDK:', gcsErr);
      }
    }

    // Option 2: Firebase Storage / Google Cloud Storage SDK
    if (storage) {
      try {
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        console.log(`[Google Cloud Storage Upload] SDK Success: ${downloadUrl}`);
        return { url: downloadUrl, fileName: file.name };
      } catch (err) {
        console.warn('[Google Cloud Storage Upload] SDK upload failed or unconfigured, using fallback encoder:', err);
      }
    }

    // Fallback: Canvas compressed Data URL for images or FileReader Data URL for files
    return new Promise((resolve, reject) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const rawUrl = e.target?.result as string;
          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 1024;
              const MAX_HEIGHT = 1024;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height = Math.round((height * MAX_WIDTH) / width);
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width = Math.round((width * MAX_HEIGHT) / height);
                  height = MAX_HEIGHT;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                resolve({ url: compressedDataUrl, fileName: file.name });
                return;
              }
            } catch (err) {
              console.warn('Image canvas compression failed, falling back to raw data URL', err);
            }
            resolve({ url: rawUrl, fileName: file.name });
          };
          img.onerror = () => resolve({ url: rawUrl, fileName: file.name });
          img.src = rawUrl;
        };
        reader.onerror = () => reject(new Error('READ_ERROR'));
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ url: reader.result as string, fileName: file.name });
        };
        reader.onerror = () => reject(new Error('READ_ERROR'));
        reader.readAsDataURL(file);
      }
    });
  }

  // Alias for backward compatibility
  public async uploadFileToFirebaseStorage(
    file: File,
    folder: 'ppts' | 'screenshots' | 'payments'
  ): Promise<{ url: string; fileName: string }> {
    return this.uploadFileToGCS(file, folder);
  }

  // Check if an email address is already registered
  public isEmailRegistered(email: string, excludeTeamId?: string): boolean {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return false;
    for (const team of this.teams) {
      if (excludeTeamId && team.id === excludeTeamId) continue;
      if (team.leadEmail.toLowerCase() === normalized) return true;
      for (const m of team.members) {
        if (m.email.toLowerCase() === normalized) return true;
      }
    }
    return false;
  }

  // Check if a GitHub handle is already registered
  public isGitHubRegistered(githubId: string, excludeTeamId?: string): boolean {
    const normalized = githubId.trim().replace(/^@/, '').toLowerCase();
    if (!normalized) return false;
    for (const team of this.teams) {
      if (excludeTeamId && team.id === excludeTeamId) continue;
      for (const m of team.members) {
        if (m.githubId.toLowerCase() === normalized) return true;
      }
    }
    return false;
  }

  // Helper method to sanitize team document for Phase 2 database & storage cleanliness
  private sanitizeTeamForPhase2(team: TeamRegistration): TeamRegistration {
    const cleanTeam: TeamRegistration = { ...team };
    // Remove obsolete Phase 1 submission & payment legacy fields
    delete cleanTeam.submission;
    if (cleanTeam.phase2PaymentStatus || cleanTeam.phase2PaymentScreenshotUrl || cleanTeam.phase2PaymentTransactionId) {
      delete cleanTeam.paymentScreenshotUrl;
      delete cleanTeam.paymentTransactionId;
      delete cleanTeam.paymentSubmittedAt;
    }
    return cleanTeam;
  }

  // Helper method to sync a team document to Firestore
  private async syncTeamToFirestore(team: TeamRegistration): Promise<void> {
    if (!db) return;
    try {
      const cleanTeam = this.sanitizeTeamForPhase2(team);
      const teamDocRef = doc(db, 'teams', team.id);
      await setDoc(teamDocRef, cleanTeam, { merge: true });
    } catch (err) {
      console.warn(`[Firestore Sync] Failed to sync team ${team.id} to Firestore:`, err);
    }
  }

  // Helper method to check if a team is an IEM/UEM all-student team (qualifying for ₹0 free registration)
  public checkIsIemUemTeam(members: TeamMember[]): { isIemUemTeam: boolean; feeAmount: number } {
    if (!members || members.length === 0) {
      return { isIemUemTeam: false, feeAmount: 200 };
    }
    const allIemUem = members.every((m) =>
      Boolean(m.isIemUemStudent && m.enrollmentNo && m.enrollmentNo.trim().length >= 4)
    );
    return {
      isIemUemTeam: allIemUem,
      feeAmount: allIemUem ? 0 : 200,
    };
  }

  // Team Lead Authentication & Registration
  public async registerTeamLead(data: {
    teamName: string;
    leadEmail: string;
    leadPhone: string;
    passwordHash: string;
    leadGitHubId: string;
    leadName: string;
    collegeName?: string;
    isIemUemStudent?: boolean;
    enrollmentNo?: string;
  }): Promise<{ success: boolean; team?: TeamRegistration; message?: string }> {
    const cleanEmail = data.leadEmail.trim().toLowerCase();
    const cleanGitHub = data.leadGitHubId.trim().replace(/^@/, '').toLowerCase();

    if (this.isEmailRegistered(cleanEmail)) {
      return {
        success: false,
        message: `Email address '${data.leadEmail}' is already registered (as a Team Lead or Member). Please use a unique email or log in.`,
      };
    }

    if (this.isGitHubRegistered(cleanGitHub)) {
      return {
        success: false,
        message: `GitHub username '@${cleanGitHub}' is already registered in a team. Each participant must use a unique GitHub ID.`,
      };
    }

    const leadMember: TeamMember = {
      id: `mem-lead-${Date.now()}`,
      name: data.leadName || 'Team Lead',
      email: cleanEmail,
      phone: data.leadPhone,
      role: 'Team Lead',
      githubId: cleanGitHub,
      isLead: true,
      collegeName: data.collegeName || (data.isIemUemStudent ? 'IEM / UEM' : ''),
      isIemUemStudent: !!data.isIemUemStudent,
      enrollmentNo: data.enrollmentNo?.trim() || '',
    };

    const feeInfo = this.checkIsIemUemTeam([leadMember]);

    const newTeam: TeamRegistration = {
      id: `team-${Date.now()}`,
      teamName: data.teamName,
      leadEmail: cleanEmail,
      leadPhone: data.leadPhone,
      leadPasswordHash: data.passwordHash,
      isMembersLocked: false,
      registeredAt: new Date().toISOString(),
      phase2Status: 'pending',
      paymentStatus: feeInfo.isIemUemTeam ? 'payment_verified' : 'unpaid',
      phase2PaymentStatus: feeInfo.isIemUemTeam ? 'payment_verified' : 'unpaid',
      isIemUemTeam: feeInfo.isIemUemTeam,
      phase2FeeAmount: feeInfo.feeAmount,
      attendanceStatus: 'not_checked_in',
      members: [leadMember],
    };

    if (feeInfo.isIemUemTeam) {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      newTeam.ticketPassId = `COGNITIA-2026-PASS-${randomDigits}`;
      newTeam.ticketIssuedAt = new Date().toISOString();
    }

    this.teams.unshift(newTeam);
    this.saveToStorage();
    this.notifyListeners();
    this.setLeadSession(newTeam.id);

    // Sync doc to Firestore
    await this.syncTeamToFirestore(newTeam);

    return { success: true, team: newTeam };
  }

  // Admin Direct Team Credentials Insertion
  public async adminCreateTeam(data: {
    teamName: string;
    leadName: string;
    leadEmail: string;
    leadPhone: string;
    passwordHash: string;
    customTeamId?: string;
    leadGitHubId?: string;
    members?: TeamMember[];
    trackPreferences?: string[];
  }): Promise<{ success: boolean; team?: TeamRegistration; message?: string }> {
    const cleanEmail = data.leadEmail.trim().toLowerCase();

    // Check if team lead already exists
    const existingIndex = this.teams.findIndex((t) => t.leadEmail.toLowerCase() === cleanEmail);
    if (existingIndex !== -1) {
      const existing = this.teams[existingIndex];
      existing.teamName = data.teamName;
      existing.leadPhone = data.leadPhone;
      existing.leadPasswordHash = data.passwordHash;

      if (data.members && data.members.length > 0) {
        existing.members = data.members;
      }
      if (data.trackPreferences) {
        existing.trackPreferences = data.trackPreferences;
      }

      const feeCheck = this.checkIsIemUemTeam(existing.members);
      existing.isIemUemTeam = feeCheck.isIemUemTeam;
      existing.phase2FeeAmount = feeCheck.feeAmount;

      this.saveToStorage();
      this.notifyListeners();
      await this.syncTeamToFirestore(existing);

      return { success: true, team: existing, message: 'Existing team updated with new credentials!' };
    }

    const leadMember: TeamMember = data.members && data.members.length > 0 ? data.members[0] : {
      id: `mem-lead-${Date.now()}`,
      name: data.leadName || 'Team Lead',
      email: cleanEmail,
      phone: data.leadPhone,
      role: 'Team Lead',
      githubId: data.leadGitHubId || '',
      isLead: true,
      collegeName: 'IEM / UEM',
      isIemUemStudent: true,
      enrollmentNo: '',
    };

    const teamMembers = data.members && data.members.length > 0 ? data.members : [leadMember];
    const feeCheck = this.checkIsIemUemTeam(teamMembers);

    const teamId = data.customTeamId && data.customTeamId.trim()
      ? data.customTeamId.trim()
      : `COG26-T${Math.floor(100 + Math.random() * 900)}`;

    const newTeam: TeamRegistration = {
      id: teamId,
      teamName: data.teamName,
      leadEmail: cleanEmail,
      leadPhone: data.leadPhone,
      leadPasswordHash: data.passwordHash,
      isMembersLocked: false,
      registeredAt: new Date().toISOString(),
      phase2Status: 'pending',
      paymentStatus: 'unpaid',
      phase2PaymentStatus: 'unpaid',
      isIemUemTeam: feeCheck.isIemUemTeam,
      phase2FeeAmount: feeCheck.feeAmount,
      attendanceStatus: 'not_checked_in',
      members: teamMembers,
      trackPreferences: data.trackPreferences || ['', '', '', '', ''],
    };

    this.teams.unshift(newTeam);
    this.saveToStorage();
    this.notifyListeners();
    await this.syncTeamToFirestore(newTeam);

    return { success: true, team: newTeam };
  }

  public async loginTeamLead(
    identifier: string,
    passwordHash: string
  ): Promise<{ success: boolean; team?: TeamRegistration; message?: string }> {
    const cleanQuery = identifier.trim().toLowerCase();

    const team = this.teams.find(
      (t) =>
        t.id.toLowerCase() === cleanQuery ||
        t.leadEmail.toLowerCase() === cleanQuery ||
        (t.ticketPassId && t.ticketPassId.toLowerCase() === cleanQuery)
    );

    if (!team) {
      return { success: false, message: `No registered team found with Team ID (TID) '${identifier.trim()}'.` };
    }

    if (team.leadPasswordHash && team.leadPasswordHash !== passwordHash.trim()) {
      return { success: false, message: 'Incorrect password. Please verify team credentials.' };
    }

    this.setLeadSession(team.id);
    return { success: true, team };
  }

  public setLeadSession(teamId: string | null) {
    if (teamId) {
      localStorage.setItem(STORAGE_KEY_AUTH, teamId);
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  }

  public getActiveLeadTeam(): TeamRegistration | null {
    const teamId = localStorage.getItem(STORAGE_KEY_AUTH);
    if (!teamId) return null;
    return this.teams.find((t) => t.id === teamId) || null;
  }

  public logoutTeamLead() {
    this.setLeadSession(null);
  }

  // Team Management: Update Team Name & Team Members
  public async updateTeamDetails(
    teamId: string,
    teamName: string,
    members: TeamMember[],
    isMembersLocked?: boolean
  ): Promise<{ success: boolean; team?: TeamRegistration; message?: string }> {
    const index = this.teams.findIndex((t) => t.id === teamId);
    if (index === -1) return { success: false, message: 'Team not found.' };

    for (const m of members) {
      if (!m.isLead) {
        if (this.isEmailRegistered(m.email, teamId)) {
          return {
            success: false,
            message: `Email address '${m.email}' is already registered in another team.`,
          };
        }
        if (this.isGitHubRegistered(m.githubId, teamId)) {
          return {
            success: false,
            message: `GitHub handle '@${m.githubId}' is already registered in another team.`,
          };
        }
      }
    }

    const feeInfo = this.checkIsIemUemTeam(members);

    this.teams[index].teamName = teamName;
    this.teams[index].members = members;
    this.teams[index].isIemUemTeam = feeInfo.isIemUemTeam;
    this.teams[index].phase2FeeAmount = feeInfo.feeAmount;

    if (feeInfo.isIemUemTeam && !this.teams[index].ticketPassId) {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      this.teams[index].ticketPassId = `COGNITIA-2026-PASS-${randomDigits}`;
      this.teams[index].ticketIssuedAt = new Date().toISOString();
      this.teams[index].paymentStatus = 'payment_verified';
      this.teams[index].phase2PaymentStatus = 'payment_verified';
    }

    if (isMembersLocked !== undefined) {
      this.teams[index].isMembersLocked = isMembersLocked;
    }
    this.saveToStorage();
    this.notifyListeners();

    await this.syncTeamToFirestore(this.teams[index]);

    return { success: true, team: this.teams[index] };
  }

  // Permanently lock team track preferences
  public async lockTrackPreference(
    teamId: string,
    trackPreferences: string[]
  ): Promise<{ success: boolean; team?: TeamRegistration; message?: string }> {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) return { success: false, message: 'Team not found.' };

    if (team.isTrackLocked) {
      return {
        success: false,
        team,
        message: `Track preferences are already permanently locked and cannot be modified.`,
      };
    }

    team.trackPreferences = trackPreferences;
    team.selectedTrack = trackPreferences[0] || '';
    team.isTrackLocked = true;
    team.trackLockedAt = new Date().toISOString();
    this.saveToStorage();
    this.notifyListeners();

    await this.syncTeamToFirestore(team);

    return { success: true, team };
  }

  // Project Deliverable Submission (PPT, Github, Screenshots)
  public async saveProjectSubmission(
    teamId: string,
    submissionData: Omit<ProjectSubmission, 'id' | 'teamId' | 'submittedAt' | 'updatedAt'>
  ): Promise<{ success: boolean; submission?: ProjectSubmission; team?: TeamRegistration }> {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) return { success: false };

    const now = new Date().toISOString();
    const submission: ProjectSubmission = {
      ...submissionData,
      id: team.submission?.id || `sub-${Date.now()}`,
      teamId,
      submittedAt: team.submission?.submittedAt || now,
      updatedAt: now,
    };

    team.submission = submission;
    this.saveToStorage();
    this.notifyListeners();

    await this.syncTeamToFirestore(team);

    return { success: true, submission, team };
  }

  // PHASE 2 OFFLINE ROUND & SELECTION METHODS
  public async updatePhase2Selection(
    teamId: string,
    status: Phase2SelectionStatus
  ): Promise<{ success: boolean; team?: TeamRegistration }> {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) return { success: false };

    team.phase2Status = status;
    this.saveToStorage();
    this.notifyListeners();

    await this.syncTeamToFirestore(team);
    return { success: true, team };
  }

  public async confirmRsvp(teamId: string): Promise<{ success: boolean; team?: TeamRegistration }> {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) return { success: false };

    team.rsvpConfirmed = true;
    this.saveToStorage();
    this.notifyListeners();

    await this.syncTeamToFirestore(team);
    return { success: true, team };
  }

  public async submitPaymentScreenshot(
    teamId: string,
    screenshotUrl: string,
    transactionId?: string
  ): Promise<{ success: boolean; team?: TeamRegistration }> {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) return { success: false };

    team.paymentStatus = 'payment_pending';
    team.paymentScreenshotUrl = screenshotUrl;
    team.paymentTransactionId = transactionId || team.paymentTransactionId;
    team.paymentSubmittedAt = new Date().toISOString();
    this.saveToStorage();
    this.notifyListeners();

    await this.syncTeamToFirestore(team);

    return { success: true, team };
  }

  public async submitPhase2PaymentDetails(
    teamId: string,
    screenshotUrl: string,
    transactionId?: string
  ): Promise<{ success: boolean; team?: TeamRegistration }> {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) return { success: false };

    team.phase2PaymentStatus = 'payment_pending';
    team.phase2PaymentScreenshotUrl = screenshotUrl;
    team.phase2PaymentTransactionId = transactionId || team.phase2PaymentTransactionId;
    team.phase2PaymentSubmittedAt = new Date().toISOString();
    this.saveToStorage();
    this.notifyListeners();

    await this.syncTeamToFirestore(team);

    return { success: true, team };
  }

  public async updatePhase1PaymentStatus(
    teamId: string,
    status: Phase2PaymentStatus
  ): Promise<{ success: boolean; team?: TeamRegistration }> {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) return { success: false };

    team.paymentStatus = status;
    this.saveToStorage();
    this.notifyListeners();

    await this.syncTeamToFirestore(team);

    return { success: true, team };
  }

  public async updatePhase2PaymentStatus(
    teamId: string,
    status: Phase2PaymentStatus
  ): Promise<{ success: boolean; team?: TeamRegistration; ticketId?: string }> {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) return { success: false };

    team.phase2PaymentStatus = status;

    let ticketId = team.ticketPassId;
    if (status === 'payment_verified' && !team.ticketPassId) {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      ticketId = `COGNITIA-2026-PASS-${randomDigits}`;
      team.ticketPassId = ticketId;
      team.ticketIssuedAt = new Date().toISOString();
    }

    this.saveToStorage();
    this.notifyListeners();

    await this.syncTeamToFirestore(team);

    return { success: true, team, ticketId };
  }

  public async verifyPaymentAndGenerateTicket(
    teamId: string
  ): Promise<{ success: boolean; team?: TeamRegistration; ticketId?: string }> {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) return { success: false };

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const ticketId = team.ticketPassId || `COGNITIA-2026-PASS-${randomDigits}`;

    team.paymentStatus = 'payment_verified';
    team.phase2PaymentStatus = 'payment_verified';
    team.ticketPassId = ticketId;
    team.ticketIssuedAt = new Date().toISOString();
    this.saveToStorage();
    this.notifyListeners();

    await this.syncTeamToFirestore(team);

    return { success: true, team, ticketId };
  }

  public async submitIemcrpVerifications(
    teamId: string,
    updatedMembers: TeamMember[]
  ): Promise<{ success: boolean; team?: TeamRegistration; ticketId?: string }> {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) return { success: false };

    team.members = updatedMembers;
    team.isIemUemTeam = true;
    team.phase2FeeAmount = 0;
    team.iemcrpScreenshotsSubmitted = true;
    team.iemcrpScreenshotsSubmittedAt = new Date().toISOString();

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const ticketId = team.ticketPassId || `COGNITIA-2026-PASS-${randomDigits}`;

    team.paymentStatus = 'payment_verified';
    team.phase2PaymentStatus = 'payment_verified';
    team.ticketPassId = ticketId;
    team.ticketIssuedAt = new Date().toISOString();

    this.saveToStorage();
    this.notifyListeners();

    await this.syncTeamToFirestore(team);

    return { success: true, team, ticketId };
  }

  public ensureMemberPassIds(team: TeamRegistration): TeamRegistration {
    let teamUpdated = false;
    const teamNum = String(team.id || '').replace(/^team-/, '');

    if (!team.members) team.members = [];

    team.members = team.members.map((m, idx) => {
      let memberPassId = m.memberPassId;
      if (!memberPassId) {
        teamUpdated = true;
        const randDigits = Math.floor(1000 + Math.random() * 9000);
        memberPassId = `COG26-M${teamNum.slice(-3)}-${idx + 1}${randDigits}`;
      }

      const qrContent = `COGNITIA-2026-PASS-MEMBER:${memberPassId}:${team.id}:${m.name}:${m.enrollmentNo || 'N/A'}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrContent)}`;

      return {
        ...m,
        memberPassId,
        memberQrCodeUrl: qrUrl,
        checkInStatus: m.checkInStatus || 'not_checked_in',
      };
    });

    if (teamUpdated) {
      this.saveToStorage();
    }
    return team;
  }

  public async markAttendance(
    query: string,
    status: AttendanceStatus
  ): Promise<{ success: boolean; team?: TeamRegistration; matchedMember?: TeamMember; message?: string }> {
    const clean = query.trim().toLowerCase();
    if (!clean) return { success: false, message: 'Please enter a valid Pass Ticket ID, Member Pass ID, or Team ID.' };

    let matchedMember: TeamMember | undefined = undefined;

    const team = this.teams.find((t) => {
      this.ensureMemberPassIds(t);
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

    if (!team) {
      return { success: false, message: `No registered team or member matching '${query}' was found.` };
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (matchedMember) {
      matchedMember.checkInStatus = status;
      matchedMember.checkInTimestamp = status === 'checked_in' ? timestamp : undefined;
    } else {
      team.members.forEach((m) => {
        m.checkInStatus = status;
        m.checkInTimestamp = status === 'checked_in' ? timestamp : undefined;
      });
    }

    team.attendanceStatus = status;
    team.checkInTimestamp = status === 'checked_in' ? timestamp : undefined;

    this.saveToStorage();
    this.notifyListeners();
    await this.syncTeamToFirestore(team);

    const msg = matchedMember
      ? `Member '${matchedMember.name}' (${matchedMember.memberPassId || matchedMember.role}) marked ${status.toUpperCase()}!`
      : `Team '${team.teamName}' (All ${team.members.length} members) marked ${status.toUpperCase()}!`;

    return { success: true, team, matchedMember, message: msg };
  }

  public getAllRegistrations(): TeamRegistration[] {
    return this.teams.map((t) => this.ensureMemberPassIds(t));
  }

  public clearAllData(): void {
    this.teams = [];
    try {
      localStorage.removeItem(STORAGE_KEY_TEAMS);
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } catch {
      // Ignore storage errors
    }
    this.notifyListeners();
  }
}

export const firebaseService = new FirebaseService();

