'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useMemo } from 'react'

const systemHealthData = [
  { name: 'Healthy', value: 75, color: '#10b981' },
  { name: 'Warning', value: 20, color: '#f59e0b' },
  { name: 'Critical', value: 5, color: '#ef4444' },
]

const RADIAN = Math.PI / 180
const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props
  if (typeof cx !== 'number' || typeof cy !== 'number' || typeof midAngle !== 'number' || 
      typeof innerRadius !== 'number' || typeof outerRadius !== 'number' || typeof percent !== 'number') {
    return null
  }
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function SystemHealthChart() {
  const data = useMemo(() => systemHealthData, [])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
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
          verticalAlign="bottom" 
          height={36}
          formatter={(value) => <span className="text-gray-700 dark:text-gray-300">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}