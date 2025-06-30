'use client'

import { Dashboard } from './Dashboard'

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">控制台概览</h1>
          <p className="text-muted-foreground">
            系统状态、关键指标和快速操作
          </p>
        </div>
      </div>
      <Dashboard />
    </div>
  )
}