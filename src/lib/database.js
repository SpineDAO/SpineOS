import { supabase, isSupabaseConfigured } from './supabase'
import crypto from 'crypto' // not available in browser — use Web Crypto API

// Hash patient identifiers — never store raw PHI
function hashIdentifier(value) {
  if (!value) return ''
  // Use SHA-256 via Web Crypto API (browser-compatible)
  const encoder = new TextEncoder()
  return crypto.subtle
    ? crypto.subtle.digest('SHA-256', encoder.encode(value)).then(buf =>
        Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
      )
    : value // fallback if no crypto available
}

// Synchronous hash for immediate use (simple but not crypto-grade)
function hashSync(value) {
  if (!value) return ''
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return 'h_' + Math.abs(hash).toString(36)
}

// --- Cases ---

export async function fetchCases(userId) {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) { console.error('fetchCases:', error); return null }
  return data.map(rowToCase)
}

export async function upsertCase(userId, caseData) {
  if (!isSupabaseConfigured()) return null
  const row = caseToRow(userId, caseData)
  const { data, error } = await supabase
    .from('cases')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single()
  if (error) { console.error('upsertCase:', error); return null }
  return rowToCase(data)
}

export async function insertCases(userId, casesArray) {
  if (!isSupabaseConfigured()) return null
  const rows = casesArray.map(c => caseToRow(userId, c))
  const { error } = await supabase.from('cases').insert(rows)
  if (error) { console.error('insertCases:', error); return null }
  return true
}

// --- Training Signals ---

export async function fetchTrainingSignals(userId) {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await supabase
    .from('training_signals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) { console.error('fetchTrainingSignals:', error); return [] }
  return data.map(r => r.payload)
}

export async function insertTrainingSignal(userId, signal) {
  if (!isSupabaseConfigured()) return null
  const { error } = await supabase
    .from('training_signals')
    .insert({ user_id: userId, payload: signal })
  if (error) { console.error('insertTrainingSignal:', error); return null }
  return true
}

// --- Row Mapping ---
// The DB stores a flat row; the app uses a richer object.
// HIPAA: patient_name is hashed before storage — no raw PHI in the database.

function caseToRow(userId, c) {
  // Strip any raw patient name from the data blob before persisting
  const sanitized = { ...c }
  if (sanitized.patient) sanitized.patient = hashSync(sanitized.patient)
  if (sanitized.patientName) sanitized.patientName = hashSync(sanitized.patientName)

  return {
    id: c.id,
    user_id: userId,
    patient_name: hashSync(c.patient || c.patientName || ''),
    procedure_date: c.date || c.procedureDate || null,
    data: sanitized,
  }
}

function rowToCase(row) {
  return { ...row.data, id: row.id }
}
