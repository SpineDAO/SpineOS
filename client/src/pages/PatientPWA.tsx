import { useState } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────
const C = {
  bone:      "#F0ECE4",
  boneMid:   "#E6E0D6",
  boneDark:  "#D8D0C4",
  pure:      "#FDFCF9",
  teal:      "#2D9D99",
  tealDark:  "#1C6E6B",
  tealPale:  "#E0F2F2",
  tealBorder:"#A8DEDD",
  ink:       "#1C1A16",
  inkMed:    "#3D3A32",
  inkSoft:   "#7A7568",
  inkFaint:  "#B8B2A8",
  forest:    "#163D2B",
  success:   "#163D2B",
  successBg: "#E8F2EC",
  warn:      "#B45309",
  warnBg:    "#FEF3C7",
  error:     "#991B1B",
  errorBg:   "#FEE2E2",
  white:     "#FDFCF9",
};

const FONT = {
  body:    "'Barlow', system-ui, sans-serif",
  mono:    "'IBM Plex Mono', monospace",
};

// ─── MOCK DATA ─────────────────────────────────────────────────────────
const MOCK_EPISODE = {
  patientName: "John",
  providerName: "Dr. Bassel Diebo",
  practiceName: "University Orthopedics",
  appointmentDate: "Tuesday, April 8, 2026",
  appointmentTime: "9:30 AM",
  specialty: "spine",
};

// ─── INTAKE SECTIONS ───────────────────────────────────────────────────
const SECTIONS = [
  {
    id: "demographics",
    title: "About You",
    subtitle: "Basic information to prepare for your visit",
    icon: "👤",
    questions: [
      { key: "firstName", label: "First name", type: "text", placeholder: "John" },
      { key: "lastName", label: "Last name", type: "text", placeholder: "Smith" },
      { key: "dob", label: "Date of birth", type: "date" },
      { key: "phone", label: "Best phone number", type: "tel", placeholder: "(555) 000-0000" },
      { key: "email", label: "Email address (optional)", type: "email", placeholder: "john@email.com", optional: true },
      { key: "insuranceName", label: "Insurance provider", type: "text", placeholder: "Blue Cross Blue Shield" },
      { key: "insuranceId", label: "Member ID", type: "text", placeholder: "XBX123456789" },
    ],
  },
  {
    id: "complaint",
    title: "Your Symptoms",
    subtitle: "Tell us about what brought you in today",
    icon: "🩺",
    questions: [
      { key: "chiefComplaint", label: "What is your main concern today?", type: "textarea", placeholder: "Describe your main symptom or reason for visit..." },
      { key: "onsetDate", label: "When did this start?", type: "select", options: ["Less than 2 weeks ago", "2–6 weeks ago", "6 weeks to 3 months ago", "3–6 months ago", "More than 6 months ago", "More than 1 year ago"] },
      { key: "nrsBack", label: "Back / neck pain right now (0 = none, 10 = worst imaginable)", type: "slider", min: 0, max: 10 },
      { key: "nrsLeg", label: "Arm / leg pain right now (0 = none, 10 = worst imaginable)", type: "slider", min: 0, max: 10 },
      { key: "painCharacter", label: "How would you describe your pain?", type: "multiselect", options: ["Aching", "Sharp / stabbing", "Burning", "Numbness", "Tingling / pins & needles", "Pressure / heaviness"] },
      { key: "radiation", label: "Does pain travel down your arm or leg?", type: "yesno" },
    ],
  },
  {
    id: "history",
    title: "Medical History",
    subtitle: "Help us understand your health background",
    icon: "📋",
    questions: [
      { key: "priorSurgery", label: "Have you had any prior spine or joint surgery?", type: "yesno" },
      { key: "medications", label: "Current medications", type: "textarea", placeholder: "List medications and doses, or write 'None'" },
      { key: "allergies", label: "Known allergies", type: "text", placeholder: "e.g. Penicillin, or None" },
      { key: "smoking", label: "Do you currently smoke?", type: "select", options: ["No, never", "No, I quit", "Yes, occasionally", "Yes, daily"] },
      { key: "conditions", label: "Do you have any of the following?", type: "multiselect", options: ["Diabetes", "High blood pressure", "Heart disease", "Osteoporosis", "Cancer (current or past)", "Blood clotting disorder", "None of the above"] },
    ],
  },
  {
    id: "neuro",
    title: "Neurological Check",
    subtitle: "Important safety questions — answer honestly",
    icon: "⚡",
    questions: [
      { key: "weakness", label: "Do you have weakness in your arms or legs?", type: "yesno" },
      { key: "bowelBladder", label: "Any new problems with bowel or bladder control?", type: "yesno", redFlag: true },
      { key: "balance", label: "Problems with balance or falling?", type: "yesno" },
      { key: "bilateral", label: "Do both legs have pain or numbness at the same time?", type: "yesno", redFlag: true },
    ],
  },
  {
    id: "proms",
    title: "Disability Assessment",
    subtitle: "The Oswestry Disability Index — takes about 3 minutes",
    icon: "📊",
    questions: [
      { key: "odi_pain", label: "Pain intensity", type: "odi", options: ["I have no pain at the moment", "The pain is very mild at the moment", "The pain is moderate at the moment", "The pain is fairly severe at the moment", "The pain is very severe at the moment", "The pain is the worst imaginable at the moment"] },
      { key: "odi_personal_care", label: "Personal care (washing, dressing, etc.)", type: "odi", options: ["I can look after myself normally without causing extra pain", "I can look after myself normally but it causes extra pain", "It is painful to look after myself and I am slow and careful", "I need some help but manage most of my personal care", "I need help every day in most aspects of self care", "I do not get dressed, wash with difficulty and stay in bed"] },
      { key: "odi_lifting", label: "Lifting", type: "odi", options: ["I can lift heavy weights without extra pain", "I can lift heavy weights but it gives extra pain", "Pain prevents me lifting heavy weights off the floor, but I can manage if they are conveniently placed", "Pain prevents me from lifting heavy weights but I can manage light to medium weights if conveniently positioned", "I can lift only very light weights", "I cannot lift or carry anything at all"] },
      { key: "odi_walking", label: "Walking", type: "odi", options: ["Pain does not prevent me walking any distance", "Pain prevents me walking more than 1 mile", "Pain prevents me walking more than 1/2 mile", "Pain prevents me walking more than 100 yards", "I can only walk using a stick or crutches", "I am in bed most of the time and have to crawl to the toilet"] },
      { key: "odi_sitting", label: "Sitting", type: "odi", options: ["I can sit in any chair as long as I like", "I can only sit in my favorite chair as long as I like", "Pain prevents me sitting more than 1 hour", "Pain prevents me from sitting more than 30 minutes", "Pain prevents me from sitting more than 10 minutes", "Pain prevents me from sitting at all"] },
    ],
  },
  {
    id: "treatment",
    title: "Previous Treatment",
    subtitle: "What have you tried so far?",
    icon: "💊",
    questions: [
      { key: "physicalTherapy", label: "Have you tried physical therapy?", type: "yesno" },
      { key: "injections", label: "Have you had any injections for this condition?", type: "yesno" },
      { key: "imaging", label: "Do you have MRI or X-ray results available?", type: "yesno" },
      { key: "imagingType", label: "What imaging do you have?", type: "multiselect", options: ["X-ray", "MRI", "CT scan", "None available"], dependsOn: "imaging" },
      { key: "surgeryWilling", label: "If surgery is recommended, would you consider it?", type: "select", options: ["Yes, absolutely", "Yes, if conservative treatment fails", "Not sure — I'd want to discuss options", "I prefer to avoid surgery if possible"] },
    ],
  },
];

// ─── COMPONENTS ────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 3, background: C.boneDark }}>
      <div style={{
        height: "100%",
        width: `${pct}%`,
        background: C.teal,
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}

function SliderInput({ value, onChange, min, max }: { value: any; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            style={{
              width: 36, height: 36,
              borderRadius: "50%",
              border: value === n ? "none" : `1px solid ${C.boneDark}`,
              background: value === n ? C.teal : C.pure,
              color: value === n ? C.white : n >= 7 ? C.error : n >= 4 ? C.warn : C.inkSoft,
              fontFamily: FONT.mono,
              fontSize: 13,
              fontWeight: value === n ? 700 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
          >{n}</button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.inkFaint }}>No pain</span>
        <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.error }}>Worst imaginable</span>
      </div>
    </div>
  );
}

function YesNo({ value, onChange }: { value: any; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
      {["Yes", "No"].map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            padding: "18px 0",
            border: `2px solid ${value === opt ? C.teal : C.boneDark}`,
            borderRadius: 12,
            background: value === opt ? C.tealPale : C.pure,
            color: value === opt ? C.tealDark : C.inkMed,
            fontFamily: FONT.body,
            fontSize: 18,
            fontWeight: value === opt ? 600 : 400,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >{opt}</button>
      ))}
    </div>
  );
}

function SelectInput({ value, onChange, options }: { value: any; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            padding: "16px 18px",
            border: `2px solid ${value === opt ? C.teal : C.boneDark}`,
            borderRadius: 12,
            background: value === opt ? C.tealPale : C.pure,
            color: value === opt ? C.tealDark : C.inkMed,
            fontFamily: FONT.body,
            fontSize: 15,
            fontWeight: value === opt ? 600 : 400,
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{opt}</span>
          {value === opt && <span style={{ color: C.teal, fontSize: 18 }}>✓</span>}
        </button>
      ))}
    </div>
  );
}

function MultiSelect({ value = [], onChange, options }: { value: string[]; onChange: (v: string[]) => void; options: string[] }) {
  const toggle = (opt: string) => {
    if (opt === "None of the above" || opt === "None available") {
      onChange([opt]);
      return;
    }
    const filtered = value.filter(v => v !== "None of the above" && v !== "None available");
    const next = filtered.includes(opt)
      ? filtered.filter(v => v !== opt)
      : [...filtered, opt];
    onChange(next);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
      {options.map(opt => {
        const selected = value.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            style={{
              padding: "14px 18px",
              border: `2px solid ${selected ? C.teal : C.boneDark}`,
              borderRadius: 12,
              background: selected ? C.tealPale : C.pure,
              color: selected ? C.tealDark : C.inkMed,
              fontFamily: FONT.body,
              fontSize: 15,
              fontWeight: selected ? 600 : 400,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{
              width: 22, height: 22,
              borderRadius: 6,
              border: `2px solid ${selected ? C.teal : C.boneDark}`,
              background: selected ? C.teal : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.15s",
            }}>
              {selected && <span style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>✓</span>}
            </span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function OdiSelect({ value, onChange, options }: { value: any; onChange: (v: number) => void; options: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          style={{
            padding: "14px 18px",
            border: `2px solid ${value === i ? C.teal : C.boneDark}`,
            borderRadius: 12,
            background: value === i ? C.tealPale : C.pure,
            color: value === i ? C.tealDark : C.inkMed,
            fontFamily: FONT.body,
            fontSize: 14,
            fontWeight: value === i ? 600 : 400,
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <span style={{
            fontFamily: FONT.mono,
            fontSize: 11,
            color: value === i ? C.teal : C.inkFaint,
            minWidth: 16,
            marginTop: 1,
          }}>{i}</span>
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── SCREENS ───────────────────────────────────────────────────────────

function WelcomeScreen({ episode, onStart }: { episode: any; onStart: () => void }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: C.bone,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      fontFamily: FONT.body,
    }}>
      <div style={{
        width: 64, height: 64,
        borderRadius: "50%",
        background: C.teal,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 28,
        boxShadow: "0 8px 32px rgba(45,157,153,0.25)",
      }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 18, fontWeight: 700, color: C.white, letterSpacing: "0.1em" }}>AI</span>
      </div>

      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 1 }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 28, fontWeight: 700, color: C.teal, letterSpacing: "0.15em" }}>AI</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 28, fontWeight: 400, color: C.inkSoft, letterSpacing: "0.15em" }}>RA</span>
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: 9, color: C.inkFaint, letterSpacing: "3px", textTransform: "uppercase", marginTop: 4 }}>
          by OpAgent.ai
        </div>
      </div>

      <div style={{
        background: C.pure,
        borderRadius: 20,
        padding: "32px 28px",
        maxWidth: 400,
        width: "100%",
        boxShadow: "0 4px 40px rgba(0,0,0,0.07)",
        marginBottom: 28,
      }}>
        <div style={{
          fontFamily: FONT.mono,
          fontSize: 9,
          color: C.teal,
          letterSpacing: "3px",
          textTransform: "uppercase",
          marginBottom: 16,
        }}>Pre-Visit Intake</div>

        <div style={{ fontSize: 22, fontWeight: 600, color: C.ink, marginBottom: 8, lineHeight: 1.3 }}>
          Hi {episode.patientName},
        </div>
        <div style={{ fontSize: 16, color: C.inkMed, lineHeight: 1.6, marginBottom: 24 }}>
          {episode.providerName} at {episode.practiceName} has asked you to complete a short intake form before your visit.
        </div>

        <div style={{
          background: C.bone,
          borderRadius: 12,
          padding: "16px 18px",
          marginBottom: 24,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.inkFaint, letterSpacing: "1px", textTransform: "uppercase" }}>Appointment</span>
            <span style={{ fontFamily: FONT.body, fontSize: 14, fontWeight: 600, color: C.ink }}>{episode.appointmentDate}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.inkFaint, letterSpacing: "1px", textTransform: "uppercase" }}>Time</span>
            <span style={{ fontFamily: FONT.body, fontSize: 14, fontWeight: 600, color: C.ink }}>{episode.appointmentTime}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.inkFaint, letterSpacing: "1px", textTransform: "uppercase" }}>Provider</span>
            <span style={{ fontFamily: FONT.body, fontSize: 14, fontWeight: 600, color: C.ink }}>{episode.providerName}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          {["⏱ ~5 minutes", "🔒 Secure & private", "📱 Mobile-friendly"].map(item => (
            <div key={item} style={{
              fontFamily: FONT.body,
              fontSize: 11,
              color: C.inkSoft,
              background: C.bone,
              padding: "4px 10px",
              borderRadius: 20,
            }}>{item}</div>
          ))}
        </div>

        <button
          onClick={onStart}
          style={{
            width: "100%",
            padding: "18px",
            background: C.teal,
            color: C.white,
            border: "none",
            borderRadius: 14,
            fontFamily: FONT.body,
            fontSize: 17,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            letterSpacing: "0.02em",
            boxShadow: "0 4px 20px rgba(45,157,153,0.35)",
            transition: "all 0.15s",
          }}
        >
          Begin Intake
          <span style={{ fontSize: 20 }}>→</span>
        </button>
      </div>

      <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.inkFaint, letterSpacing: "1px", textAlign: "center", lineHeight: 1.6 }}>
        HIPAA Compliant · Encrypted · Not stored after visit
      </div>
    </div>
  );
}

function IntakeScreen({ section, question, qIndex, totalQ, responses, onAnswer, onNext, onBack, isLast }: any) {
  const value = responses[question.key];
  const hasAnswer = value !== undefined && value !== "" && value !== null &&
    !(Array.isArray(value) && value.length === 0);

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bone,
      fontFamily: FONT.body,
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{
        background: C.pure,
        padding: "16px 20px 14px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        borderBottom: `1px solid ${C.boneDark}`,
        marginTop: 3,
      }}>
        <button
          onClick={onBack}
          style={{
            background: "none", border: "none",
            color: C.inkSoft, fontSize: 20,
            cursor: "pointer", padding: "4px 8px",
            borderRadius: 8,
          }}
        >←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 9, color: C.teal, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 2 }}>
            {section.icon} {section.title}
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.inkFaint }}>
            Question {qIndex + 1} of {totalQ}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "28px 20px 120px", maxWidth: 520, margin: "0 auto", width: "100%" }}>
        {question.redFlag && (
          <div style={{
            background: C.errorBg,
            border: `1px solid rgba(153,27,27,0.2)`,
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontFamily: FONT.body, fontSize: 13, color: C.error }}>
              This is an important safety question. Please answer carefully.
            </span>
          </div>
        )}

        <div style={{ fontSize: 20, fontWeight: 600, color: C.ink, lineHeight: 1.4, marginBottom: 24 }}>
          {question.label}
          {question.optional && (
            <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.inkFaint, fontWeight: 400, marginLeft: 8 }}>optional</span>
          )}
        </div>

        {question.type === "text" && (
          <input
            type={question.type}
            value={value || ""}
            onChange={e => onAnswer(question.key, e.target.value)}
            placeholder={question.placeholder}
            style={{
              width: "100%",
              padding: "16px 18px",
              background: C.pure,
              border: `2px solid ${value ? C.teal : C.boneDark}`,
              borderRadius: 12,
              fontFamily: FONT.body,
              fontSize: 17,
              color: C.ink,
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
          />
        )}

        {question.type === "tel" && (
          <input
            type="tel"
            value={value || ""}
            onChange={e => onAnswer(question.key, e.target.value)}
            placeholder={question.placeholder}
            style={{
              width: "100%",
              padding: "16px 18px",
              background: C.pure,
              border: `2px solid ${value ? C.teal : C.boneDark}`,
              borderRadius: 12,
              fontFamily: FONT.body,
              fontSize: 17,
              color: C.ink,
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
          />
        )}

        {question.type === "email" && (
          <input
            type="email"
            value={value || ""}
            onChange={e => onAnswer(question.key, e.target.value)}
            placeholder={question.placeholder}
            style={{
              width: "100%",
              padding: "16px 18px",
              background: C.pure,
              border: `2px solid ${value ? C.teal : C.boneDark}`,
              borderRadius: 12,
              fontFamily: FONT.body,
              fontSize: 17,
              color: C.ink,
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
          />
        )}

        {question.type === "date" && (
          <input
            type="date"
            value={value || ""}
            onChange={e => onAnswer(question.key, e.target.value)}
            style={{
              width: "100%",
              padding: "16px 18px",
              background: C.pure,
              border: `2px solid ${value ? C.teal : C.boneDark}`,
              borderRadius: 12,
              fontFamily: FONT.body,
              fontSize: 17,
              color: C.ink,
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
          />
        )}

        {question.type === "textarea" && (
          <textarea
            value={value || ""}
            onChange={e => onAnswer(question.key, e.target.value)}
            placeholder={question.placeholder}
            rows={5}
            style={{
              width: "100%",
              padding: "16px 18px",
              background: C.pure,
              border: `2px solid ${value ? C.teal : C.boneDark}`,
              borderRadius: 12,
              fontFamily: FONT.body,
              fontSize: 16,
              color: C.ink,
              outline: "none",
              boxSizing: "border-box",
              resize: "vertical",
              lineHeight: 1.6,
              transition: "border-color 0.15s",
            }}
          />
        )}

        {question.type === "slider" && (
          <SliderInput
            value={value}
            onChange={v => onAnswer(question.key, v)}
            min={question.min}
            max={question.max}
          />
        )}

        {question.type === "yesno" && (
          <YesNo value={value} onChange={v => onAnswer(question.key, v)} />
        )}

        {question.type === "select" && (
          <SelectInput
            value={value}
            onChange={v => onAnswer(question.key, v)}
            options={question.options}
          />
        )}

        {question.type === "multiselect" && (
          <MultiSelect
            value={value}
            onChange={v => onAnswer(question.key, v)}
            options={question.options}
          />
        )}

        {question.type === "odi" && (
          <OdiSelect
            value={value}
            onChange={v => onAnswer(question.key, v)}
            options={question.options}
          />
        )}
      </div>

      <div style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        background: C.pure,
        borderTop: `1px solid ${C.boneDark}`,
        padding: "16px 20px",
        display: "flex",
        gap: 12,
      }}>
        <button
          onClick={onNext}
          disabled={!hasAnswer && !question.optional}
          style={{
            flex: 1,
            padding: "16px",
            background: (hasAnswer || question.optional) ? C.teal : C.boneDark,
            color: (hasAnswer || question.optional) ? C.white : C.inkFaint,
            border: "none",
            borderRadius: 12,
            fontFamily: FONT.body,
            fontSize: 16,
            fontWeight: 600,
            cursor: (hasAnswer || question.optional) ? "pointer" : "not-allowed",
            transition: "all 0.15s",
            boxShadow: (hasAnswer || question.optional) ? "0 4px 16px rgba(45,157,153,0.3)" : "none",
          }}
        >
          {isLast ? "Complete Intake" : "Continue →"}
        </button>
      </div>
    </div>
  );
}

function SectionIntroScreen({ section, sectionIndex, totalSections, onContinue, onBack }: any) {
  return (
    <div style={{
      minHeight: "100vh",
      background: C.bone,
      fontFamily: FONT.body,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
    }}>
      <div style={{ fontSize: 56, marginBottom: 24 }}>{section.icon}</div>

      <div style={{
        fontFamily: FONT.mono,
        fontSize: 9,
        color: C.teal,
        letterSpacing: "3px",
        textTransform: "uppercase",
        marginBottom: 12,
      }}>
        Section {sectionIndex + 1} of {totalSections}
      </div>

      <div style={{ fontSize: 28, fontWeight: 700, color: C.ink, textAlign: "center", marginBottom: 12, lineHeight: 1.2 }}>
        {section.title}
      </div>

      <div style={{ fontSize: 16, color: C.inkSoft, textAlign: "center", marginBottom: 40, maxWidth: 320, lineHeight: 1.6 }}>
        {section.subtitle}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 380 }}>
        <button
          onClick={onContinue}
          style={{
            padding: "18px",
            background: C.teal,
            color: C.white,
            border: "none",
            borderRadius: 14,
            fontFamily: FONT.body,
            fontSize: 17,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(45,157,153,0.35)",
          }}
        >
          Start Section →
        </button>
        {sectionIndex > 0 && (
          <button
            onClick={onBack}
            style={{
              padding: "16px",
              background: "transparent",
              color: C.inkSoft,
              border: `1px solid ${C.boneDark}`,
              borderRadius: 14,
              fontFamily: FONT.body,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            ← Go Back
          </button>
        )}
      </div>
    </div>
  );
}

function CompletionScreen({ episode, responses }: { episode: any; responses: Record<string, any> }) {
  const redFlags = ["Yes" === responses.bowelBladder, "Yes" === responses.bilateral, "Yes" === responses.weakness]
    .filter(Boolean).length;

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bone,
      fontFamily: FONT.body,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "60px 24px 40px",
    }}>
      {redFlags > 0 ? (
        <div style={{
          background: C.errorBg,
          border: `2px solid ${C.error}`,
          borderRadius: 16,
          padding: "24px",
          maxWidth: 400,
          width: "100%",
          marginBottom: 32,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.error, marginBottom: 8 }}>
            Urgent: Please Call Us
          </div>
          <div style={{ fontSize: 15, color: C.error, lineHeight: 1.6 }}>
            Based on your answers, we recommend contacting our office immediately or going to the emergency room if symptoms are severe.
          </div>
        </div>
      ) : (
        <div style={{
          width: 80, height: 80,
          borderRadius: "50%",
          background: C.successBg,
          border: `3px solid ${C.success}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36,
          marginBottom: 24,
        }}>✓</div>
      )}

      <div style={{ fontSize: 28, fontWeight: 700, color: C.ink, textAlign: "center", marginBottom: 12 }}>
        You're all set
      </div>
      <div style={{ fontSize: 16, color: C.inkSoft, textAlign: "center", marginBottom: 40, maxWidth: 320, lineHeight: 1.6 }}>
        Your information has been securely sent to {episode.practiceName}.
        {" "}We'll send you a reminder before your visit.
      </div>

      <div style={{
        background: C.pure,
        borderRadius: 16,
        padding: "24px",
        maxWidth: 400,
        width: "100%",
        marginBottom: 24,
      }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 9, color: C.teal, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>
          Your Appointment
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            ["Provider", episode.providerName],
            ["Date", episode.appointmentDate],
            ["Time", episode.appointmentTime],
            ["Location", episode.practiceName],
          ].map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, borderBottom: `1px solid ${C.boneDark}` }}>
              <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.inkFaint, letterSpacing: "1px", textTransform: "uppercase" }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.inkFaint, letterSpacing: "1px", textAlign: "center" }}>
        Questions? Reply to the text message we sent you.
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────

export default function AIRAPatientPWA() {
  const [screen, setScreen] = useState("welcome");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});

  const allQuestions = SECTIONS.flatMap(s =>
    s.questions.map(q => ({ ...q, section: s }))
  );

  const totalQ = allQuestions.length;
  const currentQ = allQuestions[questionIndex];

  const answered = Object.keys(responses).length;

  const handleAnswer = (key: string, value: any) => {
    setResponses(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (questionIndex < totalQ - 1) {
      const nextQ = allQuestions[questionIndex + 1];
      const nextSection = SECTIONS.findIndex(s => s.id === nextQ.section.id);
      const currentSection = SECTIONS.findIndex(s => s.id === currentQ.section.id);

      if (nextSection !== currentSection) {
        setSectionIndex(nextSection);
        setQuestionIndex(questionIndex + 1);
        setScreen("section_intro");
      } else {
        setQuestionIndex(questionIndex + 1);
        setScreen("question");
      }
    } else {
      setScreen("complete");
    }
  };

  const handleBack = () => {
    if (screen === "question" && questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
    } else if (screen === "section_intro" && sectionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
      setScreen("question");
    } else if (screen === "question" && questionIndex === 0) {
      setScreen("welcome");
    }
  };

  const handleSectionContinue = () => {
    setScreen("question");
  };

  return (
    <div style={{ fontFamily: FONT.body, maxWidth: 600, margin: "0 auto" }}>
      <ProgressBar current={answered} total={totalQ} />

      {screen === "welcome" && (
        <WelcomeScreen
          episode={MOCK_EPISODE}
          onStart={() => setScreen("section_intro")}
        />
      )}

      {screen === "section_intro" && (
        <SectionIntroScreen
          section={SECTIONS[sectionIndex]}
          sectionIndex={sectionIndex}
          totalSections={SECTIONS.length}
          onContinue={handleSectionContinue}
          onBack={handleBack}
        />
      )}

      {screen === "question" && currentQ && (
        <IntakeScreen
          section={currentQ.section}
          question={currentQ}
          qIndex={questionIndex}
          totalQ={totalQ}
          responses={responses}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onBack={handleBack}
          isLast={questionIndex === totalQ - 1}
        />
      )}

      {screen === "complete" && (
        <CompletionScreen
          episode={MOCK_EPISODE}
          responses={responses}
        />
      )}
    </div>
  );
}
