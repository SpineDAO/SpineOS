import { supabase, isSupabaseConfigured } from './supabase'

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
// We store the full case object in a JSONB `data` column for flexibility,
// plus a few indexed columns for querying.

function caseToRow(userId, c) {
  return {
    id: c.id,
    user_id: userId,
    patient_name: c.patient || c.patientName || '',
    procedure_date: c.date || c.procedureDate || null,
    data: c,
  }
}

function rowToCase(row) {
  return { ...row.data, id: row.id }
}
