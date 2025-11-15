import { Router, Request, Response, NextFunction } from 'express'
import { ipInputSchema } from '@threat-intel/shared'
import { validateBody } from '../middleware/validation'
import { threatIntelService } from '../services/threatIntel.service'
import { logger } from '../utils/logger'
import {
  isPrivateOrReservedIP,
  getPrivateIPErrorMessage,
} from '../utils/ipValidator'

const router = Router()

/**
 * POST /api/intel
 * Look up threat intelligence for an IP address
 */
router.post(
  '/intel',
  validateBody(ipInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const { ip } = req.body

    try {
      if (isPrivateOrReservedIP(ip)) {
        logger.warn('Private/reserved IP rejected', { ip })

        return res.status(400).json({
          error: 'Validation Error',
          message: getPrivateIPErrorMessage(ip),
          details: [
            {
              field: 'ip',
              issue:
                'Cannot check private or reserved IP addresses. Only public IPs are supported.',
            },
          ],
        })
      }

      logger.info('Threat intel lookup requested', { ip })

      const result = await threatIntelService.lookup(ip)

      logger.info('Threat intel lookup successful', {
        ip,
        overallRisk: result.overallRisk,
        sources: result.sources,
      })

      res.json(result)
    } catch (error) {
      next(error)
    }
  }
)

export default router
