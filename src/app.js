import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.routes.js'
import taskRoutes from './routes/tasks.routes.js'
import { errorHandler, notFound } from './middleware/error.middleware.js'

const app = express()

app.use(cors())
app.use(express.json())

// Global rate limit
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}))

// Health check — used by ECS/ALB target group health checks
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, ts: new Date().toISOString() })
})

app.use('/auth', authRoutes)
app.use('/tasks', taskRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
