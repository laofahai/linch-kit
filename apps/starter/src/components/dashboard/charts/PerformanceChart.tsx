'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { useMemo } from 'react'

const performanceMetrics = [
  { metric: 'Response Time', current: 85, optimal: 95 },
  { metric: 'Throughput', current: 92, optimal: 100 },
  { metric: 'Accuracy', current: 94, optimal: 98 },
  { metric: 'Availability', current: 99, optimal: 99.9 },
  { metric: 'Efficiency', current: 88, optimal: 95 },
  { metric: 'Scalability', current: 90, optimal: 95 },
]

export function PerformanceChart() {
  const data = useMemo(() => performanceMetrics, [])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid 
          radialLines={false}
          className="stroke-gray-200 dark:stroke-gray-700"
        />
        <PolarAngleAxis 
          dataKey="metric" 
          className="text-xs text-gray-600 dark:text-gray-400"
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]} 
          tickCount={5}
          className="text-xs text-gray-600 dark:text-gray-400"
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}
          labelStyle={{ color: '#111827', fontWeight: '600' }}
        />
        <Radar 
          name="Current Performance" 
          dataKey="current" 
          stroke="#8b5cf6" 
          fill="#8b5cf6" 
          fillOpacity={0.6}
          strokeWidth={2}
        />
        <Radar 
          name="Optimal Target" 
          dataKey="optimal" 
          stroke="#3b82f6" 
          fill="#3b82f6" 
          fillOpacity={0.3}
          strokeWidth={2}
          strokeDasharray="5 5"
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}