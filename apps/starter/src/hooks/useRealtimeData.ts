'use client'

import { useState, useEffect, useCallback } from 'react'

interface RealtimeDataOptions {
  interval?: number
  onUpdate?: (data: unknown) => void
}

export function useRealtimeData<T>(
  dataGenerator: () => T,
  options: RealtimeDataOptions = {}
) {
  const { interval = 3000, onUpdate } = options
  const [data, setData] = useState<T>(dataGenerator())
  const [isLive, setIsLive] = useState(true)

  useEffect(() => {
    if (!isLive) return

    const timer = setInterval(() => {
      const newData = dataGenerator()
      setData(newData)
      onUpdate?.(newData)
    }, interval)

    return () => clearInterval(timer)
  }, [dataGenerator, interval, isLive, onUpdate])

  const toggleLive = useCallback(() => {
    setIsLive(prev => !prev)
  }, [])

  const refresh = useCallback(() => {
    const newData = dataGenerator()
    setData(newData)
    onUpdate?.(newData)
  }, [dataGenerator, onUpdate])

  return {
    data,
    isLive,
    toggleLive,
    refresh
  }
}