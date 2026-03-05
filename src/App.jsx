import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from './lib/AuthContext'
import { isSupabaseConfigured } from './lib/supabase'
import { fetchCases, upsertCase, insertCases, fetchTrainingSignals, insertTrainingSignal } from './lib/database'
import AuthScreen from './components/AuthScreen'
import AICodeEngine from './components/AICodeEngine'
import DocumentAI from './components/DocumentAI'
import ProductivityHub from './components/ProductivityHub'
import RVUPayerEngine from './components/RVUPayerEngine'
import SurgeonPortal from './components/SurgeonPortal'
import BillingPortal from './components/BillingPortal'
import LearningEngine from './components/LearningEngine'
import ComplianceShield from './components/ComplianceShield'
import Dashboard from './components/Dashboard'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Command Center', icon: 'grid' },
  { id: 'ai-code-engine', label: 'AI Code Engine', icon: 'cpu' },
  { id: 'document-ai', label: 'Document AI', icon: 'file' },
  { id: 'productivity', label: 'Productivity Hub', icon: 'trending' },
  { id: 'rvu-payer', label: 'RVU / Payer Intel', icon: 'dollar' },
  { id: 'surgeon-portal', label: 'Surgeon Portal', icon: 'user' },
  { id: 'billing-portal', label: 'Billing Portal', icon: 'clipboard' },
  { id: 'learning-engine', label: 'Learning Engine', icon: 'brain' },
  { id: 'compliance', label: 'Compliance Shield', icon: 'shield' },
]

function NavIcon({ type, active }) {
  const color = active ? '#00c2ff' : '#8892b0'
  const icons = {
    grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    cpu: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
    file: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    trending: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    dollar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    clipboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>,
    brain: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><line x1="10" y1="22" x2="14" y2="22"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="12" y1="6" x2="12" y2="12"/></svg>,
    shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  }
  return icons[type] || null
}

function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const duration = 1200
    const steps = 40
    const increment = value / steps
    let current = 0
    let step = 0
    const timer = setInterval(() => {
      step++
      current = Math.min(value, increment * step)
      setDisplay(current)
      if (step >= steps) clearInterval(timer)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])
  return <span className="animate-count-up">{prefix}{display.toFixed(decimals)}{suffix}</span>
}

export { AnimatedCounter }

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [activeModule, setActiveModule] = useState('dashboard')
  const [role, setRole] = useState('surgeon') // 'surgeon' | 'billing'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)

  // Global case state
  const [cases, setCases] = useState(() => {
    try {
      const stored = window.storage?.getItem?.('spineos_cases')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  const [trainingSignals, setTrainingSignals] = useState(() => {
    try {
      const stored = window.storage?.getItem?.('spineos_training')
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })

  // Load data from Supabase when user logs in
  useEffect(() => {
    if (!user || !isSupabaseConfigured()) return
    let cancelled = false
    async function load() {
      const [dbCases, dbSignals] = await Promise.all([
        fetchCases(user.id),
        fetchTrainingSignals(user.id),
      ])
      if (cancelled) return
      if (dbCases && dbCases.length > 0) {
        setCases(dbCases)
      } else if (!cases) {
        // First-time user: seed from default data and persist to Supabase
        const mod = await import('./data/seedData.js')
        setCases(mod.sampleCases)
        insertCases(user.id, mod.sampleCases)
      }
      if (dbSignals.length > 0) setTrainingSignals(dbSignals)
    }
    load()
    return () => { cancelled = true }
  }, [user])

  // Initialize cases from seed data (offline / no Supabase fallback)
  useEffect(() => {
    if (!cases && !isSupabaseConfigured()) {
      import('./data/seedData.js').then(mod => {
        setCases(mod.sampleCases)
      })
    }
  }, [cases])

  // Persist to window.storage (local fallback, always works)
  useEffect(() => {
    if (cases && window.storage?.setItem) {
      window.storage.setItem('spineos_cases', JSON.stringify(cases))
    }
  }, [cases])

  useEffect(() => {
    if (trainingSignals.length > 0 && window.storage?.setItem) {
      window.storage.setItem('spineos_training', JSON.stringify(trainingSignals))
    }
  }, [trainingSignals])

  const addTrainingSignal = useCallback((signal) => {
    const enriched = { ...signal, timestamp: new Date().toISOString() }
    setTrainingSignals(prev => [...prev, enriched])
    if (user && isSupabaseConfigured()) insertTrainingSignal(user.id, enriched)
  }, [user])

  const addCase = useCallback((newCase) => {
    setCases(prev => [...(prev || []), newCase])
    if (user && isSupabaseConfigured()) upsertCase(user.id, newCase)
  }, [user])

  // Auth gate: show login screen if Supabase is configured but user isn't logged in
  if (isSupabaseConfigured()) {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-spine-bg flex items-center justify-center">
          <div className="text-spine-muted text-sm">Loading...</div>
        </div>
      )
    }
    if (!user) return <AuthScreen />
  }

  const renderModule = () => {
    const commonProps = { cases: cases || [], addCase, addTrainingSignal, trainingSignals, apiKey, role }
    switch (activeModule) {
      case 'dashboard': return <Dashboard {...commonProps} setActiveModule={setActiveModule} />
      case 'ai-code-engine': return <AICodeEngine {...commonProps} />
      case 'document-ai': return <DocumentAI {...commonProps} />
      case 'productivity': return <ProductivityHub {...commonProps} />
      case 'rvu-payer': return <RVUPayerEngine {...commonProps} />
      case 'surgeon-portal': return <SurgeonPortal {...commonProps} setActiveModule={setActiveModule} />
      case 'billing-portal': return <BillingPortal {...commonProps} setActiveModule={setActiveModule} />
      case 'learning-engine': return <LearningEngine {...commonProps} />
      case 'compliance': return <ComplianceShield {...commonProps} />
      default: return <Dashboard {...commonProps} setActiveModule={setActiveModule} />
    }
  }

  return (
    <div className="flex h-screen bg-spine-bg overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-60'} flex-shrink-0 bg-spine-dark border-r border-spine-border flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="p-4 border-b border-spine-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2L12 22M12 2C8 6 8 10 12 12M12 2C16 6 16 10 12 12M12 22C8 18 8 14 12 12M12 22C16 18 16 14 12 12"/>
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-serif text-lg font-bold text-white tracking-wide">SpineOS</h1>
                <p className="text-[10px] text-spine-muted tracking-widest uppercase">Intelligence Platform</p>
              </div>
            )}
          </div>
        </div>

        {/* Role Switcher */}
        {!sidebarCollapsed && (
          <div className="px-3 py-3 border-b border-spine-border">
            <div className="flex bg-spine-bg rounded-lg p-0.5">
              <button
                onClick={() => setRole('surgeon')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${role === 'surgeon' ? 'bg-spine-accent/20 text-spine-accent' : 'text-spine-muted hover:text-spine-text'}`}
              >
                Surgeon
              </button>
              <button
                onClick={() => setRole('billing')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${role === 'billing' ? 'bg-spine-accent/20 text-spine-accent' : 'text-spine-muted hover:text-spine-text'}`}
              >
                Billing
              </button>
            </div>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                activeModule === item.id
                  ? 'text-spine-accent bg-spine-accent/10 border-r-2 border-spine-accent'
                  : 'text-spine-muted hover:text-spine-text hover:bg-spine-card'
              }`}
              title={item.label}
            >
              <NavIcon type={item.icon} active={activeModule === item.id} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-spine-border p-3">
          {!sidebarCollapsed && user && (
            <div className="px-3 py-2 mb-1">
              <p className="text-[10px] text-spine-muted truncate">{user.email}</p>
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-spine-muted hover:text-spine-accent rounded-lg hover:bg-spine-card transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
              {apiKey ? 'API Key Set' : 'Set API Key'}
              {apiKey && <span className="w-2 h-2 bg-spine-green rounded-full ml-auto"/>}
            </button>
          )}
          {!sidebarCollapsed && user && (
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-spine-muted hover:text-red-400 rounded-lg hover:bg-spine-card transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-spine-muted hover:text-spine-accent rounded-lg hover:bg-spine-card transition-all mt-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}>
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            {!sidebarCollapsed && 'Collapse'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="animate-fade-in">
          {renderModule()}
        </div>
      </main>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowApiKeyModal(false)}>
          <div className="glass-card rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold text-white mb-4">Anthropic API Key</h3>
            <p className="text-sm text-spine-muted mb-4">Enter your Anthropic API key to enable AI-powered coding recommendations.</p>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full bg-spine-bg border border-spine-border rounded-lg px-4 py-3 text-sm text-spine-text placeholder-spine-muted/50 focus:outline-none focus:border-spine-accent transition-colors"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowApiKeyModal(false)} className="flex-1 py-2 text-sm text-spine-muted border border-spine-border rounded-lg hover:bg-spine-card transition-all">
                Cancel
              </button>
              <button onClick={() => setShowApiKeyModal(false)} className="flex-1 py-2 text-sm text-white accent-gradient rounded-lg hover:opacity-90 transition-all">
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
