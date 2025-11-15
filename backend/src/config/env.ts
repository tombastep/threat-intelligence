import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env file in the project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

interface Config {
  nodeEnv: string
  port: number
  abuseipdbApiKey: string
  ipqualityscoreApiKey: string
  frontendUrl: string
  ipapiBaseUrl?: string
  ipapiApiKey?: string
  virustotalApiKey?: string
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

function getOptionalEnvVar(
  key: string,
  defaultValue?: string
): string | undefined {
  return process.env[key] || defaultValue
}

export const config: Config = {
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  port: parseInt(getEnvVar('PORT', '3001'), 10),
  abuseipdbApiKey: getEnvVar('ABUSEIPDB_API_KEY'),
  ipqualityscoreApiKey: getEnvVar('IPQUALITYSCORE_API_KEY'),
  frontendUrl: getEnvVar('FRONTEND_URL', 'http://localhost:5173'),
  ipapiBaseUrl: getOptionalEnvVar('IPAPI_BASE_URL', 'http://ip-api.com/json'),
  ipapiApiKey: getOptionalEnvVar('IPAPI_API_KEY'),
  virustotalApiKey: getOptionalEnvVar('VIRUSTOTAL_API_KEY'),
}
