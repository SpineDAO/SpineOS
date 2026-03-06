import crypto from 'crypto'

// AES-256-GCM encryption for PHI at rest
// Key must be 32 bytes (256 bits), set via ENCRYPTION_KEY env var
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

function getKey() {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    console.warn('ENCRYPTION_KEY not set — PHI will NOT be encrypted at rest. Set a 64-char hex key.')
    return null
  }
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)')
  }
  return Buffer.from(key, 'hex')
}

/**
 * Encrypt a string value. Returns a combined string: iv:authTag:ciphertext (all hex)
 * Returns the original value if encryption key is not configured.
 */
export function encrypt(plaintext) {
  if (!plaintext) return plaintext
  const key = getKey()
  if (!key) return plaintext

  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')

  return `enc:${iv.toString('hex')}:${authTag}:${encrypted}`
}

/**
 * Decrypt a value previously encrypted with encrypt().
 * If the value doesn't start with 'enc:', it's returned as-is (unencrypted data).
 */
export function decrypt(ciphertext) {
  if (!ciphertext || !ciphertext.startsWith('enc:')) return ciphertext
  const key = getKey()
  if (!key) return ciphertext // can't decrypt without key

  const parts = ciphertext.split(':')
  if (parts.length !== 4) return ciphertext

  const iv = Buffer.from(parts[1], 'hex')
  const authTag = Buffer.from(parts[2], 'hex')
  const encrypted = parts[3]

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * Generate a new random encryption key (for initial setup)
 */
export function generateKey() {
  return crypto.randomBytes(32).toString('hex')
}
