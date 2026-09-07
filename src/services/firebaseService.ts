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
  MealType,
  MemberMealCoupons,
  MealSessionConfig,
  isIemUemAllStudentTeam,
} from '../types';

const STORAGE_KEY_TEAMS = 'cognitia_firebase_teams_v1';
const STORAGE_KEY_AUTH = 'cognitia_lead_session_v1';
const STORAGE_KEY_MEAL_SESSION = 'cognitia_meal_session_v1';

type TeamsChangeListener = (teams: TeamRegistration[]) => void;

class FirebaseService {
  private teams: TeamRegistration[] = [];
  private listeners: TeamsChangeListener[] = [];
  private isFirestoreConnected: boolean = false;
  private activeMealSession: MealType | 'none' = 'none';
  private mealSessionListeners: ((session: MealType | 'none') => void)[] = [];

  constructor() {
    this.loadFromStorage();
    this.initFirestoreSync();
    this.initMealSessionSync();
  }

  private initMealSessionSync() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MEAL_SESSION);
      if (stored && ['day1_dinner', 'day1_snacks', 'day2_breakfast', 'day2_lunch', 'none'].includes(stored)) {
        this.activeMealSession = stored as MealType | 'none';
      }
    } catch {
      // Ignore
    }

    if (!db) return;

    try {
      const docRef = doc(db, 'system_config', 'meal_session');
      onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.activeMealSession) {
            this.activeMealSession = data.activeMealSession as MealType | 'none';
            try {
              localStorage.setItem(STORAGE_KEY_MEAL_SESSION, this.activeMealSession);
            } catch {
              // Ignore
            }
            this.notifyMealSessionListeners();
          }
        }
      });
    } catch (e) {
      console.warn('[FirebaseService] Meal session sync error:', e);
    }
  }

  private notifyMealSessionListeners() {
    this.mealSessionListeners.forEach((l) => {
      try {
        l(this.activeMealSession);
      } catch (err) {
        console.error('[FirebaseService] Meal session listener error:', err);
      }
    });
  }

  public subscribeToMealSession(listener: (session: MealType | 'none') => void): () => void {
    this.mealSessionListeners.push(listener);
    listener(this.activeMealSession);
    return () => {
      this.mealSessionListeners = this.mealSessionListeners.filter((l) => l !== listener);
    };
  }

  public getActiveMealSession(): MealType | 'none' {
    return this.activeMealSession;
  }

  public async setActiveMealSession(meal: MealType | 'none'): Promise<{ success: boolean; activeMealSession: MealType | 'none' }> {
    this.activeMealSession = meal;
    try {
      localStorage.setItem(STORAGE_KEY_MEAL_SESSION, meal);
    } catch {
      // Ignore
    }
    this.notifyMealSessionListeners();

    if (db) {
      try {
        const docRef = doc(db, 'system_config', 'meal_session');
        await setDoc(docRef, { activeMealSession: meal, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (e) {
        console.warn('[FirebaseService] Failed to sync meal session to Firestore:', e);
      }
    }

    return { success: true, activeMealSession: meal };
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

  public subscribeToTeams(listener: TeamsChangeListener): () => void {
    return this.subscribeToTeamsChange(listener);
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

          const processedTeams = remoteTeams.map((t) => this.ensureMemberPassIds(t));
          this.teams = processedTeams;
          this.saveToStorage();
          this.notifyListeners();
        },
        (error) => {
          console.warn('[FirebaseService] Firestore real-time listener notice:', error.message);
        }
      );
    } catch (err) {
      console.warn('[FirebaseService] Error setting up Firestore listener:', err);
    }
  }

  public getIsFirestoreConnected(): boolean {
    return this.isFirestoreConnected;
  }

  public async syncFromFirestore(): Promise<{ success: boolean; count: number; error?: string }> {
    if (!db) {
      return { success: false, count: this.teams.length, error: 'Firestore DB instance not initialized' };
    }

    try {
      const teamsRef = collection(db, 'teams');
      const snapshot = await getDocs(teamsRef);
      const remoteTeams: TeamRegistration[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.exists()) {
          remoteTeams.push(docSnap.data() as TeamRegistration);
        }
      });

      remoteTeams.sort((a, b) => {
        const timeA = new Date(a.registeredAt || 0).getTime();
        const timeB = new Date(b.registeredAt || 0).getTime();
        return timeB - timeA;
      });

      const processedTeams = remoteTeams.map((t) => this.ensureMemberPassIds(t));
      this.teams = processedTeams;
      this.isFirestoreConnected = true;
      this.saveToStorage();
      this.notifyListeners();

      return { success: true, count: processedTeams.length };
    } catch (err: any) {
      console.error('[FirebaseService] Manual Firestore fetch error:', err);
      return { success: false, count: this.teams.length, error: err.message || 'Firestore sync failed' };
    }
  }

  // Google Cloud Storage (GCS) / Firebase Storage Upload Layer
  public async uploadFileToGCS(
    file: File,
    folder: 'ppts' | 'screenshots' | 'payments' | 'iemcrp'
  ): Promise<{ url: string; fileName: string }> {
    const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`FILE_TOO_LARGE: File size ${(file.size / (1024 * 1024)).toFixed(2)} MB exceeds 5 MB limit.`);
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
    // Delete transient QR image URLs from member objects so zero QR image URLs/blobs are saved in database
    if (cleanTeam.members) {
      cleanTeam.members = cleanTeam.members.map((m) => {
        const cleanMember = { ...m };
        delete cleanMember.memberQrCodeUrl;
        return cleanMember;
      });
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

  // Helper method to check if a team is an IEM all-student team (qualifying for ₹0 free registration)
  public checkIsIemUemTeam(members: TeamMember[]): { isIemUemTeam: boolean; feeAmount: number } {
    const allIemUem = isIemUemAllStudentTeam(members);
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
      collegeName: data.collegeName || (data.isIemUemStudent ? 'IEM Salt Lake' : ''),
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
      paymentStatus: 'unpaid',
      phase2PaymentStatus: 'unpaid',
      isIemUemTeam: feeInfo.isIemUemTeam,
      phase2FeeAmount: feeInfo.feeAmount,
      attendanceStatus: 'not_checked_in',
      members: [leadMember],
    };

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
      collegeName: 'IEM Salt Lake',
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
    const team = this.teams.find((t) => t.id === teamId) || null;

    if (team && team.rsvpConfirmed && isIemUemAllStudentTeam(team.members) && team.paymentStatus !== 'payment_verified') {
      team.isIemUemTeam = true;
      team.phase2FeeAmount = 0;
      team.paymentStatus = 'payment_verified';
      team.phase2PaymentStatus = 'payment_verified';
      this.ensureMemberPassIds(team);
      if (!team.ticketPassId) {
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        team.ticketPassId = `COGNITIA-2026-PASS-${randomDigits}`;
        team.ticketIssuedAt = new Date().toISOString();
      }
      this.saveToStorage();
      this.syncTeamToFirestore(team);
    }

    return team;
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
    if (!team.adminTrackOverride) {
      team.selectedTrack = trackPreferences[0] || '';
    }
    team.isTrackLocked = true;
    team.trackLockedAt = new Date().toISOString();
    this.saveToStorage();
    this.notifyListeners();

    await this.syncTeamToFirestore(team);

    return { success: true, team };
  }

  // Admin manual override for team track assignment (requires at least 2 members checked in)
  public async overrideTeamTrack(
    teamId: string,
    selectedTrack: string
  ): Promise<{ success: boolean; team?: TeamRegistration; message?: string }> {
    const team = this.teams.find(
      (t) => t.id === teamId || (t.ticketPassId && t.ticketPassId.toLowerCase() === teamId.toLowerCase())
    );
    if (!team) return { success: false, message: 'Team not found.' };

    const checkedCount = (team.members || []).filter((m) => m.checkInStatus === 'checked_in').length;
    if (selectedTrack && checkedCount < 2) {
      return {
        success: false,
        team,
        message: `Track assignment requires at least 2 members to be present and checked in at venue gate (Current: ${checkedCount}/${team.members?.length || 0}).`,
      };
    }

    team.adminTrackOverride = selectedTrack || undefined;
    team.selectedTrack = selectedTrack || undefined;
    if (selectedTrack) {
      team.isTrackLocked = true;
      team.trackLockedAt = team.trackLockedAt || new Date().toISOString();
    } else {
      team.isTrackLocked = false;
    }
    this.saveToStorage();
    this.notifyListeners();

    await this.syncTeamToFirestore(team);
    return { success: true, team };
  }

  // Admin forced modification of team track preference ranking order
  public async adminUpdateTrackPreferences(
    teamId: string,
    trackPreferences: string[]
  ): Promise<{ success: boolean; team?: TeamRegistration }> {
    const team = this.teams.find(
      (t) => t.id === teamId || (t.ticketPassId && t.ticketPassId.toLowerCase() === teamId.toLowerCase())
    );
    if (!team) return { success: false };

    team.trackPreferences = trackPreferences;
    team.isTrackLocked = true;
    team.trackLockedAt = team.trackLockedAt || new Date().toISOString();
    if (!team.adminTrackOverride) {
      team.selectedTrack = trackPreferences[0] || '';
    }
    this.saveToStorage();
    this.notifyListeners();

    await this.syncTeamToFirestore(team);
    return { success: true, team };
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

    if (team.phase2Status === 'waitlisted') {
      return { success: false, team };
    }

    team.rsvpConfirmed = true;

    // Full IEM/UEM student teams auto-verify and receive official ticket pass upon RSVP confirmation
    if (isIemUemAllStudentTeam(team.members)) {
      team.isIemUemTeam = true;
      team.phase2FeeAmount = 0;
      team.paymentStatus = 'payment_verified';
      team.phase2PaymentStatus = 'payment_verified';
      this.ensureMemberPassIds(team);
      if (!team.ticketPassId) {
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        team.ticketPassId = `COGNITIA-2026-PASS-${randomDigits}`;
        team.ticketIssuedAt = new Date().toISOString();
      }
    }

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

  public async updatePhase2PaymentStatus(
    teamId: string,
    status: Phase2PaymentStatus
  ): Promise<{ success: boolean; team?: TeamRegistration; ticketId?: string }> {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) return { success: false };

    team.phase2PaymentStatus = status;
    team.paymentStatus = status;

    let ticketId = team.ticketPassId;
    if (status === 'payment_verified') {
      team.rsvpConfirmed = true;
      this.ensureMemberPassIds(team);
      if (!team.ticketPassId) {
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        ticketId = `COGNITIA-2026-PASS-${randomDigits}`;
        team.ticketPassId = ticketId;
        team.ticketIssuedAt = new Date().toISOString();
      }
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

    team.rsvpConfirmed = true;
    this.ensureMemberPassIds(team);
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
  ): Promise<{ success: boolean; team?: TeamRegistration }> {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) return { success: false };

    team.members = updatedMembers;
    team.isIemUemTeam = true;
    team.phase2FeeAmount = 0;
    team.iemcrpScreenshotsSubmitted = true;
    team.iemcrpScreenshotsSubmittedAt = new Date().toISOString();

    // Submission goes to pending state for admin to verify proof:
    team.paymentStatus = 'payment_pending';
    team.phase2PaymentStatus = 'payment_pending';

    this.saveToStorage();
    this.notifyListeners();

    await this.syncTeamToFirestore(team);

    return { success: true, team };
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
    const rawClean = query.trim();
    if (!rawClean) return { success: false, message: 'Please enter a valid Pass Ticket ID, Member Pass ID, or Team ID.' };

    const lowerQuery = rawClean.toLowerCase();
    let matchedMember: TeamMember | undefined = undefined;
    let matchedTeam: TeamRegistration | undefined = undefined;

    // Case 1: Member QR Payload (Format: COGNITIA-2026-PASS-MEMBER:memberPassId:teamId:name:enrollment)
    if (lowerQuery.startsWith('cognitia-2026-pass-member:')) {
      const parts = rawClean.split(':');
      const targetMemberPassId = (parts[1] || '').trim().toLowerCase();
      const targetTeamId = (parts[2] || '').trim().toLowerCase();

      matchedTeam = this.teams.find((t) => {
        this.ensureMemberPassIds(t);
        return t.id.toLowerCase() === targetTeamId || (t.ticketPassId && t.ticketPassId.toLowerCase() === targetTeamId);
      });

      // If team not found by ID, search across all teams for the member pass ID
      if (!matchedTeam) {
        matchedTeam = this.teams.find((t) => {
          this.ensureMemberPassIds(t);
          return (t.members || []).some((m) => (m.memberPassId || '').toLowerCase() === targetMemberPassId);
        });
      }

      if (matchedTeam) {
        matchedMember = (matchedTeam.members || []).find((m) => (m.memberPassId || '').toLowerCase() === targetMemberPassId);
      }
    }
    // Case 2: Main Team QR Payload (Format: COGNITIA-2026-PASS:passId:teamId:teamName)
    else if (lowerQuery.startsWith('cognitia-2026-pass:')) {
      const parts = rawClean.split(':');
      const targetPassId = (parts[1] || '').trim().toLowerCase();
      const targetTeamId = (parts[2] || '').trim().toLowerCase();

      matchedTeam = this.teams.find((t) => {
        this.ensureMemberPassIds(t);
        const tId = (t.id || '').toLowerCase();
        const tPass = (t.ticketPassId || '').toLowerCase();
        return tId === targetTeamId || tPass === targetPassId || tId === targetPassId;
      });
      // matchedMember remains undefined for Main Team QR
    }
    // Case 3: Direct Pass ID / Team ID / Enrollment / Member Pass ID Search
    else {
      const tokens: string[] = [lowerQuery];
      if (lowerQuery.includes(':')) {
        tokens.push(...lowerQuery.split(':').map((p) => p.trim()).filter(Boolean));
      }

      // First check if any token matches an individual member pass ID, member ID, or enrollment number
      for (const t of this.teams) {
        this.ensureMemberPassIds(t);
        const foundMem = (t.members || []).find((m) => {
          const mId = (m.id || '').toLowerCase();
          const mPass = (m.memberPassId || '').toLowerCase();
          const mEnrollment = (m.enrollmentNo || '').toLowerCase();

          return tokens.some(
            (tok) => tok === mId || tok === mPass || (tok !== 'n/a' && tok.length > 3 && tok === mEnrollment)
          );
        });

        if (foundMem) {
          matchedMember = foundMem;
          matchedTeam = t;
          break;
        }
      }

      // If no member matched, check for main team ID or team ticket pass ID
      if (!matchedTeam) {
        matchedTeam = this.teams.find((t) => {
          this.ensureMemberPassIds(t);
          const tId = (t.id || '').toLowerCase();
          const tPass = (t.ticketPassId || '').toLowerCase();
          return tokens.some((tok) => tok === tId || tok === tPass);
        });
      }
    }

    if (!matchedTeam) {
      return { success: false, message: `No registered team or member matching '${query}' was found.` };
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (matchedMember) {
      // Individual Member Attendance Update
      matchedMember.checkInStatus = status;
      matchedMember.checkInTimestamp = status === 'checked_in' ? timestamp : undefined;

      const checkedInMembersCount = (matchedTeam.members || []).filter((m) => m.checkInStatus === 'checked_in').length;
      const minRequiredMembers = Math.min(2, (matchedTeam.members || []).length || 1);
      const isTeamQualified = checkedInMembersCount >= minRequiredMembers;

      matchedTeam.attendanceStatus = isTeamQualified ? 'checked_in' : 'not_checked_in';
      matchedTeam.checkInTimestamp = checkedInMembersCount > 0 ? (matchedTeam.checkInTimestamp || timestamp) : undefined;
    } else {
      // Full Team Attendance Update
      (matchedTeam.members || []).forEach((m) => {
        m.checkInStatus = status;
        m.checkInTimestamp = status === 'checked_in' ? timestamp : undefined;
      });
      matchedTeam.attendanceStatus = status;
      matchedTeam.checkInTimestamp = status === 'checked_in' ? timestamp : undefined;
    }

    this.saveToStorage();
    this.notifyListeners();
    await this.syncTeamToFirestore(matchedTeam);

    const msg = matchedMember
      ? `Member '${matchedMember.name}' (${matchedMember.memberPassId || matchedMember.role}) marked ${status.toUpperCase()}!`
      : `Team '${matchedTeam.teamName}' (All ${matchedTeam.members.length} members) marked ${status.toUpperCase()}!`;

    return { success: true, team: matchedTeam, matchedMember, message: msg };
  }

  public async markMealRedeemed(
    query: string,
    mealType: MealType,
    memberQueryOrId?: string
  ): Promise<{ success: boolean; team?: TeamRegistration; matchedMember?: TeamMember; message?: string }> {
    const clean = query.trim().toLowerCase();
    const cleanMember = (memberQueryOrId || '').trim().toLowerCase();
    if (!clean && !cleanMember) return { success: false, message: 'Invalid food coupon QR code or pass ID.' };

    let matchedMember: TeamMember | undefined = undefined;

    const team = this.teams.find((t) => {
      this.ensureMemberPassIds(t);

      // FIRST: Check if any member matches cleanMember or clean
      const foundMem = (t.members || []).find(
        (m) =>
          (cleanMember && (
            (m.id && m.id.toLowerCase() === cleanMember) ||
            (m.memberPassId && m.memberPassId.toLowerCase() === cleanMember) ||
            (m.enrollmentNo && m.enrollmentNo.toLowerCase() === cleanMember)
          )) ||
          (clean && (
            (m.id && m.id.toLowerCase() === clean) ||
            (m.memberPassId && m.memberPassId.toLowerCase() === clean) ||
            (m.enrollmentNo && m.enrollmentNo.toLowerCase() === clean)
          ))
      );

      if (foundMem) {
        matchedMember = foundMem;
        return true;
      }

      // SECOND: If no member matched, check if team ID or ticket pass ID matches clean
      if (!cleanMember && clean && (t.id.toLowerCase() === clean || (t.ticketPassId && t.ticketPassId.toLowerCase() === clean))) {
        return true;
      }

      return false;
    });

    if (!team) {
      return { success: false, message: `No participant or team matching pass '${query}' was found.` };
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });

    // Check if already redeemed
    const currentCoupons = matchedMember ? matchedMember.meals || {} : team.meals || {};
    if (currentCoupons[mealType]?.redeemed) {
      const prevRedeemedAt = currentCoupons[mealType]?.redeemedAt || 'earlier';
      return {
        success: false,
        team,
        matchedMember,
        message: `🛑 ALREADY SERVED! ${matchedMember ? matchedMember.name : team.teamName} has ALREADY redeemed ${mealType.replace('_', ' ').toUpperCase()} on ${prevRedeemedAt}.`,
      };
    }

    // Mark redeemed
    const redemptionRecord = {
      redeemed: true,
      redeemedAt: timestamp,
      redeemedByAdmin: 'Cognitia Admin',
    };

    if (matchedMember) {
      if (!matchedMember.meals) matchedMember.meals = {};
      matchedMember.meals[mealType] = redemptionRecord;
    } else {
      if (!team.meals) team.meals = {};
      team.meals[mealType] = redemptionRecord;
      // Also mark meal served for all present members of the team (just like full team attendance check-in!)
      (team.members || []).forEach((m) => {
        if (m.checkInStatus === 'checked_in') {
          if (!m.meals) m.meals = {};
          m.meals[mealType] = redemptionRecord;
        }
      });
    }

    this.saveToStorage();
    this.notifyListeners();
    await this.syncTeamToFirestore(team);

    const mealName =
      mealType === 'day1_dinner'
        ? 'Day 1 Dinner'
        : mealType === 'day1_snacks'
          ? 'Day 1 Late Night Snacks'
          : mealType === 'day2_breakfast'
            ? 'Day 2 Breakfast'
            : 'Day 2 Lunch';

    const checkedInCount = (team.members || []).filter((m) => m.checkInStatus === 'checked_in').length;

    const successMsg = matchedMember
      ? `✅ MEAL SERVED! ${mealName} marked REDEEMED for '${matchedMember.name}' (${team.teamName}) at ${timestamp}.`
      : `✅ MEAL SERVED! ${mealName} marked REDEEMED for Team '${team.teamName}' (${checkedInCount} present members) at ${timestamp}.`;

    return { success: true, team, matchedMember, message: successMsg };
  }

  public async toggleMealRedemption(
    query: string,
    mealType: MealType
  ): Promise<{ success: boolean; team?: TeamRegistration; matchedMember?: TeamMember; message?: string }> {
    const clean = query.trim().toLowerCase();
    if (!clean) return { success: false, message: 'Invalid pass ID.' };

    let matchedMember: TeamMember | undefined = undefined;

    const team = this.teams.find((t) => {
      this.ensureMemberPassIds(t);

      // FIRST: Check if any member matches clean
      const foundMem = (t.members || []).find(
        (m) =>
          (m.id && m.id.toLowerCase() === clean) ||
          (m.memberPassId && m.memberPassId.toLowerCase() === clean) ||
          (m.enrollmentNo && m.enrollmentNo.toLowerCase() === clean)
      );

      if (foundMem) {
        matchedMember = foundMem;
        return true;
      }

      // SECOND: If no member matched, check if team ID or ticket pass ID matches clean
      if (t.id.toLowerCase() === clean || (t.ticketPassId && t.ticketPassId.toLowerCase() === clean)) {
        return true;
      }

      return false;
    });

    if (!team) return { success: false, message: 'Team or member not found.' };

    const currentMeals = matchedMember ? matchedMember.meals || {} : team.meals || {};
    const isCurrentlyRedeemed = !!currentMeals[mealType]?.redeemed;

    if (isCurrentlyRedeemed) {
      if (matchedMember) {
        if (matchedMember.meals) delete matchedMember.meals[mealType];
      } else {
        if (team.meals) delete team.meals[mealType];
        (team.members || []).forEach((m) => {
          if (m.meals) delete m.meals[mealType];
        });
      }
    } else {
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
      const record = { redeemed: true, redeemedAt: timestamp, redeemedByAdmin: 'Cognitia Admin' };
      if (matchedMember) {
        if (!matchedMember.meals) matchedMember.meals = {};
        matchedMember.meals[mealType] = record;
      } else {
        if (!team.meals) team.meals = {};
        team.meals[mealType] = record;
        (team.members || []).forEach((m) => {
          if (m.checkInStatus === 'checked_in') {
            if (!m.meals) m.meals = {};
            m.meals[mealType] = record;
          }
        });
      }
    }

    this.saveToStorage();
    this.notifyListeners();
    await this.syncTeamToFirestore(team);

    return {
      success: true,
      team,
      matchedMember,
      message: isCurrentlyRedeemed
        ? `Meal '${mealType.replace('_', ' ')}' unmarked for ${matchedMember ? matchedMember.name : team.teamName + ' (All members)'}.`
        : `Meal '${mealType.replace('_', ' ')}' marked SERVED for ${matchedMember ? matchedMember.name : team.teamName + ' (All present members)'}.`,
    };
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

export interface TrackProblemStatement {
  trackId: string;
  trackName: string;
  psCode: string;
  title: string;
  tagline: string;
  bounty: string;
  objective: string;
  detailedDescription: string;
  trackDescription?: string;
  description?: string;
  requirements: string[];
  deliverables: string[];
}

export const TRACK_PROBLEM_STATEMENTS: Record<string, TrackProblemStatement> = {
  'nlp-cv': {
    trackId: 'nlp-cv',
    trackName: 'Natural Language Processing & Computer Vision',
    psCode: 'PS-TEST-NLP-01',
    title: '[GENERIC TEST PS] NLP & Multi-Modal Computer Vision Challenge',
    tagline: 'Generic Sample Problem Statement for Testing Purpose',
    bounty: '₹2,000 Special Bounty',
    objective: 'This is a generic test problem statement for the NLP & Computer Vision track. Official problem statements will be revealed on the day of the hackathon.',
    detailedDescription: 'Generic Test Challenge: Build a prototype multi-modal application integrating natural language understanding (e.g. document extraction or chat interface) with computer vision (e.g. image/video classification or OCR). This placeholder is provided for development and UI testing.',
    trackDescription: 'LLM Architectures, Multi-Modal Vision & Speech Processing',
    description: 'Generic Test Challenge: Build a prototype multi-modal application integrating natural language understanding with computer vision.',
    requirements: [
      'Implement multi-modal data processing (Text, PDF, or Image/Video)',
      'Build a functional model inference pipeline or UI integration',
      'Provide real-time visualization of predictions and extraction outputs',
    ],
    deliverables: [
      'GitHub source code repository',
      'Interactive prototype demonstration UI',
    ],
  },
  'blockchain-cybersecurity': {
    trackId: 'blockchain-cybersecurity',
    trackName: 'Blockchain and Cybersecurity',
    psCode: 'PS-TEST-BLK-02',
    title: '[GENERIC TEST PS] Decentralized Trust & Cyber Defense Challenge',
    tagline: 'Generic Sample Problem Statement for Testing Purpose',
    bounty: '₹2,000 Special Bounty',
    objective: 'This is a generic test problem statement for the Blockchain & Cybersecurity track. Official problem statements will be revealed on the day of the hackathon.',
    detailedDescription: 'Generic Test Challenge: Design a decentralized ledger component or security audit application (e.g. smart contract vulnerability scanner or threat log verification). This placeholder is provided for development and UI testing.',
    trackDescription: 'Decentralized Ledgers, Zero-Trust Defense & Cryptography',
    description: 'Generic Test Challenge: Design a decentralized ledger component or security audit application.',
    requirements: [
      'Implement a smart contract or secure cryptographic protocol module',
      'Build a threat monitoring or contract audit analysis interface',
      'Demonstrate secure data verification or zero-trust logging',
    ],
    deliverables: [
      'GitHub source code repository with smart contracts / security scripts',
      'Interactive Web UI demonstration',
    ],
  },
  'geospatial-intelligence': {
    trackId: 'geospatial-intelligence',
    trackName: 'Geospatial Predictive Intelligence',
    psCode: 'PS-TEST-GEO-03',
    title: '[GENERIC TEST PS] GIS Telemetry & Spatial Analytics Challenge',
    tagline: 'Generic Sample Problem Statement for Testing Purpose',
    bounty: '₹2,000 Special Bounty',
    objective: 'This is a generic test problem statement for the Geospatial Predictive Intelligence track. Official problem statements will be revealed on the day of the hackathon.',
    detailedDescription: 'Generic Test Challenge: Build an interactive GIS web application that processes spatial datasets (GeoJSON/Shapefiles) and displays predictive heatmaps or spatial routing calculations. This placeholder is provided for development and UI testing.',
    trackDescription: 'GIS Data Analytics, Spatial Modeling & Remote Sensing AI',
    description: 'Generic Test Challenge: Build an interactive GIS web application that processes spatial datasets and displays predictive heatmaps.',
    requirements: [
      'Ingest and visualize spatial or map coordinate datasets',
      'Implement spatial analytics or hazard scoring logic',
      'Interactive Map UI canvas with layer controls',
    ],
    deliverables: [
      'GitHub source code repository',
      'Interactive GIS Web application demo',
    ],
  },
  'ai-autonomous-systems': {
    trackId: 'ai-autonomous-systems',
    trackName: 'AI Autonomous Systems',
    psCode: 'PS-TEST-AUT-04',
    title: '[GENERIC TEST PS] Multi-Agent Autonomous Swarm Challenge',
    tagline: 'Generic Sample Problem Statement for Testing Purpose',
    bounty: '₹2,000 Special Bounty',
    objective: 'This is a generic test problem statement for the AI Autonomous Systems track. Official problem statements will be revealed on the day of the hackathon.',
    detailedDescription: 'Generic Test Challenge: Develop a multi-agent coordination simulator where autonomous agents communicate, allocate tasks, and dynamically navigate simulated obstacles. This placeholder is provided for development and UI testing.',
    trackDescription: 'Robotics, Multi-Agent Swarms & Automated Decision Engines',
    description: 'Generic Test Challenge: Develop a multi-agent coordination simulator where autonomous agents communicate and allocate tasks.',
    requirements: [
      'Define autonomous agent behaviors and task negotiation rules',
      'Build a simulation engine or pathfinding logic',
      'Visual Dashboard HUD showing live agent state and message logs',
    ],
    deliverables: [
      'GitHub source code repository with simulation engine',
      'Visual Agent Telemetry Dashboard',
    ],
  },
  'fintech': {
    trackId: 'fintech',
    trackName: 'FinTech',
    psCode: 'PS-TEST-FIN-05',
    title: '[GENERIC TEST PS] Financial Fraud Scoring & Settlement Ledger Challenge',
    tagline: 'Generic Sample Problem Statement for Testing Purpose',
    bounty: '₹2,000 Special Bounty',
    objective: 'This is a generic test problem statement for the FinTech track. Official problem statements will be revealed on the day of the hackathon.',
    detailedDescription: 'Generic Test Challenge: Architect a real-time transaction processing service that detects anomalous transactions and updates a micro-settlement ledger. This placeholder is provided for development and UI testing.',
    trackDescription: 'Algorithmic Payments, Fraud Intelligence & Automated Trading',
    description: 'Generic Test Challenge: Architect a real-time transaction processing service that detects anomalous transactions.',
    requirements: [
      'Simulate high-frequency transaction stream ingestion',
      'Implement anomaly detection or fraud rule scoring logic',
      'Real-time FinTech Analyst Dashboard displaying transaction feed and alerts',
    ],
    deliverables: [
      'GitHub source code repository',
      'Interactive Financial Analytics Dashboard UI',
    ],
  },
};

export interface TeamTrackSlotAllocation {
  isQualified: boolean;
  checkedCount: number;
  totalMembers: number;
  qualifiedAt?: string;
  assignedTrackName: string;
  assignedTrackId: string;
  slotNumber: number;
  maxSlots: number;
  problemStatement?: TrackProblemStatement;
  isOverridden?: boolean;
}

export function calculateFcfsTrackAllocations(teams: TeamRegistration[]): Map<string, TeamTrackSlotAllocation> {
  const result = new Map<string, TeamTrackSlotAllocation>();
  const MAX_SLOTS_PER_TRACK = 4;

  const qualifiedTeamsList: {
    team: TeamRegistration;
    checkedCount: number;
    totalMembers: number;
    qualifiedAt: string;
  }[] = [];

  const unqualifiedTeamsList: TeamRegistration[] = [];

  teams.forEach((t) => {
    const mems = t.members || [];
    const checkedMems = mems.filter((m) => m.checkInStatus === 'checked_in');
    const checkedCount = checkedMems.length;
    const totalMembers = mems.length;
    const isQualified = checkedCount >= 2;

    if (isQualified) {
      const sortedCheckInTimes = checkedMems
        .map((m) => m.checkInTimestamp || t.registeredAt || new Date().toISOString())
        .sort();
      const qualifiedAt = sortedCheckInTimes[1] || sortedCheckInTimes[0] || t.registeredAt || new Date().toISOString();

      qualifiedTeamsList.push({
        team: t,
        checkedCount,
        totalMembers,
        qualifiedAt,
      });
    } else {
      unqualifiedTeamsList.push(t);
    }
  });

  qualifiedTeamsList.sort((a, b) => a.qualifiedAt.localeCompare(b.qualifiedAt));

  const trackSlotCounts: Record<string, number> = {};

  qualifiedTeamsList.forEach((q) => {
    const { team, checkedCount, totalMembers, qualifiedAt } = q;

    let isOverridden = false;
    let assignedTrackName = team.adminTrackOverride || '';
    let matchedTrackObj = Object.values(TRACK_PROBLEM_STATEMENTS).find(
      (p) => p.trackName.toLowerCase() === assignedTrackName.toLowerCase() || p.trackId.toLowerCase() === assignedTrackName.toLowerCase()
    );

    if (matchedTrackObj) {
      isOverridden = true;
    }

    if (!matchedTrackObj && team.trackPreferences && team.trackPreferences.length > 0) {
      for (const pref of team.trackPreferences) {
        if (!pref) continue;
        const trackObj = Object.values(TRACK_PROBLEM_STATEMENTS).find(
          (p) => p.trackName.toLowerCase() === pref.toLowerCase() || p.trackId.toLowerCase() === pref.toLowerCase()
        );
        if (trackObj) {
          const currentCount = trackSlotCounts[trackObj.trackId] || 0;
          if (currentCount < MAX_SLOTS_PER_TRACK) {
            matchedTrackObj = trackObj;
            break;
          }
        }
      }
    }

    if (!matchedTrackObj) {
      matchedTrackObj = Object.values(TRACK_PROBLEM_STATEMENTS).find(
        (p) => (trackSlotCounts[p.trackId] || 0) < MAX_SLOTS_PER_TRACK
      ) || Object.values(TRACK_PROBLEM_STATEMENTS)[0];
    }

    const trackId = matchedTrackObj.trackId;
    const currentCount = (trackSlotCounts[trackId] || 0) + 1;
    trackSlotCounts[trackId] = currentCount;

    result.set(team.id, {
      isQualified: true,
      checkedCount,
      totalMembers,
      qualifiedAt,
      assignedTrackName: matchedTrackObj.trackName,
      assignedTrackId: matchedTrackObj.trackId,
      slotNumber: currentCount,
      maxSlots: MAX_SLOTS_PER_TRACK,
      problemStatement: matchedTrackObj,
      isOverridden,
    });
  });

  unqualifiedTeamsList.forEach((t) => {
    const mems = t.members || [];
    const checkedCount = mems.filter((m) => m.checkInStatus === 'checked_in').length;
    const totalMembers = mems.length;

    const firstPref = t.adminTrackOverride || (t.trackPreferences && t.trackPreferences[0]) || t.selectedTrack || 'Natural Language Processing & Computer Vision';
    const matchedTrackObj = Object.values(TRACK_PROBLEM_STATEMENTS).find(
      (p) => p.trackName.toLowerCase() === firstPref.toLowerCase() || p.trackId.toLowerCase() === firstPref.toLowerCase()
    ) || Object.values(TRACK_PROBLEM_STATEMENTS)[0];

    result.set(t.id, {
      isQualified: false,
      checkedCount,
      totalMembers,
      assignedTrackName: matchedTrackObj.trackName,
      assignedTrackId: matchedTrackObj.trackId,
      slotNumber: 0,
      maxSlots: MAX_SLOTS_PER_TRACK,
      problemStatement: matchedTrackObj,
    });
  });

  return result;
}

export function getTrackSlotAvailability(teams: TeamRegistration[]): Record<string, { trackId: string; trackName: string; assignedCount: number; maxSlots: number; remainingSlots: number }> {
  const MAX_SLOTS_PER_TRACK = 4;
  const availability: Record<string, { trackId: string; trackName: string; assignedCount: number; maxSlots: number; remainingSlots: number }> = {};

  Object.values(TRACK_PROBLEM_STATEMENTS).forEach((ps) => {
    availability[ps.trackId] = {
      trackId: ps.trackId,
      trackName: ps.trackName,
      assignedCount: 0,
      maxSlots: MAX_SLOTS_PER_TRACK,
      remainingSlots: MAX_SLOTS_PER_TRACK,
    };
  });

  (teams || []).forEach((t) => {
    const assignedTrack = t.adminTrackOverride || t.selectedTrack;
    if (assignedTrack) {
      const matched = Object.values(TRACK_PROBLEM_STATEMENTS).find(
        (ps) => ps.trackName.toLowerCase() === assignedTrack.toLowerCase() || ps.trackId.toLowerCase() === assignedTrack.toLowerCase()
      );
      if (matched && availability[matched.trackId]) {
        availability[matched.trackId].assignedCount += 1;
        availability[matched.trackId].remainingSlots = Math.max(0, MAX_SLOTS_PER_TRACK - availability[matched.trackId].assignedCount);
      }
    }
  });

  return availability;
}

export const firebaseService = new FirebaseService();

