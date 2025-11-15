import { describe, it, expect } from 'vitest'
import { calculateOverallRisk, mapCountryCode } from '../riskCalculator'

describe('riskCalculator', () => {
  describe('calculateOverallRisk', () => {
    it('should return low risk for scores below 30', () => {
      expect(calculateOverallRisk(0, 0, false, 0)).toBe('low')
      expect(calculateOverallRisk(10, 10, false, 10)).toBe('low')
      expect(calculateOverallRisk(20, 20, false, 0)).toBe('low')
    })

    it('should return medium risk for scores between 30 and 59', () => {
      // 40*0.5 + 30*0.3 = 20 + 9 = 29 (low) - need higher scores
      // 60*0.5 + 30*0.3 = 30 + 9 = 39 (medium)
      expect(calculateOverallRisk(60, 30, false, 0)).toBe('medium')
      // 30*0.5 + 30*0.3 + 30*0.2 = 15 + 9 + 6 = 30 (medium)
      expect(calculateOverallRisk(30, 30, false, 30)).toBe('medium')
      // 50*0.5 + 20*0.3 + 20*0.2 = 25 + 6 + 4 = 35 (medium)
      expect(calculateOverallRisk(50, 20, false, 20)).toBe('medium')
    })

    it('should return high risk for scores 60 and above', () => {
      // 100*0.5 + 50*0.3 = 50 + 15 = 65 (high)
      expect(calculateOverallRisk(100, 50, false, 0)).toBe('high')
      // 60*0.5 + 60*0.3 + 60*0.2 = 30 + 18 + 12 = 60 (high)
      expect(calculateOverallRisk(60, 60, false, 60)).toBe('high')
      // 100*0.5 = 50 (medium) - need higher
      // 120*0.5 = 60 (high, clamped to 100*0.5 = 50, but we need 60+)
      // Actually: 100*0.5 + 100*0.3 = 50 + 30 = 80 (high)
      expect(calculateOverallRisk(100, 100, false, 0)).toBe('high')
    })

    it('should add 15 points for VPN/proxy', () => {
      // Without VPN: (20 * 0.5) + (20 * 0.3) + (0 * 0.2) = 10 + 6 = 16 (low)
      expect(calculateOverallRisk(20, 20, false, 0)).toBe('low')

      // With VPN: 16 + 15 = 31 (medium)
      expect(calculateOverallRisk(20, 20, true, 0)).toBe('medium')
    })

    it('should apply correct weights (0.5, 0.3, 0.2)', () => {
      // abuseScore: 100 * 0.5 = 50
      // threatScore: 0 * 0.3 = 0
      // vtScore: 0 * 0.2 = 0
      // Total: 50 (medium)
      expect(calculateOverallRisk(100, 0, false, 0)).toBe('medium')

      // abuseScore: 0 * 0.5 = 0
      // threatScore: 100 * 0.3 = 30
      // vtScore: 0 * 0.2 = 0
      // Total: 30 (medium)
      expect(calculateOverallRisk(0, 100, false, 0)).toBe('medium')

      // abuseScore: 0 * 0.5 = 0
      // threatScore: 0 * 0.3 = 0
      // vtScore: 100 * 0.2 = 20
      // Total: 20 (low)
      expect(calculateOverallRisk(0, 0, false, 100)).toBe('low')
    })

    it('should clamp scores above 100', () => {
      // abuseScore: 200 clamped to 100 * 0.5 = 50
      // threatScore: 200 clamped to 100 * 0.3 = 30
      // vtScore: 200 clamped to 100 * 0.2 = 20
      // Total: 100 (high)
      expect(calculateOverallRisk(200, 200, false, 200)).toBe('high')
    })

    it('should clamp scores below 0', () => {
      // All negative scores clamped to 0
      expect(calculateOverallRisk(-10, -20, false, -30)).toBe('low')
    })

    it('should handle edge case at threshold 30', () => {
      // Exactly 30 should be medium
      // abuseScore: 60 * 0.5 = 30
      expect(calculateOverallRisk(60, 0, false, 0)).toBe('medium')
    })

    it('should handle edge case at threshold 60', () => {
      // Exactly 60 should be high
      // abuseScore: 120 clamped to 100 * 0.5 = 50 (medium)
      // Need: 120*0.5 = 60, but clamped to 100*0.5 = 50
      // So we need: 100*0.5 + 100*0.2 = 50 + 20 = 70 (high)
      // Or simpler: 100*0.5 + 50*0.3 = 50 + 15 = 65 (high)
      expect(calculateOverallRisk(100, 50, false, 0)).toBe('high')
    })

    it('should combine all factors correctly', () => {
      // abuseScore: 50 * 0.5 = 25
      // threatScore: 50 * 0.3 = 15
      // vtScore: 50 * 0.2 = 10
      // VPN: +15
      // Total: 25 + 15 + 10 + 15 = 65 (high)
      expect(calculateOverallRisk(50, 50, true, 50)).toBe('high')
    })

    it('should handle all zeros', () => {
      expect(calculateOverallRisk(0, 0, false, 0)).toBe('low')
    })

    it('should handle all max values', () => {
      expect(calculateOverallRisk(100, 100, true, 100)).toBe('high')
    })
  })

  describe('mapCountryCode', () => {
    it('should map known country codes to names', () => {
      expect(mapCountryCode('US')).toBe('United States')
      expect(mapCountryCode('GB')).toBe('United Kingdom')
      expect(mapCountryCode('CA')).toBe('Canada')
      expect(mapCountryCode('AU')).toBe('Australia')
      expect(mapCountryCode('DE')).toBe('Germany')
      expect(mapCountryCode('FR')).toBe('France')
      expect(mapCountryCode('JP')).toBe('Japan')
      expect(mapCountryCode('CN')).toBe('China')
      expect(mapCountryCode('IN')).toBe('India')
      expect(mapCountryCode('BR')).toBe('Brazil')
    })

    it('should return code for unknown country codes', () => {
      expect(mapCountryCode('XX')).toBe('XX')
      expect(mapCountryCode('ZZ')).toBe('ZZ')
      expect(mapCountryCode('ABC')).toBe('ABC')
    })

    it('should handle case sensitivity', () => {
      // Currently case-sensitive, returns code if not exact match
      expect(mapCountryCode('us')).toBe('us')
      expect(mapCountryCode('Us')).toBe('Us')
    })

    it('should handle empty string', () => {
      expect(mapCountryCode('')).toBe('')
    })
  })
})
