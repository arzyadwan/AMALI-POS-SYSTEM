import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('amali_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('amali_token') || null)

  const login = useCallback((userData, userToken) => {
    setUser(userData)
    setToken(userToken)
    localStorage.setItem('amali_user', JSON.stringify(userData))
    localStorage.setItem('amali_token', userToken)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('amali_user')
    localStorage.removeItem('amali_token')
  }, [])

  const isAdmin = user?.role === 'ADMIN'

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
