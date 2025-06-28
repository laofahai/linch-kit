# LinchKit Starter

生产级 AI-First 全栈开发框架 Starter 应用

## 🚀 特性

- ✅ **完整的 LinchKit 生态集成**
- ✅ **企业级管理控制台** (Console)
- ✅ **Schema 驱动开发**
- ✅ **类型安全的 API 层** (tRPC)
- ✅ **现代化 UI 组件库**
- ✅ **多租户架构支持**
- ✅ **细粒度权限控制**
- ✅ **国际化支持**

## 🏗️ 架构

```
LinchKit Starter
├── @linch-kit/core      - 基础设施
├── @linch-kit/schema    - Schema 引擎
├── @linch-kit/auth      - 认证授权
├── @linch-kit/crud      - CRUD 操作
├── @linch-kit/trpc      - API 层
├── @linch-kit/ui        - UI 组件
└── @linch-kit/console   - 管理控制台
```

## 🛠️ 开发

```bash
# 安装依赖
pnpm install

# 设置环境变量
cp .env.example .env.local

# 数据库初始化
pnpm db:generate
pnpm db:push
pnpm db:seed

# Schema 生成
pnpm schema:generate

# 开发服务器
pnpm dev
```

## 📁 项目结构

```
starter/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # 应用组件
│   ├── lib/             # 工具函数
│   ├── schemas/         # Schema 定义
│   └── server/          # 服务端逻辑
├── prisma/              # 数据库 Schema
├── public/              # 静态资源
└── docs/                # 文档
```

## 🔧 配置

### 环境变量

```bash
# 数据库
DATABASE_URL="postgresql://..."

# 认证
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# Console 配置
CONSOLE_BASE_PATH="/admin"
CONSOLE_FEATURES="dashboard,tenants,users,permissions,plugins"
```

### Console 集成

```typescript
// app/admin/layout.tsx
import { ConsoleProvider, createConsoleRoutes } from '@linch-kit/console'

export default function AdminLayout({ children }) {
  return (
    <ConsoleProvider
      config={{
        basePath: '/admin',
        features: ['dashboard', 'tenants', 'users'],
      }}
    >
      {children}
    </ConsoleProvider>
  )
}
```

## 📖 文档

- [开发指南](./docs/development.md)
- [部署指南](./docs/deployment.md)
- [API 参考](./docs/api.md)
- [Console 使用](./docs/console.md)

## 🚀 部署

### Vercel

```bash
# 一键部署
vercel --prod
```

### Docker

```bash
# 构建镜像
docker build -t linchkit-starter .

# 运行容器
docker run -p 3000:3000 linchkit-starter
```

## 📊 性能

- ⚡ **首次加载** < 2s
- 🔄 **热重载** < 100ms
- 📦 **包大小** < 500kb (gzipped)
- 🎯 **Lighthouse** 95+ 分

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License