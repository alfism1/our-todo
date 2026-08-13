import { createContext, useContext, useEffect, useState } from 'react'
import { ensureAnonymousUser } from './firebase'

const AuthContext = createContext({ uid: null, status: 'loading', error: null })

export function AuthProvider({ children }) {
  const [state, setState] = useState({ uid: null, status: 'loading', error: null })

  useEffect(() => {
    let cancelled = false
    ensureAnonymousUser()
      .then((user) => {
        if (!cancelled) setState({ uid: user.uid, status: 'ready', error: null })
      })
      .catch((error) => {
        if (!cancelled) setState({ uid: null, status: 'error', error })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
