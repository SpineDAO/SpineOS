import React, { useMemo, useState } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend, ComposedChart } from 'recharts'
import { cptCodes, mgmaBenchmarks, monthlyProductivity, historicalProductivity, payerProfiles } from '../data/seedData'

const COLORS = ['#00c2ff', '#f0b429', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']

export default function ProductivityHub({ cases }) {
  const [targetWRVU, setTargetWRVU] = useState(8500)
  const [conversionFactor, setConversionFactor] = useState(70)
  const [timeframe, setTimeframe] = useState('ytd')

  const stats = useMemo(() => {
    const totalCases = cases.length
    const totalWRVU = cases.reduce((sum, c) => sum + (c.totalWRVU || 0), 0)
    const avgWRVU = totalCases > 0 ? totalWRVU / totalCases : 0
    const hospitalCases = cases.filter(c => c.facility === 'hospital').length
    const ascCases = cases.filter(c => c.facility === 'ASC').length
    const totalORTime = cases.reduce((sum, c) => sum + (c.orTime || 0), 0)
    const avgORTime = totalCases > 0 ? totalORTime / totalCases : 0

    // Case mix
    const categories = {}
    cases.forEach(c => {
      const primary = c.cptCodes?.find(cc => cc.primary)
      if (primary) {
        const cpt = cptCodes.find(cp => cp.code === primary.code)
        const cat = cpt?.category || 'other'
        categories[cat] = (categories[cat] || 0) + 1
      }
    })

    // Payer breakdown
    const payers = {}
    cases.forEach(c => {
      if (!payers[c.payer]) payers[c.payer] = { cases: 0, wRVU: 0 }
      payers[c.payer].cases++
      payers[c.payer].wRVU += c.totalWRVU || 0
    })

    // Monthly data
    const months = {}
    cases.forEach(c => {
      const m = c.date?.substring(0, 7)
      if (m) {
        if (!months[m]) months[m] = { cases: 0, wRVU: 0 }
        months[m].cases++
        months[m].wRVU += c.totalWRVU || 0
      }
    })

    const annualized = totalCases > 0 ? (totalWRVU / 2) * 12 : 0 // 2 months of data
    const salary60 = annualized * 60
    const salary70 = annualized * 70
    const salary80 = annualized * 80

    return {
      totalCases, totalWRVU, avgWRVU, hospitalCases, ascCases, avgORTime,
      categories, payers, months, annualized,
      salary60, salary70, salary80,
    }
  }, [cases])

  const pacingData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    let cumActual = 0
    return months.map((m, i) => {
      const data = monthlyProductivity[i]
      if (data && data.wRVU > 0) cumActual += data.wRVU
      return {
        name: m,
        target: (targetWRVU / 12) * (i + 1),
        actual: data && data.wRVU > 0 ? cumActual : null,
        mgma75: (8200 / 12) * (i + 1),
        mgma90: (10500 / 12) * (i + 1),
      }
    })
  }, [targetWRVU])

  const caseMixData = Object.entries(stats.categories).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), value
  }))

  const payerData = Object.entries(stats.payers).map(([name, data]) => ({
    name, cases: data.cases, wRVU: Math.round(data.wRVU * 10) / 10
  }))

  const monthlyData = Object.entries(stats.months).map(([month, data]) => ({
    name: month.replace('2026-', ''),
    cases: data.cases,
    wRVU: Math.round(data.wRVU * 10) / 10,
    avgWRVU: Math.round((data.wRVU / data.cases) * 10) / 10,
  }))

  const facilityData = [
    { name: 'Hospital', value: stats.hospitalCases },
    { name: 'ASC', value: stats.ascCases },
  ]

  const compModelData = [
    { cf: '$55/wRVU', salary: stats.annualized * 55, fill: '#8892b0' },
    { cf: '$60/wRVU', salary: stats.annualized * 60, fill: '#00c2ff' },
    { cf: '$65/wRVU', salary: stats.annualized * 65, fill: '#00c2ff' },
    { cf: '$70/wRVU', salary: stats.annualized * 70, fill: '#f0b429' },
    { cf: '$75/wRVU', salary: stats.annualized * 75, fill: '#f0b429' },
    { cf: '$80/wRVU', salary: stats.annualized * 80, fill: '#10b981' },
    { cf: '$85/wRVU', salary: stats.annualized * 85, fill: '#10b981' },
    { cf: '$90/wRVU', salary: stats.annualized * 90, fill: '#8b5cf6' },
  ]

  const benchmarkPercentile = useMemo(() => {
    const percentiles = mgmaBenchmarks.spine_surgery.percentiles
    const ann = stats.annualized
    if (ann >= percentiles[90].annualWRVU) return '90th+'
    if (ann >= percentiles[75].annualWRVU) return '75th-90th'
    if (ann >= percentiles[50].annualWRVU) return '50th-75th'
    if (ann >= percentiles[25].annualWRVU) return '25th-50th'
    return '<25th'
  }, [stats.annualized])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Productivity Hub</h1>
          <p className="text-sm text-spine-muted mt-1">Surgeon performance tracking, benchmarking, and compensation modeling</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-xs text-spine-muted">Target wRVU:</span>
            <input
              type="number"
              value={targetWRVU}
              onChange={e => setTargetWRVU(Number(e.target.value))}
              className="w-20 bg-transparent text-sm text-spine-accent font-mono text-right focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'YTD Cases', value: stats.totalCases, color: 'text-white' },
          { label: 'YTD wRVU', value: stats.totalWRVU.toFixed(1), color: 'text-spine-gold' },
          { label: 'Avg wRVU/Case', value: stats.avgWRVU.toFixed(1), color: 'text-spine-accent' },
          { label: 'Annualized', value: stats.annualized.toFixed(0), color: 'text-spine-green' },
          { label: 'MGMA Pctile', value: benchmarkPercentile, color: 'text-spine-accent' },
          { label: 'Avg OR Time', value: `${stats.avgORTime.toFixed(0)}m`, color: 'text-white' },
          { label: 'Hospital', value: stats.hospitalCases, color: 'text-white' },
          { label: 'ASC', value: stats.ascCases, color: 'text-white' },
        ].map((s, i) => (
          <div key={i} className="glass-card rounded-xl p-3 text-center">
            <p className="text-[10px] text-spine-muted uppercase tracking-wider">{s.label}</p>
            <p className={`text-lg font-bold font-mono mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Goal Tracker Pacing */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Annual wRVU Goal Pacing — Target: {targetWRVU.toLocaleString()}</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={pacingData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
            <XAxis dataKey="name" tick={{ fill: '#8892b0', fontSize: 11 }} />
            <YAxis tick={{ fill: '#8892b0', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#0d1528', border: '1px solid #1a2540', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="mgma90" stroke="#8b5cf620" fill="#8b5cf6" fillOpacity={0.05} name="MGMA 90th" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="mgma75" stroke="#10b98120" fill="#10b981" fillOpacity={0.05} name="MGMA 75th" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="target" stroke="#f0b429" fill="#f0b429" fillOpacity={0.08} name="Your Target" strokeDasharray="5 5" strokeWidth={2} />
            <Area type="monotone" dataKey="actual" stroke="#00c2ff" fill="#00c2ff" fillOpacity={0.15} name="Actual" strokeWidth={3} connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Breakdown */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Monthly Production</h3>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
              <XAxis dataKey="name" tick={{ fill: '#8892b0', fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: '#8892b0', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#8892b0', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0d1528', border: '1px solid #1a2540', borderRadius: 8, fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="wRVU" fill="#00c2ff" radius={[4, 4, 0, 0]} name="wRVU" />
              <Line yAxisId="right" type="monotone" dataKey="cases" stroke="#f0b429" strokeWidth={2} name="Cases" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Case Mix Analyzer */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Case Mix Analysis</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={caseMixData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {caseMixData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0d1528', border: '1px solid #1a2540', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Compensation Modeling */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-2">Compensation Modeling (Annualized: {stats.annualized.toFixed(0)} wRVU)</h3>
        <p className="text-xs text-spine-muted mb-4">Projected annual compensation at various conversion factor rates</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={compModelData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
            <XAxis dataKey="cf" tick={{ fill: '#8892b0', fontSize: 10 }} />
            <YAxis tick={{ fill: '#8892b0', fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip contentStyle={{ background: '#0d1528', border: '1px solid #1a2540', borderRadius: 8, fontSize: 12 }} formatter={v => [`$${v.toLocaleString()}`, 'Salary']} />
            <Bar dataKey="salary" radius={[4, 4, 0, 0]}>
              {compModelData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'At $60/wRVU', value: stats.salary60 },
            { label: 'At $70/wRVU', value: stats.salary70 },
            { label: 'At $80/wRVU', value: stats.salary80 },
          ].map((s, i) => (
            <div key={i} className="p-3 rounded-lg bg-spine-bg/50 text-center">
              <p className="text-[10px] text-spine-muted">{s.label}</p>
              <p className="text-lg font-bold text-spine-gold font-mono">${(s.value / 1000).toFixed(0)}K</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Facility Split */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Facility vs ASC Split</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={facilityData} cx="50%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                <Cell fill="#00c2ff" />
                <Cell fill="#f0b429" />
              </Pie>
              <Tooltip contentStyle={{ background: '#0d1528', border: '1px solid #1a2540', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Payer wRVU Breakdown */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">wRVU by Payer</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={payerData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
              <XAxis type="number" tick={{ fill: '#8892b0', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#8892b0', fontSize: 10 }} width={90} />
              <Tooltip contentStyle={{ background: '#0d1528', border: '1px solid #1a2540', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="wRVU" fill="#f0b429" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MGMA Benchmark Table */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">MGMA Spine Surgery Benchmarks</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-spine-border">
                <th className="text-left py-2 text-spine-muted font-medium">Percentile</th>
                <th className="text-right py-2 text-spine-muted font-medium">Annual wRVU</th>
                <th className="text-right py-2 text-spine-muted font-medium">Cases/Year</th>
                <th className="text-right py-2 text-spine-muted font-medium">Avg wRVU/Case</th>
                <th className="text-right py-2 text-spine-muted font-medium">Your Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(mgmaBenchmarks.spine_surgery.percentiles).map(([pct, data]) => {
                const isAbove = stats.annualized >= data.annualWRVU
                return (
                  <tr key={pct} className="border-b border-spine-border/30">
                    <td className="py-2 text-white">{pct}th</td>
                    <td className="py-2 text-right font-mono text-spine-text">{data.annualWRVU.toLocaleString()}</td>
                    <td className="py-2 text-right font-mono text-spine-text">{data.casesPerYear}</td>
                    <td className="py-2 text-right font-mono text-spine-text">{data.avgWRVUPerCase}</td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${isAbove ? 'bg-spine-green/20 text-spine-green' : 'bg-spine-red/20 text-spine-red'}`}>
                        {isAbove ? 'ABOVE' : 'BELOW'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button className="px-6 py-2.5 accent-gradient text-white text-sm rounded-lg hover:opacity-90 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export Board-Ready Report (PDF)
        </button>
      </div>
    </div>
  )
}
