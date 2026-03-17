import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [storeProfile, setStoreProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch store profile for the current user
  const fetchStoreProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('Store Profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (!error && data) {
        setStoreProfile(data)
      }
    } catch {
      // Profile may not exist yet
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

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signUp = async (email, password, storeName) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    // Create store profile
    if (data.user) {
      const storeId = `store_${data.user.id.slice(0, 8)}`
      const { error: profileError } = await supabase
        .from('Store Profiles')
        .insert({
          id: data.user.id,
          store_id: storeId,
          store_name: storeName,
          owner_name: '',
          phone: '',
          email: email,
          whatsapp_numbers: [],
          safety_factor: 1.5,
          default_lead_days: 3,
          onboarding_completed: false,
        })
      if (profileError) console.error('Error creating store profile:', profileError)
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
    if (user) fetchStoreProfile(user.id)
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
