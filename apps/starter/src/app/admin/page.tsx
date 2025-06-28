// import { Dashboard } from '@linch-kit/console' // TODO: Fix server imports in console

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">欢迎使用 LinchKit 管理控制台</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">总租户数</h3>
          </div>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground">+2 相比上月</p>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">总用户数</h3>
          </div>
          <div className="text-2xl font-bold">1,234</div>
          <p className="text-xs text-muted-foreground">+15% 相比上月</p>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">活跃插件</h3>
          </div>
          <div className="text-2xl font-bold">8</div>
          <p className="text-xs text-muted-foreground">+1 新增</p>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">系统负载</h3>
          </div>
          <div className="text-2xl font-bold">45%</div>
          <p className="text-xs text-muted-foreground">正常运行</p>
        </div>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">系统状态</h3>
        <p className="text-sm text-muted-foreground">
          LinchKit Starter 应用已成功启动！Console 模块集成正在进行中...
        </p>
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            ✅ 基础架构已就绪：tRPC、Prisma、Authentication
          </p>
          <p className="text-sm text-green-800 mt-1">
            🔧 Console 模块正在修复服务端导入问题
          </p>
        </div>
      </div>
    </div>
  )
}