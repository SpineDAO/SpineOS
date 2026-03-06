import React, { useState, useMemo, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { cptCodes, payerProfiles, denialScenarios, modifierRules } from '../data/seedData'
import { api } from '../lib/api'

const COLORS = ['#00c2ff', '#f0b429', '#10b981', '#ef4444', '#8b5cf6']

export default function BillingPortal({ cases, addTrainingSignal, setActiveModule }) {
  const [activeTab, setActiveTab] = useState('audit-queue')
  const [selectedCase, setSelectedCase] = useState(null)
  const [batchFile, setBatchFile] = useState(null)
  const [reviewLoading, setReviewLoading] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const handleApprove = useCallback(async (caseItem) => {
    setReviewLoading(caseItem.id)
    try {
      await api.approveCase(caseItem.id, '')
      addTrainingSignal({ type: 'accept', codes: caseItem.cptCodes, source: 'billing-review' })
    } catch (e) {
      console.error('Approve failed:', e)
      // Offline fallback: update local state
      addTrainingSignal({ type: 'accept', codes: caseItem.cptCodes, source: 'billing-review-offline' })
    }
    setReviewLoading(null)
  }, [addTrainingSignal])

  const handleReject = useCallback(async (caseItem) => {
    if (!rejectReason.trim()) return
    setReviewLoading(caseItem.id)
    try {
      await api.rejectCase(caseItem.id, rejectReason)
      addTrainingSignal({ type: 'reject', caseId: caseItem.id, reason: rejectReason, source: 'billing-review' })
    } catch (e) {
      console.error('Reject failed:', e)
      addTrainingSignal({ type: 'reject', caseId: caseItem.id, reason: rejectReason, source: 'billing-review-offline' })
    }
    setRejectModal(null)
    setRejectReason('')
    setReviewLoading(null)
  }, [rejectReason, addTrainingSignal])

  const pendingCases = useMemo(() => cases.filter(c => c.status === 'pending_review'), [cases])
  const finalizedCases = useMemo(() => cases.filter(c => c.status === 'finalized'), [cases])

  const denialStats = useMemo(() => {
    const total = denialScenarios.length
    const won = denialScenarios.filter(d => d.appealOutcome === 'won').length
    const pending = denialScenarios.filter(d => d.status === 'pending' || d.appealOutcome === 'pending').length
    const totalAmount = denialScenarios.reduce((s, d) => s + d.amountDenied, 0)
    const recoveredAmount = denialScenarios.filter(d => d.appealOutcome === 'won').reduce((s, d) => s + d.amountDenied, 0)

    const byPayer = {}
    denialScenarios.forEach(d => {
      if (!byPayer[d.payer]) byPayer[d.payer] = { count: 0, amount: 0 }
      byPayer[d.payer].count++
      byPayer[d.payer].amount += d.amountDenied
    })

    return { total, won, pending, lost: total - won - pending, totalAmount, recoveredAmount, byPayer }
  }, [])

  const denialByPayerData = Object.entries(denialStats.byPayer).map(([name, data]) => ({
    name, count: data.count, amount: Math.round(data.amount)
  }))

  const denialStatusData = [
    { name: 'Won', value: denialStats.won },
    { name: 'Pending', value: denialStats.pending },
    { name: 'Lost', value: denialStats.lost },
  ].filter(d => d.value > 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white">Billing Portal</h1>
        <p className="text-sm text-spine-muted mt-1">Professional pillar — coding audit, compliance, denial management</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-spine-border pb-2">
        {[
          { id: 'audit-queue', label: 'Audit Queue' },
          { id: 'batch', label: 'Batch Processing' },
          { id: 'compliance', label: 'Compliance Engine' },
          { id: 'denials', label: 'Denial Management' },
          { id: 'payer-contracts', label: 'Payer Contracts' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs rounded-t-lg transition-all ${
              activeTab === tab.id ? 'bg-spine-accent/10 text-spine-accent border-b-2 border-spine-accent' : 'text-spine-muted hover:text-spine-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Audit Queue */}
      {activeTab === 'audit-queue' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Pending Cases ({pendingCases.length}) | Finalized ({finalizedCases.length})
            </h3>
          </div>

          {pendingCases.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <p className="text-sm text-spine-green">All cases finalized. Queue is clear.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCases.map(c => (
                <div key={c.id} className="glass-card rounded-xl p-4 hover:border-spine-accent/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-spine-accent">{c.id}</span>
                        <span className="text-xs text-spine-muted">{c.date}</span>
                        <span className="text-xs text-spine-muted">| {c.surgeon}</span>
                      </div>
                      <p className="text-xs text-spine-text mt-1">{c.procedure || c.diagnosis}</p>
                      <div className="flex gap-1 mt-2">
                        {c.cptCodes?.map((cc, i) => (
                          <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${cc.primary ? 'bg-spine-accent/10 text-spine-accent border border-spine-accent/20' : 'bg-spine-card text-spine-muted'}`}>
                            {cc.code}{cc.modifier ? `-${cc.modifier}` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-mono font-bold text-spine-gold">{c.totalWRVU?.toFixed(2)}</p>
                        <p className="text-[10px] text-spine-muted">{c.payer}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleApprove(c)}
                          disabled={reviewLoading === c.id}
                          className="px-3 py-1.5 text-[10px] bg-spine-green/20 text-spine-green rounded-lg hover:bg-spine-green/30 disabled:opacity-40"
                        >
                          {reviewLoading === c.id ? 'Saving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => setActiveModule('ai-code-engine')}
                          className="px-3 py-1.5 text-[10px] bg-spine-gold/20 text-spine-gold rounded-lg hover:bg-spine-gold/30"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { setRejectModal(c); setRejectReason('') }}
                          className="px-3 py-1.5 text-[10px] bg-spine-red/20 text-spine-red rounded-lg hover:bg-spine-red/30"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Finalized Cases Summary */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Recently Finalized ({finalizedCases.length})</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {finalizedCases.slice(-10).reverse().map(c => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-spine-bg/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-spine-green">{c.id}</span>
                    <span className="text-xs text-spine-text truncate max-w-[300px]">{c.procedure || c.diagnosis}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-spine-muted">{c.payer}</span>
                    <span className="text-xs font-mono text-spine-gold">{c.totalWRVU?.toFixed(2)} wRVU</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Batch Processing */}
      {activeTab === 'batch' && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card rounded-xl p-8 text-center border-2 border-dashed border-spine-border hover:border-spine-accent/50 transition-all cursor-pointer">
            <svg className="w-12 h-12 mx-auto mb-3 text-spine-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p className="text-sm text-spine-text mb-1">Upload Batch Operative Reports</p>
            <p className="text-xs text-spine-muted">Drop up to 50 operative reports for bulk AI coding analysis</p>
          </div>

          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Batch Processing Pipeline</h3>
            <div className="space-y-3">
              {['Upload Reports', 'AI Code Extraction', 'NCCI Edit Check', 'Modifier Validation', 'Payer Rule Check', 'Ready for Review'].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${i === 0 ? 'bg-spine-accent/20 text-spine-accent' : 'bg-spine-card text-spine-muted'}`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs ${i === 0 ? 'text-spine-accent' : 'text-spine-muted'}`}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Compliance Engine */}
      {activeTab === 'compliance' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* NCCI Edit Checker */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">NCCI Edit Checker</h3>
              <p className="text-xs text-spine-muted mb-3">Enter two CPT codes to check for NCCI edit conflicts</p>
              <div className="flex gap-2">
                <input className="flex-1 bg-spine-bg border border-spine-border rounded-lg px-3 py-2 text-xs text-spine-text focus:outline-none focus:border-spine-accent" placeholder="Code 1 (e.g., 22612)" />
                <input className="flex-1 bg-spine-bg border border-spine-border rounded-lg px-3 py-2 text-xs text-spine-text focus:outline-none focus:border-spine-accent" placeholder="Code 2 (e.g., 22630)" />
                <button className="px-4 py-2 accent-gradient text-white text-xs rounded-lg hover:opacity-90">Check</button>
              </div>
              <div className="mt-3 p-3 rounded-lg bg-spine-bg/50">
                <p className="text-xs text-spine-muted">Sample NCCI edit pairs in database:</p>
                <div className="mt-2 space-y-1">
                  {cptCodes.filter(c => c.ncciEdits.length > 0).slice(0, 5).map(c => (
                    <p key={c.code} className="text-[10px] text-spine-text">
                      <span className="font-mono text-spine-accent">{c.code}</span> edits with: {c.ncciEdits.map(e => <span key={e} className="font-mono text-spine-gold ml-1">{e}</span>)}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Modifier Logic Validator */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Modifier Logic Validator</h3>
              <div className="space-y-3">
                {Object.entries(modifierRules).map(([mod, rule]) => (
                  <div key={mod} className="p-3 rounded-lg bg-spine-bg/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-purple-400">{mod}</span>
                      <span className="text-xs text-spine-text">{rule.description}</span>
                    </div>
                    <p className="text-[10px] text-spine-muted mt-1">{rule.rule}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LCD Criteria Checker */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">LCD Criteria Checker</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {payerProfiles.map(p => (
                <div key={p.id} className="p-3 rounded-lg bg-spine-bg/50">
                  <h4 className="text-xs font-semibold text-spine-accent">{p.name}</h4>
                  <div className="mt-2 space-y-1">
                    {p.spineSpecificPolicies.map((pol, i) => (
                      <p key={i} className="text-[10px] text-spine-text">{pol}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Denial Management */}
      {activeTab === 'denials' && (
        <div className="space-y-4 animate-fade-in">
          {/* Denial Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-[10px] text-spine-muted uppercase">Total Denials</p>
              <p className="text-xl font-bold text-spine-red font-mono">{denialStats.total}</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-[10px] text-spine-muted uppercase">Appeals Won</p>
              <p className="text-xl font-bold text-spine-green font-mono">{denialStats.won}</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-[10px] text-spine-muted uppercase">Pending</p>
              <p className="text-xl font-bold text-spine-gold font-mono">{denialStats.pending}</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-[10px] text-spine-muted uppercase">Total Denied</p>
              <p className="text-xl font-bold text-spine-red font-mono">${denialStats.totalAmount.toFixed(0)}</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-[10px] text-spine-muted uppercase">Recovered</p>
              <p className="text-xl font-bold text-spine-green font-mono">${denialStats.recoveredAmount.toFixed(0)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Denials by Payer */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Denials by Payer</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={denialByPayerData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
                  <XAxis dataKey="name" tick={{ fill: '#8892b0', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#8892b0', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#0d1528', border: '1px solid #1a2540', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} name="Amount ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Appeal Outcomes */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Appeal Outcomes</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={denialStatusData} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    <Cell fill="#10b981" />
                    <Cell fill="#f0b429" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0d1528', border: '1px solid #1a2540', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Denial Details */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">All Denials</h3>
            <div className="space-y-3">
              {denialScenarios.map(d => (
                <div key={d.id} className="p-4 rounded-lg bg-spine-bg/50 border border-spine-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-spine-accent">{d.id}</span>
                      <span className="text-xs font-mono text-spine-gold">CPT {d.cptCode}</span>
                      <span className="text-xs text-spine-muted">{d.payer}</span>
                      <span className="text-xs text-spine-muted">{d.denialDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-spine-red">${d.amountDenied.toFixed(2)}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        d.appealOutcome === 'won' ? 'bg-spine-green/20 text-spine-green' :
                        d.status === 'pending' ? 'bg-spine-gold/20 text-spine-gold' :
                        d.appealOutcome === 'pending' ? 'bg-spine-accent/20 text-spine-accent' :
                        'bg-spine-red/20 text-spine-red'
                      }`}>
                        {d.appealOutcome === 'won' ? 'WON' : d.appealOutcome === 'pending' ? 'APPEAL PENDING' : d.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-spine-text">{d.denialReason}</p>
                  {d.appealLanguage && (
                    <details className="mt-2">
                      <summary className="text-[10px] text-spine-accent cursor-pointer hover:underline">View Appeal Language</summary>
                      <p className="text-[10px] text-spine-muted mt-1 leading-relaxed whitespace-pre-wrap">{d.appealLanguage}</p>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payer Contracts */}
      {activeTab === 'payer-contracts' && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Payer Contract Profiles</h3>
            <p className="text-xs text-spine-muted mb-4">Upload and manage payer contracts for automated fee schedule comparison</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {payerProfiles.map(p => (
                <div key={p.id} className="p-4 rounded-lg bg-spine-bg/50 border border-spine-border/30">
                  <h4 className="text-sm font-semibold text-white">{p.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-spine-accent/10 text-spine-accent">{p.type}</span>

                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-spine-muted">Fee Schedule</span>
                      <span className="text-xs font-mono text-spine-gold">{p.feeSchedulePctOfMedicare}% Medicare</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-spine-muted">Denial Rate</span>
                      <span className="text-xs font-mono text-spine-red">{p.denialRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-spine-muted">Days to Payment</span>
                      <span className="text-xs font-mono text-white">{p.avgDaysToPayment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-spine-muted">2026 CF</span>
                      <span className="text-xs font-mono text-spine-accent">${p.reimbursementTrend.find(t => t.year === 2026)?.conversionFactor}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-[10px] text-spine-muted mb-1">Common Denial Reasons:</p>
                    {p.commonDenialReasons.map((r, i) => (
                      <p key={i} className="text-[10px] text-spine-text">- {r}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-5 text-center border-2 border-dashed border-spine-border">
            <p className="text-sm text-spine-muted">Upload a payer contract (PDF) to extract fee schedules and coverage terms</p>
            <button className="mt-3 px-4 py-2 glass-card text-spine-accent text-xs rounded-lg hover:bg-spine-accent/10">
              Upload Contract
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setRejectModal(null)}>
          <div className="glass-card rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold text-white mb-2">Reject Case: {rejectModal.id}</h3>
            <p className="text-xs text-spine-muted mb-4">{rejectModal.procedure || rejectModal.diagnosis}</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection (required)..."
              className="w-full h-24 bg-spine-bg border border-spine-border rounded-lg p-3 text-sm text-spine-text placeholder-spine-muted/40 focus:outline-none focus:border-spine-accent resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejectModal(null)} className="flex-1 py-2 text-sm text-spine-muted border border-spine-border rounded-lg hover:bg-spine-card">
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectModal)}
                disabled={!rejectReason.trim() || reviewLoading}
                className="flex-1 py-2 text-sm text-white bg-spine-red/80 rounded-lg hover:bg-spine-red disabled:opacity-40"
              >
                {reviewLoading ? 'Rejecting...' : 'Reject Case'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
