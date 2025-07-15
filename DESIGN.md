# LinchKit 架构设计文档

**项目版本**: v2.0.3 - Extension生态架构
**更新**: 2025-07-14  
**状态**: Extension系统已实现，持续优化中

## 🎯 系统定位

LinchKit 是一个 **AI-First 插件化生态平台**，基于 Extension 架构提供：

- **🏗️ 运行时核心** (`packages/*`) - 生产环境依赖的核心功能
- **🔧 开发工具** (`tools/*`) - AI 开发助手和构建工具  
- **🧩 Extension生态** (`extensions/*`) - 业务功能扩展
- **🚀 应用示例** (`apps/*`) - 集成示例和启动器

## 🏗️ 架构层次

### L0: 核心运行时 (packages/*)

```
packages/
├── core/          # 核心运行时、Extension管理器
├── auth/          # 认证授权、权限管理  
├── platform/     # 平台服务、数据访问
└── ui/           # 基础UI组件库
```

**设计原则**: 每个包都是功能完整的独立库，可单独使用

### L1: Extension系统 (extensions/*)

```
extensions/
├── console/       # 管理控制台Extension (核心)
├── blog-extension/    # 示例Extension
└── example-counter/   # 计数器Extension示例
```

**Extension特性**:
- 🔄 完整生命周期管理 (加载/激活/运行/停止)
- 🔒 权限验证和沙箱隔离
- 📊 性能监控和健康检查
- 🔥 热重载支持

### L2: 应用层 (apps/*)

```
apps/
└── starter/      # Next.js应用，集成Extension系统
```

### L3: 工具链 (tools/*)

```
tools/
├── ai-platform/  # AI开发助手 (Graph RAG, Guardian)
├── cli/          # 命令行工具
├── schema/       # Schema工具
└── testing/      # 测试工具
```

## 🔌 Extension架构详解

### Extension标准结构

```typescript
export interface ExtensionManifest {
  name: string
  version: string
  description: string
  main: string           // 入口文件
  exports: {
    api?: string         // API导出
    schema?: string      // Schema定义  
    components?: string  // UI组件
    hooks?: string       // React Hooks
  }
  dependencies: string[]
  permissions: Permission[]
}
```

### Extension生命周期

1. **加载阶段**: 读取manifest、验证依赖
2. **初始化阶段**: 执行Extension初始化代码
3. **激活阶段**: 注册API、组件、路由
4. **运行阶段**: 正常提供服务
5. **停止阶段**: 清理资源、注销服务

### Extension通信机制

- **事件总线**: Extension间松耦合通信
- **共享状态**: 通过Context共享数据
- **API调用**: 标准化的Extension API

## 🛡️ 安全与性能

### 权限控制
- 基于CASL的细粒度权限管理
- Extension沙箱隔离执行
- 运行时权限验证

### 性能优化
- Extension延迟加载
- 智能缓存策略
- 批量通信机制

## 🔄 开发工作流

### 新Extension开发

```bash
# 1. 创建Extension脚手架
bun create extension my-extension

# 2. 开发Extension功能
cd extensions/my-extension
bun dev

# 3. 集成到Starter应用
cd apps/starter
bun dev
```

### Extension热重载

开发环境支持：
- Extension代码更改自动重载
- 缓存智能清理
- 状态保持

## 📊 监控与诊断

### Extension健康监控
- 性能指标收集
- 错误率监控  
- 资源使用追踪

### 开发工具
- **AI Guardian**: 智能代码质量检查
- **Graph RAG**: 项目上下文查询
- **Claude Integration**: AI辅助开发

## 🎯 技术选型

- **Runtime**: Bun + TypeScript  
- **Frontend**: Next.js + React + TailwindCSS
- **Backend**: tRPC + Prisma
- **Testing**: bun:test + Playwright
- **AI Tools**: Neo4j + Graph RAG + Claude

## 📈 发展路线

### 已完成 ✅
- Extension系统核心架构
- Console Extension实现
- 沙箱执行环境 (isolated-vm)
- AI开发工具集成

### 进行中 🚧  
- Extension生态建设
- 性能优化
- 测试覆盖率提升

### 规划中 📋
- Extension市场
- 可视化Extension开发器
- 企业级Extension治理

---

**设计理念**: 稳定核心 + 繁荣生态 + AI原生开发体验