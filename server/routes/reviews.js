import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabase.js'

export const reviewsRouter = Router()

// Get review queue (biller sees pending_review cases)
reviewsRouter.get('/queue', requireAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' })

  let query = supabaseAdmin
    .from('cases')
    .select('*, coding_results(*)')
    .in('status', ['pending_review', 'pending_coding'])
    .order('created_at', { ascending: true })

  if (req.user.practiceId) {
    query = query.eq('practice_id', req.user.practiceId)
  }

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json({ cases: data })
})

// Approve a case (biller accepts AI coding as-is)
reviewsRouter.post('/:caseId/approve', requireAuth, requireRole('biller', 'surgeon', 'admin'), async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' })

  const { caseId } = req.params
  const { codingResultId, notes } = req.body

  // Get the latest coding result for this case
  const { data: codingResult } = await supabaseAdmin
    .from('coding_results')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!codingResult) {
    return res.status(400).json({ error: 'No coding result found for this case' })
  }

  // Create the review record
  const { error: reviewError } = await supabaseAdmin.from('coding_reviews').insert({
    coding_result_id: codingResult.id,
    case_id: caseId,
    reviewer_id: req.user.id,
    action: 'approve',
    original_codes: codingResult.cpt_codes,
    final_codes: codingResult.cpt_codes, // Same for approve
    review_notes: notes || '',
  })
  if (reviewError) return res.status(500).json({ error: reviewError.message })

  // Update case status
  await supabaseAdmin
    .from('cases')
    .update({ status: 'finalized', updated_at: new Date().toISOString() })
    .eq('id', caseId)

  // Store positive training signal
  await supabaseAdmin.from('training_signals').insert({
    user_id: req.user.id,
    payload: {
      type: 'accept',
      source: 'billing-review',
      caseId,
      codes: codingResult.cpt_codes,
      timestamp: new Date().toISOString(),
    }
  })

  res.json({ message: 'Case approved and finalized', caseId })
})

// Edit codes and approve (biller modifies AI coding)
reviewsRouter.post('/:caseId/edit', requireAuth, requireRole('biller', 'surgeon', 'admin'), async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' })

  const { caseId } = req.params
  const { finalCodes, notes } = req.body

  if (!finalCodes || !Array.isArray(finalCodes)) {
    return res.status(400).json({ error: 'finalCodes array is required' })
  }

  // Get the latest coding result
  const { data: codingResult } = await supabaseAdmin
    .from('coding_results')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!codingResult) {
    return res.status(400).json({ error: 'No coding result found for this case' })
  }

  // Create review with before/after diff
  const { error: reviewError } = await supabaseAdmin.from('coding_reviews').insert({
    coding_result_id: codingResult.id,
    case_id: caseId,
    reviewer_id: req.user.id,
    action: 'edit',
    original_codes: codingResult.cpt_codes,
    final_codes: finalCodes,
    review_notes: notes || '',
  })
  if (reviewError) return res.status(500).json({ error: reviewError.message })

  // Update case status
  await supabaseAdmin
    .from('cases')
    .update({ status: 'finalized', updated_at: new Date().toISOString() })
    .eq('id', caseId)

  // Store edit training signal (this is the most valuable signal for improving the model)
  await supabaseAdmin.from('training_signals').insert({
    user_id: req.user.id,
    payload: {
      type: 'edit',
      source: 'billing-review',
      caseId,
      originalCodes: codingResult.cpt_codes,
      finalCodes,
      notes,
      timestamp: new Date().toISOString(),
    }
  })

  res.json({ message: 'Case edited and finalized', caseId })
})

// Reject a case (send back to surgeon)
reviewsRouter.post('/:caseId/reject', requireAuth, requireRole('biller', 'surgeon', 'admin'), async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' })

  const { caseId } = req.params
  const { reason } = req.body

  if (!reason?.trim()) {
    return res.status(400).json({ error: 'Rejection reason is required' })
  }

  // Get the latest coding result
  const { data: codingResult } = await supabaseAdmin
    .from('coding_results')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Create review record
  if (codingResult) {
    await supabaseAdmin.from('coding_reviews').insert({
      coding_result_id: codingResult.id,
      case_id: caseId,
      reviewer_id: req.user.id,
      action: 'reject',
      original_codes: codingResult.cpt_codes,
      final_codes: null,
      review_notes: reason,
    })
  }

  // Set case back to needs attention
  await supabaseAdmin
    .from('cases')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', caseId)

  // Store negative training signal
  await supabaseAdmin.from('training_signals').insert({
    user_id: req.user.id,
    payload: {
      type: 'reject',
      source: 'billing-review',
      caseId,
      reason,
      timestamp: new Date().toISOString(),
    }
  })

  res.json({ message: 'Case rejected', caseId })
})

// Get review history for a case
reviewsRouter.get('/:caseId/history', requireAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' })

  const { data, error } = await supabaseAdmin
    .from('coding_reviews')
    .select('*, reviewer:user_profiles(display_name, role)')
    .eq('case_id', req.params.caseId)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ reviews: data })
})

// Get eval metrics (accuracy stats from reviews)
reviewsRouter.get('/metrics', requireAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' })

  const { data: reviews, error } = await supabaseAdmin
    .from('coding_reviews')
    .select('action, created_at')

  if (error) return res.status(500).json({ error: error.message })

  const total = reviews.length
  const approved = reviews.filter(r => r.action === 'approve').length
  const edited = reviews.filter(r => r.action === 'edit').length
  const rejected = reviews.filter(r => r.action === 'reject').length

  // Accuracy = approved / (approved + edited + rejected)
  // This is the key metric: how often does the AI get it right without human changes?
  const accuracy = total > 0 ? ((approved / total) * 100).toFixed(1) : 0

  res.json({
    metrics: {
      totalReviews: total,
      approved,
      edited,
      rejected,
      aiAccuracy: Number(accuracy),
      overrideRate: total > 0 ? (((edited + rejected) / total) * 100).toFixed(1) : 0,
    }
  })
})
