'use client'

import { Logger } from '@linch-kit/core/client'
import { useEffect, useState } from 'react'

import { initializeExtensions } from '../lib/extensions-loader'

export function ExtensionsInitializer() {
  const [initialized, setInitialized] = useState(false)
  
  useEffect(() => {
    if (initialized) return
    
    const init = async () => {
      try {
        await initializeExtensions()
        setInitialized(true)
      } catch (error) {
        Logger.error('Failed to initialize extensions:', error instanceof Error ? error : new Error(String(error)))
      }
    }
    
    init().catch(error => { Logger.error('Extension initialization error:', error); })
  }, [initialized])
  
  // This component doesn't render anything visible
  return null
}