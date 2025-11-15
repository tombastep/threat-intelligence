/**
 * Utility functions for IP address validation
 */

/**
 * Check if an IP address is private or reserved
 * Rejects:
 * - Private ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x
 * - Loopback: 127.x.x.x
 * - Link-local: 169.254.x.x
 * - Localhost: 127.0.0.1
 *
 * Returns true if IP is private/reserved, false if it's public
 */
export function isPrivateOrReservedIP(ip: string): boolean {
  const parts = ip.split('.').map(Number)

  if (parts.length !== 4) {
    return false
  }

  const [a, b] = parts

  if (a === 10) {
    return true
  }

  if (a === 172 && b >= 16 && b <= 31) {
    return true
  }

  if (a === 192 && b === 168) {
    return true
  }

  if (a === 127) {
    return true
  }

  if (a === 169 && b === 254) {
    return true
  }

  return false
}

/**
 * Get user-friendly error message for private/reserved IPs
 */
export function getPrivateIPErrorMessage(ip: string): string {
  const parts = ip.split('.').map(Number)
  const [a, b] = parts

  if (a === 10) {
    return 'Private network address (10.x.x.x) cannot be checked'
  }

  if (a === 172 && b >= 16 && b <= 31) {
    return 'Private network address (172.16-31.x.x) cannot be checked'
  }

  if (a === 192 && b === 168) {
    return 'Private network address (192.168.x.x) cannot be checked'
  }

  if (a === 127) {
    return 'Loopback address (127.x.x.x) cannot be checked'
  }

  if (a === 169 && b === 254) {
    return 'Link-local address (169.254.x.x) cannot be checked'
  }

  return 'Private or reserved IP address cannot be checked'
}

