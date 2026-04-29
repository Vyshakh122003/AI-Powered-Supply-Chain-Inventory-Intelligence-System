import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [storeProfile, setStoreProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStoreProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('Store Profiles')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      setStoreProfile(data || null)
      return data || null
    } catch (error) {
      console.error('Failed to load store profile:', error)
      setStoreProfile(null)
      return null
    }
  }

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setUser(data.session?.user || null)
      if (data.session?.user) {
        fetchStoreProfile()
      }
      setLoading(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user || null)
      if (nextSession?.user) {
        fetchStoreProfile()
      } else {
        setStoreProfile(null)
      }
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await fetchStoreProfile()
    return data
  }

  const signUp = async (email, password, storeName) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    if (data.session) {
      const { data: existing } = await supabase
        .from('Store Profiles')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (!existing) {
        const { data: created, error: createError } = await supabase
          .from('Store Profiles')
          .insert({
            user_id: data.user.id,
            store_name: storeName,
            owner_name: storeName,
            onboarding_complete: false,
            safety_factor: 1.5,
            default_lead_days: 3,
            timezone: 'Asia/Kolkata',
          })
          .select()
          .single()

        if (createError) throw createError
        setStoreProfile(created)
      } else {
        setStoreProfile(existing)
      }
    }

    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const refreshProfile = () => fetchStoreProfile()

  const value = {
    session,
    user,
    storeProfile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    setStoreProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
