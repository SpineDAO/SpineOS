import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import { authRouter } from './routes/auth.js'
import { casesRouter } from './routes/cases.js'
import { codingRouter } from './routes/coding.js'
import { reviewsRouter } from './routes/reviews.js'
import { auditLog } from './middleware/audit.js'

config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '5mb' }))
app.use(auditLog)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0' })
})

// Routes
app.use('/api/auth', authRouter)
app.use('/api/cases', casesRouter)
app.use('/api/coding', codingRouter)
app.use('/api/reviews', reviewsRouter)

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`SpineOS API running on port ${PORT}`)
})
