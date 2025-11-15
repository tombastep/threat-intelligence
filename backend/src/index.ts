import express, { Request, Response } from 'express'
import { config } from './config/env'
import { corsMiddleware } from './middleware/cors'
import { errorHandler } from './middleware/errorHandler'
import { logger } from './utils/logger'
import intelRouter from './routes/intel.route'

const app = express()
const PORT = config.port

// Middleware
app.use(corsMiddleware)
app.use(express.json())

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api', intelRouter)

// Error handling middleware (must be last)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  logger.info(`Backend server running on http://localhost:${PORT}`)
  logger.info(`Health check: http://localhost:${PORT}/health`)
  logger.info(`API endpoint: POST http://localhost:${PORT}/api/intel`)
  logger.info(`Environment: ${config.nodeEnv}`)
})

export default app
