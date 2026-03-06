// HIPAA-grade security middleware

// ---- Security Headers (replaces helmet for zero-dep) ----
export function securityHeaders(req, res, next) {
  // HSTS — force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '0') // modern browsers: CSP is better
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none'")
  res.setHeader('Cache-Control', 'no-store') // never cache API responses (PHI)
  res.setHeader('Pragma', 'no-cache')
  next()
}

// ---- Rate Limiting (in-memory, per IP) ----
const windowMs = 60 * 1000 // 1 minute
const maxRequests = Number(process.env.RATE_LIMIT_MAX) || 60 // 60 requests per minute
const aiMaxRequests = Number(process.env.RATE_LIMIT_AI_MAX) || 10 // 10 AI calls per minute

const requestCounts = new Map()

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of requestCounts) {
    if (now - entry.windowStart > windowMs * 2) {
      requestCounts.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function rateLimiter(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const now = Date.now()

  // Determine limit based on route
  const isAIRoute = req.path.startsWith('/api/coding/')
  const limit = isAIRoute ? aiMaxRequests : maxRequests

  const key = `${ip}:${isAIRoute ? 'ai' : 'general'}`
  let entry = requestCounts.get(key)

  if (!entry || now - entry.windowStart > windowMs) {
    entry = { count: 0, windowStart: now }
    requestCounts.set(key, entry)
  }

  entry.count++

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', limit)
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - entry.count))

  if (entry.count > limit) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((entry.windowStart + windowMs - now) / 1000),
    })
  }

  next()
}
