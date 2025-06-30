'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useMemo } from 'react'

const generateUsageData = () => {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  return hours.map((hour) => ({
    hour: `${hour}:00`,
    api: Math.floor(Math.random() * 1000 + 500),
    ml: Math.floor(Math.random() * 800 + 300),
    storage: Math.floor(Math.random() * 600 + 200),
  }))
}

export function UsageMetricsChart() {
  const data = useMemo(() => generateUsageData().slice(8, 20), []) // Show 8AM to 8PM

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis 
          dataKey="hour" 
          className="text-gray-600 dark:text-gray-400"
          stroke="currentColor"
        />
        <YAxis 
          className="text-gray-600 dark:text-gray-400"
          stroke="currentColor"
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
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="rect"
        />
        <Bar 
          dataKey="api" 
          fill="#8b5cf6" 
          radius={[4, 4, 0, 0]}
          name="API Calls"
        />
        <Bar 
          dataKey="ml" 
          fill="#3b82f6" 
          radius={[4, 4, 0, 0]}
          name="ML Processing"
        />
        <Bar 
          dataKey="storage" 
          fill="#10b981" 
          radius={[4, 4, 0, 0]}
          name="Storage Ops"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}