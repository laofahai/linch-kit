# LinchKit 插件系统架构与实践文档

## 🎯 项目背景

LinchKit 是一个基于 Next.js 的全栈开发框架，用于构建企业级低代码管理系统，具备插件化、模块化、快速开发、高可维护等特点。

## 🧩 插件系统设计目标

- 插件为一等公民，支持独立开发、注册、发布、升级
- 插件支持 schema 定义、页面组件、API 接口、任务调度、工作流注册等
- 插件之间支持依赖声明，可按需加载
- 插件应支持版本管理、灰度发布、注册回调等机制
- 支持未来 Web Component 化输出，便于跨框架复用（Vue/React）

---

## 📦 插件包结构建议

```bash
packages/
  plugin-wms/
    ├── plugin.config.ts        # 插件元信息与注册逻辑
    ├── schema/                 # Zod schema + i18n
    ├── components/             # 可选：React/Vue组件
    ├── api/                    # 可选：服务端接口
    ├── scheduler/              # 可选：任务注册
    └── workflow/               # 可选：流程节点

🧠 插件注册机制（以 definePlugin 为例）

// plugin.config.ts
import { definePlugin } from '@linch-kit/core'

export default definePlugin({
  name: 'plugin-wms',
  version: '1.0.0',
  schema: [/* Zod 定义 */],
  setup(ctx) {
    ctx.registerMenu({ title: '仓储管理', path: '/wms' })
    ctx.registerWorkflowNode(/* ... */)
    ctx.registerScheduledTask(/* ... */)
  },
})

    所有插件注册统一通过 setup(ctx) 回调执行

    注册器提供菜单、权限、工作流、任务调度、数据模型等接口

    系统初始化时批量加载插件，按需注册依赖模块

🚀 插件发布与版本管理

使用 TurboRepo + Changesets 进行插件版本管理与自动发布：

    pnpm changeset 添加变更日志

    pnpm changeset version 自动 bump 各插件版本

    pnpm changeset publish 发布到 npm / 内部 registry

    支持灰度发布、版本回滚、插件禁用等机制

🔄 插件依赖与互通机制

    插件可声明依赖其他插件

    插件注册内容通过共享注册中心暴露给其他模块（如任务调度器、流程引擎等）

    支持模块懒加载与生命周期控制

🧭 插件与工作流系统集成

    插件可注册流程节点（如“审批通过”、“拣货完成”等）

    节点包含字段 schema、校验逻辑、后端处理器

    系统通过流程引擎动态组装完整业务流

🕒 插件与任务调度系统集成

    插件注册定时任务或事件触发型任务

    支持 cron 表达式、依赖任务、运行环境声明

    支持日志追踪、失败重试、锁机制等

ctx.registerScheduledTask({
  id: 'sync-stock',
  cron: '0 * * * *',
  handler: async () => {
    await syncStockFromWMS()
  },
})

🛠️ 插件开发与调试工作流

推荐基于 TurboRepo 建立开发流程：

# 构建当前插件
pnpm turbo run build --filter=plugin-wms

# 启动开发环境
pnpm dev

结合 plugin-dev-kit 应用，用于插件预览与调试。
📁 注册器机制（Registry）

插件通过统一注册器接口暴露功能：

    registerMenu()

    registerWorkflowNode()

    registerScheduledTask()

    registerPermission() 等

注册器会被系统扫描与挂载，构成最终系统能力。
🔒 插件隔离与安全

    插件作用域限制，避免修改核心功能

    提供沙箱接口注册机制（限制访问能力）

    支持插件验签、权限控制、启用/禁用策略

⚙️ 插件发布流程（SOP）

    创建插件 pnpm create plugin plugin-xxx

    添加 schema / 功能模块

    本地调试与预览

    添加 changeset

    发布构建产物

    系统后台启用插件

🧱 插件与实际业务 SOP 的关系

    插件本身承载对应的“业务 SOP 模型”（如仓储、进销存、任务调度）

    插件开发应包含 SOP 指南、表单配置、操作流程建议

    插件可作为“知识 + 系统”的打包单元，供企业内部移植与复用

🌀 工作流系统与插件之间的协同

    插件定义节点类型、字段、逻辑

    系统工作流引擎统一编排、执行

    插件提供前端界面与后端接口

    可视化流程编辑器支持插件节点拖入

✅ 技术选型回顾（基础架构）

    框架：Next.js（适合内部系统，不依赖 SEO，灵活拓展）

    构建工具：TurboRepo（高效 monorepo 构建）

    类型系统：Zod（用于表单/接口 schema 定义）

    注册机制：PluginContext + definePlugin

    前端 UI：shadcn/ui + React（未来支持 Web Component）

    后端：Next.js API Route / Edge Functions

    身份认证：NextAuth（支持 SSO / 密码登录 / 第三方登录）

    数据库：Prisma（支持多种关系型数据库）

🌟 后续可拓展方向

    插件市场（Marketplace）：插件注册中心 + UI 展示 + 安装机制

    插件灰度与版本控制：不同团队启用不同版本

    跨框架运行：插件输出 Web Component，兼容 Vue/React

    插件间依赖图分析与安全扫描

    插件执行权限沙箱机制

🏁 当前阶段目标建议

    先以内部使用为核心，规范插件结构与注册机制

    插件开发工具链打通（create, dev, build, publish）

    建立统一插件文档、开发规范与测试流程

    后期再考虑跨框架、远程部署、插件商城等复杂特性