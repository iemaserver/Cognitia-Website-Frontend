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
const STORAGE_KEY_PS_REVEAL = 'cognitia_ps_reveal_v1';

type TeamsChangeListener = (teams: TeamRegistration[]) => void;

class FirebaseService {
  private teams: TeamRegistration[] = [];
  private listeners: TeamsChangeListener[] = [];
  private isFirestoreConnected: boolean = false;
  private activeMealSession: MealType | 'none' = 'none';
  private mealSessionListeners: ((session: MealType | 'none') => void)[] = [];
  private isPsRevealed: boolean = false;
  private psRevealListeners: ((isRevealed: boolean) => void)[] = [];

  constructor() {
    this.loadFromStorage();
    this.initFirestoreSync();
    this.initMealSessionSync();
    this.initPsRevealSync();
  }

  private initPsRevealSync() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PS_REVEAL);
      if (stored !== null) {
        this.isPsRevealed = stored === 'true';
      }
    } catch {
      // Ignore
    }

    if (!db) return;

    try {
      const docRef = doc(db, 'system_config', 'ps_reveal');
      onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && typeof data.isPsRevealed === 'boolean') {
            this.isPsRevealed = data.isPsRevealed;
            try {
              localStorage.setItem(STORAGE_KEY_PS_REVEAL, String(this.isPsRevealed));
            } catch {
              // Ignore
            }
            this.notifyPsRevealListeners();
          }
        }
      });
    } catch (e) {
      console.warn('[FirebaseService] PS reveal sync error:', e);
    }
  }

  private notifyPsRevealListeners() {
    this.psRevealListeners.forEach((l) => {
      try {
        l(this.isPsRevealed);
      } catch (err) {
        console.error('[FirebaseService] PS reveal listener error:', err);
      }
    });
  }

  public subscribeToPsReveal(listener: (isRevealed: boolean) => void): () => void {
    this.psRevealListeners.push(listener);
    listener(this.isPsRevealed);
    return () => {
      this.psRevealListeners = this.psRevealListeners.filter((l) => l !== listener);
    };
  }

  public getIsPsRevealed(): boolean {
    return this.isPsRevealed;
  }

  public async setPsRevealedStatus(revealed: boolean): Promise<{ success: boolean; isPsRevealed: boolean }> {
    this.isPsRevealed = revealed;
    try {
      localStorage.setItem(STORAGE_KEY_PS_REVEAL, String(revealed));
    } catch {
      // Ignore
    }
    this.notifyPsRevealListeners();

    if (db) {
      try {
        const docRef = doc(db, 'system_config', 'ps_reveal');
        await setDoc(docRef, { isPsRevealed: revealed, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (e) {
        console.warn('[FirebaseService] Failed to sync PS reveal status to Firestore:', e);
      }
    }

    return { success: true, isPsRevealed: revealed };
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

export interface OfficialProblemStatementDetail {
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
  problemStatements?: OfficialProblemStatementDetail[];
}

export const OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK: Record<string, OfficialProblemStatementDetail[]> = {
  'nlp-cv': [
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
        'Natural language queries: Answer complex natural language queries on an integrated crime scene reconstruction, for example "show witness A\'s estimate of the perpetrator\'location at noon", and return appropriately filtered information from the model.',
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
  'blockchain-cybersecurity': [
    {
      psCode: 'BLOCKCHAIN-PS1',
      psNumber: 'PS1',
      title: 'Bridge Guard: A Robust and Secure Cross-Chain Bridging System',
      background:
        'Cross-chain bridges have become a critical but highly vulnerable component of the cryptocurrency ecosystem. A history of significant exploits, including those at Ronin, Wormhole, Nomad, and Poly Network, has resulted in the loss of billions of dollars. These attacks are often facilitated by vulnerabilities in smart contracts, compromise of validator keys or multisig infrastructure, or manipulation of market prices and liquidity. Critically, bridges are typically drained within minutes, far outpacing the response time of any human governance mechanism. The challenge of blockchain interoperability is defined by four key areas: Technology, Functionality, Security, and Standardization.',
      problemStatement:
        'We propose to design and build Bridge Guard, a system that addresses cross-chain vulnerabilities by implementing a resilient bridge between heterogeneous chains, supporting programmable transfers, strict finality, multi-approach validation, independent monitoring, and autonomous on-chain pausing.',
      vulnerabilityTesting:
        'To rigorously test Bridge Guard, introduce at least two seeded, demo-safe vulnerabilities (e.g., signature replay, missing nonce checks, finality-window bypasses, or price-oracle manipulation). The system must detect these vulnerabilities, trigger a circuit-breaker pause, and mitigate the attack end-to-end.',
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
  'geospatial-intelligence': [
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
  'ai-autonomous-systems': [
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
  'fintech': [
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
};

export function getOfficialProblemStatementsForTrack(trackNameOrId: string): OfficialProblemStatementDetail[] {
  const normalized = (trackNameOrId || '').toLowerCase().trim();
  if (normalized.includes('nlp') || normalized.includes('vision') || normalized.includes('cv')) {
    return OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['nlp-cv'];
  }
  if (normalized.includes('blockchain') || normalized.includes('cyber') || normalized.includes('security')) {
    return OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['blockchain-cybersecurity'];
  }
  if (normalized.includes('geospatial') || normalized.includes('gis') || normalized.includes('spatial')) {
    return OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['geospatial-intelligence'];
  }
  if (normalized.includes('autonomous') || normalized.includes('agent') || normalized.includes('swarm') || normalized.includes('robot')) {
    return OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['ai-autonomous-systems'];
  }
  if (normalized.includes('fintech') || normalized.includes('financial') || normalized.includes('market')) {
    return OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['fintech'];
  }
  return OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['nlp-cv'];
}

export const TRACK_PROBLEM_STATEMENTS: Record<string, TrackProblemStatement> = {
  'nlp-cv': {
    trackId: 'nlp-cv',
    trackName: 'Natural Language Processing & Computer Vision',
    psCode: 'NLP-CV-PS1 / PS2',
    title: 'NLP & Computer Vision (PS1: 3D Crime Scene Twin | PS2: Low-Vision Hazard Assist)',
    tagline: '3D Digital Twin Crime Scene Reconstruction & Autonomous Low-Vision Mobility Assist',
    bounty: '₹2,000 Special Bounty',
    objective: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['nlp-cv'][0].problemStatement,
    detailedDescription: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['nlp-cv'][0].context || '',
    trackDescription: '3D Scene Reconstruction, Multimodal Witness Fusion & Low-Vision Hazard Alerting',
    description: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['nlp-cv'][0].problemStatement,
    requirements: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['nlp-cv'][0].requirements,
    deliverables: [
      'Hosted Live Demo Application (Mandatory GitHub Actions Deployment)',
      'Source Code Repository with full documentation and reproducible benchmarks',
    ],
    problemStatements: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['nlp-cv'],
  },
  'blockchain-cybersecurity': {
    trackId: 'blockchain-cybersecurity',
    trackName: 'Blockchain and Cybersecurity',
    psCode: 'BLOCKCHAIN-PS1 / PS2',
    title: 'Blockchain & Cybersecurity (PS1: Bridge Guard | PS2: Pre-Execution Wallet Defense)',
    tagline: 'Resilient Cross-Chain Bridges & Pre-Execution Transaction Defense',
    bounty: '₹2,000 Special Bounty',
    objective: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['blockchain-cybersecurity'][0].problemStatement,
    detailedDescription: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['blockchain-cybersecurity'][0].background || '',
    trackDescription: 'Zero-Trust Infrastructure, Cross-Chain Circuit Breakers & Malicious Signature Simulation',
    description: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['blockchain-cybersecurity'][0].problemStatement,
    requirements: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['blockchain-cybersecurity'][0].requirements,
    deliverables: [
      'Hosted Live Demo Application (Mandatory GitHub Actions Deployment)',
      'Deployed Smart Contracts / Transaction Interceptor Extension Demo',
    ],
    problemStatements: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['blockchain-cybersecurity'],
  },
  'geospatial-intelligence': {
    trackId: 'geospatial-intelligence',
    trackName: 'Geospatial Predictive Intelligence',
    psCode: 'GEOSPATIAL-PS1 / PS2',
    title: 'Geospatial Intelligence (PS1: Crop Water Stress Engine | PS2: Highway Landslide Warning)',
    tagline: 'Physics-Based Crop Water Stress & Highway Landslide Early Warning',
    bounty: '₹2,000 Special Bounty',
    objective: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['geospatial-intelligence'][0].problemStatement,
    detailedDescription: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['geospatial-intelligence'][0].background || '',
    trackDescription: 'GIS Remote Sensing, Physics Soil-Water Balance & Slope Stability Hydrology',
    description: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['geospatial-intelligence'][0].problemStatement,
    requirements: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['geospatial-intelligence'][0].requirements,
    deliverables: [
      'Hosted Live Demo Map Dashboard (Mandatory GitHub Actions Deployment)',
      'Physics-Based Modeling Code & Interactive GIS Map Dashboard',
    ],
    problemStatements: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['geospatial-intelligence'],
  },
  'ai-autonomous-systems': {
    trackId: 'ai-autonomous-systems',
    trackName: 'AI Autonomous Systems',
    psCode: 'AUTONOMOUS-PS1 / PS2',
    title: 'AI Autonomous Systems (PS1: AI Persona Swarms | PS2: Agent Tool Runtime Firewall)',
    tagline: 'Autonomous AI Persona Market Swarms & Agent Tool Security Firewalls',
    bounty: '₹2,000 Special Bounty',
    objective: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['ai-autonomous-systems'][0].problemStatement,
    detailedDescription: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['ai-autonomous-systems'][0].background || '',
    trackDescription: 'Agent Swarm Orchestration, Strategy Search & MCP Runtime Firewall',
    description: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['ai-autonomous-systems'][0].problemStatement,
    requirements: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['ai-autonomous-systems'][0].requirements,
    deliverables: [
      'Hosted Live Demo Application (Mandatory GitHub Actions Deployment)',
      'Persona Simulation Engine / MCP Firewall Verification Engine',
    ],
    problemStatements: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['ai-autonomous-systems'],
  },
  'fintech': {
    trackId: 'fintech',
    trackName: 'FinTech',
    psCode: 'FINTECH-PS1 / PS2',
    title: 'FinTech (PS1: Intraday Collateral Optimizer | PS2: APP Fraud Mule Tracer)',
    tagline: 'Real-Time Intraday Cash/Collateral Optimizer & Real-Time APP Fraud Interceptor',
    bounty: '₹2,000 Special Bounty',
    objective: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['fintech'][0].problemStatement,
    detailedDescription: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['fintech'][0].background || '',
    trackDescription: 'Intraday Liquidity Optimization & In-Flight APP Fraud Mule Chain Interception',
    description: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['fintech'][0].problemStatement,
    requirements: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['fintech'][0].requirements,
    deliverables: [
      'Hosted Live Demo Application (Mandatory GitHub Actions Deployment)',
      'Real-Time Optimization Engine & Fraud Scoring Analyst HUD',
    ],
    problemStatements: OFFICIAL_PROBLEM_STATEMENTS_BY_TRACK['fintech'],
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

