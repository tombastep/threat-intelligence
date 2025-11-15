import { describe, it, expect } from 'vitest'
import {
  isPrivateOrReservedIP,
  getPrivateIPErrorMessage,
} from '../ipValidator'

describe('ipValidator', () => {
  describe('isPrivateOrReservedIP', () => {
    describe('private ranges', () => {
      it('should detect 10.x.x.x range', () => {
        expect(isPrivateOrReservedIP('10.0.0.0')).toBe(true)
        expect(isPrivateOrReservedIP('10.0.0.1')).toBe(true)
        expect(isPrivateOrReservedIP('10.255.255.255')).toBe(true)
        expect(isPrivateOrReservedIP('10.1.2.3')).toBe(true)
      })

      it('should detect 172.16-31.x.x range', () => {
        expect(isPrivateOrReservedIP('172.16.0.0')).toBe(true)
        expect(isPrivateOrReservedIP('172.16.0.1')).toBe(true)
        expect(isPrivateOrReservedIP('172.31.255.255')).toBe(true)
        expect(isPrivateOrReservedIP('172.20.1.1')).toBe(true)
        expect(isPrivateOrReservedIP('172.15.0.0')).toBe(false) // Below range
        expect(isPrivateOrReservedIP('172.32.0.0')).toBe(false) // Above range
      })

      it('should detect 192.168.x.x range', () => {
        expect(isPrivateOrReservedIP('192.168.0.0')).toBe(true)
        expect(isPrivateOrReservedIP('192.168.0.1')).toBe(true)
        expect(isPrivateOrReservedIP('192.168.255.255')).toBe(true)
        expect(isPrivateOrReservedIP('192.168.1.1')).toBe(true)
        expect(isPrivateOrReservedIP('192.169.0.0')).toBe(false) // Outside range
      })
    })

    describe('loopback', () => {
      it('should detect 127.x.x.x range', () => {
        expect(isPrivateOrReservedIP('127.0.0.0')).toBe(true)
        expect(isPrivateOrReservedIP('127.0.0.1')).toBe(true)
        expect(isPrivateOrReservedIP('127.255.255.255')).toBe(true)
        expect(isPrivateOrReservedIP('127.1.2.3')).toBe(true)
      })
    })

    describe('link-local', () => {
      it('should detect 169.254.x.x range', () => {
        expect(isPrivateOrReservedIP('169.254.0.0')).toBe(true)
        expect(isPrivateOrReservedIP('169.254.0.1')).toBe(true)
        expect(isPrivateOrReservedIP('169.254.255.255')).toBe(true)
        expect(isPrivateOrReservedIP('169.253.0.0')).toBe(false) // Outside range
        expect(isPrivateOrReservedIP('169.255.0.0')).toBe(false) // Outside range
      })
    })

    describe('public IPs', () => {
      it('should return false for public IPs', () => {
        expect(isPrivateOrReservedIP('8.8.8.8')).toBe(false)
        expect(isPrivateOrReservedIP('1.1.1.1')).toBe(false)
        expect(isPrivateOrReservedIP('208.67.222.222')).toBe(false)
        expect(isPrivateOrReservedIP('74.125.224.72')).toBe(false)
      })
    })

    describe('invalid formats', () => {
      it('should return false for invalid IP formats', () => {
        expect(isPrivateOrReservedIP('invalid')).toBe(false)
        expect(isPrivateOrReservedIP('256.1.1.1')).toBe(false) // Invalid octet
        expect(isPrivateOrReservedIP('1.1.1')).toBe(false) // Missing octet
        expect(isPrivateOrReservedIP('1.1.1.1.1')).toBe(false) // Extra octet
        expect(isPrivateOrReservedIP('')).toBe(false)
      })
    })
  })

  describe('getPrivateIPErrorMessage', () => {
    it('should return correct message for 10.x.x.x', () => {
      expect(getPrivateIPErrorMessage('10.0.0.1')).toBe(
        'Private network address (10.x.x.x) cannot be checked'
      )
    })

    it('should return correct message for 172.16-31.x.x', () => {
      expect(getPrivateIPErrorMessage('172.16.0.1')).toBe(
        'Private network address (172.16-31.x.x) cannot be checked'
      )
      expect(getPrivateIPErrorMessage('172.20.0.1')).toBe(
        'Private network address (172.16-31.x.x) cannot be checked'
      )
      expect(getPrivateIPErrorMessage('172.31.0.1')).toBe(
        'Private network address (172.16-31.x.x) cannot be checked'
      )
    })

    it('should return correct message for 192.168.x.x', () => {
      expect(getPrivateIPErrorMessage('192.168.0.1')).toBe(
        'Private network address (192.168.x.x) cannot be checked'
      )
      expect(getPrivateIPErrorMessage('192.168.1.1')).toBe(
        'Private network address (192.168.x.x) cannot be checked'
      )
    })

    it('should return correct message for 127.x.x.x', () => {
      expect(getPrivateIPErrorMessage('127.0.0.1')).toBe(
        'Loopback address (127.x.x.x) cannot be checked'
      )
      expect(getPrivateIPErrorMessage('127.1.2.3')).toBe(
        'Loopback address (127.x.x.x) cannot be checked'
      )
    })

    it('should return correct message for 169.254.x.x', () => {
      expect(getPrivateIPErrorMessage('169.254.0.1')).toBe(
        'Link-local address (169.254.x.x) cannot be checked'
      )
    })

    it('should return generic message for unrecognized private IP', () => {
      // This shouldn't happen in practice, but test edge case
      expect(getPrivateIPErrorMessage('0.0.0.0')).toBe(
        'Private or reserved IP address cannot be checked'
      )
    })
  })
})

