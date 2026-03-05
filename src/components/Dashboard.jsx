import React, { useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { cptCodes, payerProfiles, mgmaBenchmarks, monthlyProductivity, denialScenarios, historicalProductivity } from '../data/seedData'

const COLORS = ['#00c2ff', '#f0b429', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']

function StatCard({ label, value, prefix = '', suffix = '', trend, trendUp, onClick }) {
  return (
    <button onClick={onClick} className="glass-card rounded-xl p-5 text-left hover:border-spine-accent/30 transition-all w-full">
      <p className="text-xs text-spine-muted uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-bold text-white font-mono">
        {prefix}{typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value}{suffix}
      </p>
      {trend && (
        <p className={`text-xs mt-2 ${trendUp ? 'text-spine-green' : 'text-spine-red'}`}>
          {trendUp ? '+' : ''}{trend}
        </p>
      )}
    </button>
  )
}

export default function Dashboard({ cases, setActiveModule }) {
  const stats = useMemo(() => {
    const totalCases = cases.length
    const totalWRVU = cases.reduce((sum, c) => sum + (c.totalWRVU || 0), 0)
    const avgWRVU = totalCases > 0 ? totalWRVU / totalCases : 0
    const pendingCases = cases.filter(c => c.status === 'pending_review').length
    const denialCount = denialScenarios.length
    const appealWinRate = denialScenarios.filter(d => d.appealOutcome === 'won').length / denialScenarios.filter(d => d.appealOutcome).length * 100
    const hospitalCases = cases.filter(c => c.facility === 'hospital').length
    const ascCases = cases.filter(c => c.facility === 'ASC').length
    const avgORTime = cases.reduce((sum, c) => sum + (c.orTime || 0), 0) / (totalCases || 1)

    // Annualized projection
    const monthsOfData = 2 // Jan-Feb 2026
    const annualizedWRVU = (totalWRVU / monthsOfData) * 12
    const mgma75 = mgmaBenchmarks.spine_surgery.percentiles[75].annualWRVU

    return { totalCases, totalWRVU, avgWRVU, pendingCases, denialCount, appealWinRate, hospitalCases, ascCases, avgORTime, annualizedWRVU, mgma75 }
  }, [cases])

  const payerMix = useMemo(() => {
    const counts = {}
    cases.forEach(c => { counts[c.payer] = (counts[c.payer] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [cases])

  const caseTypeMix = useMemo(() => {
    const types = { fusion: 0, decompression: 0, deformity: 0, arthroplasty: 0, corpectomy: 0, other: 0 }
    cases.forEach(c => {
      const primary = c.cptCodes.find(cc => cc.primary)
      if (primary) {
        const cpt = cptCodes.find(cp => cp.code === primary.code)
        if (cpt) {
          if (['fusion', 'decompression', 'deformity', 'arthroplasty', 'corpectomy'].includes(cpt.category)) types[cpt.category]++
          else types.other++
        }
      }
    })
    return Object.entries(types).filter(([,v]) => v > 0).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
  }, [cases])

  const rvuTrend = monthlyProductivity.filter(m => m.wRVU > 0).map(m => ({ name: m.month.split(' ')[0], wRVU: m.wRVU, cases: m.cases }))

  const pacingData = useMemo(() => {
    const target = 8500
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    let cumActual = 0
    return months.map((m, i) => {
      const actual = monthlyProductivity[i]
      if (actual && actual.wRVU > 0) cumActual += actual.wRVU
      return {
        name: m,
        target: (target / 12) * (i + 1),
        actual: actual && actual.wRVU > 0 ? cumActual : null,
      }
    })
  }, [])

  const historicalData = historicalProductivity.map(h => ({
    name: h.year.toString(),
    wRVU: h.totalWRVU,
    cases: h.totalCases,
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Command Center</h1>
          <p className="text-sm text-spine-muted mt-1">SpineOS Intelligence Dashboard - Dr. Sarah Chen</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card rounded-lg px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-spine-green rounded-full animate-pulse"/>
            <span className="text-xs text-spine-muted">System Active</span>
          </div>
          <div className="glass-card rounded-lg px-4 py-2">
            <span className="text-xs text-spine-muted">YTD 2026</span>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard label="Total Cases" value={stats.totalCases} trend="+8.2% vs last year" trendUp />
        <StatCard label="Total wRVU" value={stats.totalWRVU} trend="+6.5% vs last year" trendUp suffix="" />
        <StatCard label="Avg wRVU/Case" value={stats.avgWRVU} suffix="" />
        <StatCard label="Annualized wRVU" value={stats.annualizedWRVU} trend={`${((stats.annualizedWRVU / stats.mgma75) * 100).toFixed(0)}% of MGMA 75th`} trendUp={stats.annualizedWRVU >= stats.mgma75} />
        <StatCard label="Pending Review" value={stats.pendingCases} onClick={() => setActiveModule('billing-portal')} />
        <StatCard label="Appeal Win Rate" value={stats.appealWinRate} suffix="%" trendUp />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* wRVU Pacing */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Annual wRVU Pacing vs Target (8,500)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={pacingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
              <XAxis dataKey="name" tick={{ fill: '#8892b0', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8892b0', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0d1528', border: '1px solid #1a2540', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="target" stroke="#1a2540" fill="#1a2540" fillOpacity={0.3} strokeDasharray="5 5" name="Target" />
              <Area type="monotone" dataKey="actual" stroke="#00c2ff" fill="#00c2ff" fillOpacity={0.15} name="Actual" strokeWidth={2} connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payer Mix */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Payer Mix</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={payerMix} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {payerMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0d1528', border: '1px solid #1a2540', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Performance */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Monthly wRVU Production</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rvuTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
              <XAxis dataKey="name" tick={{ fill: '#8892b0', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8892b0', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0d1528', border: '1px solid #1a2540', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="wRVU" fill="#00c2ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Case Type Mix */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Case Type Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={caseTypeMix} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {caseTypeMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0d1528', border: '1px solid #1a2540', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Historical Trend */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Historical wRVU Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
              <XAxis dataKey="name" tick={{ fill: '#8892b0', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8892b0', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0d1528', border: '1px solid #1a2540', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="wRVU" stroke="#f0b429" strokeWidth={2} dot={{ fill: '#f0b429' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions & Denials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'New Case Entry', module: 'ai-code-engine', color: 'bg-spine-accent/20 text-spine-accent border-spine-accent/30' },
              { label: 'Upload Documents', module: 'document-ai', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
              { label: 'View Productivity', module: 'productivity', color: 'bg-spine-gold/20 text-spine-gold border-spine-gold/30' },
              { label: 'Compliance Check', module: 'compliance', color: 'bg-spine-green/20 text-spine-green border-spine-green/30' },
              { label: 'Payer Intelligence', module: 'rvu-payer', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
              { label: 'Denial Management', module: 'billing-portal', color: 'bg-spine-red/20 text-spine-red border-spine-red/30' },
            ].map(action => (
              <button
                key={action.label}
                onClick={() => setActiveModule(action.module)}
                className={`border rounded-lg px-4 py-3 text-xs font-medium text-left hover:scale-[1.02] transition-all ${action.color}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Denials */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Denials</h3>
          <div className="space-y-3">
            {denialScenarios.slice(0, 4).map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-spine-bg/50 border border-spine-border/50">
                <div>
                  <p className="text-xs font-medium text-white">CPT {d.cptCode} - {d.payer}</p>
                  <p className="text-[10px] text-spine-muted mt-0.5 line-clamp-1">{d.denialReason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-spine-gold">${d.amountDenied.toFixed(0)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    d.appealOutcome === 'won' ? 'bg-spine-green/20 text-spine-green' :
                    d.status === 'pending' ? 'bg-spine-gold/20 text-spine-gold' :
                    'bg-spine-accent/20 text-spine-accent'
                  }`}>
                    {d.appealOutcome === 'won' ? 'WON' : d.status === 'pending' ? 'PENDING' : 'APPEALED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MGMA Benchmark Comparison */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">MGMA Benchmark Comparison (Annualized Projection)</h3>
        <div className="flex items-center gap-6">
          {Object.entries(mgmaBenchmarks.spine_surgery.percentiles).map(([pct, data]) => {
            const projected = stats.annualizedWRVU
            const isAbove = projected >= data.annualWRVU
            return (
              <div key={pct} className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-spine-muted">{pct}th Percentile</span>
                  <span className="text-xs font-mono text-white">{data.annualWRVU.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-spine-bg rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isAbove ? 'bg-spine-green' : 'bg-spine-accent'}`} style={{ width: `${Math.min(100, (projected / data.annualWRVU) * 100)}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
