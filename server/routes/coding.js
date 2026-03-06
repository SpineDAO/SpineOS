import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { analyzeOpNote, generateAppealLetter } from '../lib/claude.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { scrubPHI, sanitizeInput } from '../lib/phi-scrubber.js'

export const codingRouter = Router()

// Analyze an operative note with AI
codingRouter.post('/analyze', requireAuth, async (req, res) => {
  const { opNoteText, payerName, caseId } = req.body

  if (!opNoteText?.trim()) {
    return res.status(400).json({ error: 'opNoteText is required' })
  }

  // Sanitize and scrub PHI before sending to external AI
  const cleanNote = scrubPHI(sanitizeInput(opNoteText, 50000))
  const cleanPayer = sanitizeInput(payerName || 'Medicare', 100)

  try {
    const result = await analyzeOpNote(cleanNote, cleanPayer)

    // Store the coding result if we have a case ID and database
    if (caseId && supabaseAdmin) {
      await supabaseAdmin.from('coding_results').insert({
        case_id: caseId,
        engine_version: '2.0.0',
        cpt_codes: [...(result.primaryCodes || []), ...(result.addOnCodes || [])],
        icd10_codes: result.icd10Codes || [],
        confidence: result.confidence || 0,
        raw_response: result,
        created_by: req.user.id,
      })
    }

    // Log training signal
    if (supabaseAdmin) {
      await supabaseAdmin.from('training_signals').insert({
        user_id: req.user.id,
        payload: {
          type: 'analysis',
          source: 'ai-code-engine',
          payer: payerName,
          confidence: result.confidence,
          codeCount: (result.primaryCodes?.length || 0) + (result.addOnCodes?.length || 0),
          timestamp: new Date().toISOString(),
        }
      })
    }

    res.json({ result })
  } catch (err) {
    console.error('Coding analysis error:', err.message)
    if (err.message === 'ANTHROPIC_API_KEY not set') {
      return res.status(503).json({ error: 'AI engine not configured. Set ANTHROPIC_API_KEY.' })
    }
    res.status(500).json({ error: 'Analysis failed. Please try again.' })
  }
})

// Generate an appeal letter
codingRouter.post('/appeal', requireAuth, async (req, res) => {
  const { code, codeDescription, denialReason, payerName, opNoteExcerpt } = req.body

  if (!code || !denialReason) {
    return res.status(400).json({ error: 'code and denialReason are required' })
  }

  try {
    const letter = await generateAppealLetter(
      sanitizeInput(code, 10),
      sanitizeInput(codeDescription, 200),
      sanitizeInput(denialReason, 500),
      sanitizeInput(payerName, 100),
      scrubPHI(sanitizeInput(opNoteExcerpt || '', 5000))
    )
    res.json({ letter })
  } catch (err) {
    console.error('Appeal generation error:', err.message)
    res.status(500).json({ error: 'Appeal generation failed. Please try again.' })
  }
})

// Get coding history for a case
codingRouter.get('/history/:caseId', requireAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' })

  const { data, error } = await supabaseAdmin
    .from('coding_results')
    .select('*')
    .eq('case_id', req.params.caseId)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ results: data })
})
