import crypto from 'crypto'

// PHI patterns to scrub from op notes before sending to external AI
const PHI_PATTERNS = [
  // Names (common patterns like "Patient: John Smith" or "Name: Jane Doe")
  /(?:patient|pt|name|surgeon|physician|dr\.?|doctor)\s*[:=]\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}/gi,
  // SSN
  /\b\d{3}-?\d{2}-?\d{4}\b/g,
  // MRN / Medical Record Numbers (6-10 digit sequences prefixed by MRN/MR#)
  /(?:MRN|MR#|Medical Record)\s*[:=#]?\s*\d{5,10}/gi,
  // Dates of birth (various formats)
  /(?:DOB|Date of Birth|D\.O\.B\.?)\s*[:=]?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/gi,
  // Phone numbers
  /\b(?:\+1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  // Email addresses
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // Street addresses (basic pattern)
  /\b\d{1,5}\s+(?:[A-Z][a-z]+\s+){1,3}(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Way|Ct|Court|Pl|Place)\b\.?/gi,
  // Account/insurance numbers
  /(?:Account|Acct|Insurance|Policy)\s*(?:#|No\.?|Number)?\s*[:=]?\s*[A-Z0-9-]{6,20}/gi,
]

/**
 * Scrub PHI from operative note text before sending to external AI.
 * Replaces identified PHI with placeholder tokens.
 */
export function scrubPHI(text) {
  if (!text) return ''
  let scrubbed = text

  for (const pattern of PHI_PATTERNS) {
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0
    scrubbed = scrubbed.replace(pattern, '[REDACTED]')
  }

  return scrubbed
}

/**
 * Hash a value with SHA-256 for storage (one-way, can't be reversed)
 */
export function hashValue(value) {
  if (!value) return ''
  return crypto.createHash('sha256').update(value).digest('hex').substring(0, 16)
}

/**
 * Validate and sanitize input strings — prevent injection
 */
export function sanitizeInput(input, maxLength = 50000) {
  if (typeof input !== 'string') return ''
  // Truncate to max length
  let clean = input.substring(0, maxLength)
  // Remove null bytes
  clean = clean.replace(/\0/g, '')
  return clean
}
