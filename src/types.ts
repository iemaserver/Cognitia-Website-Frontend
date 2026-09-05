export type CartridgeId =
  | 'dashboard'
  | 'rules'
  | 'tracks'
  | 'timeline'
  | 'sponsors'
  | 'members'
  | 'prizes'
  | 'faq'
  | 'register'
  | 'login'
  | 'admin';

export type BadgeTone = 'orange' | 'white' | 'red';

export interface Cartridge {
  id: CartridgeId;
  title: string;
  code: string;
  romSize: string;
  genre: string;
  iconName: string;
  description: string;
}

export interface BootStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'ok' | 'fail';
  timestamp?: string;
}

export interface TrackItem {
  id: string;
  title: string;
  bounty: string;
  tag: string;
  description: string;
  requirements: string[];
  color: string;
}

export interface TimelineEvent {
  time: string;
  date: string;
  title: string;
  type: 'milestone' | 'keynote' | 'deadline' | 'workshop';
  status: 'completed' | 'current' | 'upcoming';
  desc: string;
}

export interface SponsorItem {
  tier: 'TITANIUM' | 'GOLD' | 'COMMUNITY' | 'POWERED BY';
  name: string;
  perk: string;
  badge: string;
  credits: string;
}

export interface MemberItem {
  name: string;
  role: string;
  handle: string;
  avatarBg: string;
  badge: string;
}

export interface PrizeItem {
  place: string;
  amount: string;
  category: string;
  iconColor: string;
  perks: string[];
}

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export type Phase2SelectionStatus = 'pending' | 'selected' | 'waitlisted' | 'not_selected';
export type Phase2PaymentStatus = 'unpaid' | 'payment_pending' | 'payment_verified';
export type AttendanceStatus = 'not_checked_in' | 'checked_in';

export type MealType = 'day1_dinner' | 'day1_snacks' | 'day2_breakfast' | 'day2_lunch';

export interface MealRedemptionRecord {
  redeemed: boolean;
  redeemedAt?: string;
  redeemedByAdmin?: string;
}

export type MemberMealCoupons = Partial<Record<MealType, MealRedemptionRecord>>;

export interface MealSessionConfig {
  activeMealSession: MealType | 'none';
  updatedAt?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  githubId: string;
  isLead?: boolean;
  collegeName?: string;
  isIemUemStudent?: boolean;
  enrollmentNo?: string;
  iemcrpScreenshotUrl?: string;
  // Unique Individual Member Pass & Gate Attendance Fields
  memberPassId?: string;
  memberQrCodeUrl?: string;
  checkInStatus?: AttendanceStatus;
  checkInTimestamp?: string;
  // Food Coupons Redemption Records
  meals?: MemberMealCoupons;
}

export interface ProjectSubmission {
  id: string;
  teamId: string;
  projectTitle: string;
  tagline: string;
  trackId?: string;
  githubRepoUrl: string;
  proposedSolution?: string;
  techStackJustification?: string;
  deploymentStrategy?: string;
  pptUrl?: string;
  pptFileName?: string;
  screenshots: string[]; // URLs or Base64 S3 storage
  submittedAt: string;
  updatedAt: string;
}

export interface TeamRegistration {
  id: string;
  teamName: string;
  leadEmail: string;
  leadPhone: string;
  leadPasswordHash?: string;
  members: TeamMember[];
  isMembersLocked?: boolean;
  selectedTrack?: string;
  trackPreferences?: string[];
  isTrackLocked?: boolean;
  trackLockedAt?: string;
  registeredAt: string;
  submission?: ProjectSubmission;
  // IEM / UEM Verification & Fee Exemption Fields
  isIemUemTeam?: boolean;
  phase2FeeAmount?: number;
  iemcrpScreenshotsSubmitted?: boolean;
  iemcrpScreenshotsSubmittedAt?: string;
  // Phase 1 Payment Fields
  paymentStatus?: Phase2PaymentStatus;
  paymentScreenshotUrl?: string;
  paymentTransactionId?: string;
  paymentSubmittedAt?: string;
  // Phase 2 Offline Round Fields
  phase2Status?: Phase2SelectionStatus;
  rsvpConfirmed?: boolean;
  phase2PaymentStatus?: Phase2PaymentStatus;
  phase2PaymentScreenshotUrl?: string;
  phase2PaymentTransactionId?: string;
  phase2PaymentSubmittedAt?: string;
  ticketPassId?: string;
  ticketIssuedAt?: string;
  // Offline Attendance Fields
  attendanceStatus?: AttendanceStatus;
  checkInTimestamp?: string;
  // Food Coupons Redemption Records for Whole Team Pass
  meals?: MemberMealCoupons;
}
