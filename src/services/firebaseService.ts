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

class FirebaseService {
  private teams: TeamRegistration[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      // Import/Migrate legacy AWS keys if present, then purge them
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

      // Purge legacy storage keys
      localStorage.removeItem('cognitia_aws_teams_v1');
      localStorage.removeItem('cognitia_aws_teams_v2');
      localStorage.removeItem('cognitia_lead_session_v1');
    } catch {
      this.teams = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(this.teams));
    } catch (e) {
      console.warn('Failed to save to local storage', e);
    }
  }

  // Google Cloud Storage / Firebase Storage Upload Layer
  public async uploadFileToGCS(
    file: File,
    folder: 'ppts' | 'screenshots' | 'payments'
  ): Promise<{ url: string; fileName: string }> {
    return new Promise((resolve, reject) => {
      const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB limit
      if (folder === 'payments' && file.size > MAX_FILE_SIZE_BYTES) {
        reject(new Error(`FILE_TOO_LARGE: Image size ${(file.size / (1024 * 1024)).toFixed(2)} MB exceeds 1 MB limit.`));
        return;
      }

      const bucket = (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || 'cognitia-2026.appspot.com';
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const gcsPath = `submissions/${folder}/${Date.now()}_${sanitizedName}`;
      console.log(`[Google Cloud Storage Upload] Target bucket: gs://${bucket}/${gcsPath}`);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const rawUrl = e.target?.result as string;
          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 800;
              const MAX_HEIGHT = 800;
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
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
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

  // Alias for backward compatibility if needed
  public async uploadFileToFirebaseStorage(
    file: File,
    folder: 'ppts' | 'screenshots' | 'payments'
  ): Promise<{ url: string; fileName: string }> {
    return this.uploadFileToGCS(file, folder);
  }

  // Check if an email address is already registered across any team or team member
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

  // Check if a GitHub handle is already registered across any team or team member
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

  // Team Lead Authentication & Registration
  public async registerTeamLead(data: {
    teamName: string;
    leadEmail: string;
    leadPhone: string;
    passwordHash: string;
    leadGitHubId: string;
    leadName: string;
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
      attendanceStatus: 'not_checked_in',
      members: [
        {
          id: `mem-lead-${Date.now()}`,
          name: data.leadName || 'Team Lead',
          email: cleanEmail,
          phone: data.leadPhone,
          role: 'Team Lead',
          githubId: cleanGitHub,
          isLead: true,
        },
      ],
    };

    this.teams.unshift(newTeam);
    this.saveToStorage();
    this.setLeadSession(newTeam.id);

    return { success: true, team: newTeam };
  }

  public async loginTeamLead(
    email: string,
    passwordHash: string
  ): Promise<{ success: boolean; team?: TeamRegistration; message?: string }> {
    const team = this.teams.find(
      (t) => t.leadEmail.toLowerCase() === email.trim().toLowerCase()
    );

    if (!team) {
      return { success: false, message: 'No registered team found with this email address.' };
    }

    if (team.leadPasswordHash && team.leadPasswordHash !== passwordHash) {
      return { success: false, message: 'Invalid password. Please check your credentials.' };
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

    this.teams[index].teamName = teamName;
    this.teams[index].members = members;
    if (isMembersLocked !== undefined) {
      this.teams[index].isMembersLocked = isMembersLocked;
    }
    this.saveToStorage();

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
    return { success: true, team };
  }

  public async confirmRsvp(teamId: string): Promise<{ success: boolean; team?: TeamRegistration }> {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) return { success: false };

    team.rsvpConfirmed = true;
    this.saveToStorage();
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

    return { success: true, team, ticketId };
  }

  public async markAttendance(
    query: string,
    status: AttendanceStatus
  ): Promise<{ success: boolean; team?: TeamRegistration; message?: string }> {
    const clean = query.trim().toLowerCase();
    if (!clean) return { success: false, message: 'Please enter a valid Pass Ticket ID or Team ID.' };

    const team = this.teams.find(
      (t) =>
        t.id.toLowerCase() === clean ||
        (t.ticketPassId && t.ticketPassId.toLowerCase() === clean)
    );

    if (!team) {
      return { success: false, message: `No registered team matching Ticket/ID '${query}' was found.` };
    }

    team.attendanceStatus = status;
    team.checkInTimestamp = status === 'checked_in' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;
    this.saveToStorage();

    return { success: true, team };
  }

  public getAllRegistrations(): TeamRegistration[] {
    return [...this.teams];
  }

  public clearAllData(): void {
    this.teams = [];
    try {
      localStorage.removeItem(STORAGE_KEY_TEAMS);
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } catch {
      // Ignore storage errors
    }
  }
}

export const firebaseService = new FirebaseService();
