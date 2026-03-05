import React, { useState, useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { cptCodes, payerProfiles, mgmaBenchmarks } from '../data/seedData'

const COLORS = ['#00c2ff', '#f0b429', '#10b981', '#ef4444', '#8b5cf6']

export default function RVUPayerEngine({ cases }) {
  const [selectedCPT, setSelectedCPT] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [swapCodes, setSwapCodes] = useState(['22633', ''])
  const [selectedPayer, setSelectedPayer] = useState('medicare')

  const filteredCPT = useMemo(() => {
    if (!searchTerm) return cptCodes.slice(0, 20)
    const term = searchTerm.toLowerCase()
    return cptCodes.filter(c => c.code.includes(term) || c.description.toLowerCase().includes(term))
  }, [searchTerm])

  const conversionFactorTrend = useMemo(() => {
    return payerProfiles.map(p => ({
      name: p.name.length > 10 ? p.name.substring(0, 10) : p.name,
      ...Object.fromEntries(p.reimbursementTrend.map(t => [t.year, t.conversionFactor]))
    }))
  }, [])

  const cfTrendData = useMemo(() => {
    const years = [2022, 2023, 2024, 2025, 2026]
    return years.map(year => {
      const obj = { year: year.toString() }
      payerProfiles.forEach(p => {
        const entry = p.reimbursementTrend.find(t => t.year === year)
        if (entry) obj[p.name] = entry.conversionFactor
      })
      return obj
    })
  }, [])

  const swapResult = useMemo(() => {
    const [code1, code2] = swapCodes
    const cpt1 = cptCodes.find(c => c.code === code1)
    const cpt2 = cptCodes.find(c => c.code === code2)
    if (!cpt1 || !cpt2) return null
    const payer = payerProfiles.find(p => p.id === selectedPayer)
    const cf = payer?.reimbursementTrend?.find(t => t.year === 2026)?.conversionFactor || 32.35
    return {
      code1: { ...cpt1, payment: cpt1.wRVU * cf },
      code2: { ...cpt2, payment: cpt2.wRVU * cf },
      delta: (cpt2.wRVU - cpt1.wRVU) * cf,
      deltaWRVU: cpt2.wRVU - cpt1.wRVU,
    }
  }, [swapCodes, selectedPayer])

  const payerComparison = useMemo(() => {
    if (!selectedCPT) return []
    const cpt = cptCodes.find(c => c.code === selectedCPT)
    if (!cpt) return []
    return payerProfiles.map(p => {
      const cf = p.reimbursementTrend.find(t => t.year === 2026)?.conversionFactor || 32.35
      return {
        name: p.name,
        payment: Math.round(cpt.wRVU * cf * 100) / 100,
        denialRate: p.denialRate,
        daysToPayment: p.avgDaysToPayment,
        requiresAuth: p.priorAuthRequired.includes(cpt.code),
      }
    })
  }, [selectedCPT])

  const caseProfit = useMemo(() => {
    return cases.slice(0, 10).map(c => {
      const payer = payerProfiles.find(p => p.name === c.payer)
      const cf = payer?.reimbursementTrend?.find(t => t.year === 2026)?.conversionFactor || 32.35
      const expectedPayment = c.totalWRVU * cf
      return {
        id: c.id,
        procedure: c.procedure?.substring(0, 40) + '...',
        payer: c.payer,
        wRVU: c.totalWRVU,
        expected: expectedPayment,
      }
    })
  }, [cases])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white">RVU / Payer Intelligence Engine</h1>
        <p className="text-sm text-spine-muted mt-1">Live wRVU calculations, payer analytics, and code optimization</p>
      </div>

      {/* CPT Lookup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">CPT Code Database</h3>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by CPT code or description..."
              className="w-full bg-spine-bg border border-spine-border rounded-lg px-4 py-2.5 text-sm text-spine-text placeholder-spine-muted/40 focus:outline-none focus:border-spine-accent mb-3"
            />
            <div className="max-h-80 overflow-y-auto space-y-1">
              {filteredCPT.map(cpt => (
                <button
                  key={cpt.code}
                  onClick={() => setSelectedCPT(cpt.code)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${
                    selectedCPT === cpt.code ? 'bg-spine-accent/10 border border-spine-accent/30' : 'hover:bg-spine-card bg-spine-bg/30'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-spine-accent">{cpt.code}</span>
                      {cpt.addOn && <span className="text-[9px] px-1 py-0 rounded bg-spine-gold/20 text-spine-gold">ADD-ON</span>}
                      <span className="text-[10px] px-1.5 py-0 rounded bg-spine-accent/10 text-spine-accent">{cpt.category}</span>
                    </div>
                    <p className="text-xs text-spine-text mt-0.5 truncate">{cpt.description}</p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-sm font-mono font-bold text-spine-gold">{cpt.wRVU}</p>
                    <p className="text-[10px] text-spine-muted">wRVU</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payer Comparison for Selected Code */}
        <div className="space-y-4">
          {selectedCPT ? (
            <div className="glass-card rounded-xl p-5 animate-fade-in">
              <h3 className="text-sm font-semibold text-white mb-3">
                Payer Comparison: CPT {selectedCPT}
              </h3>
              <div className="space-y-2">
                {payerComparison.map((p, i) => (
                  <div key={i} className="p-3 rounded-lg bg-spine-bg/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">{p.name}</span>
                      <span className="text-sm font-mono font-bold text-spine-gold">${p.payment.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-spine-muted">Denial: <span className="text-spine-red">{p.denialRate}%</span></span>
                      <span className="text-[10px] text-spine-muted">Days: {p.daysToPayment}</span>
                      {p.requiresAuth && <span className="text-[10px] px-1.5 py-0 rounded bg-spine-red/10 text-spine-red">PA REQ</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-xl p-5 text-center">
              <p className="text-xs text-spine-muted">Select a CPT code to see payer comparison</p>
            </div>
          )}

          {/* Quick RVU Calculator */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Quick Payment Calculator</h3>
            <div className="space-y-2">
              <select
                value={selectedPayer}
                onChange={e => setSelectedPayer(e.target.value)}
                className="w-full bg-spine-bg border border-spine-border rounded-lg px-3 py-2 text-xs text-spine-text focus:outline-none focus:border-spine-accent"
              >
                {payerProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {selectedCPT && (
                <div className="p-3 rounded-lg bg-spine-bg/50">
                  <p className="text-xs text-spine-muted">Expected Payment</p>
                  <p className="text-xl font-bold text-spine-gold font-mono">
                    ${(payerComparison.find(p => p.name === payerProfiles.find(pp => pp.id === selectedPayer)?.name)?.payment || 0).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Factor Trends */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Conversion Factor Trends by Payer (2022-2026)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={cfTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
            <XAxis dataKey="year" tick={{ fill: '#8892b0', fontSize: 11 }} />
            <YAxis tick={{ fill: '#8892b0', fontSize: 11 }} domain={['dataMin - 2', 'dataMax + 2']} />
            <Tooltip contentStyle={{ background: '#0d1528', border: '1px solid #1a2540', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {payerProfiles.map((p, i) => (
              <Line key={p.id} type="monotone" dataKey={p.name} stroke={COLORS[i]} strokeWidth={2} dot={{ fill: COLORS[i], r: 3 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Code Swap Simulator */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Code Swap Simulator</h3>
        <p className="text-xs text-spine-muted mb-3">Compare the financial impact of alternative coding combinations</p>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <label className="text-[10px] text-spine-muted uppercase">Current Code</label>
            <select
              value={swapCodes[0]}
              onChange={e => setSwapCodes([e.target.value, swapCodes[1]])}
              className="w-full mt-1 bg-spine-bg border border-spine-border rounded-lg px-3 py-2 text-xs text-spine-text focus:outline-none focus:border-spine-accent"
            >
              {cptCodes.map(c => <option key={c.code} value={c.code}>{c.code} - {c.description.substring(0, 50)}</option>)}
            </select>
          </div>
          <div className="pt-4">
            <svg className="w-6 h-6 text-spine-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-spine-muted uppercase">Alternative Code</label>
            <select
              value={swapCodes[1]}
              onChange={e => setSwapCodes([swapCodes[0], e.target.value])}
              className="w-full mt-1 bg-spine-bg border border-spine-border rounded-lg px-3 py-2 text-xs text-spine-text focus:outline-none focus:border-spine-accent"
            >
              <option value="">Select alternative...</option>
              {cptCodes.map(c => <option key={c.code} value={c.code}>{c.code} - {c.description.substring(0, 50)}</option>)}
            </select>
          </div>
        </div>

        {swapResult && (
          <div className="grid grid-cols-3 gap-4 animate-fade-in">
            <div className="p-4 rounded-lg bg-spine-bg/50 text-center">
              <p className="text-[10px] text-spine-muted uppercase">Current: {swapResult.code1.code}</p>
              <p className="text-xs text-spine-text mt-1 truncate">{swapResult.code1.description}</p>
              <p className="text-lg font-bold text-spine-accent font-mono mt-2">{swapResult.code1.wRVU} wRVU</p>
              <p className="text-sm text-spine-gold font-mono">${swapResult.code1.payment.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded-lg bg-spine-bg/50 text-center flex flex-col items-center justify-center">
              <p className="text-[10px] text-spine-muted uppercase">Delta</p>
              <p className={`text-xl font-bold font-mono mt-2 ${swapResult.delta >= 0 ? 'text-spine-green' : 'text-spine-red'}`}>
                {swapResult.delta >= 0 ? '+' : ''}{swapResult.deltaWRVU.toFixed(2)} wRVU
              </p>
              <p className={`text-sm font-mono ${swapResult.delta >= 0 ? 'text-spine-green' : 'text-spine-red'}`}>
                {swapResult.delta >= 0 ? '+' : ''}${swapResult.delta.toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-spine-bg/50 text-center">
              <p className="text-[10px] text-spine-muted uppercase">Alternative: {swapResult.code2.code}</p>
              <p className="text-xs text-spine-text mt-1 truncate">{swapResult.code2.description}</p>
              <p className="text-lg font-bold text-spine-accent font-mono mt-2">{swapResult.code2.wRVU} wRVU</p>
              <p className="text-sm text-spine-gold font-mono">${swapResult.code2.payment.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Case-Level Profitability */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Case-Level Expected Reimbursement</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-spine-border">
                <th className="text-left py-2 text-spine-muted font-medium">Case</th>
                <th className="text-left py-2 text-spine-muted font-medium">Procedure</th>
                <th className="text-left py-2 text-spine-muted font-medium">Payer</th>
                <th className="text-right py-2 text-spine-muted font-medium">wRVU</th>
                <th className="text-right py-2 text-spine-muted font-medium">Expected Payment</th>
              </tr>
            </thead>
            <tbody>
              {caseProfit.map(c => (
                <tr key={c.id} className="border-b border-spine-border/30 hover:bg-spine-card/50">
                  <td className="py-2 font-mono text-spine-accent">{c.id}</td>
                  <td className="py-2 text-spine-text">{c.procedure}</td>
                  <td className="py-2 text-spine-text">{c.payer}</td>
                  <td className="py-2 text-right font-mono text-white">{c.wRVU.toFixed(2)}</td>
                  <td className="py-2 text-right font-mono text-spine-gold">${c.expected.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
