import { Wifi, WifiOff } from 'lucide-react'

import { cn } from '@/lib/utils'

interface RealtimeIndicatorProps {
  isLive: boolean
  onToggle: () => void
  lastUpdate: Date
}

export function RealtimeIndicator({ isLive, onToggle, lastUpdate }: RealtimeIndicatorProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit' 
    })
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Last update: {formatTime(lastUpdate)}
      </div>
      
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
          "border border-gray-200 dark:border-gray-700",
          isLive 
            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800" 
            : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
        )}
      >
        {isLive ? (
          <>
            <Wifi className="w-4 h-4" />
            <span className="font-medium">Live</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="font-medium">Paused</span>
          </>
        )}
      </button>
    </div>
  )
}