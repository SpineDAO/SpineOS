import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { authRouter } from './routes/auth.js'
import { casesRouter } from './routes/cases.js'
import { codingRouter } from './routes/coding.js'
import { reviewsRouter } from './routes/reviews.js'
import { auditLog } from './middleware/audit.js'
import { securityHeaders, rateLimiter } from './middleware/security.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

config()

const app = express()
const PORT = process.env.PORT || 3001

// ---- Security ----
app.use(securityHeaders)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: '2mb' }))
app.use(rateLimiter)
app.use(auditLog)

// Disable x-powered-by
app.disable('x-powered-by')

// Health check (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0' })
})

// Routes
app.use('/api/auth', authRouter)
app.use('/api/cases', casesRouter)
app.use('/api/coding', codingRouter)
app.use('/api/reviews', reviewsRouter)

// Serve frontend in production (after API routes)
const distPath = join(__dirname, '..', 'dist')
if (process.env.NODE_ENV === 'production' && existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
}

// Error handler — never leak stack traces or internal details
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`SpineOS API running on port ${PORT}`)
})
