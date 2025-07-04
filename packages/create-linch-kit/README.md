# create-linch-kit

Create LinchKit apps instantly - AI-First 全栈开发框架脚手架

## 快速开始

```bash
# 使用 npx (推荐)
npx create-linch-kit my-app

# 或者使用 bun
bun create linch-kit my-app

# 或者使用 yarn
yarn create linch-kit my-app
```

## 命令选项

```bash
create-linch-kit [project-name] [options]

Options:
  -t, --template <template>  项目模板 (default: "default")
  --no-install              跳过依赖安装
  --no-git                  跳过 Git 初始化
  -h, --help                显示帮助信息
  -V, --version             显示版本号
```

## 创建后的步骤

1. **进入项目目录**
   ```bash
   cd my-app
   ```

2. **安装依赖** (如果使用了 --no-install)
   ```bash
   bun install
   # 或者
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 文件，配置数据库连接等
   ```

4. **初始化数据库**
   ```bash
   bun db:push
   ```

5. **创建管理员账户**
   ```bash
   bun create-admin
   ```

6. **启动开发服务器**
   ```bash
   bun dev
   ```

7. **访问应用**
   - 前端: http://localhost:3000
   - 管理后台: http://localhost:3000/dashboard

## 特性

- 🚀 **AI-First**: 专为 AI 开发优化的架构
- 📦 **开箱即用**: 预配置认证、数据库、UI 组件
- 🔒 **类型安全**: 端到端 TypeScript 类型安全
- 🎨 **现代 UI**: 基于 shadcn/ui + Tailwind CSS
- 🏗️ **模块化**: 高内聚、低耦合的包设计
- 📱 **响应式**: 完美适配移动端和桌面端

## 技术栈

- **框架**: Next.js 15.3+ + React 19
- **语言**: TypeScript 5.8+
- **样式**: Tailwind CSS 4.x + shadcn/ui
- **API**: tRPC + Zod Schema
- **数据库**: Prisma + PostgreSQL
- **认证**: NextAuth.js

## LinchKit 包

创建的项目包含以下 LinchKit 核心包：

- `@linch-kit/core` - 基础设施 (日志、配置、插件)
- `@linch-kit/schema` - Schema 引擎 (数据验证、转换)
- `@linch-kit/auth` - 认证授权 (用户、权限、会话)
- `@linch-kit/crud` - CRUD 操作 (通用数据操作)
- `@linch-kit/trpc` - API 层 (类型安全 API)
- `@linch-kit/ui` - UI 组件库 (统一组件)

## 许可证

MIT

## 更多信息

- [LinchKit 文档](https://github.com/laofahai/linch-kit)
- [示例项目](https://github.com/laofahai/linch-kit/tree/main/apps/starter)
- [问题反馈](https://github.com/laofahai/linch-kit/issues)