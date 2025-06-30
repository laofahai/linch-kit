'use client'

import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { useMemo } from 'react'

// Generate sample data with AI pattern
const generateAITrendData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map((day, index) => ({
    day,
    requests: Math.floor(1000 + Math.random() * 500 + index * 100),
    predictions: Math.floor(1200 + Math.random() * 300 + index * 120),
    accuracy: Math.floor(85 + Math.random() * 10),
  }))
}

export function AITrendChart() {
  const data = useMemo(() => generateAITrendData(), [])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorPredictions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis 
          dataKey="day" 
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
        <Area
          type="monotone"
          dataKey="requests"
          stroke="#8b5cf6"
          fillOpacity={1}
          fill="url(#colorRequests)"
          strokeWidth={2}
          name="Actual Requests"
        />
        <Area
          type="monotone"
          dataKey="predictions"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorPredictions)"
          strokeWidth={2}
          strokeDasharray="5 5"
          name="AI Predictions"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}