import { z } from 'zod'

/**
 * Schema for IP address validation
 * Validates IPv4 format only
 */
export const ipInputSchema = z.object({
  ip: z
    .string()
    .trim()
    .ip({ version: 'v4', message: 'Must be a valid IPv4 address' }),
})

/**
 * Infer TypeScript type from schema
 */
export type IPInput = z.infer<typeof ipInputSchema>

/**
 * Schema for threat intelligence response
 * Used for runtime validation of aggregated data
 */
export const threatIntelResponseSchema = z.object({
  ip: z.string().ip({ version: 'v4' }),
  hostname: z.string().nullable(),
  isp: z.string(),
  country: z.string(),
  abuseScore: z.number().min(0).max(100),
  recentReports: z.number().int().nonnegative(),
  isVpnOrProxy: z.boolean(),
  threatScore: z.number().min(0).max(100),
  sources: z.object({
    abuseipdb: z.boolean(),
    ipqualityscore: z.boolean(),
    ipapi: z.boolean(),
    virustotal: z.boolean(),
  }),
  overallRisk: z.enum(['low', 'medium', 'high']).optional(),
})

/**
 * Schema for error responses
 */
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z
    .array(
      z.object({
        field: z.string(),
        issue: z.string(),
      })
    )
    .optional(),
  retryAfter: z.number().optional(),
})
