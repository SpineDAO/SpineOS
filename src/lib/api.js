// SpineOS API Client — all backend calls go through here
import { supabase } from './supabase'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
  }
  return headers
}

async function request(method, path, body) {
  const headers = await getAuthHeaders()
  const opts = { method, headers }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${API_BASE}${path}`, opts)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || `API error: ${res.status}`)
  }
  return data
}

// ---- Auth ----
export const api = {
  // Auth
  getMe: () => request('GET', '/auth/me'),
  setupProfile: () => request('POST', '/auth/setup-profile'),
  invite: (email, role) => request('POST', '/auth/invite', { email, role }),
  getInvites: () => request('GET', '/auth/invites'),
  updateRole: (userId, role) => request('PATCH', `/auth/users/${userId}/role`, { role }),

  // Coding (AI engine)
  analyzeOpNote: (opNoteText, payerName, caseId) =>
    request('POST', '/coding/analyze', { opNoteText, payerName, caseId }),

  generateAppeal: (code, codeDescription, denialReason, payerName, opNoteExcerpt) =>
    request('POST', '/coding/appeal', { code, codeDescription, denialReason, payerName, opNoteExcerpt }),

  getCodingHistory: (caseId) => request('GET', `/coding/history/${caseId}`),

  // Cases
  getCases: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request('GET', `/cases${qs ? '?' + qs : ''}`)
  },
  getCase: (id) => request('GET', `/cases/${id}`),
  createCase: (data) => request('POST', '/cases', data),
  updateCase: (id, data) => request('PATCH', `/cases/${id}`, data),

  // Reviews (billing workflow)
  getReviewQueue: () => request('GET', '/reviews/queue'),
  approveCase: (caseId, notes) => request('POST', `/reviews/${caseId}/approve`, { notes }),
  editCase: (caseId, finalCodes, notes) => request('POST', `/reviews/${caseId}/edit`, { finalCodes, notes }),
  rejectCase: (caseId, reason) => request('POST', `/reviews/${caseId}/reject`, { reason }),
  getReviewHistory: (caseId) => request('GET', `/reviews/${caseId}/history`),
  getMetrics: () => request('GET', '/reviews/metrics'),
}
