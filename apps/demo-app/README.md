# LinchKit Demo App

> LinchKit 功能验证和演示平台 - 展示框架核心能力的交互式演示应用

## 📋 概述

LinchKit Demo App 是一个功能完整的演示应用，旨在展示 LinchKit 框架的所有核心功能和最佳实践。通过交互式界面，开发者可以快速了解和体验 LinchKit 的强大能力。

### 🎯 应用定位

- **功能验证平台** - 验证 LinchKit 包的集成和功能正确性
- **学习参考** - 为开发者提供实际的使用示例和代码参考
- **开发测试** - 在开发过程中快速测试新功能和 API 变更
- **用户体验展示** - 向潜在用户展示 LinchKit 的完整能力

## ✨ 核心功能模块

### 🏗️ Schema 模块演示
- **动态 Schema 定义** - 实时创建和修改 Schema
- **代码生成预览** - 展示 Prisma、TypeScript 代码生成结果
- **字段类型展示** - 涵盖所有支持的字段类型和验证规则
- **关系定义** - OneToOne、OneToMany、ManyToMany 关系演示

### 🔐 Auth 模块演示
- **多提供商认证** - 展示 Google、GitHub、邮箱登录
- **权限系统** - RBAC/ABAC 权限控制演示
- **多租户切换** - 租户隔离和切换功能
- **会话管理** - 令牌刷新、登出等会话操作

### 🚀 tRPC 模块演示
- **端到端类型安全** - 展示从服务端到客户端的类型安全
- **实时查询** - useQuery、useMutation 的实际使用
- **订阅功能** - WebSocket 实时数据订阅
- **错误处理** - 优雅的错误处理和用户反馈

### ⚙️ Config 模块演示
- **动态配置管理** - 运行时配置读取和更新
- **环境变量** - 不同环境下的配置管理
- **配置验证** - Schema 驱动的配置验证
- **热重载** - 配置变更的实时响应

### 🧩 Plugins 模块演示
- **插件市场** - 插件发现、安装、配置
- **生命周期管理** - 插件启用、禁用、卸载
- **插件开发** - 自定义插件开发示例
- **插件通信** - 插件间的事件通信机制

### 🌐 I18n 模块演示
- **多语言切换** - 中英文界面切换
- **动态加载** - 按需加载语言包
- **格式化支持** - 数字、日期、货币格式化
- **复数规则** - 不同语言的复数形式处理

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- bun >= 1.0
- PostgreSQL >= 13 (用于数据演示)

### 安装和启动

```bash
# 克隆项目
git clone https://github.com/laofahai/linch-kit.git

# 进入演示应用目录
cd linch-kit/apps/demo-app

# 安装依赖
bun install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置数据库连接

# 初始化数据库
bun run db:push
bun run db:seed

# 启动开发服务器
bun dev
```

### 配置说明

创建 `.env` 文件：

```bash
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/linchkit_demo"

# NextAuth.js 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth 提供商 (可选)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# LinchKit 配置
LINCHKIT_API_URL="http://localhost:3000/api"
LINCHKIT_LOG_LEVEL="info"
```

### 项目结构

```
apps/demo-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/              # 认证相关页面
│   │   ├── config/            # 配置管理页面
│   │   ├── i18n/              # 国际化页面
│   │   ├── plugins/           # 插件管理页面
│   │   ├── schema/            # Schema 管理页面
│   │   ├── trpc/              # tRPC 演示页面
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 首页
│   ├── components/            # React 组件
│   │   ├── auth/              # 认证组件
│   │   ├── config/            # 配置组件
│   │   ├── i18n/              # 国际化组件
│   │   ├── layout/            # 布局组件
│   │   ├── plugins/           # 插件组件
│   │   ├── providers/         # Provider 组件
│   │   └── schema/            # Schema 组件
│   ├── server/                # 服务端代码
│   │   ├── trpc.ts           # tRPC 配置
│   │   └── user-router.ts    # 用户路由
│   └── utils/                 # 工具函数
│       └── trpc.ts           # tRPC 客户端配置
├── prisma/                    # 数据库 Schema
│   ├── schema.prisma         # Prisma Schema
│   └── seed.ts               # 数据种子
├── scripts/                   # 脚本文件
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

## 🎮 功能使用指南

### Schema 演示使用

1. **访问 Schema 页面**: `http://localhost:3000/schema`
2. **创建新 Schema**: 点击"创建 Schema"按钮
3. **添加字段**: 使用字段编辑器添加不同类型的字段
4. **设置关系**: 定义 Schema 之间的关系
5. **预览代码**: 查看生成的 Prisma 和 TypeScript 代码
6. **导出 Schema**: 下载生成的 Schema 文件

### Auth 演示使用

1. **访问认证页面**: `http://localhost:3000/auth`
2. **选择登录方式**: 邮箱、Google 或 GitHub
3. **体验权限控制**: 不同角色看到不同的功能
4. **租户切换**: 在多个租户间切换
5. **会话管理**: 查看和管理用户会话

### tRPC 演示使用

1. **访问 tRPC 页面**: `http://localhost:3000/trpc`
2. **查询数据**: 使用 useQuery 钩子获取数据
3. **修改数据**: 使用 useMutation 钩子修改数据
4. **实时订阅**: 体验 WebSocket 实时数据
5. **错误处理**: 查看错误处理机制

### Config 演示使用

1. **访问配置页面**: `http://localhost:3000/config`
2. **查看配置**: 查看当前应用配置
3. **修改配置**: 动态修改配置值
4. **验证配置**: 体验配置验证功能
5. **重载配置**: 测试配置热重载

### Plugins 演示使用

1. **访问插件页面**: `http://localhost:3000/plugins`
2. **浏览插件**: 查看可用插件列表
3. **安装插件**: 模拟插件安装过程
4. **配置插件**: 设置插件参数
5. **插件通信**: 测试插件间通信

### I18n 演示使用

1. **访问国际化页面**: `http://localhost:3000/i18n`
2. **切换语言**: 在中英文间切换
3. **格式化演示**: 查看数字、日期格式化
4. **复数处理**: 体验复数形式处理
5. **动态翻译**: 测试动态翻译加载

## 🔧 开发指南

### 添加新的演示模块

1. **创建页面组件**:
```typescript
// src/app/new-feature/page.tsx
import { NewFeatureDemo } from '@/components/new-feature/NewFeatureDemo'

export default function NewFeaturePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">New Feature Demo</h1>
      <NewFeatureDemo />
    </div>
  )
}
```

2. **创建演示组件**:
```typescript
// src/components/new-feature/NewFeatureDemo.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@linch-kit/ui'

export function NewFeatureDemo() {
  const [demoState, setDemoState] = useState({})
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>New Feature Demonstration</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 演示内容 */}
      </CardContent>
    </Card>
  )
}
```

3. **添加导航链接**:
```typescript
// src/components/layout/Navigation.tsx
const navItems = [
  // ... 现有项目
  { href: '/new-feature', label: 'New Feature' }
]
```

### 集成新的 LinchKit 包

1. **安装包依赖**:
```bash
bun add @linch-kit/new-package
```

2. **配置 Provider**:
```typescript
// src/components/providers/LinchKitProvider.tsx
import { NewPackageProvider } from '@linch-kit/new-package'

export function LinchKitProvider({ children }) {
  return (
    <ConfigProvider config={config}>
      <AuthProvider>
        <NewPackageProvider>
          {children}
        </NewPackageProvider>
      </AuthProvider>
    </ConfigProvider>
  )
}
```

3. **创建演示组件**:
```typescript
// src/components/new-package/PackageDemo.tsx
import { useNewPackage } from '@linch-kit/new-package'

export function PackageDemo() {
  const { data, isLoading } = useNewPackage()
  
  // 演示组件实现
}
```

### 添加测试

```typescript
// src/components/__tests__/SchemaDemo.test.tsx
import { render, screen } from '@testing-library/react'
import { SchemaDemo } from '../schema/SchemaDemo'

describe('SchemaDemo', () => {
  test('renders schema creation form', () => {
    render(<SchemaDemo />)
    expect(screen.getByText('Create Schema')).toBeInTheDocument()
  })
  
  test('generates code preview', async () => {
    render(<SchemaDemo />)
    // 测试代码生成功能
  })
})
```

## 📊 性能监控

Demo App 集成了性能监控功能：

### Web Vitals 监控

```typescript
// src/app/layout.tsx
import { WebVitals } from '@/components/performance/WebVitals'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <WebVitals />
      </body>
    </html>
  )
}
```

### 组件性能优化

```typescript
// 使用 React.memo 优化重渲染
export const SchemaPreview = React.memo(({ schema }: { schema: Schema }) => {
  // 组件实现
})

// 使用 useMemo 缓存计算结果
const generatedCode = useMemo(() => {
  return generatePrismaSchema(schema)
}, [schema])
```

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
bun test

# 运行特定测试文件
bun test src/components/schema/SchemaDemo.test.tsx

# 运行测试并生成覆盖率报告
bun test --coverage

# 观察模式
bun test --watch
```

### 测试结构

```
src/
├── components/
│   └── __tests__/         # 组件测试
├── utils/
│   └── __tests__/         # 工具函数测试
└── server/
    └── __tests__/         # 服务端测试
```

## 🚨 故障排除

### 常见问题

#### 1. 数据库连接失败

```
Error: P1001 Can't reach database server
```

**解决方案**：
1. 检查 PostgreSQL 服务是否运行
2. 验证 `DATABASE_URL` 配置
3. 确认数据库用户权限

```bash
# 检查 PostgreSQL 状态
pg_ctl status

# 重启 PostgreSQL
pg_ctl restart
```

#### 2. OAuth 登录失败

```
Error: OAuth configuration error
```

**解决方案**：
1. 检查 OAuth 应用配置
2. 验证回调 URL 设置
3. 确认客户端 ID 和密钥正确

#### 3. tRPC 调用失败

```
Error: TRPCClientError: INTERNAL_SERVER_ERROR
```

**解决方案**：
1. 检查服务端路由配置
2. 验证中间件设置
3. 查看服务端日志

### 调试技巧

```bash
# 启用详细日志
export LINCHKIT_LOG_LEVEL=debug

# 启用 tRPC 调试
export TRPC_DEBUG=true

# 启动应用
bun dev
```

## 🤝 贡献

### 贡献新功能

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/new-demo`
3. 添加演示组件和文档
4. 提交更改: `git commit -m 'Add new demo feature'`
5. 推送分支: `git push origin feature/new-demo`
6. 创建 Pull Request

### 报告问题

如果发现 Bug 或有改进建议：

1. 访问 [Issues 页面](https://github.com/laofahai/linch-kit/issues)
2. 搜索已有问题
3. 创建新问题，详细描述问题和复现步骤

## 📄 许可证

MIT License - 查看 [LICENSE](../../LICENSE) 文件了解详情。

## 🔗 相关链接

- 🏠 [LinchKit 主项目](https://github.com/laofahai/linch-kit)
- 📚 [LinchKit 文档](https://kit.linch.tech)
- 🚀 [Starter 应用](../starter/README.md)
- 🌐 [官网应用](../website/README.md)
- 💬 [讨论社区](https://github.com/laofahai/linch-kit/discussions)

---

**LinchKit Demo App** 是了解和学习 LinchKit 框架的最佳入口，通过实际操作快速掌握框架的强大功能。