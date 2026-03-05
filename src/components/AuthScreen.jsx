import React, { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmMsg, setConfirmMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setConfirmMsg('')
    setLoading(true)
    try {
      if (isSignUp) {
        await signUp(email, password)
        setConfirmMsg('Check your email to confirm your account.')
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-spine-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl accent-gradient flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2L12 22M12 2C8 6 8 10 12 12M12 2C16 6 16 10 12 12M12 22C8 18 8 14 12 12M12 22C16 18 16 14 12 12"/>
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-wide">SpineOS</h1>
          <p className="text-sm text-spine-muted mt-1">Spine Surgery Intelligence Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white text-center">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {confirmMsg && (
            <div className="bg-spine-accent/10 border border-spine-accent/30 rounded-lg px-3 py-2 text-sm text-spine-accent">
              {confirmMsg}
            </div>
          )}

          <div>
            <label className="block text-xs text-spine-muted mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-spine-bg border border-spine-border rounded-lg px-4 py-2.5 text-sm text-spine-text placeholder-spine-muted/50 focus:outline-none focus:border-spine-accent transition-colors"
              placeholder="you@hospital.com"
            />
          </div>

          <div>
            <label className="block text-xs text-spine-muted mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-spine-bg border border-spine-border rounded-lg px-4 py-2.5 text-sm text-spine-text placeholder-spine-muted/50 focus:outline-none focus:border-spine-accent transition-colors"
              placeholder="Min 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-medium text-white accent-gradient rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <p className="text-center text-xs text-spine-muted">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setConfirmMsg('') }}
              className="text-spine-accent hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
