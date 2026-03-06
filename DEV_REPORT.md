# SpineOS "Bill" - Development Report & Acquisition Roadmap

**Version:** 2.0 Analysis | **Date:** March 2026 | **Target:** $20M Acquisition in 12 Months

---

## EXECUTIVE SUMMARY

SpineOS is a spine surgery billing intelligence platform with a polished React frontend, Claude AI integration for operative note coding, and a comprehensive seed data layer (50 CPT codes, payer profiles, NCCI edits, MGMA benchmarks). The UI is production-quality. The backend is not.

**Current state:** Beautiful demo. Every "AI processing" pathway outside of the Claude API call is hardcoded or simulated. The approve/reject/edit buttons in billing don't persist. Document AI fakes extraction results. No tests, no backend server, no HIPAA controls, no audit trail. The API key is stored in React state and lost on refresh.

**What it takes to be worth $20M:** Transform from a frontend prototype into a HIPAA-compliant, backend-first AI billing engine with provable accuracy metrics, real-world validation data from Nicola's testing, and a clear path to multi-practice deployment. The acquirer buys the trained model + validation dataset + workflow, not the React UI.

---

## PART 1: CURRENT STATE AUDIT

### 1.1 Architecture

```
Current:
Browser (React/Vite) --> Supabase (auth + JSONB storage)
                     --> Anthropic API (direct browser call)
                     --> Local rule engine (fallback)

Problems:
- No backend server at all
- API key exposed in browser (HIPAA violation)
- No audit logging
- No PHI encryption at rest
- CORS hack: 'anthropic-dangerous-direct-browser-access'
- Single JSONB column stores all case data (no queryable structure)
```

### 1.2 Component Inventory & Functionality Assessment

| Component | Status | What Works | What's Fake |
|-----------|--------|-----------|-------------|
| **AICodeEngine** | Partial | Claude API call works, local rule engine works | Local engine is basic keyword matching |
| **DocumentAI** | Fake | File upload UI works | ALL extraction is hardcoded mock data. No PDF/DOCX parsing. No actual AI processing of documents. |
| **BillingPortal** | Fake | Renders cases, charts work | Approve/Edit/Reject buttons do nothing. Batch processing is static UI. NCCI checker has no logic. |
| **SurgeonPortal** | Partial | Case list renders, dictation works | Voice-to-code pipeline incomplete (dictation doesn't feed to AI engine) |
| **RVUPayerEngine** | Works | CPT lookup, payer comparison, code swap simulator | All static seed data - no live fee schedule updates |
| **ComplianceShield** | Partial | Audit scoring algorithm works | Pre-submission checklist is read-only. Export does nothing. Revenue numbers hardcoded. |
| **LearningEngine** | Fake | UI renders, signal counting works | "Model confidence" is hardcoded. Data injection simulates indexing but does nothing. Multi-site is static. |
| **ProductivityHub** | Works | All charts/calculations work from case data | Seed data only - no real historical data pipeline |
| **Dashboard** | Works | Aggregation and charts work | MGMA benchmarks are static |
| **Auth** | Works | Supabase auth with email/password | No RBAC - role is a client-side toggle anyone can switch |

### 1.3 Critical Gaps for Production

1. **No Backend Server** - Everything runs in the browser. For medical billing AI, you need server-side processing for HIPAA, audit trails, and model execution.

2. **No HIPAA Compliance** - No BAA with infrastructure providers, no encryption at rest for PHI, no audit logging, no access controls, no data retention policies.

3. **No Real RBAC** - The surgeon/billing toggle is cosmetic. Both roles see and can do everything. For Nicola to test as a biller, she needs actual role-restricted views and permissions.

4. **No Test Suite** - Zero tests. No unit tests, no integration tests, no e2e tests. The CI workflow exists but has nothing to run.

5. **No Evaluation Framework** - No way to measure coding accuracy, track improvements over time, or prove to an acquirer that the system works.

6. **API Key Management** - Stored in React state, lost on page refresh, exposed in browser network tab. Needs server-side proxy.

7. **Document Processing is Entirely Mocked** - Despite accepting PDF, DOCX, Excel, and images, zero actual parsing happens. All results are hardcoded.

8. **Training Signals Are Collected But Never Used** - The LearningEngine stores accept/reject/edit signals but they don't influence any model behavior.

---

## PART 2: THE ACQUISITION THESIS

### Who Buys This and Why

**Acquirer profiles:**
- **EHR/PM companies** (athenahealth, eClinicalWorks, Modernizing Medicine) - Want AI coding to differentiate. $20M is a feature acquisition.
- **RCM companies** (R1 RCM, Ensemble Health Partners, Waystar) - Want to automate what their billers do. $20M for a proven spine coding engine is cheap.
- **AI health companies** (Regard, Suki, Nuance/MSFT) - Want specialty-specific training data and validation sets.

**What they're actually buying:**
1. A validated, accurate AI coding engine for spine surgery (the hardest specialty to code)
2. A proprietary evaluation dataset with surgeon-verified ground truth
3. A workflow that billers have actually used and validated
4. Proof that it reduces denial rates and increases clean claim rates
5. A training feedback loop that improves over time

**They are NOT buying the React frontend.** Every acquirer has their own UI. They buy the engine, the data, and the proof.

### The $20M Math

To justify $20M at typical health-tech multiples (8-15x ARR for AI companies):
- **Revenue path:** $1.3M-$2.5M ARR at acquisition
- **OR** zero revenue but $20M+ in provable annual value creation across a realistic TAM with validated accuracy data

The faster path is **value-based proof without revenue.** Prove that SpineOS:
- Saves 15-20 min per case in coding time (at $50/hr biller rate = $12-17 per case)
- Reduces denial rate by 30-40% (average spine denial costs $500-2000 to appeal)
- Catches under-coding worth $200-500 per case

For a 500-case/year spine practice, that's **$100K-250K/year in value per surgeon.** With 5,000+ spine surgeons in the US, the TAM is $500M-1.25B. A proven engine is easily worth $20M.

---

## PART 3: 12-MONTH ROADMAP

### Phase 0: Foundation (Weeks 1-4) - "Make It Real"

**Goal:** Transform from frontend demo to working backend-first application that you and Nicola can actually use.

#### 0.1 Backend Server
- [ ] Create Node.js/Express (or Python/FastAPI) backend server
- [ ] Move ALL Anthropic API calls server-side (eliminate browser key exposure)
- [ ] Implement proper API proxy with rate limiting
- [ ] Server-side session management with JWT tokens

#### 0.2 Real Authentication & RBAC
- [ ] Two roles: `surgeon` (you) and `biller` (Nicola)
- [ ] Surgeon can: submit op notes, review AI suggestions, approve/edit codes, view own stats
- [ ] Biller can: see audit queue, approve/reject/edit codes, manage denials, view compliance
- [ ] Role enforced server-side, not client-side toggle
- [ ] Invite flow: you invite Nicola via email

#### 0.3 Database Schema v2
```sql
-- Replace single JSONB blob with proper schema
CREATE TABLE practices (id, name, npi, created_at);
CREATE TABLE users (id, email, role, practice_id, created_at);
CREATE TABLE cases (id, practice_id, submitted_by, patient_mrn_hash,
                    procedure_date, status, created_at, updated_at);
CREATE TABLE coding_results (id, case_id, engine_version,
                            cpt_codes JSONB, icd10_codes JSONB,
                            confidence, raw_response, created_at);
CREATE TABLE coding_reviews (id, coding_result_id, reviewer_id,
                            action, original_codes JSONB,
                            final_codes JSONB, review_notes, created_at);
CREATE TABLE audit_log (id, user_id, action, resource_type,
                       resource_id, metadata JSONB, created_at);
```

#### 0.4 Wire Up the Billing Workflow
- [ ] Approve button actually finalizes a case (status -> 'finalized', creates audit log entry)
- [ ] Edit button opens code editing modal, saves diff as training signal
- [ ] Reject button sends case back to surgeon with notes
- [ ] Each action creates an audit trail entry

**Deliverable:** A working 2-user app where you submit op notes and Nicola reviews them.

---

### Phase 1: AI Engine v1 (Weeks 5-10) - "Make It Smart"

**Goal:** Build the real AI coding engine that Nicola tests against.

#### 1.1 Structured Prompting Pipeline
- [ ] Multi-stage prompting (not single prompt):
  1. **Extract** - Pull structured data from op note (levels, approach, diagnosis, implants, graft, complications)
  2. **Code** - Map extracted data to CPT/ICD-10 codes with rationale
  3. **Validate** - Run NCCI edit checks, modifier logic, payer-specific rules
  4. **Review** - Generate confidence scores and flag areas for human review
- [ ] Use Claude's structured output (JSON mode) for reliable parsing
- [ ] Implement prompt versioning - every prompt change is a new version, tracked in DB

#### 1.2 Real Document Processing
- [ ] PDF text extraction (pdf.js or server-side pdftotext)
- [ ] DOCX parsing (mammoth.js or python-docx)
- [ ] Excel/CSV parsing for case logs (already have xlsx dep, wire it up)
- [ ] OCR pipeline for scanned documents (Tesseract or cloud OCR)
- [ ] Feed extracted text into the same AI coding pipeline

#### 1.3 Knowledge Base
- [ ] Embed the full CPT codebook for spine (not just 50 codes - all ~200 spine-relevant codes)
- [ ] Embed NCCI edit pairs (full CMS dataset, not hand-picked)
- [ ] Embed LCD policies for major payers
- [ ] Store as retrievable context (RAG or system prompt injection based on case characteristics)
- [ ] Version the knowledge base - when CMS updates codes, track the change

#### 1.4 Payer-Specific Intelligence
- [ ] Different payers have different rules - encode them
- [ ] Prior auth requirement database (pulled from payer portals)
- [ ] Payer-specific denial pattern analysis (from Nicola's real-world feedback)

**Deliverable:** AI engine that produces coding recommendations from real op notes with tracked accuracy.

---

### Phase 2: Evaluation Framework (Weeks 5-12, parallel with Phase 1) - "Prove It Works"

**THIS IS THE MOST IMPORTANT PHASE. Without eval, you have nothing to sell.**

#### 2.1 Ground Truth Dataset
- [ ] Create a gold-standard evaluation set of 100+ operative notes with verified correct codes
- [ ] Sources:
  - Your real op notes (de-identified) with codes you know are correct
  - Nicola's corrections to AI output (each correction = ground truth)
  - Synthetic op notes you write covering edge cases
  - Published case studies from spine surgery coding literature
- [ ] Each ground truth case includes:
  - Op note text
  - Correct CPT codes with modifiers
  - Correct ICD-10 codes
  - Correct wRVU total
  - Payer context
  - Any special considerations (NCCI edits, etc.)

#### 2.2 Evaluation Metrics (The Numbers That Sell)

```
PRIMARY METRICS (report to acquirer):
- CPT Code Accuracy: % of cases where all primary CPT codes match ground truth
- CPT Code Recall: % of legitimate billable codes captured (under-coding detection)
- CPT Code Precision: % of suggested codes that are correct (over-coding prevention)
- ICD-10 Accuracy: % of cases with correct primary diagnosis codes
- wRVU Accuracy: Mean absolute error of total wRVU vs ground truth
- NCCI Compliance: % of cases with zero NCCI edit violations
- Modifier Accuracy: % of modifier suggestions that are correct
- Denial Prediction: % of denied claims correctly predicted pre-submission

SECONDARY METRICS (operational):
- Time to Code: seconds from op note submission to coding result
- Human Override Rate: % of cases where biller changes AI suggestion
- Confidence Calibration: when AI says 90% confident, is it right 90% of the time?
- First-Pass Clean Claim Rate: % of claims accepted without denial on first submission
```

#### 2.3 Automated Eval Pipeline
- [ ] `npm run eval` or `python eval.py` runs full eval suite against ground truth
- [ ] Outputs a scorecard with all metrics
- [ ] Runs on every prompt change or engine update
- [ ] Stores historical results to show improvement over time
- [ ] Regression detection: alert if accuracy drops after a change

#### 2.4 Eval Dashboard (in-app)
- [ ] Replace the fake "Model Confidence: 89%" in LearningEngine with real metrics
- [ ] Show accuracy trends over time (the upward curve is what sells)
- [ ] Show per-procedure-type accuracy (ACDF vs TLIF vs decompression)
- [ ] Show per-payer accuracy

**Deliverable:** A scorecard that says "SpineOS codes spine surgery at 94% accuracy with 97% recall, validated against 200+ ground truth cases reviewed by a spine surgeon and certified coder."

---

### Phase 3: Nicola Beta (Weeks 6-16) - "Real-World Validation"

**Goal:** Nicola uses SpineOS daily on real cases. Every interaction generates training data.

#### 3.1 Biller Workflow (Nicola's Daily Loop)
```
1. You submit an op note (real or synthetic)
2. AI generates coding recommendation
3. Case appears in Nicola's audit queue
4. Nicola reviews:
   a. APPROVE - codes are correct (training signal: positive)
   b. EDIT - codes need changes (training signal: correction + rationale)
   c. REJECT - codes are wrong, needs re-analysis (training signal: negative)
5. Every action is logged with timestamp, original vs final codes, and notes
6. Weekly summary shows accuracy trend
```

#### 3.2 Synthetic Op Note Generator
- [ ] Build a tool that generates realistic synthetic op notes for testing
- [ ] Cover all common spine procedures:
  - ACDF (1-4 levels)
  - Posterior cervical fusion
  - Lumbar decompression (laminectomy, microdiscectomy)
  - TLIF / PLIF
  - Lateral interbody fusion (LLIF/XLIF)
  - Anterior lumbar fusion (ALIF)
  - Deformity correction
  - Revision surgery
  - Combined approaches
  - Cervical disc replacement
- [ ] Vary complexity: straightforward vs edge cases
- [ ] Include deliberate documentation gaps to test gap detection
- [ ] Generate with known-correct codes for eval

#### 3.3 Feedback Loop
- [ ] When Nicola edits a code, store the before/after as a training example
- [ ] Use accumulated corrections to improve prompts (few-shot examples from real corrections)
- [ ] Weekly prompt refinement based on most common correction patterns
- [ ] Track: "Nicola corrected X pattern 5 times -> added to prompt -> accuracy improved from 78% to 95% on that pattern"

#### 3.4 Real-World Metrics to Track
- Cases processed per day
- Average review time per case (target: <2 min for straightforward, <5 min for complex)
- Nicola's override rate over time (should decrease)
- Revenue impact: wRVU captured vs what would have been captured without SpineOS
- Denial rate on SpineOS-coded claims vs baseline

**Deliverable:** 3-6 months of daily usage data showing accuracy improvement and real workflow integration.

---

### Phase 4: Physician Platform (Weeks 16-30) - "Expand the Moat"

**Goal:** Add features that make surgeons want SpineOS, not just billers.

#### 4.1 Smart Op Note Assistant
- [ ] Pre-populated op note templates by procedure type
- [ ] Real-time documentation gap detection as surgeon types/dictates
- [ ] "Your note is missing X, which supports code Y and is worth Z wRVU"
- [ ] Suggest medical necessity language for high-denial procedures

#### 4.2 Dictation-to-Code Pipeline
- [ ] Integrate with Whisper API or Deepgram for accurate medical transcription
- [ ] Real-time coding as surgeon dictates
- [ ] Show running wRVU total during dictation
- [ ] Flag when surgeon says something that triggers a coding opportunity

#### 4.3 Surgeon Analytics
- [ ] Personal coding patterns vs peers (anonymized)
- [ ] Identify under-coding habits (e.g., "You consistently miss bone graft codes")
- [ ] Denial rate by procedure type with actionable insights
- [ ] MGMA benchmarking with real data

#### 4.4 Prior Authorization Automation
- [ ] Auto-detect when a case needs prior auth based on payer + procedure
- [ ] Pre-fill authorization forms with clinical data from the op note
- [ ] Track auth status and timelines

**Deliverable:** A platform that surgeons actively want to use because it makes them more money and reduces administrative burden.

---

### Phase 5: Acquisition Readiness (Weeks 30-48) - "Package for Sale"

#### 5.1 Data Room Preparation
- [ ] Accuracy metrics dashboard (exportable)
- [ ] Usage metrics: DAU, cases/day, time savings
- [ ] Financial impact analysis: revenue captured, denials prevented
- [ ] Technical architecture documentation
- [ ] HIPAA compliance documentation
- [ ] Code quality and test coverage report

#### 5.2 Multi-Practice Pilot (if time permits)
- [ ] Onboard 2-3 additional spine practices
- [ ] Show that the model generalizes beyond your practice
- [ ] Different EMR integrations (FHIR API)
- [ ] Multi-tenant architecture proven

#### 5.3 IP Documentation
- [ ] Document the proprietary evaluation dataset
- [ ] Document the prompt engineering methodology
- [ ] Document the training signal feedback loop
- [ ] Patent application for the eval-driven billing optimization method (provisional is fine)

#### 5.4 Acquisition Outreach
- [ ] Warm introductions to corporate development at target acquirers
- [ ] Demo that shows the accuracy curve and real-world validation
- [ ] Show the data flywheel: more cases -> more corrections -> better model -> fewer corrections
- [ ] Position as "the most accurate spine coding engine in the world, validated by a spine surgeon and certified coder over 6 months"

---

## PART 4: EVALUATION ROADMAP (DETAILED)

This is the R&D backbone. Every engineering decision should be justified by its impact on these metrics.

### Week-by-Week Eval Milestones

| Week | Eval Dataset Size | Target CPT Accuracy | Target Recall | Key Focus |
|------|------------------|--------------------:|-------------:|-----------|
| 4 | 20 cases | 60% | 70% | Baseline from current local engine |
| 6 | 40 cases | 70% | 80% | Claude pipeline v1 |
| 8 | 60 cases | 75% | 85% | Prompt refinement from Nicola's first corrections |
| 10 | 80 cases | 80% | 88% | NCCI edit integration, modifier logic |
| 12 | 100 cases | 83% | 90% | Payer-specific rules |
| 16 | 150 cases | 87% | 92% | 2 months of Nicola feedback incorporated |
| 20 | 200 cases | 90% | 94% | Edge case coverage (revision, deformity) |
| 24 | 250 cases | 92% | 95% | Few-shot from accumulated corrections |
| 30 | 300 cases | 94% | 96% | Ready for multi-practice pilot |
| 36 | 400 cases | 95% | 97% | Acquisition-ready accuracy |

### Eval Categories (test separately)

1. **Simple decompressions** (microdiscectomy, laminectomy) - should hit 95%+ early
2. **Single-level fusions** (ACDF, TLIF) - should hit 90%+ by week 12
3. **Multi-level fusions** - harder, target 88%+ by week 20
4. **Combined approaches** (anterior + posterior) - complex, target 85%+ by week 24
5. **Deformity** - most complex, target 80%+ by week 30
6. **Revision surgery** - nuanced, target 82%+ by week 30

### Eval Automation

```
# Run eval suite
npm run eval

# Output:
SpineOS Eval Report - v3.2.1 - 2026-06-15
==========================================
Dataset: 150 cases (42 decomp, 38 single-fusion, 30 multi-fusion,
                     22 combined, 10 deformity, 8 revision)

PRIMARY METRICS:
  CPT Accuracy (exact match):  87.3%  (+2.1% vs last run)
  CPT Recall:                  92.0%  (+1.5% vs last run)
  CPT Precision:               94.2%  (+0.8% vs last run)
  ICD-10 Accuracy:             89.3%  (+3.2% vs last run)
  wRVU MAE:                    2.14   (-0.32 vs last run)
  NCCI Compliance:             98.7%  (+0.0% vs last run)
  Modifier Accuracy:           84.5%  (+4.1% vs last run)

BY CATEGORY:
  Decompressions:    95.2% accuracy
  Single Fusions:    91.8% accuracy
  Multi-Level:       84.3% accuracy
  Combined:          81.2% accuracy
  Deformity:         76.0% accuracy
  Revision:          75.0% accuracy

REGRESSIONS: None detected
NEW FAILURES: 2 cases (CASE-142, CASE-147) - review needed
```

---

## PART 5: TECH STACK RECOMMENDATION

### Immediate (Phase 0-1)

```
Backend:    Node.js + Express (you're already in JS) OR Python + FastAPI (better for AI pipelines)
Database:   Supabase (keep it, but proper schema)
Auth:       Supabase Auth (keep it, add RBAC via custom claims)
AI:         Anthropic Claude API (server-side only)
Storage:    Supabase Storage (for documents, encrypted)
Frontend:   React/Vite (keep it, it's good)
Testing:    Vitest + Playwright (frontend) / Jest or Pytest (backend)
CI/CD:      GitHub Actions (already have workflow, needs real tests)
```

### Phase 2+

```
Document Processing:  pdf.js + Tesseract (OCR) + mammoth (DOCX)
Transcription:        Whisper API or Deepgram
Monitoring:           Sentry (errors) + PostHog (analytics)
Eval:                 Custom eval harness stored in /eval directory
HIPAA:                Supabase (SOC2 compliant) + encryption at rest
```

---

## PART 6: IMMEDIATE NEXT STEPS (This Week)

### Priority Order:

1. **Create the backend server** - Express/FastAPI with Anthropic API proxy. This unblocks everything.

2. **Implement real RBAC** - Surgeon and Biller roles enforced server-side. Invite Nicola.

3. **Wire up the billing workflow** - Make Approve/Edit/Reject actually persist state changes and create audit logs.

4. **Start the eval dataset** - Write 20 synthetic op notes with known-correct codes. Run them through the current engine. Establish baseline accuracy.

5. **Set up the eval pipeline** - Automated script that runs all test cases and produces a scorecard.

---

## PART 7: RISK FACTORS

| Risk | Mitigation |
|------|-----------|
| HIPAA violation (PHI in browser/logs) | Backend-first architecture, no PHI in frontend state |
| Coding accuracy plateau | Expand eval dataset, add few-shot examples from Nicola's corrections |
| Claude API costs at scale | Implement caching, use Haiku for simple cases, Opus for complex |
| Nicola finds it unusable | Weekly feedback sessions, iterate on UX from her workflow |
| Acquirer wants multi-specialty | Position spine as proof-of-concept, show methodology generalizes |
| No revenue = lower valuation | Focus on provable value metrics + small pilot revenue |
| Competitor builds same thing | Speed + surgeon-in-the-loop validation = defensible moat |

---

## APPENDIX: CURRENT FILE STRUCTURE

```
SpineOS/
  src/
    App.jsx              # Main app shell, routing, state management
    main.jsx             # React entry point
    index.css            # Tailwind + custom animations
    lib/
      supabase.js        # Supabase client init
      database.js        # CRUD operations (cases, training signals)
      AuthContext.jsx     # Auth state management
    components/
      AuthScreen.jsx     # Login/signup
      Dashboard.jsx      # Command center with charts
      AICodeEngine.jsx   # Op note -> CPT/ICD-10 (core product)
      DocumentAI.jsx     # Document upload/processing (mocked)
      BillingPortal.jsx  # Biller audit queue (partially functional)
      SurgeonPortal.jsx  # Surgeon dashboard + dictation
      RVUPayerEngine.jsx # CPT lookup + payer comparison
      ComplianceShield.jsx # Audit risk scoring
      LearningEngine.jsx # Training signals + model versioning (mocked)
      ProductivityHub.jsx # wRVU tracking + compensation modeling
    data/
      seedData.js        # 50 CPT codes, payer profiles, benchmarks, denial scenarios
  supabase/
    schema.sql           # DB schema (needs expansion)
  package.json           # React 18, Vite 5, Supabase, Recharts, xlsx, pdfjs
```

---

*This report is the technical foundation for turning SpineOS from a demo into the most accurate spine surgery coding engine in the world. The path to $20M is: build the engine, prove it works, collect the data, show the curve. Everything else is decoration.*
