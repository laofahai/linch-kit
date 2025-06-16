import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { AuthManager } from '../src'

interface Props {
  authManager: AuthManager
  children?: React.ReactNode
}

export const SSOCallbackHandler: React.FC<Props> = ({ authManager, children }: Props) => {
  const navigate = useNavigate()

  useEffect(() => {
    const url = new URL(window.location.href)
    const token = url.searchParams.get('token')

    if (token) {
      authManager.getSession(token).then(() => {
        navigate('/', { replace: true })
      })
    } else {
      navigate('/', { replace: true })
    }
  }, [authManager, navigate])

  return <>{children}</>
}
