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
        .eq('user_id', userId)
        .maybeSingle()
      if (!error && data) {
        setStoreProfile(data)
        return
      }

      // Legacy fallback for profiles created before user_id was wired up.
      const { data: legacyData, error: legacyError } = await supabase
        .from('Store Profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (!legacyError && legacyData) {
        setStoreProfile(legacyData)
        return
      }

      // Auto-repair: If we still have no profile, create one now!
      const { data: newProfile, error: insertError } = await supabase
        .from('Store Profiles')
        .insert({
          user_id: userId,
          store_name: 'My Store',
          owner_name: '',
          phone: '',
          whatsapp_numbers: null,
          safety_factor: 1.5,
          default_lead_days: 3,
          onboarding_complete: false,
        })
        .select()
        .single()
      
      if (!insertError && newProfile) {
        setStoreProfile(newProfile)
      }
    } catch (err) {
      console.error('Failed to fetch/create store profile:', err)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      if (currentSession?.user) {
        await fetchStoreProfile(currentSession.user.id)
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
      const { error: profileError } = await supabase
        .from('Store Profiles')
        .insert({
          user_id: data.user.id,
          store_name: storeName,
          owner_name: '',
          phone: '',
          whatsapp_numbers: null,
          safety_factor: 1.5,
          default_lead_days: 3,
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
