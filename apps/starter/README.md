# LinchKit Starter Application

**AI-First 全栈开发框架 - 企业级生产应用**

LinchKit Starter 是基于 LinchKit 框架构建的生产就绪的企业级应用模板，集成了完整的 AI-First 全栈开发能力。

## 🚀 特性

- **🤖 AI-First 架构** - 所有设计都优先考虑 AI 理解和处理能力
- **📐 Schema 驱动** - 以 Zod Schema 为单一数据源，驱动整个系统
- **🔒 端到端类型安全** - 完整的 TypeScript 类型安全保障
- **🎨 现代化 UI** - shadcn/ui + Tailwind CSS 4 + 主题系统
- **🔐 企业级认证** - NextAuth.js 5.0 + 权限管理
- **📊 管理控制台** - 基于 @linch-kit/console 的企业级管理功能
- **🌐 多语言支持** - 内置国际化支持
- **⚡ 高性能** - Next.js 15 + React 19 + Turbopack

## 🏗️ 技术栈

### 前端
- **Next.js 15.3.4** - App Router + Server Components
- **React 19** - 最新的 React 特性
- **TypeScript 5** - 严格类型检查
- **Tailwind CSS 4** - 现代化样式框架
- **shadcn/ui** - 高质量 UI 组件库

### 后端
- **tRPC** - 端到端类型安全的 API
- **Prisma** - 现代化数据库 ORM
- **NextAuth.js 5.0** - 完整的认证解决方案
- **PostgreSQL** - 生产级数据库

### LinchKit 包
- **@linch-kit/core** - 核心基础设施（日志、配置、插件）
- **@linch-kit/schema** - Schema 定义和验证
- **@linch-kit/auth** - 认证和权限管理
- **@linch-kit/crud** - 通用 CRUD 操作
- **@linch-kit/trpc** - 类型安全 API 层
- **@linch-kit/ui** - UI 组件库
- **@linch-kit/console** - 企业级管理控制台

## 🎯 快速开始

### 1. 项目初始化

```bash
# 安装依赖
bun install

# 初始化项目（数据库、配置等）
bun run init

# 生成 Prisma 客户端
bun run db:generate

# 推送数据库模式
bun run db:push
```

### 2. 开发环境

```bash
# 启动开发服务器
bun dev

# 或使用 Turbopack (更快的热重载)
bun run dev:turbo
```

### 3. 访问应用

- **主页**: [http://localhost:3000](http://localhost:3000)
- **业务 Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **管理控制台**: [http://localhost:3000/admin](http://localhost:3000/admin)

## 🛠️ 开发命令

```bash
# 开发
bun dev                    # 启动开发服务器
bun run dev:turbo         # 使用 Turbopack 启动

# 构建
bun run build             # 构建生产版本
bun run start             # 启动生产服务器

# 代码质量
bun run lint              # ESLint 检查
bun run type-check        # TypeScript 类型检查
bun run validate          # 完整验证（构建+lint+类型检查）

# 数据库
bun run db:generate       # 生成 Prisma 客户端
bun run db:push           # 推送数据库模式
bun run db:studio         # 打开 Prisma Studio
bun run db:test           # 测试数据库连接

# 管理
bun run create-admin      # 创建管理员用户
```

## 📁 项目结构

```
apps/starter/
├── app/                  # Next.js App Router
│   ├── (auth)/          # 认证相关页面
│   ├── api/             # API 路由
│   ├── dashboard/       # 业务 Dashboard
│   └── layout.tsx       # 根布局
├── components/          # React 组件
│   ├── auth/           # 认证组件
│   ├── layout/         # 布局组件
│   ├── providers/      # Provider 组件
│   └── ui/             # UI 组件
├── lib/                # 工具库
│   ├── schemas/        # Zod Schema 定义
│   ├── services/       # 业务服务
│   └── stores/         # 状态管理
├── hooks/              # 自定义 Hooks
├── scripts/            # 脚本文件
└── prisma/             # 数据库模式
```

## 🔧 配置说明

### 环境变量

创建 `.env.local` 文件：

```env
# 数据库
DATABASE_URL="postgresql://username:password@localhost:5432/linchkit"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# 其他配置
NODE_ENV="development"
```

### 数据库设置

1. 安装 PostgreSQL
2. 创建数据库
3. 配置 `DATABASE_URL`
4. 运行 `bun run db:push`

## 🚀 部署

### Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### Docker 部署

```bash
# 构建镜像
docker build -t linchkit-starter .

# 运行容器
docker run -p 3000:3000 linchkit-starter
```

## 📚 学习资源

- [LinchKit 文档](../../README.md)
- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [shadcn/ui 文档](https://ui.shadcn.com)
- [tRPC 文档](https://trpc.io/docs)

## 🤝 贡献

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](../../LICENSE) 文件。

## 🆘 支持

如果遇到问题，请：

1. 查看 [FAQ](../../docs/FAQ.md)
2. 搜索 [Issues](../../issues)
3. 创建新的 [Issue](../../issues/new)

---

**LinchKit Framework** - 让 AI 驱动的全栈开发变得简单
