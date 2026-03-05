import React, { useState, useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function LearningEngine({ trainingSignals, addTrainingSignal }) {
  const [injectionTab, setInjectionTab] = useState('codebook')
  const [injectionText, setInjectionText] = useState('')
  const [injections, setInjections] = useState([
    { id: 1, type: 'codebook', title: 'CMS 2026 CPT Updates', date: '2026-01-01', status: 'indexed', entries: 156 },
    { id: 2, type: 'lcd', title: 'LCD L33803 - Lumbar Fusion Criteria Update', date: '2026-01-15', status: 'indexed', entries: 1 },
    { id: 3, type: 'institutional', title: 'Department Coding Guidelines v3.2', date: '2026-02-01', status: 'indexed', entries: 42 },
  ])

  const signalStats = useMemo(() => {
    const accepted = trainingSignals.filter(s => s.type === 'accept').length
    const rejected = trainingSignals.filter(s => s.type === 'reject').length
    const edited = trainingSignals.filter(s => s.type === 'edit').length
    const total = trainingSignals.length
    return { accepted, rejected, edited, total }
  }, [trainingSignals])

  const confidenceOverTime = [
    { date: 'Week 1', score: 72, signals: 0 },
    { date: 'Week 2', score: 74, signals: 5 },
    { date: 'Week 3', score: 78, signals: 12 },
    { date: 'Week 4', score: 81, signals: 22 },
    { date: 'Week 5', score: 83, signals: 35 },
    { date: 'Week 6', score: 85, signals: 48 },
    { date: 'Week 7', score: 87, signals: 62 },
    { date: 'Week 8', score: 89, signals: 78 },
  ]

  const handleInject = () => {
    if (!injectionText.trim()) return
    const newInjection = {
      id: injections.length + 1,
      type: injectionTab,
      title: injectionText.substring(0, 60),
      date: new Date().toISOString().split('T')[0],
      status: 'indexing',
      entries: Math.floor(Math.random() * 50) + 1,
    }
    setInjections(prev => [newInjection, ...prev])
    setInjectionText('')

    // Simulate indexing
    setTimeout(() => {
      setInjections(prev => prev.map(i => i.id === newInjection.id ? { ...i, status: 'indexed' } : i))
    }, 3000)
  }

  const versionLog = [
    { version: '3.2.1', date: '2026-03-01', changes: 'Updated NCCI edit pairs for Q1 2026', impact: 'Reduced false bundling warnings by 15%' },
    { version: '3.2.0', date: '2026-02-15', changes: 'Incorporated department coding guidelines v3.2', impact: 'Modifier 62 suggestions now align with institutional policy' },
    { version: '3.1.0', date: '2026-02-01', changes: 'LCD L33803 criteria update indexed', impact: 'Improved lumbar fusion medical necessity flag accuracy' },
    { version: '3.0.0', date: '2026-01-01', changes: 'CMS 2026 fee schedule and CPT updates', impact: 'All wRVU values updated to 2026 CMS rates' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white">Learning Engine</h1>
        <p className="text-sm text-spine-muted mt-1">Continuous improvement through user feedback and data injection</p>
      </div>

      {/* Training Signal Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-[10px] text-spine-muted uppercase">Total Signals</p>
          <p className="text-2xl font-bold text-spine-accent font-mono">{signalStats.total}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-[10px] text-spine-muted uppercase">Accepted</p>
          <p className="text-2xl font-bold text-spine-green font-mono">{signalStats.accepted}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-[10px] text-spine-muted uppercase">Rejected</p>
          <p className="text-2xl font-bold text-spine-red font-mono">{signalStats.rejected}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-[10px] text-spine-muted uppercase">Edited</p>
          <p className="text-2xl font-bold text-spine-gold font-mono">{signalStats.edited}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confidence Score Trend */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Model Confidence Score Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={confidenceOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
              <XAxis dataKey="date" tick={{ fill: '#8892b0', fontSize: 10 }} />
              <YAxis domain={[60, 100]} tick={{ fill: '#8892b0', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#0d1528', border: '1px solid #1a2540', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="score" stroke="#00c2ff" strokeWidth={2} dot={{ fill: '#00c2ff', r: 4 }} name="Confidence %" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-3 p-3 rounded-lg bg-spine-accent/5 border border-spine-accent/20">
            <p className="text-xs text-spine-accent">Current Model Confidence: <span className="font-bold">89%</span></p>
            <p className="text-[10px] text-spine-muted mt-0.5">Based on {signalStats.total} training signals and {injections.filter(i => i.status === 'indexed').length} data injections</p>
          </div>
        </div>

        {/* Training Signal Log */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Training Signals</h3>
          <div className="max-h-72 overflow-y-auto space-y-2">
            {trainingSignals.length === 0 ? (
              <p className="text-xs text-spine-muted text-center py-4">No training signals yet. Use the AI Code Engine to generate signals.</p>
            ) : (
              trainingSignals.slice().reverse().slice(0, 20).map((s, i) => (
                <div key={i} className="p-2 rounded-lg bg-spine-bg/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${s.type === 'accept' ? 'bg-spine-green' : s.type === 'reject' ? 'bg-spine-red' : 'bg-spine-gold'}`} />
                    <span className="text-xs text-spine-text capitalize">{s.type}</span>
                    <span className="text-[10px] text-spine-muted">{s.source}</span>
                  </div>
                  <span className="text-[10px] text-spine-muted">{new Date(s.timestamp).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Data Injection Console */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Data Injection Console</h3>
        <p className="text-xs text-spine-muted mb-4">Upload new coding guidelines, payer policies, or institutional data to improve model accuracy</p>

        <div className="flex gap-2 mb-4">
          {[
            { id: 'codebook', label: 'CPT/ICD-10 Codebook' },
            { id: 'lcd', label: 'Payer LCD Policy' },
            { id: 'institutional', label: 'Institutional Guidelines' },
            { id: 'historical', label: 'Historical Case Data' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setInjectionTab(tab.id)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                injectionTab === tab.id ? 'accent-gradient text-white' : 'glass-card text-spine-muted hover:text-spine-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <textarea
          value={injectionText}
          onChange={e => setInjectionText(e.target.value)}
          placeholder={
            injectionTab === 'codebook' ? 'Paste updated CPT/ICD-10 code data here...' :
            injectionTab === 'lcd' ? 'Paste payer LCD policy text here...' :
            injectionTab === 'institutional' ? 'Paste department coding guidelines or protocols here...' :
            'Paste de-identified historical case data here...'
          }
          className="w-full h-32 bg-spine-bg border border-spine-border rounded-lg p-3 text-sm text-spine-text placeholder-spine-muted/40 focus:outline-none focus:border-spine-accent resize-none"
        />

        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={handleInject}
            disabled={!injectionText.trim()}
            className="px-4 py-2 accent-gradient text-white text-xs rounded-lg hover:opacity-90 disabled:opacity-40"
          >
            Inject & Index Data
          </button>
          <span className="text-[10px] text-spine-muted">Data will be indexed and used to improve model recommendations</span>
        </div>
      </div>

      {/* Injection History */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Data Injection History</h3>
        <div className="space-y-2">
          {injections.map(inj => (
            <div key={inj.id} className="flex items-center justify-between p-3 rounded-lg bg-spine-bg/50">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${inj.status === 'indexed' ? 'bg-spine-green' : 'bg-spine-gold animate-pulse'}`} />
                <div>
                  <p className="text-xs text-white">{inj.title}</p>
                  <p className="text-[10px] text-spine-muted">{inj.type} | {inj.entries} entries | {inj.date}</p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                inj.status === 'indexed' ? 'bg-spine-green/20 text-spine-green' : 'bg-spine-gold/20 text-spine-gold'
              }`}>
                {inj.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Version Log */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Model Version Log</h3>
        <div className="space-y-3">
          {versionLog.map((v, i) => (
            <div key={i} className="p-3 rounded-lg bg-spine-bg/50 border-l-4 border-spine-accent">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-spine-accent">v{v.version}</span>
                <span className="text-[10px] text-spine-muted">{v.date}</span>
              </div>
              <p className="text-xs text-spine-text mt-1">{v.changes}</p>
              <p className="text-[10px] text-spine-green mt-0.5">{v.impact}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Site Deployment */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Multi-Site Deployment</h3>
        <p className="text-xs text-spine-muted mb-4">Site-specific model instances share a national baseline while learning local patterns</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { name: 'Main Campus', cases: 2450, confidence: 89, status: 'active' },
            { name: 'Ambulatory Center', cases: 680, confidence: 82, status: 'active' },
            { name: 'Regional Hospital', cases: 1120, confidence: 85, status: 'active' },
          ].map((site, i) => (
            <div key={i} className="p-4 rounded-lg bg-spine-bg/50 border border-spine-border/30">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white">{site.name}</h4>
                <span className="w-2 h-2 rounded-full bg-spine-green" />
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-[10px] text-spine-muted">Historical Cases</span>
                  <span className="text-xs font-mono text-white">{site.cases.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-spine-muted">Model Confidence</span>
                  <span className="text-xs font-mono text-spine-accent">{site.confidence}%</span>
                </div>
                <div className="w-full h-1.5 bg-spine-bg rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-spine-accent rounded-full" style={{ width: `${site.confidence}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
