import cors from 'cors'
import { config } from '../config/env'

/**
 * CORS configuration for frontend communication
 * Allows requests from the frontend origin
 */
export const corsMiddleware = cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})

