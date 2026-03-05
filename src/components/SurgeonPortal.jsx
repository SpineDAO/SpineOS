import React, { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { cptCodes, denialScenarios } from '../data/seedData'

const COLORS = ['#00c2ff', '#f0b429', '#10b981', '#ef4444', '#8b5cf6']

export default function SurgeonPortal({ cases, addCase, addTrainingSignal, apiKey, setActiveModule }) {
  const [dictationMode, setDictationMode] = useState(false)
  const [dictationText, setDictationText] = useState('')
  const [quickEntryText, setQuickEntryText] = useState('')
  const [isRecording, setIsRecording] = useState(false)

  const myCases = cases
  const myDenials = denialScenarios.filter(d => myCases.some(c => c.id === d.caseId))

  const stats = useMemo(() => {
    const totalCases = myCases.length
    const totalWRVU = myCases.reduce((sum, c) => sum + (c.totalWRVU || 0), 0)
    const pendingCases = myCases.filter(c => c.status === 'pending_review').length
    const finalizedCases = myCases.filter(c => c.status === 'finalized').length
    return { totalCases, totalWRVU, pendingCases, finalizedCases }
  }, [myCases])

  const weeklyData = useMemo(() => {
    const weeks = {}
    myCases.forEach(c => {
      const date = new Date(c.date)
      const week = `W${Math.ceil(date.getDate() / 7)}`
      const key = `${date.toLocaleString('default', { month: 'short' })} ${week}`
      if (!weeks[key]) weeks[key] = { cases: 0, wRVU: 0 }
      weeks[key].cases++
      weeks[key].wRVU += c.totalWRVU || 0
    })
    return Object.entries(weeks).map(([name, data]) => ({ name, ...data }))
  }, [myCases])

  const startDictation = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        let transcript = ''
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        setDictationText(transcript)
      }

      recognition.onerror = () => {
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognition.start()
      setIsRecording(true)
    } else {
      setDictationText('Speech recognition not available in this browser. Please type your operative note.')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white">Surgeon Portal</h1>
        <p className="text-sm text-spine-muted mt-1">Personal dashboard - Dr. Sarah Chen</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'My Cases', value: stats.totalCases, color: 'text-white' },
          { label: 'My wRVUs', value: stats.totalWRVU.toFixed(1), color: 'text-spine-gold' },
          { label: 'Pending Review', value: stats.pendingCases, color: 'text-spine-accent' },
          { label: 'Finalized', value: stats.finalizedCases, color: 'text-spine-green' },
        ].map((s, i) => (
          <div key={i} className="glass-card rounded-xl p-4 text-center">
            <p className="text-[10px] text-spine-muted uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold font-mono mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case Entry */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick Entry Options */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Quick Case Entry</h3>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveModule('ai-code-engine')}
                className="px-4 py-2.5 accent-gradient text-white text-xs rounded-lg hover:opacity-90 flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Paste Op Note
              </button>
              <button
                onClick={() => setActiveModule('document-ai')}
                className="px-4 py-2.5 glass-card text-spine-accent text-xs rounded-lg hover:bg-spine-accent/10 flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload Document
              </button>
              <button
                onClick={() => setDictationMode(!dictationMode)}
                className={`px-4 py-2.5 text-xs rounded-lg flex items-center gap-2 ${dictationMode ? 'bg-spine-red/20 text-spine-red border border-spine-red/30' : 'glass-card text-spine-accent hover:bg-spine-accent/10'}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
                {dictationMode ? 'Close Dictation' : 'Voice Dictation'}
              </button>
            </div>

            {dictationMode && (
              <div className="animate-fade-in space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={isRecording ? () => setIsRecording(false) : startDictation}
                    className={`px-4 py-2 text-xs rounded-lg flex items-center gap-2 ${isRecording ? 'bg-spine-red/20 text-spine-red animate-pulse-glow' : 'accent-gradient text-white'}`}
                  >
                    <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-spine-red' : 'bg-white'}`} />
                    {isRecording ? 'Recording... (Click to stop)' : 'Start Recording'}
                  </button>
                  {isRecording && <span className="text-xs text-spine-red animate-pulse">Listening...</span>}
                </div>
                <textarea
                  value={dictationText}
                  onChange={e => setDictationText(e.target.value)}
                  placeholder="Dictation will appear here, or type directly..."
                  className="w-full h-40 bg-spine-bg border border-spine-border rounded-lg p-3 text-sm text-spine-text placeholder-spine-muted/40 focus:outline-none focus:border-spine-accent resize-none"
                />
                {dictationText && (
                  <button
                    onClick={() => { setActiveModule('ai-code-engine') }}
                    className="px-4 py-2 accent-gradient text-white text-xs rounded-lg hover:opacity-90"
                  >
                    Send to AI Code Engine
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Recent Cases */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Recent Cases</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {myCases.slice().reverse().map(c => (
                <div key={c.id} className="p-3 rounded-lg bg-spine-bg/50 border border-spine-border/30 hover:border-spine-accent/20 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-spine-accent">{c.id}</span>
                        <span className="text-xs text-spine-muted">{c.date}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          c.status === 'finalized' ? 'bg-spine-green/20 text-spine-green' : 'bg-spine-gold/20 text-spine-gold'
                        }`}>
                          {c.status === 'finalized' ? 'Finalized' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-spine-text mt-1 line-clamp-1">{c.procedure || c.diagnosis}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-spine-muted">{c.levels?.join(', ')}</span>
                        <span className="text-[10px] text-spine-muted">| {c.approach}</span>
                        <span className="text-[10px] text-spine-muted">| {c.payer}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-bold text-spine-gold">{c.totalWRVU?.toFixed(2)}</p>
                      <p className="text-[10px] text-spine-muted">wRVU</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {c.cptCodes?.map((cc, i) => (
                      <span key={i} className={`text-[10px] px-1.5 py-0 rounded ${cc.primary ? 'bg-spine-accent/10 text-spine-accent' : 'bg-spine-card text-spine-muted'}`}>
                        {cc.code}{cc.modifier ? `-${cc.modifier}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Weekly Chart */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Weekly Activity</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
                <XAxis dataKey="name" tick={{ fill: '#8892b0', fontSize: 9 }} />
                <YAxis tick={{ fill: '#8892b0', fontSize: 9 }} />
                <Tooltip contentStyle={{ background: '#0d1528', border: '1px solid #1a2540', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="wRVU" fill="#00c2ff" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* My Denials */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">My Denials ({myDenials.length})</h3>
            {myDenials.length === 0 ? (
              <p className="text-xs text-spine-muted text-center py-4">No denials on record</p>
            ) : (
              <div className="space-y-2">
                {myDenials.slice(0, 5).map(d => (
                  <div key={d.id} className="p-2 rounded-lg bg-spine-bg/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-spine-accent">{d.cptCode}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        d.appealOutcome === 'won' ? 'bg-spine-green/20 text-spine-green' :
                        d.status === 'pending' ? 'bg-spine-gold/20 text-spine-gold' :
                        'bg-spine-accent/20 text-spine-accent'
                      }`}>
                        {d.appealOutcome === 'won' ? 'Won' : d.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-spine-muted mt-0.5 line-clamp-2">{d.denialReason}</p>
                    <p className="text-[10px] text-spine-gold mt-0.5">${d.amountDenied.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Peer Comparison placeholder */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Peer Comparison</h3>
            <div className="space-y-3">
              {[
                { label: 'Your Avg wRVU/Case', value: (stats.totalWRVU / (stats.totalCases || 1)).toFixed(1), peer: '31.2' },
                { label: 'Your Fusion Rate', value: `${((myCases.filter(c => c.cptCodes?.some(cc => cc.primary && cptCodes.find(cp => cp.code === cc.code)?.category === 'fusion')).length / (stats.totalCases || 1)) * 100).toFixed(0)}%`, peer: '62%' },
                { label: 'Your ASC Utilization', value: `${((stats.totalCases ? (myCases.filter(c => c.facility === 'ASC').length / stats.totalCases) * 100 : 0)).toFixed(0)}%`, peer: '12%' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[10px] text-spine-muted">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-spine-accent">{item.value}</span>
                    <span className="text-[10px] text-spine-muted">vs {item.peer}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
