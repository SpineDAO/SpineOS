import Anthropic from '@anthropic-ai/sdk'

let client = null

function getClient() {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')
    client = new Anthropic({ apiKey })
  }
  return client
}

const CODING_SYSTEM_PROMPT = `You are SpineOS AI Code Engine, the world's most advanced spine surgery coding assistant. Given an operative note or procedure description, you must:

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

Use real CPT codes for spine surgery. Be precise about wRVU values. Flag any NCCI edit pairs. Identify under-coding (missed legitimate codes) and over-coding risks separately.

IMPORTANT: Output ONLY the JSON object. No surrounding text.`

export async function analyzeOpNote(opNoteText, payerName) {
  const anthropic = getClient()

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: CODING_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Analyze this operative note and provide CPT/ICD-10 coding recommendations. The patient's payer is ${payerName || 'Medicare'}.\n\nOperative Note:\n${opNoteText}`
    }]
  })

  const text = message.content[0].text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response as JSON')
  }
  return JSON.parse(jsonMatch[0])
}

export async function generateAppealLetter(code, codeDescription, denialReason, payerName, opNoteExcerpt) {
  const anthropic = getClient()

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are a spine surgery medical billing expert. Draft a medical necessity appeal letter for the following denial:

CPT Code: ${code} - ${codeDescription}
Denial Reason: ${denialReason}
Payer: ${payerName}

Operative Note Context:
${opNoteExcerpt}

Write a persuasive, clinically detailed appeal letter that addresses the specific denial reason with medical evidence and coding guidelines. Include relevant LCD/NCD references if applicable.`
    }]
  })

  return message.content[0].text
}
