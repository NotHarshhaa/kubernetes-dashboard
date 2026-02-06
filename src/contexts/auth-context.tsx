"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

interface User {
  email: string
  name: string
  role: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for demo mode first
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    
    if (isDemoMode) {
      // Auto-login in demo mode
      const demoUser: User = {
        email: 'admin@k8s.local',
        name: 'Cluster Administrator',
        role: 'admin'
      }
      
      // Set demo user immediately
      setUser(demoUser)
      setLoading(false)
      return
    }

    // Check for existing auth token on mount (non-demo mode)
    const token = localStorage.getItem('k8s-auth-token')
    const userData = localStorage.getItem('k8s-user')
    
    console.log('Auth check - Token:', token)
    console.log('Auth check - User data:', userData)
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        console.log('Setting user:', parsedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        // Invalid user data, clear it
        localStorage.removeItem('k8s-auth-token')
        localStorage.removeItem('k8s-user')
      }
    }
    
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string): Promise<boolean> => {
    console.log('Sign in attempt:', email, password)
    
    try {
      // Simulate API call - in real app, this would be an actual authentication request
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log('Checking credentials...')
      
      if (email === "admin@k8s.local" && password === "admin123") {
        console.log('Credentials valid, creating user data...')
        
        const userData: User = {
          email: 'admin@k8s.local',
          name: 'Cluster Administrator',
          role: 'admin'
        }
        
        // Store auth data
        localStorage.setItem('k8s-auth-token', 'demo-token-' + Date.now())
        localStorage.setItem('k8s-user', JSON.stringify(userData))
        
        console.log('User data stored:', userData)
        setUser(userData)
        console.log('Sign in successful!')
        return true
      } else {
        console.log('Invalid credentials')
        return false
      }
    } catch (error) {
      console.error('Sign in error:', error)
      return false
    }
  }

  const signOut = () => {
    // Allow sign out even in demo mode
    setUser(null)
    localStorage.removeItem('k8s-auth-token')
    localStorage.removeItem('k8s-user')
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
