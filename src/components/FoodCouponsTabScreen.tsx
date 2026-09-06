import React, { useState, useEffect } from 'react';
import {
  Utensils,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Download,
  X,
  UserCheck,
  UserX,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { TeamRegistration, TeamMember, MealType } from '../types';
import { firebaseService } from '../services/firebaseService';
import { sound } from '../utils/audio';
import { downloadFoodCouponsPdf, printFoodCouponsPdf } from '../utils/ticketPdfGenerator';

interface FoodCouponsTabScreenProps {
  teamIdFromProp?: string;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const FoodCouponsTabScreen: React.FC<FoodCouponsTabScreenProps> = ({
  teamIdFromProp,
  isModal = false,
  onCloseModal,
}) => {
  const [team, setTeam] = useState<TeamRegistration | null>(null);
  const [activeMealSession, setActiveMealSession] = useState<MealType | 'none'>('none');
  const [zoomQr, setZoomQr] = useState<{ url: string; title: string; subtitle: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Extract teamId from URL search param if not passed via props
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTeamId = params.get('teamId') || params.get('foodPass') || teamIdFromProp;

    const findAndSetTeam = (teamsList: TeamRegistration[]) => {
      if (urlTeamId) {
        const found = teamsList.find(
          (t) =>
            t.id.toLowerCase() === urlTeamId.toLowerCase() ||
            (t.ticketPassId && t.ticketPassId.toLowerCase() === urlTeamId.toLowerCase())
        );
        if (found) {
          setTeam(found);
          return;
        }
      }
      // Fallback to active logged-in lead team if present
      const activeTeam = firebaseService.getActiveLeadTeam();
      if (activeTeam) {
        setTeam(activeTeam);
      }
    };

    // Real-time subscription to teams list
    const unsubscribeTeams = firebaseService.subscribeToTeams((teamsList) => {
      findAndSetTeam(teamsList);
      setIsLoading(false);
    });

    // Real-time subscription to active meal session
    const unsubscribeMealSession = firebaseService.subscribeToMealSession((session) => {
      setActiveMealSession(session);
    });

    return () => {
      unsubscribeTeams();
      unsubscribeMealSession();
    };
  }, [teamIdFromProp]);

  // Determine current meal type to render (strictly locked to Admin's active meal session)
  const currentMeal: MealType | 'none' = activeMealSession;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090b] text-[#cfe8ff] flex items-center justify-center p-4 font-mono">
        <div className="flex flex-col items-center gap-3 bg-[#0d1217] p-6 border-2 border-[#2b2e30] rounded-md shadow-[0_0_30px_rgba(0,240,255,0.2)]">
          <RefreshCw size={28} className="text-[#00f0ff] animate-spin" />
          <p className="font-pixel text-[11px] text-[#f4c151]">LOADING COGNITIA FOOD PASS...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-[#07090b] text-[#cfe8ff] flex items-center justify-center p-4 font-mono">
        <div className="max-w-md w-full bg-[#120a0a] border-2 border-[#522525] p-6 rounded-md text-center space-y-4 shadow-[0_0_30px_rgba(235,81,71,0.2)]">
          <AlertTriangle size={36} className="mx-auto text-[#eb5147]" />
          <h2 className="font-pixel text-[14px] text-[#eb5147] uppercase">TEAM PASS NOT FOUND</h2>
          <p className="font-silkscreen text-[10px] text-[#8f9396] leading-relaxed">
            Could not find an active or verified team registration. Please ensure your team pass ID is valid or login to your team account.
          </p>
          <button
            onClick={() => (window.location.href = '/login')}
            className="w-full bg-[#261414] hover:bg-[#3d1e1e] text-[#eb5147] border border-[#522525] font-pixel text-[10px] py-2 rounded-xs cursor-pointer uppercase"
          >
            GO TO TEAM LOGIN
          </button>
        </div>
      </div>
    );
  }

  const checkedMembers = (team.members || []).filter((m) => m.checkInStatus === 'checked_in');
  const absentMembers = (team.members || []).filter((m) => m.checkInStatus !== 'checked_in');
  const checkedCount = checkedMembers.length;
  const totalCount = (team.members || []).length;
  const isQualified = checkedCount >= 2;

  const mealLabels: Record<MealType, string> = {
    day1_dinner: 'DAY 1 DINNER 🍱',
    day1_snacks: 'DAY 1 LATE NIGHT SNACKS 🍕',
    day2_breakfast: 'DAY 2 BREAKFAST 🥐',
    day2_lunch: 'DAY 2 LUNCH 🍱',
  };

  const getQrUrl = (payload: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`;
  };

  return (
    <div className={`min-h-screen bg-[#07090b] text-[#cfe8ff] font-sans ${isModal ? 'p-2 sm:p-4' : 'p-3 sm:p-6'} flex flex-col items-center justify-start relative`}>
      <div className="w-full max-w-4xl space-y-4">
        {/* TOP BRAND & CONTROL BAR */}
        <header className="bg-[#0e1216] border-2 border-[#2b4466] p-4 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_25px_rgba(0,240,255,0.15)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#142417] border border-[#25522b] rounded-xs text-[#4ade80]">
              <Utensils size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[13px] sm:text-[15px] text-[#f4c151]">
                  COGNITIA 2026 &bull; OFFICIAL FOOD PASS
                </span>
                <span className="bg-[#1c2836] text-[#00f0ff] border border-[#00f0ff]/40 text-[8px] font-silkscreen px-2 py-0.5 rounded-xs font-bold">
                  {team.ticketPassId || team.id}
                </span>
              </div>
              <p className="font-silkscreen text-[9px] text-[#86efac] flex items-center gap-1.5 mt-0.5">
                <span>TEAM: <strong className="text-white font-bold">{team.teamName}</strong></span>
                <span>&bull;</span>
                <span>GATE CHECKED IN: <strong className="text-[#4ade80]">{checkedCount} / {totalCount} MEMBERS</strong></span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={async () => {
                if (!team) return;
                sound.playBlip(500);
                setIsGeneratingPdf(true);
                try {
                  await downloadFoodCouponsPdf(team, activeMealSession);
                } finally {
                  setIsGeneratingPdf(false);
                }
              }}
              disabled={isGeneratingPdf}
              className="bg-[#1e4620] hover:bg-[#28592b] text-[#4ade80] border border-[#4ade80] font-pixel text-[9px] px-3 py-1.5 rounded-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-[2px_2px_0_0_#000] disabled:opacity-50"
            >
              <Download size={13} /> {isGeneratingPdf ? 'GENERATING PDF...' : 'DOWNLOAD FOOD PDF'}
            </button>
            <button
              onClick={async () => {
                if (!team) return;
                sound.playBlip(500);
                setIsGeneratingPdf(true);
                try {
                  await printFoodCouponsPdf(team, activeMealSession);
                } finally {
                  setIsGeneratingPdf(false);
                }
              }}
              disabled={isGeneratingPdf}
              className="bg-[#182418] hover:bg-[#203320] text-[#a7d38a] border border-[#254225] font-pixel text-[9px] px-3 py-1.5 rounded-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            >
              <Printer size={13} /> PRINT FOOD PDF
            </button>
            {isModal && onCloseModal && (
              <button
                onClick={onCloseModal}
                className="bg-[#261414] hover:bg-[#381c1c] text-[#eb5147] border border-[#522525] font-pixel text-[9px] px-3 py-1.5 rounded-xs flex items-center gap-1 cursor-pointer"
              >
                <X size={14} /> CLOSE
              </button>
            )}
          </div>
        </header>

        {/* ADMIN ACTIVE SESSION CONTROLLER BANNER */}
        <div className="bg-[#0f1712] border-2 border-[#4ade80]/50 p-3 sm:p-4 rounded-md space-y-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(74,222,128,0.12)]">
          <div className="flex items-center gap-2.5">
            <Sparkles size={20} className="text-[#4ade80] animate-pulse" />
            <div>
              <span className="font-silkscreen text-[8.5px] text-[#86efac] block">
                ADMIN CONTROLLED CATERING SESSION STATUS:
              </span>
              <span className="font-pixel text-[12px] sm:text-[13px] text-white uppercase font-bold flex items-center gap-2">
                {activeMealSession === 'none' ? (
                  <span className="text-[#eb5147] flex items-center gap-1">
                    🚫 CATERING SESSION CLOSED (NO ACTIVE MEAL)
                  </span>
                ) : (
                  <span className="text-[#4ade80] flex items-center gap-1">
                    🟢 ACTIVE MEAL SESSION: {mealLabels[activeMealSession]}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* LOCKED STATUS WARNING IF < 2 MEMBERS CHECKED IN */}
        {!isQualified && (
          <div className="bg-[#241714] border-2 border-[#f4c151] p-4 rounded-md text-center space-y-2 shadow-[0_0_20px_rgba(244,193,81,0.2)]">
            <AlertTriangle size={30} className="mx-auto text-[#f4c151] animate-bounce" />
            <h3 className="font-pixel text-[13px] text-[#f4c151] uppercase">
              ⚠️ FOOD COUPONS LOCKED — GATE CHECK-IN REQUIRED
            </h3>
            <p className="font-silkscreen text-[9.5px] text-[#cfe8ff] max-w-xl mx-auto leading-relaxed">
              At least <strong>2 members of your team</strong> must check in at the venue gate on event day to unlock food collection coupons.
              <br />
              <span className="text-[#f4c151] font-mono font-bold mt-1 inline-block">
                CURRENTLY CHECKED IN: {checkedCount} / {totalCount} MEMBERS (MIN 2 REQUIRED)
              </span>
            </p>
          </div>
        )}

        {/* ACTIVE MEAL SESSION OFF NOTICE */}
        {isQualified && activeMealSession === 'none' && (
          <div className="bg-[#1c1414] border border-[#522525] p-4 rounded-md text-center space-y-2 font-silkscreen text-[10px]">
            <Clock size={28} className="mx-auto text-[#eb5147]" />
            <p className="text-[#eb5147] font-pixel text-[12px] uppercase">
              NO MEAL SESSION IS CURRENTLY ACTIVE
            </p>
            <p className="text-[#8f9396] max-w-md mx-auto">
              The catering counter is currently closed or between meal slots. Food coupon QRs will automatically reveal when Admin opens the next catering session!
            </p>
          </div>
        )}

        {/* FOOD COUPONS MAIN SECTION (UNLOCKED) */}
        {isQualified && (
          <main className="space-y-5">
            {/* SECTION 1: WHOLE TEAM FOOD COUPON */}
            <div className="bg-[#0b1015] border-2 border-[#2b4466] p-4 rounded-md space-y-3 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2b2e30] pb-2.5 gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-[#1e2d42] border border-[#3b5982] text-[#00f0ff] rounded-xs">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h2 className="font-pixel text-[12px] sm:text-[13px] text-[#f4c151] uppercase">
                      1. TEAM FOOD COUPON (FULL TEAM PASS)
                    </h2>
                    <p className="font-silkscreen text-[8.5px] text-[#8f9396]">
                      Valid for collective team food collection at catering desk
                    </p>
                  </div>
                </div>

                <div className="font-mono text-[9px] bg-[#142417] text-[#86efac] border border-[#25522b] px-2.5 py-1 rounded-xs font-bold self-start sm:self-auto">
                  {mealLabels[currentMeal]}
                </div>
              </div>

              {(() => {
                const teamQrPayload = `COG26-FOOD:${currentMeal}:${team.id}`;
                const teamQrUrl = getQrUrl(teamQrPayload);
                const redemption = (team.meals || {})[currentMeal];
                const isRedeemed = !!redemption?.redeemed;

                return (
                  <div className="flex flex-col sm:flex-row items-center justify-between bg-[#121820] border border-[#1e2e42] p-4 rounded-xs gap-4">
                    <div className="space-y-1.5 font-silkscreen text-[9px] grow text-center sm:text-left">
                      <p className="text-[#cfe8ff]">
                        TEAM NAME: <strong className="text-white font-bold text-[11px]">{team.teamName}</strong>
                      </p>
                      <p className="text-[#6fb3d9] font-mono">PASS ID: {team.ticketPassId || team.id}</p>
                      <p className="text-[#8f9396]">TOTAL MEMBERS: {totalCount} | PRESENT MEMBERS: {checkedCount}</p>

                      <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                        {isRedeemed ? (
                          <span className="inline-flex items-center gap-1.5 bg-[#261414] text-[#eb5147] border border-[#522525] text-[9px] px-2.5 py-1 rounded-xs font-pixel">
                            <AlertTriangle size={12} /> REDEEMED AT {redemption?.redeemedAt || 'OK'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-[#142417] text-[#4ade80] border border-[#25522b] text-[9px] px-2.5 py-1 rounded-xs font-pixel shadow-[0_0_10px_rgba(74,222,128,0.3)]">
                            <CheckCircle2 size={12} /> 🟢 READY FOR SCANNING
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Team Food QR Code */}
                    <div
                      className="bg-black p-2 rounded-xs border-2 border-[#00f0ff] flex flex-col items-center shrink-0 cursor-pointer group hover:border-[#f4c151] transition-colors"
                      onClick={() => {
                        sound.playBlip(600);
                        setZoomQr({
                          url: teamQrUrl,
                          title: `TEAM FOOD COUPON — ${team.teamName}`,
                          subtitle: `MEAL: ${mealLabels[currentMeal]} (Pass ID: ${team.ticketPassId || team.id})`,
                        });
                      }}
                    >
                      <img
                        src={teamQrUrl}
                        alt="Team Food QR"
                        className="w-28 h-28 bg-white p-1 rounded-xs object-contain group-hover:scale-105 transition-transform"
                      />
                      <span className="font-mono text-[7px] text-[#00f0ff] mt-1 group-hover:text-[#f4c151]">
                        🔍 CLICK TO ENLARGE
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* SECTION 2: PRESENT MEMBERS INDIVIDUAL FOOD COUPONS */}
            <div className="bg-[#0b1015] border-2 border-[#2b4466] p-4 rounded-md space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-[#2b2e30] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-[#182418] border border-[#25522b] text-[#4ade80] rounded-xs">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <h2 className="font-pixel text-[12px] sm:text-[13px] text-[#a7d38a] uppercase">
                      2. INDIVIDUAL PRESENT MEMBER FOOD COUPONS ({checkedCount} PRESENT)
                    </h2>
                    <p className="font-silkscreen text-[8.5px] text-[#8f9396]">
                      Valid for individual food coupon collection for gate checked-in participants only
                    </p>
                  </div>
                </div>
              </div>

              {checkedCount === 0 ? (
                <div className="p-4 bg-[#141618] border border-[#2b2e30] rounded-xs text-center font-silkscreen text-[9px] text-[#8f9396]">
                  No team members have gate checked-in yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {checkedMembers.map((m, idx) => {
                    const memberPassId = m.memberPassId || `COG26-M${String(team.id).slice(-3)}-${idx + 1}`;
                    const memberQrPayload = `COG26-FOOD:${currentMeal}:${team.id}:${m.id}`;
                    const memberQrUrl = getQrUrl(memberQrPayload);

                    const memberMeals = m.meals || {};
                    const redemption = memberMeals[currentMeal];
                    const isRedeemed = !!redemption?.redeemed;

                    return (
                      <div
                        key={m.id || idx}
                        className={`bg-[#0e141b] border-2 ${
                          isRedeemed ? 'border-[#522525]' : 'border-[#25522b]'
                        } p-3.5 rounded-xs space-y-2 relative overflow-hidden transition-all`}
                      >
                        <div className="flex items-center justify-between border-b border-[#2b2e30] pb-1.5">
                          <span className="font-pixel text-[9.5px] text-[#f4c151] flex items-center gap-1">
                            {m.isLead ? '👑 LEAD FOOD COUPON' : `👤 MEMBER #${idx + 1}`}
                          </span>
                          <span className="font-mono text-[8px] text-[#4ade80] bg-[#142417] px-2 py-0.5 border border-[#25522b] rounded-xs font-bold">
                            {memberPassId}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-1 font-silkscreen text-[8.5px] grow">
                            <p className="font-bold text-white text-[11px]">{m.name}</p>
                            <p className="text-[#8f9396]">{m.role || 'Participant'}</p>
                            {m.enrollmentNo && (
                              <p className="text-[#86efac] font-mono text-[8px]">ROLL: {m.enrollmentNo}</p>
                            )}

                            <div className="pt-1">
                              {isRedeemed ? (
                                <span className="inline-flex items-center gap-1 bg-[#261414] text-[#eb5147] border border-[#522525] text-[7.5px] px-1.5 py-0.5 rounded-xs font-pixel">
                                  <AlertTriangle size={9} /> REDEEMED ({redemption?.redeemedAt || 'OK'})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-[#142417] text-[#4ade80] border border-[#25522b] text-[7.5px] px-1.5 py-0.5 rounded-xs font-pixel">
                                  <CheckCircle2 size={9} /> 🟢 READY TO SCAN
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Member Food QR */}
                          <div
                            className="bg-black p-1.5 rounded-xs border border-[#4ade80] flex flex-col items-center shrink-0 cursor-pointer group hover:border-[#f4c151] transition-colors"
                            onClick={() => {
                              sound.playBlip(600);
                              setZoomQr({
                                url: memberQrUrl,
                                title: `MEMBER FOOD COUPON — ${m.name}`,
                                subtitle: `MEAL: ${mealLabels[currentMeal]} (Pass ID: ${memberPassId})`,
                              });
                            }}
                          >
                            <img
                              src={memberQrUrl}
                              alt={`${m.name} Food QR`}
                              className="w-20 h-20 bg-white p-0.5 rounded-xs object-contain group-hover:scale-105 transition-transform"
                            />
                            <span className="font-mono text-[6px] text-[#4ade80] mt-0.5 group-hover:text-[#f4c151]">
                              ZOOM QR
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 3: ABSENT / UNCHECKED MEMBERS WITHHOLDING NOTICE */}
            {absentMembers.length > 0 && (
              <div className="bg-[#171212] border-2 border-[#522525] p-3.5 rounded-md space-y-2">
                <div className="flex items-center gap-2 text-[#eb5147]">
                  <UserX size={18} />
                  <span className="font-pixel text-[11px] text-[#eb5147]">
                    ABSENT / UNCHECKED MEMBERS ({absentMembers.length}): FOOD COUPONS WITHHELD
                  </span>
                </div>
                <p className="font-silkscreen text-[8.5px] text-[#8f9396]">
                  Food coupons are only issued to participants who have physically checked in at the event gate desk. The following members have not checked in yet:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {absentMembers.map((m, idx) => (
                    <span
                      key={m.id || idx}
                      className="bg-[#261414] text-[#fca5a5] border border-[#522525] font-silkscreen text-[8px] px-2 py-0.5 rounded-xs flex items-center gap-1"
                    >
                      <span>⚪ {m.name} ({m.role || 'Member'})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </main>
        )}
      </div>

      {/* ZOOM QR CODE MODAL */}
      {zoomQr && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-[#0b1015] border-2 border-[#00f0ff] p-5 rounded-md max-w-sm w-full text-center space-y-3 shadow-[0_0_40px_rgba(0,240,255,0.4)]">
            <div className="flex items-center justify-between border-b border-[#2b2e30] pb-2">
              <span className="font-pixel text-[11px] text-[#f4c151] truncate pr-2">
                {zoomQr.title}
              </span>
              <button
                onClick={() => setZoomQr(null)}
                className="text-[#8f9396] hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <p className="font-silkscreen text-[9px] text-[#86efac]">{zoomQr.subtitle}</p>

            <div className="bg-white p-3 rounded-xs border-2 border-[#00f0ff] inline-block shadow-inner">
              <img src={zoomQr.url} alt="Enlarged QR" className="w-56 h-56 object-contain" />
            </div>

            <p className="font-silkscreen text-[8px] text-[#8f9396]">
              Present this high-resolution QR code directly to the food desk admin scanner.
            </p>

            <button
              onClick={() => setZoomQr(null)}
              className="w-full bg-[#1c2836] hover:bg-[#273a50] text-[#00f0ff] border border-[#00f0ff]/40 font-pixel text-[9.5px] py-2 rounded-xs cursor-pointer uppercase"
            >
              DONE / CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
