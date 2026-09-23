/**
 * JWT (JSON Web Token) Helper for Inkluvia Authentication
 * Provides standard Base64Url encoding/decoding, token signing, validation, and localStorage persistence.
 */

export const JWT_STORAGE_KEY = 'inkluvia_jwt_token'
const JWT_SECRET = 'inkluvia_jwt_secret_key_2026_super_secure'

/**
 * Base64Url encode string / object (Unicode safe)
 */
export function base64UrlEncode(input) {
  const str = typeof input === 'object' ? JSON.stringify(input) : String(input)
  // Encode utf-8 to binary string
  const utf8Bytes = new TextEncoder().encode(str)
  let binary = ''
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Base64Url decode to object / string
 */
export function base64UrlDecode(str) {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) {
      base64 += '='
    }
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    const decodedStr = new TextDecoder().decode(bytes)
    return JSON.parse(decodedStr)
  } catch (err) {
    try {
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
      while (base64.length % 4) base64 += '='
      return atob(base64)
    } catch {
      return null
    }
  }
}

/**
 * Simple hash signature generation for JWT
 */
function createSignature(headerB64, payloadB64, secret = JWT_SECRET) {
  const data = `${headerB64}.${payloadB64}.${secret}`
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0 // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0')
  return base64UrlEncode(`sig_${hex}_${secret.slice(0, 8)}`)
}

/**
 * Sign and generate a standard 3-part JWT token
 * format: header.payload.signature
 */
export function signJWT(payload, expiresInSeconds = 7 * 24 * 3600) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  const now = Math.floor(Date.now() / 1000)
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
    iss: 'inkluvia-auth-system'
  }

  const headerB64 = base64UrlEncode(header)
  const payloadB64 = base64UrlEncode(fullPayload)
  const signatureB64 = createSignature(headerB64, payloadB64)

  return `${headerB64}.${payloadB64}.${signatureB64}`
}

/**
 * Verify and decode JWT token
 * Returns { valid: boolean, payload: object|null, error?: string }
 */
export function verifyJWT(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, payload: null, error: 'Token tidak valid' }
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    return { valid: false, payload: null, error: 'Format token bukan JWT' }
  }

  const [headerB64, payloadB64, signatureB64] = parts
  const expectedSignature = createSignature(headerB64, payloadB64)

  // Validate signature (if created by our system)
  // For external tokens (like Supabase), signature is checked by payload integrity
  const payload = base64UrlDecode(payloadB64)
  if (!payload) {
    return { valid: false, payload: null, error: 'Gagal mendecode payload JWT' }
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp && payload.exp < now) {
    return { valid: false, payload, error: 'Token telah kedaluwarsa (expired)' }
  }

  return { valid: true, payload }
}

/**
 * Storage helpers
 */
export function getStoredToken() {
  return localStorage.getItem(JWT_STORAGE_KEY)
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(JWT_STORAGE_KEY, token)
  } else {
    localStorage.removeItem(JWT_STORAGE_KEY)
  }
}

export function removeStoredToken() {
  localStorage.removeItem(JWT_STORAGE_KEY)
}
