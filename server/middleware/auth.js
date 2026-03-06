import { supabaseAdmin } from '../lib/supabase.js'

// Verify Supabase JWT and attach user + role to request
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  const token = authHeader.slice(7)

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database not configured' })
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Fetch user profile with role
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role, practice_id, display_name')
      .eq('id', user.id)
      .single()

    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || 'surgeon',
      practiceId: profile?.practice_id || null,
      displayName: profile?.display_name || user.email,
    }
    req.accessToken = token

    next()
  } catch (err) {
    console.error('Auth middleware error:', err.message)
    return res.status(401).json({ error: 'Authentication failed' })
  }
}

// Role-based access control
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      })
    }
    next()
  }
}
