import { useCallback, useMemo, useState } from 'react'
import { AuthContext } from './authContext'
import * as authService from '../services/authService'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser())

  const login = useCallback((email, password) => {
    const loggedIn = authService.login(email, password)
    setUser(loggedIn)
    return loggedIn
  }, [])

  const register = useCallback((data) => authService.register(data), [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, register, logout }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
