import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export const authRouter = Router()

// Get current user profile (any authenticated user)
authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user })
})

// Setup profile on first login (creates user_profiles row if missing)
authRouter.post('/setup-profile', requireAuth, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' })

  const { data: existing } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('id', req.user.id)
    .single()

  if (existing) {
    return res.json({ message: 'Profile already exists', user: req.user })
  }

  const { error } = await supabaseAdmin.from('user_profiles').insert({
    id: req.user.id,
    email: req.user.email,
    role: 'surgeon', // default role
    display_name: req.user.email.split('@')[0],
  })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Profile created', user: req.user })
})

// Invite a user (surgeon/admin only)
authRouter.post('/invite', requireAuth, requireRole('surgeon', 'admin'), async (req, res) => {
  const { email, role } = req.body
  if (!email || !role) return res.status(400).json({ error: 'email and role required' })
  if (!['surgeon', 'biller', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be surgeon, biller, or admin' })
  }

  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' })

  // Create the invite record so when they sign up, they get the right role
  const { error } = await supabaseAdmin.from('user_invites').insert({
    email: email.toLowerCase(),
    role,
    invited_by: req.user.id,
    practice_id: req.user.practiceId,
  })

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'User already invited' })
    return res.status(500).json({ error: error.message })
  }

  // Send invite email via Supabase Auth
  const { error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
  if (authError) {
    console.warn('Could not send invite email:', authError.message)
    // Don't fail - the invite record is created, user can still sign up manually
  }

  res.json({ message: `Invited ${email} as ${role}` })
})

// List invited users (surgeon/admin only)
authRouter.get('/invites', requireAuth, requireRole('surgeon', 'admin'), async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' })

  const { data, error } = await supabaseAdmin
    .from('user_invites')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ invites: data })
})

// Update user role (admin only)
authRouter.patch('/users/:userId/role', requireAuth, requireRole('admin', 'surgeon'), async (req, res) => {
  const { role } = req.body
  if (!['surgeon', 'biller', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' })
  }

  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' })

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ role })
    .eq('id', req.params.userId)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Role updated' })
})
