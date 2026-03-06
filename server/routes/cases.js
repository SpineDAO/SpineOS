import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabase.js'

export const casesRouter = Router()

// List cases (filtered by role)
casesRouter.get('/', requireAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' })

  const { status, limit = 50, offset = 0 } = req.query

  let query = supabaseAdmin
    .from('cases')
    .select('*')
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1)

  // Filter by practice if user has one
  if (req.user.practiceId) {
    query = query.eq('practice_id', req.user.practiceId)
  } else {
    // Fallback: show cases created by or assigned to this user
    query = query.or(`submitted_by.eq.${req.user.id},assigned_to.eq.${req.user.id}`)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json({ cases: data })
})

// Get single case
casesRouter.get('/:id', requireAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' })

  const { data, error } = await supabaseAdmin
    .from('cases')
    .select('*, coding_results(*), coding_reviews(*)')
    .eq('id', req.params.id)
    .single()

  if (error) return res.status(404).json({ error: 'Case not found' })
  res.json({ case: data })
})

// Create a new case (surgeon submits op note)
casesRouter.post('/', requireAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' })

  const {
    opNoteText, procedureDate, patientId, diagnosis,
    levels, approach, payer, facility,
  } = req.body

  if (!opNoteText?.trim()) {
    return res.status(400).json({ error: 'opNoteText is required' })
  }

  const caseData = {
    submitted_by: req.user.id,
    practice_id: req.user.practiceId,
    op_note_text: opNoteText,
    procedure_date: procedureDate || new Date().toISOString().split('T')[0],
    patient_id_hash: patientId || null,
    diagnosis: diagnosis || '',
    levels: levels || [],
    approach: approach || '',
    payer: payer || 'Medicare',
    facility: facility || 'hospital',
    status: 'pending_coding',
  }

  const { data, error } = await supabaseAdmin
    .from('cases')
    .insert(caseData)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json({ case: data })
})

// Update case (surgeon can edit their own cases in certain statuses)
casesRouter.patch('/:id', requireAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' })

  // Fetch the case first to check ownership/status
  const { data: existing } = await supabaseAdmin
    .from('cases')
    .select('submitted_by, status')
    .eq('id', req.params.id)
    .single()

  if (!existing) return res.status(404).json({ error: 'Case not found' })

  // Surgeons can only edit their own cases that aren't finalized
  if (req.user.role === 'surgeon' && existing.submitted_by !== req.user.id) {
    return res.status(403).json({ error: 'Can only edit your own cases' })
  }
  if (existing.status === 'finalized') {
    return res.status(400).json({ error: 'Cannot edit finalized cases' })
  }

  const allowedFields = [
    'op_note_text', 'procedure_date', 'diagnosis', 'levels',
    'approach', 'payer', 'facility', 'status',
  ]
  const updates = {}
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field]
  }
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('cases')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ case: data })
})
