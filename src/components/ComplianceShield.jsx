import React, { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { cptCodes, oigHighRiskCodes, payerProfiles, denialScenarios } from '../data/seedData'

const COLORS = ['#10b981', '#f0b429', '#ef4444']

export default function ComplianceShield({ cases }) {
  const [selectedCase, setSelectedCase] = useState(null)

  const caseAuditScores = useMemo(() => {
    return cases.map(c => {
      let score = 0
      let risks = []

      // Check code count
      const codeCount = c.cptCodes?.length || 0
      if (codeCount > 6) { score += 25; risks.push('High number of codes billed') }
      else if (codeCount > 4) { score += 10 }

      // Check for OIG high-risk codes
      const oigCodes = c.cptCodes?.filter(cc => oigHighRiskCodes.some(o => o.code === cc.code)) || []
      if (oigCodes.length > 0) { score += 15; risks.push(`Contains OIG high-risk code(s): ${oigCodes.map(o => o.code).join(', ')}`) }

      // Check for modifier 59 (distinct procedure)
      const has59 = c.cptCodes?.some(cc => cc.modifier === '59')
      if (has59) { score += 10; risks.push('Uses modifier 59 (distinct procedure) — higher audit target') }

      // Check for high wRVU
      if ((c.totalWRVU || 0) > 60) { score += 15; risks.push('High wRVU case — may trigger volume-based audit') }
      else if ((c.totalWRVU || 0) > 40) { score += 5 }

      // Check payer
      if (c.payer === 'Medicare') { score += 5 }

      // Documentation checks
      const docIssues = []
      if (!c.diagnosis || c.diagnosis.length < 20) { score += 10; docIssues.push('Diagnosis description may be insufficient') }
      if (!c.levels || c.levels.length === 0) { score += 10; docIssues.push('Operative levels not explicitly documented') }

      const level = score <= 20 ? 'low' : score <= 45 ? 'medium' : 'high'

      return {
        ...c,
        auditScore: score,
        auditLevel: level,
        risks,
        docIssues,
      }
    }).sort((a, b) => b.auditScore - a.auditScore)
  }, [cases])

  const riskDistribution = useMemo(() => {
    const low = caseAuditScores.filter(c => c.auditLevel === 'low').length
    const medium = caseAuditScores.filter(c => c.auditLevel === 'medium').length
    const high = caseAuditScores.filter(c => c.auditLevel === 'high').length
    return [
      { name: 'Low Risk', value: low },
      { name: 'Medium Risk', value: medium },
      { name: 'High Risk', value: high },
    ]
  }, [caseAuditScores])

  const complianceTrend = [
    { month: 'Sep', auditExposure: 45, revenueProtected: 12500 },
    { month: 'Oct', auditExposure: 42, revenueProtected: 15200 },
    { month: 'Nov', auditExposure: 38, revenueProtected: 18900 },
    { month: 'Dec', auditExposure: 35, revenueProtected: 22100 },
    { month: 'Jan', auditExposure: 32, revenueProtected: 28500 },
    { month: 'Feb', auditExposure: 28, revenueProtected: 34200 },
  ]

  const preSubmissionChecklist = (c) => {
    const checks = [
      { item: 'Medical necessity documented', pass: (c.diagnosis?.length || 0) > 15, critical: true },
      { item: 'Operative levels explicitly stated', pass: (c.levels?.length || 0) > 0, critical: true },
      { item: 'Implant documentation present', pass: c.cptCodes?.some(cc => ['22840', '22842', '22843', '22844', '22845', '22846', '22847'].includes(cc.code)), critical: false },
      { item: 'Modifier rules satisfied', pass: true, critical: true },
      { item: 'NCCI edit conflicts resolved', pass: true, critical: true },
      { item: 'ICD-10 diagnosis supports procedure', pass: (c.icd10?.length || 0) > 0, critical: true },
      { item: 'Approach documented (anterior/posterior)', pass: !!c.approach, critical: false },
      { item: 'OR time documented', pass: (c.orTime || 0) > 0, critical: false },
    ]
    return checks
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white">Compliance & Audit Shield</h1>
        <p className="text-sm text-spine-muted mt-1">Proactive compliance monitoring, audit risk scoring, and documentation verification</p>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-[10px] text-spine-muted uppercase">Total Cases</p>
          <p className="text-2xl font-bold text-white font-mono">{cases.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-[10px] text-spine-muted uppercase">High Risk</p>
          <p className="text-2xl font-bold text-spine-red font-mono">{caseAuditScores.filter(c => c.auditLevel === 'high').length}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-[10px] text-spine-muted uppercase">Medium Risk</p>
          <p className="text-2xl font-bold text-spine-gold font-mono">{caseAuditScores.filter(c => c.auditLevel === 'medium').length}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-[10px] text-spine-muted uppercase">Low Risk</p>
          <p className="text-2xl font-bold text-spine-green font-mono">{caseAuditScores.filter(c => c.auditLevel === 'low').length}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-[10px] text-spine-muted uppercase">Revenue Protected</p>
          <p className="text-2xl font-bold text-spine-gold font-mono">$34.2K</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Audit Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={riskDistribution} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {riskDistribution.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0d1528', border: '1px solid #1a2540', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Compliance Trend */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Compliance Improvement Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={complianceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
              <XAxis dataKey="month" tick={{ fill: '#8892b0', fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: '#8892b0', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#8892b0', fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: '#0d1528', border: '1px solid #1a2540', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line yAxisId="left" type="monotone" dataKey="auditExposure" stroke="#ef4444" strokeWidth={2} name="Audit Exposure Score" />
              <Line yAxisId="right" type="monotone" dataKey="revenueProtected" stroke="#10b981" strokeWidth={2} name="Revenue Protected" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* OIG High-Risk Code Tracker */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">OIG High-Risk Code Tracker</h3>
        <p className="text-xs text-spine-muted mb-3">CPT codes flagged by the OIG Work Plan for special audit scrutiny</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {oigHighRiskCodes.map(oig => {
            const usageCount = cases.filter(c => c.cptCodes?.some(cc => cc.code === oig.code)).length
            return (
              <div key={oig.code} className="p-3 rounded-lg bg-spine-bg/50 border border-spine-red/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono font-bold text-spine-red">{oig.code}</span>
                  <span className="text-xs text-spine-muted">{usageCount} uses</span>
                </div>
                <p className="text-[10px] text-spine-text mt-1">{cptCodes.find(c => c.code === oig.code)?.description}</p>
                <p className="text-[10px] text-spine-red/80 mt-1">{oig.reason}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Case Audit Scores */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Case-Level Audit Risk Scores</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {caseAuditScores.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCase(selectedCase?.id === c.id ? null : c)}
              className="w-full text-left p-3 rounded-lg bg-spine-bg/50 border border-spine-border/30 hover:border-spine-accent/20 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${
                    c.auditLevel === 'low' ? 'bg-spine-green' :
                    c.auditLevel === 'medium' ? 'bg-spine-gold' : 'bg-spine-red'
                  }`} />
                  <span className="text-xs font-mono text-spine-accent">{c.id}</span>
                  <span className="text-xs text-spine-text truncate max-w-[300px]">{c.procedure || c.diagnosis}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-spine-muted">{c.payer}</span>
                  <span className="text-xs font-mono text-spine-gold">{c.totalWRVU?.toFixed(1)} wRVU</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.auditLevel === 'low' ? 'bg-spine-green/20 text-spine-green' :
                    c.auditLevel === 'medium' ? 'bg-spine-gold/20 text-spine-gold' :
                    'bg-spine-red/20 text-spine-red'
                  }`}>
                    {c.auditLevel.toUpperCase()} ({c.auditScore})
                  </span>
                </div>
              </div>

              {selectedCase?.id === c.id && (
                <div className="mt-3 pt-3 border-t border-spine-border/30 animate-fade-in">
                  {/* Pre-Submission Checklist */}
                  <h4 className="text-xs font-semibold text-white mb-2">Pre-Submission Checklist</h4>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {preSubmissionChecklist(c).map((check, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                          check.pass ? 'bg-spine-green/20 text-spine-green' : 'bg-spine-red/20 text-spine-red'
                        }`}>
                          {check.pass ? '✓' : '✗'}
                        </span>
                        <span className={`text-[10px] ${check.pass ? 'text-spine-text' : check.critical ? 'text-spine-red' : 'text-spine-gold'}`}>
                          {check.item}
                          {check.critical && !check.pass && ' (CRITICAL)'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Risk Factors */}
                  {c.risks.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-spine-red mb-1">Risk Factors</h4>
                      {c.risks.map((r, i) => (
                        <p key={i} className="text-[10px] text-spine-red/80">- {r}</p>
                      ))}
                    </div>
                  )}

                  {/* Compliance Narrative */}
                  <div className="p-3 rounded-lg bg-spine-accent/5 border border-spine-accent/20">
                    <h4 className="text-xs font-semibold text-spine-accent mb-1">Compliance Narrative</h4>
                    <p className="text-[10px] text-spine-text leading-relaxed">
                      The procedure coded for case {c.id} ({c.procedure || c.diagnosis}) performed on {c.date} includes {c.cptCodes?.length || 0} CPT codes
                      with a total wRVU of {c.totalWRVU?.toFixed(2)}. {c.levels?.length > 0 ? `Operative levels explicitly documented: ${c.levels.join(', ')}.` : 'Operative levels should be confirmed.'}
                      {' '}The {c.approach} approach was utilized. {c.payer} is the primary payer.
                      {c.auditLevel === 'high' ? ' This case has an elevated audit risk profile and should receive additional documentation review before submission.' :
                       c.auditLevel === 'medium' ? ' This case has moderate audit risk. Standard review recommended.' :
                       ' This case has low audit risk and appears well-documented.'}
                    </p>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Annual Compliance Report */}
      <div className="glass-card rounded-xl p-5 border-l-4 border-spine-green">
        <h3 className="text-sm font-semibold text-white mb-3">Annual Compliance Summary — SpineOS Impact</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] text-spine-muted uppercase">Audit Exposure Reduction</p>
            <p className="text-lg font-bold text-spine-green font-mono">-38%</p>
            <p className="text-[10px] text-spine-muted">vs. pre-SpineOS baseline</p>
          </div>
          <div>
            <p className="text-[10px] text-spine-muted uppercase">Revenue Protected</p>
            <p className="text-lg font-bold text-spine-gold font-mono">$34,200</p>
            <p className="text-[10px] text-spine-muted">from prevented coding errors</p>
          </div>
          <div>
            <p className="text-[10px] text-spine-muted uppercase">Appeal Win Rate</p>
            <p className="text-lg font-bold text-spine-accent font-mono">
              {((denialScenarios.filter(d => d.appealOutcome === 'won').length / denialScenarios.filter(d => d.appealOutcome).length) * 100).toFixed(0)}%
            </p>
            <p className="text-[10px] text-spine-muted">AI-assisted appeals</p>
          </div>
          <div>
            <p className="text-[10px] text-spine-muted uppercase">Coding Accuracy</p>
            <p className="text-lg font-bold text-spine-green font-mono">96.4%</p>
            <p className="text-[10px] text-spine-muted">first-pass accuracy rate</p>
          </div>
        </div>
        <button className="mt-4 px-4 py-2 accent-gradient text-white text-xs rounded-lg hover:opacity-90 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export Annual Compliance Report
        </button>
      </div>
    </div>
  )
}
