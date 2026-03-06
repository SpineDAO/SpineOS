import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'

const AuthContext = createContext(null)

// Session timeout: auto sign-out after 30 minutes of inactivity
const SESSION_TIMEOUT_MS = 30 * 60 * 1000

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const timeoutRef = useRef(null)

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (!user) return
    timeoutRef.current = setTimeout(() => {
      console.log('Session timed out due to inactivity')
      supabase?.auth.signOut()
    }, SESSION_TIMEOUT_MS)
  }, [user])

  // Track user activity to reset timeout
  useEffect(() => {
    if (!user) return

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    const handler = () => resetTimeout()

    events.forEach(e => window.addEventListener(e, handler, { passive: true }))
    resetTimeout() // start the timer

    return () => {
      events.forEach(e => window.removeEventListener(e, handler))
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [user, resetTimeout])

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
