import { createContext } from 'react'

import type { SessionUser } from '../src'

export const AuthContext = createContext<{
  user: SessionUser | null
  setUser: (u: SessionUser | null) => void
}>({
  user: null,
  setUser: () => {},
})
