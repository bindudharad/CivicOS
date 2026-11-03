import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { authAPI } from '../lib/api'
import { saveSession, clearSession, getToken, getUser, User } from '../lib/auth'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getUser())
  const [token, setToken] = useState<string | null>(getToken())
  const [loading, setLoading] = useState(false)

  const logout = useCallback(async () => {
    try { await authAPI.logout() } catch {}
    clearSession()
    setUser(null)
    setToken(null)
  }, [])

  useEffect(() => {
    const handler = () => logout()
    window.addEventListener('civicos:logout', handler)
    return () => window.removeEventListener('civicos:logout', handler)
  }, [logout])

  const login = async (username: string, password: string) => {
    setLoading(true)
    try {
      const res = await authAPI.login(username, password)
      const { access_token, role, username: uname, email } = res.data
      const userData: User = {
        username: uname || username,
        role: role || 'viewer',
        email: email,
      }
      saveSession(access_token, userData)
      setToken(access_token)
      setUser(userData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
