'use client'

import { useState, useEffect } from 'react'
import { Activity, Brain, TrendingUp, Zap, Users, Server } from 'lucide-react'

import { useRealtimeData } from '@/hooks/useRealtimeData'

import { AITrendChart } from './charts/AITrendChart'
import { UsageMetricsChart } from './charts/UsageMetricsChart'
import { PerformanceChart } from './charts/PerformanceChart'
import { SystemHealthChart } from './charts/SystemHealthChart'
import { AIInsightCard } from './cards/AIInsightCard'
import { MetricCard } from './cards/MetricCard'
import { RealtimeIndicator } from './RealtimeIndicator'

// Generate dynamic metrics
const generateMetrics = () => ({
  aiRequests: Math.floor(12000 + Math.random() * 1000),
  activeUsers: Math.floor(3700 + Math.random() * 100),
  performance: (98 + Math.random() * 2).toFixed(1),
  systemLoad: Math.floor(40 + Math.random() * 10),
})

const generateInsights = () => [
  {
    title: "Trend Analysis",
    insight: `Usage patterns indicate ${Math.floor(20 + Math.random() * 10)}% increased demand during peak hours. Consider auto-scaling resources.`,
    confidence: Math.floor(85 + Math.random() * 10),
    trend: 'up' as const,
  },
  {
    title: "Anomaly Detection",
    insight: "No critical anomalies detected. Minor fluctuation in response times around 3 PM.",
    confidence: Math.floor(80 + Math.random() * 15),
    trend: 'stable' as const,
  },
  {
    title: "Prediction",
    insight: `Expected ${Math.floor(15 + Math.random() * 10)}% growth in AI requests next week based on current patterns.`,
    confidence: Math.floor(75 + Math.random() * 20),
    trend: Math.random() > 0.5 ? ('up' as const) : ('stable' as const),
  },
]

export function DashboardView() {
  const { data: metrics, isLive, toggleLive } = useRealtimeData(generateMetrics)
  const { data: insights } = useRealtimeData(generateInsights, { interval: 5000 })
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    setLastUpdate(new Date())
  }, [metrics])

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              AI Analytics Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              Real-time insights powered by artificial intelligence
            </p>
          </div>
          <RealtimeIndicator 
            isLive={isLive} 
            onToggle={toggleLive}
            lastUpdate={lastUpdate}
          />
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="AI Requests"
            value={metrics.aiRequests.toLocaleString()}
            change={+15.3}
            icon={Brain}
            color="text-purple-600"
            bgColor="bg-purple-100 dark:bg-purple-900/20"
          />
          <MetricCard
            title="Active Users"
            value={metrics.activeUsers.toLocaleString()}
            change={+8.2}
            icon={Users}
            color="text-blue-600"
            bgColor="bg-blue-100 dark:bg-blue-900/20"
          />
          <MetricCard
            title="Performance"
            value={`${metrics.performance}%`}
            change={+2.1}
            icon={Zap}
            color="text-green-600"
            bgColor="bg-green-100 dark:bg-green-900/20"
          />
          <MetricCard
            title="System Load"
            value={`${metrics.systemLoad}%`}
            change={-5.4}
            icon={Server}
            color="text-orange-600"
            bgColor="bg-orange-100 dark:bg-orange-900/20"
          />
        </div>

        {/* AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {insights.map((insight, index) => (
            <AIInsightCard
              key={index}
              title={insight.title}
              insight={insight.insight}
              confidence={insight.confidence}
              trend={insight.trend}
            />
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-card-foreground">
                AI Usage Trends
              </h2>
              <Activity className="w-5 h-5 text-muted-foreground" />
            </div>
            <AITrendChart />
          </div>

          <div className="bg-card rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-card-foreground">
                Usage Metrics
              </h2>
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
            <UsageMetricsChart />
          </div>

          <div className="bg-card rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-card-foreground">
                Performance Analytics
              </h2>
              <Zap className="w-5 h-5 text-muted-foreground" />
            </div>
            <PerformanceChart />
          </div>

          <div className="bg-card rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-card-foreground">
                System Health
              </h2>
              <Server className="w-5 h-5 text-muted-foreground" />
            </div>
            <SystemHealthChart />
          </div>
        </div>
      </div>
    </div>
  )
}