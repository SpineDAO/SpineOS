import { useState } from "react";

// ─── BRAND TOKENS (OpAgent system) ────────────────────────────────────
const C = {
  canvas:       "#F7F4EE",
  canvasMid:    "#EEE9DF",
  canvasDark:   "#E0D9CC",
  pure:         "#FDFCF9",
  forest:       "#163D2B",
  forestMid:    "#1F5238",
  forestLight:  "#2D7A54",
  forestPale:   "#E8F2EC",
  forestBorder: "#A8CCBA",
  teal:         "#2D9D99",
  tealDark:     "#1C6E6B",
  tealPale:     "#E0F2F2",
  tealBorder:   "#A8DEDD",
  gilt:         "#C4973E",
  giltPale:     "#F2E8D4",
  ink:          "#1C1A16",
  inkMed:       "#3D3A32",
  inkSoft:      "#7A7568",
  inkFaint:     "#B8B2A8",
  white:        "#FDFCF9",
  surgical:     "#991B1B",
  surgicalBg:   "#FEE2E2",
  interventional:"#B45309",
  interventionalBg:"#FEF3C7",
  conservative: "#163D2B",
  conservativeBg:"#E8F2EC",
};

const FONT = {
  display: "'Playfair Display SC', Georgia, serif",
  body:    "'Outfit', system-ui, sans-serif",
  mono:    "'IBM Plex Mono', monospace",
};

// ─── MOCK DATA ─────────────────────────────────────────────────────────
const MOCK_PATIENTS = [
  { id: "1", name: "Robert Martinez", dob: "1958-03-12", appt: "Apr 8, 9:30 AM", complaint: "Low back pain with bilateral leg numbness", intakeComplete: true, surgeryProb: 0.82, pathway: "surgical", odi: 62, redFlags: ["Bilateral symptoms"], provider: "Dr. Diebo" },
  { id: "2", name: "Sandra Chen", dob: "1971-07-22", appt: "Apr 8, 10:15 AM", complaint: "Right leg radiculopathy, 8 weeks", intakeComplete: true, surgeryProb: 0.71, pathway: "surgical", odi: 48, redFlags: [], provider: "Dr. Diebo" },
  { id: "3", name: "James Wilson", dob: "1965-11-05", appt: "Apr 8, 11:00 AM", complaint: "Neck pain with right arm tingling", intakeComplete: true, surgeryProb: 0.55, pathway: "interventional", odi: 38, redFlags: [], provider: "Dr. Diebo" },
  { id: "4", name: "Patricia Lopez", dob: "1980-04-18", appt: "Apr 8, 1:30 PM", complaint: "Lower back pain, acute onset after lifting", intakeComplete: false, surgeryProb: null, pathway: "pending", odi: null, redFlags: [], provider: "Dr. Diebo" },
  { id: "5", name: "Michael Thompson", dob: "1952-09-30", appt: "Apr 8, 2:15 PM", complaint: "Lumbar stenosis, progressive walking limitation", intakeComplete: true, surgeryProb: 0.43, pathway: "interventional", odi: 42, redFlags: [], provider: "Dr. Diebo" },
  { id: "6", name: "Jennifer Davis", dob: "1988-01-14", appt: "Apr 9, 9:00 AM", complaint: "Mild back pain, yoga instructor", intakeComplete: true, surgeryProb: 0.18, pathway: "conservative", odi: 14, redFlags: [], provider: "Dr. Diebo" },
];

const MOCK_MESSAGES = [
  { id: "1", patientId: "1", direction: "inbound", body: "I'm feeling very anxious about my appointment, will surgery be discussed?", time: "8:42 AM", read: false },
  { id: "2", patientId: "2", direction: "outbound", body: "Your intake is complete! Dr. Diebo will review your MRI results during the visit.", time: "9:05 AM", read: true },
];

// ─── COMPONENTS ────────────────────────────────────────────────────────

function PathwayBadge({ pathway, probability }: { pathway: string; probability: number | null }) {
  if (pathway === "pending") return (
    <span style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: C.inkFaint, background: C.canvasDark, padding: "3px 8px", borderRadius: 4 }}>PENDING</span>
  );
  const map: Record<string, { bg: string; color: string; label: string }> = {
    surgical:       { bg: C.surgicalBg,        color: C.surgical,        label: "SURGICAL" },
    interventional: { bg: C.interventionalBg,  color: C.interventional,  label: "INTERVENTIONAL" },
    conservative:   { bg: C.conservativeBg,    color: C.conservative,    label: "CONSERVATIVE" },
  };
  const s = map[pathway] || map.conservative;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: s.color, background: s.bg, padding: "3px 8px", borderRadius: 4, fontWeight: 700 }}>{s.label}</span>
      {probability !== null && (
        <span style={{ fontFamily: FONT.mono, fontSize: 12, fontWeight: 700, color: s.color }}>{Math.round(probability * 100)}%</span>
      )}
    </div>
  );
}

function IntakeStatus({ complete }: { complete: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: complete ? C.teal : C.gilt }} />
      <span style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "1px", textTransform: "uppercase", color: complete ? C.teal : C.gilt }}>
        {complete ? "Complete" : "Pending"}
      </span>
    </div>
  );
}

function StatCard({ label, value, sub, color = C.forest }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: C.pure, border: `1px solid ${C.canvasDark}`, borderTop: `3px solid ${color}`, borderRadius: 8, padding: "20px 22px" }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 8, letterSpacing: "2.5px", textTransform: "uppercase", color: C.inkSoft, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: FONT.display, fontSize: 32, fontWeight: 900, color, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      {sub && <div style={{ fontFamily: FONT.mono, fontSize: 9, color: C.inkFaint }}>{sub}</div>}
    </div>
  );
}

function OdiBar({ score }: { score: number | null }) {
  if (score === null) return <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.inkFaint }}>—</span>;
  const color = score >= 61 ? C.surgical : score >= 41 ? C.interventional : score >= 21 ? C.gilt : C.teal;
  const label = score >= 61 ? "Crippling" : score >= 41 ? "Severe" : score >= 21 ? "Moderate" : "Minimal";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 60, height: 5, background: C.canvasDark, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontFamily: FONT.mono, fontSize: 10, color }}>{score}%</span>
      <span style={{ fontFamily: FONT.mono, fontSize: 9, color: C.inkFaint }}>{label}</span>
    </div>
  );
}

// ─── MAIN PORTAL ───────────────────────────────────────────────────────

export default function AIRAPhysicianPortal() {
  const [activeTab, setActiveTab] = useState("queue");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [messageInput, setMessageInput] = useState("");
  const [sendLinkForm, setSendLinkForm] = useState({ name: "", phone: "", date: "", provider: "Dr. Bassel Diebo", specialty: "spine" });

  const urgentCount = MOCK_PATIENTS.filter(p => p.redFlags.length > 0).length;
  const pendingCount = MOCK_PATIENTS.filter(p => !p.intakeComplete).length;
  const completedToday = MOCK_PATIENTS.filter(p => p.intakeComplete).length;
  const avgProb = Math.round(MOCK_PATIENTS.filter(p => p.surgeryProb !== null).reduce((a, p) => a + (p.surgeryProb || 0), 0) / MOCK_PATIENTS.filter(p => p.surgeryProb !== null).length * 100);

  const TABS = [
    { id: "queue", label: "Patient Queue", count: MOCK_PATIENTS.length },
    { id: "dashboard", label: "Dashboard", count: 0 },
    { id: "send", label: "Send Intake Link", count: 0 },
    { id: "messages", label: "Messages", count: MOCK_MESSAGES.filter(m => !m.read).length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.canvas, fontFamily: FONT.body }}>

      {/* ── NAV ── */}
      <div style={{ background: C.forest, backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 L10 0 L20 10 L10 20 Z' fill='none' stroke='rgba(247,244,238,0.07)' stroke-width='0.7'/%3E%3C/svg%3E")` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span style={{ fontFamily: FONT.display, fontSize: 16, fontWeight: 900, color: C.white, letterSpacing: "0.12em" }}>Op</span>
              <span style={{ fontFamily: FONT.display, fontSize: 16, fontWeight: 400, color: "#9ECFB2", letterSpacing: "0.10em" }}>Agent</span>
              <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.gilt }}>.ai</span>
            </div>
            <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.15)" }} />
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span style={{ fontFamily: FONT.mono, fontSize: 14, fontWeight: 700, color: C.teal, letterSpacing: "0.15em" }}>AI</span>
              <span style={{ fontFamily: FONT.mono, fontSize: 14, fontWeight: 400, color: "rgba(247,244,238,0.6)", letterSpacing: "0.15em" }}>RA</span>
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 9, color: "rgba(247,244,238,0.3)", letterSpacing: "1.5px", textTransform: "uppercase" }}>Patient Intelligence</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {urgentCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(153,27,27,0.2)", border: "1px solid rgba(153,27,27,0.4)", borderRadius: 20, padding: "4px 12px" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff4444", boxShadow: "0 0 6px #ff4444" }} />
                <span style={{ fontFamily: FONT.mono, fontSize: 9, color: "#ff9999", letterSpacing: "1px" }}>{urgentCount} RED FLAG{urgentCount > 1 ? "S" : ""}</span>
              </div>
            )}
            <span style={{ fontFamily: FONT.body, fontSize: 13, color: "rgba(247,244,238,0.55)" }}>University Orthopedics · Dr. Diebo</span>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", display: "flex", gap: 0, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: "none",
                border: "none",
                borderBottom: `2px solid ${activeTab === tab.id ? C.teal : "transparent"}`,
                color: activeTab === tab.id ? C.white : "rgba(247,244,238,0.45)",
                fontFamily: FONT.body,
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 400,
                letterSpacing: "0.5px",
                padding: "12px 20px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 7,
                transition: "all 0.15s",
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{ background: tab.id === "messages" ? C.surgical : C.teal, color: C.white, borderRadius: 10, padding: "1px 6px", fontFamily: FONT.mono, fontSize: 10, fontWeight: 700 }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px" }}>

        {/* ── PATIENT QUEUE ── */}
        {activeTab === "queue" && !selectedPatient && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: FONT.mono, fontSize: 9, color: C.forest, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 6 }}>Today · April 8, 2026</div>
                <div style={{ fontFamily: FONT.display, fontSize: 28, fontWeight: 900, color: C.ink, letterSpacing: "0.05em", textTransform: "uppercase" }}>Patient Queue</div>
              </div>
              <button
                onClick={() => setActiveTab("send")}
                style={{ padding: "10px 20px", background: C.forest, color: C.white, border: "none", borderRadius: 6, fontFamily: FONT.body, fontSize: 13, fontWeight: 600, cursor: "pointer", letterSpacing: "0.5px" }}
              >
                + Send Intake Link
              </button>
            </div>

            <div style={{ background: C.pure, border: `1px solid ${C.canvasDark}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.2fr 1fr 1fr 80px", gap: 0, background: C.forest, padding: "10px 20px" }}>
                {["Patient", "Appointment", "Chief Complaint", "Intake", "Triage", ""].map((h, i) => (
                  <div key={i} style={{ fontFamily: FONT.mono, fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(247,244,238,0.5)" }}>{h}</div>
                ))}
              </div>

              {MOCK_PATIENTS.sort((a, b) => (b.surgeryProb || 0) - (a.surgeryProb || 0)).map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.5fr 1.2fr 1fr 1fr 80px",
                    gap: 0,
                    padding: "14px 20px",
                    borderBottom: i < MOCK_PATIENTS.length - 1 ? `1px solid ${C.canvasDark}` : "none",
                    background: p.redFlags.length > 0 ? "rgba(153,27,27,0.03)" : i % 2 === 0 ? C.pure : C.canvas,
                    cursor: "pointer",
                    transition: "background 0.1s",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontFamily: FONT.body, fontSize: 14, fontWeight: 600, color: C.ink }}>{p.name}</div>
                      {p.redFlags.length > 0 && (
                        <span style={{ fontFamily: FONT.mono, fontSize: 8, color: C.surgical, background: C.surgicalBg, padding: "2px 6px", borderRadius: 3, letterSpacing: "1px" }}>⚠ RED FLAG</span>
                      )}
                    </div>
                    <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.inkFaint, marginTop: 2 }}>{p.provider}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: FONT.body, fontSize: 13, color: C.inkMed }}>{p.appt}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: FONT.body, fontSize: 12, color: C.inkSoft, lineHeight: 1.4 }}>{p.complaint.substring(0, 45)}{p.complaint.length > 45 ? "..." : ""}</div>
                  </div>
                  <div><IntakeStatus complete={p.intakeComplete} /></div>
                  <div><PathwayBadge pathway={p.pathway} probability={p.surgeryProb} /></div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.teal, cursor: "pointer" }}>View →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PATIENT DETAIL ── */}
        {activeTab === "queue" && selectedPatient && (
          <div>
            <button
              onClick={() => setSelectedPatient(null)}
              style={{ background: "none", border: "none", fontFamily: FONT.body, fontSize: 14, color: C.inkSoft, cursor: "pointer", marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}
            >
              ← Back to Queue
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{ background: C.pure, border: `1px solid ${C.canvasDark}`, borderTop: `3px solid ${C.forest}`, borderRadius: 8, padding: "24px" }}>
                <div style={{ fontFamily: FONT.mono, fontSize: 8, letterSpacing: "2.5px", textTransform: "uppercase", color: C.inkSoft, marginBottom: 10 }}>Patient</div>
                <div style={{ fontFamily: FONT.display, fontSize: 24, fontWeight: 900, color: C.ink, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>{selectedPatient.name}</div>
                <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.inkSoft, marginBottom: 16 }}>DOB {selectedPatient.dob} · {selectedPatient.provider}</div>
                <div style={{ fontFamily: FONT.body, fontSize: 14, color: C.inkMed, lineHeight: 1.5, marginBottom: 16 }}>{selectedPatient.complaint}</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <IntakeStatus complete={selectedPatient.intakeComplete} />
                  <span style={{ fontFamily: FONT.mono, fontSize: 9, color: C.inkFaint }}>·</span>
                  <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.inkFaint }}>{selectedPatient.appt}</span>
                </div>
              </div>

              <div style={{ background: selectedPatient.pathway === "surgical" ? C.surgicalBg : selectedPatient.pathway === "interventional" ? C.interventionalBg : C.conservativeBg, border: `1px solid ${C.canvasDark}`, borderTop: `3px solid ${selectedPatient.pathway === "surgical" ? C.surgical : selectedPatient.pathway === "interventional" ? C.interventional : C.conservative}`, borderRadius: 8, padding: "24px" }}>
                <div style={{ fontFamily: FONT.mono, fontSize: 8, letterSpacing: "2.5px", textTransform: "uppercase", color: C.inkSoft, marginBottom: 10 }}>SpineTriage Engine v2.3</div>
                {selectedPatient.surgeryProb !== null ? (
                  <>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontFamily: FONT.display, fontSize: 52, fontWeight: 900, color: selectedPatient.pathway === "surgical" ? C.surgical : selectedPatient.pathway === "interventional" ? C.interventional : C.conservative, lineHeight: 1 }}>{Math.round(selectedPatient.surgeryProb * 100)}%</span>
                      <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.inkSoft }}>surgery probability</span>
                    </div>
                    <PathwayBadge pathway={selectedPatient.pathway} probability={null} />
                    {selectedPatient.redFlags.length > 0 && (
                      <div style={{ marginTop: 14, background: C.surgicalBg, border: `1px solid rgba(153,27,27,0.3)`, borderRadius: 6, padding: "10px 12px" }}>
                        <div style={{ fontFamily: FONT.mono, fontSize: 9, color: C.surgical, letterSpacing: "1.5px", marginBottom: 4 }}>RED FLAGS</div>
                        {selectedPatient.redFlags.map((f: string) => (
                          <div key={f} style={{ fontFamily: FONT.body, fontSize: 13, color: C.surgical }}>⚠ {f}</div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontFamily: FONT.body, fontSize: 15, color: C.inkSoft, marginTop: 8 }}>Intake not yet complete — triage pending</div>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{ background: C.pure, border: `1px solid ${C.canvasDark}`, borderTop: `3px solid ${C.teal}`, borderRadius: 8, padding: "22px" }}>
                <div style={{ fontFamily: FONT.mono, fontSize: 8, letterSpacing: "2.5px", textTransform: "uppercase", color: C.inkSoft, marginBottom: 14 }}>Oswestry Disability Index</div>
                <OdiBar score={selectedPatient.odi} />
              </div>

              <div style={{ background: C.pure, border: `1px solid ${C.canvasDark}`, borderTop: `3px solid ${C.gilt}`, borderRadius: 8, padding: "22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: FONT.mono, fontSize: 8, letterSpacing: "2.5px", textTransform: "uppercase", color: C.inkSoft, marginBottom: 10 }}>Athena Export</div>
                  <div style={{ fontFamily: FONT.body, fontSize: 13, color: C.inkMed, lineHeight: 1.5 }}>Export all intake data to Athena Health as a pre-visit note. Eliminates manual transcription.</div>
                </div>
                <button style={{ marginTop: 14, padding: "10px 16px", background: C.forest, color: C.white, border: "none", borderRadius: 6, fontFamily: FONT.body, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Export to Athena →
                </button>
              </div>
            </div>

            <div style={{ background: C.pure, border: `1px solid ${C.canvasDark}`, borderTop: `3px solid ${C.inkSoft}`, borderRadius: 8, padding: "22px" }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 8, letterSpacing: "2.5px", textTransform: "uppercase", color: C.inkSoft, marginBottom: 16 }}>Patient Messages</div>
              <div style={{ minHeight: 80, marginBottom: 16 }}>
                {MOCK_MESSAGES.filter(m => m.patientId === selectedPatient.id).length === 0 ? (
                  <div style={{ fontFamily: FONT.body, fontSize: 13, color: C.inkFaint, fontStyle: "italic" }}>No messages yet</div>
                ) : MOCK_MESSAGES.filter(m => m.patientId === selectedPatient.id).map(msg => (
                  <div key={msg.id} style={{ display: "flex", justifyContent: msg.direction === "inbound" ? "flex-start" : "flex-end", marginBottom: 10 }}>
                    <div style={{
                      maxWidth: "70%",
                      padding: "10px 14px",
                      borderRadius: msg.direction === "inbound" ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                      background: msg.direction === "inbound" ? C.canvas : C.forest,
                      color: msg.direction === "inbound" ? C.inkMed : C.white,
                      fontFamily: FONT.body,
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}>
                      {msg.body}
                      <div style={{ fontFamily: FONT.mono, fontSize: 9, color: msg.direction === "inbound" ? C.inkFaint : "rgba(247,244,238,0.4)", marginTop: 4 }}>{msg.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  placeholder="Send a message to patient..."
                  style={{ flex: 1, padding: "10px 14px", border: `1px solid ${C.canvasDark}`, borderRadius: 6, fontFamily: FONT.body, fontSize: 14, background: C.canvas, outline: "none" }}
                />
                <button style={{ padding: "10px 18px", background: C.forest, color: C.white, border: "none", borderRadius: 6, fontFamily: FONT.body, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Send</button>
              </div>
            </div>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {activeTab === "dashboard" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 9, color: C.forest, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 6 }}>Overview · April 2026</div>
              <div style={{ fontFamily: FONT.display, fontSize: 28, fontWeight: 900, color: C.ink, letterSpacing: "0.05em", textTransform: "uppercase" }}>Practice Dashboard</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
              <StatCard label="Patients Today" value={MOCK_PATIENTS.length} sub="6 appointments scheduled" color={C.forest} />
              <StatCard label="Intake Complete" value={`${completedToday}/${MOCK_PATIENTS.length}`} sub={`${Math.round(completedToday/MOCK_PATIENTS.length*100)}% completion rate`} color={C.teal} />
              <StatCard label="Avg Surgery Prob" value={`${avgProb}%`} sub="Across completed intakes" color={C.surgical} />
              <StatCard label="Red Flags" value={urgentCount} sub="Require immediate attention" color={urgentCount > 0 ? C.surgical : C.forest} />
            </div>

            <div style={{ background: C.pure, border: `1px solid ${C.canvasDark}`, borderTop: `3px solid ${C.forest}`, borderRadius: 8, padding: "24px", marginBottom: 16 }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 8, letterSpacing: "2.5px", textTransform: "uppercase", color: C.inkSoft, marginBottom: 20 }}>Pathway Distribution · Today</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {[
                  { label: "Surgical", count: MOCK_PATIENTS.filter(p => p.pathway === "surgical").length, color: C.surgical, bg: C.surgicalBg },
                  { label: "Interventional", count: MOCK_PATIENTS.filter(p => p.pathway === "interventional").length, color: C.interventional, bg: C.interventionalBg },
                  { label: "Conservative", count: MOCK_PATIENTS.filter(p => p.pathway === "conservative").length, color: C.conservative, bg: C.conservativeBg },
                ].map(item => (
                  <div key={item.label} style={{ background: item.bg, borderRadius: 8, padding: "16px 18px", textAlign: "center" }}>
                    <div style={{ fontFamily: FONT.display, fontSize: 36, fontWeight: 900, color: item.color, lineHeight: 1, marginBottom: 6 }}>{item.count}</div>
                    <div style={{ fontFamily: FONT.mono, fontSize: 9, color: item.color, letterSpacing: "1.5px", textTransform: "uppercase" }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SEND INTAKE LINK ── */}
        {activeTab === "send" && (
          <div style={{ maxWidth: 540 }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 9, color: C.forest, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 6 }}>New Patient</div>
              <div style={{ fontFamily: FONT.display, fontSize: 28, fontWeight: 900, color: C.ink, letterSpacing: "0.05em", textTransform: "uppercase" }}>Send Intake Link</div>
              <div style={{ fontFamily: FONT.body, fontSize: 15, color: C.inkSoft, marginTop: 8 }}>The patient will receive an SMS with a secure link to complete their intake on their phone.</div>
            </div>

            <div style={{ background: C.pure, border: `1px solid ${C.canvasDark}`, borderTop: `3px solid ${C.forest}`, borderRadius: 10, padding: "28px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {[
                  { key: "name", label: "Patient name", placeholder: "First Last", type: "text" },
                  { key: "phone", label: "Mobile phone number", placeholder: "(555) 000-0000", type: "tel" },
                  { key: "date", label: "Appointment date & time", placeholder: "", type: "datetime-local" },
                  { key: "provider", label: "Provider", placeholder: "Dr. Bassel Diebo", type: "text" },
                ].map(field => (
                  <div key={field.key}>
                    <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: C.inkSoft, marginBottom: 8 }}>{field.label}</div>
                    <input
                      type={field.type}
                      value={(sendLinkForm as any)[field.key] || ""}
                      onChange={e => setSendLinkForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      style={{ width: "100%", padding: "12px 14px", border: `1px solid ${C.canvasDark}`, borderRadius: 8, fontFamily: FONT.body, fontSize: 15, color: C.ink, outline: "none", background: C.canvas, boxSizing: "border-box" }}
                    />
                  </div>
                ))}

                <div>
                  <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: C.inkSoft, marginBottom: 8 }}>Specialty</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["spine", "knee", "shoulder", "hip", "hand"].map(s => (
                      <button
                        key={s}
                        onClick={() => setSendLinkForm(prev => ({ ...prev, specialty: s }))}
                        style={{
                          padding: "8px 14px",
                          border: `1px solid ${sendLinkForm.specialty === s ? C.teal : C.canvasDark}`,
                          borderRadius: 6,
                          background: sendLinkForm.specialty === s ? C.tealPale : C.canvas,
                          color: sendLinkForm.specialty === s ? C.tealDark : C.inkSoft,
                          fontFamily: FONT.body,
                          fontSize: 13,
                          fontWeight: sendLinkForm.specialty === s ? 600 : 400,
                          cursor: "pointer",
                          textTransform: "capitalize",
                        }}
                      >{s}</button>
                    ))}
                  </div>
                </div>

                <div style={{ background: C.canvas, borderRadius: 8, padding: "14px 16px", border: `1px dashed ${C.canvasDark}` }}>
                  <div style={{ fontFamily: FONT.mono, fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: C.inkFaint, marginBottom: 8 }}>SMS Preview</div>
                  <div style={{ fontFamily: FONT.body, fontSize: 13, color: C.inkMed, lineHeight: 1.6 }}>
                    Hi {sendLinkForm.name || "[Patient Name]"}, {sendLinkForm.provider || "your provider"} at University Orthopedics has sent you a pre-visit intake form. Takes 5 min. Complete it from your phone: aira.theopagent.ai/intake/[token] Reply STOP to opt out.
                  </div>
                </div>

                <button style={{ padding: "14px", background: C.forest, color: C.white, border: "none", borderRadius: 8, fontFamily: FONT.body, fontSize: 15, fontWeight: 600, cursor: "pointer", letterSpacing: "0.5px" }}>
                  Send Intake Link via SMS →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MESSAGES ── */}
        {activeTab === "messages" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 9, color: C.forest, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 6 }}>HIPAA-Compliant</div>
              <div style={{ fontFamily: FONT.display, fontSize: 28, fontWeight: 900, color: C.ink, letterSpacing: "0.05em", textTransform: "uppercase" }}>Patient Messages</div>
            </div>
            <div style={{ background: C.pure, border: `1px solid ${C.canvasDark}`, borderRadius: 10, overflow: "hidden" }}>
              {MOCK_MESSAGES.map((msg, i) => {
                const patient = MOCK_PATIENTS.find(p => p.id === msg.patientId);
                return (
                  <div key={msg.id} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "18px 20px", borderBottom: i < MOCK_MESSAGES.length - 1 ? `1px solid ${C.canvasDark}` : "none", background: !msg.read ? C.forestPale : C.pure, cursor: "pointer" }}
                    onClick={() => { setSelectedPatient(patient); setActiveTab("queue"); }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: !msg.read ? C.teal : "transparent", border: `2px solid ${!msg.read ? C.teal : C.canvasDark}`, marginTop: 4, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontFamily: FONT.body, fontSize: 14, fontWeight: 600, color: C.ink }}>{patient?.name}</span>
                        <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.inkFaint }}>{msg.time}</span>
                      </div>
                      <div style={{ fontFamily: FONT.body, fontSize: 13, color: C.inkMed, lineHeight: 1.5 }}>{msg.body}</div>
                    </div>
                    <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.teal }}>Reply →</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{ background: C.ink, padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 60 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: "0.15em" }}>AIRA</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 9, color: "rgba(247,244,238,0.25)" }}>· OpAgent.ai</span>
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: 9, color: "rgba(247,244,238,0.2)", letterSpacing: "1px" }}>HIPAA Compliant · © 2026 Diebo Holdings LLC</div>
        <div style={{ fontFamily: FONT.mono, fontSize: 9, color: "rgba(247,244,238,0.2)" }}>University Orthopedics Inc</div>
      </div>
    </div>
  );
}
