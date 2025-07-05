# LinchKit Starter-Console 集成路由架构设计

## 🎯 设计目标

创建统一的工作台体验，将 `@linch-kit/console` 管理功能无缝集成到 `starter` 应用中，提供基于权限的动态导航和多标签页工作区。

## 🏗️ 架构设计

### 路由架构选择

**选定方案：选项C - 统一 `/dashboard` 布局架构**

经过与 Gemini 的深入分析，我们采用嵌套布局结构：
- **根路径**: `/` 作为应用入口
- **主布局**: `/dashboard` 作为统一工作台布局
- **功能分组**: 子路由按功能模块分组

### 嵌套布局结构

```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── layout.tsx                 # 认证页面布局
└── (protected)/
    └── dashboard/
        ├── layout.tsx              # 主工作台布局 (权限保护)
        ├── page.tsx                # 默认仪表盘页面
        ├── admin/                  # 管理功能模块 (@linch-kit/console)
        │   ├── layout.tsx          # 管理区二级布局
        │   ├── page.tsx            # 管理概览页
        │   ├── users/
        │   │   ├── page.tsx        # 用户管理
        │   │   └── [id]/page.tsx   # 用户详情
        │   ├── tenants/
        │   │   ├── page.tsx        # 租户管理
        │   │   └── [id]/page.tsx   # 租户详情
        │   └── settings/
        │       ├── page.tsx        # 系统设置
        │       └── plugins/page.tsx # 插件管理
        ├── app/                    # 普通用户功能
        │   ├── page.tsx            # 应用主页
        │   └── projects/
        │       ├── page.tsx        # 项目列表
        │       └── [id]/page.tsx   # 项目详情
        └── settings/               # 个人设置
            ├── page.tsx            # 设置入口
            ├── profile/page.tsx    # 个人资料
            └── preferences/page.tsx # 偏好设置
```

## 🎨 用户体验设计

### 1. 统一工作台体验
- **单一入口**: 所有用户登录后都进入 `/dashboard`
- **动态导航**: 基于用户角色和权限动态生成侧边栏菜单
- **多标签页**: 支持同时打开多个功能页面
- **响应式设计**: 适配桌面端和移动端

### 2. 权限驱动界面
- **CASL 集成**: 使用 `@linch-kit/auth` 的 CASL 权限引擎
- **分层权限控制**:
  - **Layout 层**: 验证用户登录状态
  - **Route 层**: 检查功能模块访问权限
  - **Component 层**: 控制具体 UI 元素显示

### 3. 角色权限映射
| 角色 | 访问权限 | 主要功能 |
|------|----------|----------|
| `USER` | `/dashboard/app/*`, `/dashboard/settings/*` | 业务功能、个人设置 |
| `TENANT_ADMIN` | `USER` + `/dashboard/admin/users/*`, `/dashboard/admin/settings/*` | 用户管理、租户设置 |
| `SUPER_ADMIN` | 全部权限 | 系统管理、多租户管理 |

## 🔧 技术实现

### 1. 主布局组件 (`/dashboard/layout.tsx`)
```typescript
import { ConsoleProvider } from '@linch-kit/console'
import { AuthProvider } from '@linch-kit/auth'
import { Sidebar } from './components/sidebar'
import { Header } from './components/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <ConsoleProvider>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </ConsoleProvider>
    </AuthProvider>
  )
}
```

### 2. 动态侧边栏 (`/dashboard/components/sidebar.tsx`)
```typescript
import { usePermissions } from '@linch-kit/auth'
import { NavigationItem } from '@linch-kit/ui'

export function Sidebar() {
  const { can } = usePermissions()
  
  const menuItems = [
    { path: '/dashboard', label: '仪表盘', icon: 'dashboard' },
    { path: '/dashboard/app', label: '应用', icon: 'app' },
    can('manage', 'User') && {
      path: '/dashboard/admin/users',
      label: '用户管理',
      icon: 'users'
    },
    can('manage', 'Tenant') && {
      path: '/dashboard/admin/tenants',
      label: '租户管理',
      icon: 'tenants'
    },
    { path: '/dashboard/settings', label: '设置', icon: 'settings' }
  ].filter(Boolean)

  return (
    <aside className="w-64 bg-sidebar">
      <nav className="p-4">
        {menuItems.map((item) => (
          <NavigationItem key={item.path} {...item} />
        ))}
      </nav>
    </aside>
  )
}
```

### 3. 权限保护中间件 (`middleware.ts`)
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // 管理区域权限检查
  if (request.nextUrl.pathname.startsWith('/dashboard/admin')) {
    const hasAdminAccess = token.role === 'SUPER_ADMIN' || 
                          token.role === 'TENANT_ADMIN'
    
    if (!hasAdminAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/dashboard/:path*'
}
```

## 📦 Console 组件集成

### 1. 管理页面集成
- **用户管理**: 使用 `@linch-kit/console` 的 `UserManager` 组件
- **租户管理**: 使用 `TenantManager` 组件  
- **系统设置**: 使用 `SystemSettings` 组件
- **插件管理**: 使用 `PluginManager` 组件

### 2. 组件封装策略
```typescript
// /dashboard/admin/users/page.tsx
import { UserManager } from '@linch-kit/console'
import { AdminPageLayout } from '../components/layout'

export default function UsersPage() {
  return (
    <AdminPageLayout 
      title="用户管理" 
      breadcrumb={['管理', '用户管理']}
    >
      <UserManager />
    </AdminPageLayout>
  )
}
```

### 3. 样式统一
- **主题系统**: 使用 `@linch-kit/ui` 的统一主题
- **Tailwind CSS**: 基于 CSS 4.0 的配置
- **响应式设计**: 适配不同屏幕尺寸

## 🔒 安全设计

### 1. 认证机制
- **NextAuth.js 5.0**: 统一认证系统
- **JWT Token**: 安全的会话管理
- **多租户支持**: 租户级别的数据隔离

### 2. 权限控制
- **CASL 权限引擎**: 细粒度权限控制
- **路由守卫**: 防止未授权访问
- **API 保护**: 所有 API 调用都有权限检查

### 3. 数据安全
- **租户隔离**: 每个租户的数据完全隔离
- **审计日志**: 记录所有关键操作
- **敏感数据保护**: 密码、密钥等敏感信息加密存储

## 🚀 实现计划

### Phase 1: 基础架构 (本次实现)
- [ ] 创建嵌套布局结构
- [ ] 实现主工作台布局
- [ ] 集成权限保护中间件
- [ ] 创建动态导航组件

### Phase 2: Console 集成 (后续实现)
- [ ] 集成用户管理页面
- [ ] 集成租户管理页面
- [ ] 集成系统设置页面
- [ ] 完善权限控制逻辑

### Phase 3: 优化完善 (最后实现)
- [ ] 性能优化
- [ ] 移动端适配
- [ ] 国际化支持
- [ ] 测试覆盖

## 📋 验收标准

### 功能验收
- [ ] 用户可以通过单一入口访问所有功能
- [ ] 导航菜单根据权限动态显示
- [ ] 多标签页工作区正常运行
- [ ] 所有 Console 功能正常集成

### 技术验收
- [ ] 构建成功，无 TypeScript 错误
- [ ] ESLint 检查通过
- [ ] 权限控制正确实施
- [ ] 响应式设计在各设备上正常显示

### 性能验收
- [ ] 首页加载时间 < 2秒
- [ ] 路由切换响应时间 < 500ms
- [ ] 内存使用稳定，无内存泄漏

## 🔗 相关文档

- [LinchKit 核心架构](./ai-context/architecture/)
- [权限系统设计](./ai-context/architecture/permission-system.md)
- [Console 组件库文档](./packages/console/README.md)
- [UI 组件库文档](./packages/ui/README.md)

---

**设计决策记录**: 2025-07-05
**评审状态**: 待用户确认
**实施优先级**: 高