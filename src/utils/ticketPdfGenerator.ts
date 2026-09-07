import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { TeamRegistration, MealType, isIemUemMember, isIemUemAllStudentTeam } from '../types';

/**
 * Generates an official, high-resolution PDF Ticket Pass for Cognitia 2026 participants.
 * Contains full team details, individual member QR codes, roster, locked tracks, schedule, and rules.
 */
export async function createTicketPdfDoc(team: TeamRegistration): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2; // 190mm

  // 1. Generate Gate Check-In QR Code for Team Pass
  const passId = team.ticketPassId || `COGNITIA-2026-PASS-${String(team.id || '').replace(/^team-/, '').toUpperCase()}`;
  const qrPayload = `COGNITIA-2026-PASS:${passId}:${team.id}:${team.teamName}`;
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    margin: 1,
    width: 280,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  // Determine Affiliation
  const isIemTeam = isIemUemAllStudentTeam(team.members);

  // 3. Outer Document Border
  doc.setDrawColor(15, 23, 42); // Slate 900
  doc.setLineWidth(0.7);
  doc.rect(8, 8, 194, 281, 'S');

  doc.setDrawColor(217, 119, 6); // Amber 600
  doc.setLineWidth(0.3);
  doc.rect(9, 9, 192, 279, 'S');

  // 4. Top Banner Header (Dark Navy)
  doc.setFillColor(15, 23, 42);
  doc.rect(10, 10, contentWidth, 25, 'F');

  // Top Title
  doc.setTextColor(245, 158, 11); // Gold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.text('COGNITIA 2026', 15, 20);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('24-HOUR OFFLINE HACKATHON SPRINT  •  OFFICIAL ENTRY PASS', 15, 26);

  doc.setTextColor(186, 230, 253); // Light Sky
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('11–12 SEPTEMBER 2026   |   IEM AEGIS BUILDING, COLLEGE MORE, SALT LAKE SECTOR V, KOLKATA', 15, 31);

  // Top Right Watermark Badge
  doc.setFillColor(30, 41, 59);
  doc.rect(contentWidth - 36, 12, 44, 21, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.3);
  doc.rect(contentWidth - 36, 12, 44, 21, 'S');

  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('OFFICIAL TICKET', contentWidth - 14, 18, { align: 'center' });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('PHASE 2 PASS', contentWidth - 14, 24, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(74, 222, 128);
  doc.text('● VERIFIED ADMIT', contentWidth - 14, 29, { align: 'center' });

  // 5. Main Pass Details Card & Team QR Code
  const cardY = 38;
  const cardH = 50;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.rect(10, cardY, 138, cardH, 'FD');

  // Pass ID Highlight Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.4);
  doc.rect(13, cardY + 3, 132, 14, 'FD');

  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('OFFICIAL TICKET PASS ID:', 16, cardY + 8);

  doc.setTextColor(15, 23, 42);
  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.text(passId, 16, cardY + 14);

  // Team & Contact Metadata
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const teamNameText = `TEAM: ${team.teamName.toUpperCase()}`;
  doc.text(teamNameText, 13, cardY + 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Team ID: ${team.id}   |   Registered: ${team.registeredAt ? new Date(team.registeredAt).toLocaleDateString() : 'Confirmed'}`, 13, cardY + 28);

  const leadMember = team.members.find(m => m.isLead) || team.members[0];
  const leadName = leadMember ? leadMember.name : 'Team Lead';
  doc.text(`Team Lead: ${leadName}  (${team.leadEmail} • ${team.leadPhone})`, 13, cardY + 33);

  // Affiliation & Fee Exemption badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  if (isIemTeam) {
    doc.setTextColor(21, 128, 61); // Green
    doc.text('Affiliation: IEM Salt Lake (100% Free Entry Waiver Approved)', 13, cardY + 39, { maxWidth: 135 });
  } else {
    doc.setTextColor(180, 83, 9); // Amber
    const refText = team.phase2PaymentTransactionId || team.paymentTransactionId ? ` • Ref: ${team.phase2PaymentTransactionId || team.paymentTransactionId}` : '';
    doc.text(`Affiliation: External Institution (Phase 2 Rs. 200 Fee Verified${refText})`, 13, cardY + 39, { maxWidth: 135 });
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  const issuedText = team.ticketIssuedAt ? new Date(team.ticketIssuedAt).toLocaleString() : new Date().toLocaleString();
  doc.text(`Ticket Issue Timestamp: ${issuedText}`, 13, cardY + 45, { maxWidth: 135 });

  // QR Code Box (Right Side - Primary Gate QR)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.4);
  doc.rect(151, cardY, 49, cardH, 'FD');

  doc.addImage(qrDataUrl, 'PNG', 153.5, cardY + 2.5, 44, 40);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TEAM PASS GATE QR', 175.5, cardY + 45.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Scan for Team Gate Entry', 175.5, cardY + 48.5, { align: 'center' });

  // 6. Schedule & Reporting Bar
  const schedY = 91;
  doc.setFillColor(15, 23, 42);
  doc.rect(10, schedY, contentWidth, 18, 'F');

  // 3 Columns inside schedule
  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('GATE CHECK-IN OPENS', 15, schedY + 6);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('03:30 PM IST (Sept 11)', 15, schedY + 11);
  doc.setFontSize(6.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Registration Desk & Badging', 15, schedY + 15);

  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('HACKATHON SPRINT DURATION', 78, schedY + 6);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('5:00 PM (11th) - 1:00 PM (12th)', 78, schedY + 11);
  doc.setFontSize(6.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Non-stop Prototype Sprint', 78, schedY + 15);

  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('VENUE LOCATION', 145, schedY + 6);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('IEM Aegis Building', 145, schedY + 11);
  doc.setFontSize(6.5);
  doc.setTextColor(203, 213, 225);
  doc.text('College More, Salt Lake Sector V, Kolkata', 145, schedY + 15);

  // 7. Track Assignment Section
  const trackY = 112;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(10, trackY, contentWidth, 23, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('OFFICIAL HACKATHON TRACK ASSIGNMENT:', 14, trackY + 5);

  const assignedTrack = team.adminTrackOverride || team.selectedTrack;

  if (assignedTrack) {
    // Assigned Track Box
    doc.setFillColor(254, 243, 199); // Amber light
    doc.setDrawColor(217, 119, 6);
    doc.rect(14, trackY + 7.5, contentWidth - 8, 7, 'FD');

    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`★  OFFICIALLY ASSIGNED TRACK: ${assignedTrack}`, 17, trackY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Track assigned and verified at event attendance gate check-in.`, 14, trackY + 19);
  } else {
    // Pending Track Box
    doc.setFillColor(254, 249, 195);
    doc.setDrawColor(202, 138, 4);
    doc.rect(14, trackY + 7.5, contentWidth - 8, 7, 'FD');

    doc.setTextColor(161, 98, 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`ℹ️  TRACK STATUS: Pending Venue Gate Check-In`, 17, trackY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Admin will assign track based on slot availability when at least 2 team members check in.`, 14, trackY + 19);
  }

  // 8. Team Members Roster Table
  const rosterY = 138;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`ADMITTED TEAM MEMBERS ROSTER (${team.members.length} PARTICIPANTS)`, 10, rosterY);

  // Table Header
  const tableHeaderY = rosterY + 2.5;
  doc.setFillColor(15, 23, 42);
  doc.rect(10, tableHeaderY, contentWidth, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('PARTICIPANT NAME & ROLE', 13, tableHeaderY + 4.8);
  doc.text('CONTACT INFO', 56, tableHeaderY + 4.8);
  doc.text('GITHUB', 96, tableHeaderY + 4.8);
  doc.text('COLLEGE / ENROLLMENT', 123, tableHeaderY + 4.8);
  doc.text('MEMBER PASS ID', 160, tableHeaderY + 4.8);

  let currentY = tableHeaderY + 7;
  const rowHeight = 15.5;

  team.members.forEach((m, idx) => {
    // Zebra striping
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(10, currentY, contentWidth, rowHeight, 'FD');

    // Name & Role
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const nameDisplay = `${idx + 1}. ${m.name} ${m.isLead ? '(LEAD)' : ''}`;
    doc.text(nameDisplay, 13, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.role || (m.isLead ? 'Team Lead' : 'Developer'), 13, currentY + 10);

    // Contact
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(6.5);
    doc.text(m.email || 'N/A', 56, currentY + 5);
    doc.text(m.phone || 'N/A', 56, currentY + 10);

    // GitHub
    doc.setTextColor(3, 105, 161);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.text(m.githubId ? `@${m.githubId}` : 'N/A', 96, currentY + 7.5);

    // College / Enrollment
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    const isMemberIemUem = isIemUemMember(m);
    if (isMemberIemUem) {
      doc.setTextColor(21, 128, 61);
      doc.text('IEM Salt Lake', 123, currentY + 5);
      doc.setFont('courier', 'bold');
      doc.setFontSize(6.5);
      doc.text(`Enr: ${m.enrollmentNo || 'Verified'}`, 123, currentY + 10);
    } else {
      doc.setTextColor(71, 85, 105);
      doc.text(m.collegeName || 'External', 123, currentY + 7.5);
    }

    // Member Pass ID
    const memberPass = m.memberPassId || `${passId}-M${idx + 1}`;
    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(memberPass, 160, currentY + 7.5);

    currentY += rowHeight;
  });

  // 9. Mandatory Hackathon Guidelines Box
  const rulesY = Math.max(currentY + 4, 218);
  doc.setFillColor(254, 252, 232); // Light yellow
  doc.setDrawColor(234, 179, 8);
  doc.setLineWidth(0.3);
  doc.rect(10, rulesY, contentWidth, 38, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(146, 64, 14); // Dark amber
  doc.text('IMPORTANT OFFLINE HACKATHON PARTICIPATION INSTRUCTIONS', 14, rulesY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(68, 64, 60);

  const instructions = [
    '1. PHOTO IDENTIFICATION: All registered team members must carry their official College ID Card or Government Photo ID (Aadhaar / Voter / Passport / DL) for verification at the entrance.',
    '2. HARDWARE & PERIPHERALS: Teams are required to bring their own laptops, chargers, power extension cords, and test devices. High-speed Wi-Fi network and workstation power outlets will be provided.',
    '3. DEVELOPMENT INTEGRITY: All project code and commits must be created during the official 24-hour sprint window into the designated GitHub repository. Pre-built codebases are strictly disqualified.',
    '4. VENUE ACCESS & BADGING: Gate admission opens at 03:30 PM IST (Sept 11). Present the QR code on this ticket at the registration desk. Physical badges must be worn continuously inside the hackathon hall.',
    '5. OVERNIGHT ACCOMMODATION: Dedicated resting areas, security, meals, snacks, and continuous mentoring support are provided throughout the 24-hour hackathon period at IEM Aegis Building campus.',
  ];

  let ruleLineY = rulesY + 10.5;
  instructions.forEach((rule) => {
    doc.text(rule, 14, ruleLineY, { maxWidth: contentWidth - 8 });
    ruleLineY += 5.2;
  });

  // 10. Official Footer & Verification Seal
  const footerY = 270;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(10, footerY, contentWidth + 10, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('COGNITIA 2026 ORGANIZING COMMITTEE  •  INSTITUTE OF ENGINEERING & MANAGEMENT (IEM)  •  DEPARTMENT OF IT & CSE', contentWidth / 2 + 10, footerY + 4, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('This is a verified computer-generated entry credential. Any alteration or duplication renders this ticket pass void.', contentWidth / 2 + 10, footerY + 8, { align: 'center' });
  doc.text(`Page 1 of 2  |  Official Pass: ${passId}  |  Secured by Cognitia Cloud Services  |  Verified Participant Ticket`, contentWidth / 2 + 10, footerY + 11.5, { align: 'center' });

  // =========================================================================
  // PAGE 2: OFFICIAL HACKATHON RULES & ETHICS PROTOCOL (FULL RULEBOOK)
  // =========================================================================
  doc.addPage();

  // Page 2 Outer Document Border
  doc.setDrawColor(15, 23, 42); // Slate 900
  doc.setLineWidth(0.7);
  doc.rect(8, 8, 194, 281, 'S');

  doc.setDrawColor(217, 119, 6); // Amber 600
  doc.setLineWidth(0.3);
  doc.rect(9, 9, 192, 279, 'S');

  // Page 2 Top Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(9, 9, 192, 16, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('COGNITIA 2026  •  OFFICIAL HACKATHON RULES & ETHICS PROTOCOL', 105, 15, { align: 'center' });

  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('MANDATORY CODE OF CONDUCT, SUBMISSION RULES & DISCIPLINARY POLICIES FOR ALL PARTICIPANTS', 105, 21, { align: 'center' });

  let page2Y = 29;

  const renderRuleSection = (
    title: string,
    rulesList: string[],
    enforcementText: string,
    accentColor: [number, number, number],
    bgColor: [number, number, number]
  ) => {
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(0.3);

    const sectionStartY = page2Y;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(`> ${title.toUpperCase()}`, 14, page2Y + 4);

    page2Y += 6.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(30, 41, 59);

    rulesList.forEach((r) => {
      const lineText = `• ${r}`;
      doc.text(lineText, 16, page2Y, { maxWidth: contentWidth - 12 });
      const lines = doc.splitTextToSize(lineText, contentWidth - 12);
      page2Y += lines.length * 3.0 + 0.4;
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(180, 83, 9);
    doc.text(`Enforcement: ${enforcementText}`, 16, page2Y, { maxWidth: contentWidth - 12 });
    const enfLines = doc.splitTextToSize(`Enforcement: ${enforcementText}`, contentWidth - 12);
    page2Y += enfLines.length * 2.8 + 2;

    const sectionHeight = page2Y - sectionStartY;
    doc.rect(11, sectionStartY, contentWidth - 2, sectionHeight, 'S');
    page2Y += 2;
  };

  // 1. Registration & Participation
  renderRuleSection(
    'Registration & Participation Rules',
    [
      'Participants must complete registration with accurate personal, institutional, and contact details.',
      'Each participating team must consist of 2 to 4 members.',
      'Participants must carry their valid college ID and hackathon pass throughout the event.',
      'Attendance may be monitored throughout the hackathon, including overnight hours.',
      'Participants must remain within the designated venue unless permission is granted by organizers.',
      'Participants must follow proper dress attire including proper full trousers all throughout the hackathon.',
      'Phase 2 registration fee is Rs. 200 for external/mixed teams, and Rs. 0 (Free Waiver) for verified IEM student teams.',
    ],
    'Inaccurate details, refusal of ID verification, or non-compliance with venue rules will invalidate team selection.',
    [14, 116, 144],
    [240, 249, 255]
  );

  // 2. Hackathon & Submission Rules
  renderRuleSection(
    'Hackathon & Submission Rules',
    [
      'Teams must work on officially released problem statements and follow designated hackathon tracks.',
      'All projects must be developed within the official hackathon duration (Sept 11, 5:00 PM - Sept 12, 1:00 PM).',
      'Teams must use the designated GitHub repository for their project commits.',
      'Code submissions will be monitored through the designated GitHub repositories.',
      'Submit GitHub repo, project documentation, and presentation/demo files before the submission deadline.',
      'Submissions after official deadline will not be considered for evaluation.',
      'Once submissions are frozen, no further changes or code additions will be permitted unless explicitly allowed.',
    ],
    'Late submissions or repositories showing commits outside the sprint timeframe will be ineligible for evaluation.',
    [185, 28, 28],
    [254, 242, 242]
  );

  // 3. Technology & Code Ethics
  renderRuleSection(
    'Technology & Code Ethics',
    [
      'Participants may use technologies, frameworks, APIs, and tools permitted under official hackathon rules.',
      'Use of AI tools, APIs, and open-source resources must comply with rules announced by organizers.',
      'Projects must comply with applicable copyright and open-source licensing requirements.',
      'Plagiarism, copied projects, and pre-existing projects presented as original work are strictly prohibited.',
      'Teams must be able to explain and demonstrate their submitted project live to the jury.',
    ],
    'Pre-built projects or plagiarized codebases will face immediate disqualification without evaluation.',
    [14, 116, 144],
    [240, 249, 255]
  );

  // 4. Venue, Safety & Conduct
  renderRuleSection(
    'Venue, Safety & Conduct',
    [
      'Participants must maintain discipline and follow instructions given by organizers and volunteers.',
      'Use electrical equipment, power outlets, and venue infrastructure responsibly.',
      'Participants must not damage or misuse any venue property or equipment.',
      'Follow all security and emergency protocols communicated by organizers.',
      'Keep workspaces clean and dispose of waste in designated bins.',
      'Respect designated sleeping/resting areas and maintain cleanliness of venue and washrooms.',
    ],
    'Damage to venue property or unsafe electrical load misuse will result in instant ejection from campus.',
    [180, 83, 9],
    [254, 243, 199]
  );

  // 5. Prohibited Substances (Zero Tolerance)
  renderRuleSection(
    'Prohibited Substances Policy',
    [
      'Smoking, vaping, consumption, possession, or distribution of alcohol and intoxicating substances is strictly prohibited.',
      'Participants are not permitted to enter or remain under the influence of alcohol or any intoxicating substance.',
      'Any violation of this rule may result in immediate disqualification and removal from the event premises.',
    ],
    'Zero tolerance: Immediate disqualification, security escort off premises, and reporting to institutional authorities.',
    [220, 38, 38],
    [254, 226, 226]
  );

  // 6. General Conduct
  renderRuleSection(
    'General Conduct & Community Ethics',
    [
      'Treat fellow participants, organizers, volunteers, judges, mentors, and guests with mutual respect.',
      'Any form of harassment, misconduct, cheating, plagiarism, or deliberate disruption results in disqualification.',
      'Participants are responsible for their personal belongings.',
      'Follow all instructions and announcements issued by the organizing committee throughout the event.',
      'Participants will be provided with scheduled meals & refreshments at appropriate timings.',
    ],
    'Misconduct or harassment towards any peer or organizer results in immediate revocation of hackathon credentials.',
    [14, 116, 144],
    [240, 249, 255]
  );

  // Judging Criteria Summary Box
  doc.setFillColor(15, 23, 42);
  doc.rect(11, page2Y, contentWidth - 2, 13, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('OFFICIAL JUDGING & EVALUATION WEIGHTAGE CRITERIA:', 14, page2Y + 4);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.text('• Technical Craft (30%)  |  • Track Innovation (25%)  |  • Utility & Practical Impact (25%)  |  • Demo & Defense (20%)', 14, page2Y + 9);

  // Page 2 Footer
  const page2FooterY = 270;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(10, page2FooterY, contentWidth + 10, page2FooterY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text('COGNITIA 2026 ORGANIZING COMMITTEE  •  INSTITUTE OF ENGINEERING & MANAGEMENT (IEM)  •  DEPARTMENT OF IT & CSE', contentWidth / 2 + 10, page2FooterY + 4, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(`Page 2 of 2  |  Pass ID: ${passId}  |  Secured by Cognitia Cloud Services  |  Verified Participant Rulebook`, contentWidth / 2 + 10, page2FooterY + 8, { align: 'center' });

  return doc;
}

/**
 * Generates and triggers direct browser download of the ticket PDF.
 */
export async function downloadTicketPdf(team: TeamRegistration): Promise<void> {
  const doc = await createTicketPdfDoc(team);
  const cleanTeamName = (team.teamName || 'Team').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Cognitia-2026-Pass-${cleanTeamName}.pdf`;
  doc.save(fileName);
}

/**
 * Opens a print dialog of the generated PDF in an isolated window or iframe,
 * ensuring only the ticket pass is printed without any surrounding web application elements.
 */
export async function printTicketPdf(team: TeamRegistration): Promise<void> {
  const doc = await createTicketPdfDoc(team);
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  // Use an invisible iframe to trigger print directly
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // Fallback: open in new window
      window.open(blobUrl, '_blank');
    }
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(blobUrl);
    }, 60000);
  };
}


