import React, { useState, useCallback } from 'react'
import { cptCodes, icd10Codes, payerProfiles, modifierRules } from '../data/seedData'

const SYSTEM_PROMPT = `You are SpineOS AI Code Engine, the world's most advanced spine surgery coding assistant. Given an operative note or procedure description, you must:

1. Identify: procedure type, spinal levels, approach (anterior/posterior/lateral/combined), instrumentation, graft type, decompression extent, add-on procedures
2. Output a JSON object with this exact structure:
{
  "procedureSummary": "brief summary",
  "levels": ["C5-C6", "C6-C7"],
  "approach": "anterior|posterior|lateral|combined",
  "primaryCodes": [{"code": "22551", "description": "...", "wRVU": 20.98, "modifier": "", "rationale": "..."}],
  "addOnCodes": [{"code": "22552", "description": "...", "wRVU": 5.54, "modifier": "", "rationale": "..."}],
  "modifierSuggestions": [{"modifier": "62", "reason": "..."}],
  "icd10Codes": [{"code": "M47.12", "description": "...", "appropriatenessScore": 95}],
  "ncciWarnings": ["warning text"],
  "bundlingConflicts": ["conflict text"],
  "underCodingRisks": ["risk text - potential revenue loss"],
  "overCodingRisks": ["risk text - compliance concern"],
  "totalWRVU": 61.31,
  "documentationGaps": ["missing element that could support higher complexity codes"],
  "confidence": 92
}

Use real CPT codes for spine surgery. Be precise about wRVU values. Flag any NCCI edit pairs. Identify under-coding (missed legitimate codes) and over-coding risks separately.`

export default function AICodeEngine({ apiKey, addTrainingSignal, addCase, cases }) {
  const [inputType, setInputType] = useState('text')
  const [inputText, setInputText] = useState('')
  const [selectedPayer, setSelectedPayer] = useState('medicare')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [editingCodes, setEditingCodes] = useState(null)
  const [challengeMode, setChallengeMode] = useState(null)
  const [challengeInput, setChallengeInput] = useState('')
  const [appealLetter, setAppealLetter] = useState(null)
  const [appealLoading, setAppealLoading] = useState(false)

  const sampleNotes = [
    {
      title: 'ACDF C5-C7',
      text: `OPERATIVE REPORT
Procedure: Anterior cervical discectomy and fusion C5-C6 and C6-C7 with structural allograft and anterior cervical plate fixation.

Diagnosis: Cervical spondylotic myelopathy C5-C6, C6-C7 with progressive gait difficulty and bilateral hand numbness.

The patient was positioned supine with the neck in neutral position. A standard Smith-Robinson approach was performed from the left side. The C5-C6 disc space was identified with fluoroscopy. A complete discectomy was performed at C5-C6 with removal of the posterior longitudinal ligament and decompression of the spinal cord. The endplates were prepared with curettes and high-speed burr. An appropriately sized structural allograft was impacted into the disc space.

The procedure was then repeated at C6-C7 with complete discectomy, decompression of the cord and bilateral C7 nerve roots, endplate preparation, and placement of structural allograft.

An anterior cervical plate was measured, contoured, and applied spanning C5 to C7 with bicortical screw fixation at C5 and C7 and unicortical fixation at C6. Final fluoroscopy confirmed excellent position of the plate and grafts with restoration of lordosis.

Estimated blood loss: 75cc. No complications.`
    },
    {
      title: 'L4-L5 TLIF',
      text: `OPERATIVE REPORT
Procedure: Transforaminal lumbar interbody fusion L4-L5 with posterolateral fusion, pedicle screw fixation L4-L5, and decompression.

Diagnosis: Degenerative spondylolisthesis L4-L5 Grade I with lumbar spinal stenosis and bilateral lower extremity radiculopathy.

After induction of general anesthesia, the patient was positioned prone on the Jackson table. Midline incision was made centered over L4-L5. Subperiosteal dissection was performed exposing the posterior elements from L4 to L5. Pedicle screws were placed bilaterally at L4 and L5 under fluoroscopic guidance (4 screws total, 6.5mm x 50mm at L4, 7.0mm x 55mm at L5).

A laminectomy was performed at L4-L5 with bilateral medial facetectomies and foraminotomies for neural decompression. The L5 nerve roots were well visualized bilaterally and confirmed decompressed.

A left-sided TLIF approach was performed with complete L4-L5 discectomy through the left foramen. The disc space was prepared with sequential shavers and rasps. An appropriately sized interbody cage (12mm x 26mm PEEK) was packed with local autograft and demineralized bone matrix and impacted into the disc space. Position confirmed with fluoroscopy.

Morselized local autograft was placed over the decorticated transverse processes bilaterally for posterolateral fusion. Rods were placed, compressed, and final tightened. Final imaging confirmed excellent hardware position and alignment.

EBL: 250cc. No complications.`
    },
    {
      title: 'Lumbar Microdiscectomy',
      text: `OPERATIVE REPORT
Procedure: Microdiscectomy L4-L5 left side.

Diagnosis: Left L4-L5 disc herniation with L5 radiculopathy, failed 3 months conservative treatment.

The patient was positioned prone. A small midline incision was made centered over the L4-L5 interspace. Using the operating microscope, a left L4-L5 hemilaminotomy was performed. The ligamentum flavum was removed exposing the dural sac and left L5 nerve root. The nerve root was retracted medially revealing a large extruded disc fragment which was removed. The disc space was entered and loose fragments were removed. The L5 nerve root was confirmed free of compression. Hemostasis was obtained and the wound was closed in layers.

EBL: 25cc. No complications.`
    }
  ]

  const analyzeWithAI = useCallback(async () => {
    if (!inputText.trim()) return

    if (!apiKey) {
      // Use local analysis
      setLoading(true)
      setError(null)
      try {
        await new Promise(r => setTimeout(r, 1500))
        const result = localAnalysis(inputText, selectedPayer)
        setResult(result)
      } catch (e) {
        setError('Analysis failed. Please try again.')
      }
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [{
            role: 'user',
            content: `Analyze this operative note and provide CPT/ICD-10 coding recommendations. The patient's payer is ${payerProfiles.find(p => p.id === selectedPayer)?.name || 'Medicare'}.\n\nOperative Note:\n${inputText}`
          }]
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const text = data.content[0].text
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        setResult(parsed)
      } else {
        throw new Error('Could not parse AI response')
      }
    } catch (e) {
      console.error(e)
      // Fallback to local analysis
      const result = localAnalysis(inputText, selectedPayer)
      setResult(result)
      setError('Using local analysis engine (AI API unavailable)')
    }
    setLoading(false)
  }, [inputText, apiKey, selectedPayer])

  const generateAppeal = useCallback(async (code, denialReason) => {
    setAppealLoading(true)
    if (apiKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            messages: [{
              role: 'user',
              content: `You are a spine surgery medical billing expert. Draft a medical necessity appeal letter for the following denial:

CPT Code: ${code.code} - ${code.description || cptCodes.find(c => c.code === code.code)?.description}
Denial Reason: ${denialReason}
Payer: ${payerProfiles.find(p => p.id === selectedPayer)?.name}

Operative Note Context:
${inputText.substring(0, 1500)}

Write a persuasive, clinically detailed appeal letter that addresses the specific denial reason with medical evidence and coding guidelines. Include relevant LCD/NCD references if applicable.`
            }]
          })
        })
        const data = await response.json()
        setAppealLetter(data.content[0].text)
      } catch {
        setAppealLetter(generateLocalAppeal(code, denialReason))
      }
    } else {
      await new Promise(r => setTimeout(r, 1000))
      setAppealLetter(generateLocalAppeal(code, denialReason))
    }
    setAppealLoading(false)
  }, [apiKey, selectedPayer, inputText])

  const handleAcceptResult = useCallback(() => {
    if (!result) return
    const newCase = {
      id: `CASE-${String(cases.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      surgeon: 'Dr. Sarah Chen',
      patient: { age: 0, sex: 'U', bmi: 0 },
      diagnosis: result.procedureSummary,
      icd10: result.icd10Codes?.map(c => c.code) || [],
      procedure: result.procedureSummary,
      levels: result.levels || [],
      approach: result.approach || 'posterior',
      cptCodes: [
        ...(result.primaryCodes || []).map(c => ({ code: c.code, modifier: c.modifier || '', primary: true })),
        ...(result.addOnCodes || []).map(c => ({ code: c.code, modifier: c.modifier || '', primary: false })),
      ],
      totalWRVU: result.totalWRVU || 0,
      payer: payerProfiles.find(p => p.id === selectedPayer)?.name || 'Medicare',
      orTime: 0,
      status: 'pending_review',
      facility: 'hospital',
    }
    addCase(newCase)
    addTrainingSignal({ type: 'accept', codes: newCase.cptCodes, source: 'ai-code-engine' })
    setResult(prev => ({ ...prev, _accepted: true }))
  }, [result, cases, selectedPayer, addCase, addTrainingSignal])

  const payer = payerProfiles.find(p => p.id === selectedPayer)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">AI Code Engine</h1>
          <p className="text-sm text-spine-muted mt-1">LLM-powered CPT/ICD-10 coding from operative notes</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Input Type Selector */}
          <div className="flex gap-2">
            {['text', 'sample'].map(t => (
              <button
                key={t}
                onClick={() => setInputType(t)}
                className={`px-4 py-2 text-xs rounded-lg transition-all ${inputType === t ? 'accent-gradient text-white' : 'glass-card text-spine-muted hover:text-spine-text'}`}
              >
                {t === 'text' ? 'Free Text / Paste Op Note' : 'Sample Notes'}
              </button>
            ))}
          </div>

          {inputType === 'sample' && (
            <div className="flex gap-2 flex-wrap">
              {sampleNotes.map(note => (
                <button
                  key={note.title}
                  onClick={() => { setInputText(note.text); setInputType('text') }}
                  className="px-3 py-2 text-xs glass-card rounded-lg text-spine-accent hover:bg-spine-accent/10 transition-all"
                >
                  {note.title}
                </button>
              ))}
            </div>
          )}

          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Paste your operative note here, or select a sample note above..."
            className="w-full h-64 bg-spine-bg border border-spine-border rounded-xl p-4 text-sm text-spine-text placeholder-spine-muted/40 focus:outline-none focus:border-spine-accent resize-none font-mono"
          />

          {/* Payer & Analyze */}
          <div className="flex items-center gap-4">
            <select
              value={selectedPayer}
              onChange={e => setSelectedPayer(e.target.value)}
              className="bg-spine-bg border border-spine-border rounded-lg px-4 py-2.5 text-sm text-spine-text focus:outline-none focus:border-spine-accent"
            >
              {payerProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              onClick={analyzeWithAI}
              disabled={loading || !inputText.trim()}
              className="px-6 py-2.5 accent-gradient text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="30 70"/></svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/></svg>
                  Analyze & Code
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-spine-gold/10 border border-spine-gold/30 text-xs text-spine-gold">
              {error}
            </div>
          )}
        </div>

        {/* Payer Info Panel */}
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Payer Intelligence: {payer?.name}</h3>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-spine-muted uppercase tracking-wider">Fee Schedule</p>
              <p className="text-sm text-white font-mono">{payer?.feeSchedulePctOfMedicare}% of Medicare</p>
            </div>
            <div>
              <p className="text-[10px] text-spine-muted uppercase tracking-wider">Avg Days to Payment</p>
              <p className="text-sm text-white font-mono">{payer?.avgDaysToPayment} days</p>
            </div>
            <div>
              <p className="text-[10px] text-spine-muted uppercase tracking-wider">Denial Rate</p>
              <p className="text-sm text-spine-red font-mono">{payer?.denialRate}%</p>
            </div>
            <div>
              <p className="text-[10px] text-spine-muted uppercase tracking-wider">Prior Auth Required</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {payer?.priorAuthRequired.slice(0, 6).map(code => (
                  <span key={code} className="text-[10px] px-1.5 py-0.5 rounded bg-spine-red/10 text-spine-red border border-spine-red/20">{code}</span>
                ))}
                {(payer?.priorAuthRequired.length || 0) > 6 && (
                  <span className="text-[10px] px-1.5 py-0.5 text-spine-muted">+{payer.priorAuthRequired.length - 6} more</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-spine-muted uppercase tracking-wider">Spine-Specific Policies</p>
              <div className="space-y-1 mt-1">
                {payer?.spineSpecificPolicies.map((p, i) => (
                  <p key={i} className="text-[10px] text-spine-text leading-relaxed">{p}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary Bar */}
          <div className="glass-card rounded-xl p-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">{result.procedureSummary}</h3>
              <p className="text-xs text-spine-muted mt-1">Levels: {result.levels?.join(', ')} | Approach: {result.approach}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-spine-muted">Total wRVU</p>
                <p className="text-xl font-bold text-spine-gold font-mono">{result.totalWRVU?.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-spine-muted">Confidence</p>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-spine-bg rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${(result.confidence || 0) > 80 ? 'bg-spine-green' : (result.confidence || 0) > 60 ? 'bg-spine-gold' : 'bg-spine-red'}`} style={{ width: `${result.confidence || 0}%` }} />
                  </div>
                  <span className="text-sm font-mono text-white">{result.confidence || 0}%</span>
                </div>
              </div>
              {!result._accepted && (
                <button onClick={handleAcceptResult} className="px-4 py-2 accent-gradient text-white text-xs rounded-lg hover:opacity-90">
                  Accept & Save Case
                </button>
              )}
              {result._accepted && (
                <span className="px-4 py-2 bg-spine-green/20 text-spine-green text-xs rounded-lg border border-spine-green/30">
                  Case Saved
                </span>
              )}
            </div>
          </div>

          {/* Code Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Primary Codes */}
            <div className="glass-card rounded-xl p-5">
              <h4 className="text-xs font-semibold text-spine-accent uppercase tracking-wider mb-3">Primary CPT Codes</h4>
              <div className="space-y-2">
                {result.primaryCodes?.map((code, i) => (
                  <div key={i} className="p-3 rounded-lg bg-spine-bg/50 border border-spine-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono font-bold text-spine-accent">{code.code}</span>
                      <span className="text-sm font-mono text-spine-gold">{code.wRVU} wRVU</span>
                    </div>
                    <p className="text-xs text-spine-text mt-1">{code.description}</p>
                    {code.modifier && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 mt-1 inline-block">Mod {code.modifier}</span>}
                    {code.rationale && <p className="text-[10px] text-spine-muted mt-1">{code.rationale}</p>}
                    <button
                      onClick={() => { setChallengeMode(code); setChallengeInput(''); setAppealLetter(null) }}
                      className="mt-2 text-[10px] text-spine-red hover:text-spine-red/80 underline"
                    >
                      Challenge This Code
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add-On Codes */}
            <div className="glass-card rounded-xl p-5">
              <h4 className="text-xs font-semibold text-spine-gold uppercase tracking-wider mb-3">Add-On Codes</h4>
              <div className="space-y-2">
                {result.addOnCodes?.map((code, i) => (
                  <div key={i} className="p-3 rounded-lg bg-spine-bg/50 border border-spine-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono font-bold text-spine-gold">{code.code}</span>
                      <span className="text-sm font-mono text-spine-gold">{code.wRVU} wRVU</span>
                    </div>
                    <p className="text-xs text-spine-text mt-1">{code.description}</p>
                    {code.rationale && <p className="text-[10px] text-spine-muted mt-1">{code.rationale}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ICD-10 Codes */}
          <div className="glass-card rounded-xl p-5">
            <h4 className="text-xs font-semibold text-spine-green uppercase tracking-wider mb-3">ICD-10 Diagnosis Codes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {result.icd10Codes?.map((code, i) => (
                <div key={i} className="p-3 rounded-lg bg-spine-bg/50 border border-spine-border/50 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-mono text-spine-green">{code.code}</span>
                    <p className="text-xs text-spine-text mt-0.5">{code.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <div className="w-8 h-1.5 bg-spine-bg rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-spine-green" style={{ width: `${code.appropriatenessScore || 0}%` }} />
                      </div>
                      <span className="text-[10px] text-spine-muted">{code.appropriatenessScore}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {result.ncciWarnings?.length > 0 && (
              <div className="glass-card rounded-xl p-4">
                <h4 className="text-xs font-semibold text-spine-red uppercase tracking-wider mb-2">NCCI Edit Warnings</h4>
                {result.ncciWarnings.map((w, i) => (
                  <p key={i} className="text-[10px] text-spine-red/80 mb-1">{w}</p>
                ))}
              </div>
            )}
            {result.bundlingConflicts?.length > 0 && (
              <div className="glass-card rounded-xl p-4">
                <h4 className="text-xs font-semibold text-spine-gold uppercase tracking-wider mb-2">Bundling Conflicts</h4>
                {result.bundlingConflicts.map((w, i) => (
                  <p key={i} className="text-[10px] text-spine-gold/80 mb-1">{w}</p>
                ))}
              </div>
            )}
            {result.underCodingRisks?.length > 0 && (
              <div className="glass-card rounded-xl p-4">
                <h4 className="text-xs font-semibold text-spine-accent uppercase tracking-wider mb-2">Under-Coding Risks</h4>
                {result.underCodingRisks.map((w, i) => (
                  <p key={i} className="text-[10px] text-spine-accent/80 mb-1">{w}</p>
                ))}
              </div>
            )}
            {result.overCodingRisks?.length > 0 && (
              <div className="glass-card rounded-xl p-4">
                <h4 className="text-xs font-semibold text-spine-red uppercase tracking-wider mb-2">Over-Coding Risks</h4>
                {result.overCodingRisks.map((w, i) => (
                  <p key={i} className="text-[10px] text-spine-red/80 mb-1">{w}</p>
                ))}
              </div>
            )}
          </div>

          {/* Documentation Gaps */}
          {result.documentationGaps?.length > 0 && (
            <div className="glass-card rounded-xl p-4 border-l-4 border-spine-gold">
              <h4 className="text-xs font-semibold text-spine-gold uppercase tracking-wider mb-2">Documentation Improvement Opportunities</h4>
              <ul className="space-y-1">
                {result.documentationGaps.map((gap, i) => (
                  <li key={i} className="text-xs text-spine-text flex items-start gap-2">
                    <span className="text-spine-gold mt-0.5">&#9679;</span>
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Modifier Suggestions */}
          {result.modifierSuggestions?.length > 0 && (
            <div className="glass-card rounded-xl p-5">
              <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">Modifier Suggestions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {result.modifierSuggestions.map((mod, i) => (
                  <div key={i} className="p-3 rounded-lg bg-spine-bg/50 border border-purple-500/20">
                    <span className="text-sm font-mono font-bold text-purple-400">Modifier {mod.modifier}</span>
                    <span className="text-xs text-spine-muted ml-2">({modifierRules[mod.modifier]?.description || ''})</span>
                    <p className="text-[10px] text-spine-text mt-1">{mod.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Challenge Modal */}
      {challengeMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setChallengeMode(null)}>
          <div className="glass-card rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold text-white mb-2">Challenge Code: {challengeMode.code}</h3>
            <p className="text-xs text-spine-muted mb-4">{challengeMode.description}</p>

            <textarea
              value={challengeInput}
              onChange={e => setChallengeInput(e.target.value)}
              placeholder="Enter the denial reason or challenge basis..."
              className="w-full h-24 bg-spine-bg border border-spine-border rounded-lg p-3 text-sm text-spine-text placeholder-spine-muted/40 focus:outline-none focus:border-spine-accent resize-none"
            />

            <button
              onClick={() => generateAppeal(challengeMode, challengeInput)}
              disabled={!challengeInput.trim() || appealLoading}
              className="mt-3 px-4 py-2 accent-gradient text-white text-xs rounded-lg hover:opacity-90 disabled:opacity-40 flex items-center gap-2"
            >
              {appealLoading ? 'Generating Appeal...' : 'Generate Appeal Letter'}
            </button>

            {appealLetter && (
              <div className="mt-4 p-4 rounded-lg bg-spine-bg border border-spine-border">
                <h4 className="text-xs font-semibold text-spine-green mb-2">Generated Appeal Letter</h4>
                <div className="text-xs text-spine-text whitespace-pre-wrap leading-relaxed">{appealLetter}</div>
                <button
                  onClick={() => navigator.clipboard?.writeText(appealLetter)}
                  className="mt-3 px-3 py-1.5 text-[10px] glass-card rounded-lg text-spine-accent hover:bg-spine-accent/10"
                >
                  Copy to Clipboard
                </button>
              </div>
            )}

            <button onClick={() => setChallengeMode(null)} className="mt-4 px-4 py-2 text-xs text-spine-muted border border-spine-border rounded-lg hover:bg-spine-card">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Local analysis fallback when API key not available
function localAnalysis(text, payerId) {
  const lower = text.toLowerCase()
  const levels = []
  const levelPattern = /([CTLS]\d+[-–][CTLS]?\d+)/gi
  let match
  while ((match = levelPattern.exec(text)) !== null) {
    levels.push(match[1].replace('–', '-'))
  }

  const isAnterior = lower.includes('anterior') || lower.includes('acdf') || lower.includes('alif') || lower.includes('smith-robinson')
  const isPosterior = lower.includes('posterior') || lower.includes('plif') || lower.includes('tlif') || lower.includes('laminectomy') || lower.includes('laminotomy')
  const approach = isAnterior && isPosterior ? 'combined' : isAnterior ? 'anterior' : 'posterior'

  const isCervical = lower.includes('cervical') || /c[3-7]/i.test(text)
  const isLumbar = lower.includes('lumbar') || /l[1-5]/i.test(text)
  const isThoracic = lower.includes('thoracic') || /t\d/i.test(text)

  const hasFusion = lower.includes('fusion') || lower.includes('arthrodesis') || lower.includes('acdf') || lower.includes('alif') || lower.includes('tlif') || lower.includes('plif')
  const hasDecompression = lower.includes('laminectomy') || lower.includes('decompression') || lower.includes('laminotomy') || lower.includes('foraminotomy') || lower.includes('discectomy')
  const hasInstrumentation = lower.includes('screw') || lower.includes('plate') || lower.includes('rod') || lower.includes('instrumentation')
  const hasGraft = lower.includes('graft') || lower.includes('allograft') || lower.includes('autograft') || lower.includes('cage')
  const hasDisc = lower.includes('discectomy') || lower.includes('disc removal')
  const isRevision = lower.includes('revision') || lower.includes('re-exploration')
  const isDeformity = lower.includes('scoliosis') || lower.includes('deformity') || lower.includes('kyphosis')
  const isMicro = lower.includes('microdiscectomy') || lower.includes('micro')

  const primaryCodes = []
  const addOnCodes = []
  const icd10Results = []
  const ncciWarnings = []
  const underCodingRisks = []
  const overCodingRisks = []
  const documentationGaps = []
  const modifierSuggestions = []

  // Determine primary codes
  if (isMicro && isLumbar && !hasFusion) {
    // Simple microdiscectomy
    const cpt = cptCodes.find(c => c.code === (isRevision ? '63042' : '63030'))
    primaryCodes.push({ code: cpt.code, description: cpt.description, wRVU: cpt.wRVU, modifier: '', rationale: 'Primary lumbar microdiscectomy procedure' })
  } else if (hasFusion && isCervical && isAnterior) {
    // ACDF
    const cpt = cptCodes.find(c => c.code === '22551')
    primaryCodes.push({ code: cpt.code, description: cpt.description, wRVU: cpt.wRVU, modifier: '', rationale: 'Primary anterior cervical fusion' })

    if (levels.length > 1) {
      const addon = cptCodes.find(c => c.code === '22552')
      for (let i = 1; i < Math.min(levels.length, 4); i++) {
        addOnCodes.push({ code: addon.code, description: addon.description, wRVU: addon.wRVU, modifier: '', rationale: `Additional interspace #${i + 1}` })
      }
    }
    if (hasDisc || lower.includes('discectomy')) {
      const disc = cptCodes.find(c => c.code === '63075')
      primaryCodes.push({ code: disc.code, description: disc.description, wRVU: disc.wRVU, modifier: '', rationale: 'Anterior cervical discectomy at primary level' })
      if (levels.length > 1) {
        const discAddon = cptCodes.find(c => c.code === '63076')
        for (let i = 1; i < Math.min(levels.length, 4); i++) {
          addOnCodes.push({ code: discAddon.code, description: discAddon.description, wRVU: discAddon.wRVU, modifier: '', rationale: `Discectomy additional interspace #${i + 1}` })
        }
      }
    }
    if (hasInstrumentation && lower.includes('plate')) {
      const inst = cptCodes.find(c => c.code === '22845')
      addOnCodes.push({ code: inst.code, description: inst.description, wRVU: inst.wRVU, modifier: '', rationale: 'Anterior plate instrumentation' })
    }
    if (hasGraft) {
      const graft = cptCodes.find(c => c.code === (lower.includes('structural') ? '20931' : '20930'))
      addOnCodes.push({ code: graft.code, description: graft.description, wRVU: graft.wRVU, modifier: '', rationale: 'Allograft for fusion' })
    }
  } else if (hasFusion && isLumbar && isPosterior) {
    // Posterior lumbar fusion
    if (lower.includes('tlif') || lower.includes('plif') || lower.includes('interbody')) {
      if (lower.includes('posterolateral') || lower.includes('combined')) {
        const cpt = cptCodes.find(c => c.code === '22633')
        primaryCodes.push({ code: cpt.code, description: cpt.description, wRVU: cpt.wRVU, modifier: '', rationale: 'Combined posterior interbody + posterolateral fusion' })
        if (levels.length > 1) {
          const addon = cptCodes.find(c => c.code === '22634')
          for (let i = 1; i < levels.length; i++) {
            addOnCodes.push({ code: addon.code, description: addon.description, wRVU: addon.wRVU, modifier: i > 1 ? '59' : '', rationale: `Additional segment #${i + 1}` })
          }
        }
      } else {
        const cpt = cptCodes.find(c => c.code === '22630')
        primaryCodes.push({ code: cpt.code, description: cpt.description, wRVU: cpt.wRVU, modifier: '', rationale: 'Posterior interbody fusion (PLIF/TLIF)' })
      }
    } else {
      const cpt = cptCodes.find(c => c.code === '22612')
      primaryCodes.push({ code: cpt.code, description: cpt.description, wRVU: cpt.wRVU, modifier: '', rationale: 'Posterior/posterolateral lumbar fusion' })
      if (levels.length > 1) {
        const addon = cptCodes.find(c => c.code === '22614')
        for (let i = 1; i < levels.length; i++) {
          addOnCodes.push({ code: addon.code, description: addon.description, wRVU: addon.wRVU, modifier: i > 1 ? '59' : '', rationale: `Additional fusion segment` })
        }
      }
    }

    if (hasInstrumentation) {
      const segCount = levels.length
      let instCode = '22842'
      if (segCount > 12) instCode = '22844'
      else if (segCount > 6) instCode = '22843'
      const inst = cptCodes.find(c => c.code === instCode)
      addOnCodes.push({ code: inst.code, description: inst.description, wRVU: inst.wRVU, modifier: '', rationale: `Pedicle screw instrumentation (${segCount} segments)` })
    }
    if (hasDecompression) {
      const decomp = cptCodes.find(c => c.code === '63047')
      addOnCodes.push({ code: decomp.code, description: decomp.description, wRVU: decomp.wRVU, modifier: '', rationale: 'Decompression at primary level' })
      if (levels.length > 1) {
        const decompAddon = cptCodes.find(c => c.code === '63048')
        for (let i = 1; i < levels.length; i++) {
          addOnCodes.push({ code: decompAddon.code, description: decompAddon.description, wRVU: decompAddon.wRVU, modifier: i > 1 ? '59' : '', rationale: `Decompression additional segment` })
        }
      }
    }
    if (hasGraft) {
      addOnCodes.push({ code: '20930', description: 'Allograft, morselized', wRVU: 0, modifier: '', rationale: 'Morselized bone graft' })
    }
  } else if (hasDecompression && isLumbar && !hasFusion) {
    // Standalone decompression
    if (lower.includes('laminectomy') || lower.includes('foraminotomy')) {
      const cpt = cptCodes.find(c => c.code === '63047')
      primaryCodes.push({ code: cpt.code, description: cpt.description, wRVU: cpt.wRVU, modifier: '', rationale: 'Lumbar laminectomy/foraminotomy' })
      if (levels.length > 1) {
        const addon = cptCodes.find(c => c.code === '63048')
        for (let i = 1; i < levels.length; i++) {
          addOnCodes.push({ code: addon.code, description: addon.description, wRVU: addon.wRVU, modifier: i > 1 ? '59' : '', rationale: `Additional decompression segment` })
        }
      }
    }
  } else if (isDeformity) {
    const segCount = levels.length
    let code = '22800'
    if (segCount > 12) code = '22804'
    else if (segCount > 6) code = '22802'
    const cpt = cptCodes.find(c => c.code === code)
    primaryCodes.push({ code: cpt.code, description: cpt.description, wRVU: cpt.wRVU, modifier: '', rationale: 'Posterior spinal deformity correction' })
    if (hasInstrumentation) {
      let instCode = '22842'
      if (segCount > 12) instCode = '22844'
      else if (segCount > 6) instCode = '22843'
      const inst = cptCodes.find(c => c.code === instCode)
      addOnCodes.push({ code: inst.code, description: inst.description, wRVU: inst.wRVU, modifier: '', rationale: 'Segmental instrumentation' })
    }
  } else {
    // Generic fallback
    primaryCodes.push({ code: '99999', description: 'Unable to determine primary procedure code from note', wRVU: 0, modifier: '', rationale: 'Please provide more details' })
  }

  // ICD-10
  if (isCervical) {
    if (lower.includes('myelopathy')) {
      icd10Results.push({ code: 'M47.12', description: 'Spondylosis with myelopathy, cervical', appropriatenessScore: 95 })
    }
    if (lower.includes('radiculopathy') || lower.includes('herniation')) {
      icd10Results.push({ code: 'M50.120', description: 'Cervical disc degeneration with radiculopathy', appropriatenessScore: 90 })
    }
    if (lower.includes('stenosis')) {
      icd10Results.push({ code: 'M48.02', description: 'Spinal stenosis, cervical', appropriatenessScore: 85 })
    }
    if (icd10Results.length === 0) {
      icd10Results.push({ code: 'M47.812', description: 'Spondylosis without myelopathy, cervical', appropriatenessScore: 75 })
    }
  }
  if (isLumbar) {
    if (lower.includes('stenosis')) {
      icd10Results.push({ code: 'M48.06', description: 'Spinal stenosis, lumbar', appropriatenessScore: 90 })
    }
    if (lower.includes('spondylolisthesis')) {
      icd10Results.push({ code: 'M43.16', description: 'Spondylolisthesis, lumbar', appropriatenessScore: 92 })
    }
    if (lower.includes('herniation') || lower.includes('disc')) {
      icd10Results.push({ code: 'M51.16', description: 'Intervertebral disc degeneration, lumbar', appropriatenessScore: 85 })
    }
    if (icd10Results.length === 0) {
      icd10Results.push({ code: 'M47.816', description: 'Spondylosis without myelopathy, lumbar', appropriatenessScore: 75 })
    }
  }
  if (lower.includes('cord compression')) {
    icd10Results.push({ code: 'G95.20', description: 'Cord compression', appropriatenessScore: 95 })
  }

  // Warnings
  if (hasFusion && hasDecompression) {
    ncciWarnings.push('Verify decompression codes are not bundled with fusion at same level — use modifier 59 if distinct')
  }

  // Under-coding risks
  if (hasGraft && !addOnCodes.find(c => c.code === '20930' || c.code === '20931')) {
    underCodingRisks.push('Graft material mentioned but graft code not captured — potential under-coding')
  }
  if (hasInstrumentation && !addOnCodes.find(c => ['22840', '22842', '22843', '22844', '22845'].includes(c.code))) {
    underCodingRisks.push('Instrumentation described but not coded — significant revenue loss')
  }

  // Documentation gaps
  if (hasFusion && !lower.includes('conservative')) {
    documentationGaps.push('No mention of failed conservative care — required for medical necessity by most payers')
  }
  if (hasDecompression && !lower.includes('mm') && !lower.includes('millimeter')) {
    documentationGaps.push('No measurement of decompression extent in mm — strengthens medical necessity')
  }
  if (!lower.includes('fluoroscopy') && !lower.includes('imaging') && !lower.includes('x-ray')) {
    documentationGaps.push('No intraoperative imaging documentation — consider adding for completeness')
  }

  // Modifier suggestions
  if (lower.includes('two surgeon') || lower.includes('co-surgeon')) {
    modifierSuggestions.push({ modifier: '62', reason: 'Two-surgeon approach described' })
  }
  if (lower.includes('assistant')) {
    modifierSuggestions.push({ modifier: '80', reason: 'Assistant surgeon utilized' })
  }

  const totalWRVU = [...primaryCodes, ...addOnCodes].reduce((sum, c) => sum + (c.wRVU || 0), 0)

  return {
    procedureSummary: `${approach.charAt(0).toUpperCase() + approach.slice(1)} ${isCervical ? 'cervical' : isLumbar ? 'lumbar' : 'thoracic'} ${hasFusion ? 'fusion' : 'decompression'} ${levels.length > 0 ? levels.join(', ') : ''}`.trim(),
    levels,
    approach,
    primaryCodes,
    addOnCodes,
    modifierSuggestions,
    icd10Codes: icd10Results,
    ncciWarnings,
    bundlingConflicts: [],
    underCodingRisks,
    overCodingRisks,
    totalWRVU: Math.round(totalWRVU * 100) / 100,
    documentationGaps,
    confidence: apiKey ? 0 : 78,
  }
}

function generateLocalAppeal(code, denialReason) {
  return `RE: Appeal for Denied Claim — CPT ${code.code}

Dear Medical Director,

I am writing to formally appeal the denial of CPT ${code.code} (${code.description || 'spine procedure'}) for the above-referenced patient.

DENIAL REASON: ${denialReason}

CLINICAL JUSTIFICATION:

The procedure coded as CPT ${code.code} was medically necessary and appropriately documented. The operative report clearly describes the surgical work performed, which meets the definition and requirements for this code as outlined in the AMA CPT Professional Edition.

The patient presented with progressive symptoms that had failed to respond to comprehensive conservative management. The surgical intervention was performed based on clear clinical and radiographic indications, and the operative note documents all required elements to support this code.

Specifically, we would highlight:
1. The medical necessity for this procedure is well-established based on the patient's clinical presentation and imaging findings
2. The operative note documents the specific surgical work that corresponds to CPT ${code.code}
3. The coding is consistent with AMA CPT guidelines and NCCI edits
4. The documentation supports the level of complexity reflected in this code

We respectfully request that you reverse this denial upon review of the enclosed clinical documentation. Should you require any additional information or wish to discuss this case, please do not hesitate to contact our office.

Sincerely,
[Surgeon Name, MD]
[Practice Name]`
}
