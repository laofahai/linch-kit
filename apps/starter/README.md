# LinchKit Starter

**AI-First 开发基座** - 基于 LinchKit 框架的最小化项目模板

## 🎯 项目定位

这是一个纯粹的开发基座，提供：

- ✅ **最小化配置** - 开箱即用的开发环境
- ✅ **LinchKit 集成** - 预配置的框架核心功能
- ✅ **现代化技术栈** - Next.js 15 + React 19 + TypeScript
- ✅ **类型安全** - 端到端 TypeScript 支持
- ✅ **开发示例** - 基本用法演示

## 🚀 快速开始

```bash
# 安装依赖
bun install

# 启动开发服务器
bun dev

# 构建生产版本
bun run build
```

## 📁 项目结构

```
apps/starter/
├── app/                  # Next.js App Router
│   ├── api/             # API 路由 (tRPC)
│   ├── examples/        # 功能示例
│   ├── docs/           # 开发文档
│   └── layout.tsx      # 根布局
├── components/         # React 组件
│   └── providers/      # Context Providers
├── lib/               # 工具库
│   └── trpc.ts        # tRPC 配置
└── package.json       # 最小化依赖
```

## 🛠️ 技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js | 15.3.4 |
| 运行时 | React | 19.0.0 |
| 语言 | TypeScript | 5.8.3 |
| API | tRPC | 11.4.3 |
| 样式 | Tailwind CSS | 4.x |
| 包管理 | Bun | 1.2.18 |

## 📦 LinchKit 集成

- `@linch-kit/core` - 核心功能 (日志、配置)
- `@linch-kit/ui` - UI 组件库

## 🎨 特性

- **类型安全** - 完整的 TypeScript 配置
- **tRPC 集成** - 端到端类型安全的 API
- **主题支持** - 明暗主题切换
- **开发友好** - 热重载 + Turbopack 支持
- **最小依赖** - 只包含必要的包

## 🔧 开发命令

```bash
# 开发
bun dev                # 启动开发服务器
bun run dev:turbo      # 使用 Turbopack

# 构建
bun run build          # 构建生产版本
bun start              # 启动生产服务器

# 质量检查
bun run lint           # ESLint 检查
bun run type-check     # TypeScript 检查
bun run validate       # 完整验证
```

## 📚 学习资源

- [LinchKit 文档](../../README.md)
- [示例页面](/examples) - 查看基本用法
- [开发文档](/docs) - 详细开发指南

## 🎯 下一步

1. 查看 `/examples` 了解基本功能
2. 阅读 `/docs` 学习开发指南
3. 编辑 `lib/trpc.ts` 添加您的 API
4. 在 `app/` 目录创建您的页面

---

**LinchKit Framework** - 让 AI 驱动的全栈开发变得简单