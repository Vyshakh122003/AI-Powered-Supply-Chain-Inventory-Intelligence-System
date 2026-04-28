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
      let { data, error } = await supabase
        .from('Store Profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error

      // Backward compatibility: older rows used id = user_id without user_id populated
      if (!data) {
        const legacy = await supabase
          .from('Store Profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()

        if (!legacy.error && legacy.data) {
          data = legacy.data
        }
      }

      // If no profile exists (eg. email confirmation flow), create a minimal one
      if (!data) {
        const { error: insertError } = await supabase
          .from('Store Profiles')
          .insert({
            id: userId,
            user_id: userId,
            store_name: 'My Store',
            owner_name: '',
            phone: null,
            whatsapp_numbers: '',
            safety_factor: 1.5,
            default_lead_days: 3,
            timezone: 'Asia/Kolkata',
            onboarding_complete: false,
          })

        // Ignore duplicate-race errors; refetch below
        if (insertError && !String(insertError.message || '').toLowerCase().includes('duplicate')) {
          throw insertError
        }

        const retry = await supabase
          .from('Store Profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        if (!retry.error && retry.data) {
          data = retry.data
        }
      }

      setStoreProfile(data || null)
    } catch {
      // Profile may not exist yet
      setStoreProfile(null)
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

    // Create store profile only when session exists (email-confirmation flows have no session here)
    if (data.user && data.session) {
      const { error: profileError } = await supabase
        .from('Store Profiles')
        .insert({
          id: data.user.id,
          user_id: data.user.id,
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
