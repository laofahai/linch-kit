import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react'

import { cn } from '@/lib/utils'

interface AIInsightCardProps {
  title: string
  insight: string
  confidence: number
  trend: 'up' | 'down' | 'stable'
}

export function AIInsightCard({ title, insight, confidence, trend }: AIInsightCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-600" />
      default:
        return <Minus className="w-5 h-5 text-blue-600" />
    }
  }

  const getConfidenceColor = () => {
    if (confidence >= 90) return 'text-green-600'
    if (confidence >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <Brain className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        {getTrendIcon()}
      </div>
      
      <p className="text-gray-700 dark:text-gray-300 mb-4">{insight}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className={cn('text-sm font-medium', getConfidenceColor())}>
            {confidence}% confidence
          </span>
        </div>
      </div>
    </div>
  )
}