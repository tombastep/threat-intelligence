/**
 * Simple logger utility
 * For production, would use a library like Winston or Pino
 */

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(`[INFO] ${message}`, meta || '')
  },

  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, meta || '')
  },

  error: (
    message: string,
    error?: Error | unknown,
    meta?: Record<string, unknown>
  ) => {
    console.error(`[ERROR] ${message}`, {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : error,
      ...meta,
    })
  },

  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, meta || '')
    }
  },
}

