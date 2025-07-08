# @linch-kit/core

## 2.0.2

### Patch Changes

- 基础设施包稳定性和功能改进
  - 插件系统优化和性能提升
  - 配置管理增强，支持多租户场景
  - 可观测性模块稳定性改进
  - CLI 框架功能完善

## 2.0.1

### Patch Changes

- [#4](https://github.com/laofahai/linch-kit/pull/4) [`3292090`](https://github.com/laofahai/linch-kit/commit/32920903564d896acf78461bdde992d68402b246) Thanks [@laofahai](https://github.com/laofahai)! - fix: 修复TypeScript类型错误和CLI功能
  - 修复core包中i18n函数参数类型错误，确保类型安全
  - 扩展CLI类别支持，添加trpc、auth、crud、ui类别
  - 优化插件系统的稳定性和性能

## 2.0.0

### Major Changes

- 2e92857: feat: 首次发布 LinchKit Core v2.0.0 - AI-First 全栈开发框架基础设施

  @linch-kit/core 是 LinchKit 生态系统的核心基础设施包，提供：

  **核心特性：**
  - 🔌 完整的插件系统 - 生命周期管理、事件驱动架构、依赖解析
  - ⚙️ 配置管理 - 多租户隔离、Next.js 兼容、热更新支持
  - 📊 可观测性 - Prometheus 指标、OpenTelemetry 追踪、健康检查
  - 🛠️ CLI 框架 - 插件化命令行工具、现代化用户体验
  - 🌍 国际化 - 包级命名空间、传入式翻译、完整回退机制
  - 📝 审计系统 - 企业级审计日志、数据脱敏、多存储后端

  **技术特性：**
  - 完整的 TypeScript 类型支持
  - 客户端/服务端分离架构
  - 企业级性能和稳定性
  - 模块化和可扩展设计

  **架构定位：**
  - L0 层基础设施包
  - 为所有其他 LinchKit 包提供基础服务
  - 插件系统承载整个框架的扩展能力

## 1.0.2

### Patch Changes

- [`1e6cf4c`](https://github.com/laofahai/linch-kit/commit/1e6cf4c0fc9e036ba06f8243d772ac12753a147f) Thanks [@laofahai](https://github.com/laofahai)! - 发布 LinchKit Core v1.0.2 - 修复配置和发布流程
  - 修复插件系统的注册流程
  - 优化配置管理器的性能
  - 修复 CLI 命令的国际化支持

## 1.0.1

### Patch Changes

- 修复 CI/CD 和发布流程问题
  - 修复 TypeScript 配置和 lint 错误
  - 修复 ES 模块兼容性问题
  - 优化插件系统的稳定性
  - 完善可观测性模块的功能

## 1.0.0

### Minor Changes

- # LinchKit Core v1.0.0 - 基础设施包首次发布

  ## 🚀 核心功能

  ### 插件系统
  - 完整的插件生命周期管理
  - 事件驱动的插件架构
  - 插件依赖关系解析
  - 热插拔支持

  ### 配置管理
  - 多租户配置隔离
  - Next.js 环境变量集成
  - 配置文件监听和热更新
  - 类型安全的配置 API

  ### 可观测性
  - 基于 pino 的结构化日志
  - Prometheus 指标收集
  - OpenTelemetry 分布式追踪
  - 健康检查系统

  ### CLI 框架
  - 插件化命令行工具
  - 内置核心命令集
  - 国际化命令支持
  - 现代化用户体验

  ### 审计系统
  - 企业级审计日志
  - 敏感数据脱敏
  - 多种存储后端支持
  - 异步批量处理

  ## 🏗️ 架构设计
  - L0 层基础设施定位
  - 客户端/服务端功能分离
  - 完整的 TypeScript 类型支持
  - 模块化和可扩展设计

  ## 📈 性能特性
  - 高性能插件系统 (10,000+ ops/s)
  - 高效配置缓存 (100,000+ ops/s)
  - 低延迟指标收集 (<0.1ms)
  - 优化的内存使用

  这是 LinchKit 框架基础设施的首次正式发布，为整个生态系统提供稳定可靠的基础服务。

## 0.4.2

### Patch Changes

- 完善基础功能模块
  - 实现插件系统核心功能
  - 添加配置管理基础架构
  - 集成可观测性组件
  - 建立 CLI 命令框架

## 0.1.0

### Minor Changes

- 初始版本发布
  - 建立项目基础架构
  - 定义核心 API 接口
  - 实现基础功能模块
  - 搭建开发环境和工具链
