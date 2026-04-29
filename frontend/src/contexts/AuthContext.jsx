import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [storeProfile, setStoreProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch the single store profile (no multi-tenancy)
  const fetchStoreProfile = async (userId) => {
    try {
      // Get the first (and only) store profile
      const { data, error } = await supabase
        .from('Store Profiles')
        .select('*')
        .limit(1)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No profile exists yet - will be created on signup
          setStoreProfile(null)
          return null
        }
        throw error
      }

      setStoreProfile(data)
      return data
    } catch (error) {
      console.error('Error fetching store profile:', error)
      setStoreProfile(null)
      return null
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      if (currentSession?.user) {
        fetchStoreProfile(currentSession.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        if (newSession?.user) {
          fetchStoreProfile(newSession.user.id)
        } else {
          setStoreProfile(null)
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signUp = async (email, password, storeName) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    // For single-user mode: create or ensure one Store Profile exists
    if (data.user && data.session) {
      // Check if profile already exists
      const { data: existing } = await supabase
        .from('Store Profiles')
        .select('*')
        .limit(1)
        .maybeSingle()

      if (!existing) {
        // Create the only store profile
        const { error: profileError } = await supabase
          .from('Store Profiles')
          .insert({
            store_name: storeName,
            owner_name: storeName,
            phone: null,
            whatsapp_numbers: '',
            safety_factor: 1.5,
            default_lead_days: 3,
            timezone: 'Asia/Kolkata',
            onboarding_complete: false,
          })
        if (profileError) console.error('Error creating store profile:', profileError)
      }
    }

    // If Supabase has email confirmation enabled, session will be null
    if (data.user && !data.session) {
      return { user: data.user, session: null, emailConfirmationRequired: true }
    }

    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const refreshProfile = () => {
    if (user) return fetchStoreProfile(user.id)
  }

  const value = {
    session,
    user,
    storeProfile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
