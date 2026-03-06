import { supabaseAdmin } from '../lib/supabase.js'

// Log all mutating API requests to audit_log table
export function auditLog(req, res, next) {
  // Only log mutating requests
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next()
  }

  // Capture the original json method to intercept response
  const originalJson = res.json.bind(res)
  res.json = function (data) {
    // Log after response is sent
    if (supabaseAdmin && req.user) {
      const entry = {
        user_id: req.user.id,
        action: `${req.method} ${req.originalUrl}`,
        resource_type: req.originalUrl.split('/')[2] || 'unknown',
        resource_id: req.params?.id || null,
        metadata: {
          status: res.statusCode,
          role: req.user.role,
        },
      }
      supabaseAdmin.from('audit_log').insert(entry).then(() => {}).catch(() => {})
    }
    return originalJson(data)
  }

  next()
}
