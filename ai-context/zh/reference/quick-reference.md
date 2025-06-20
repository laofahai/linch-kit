# 快速参考索引

## 🎯 AI 助手快速导航

### 立即需要的信息
- **当前任务**: [工作交接指南](../management/handover-guide.md)
- **任务优先级**: [任务优先级管理](../management/task-priorities.md)
- **项目状态**: [当前进度](../management/current-progress.md)
- **快速上手**: [快速开始指南](../overview/quick-start.md)

### 项目理解
- **项目概览**: [项目总览](../overview/project-overview.md)
- **系统架构**: [系统架构详解](../architecture/system-architecture.md)
- **技术栈**: [技术栈说明](../architecture/tech-stack.md)
- **开发路线图**: [开发路线图](../management/roadmap.md)

### 包级信息
- **Core 包**: [CLI 和基础设施](../packages/core.md)
- **Schema 包**: [数据模式系统](../packages/schema.md)
- **Auth Core 包**: [认证和权限](../packages/auth-core.md)
- **CRUD 包**: [CRUD 操作核心](../packages/crud.md)
- **UI 包**: [UI 组件库](../packages/ui.md)

## 🔧 开发者快速导航

### 开发环境
- **快速开始**: [快速开始指南](../overview/quick-start.md)
- **开发流程**: [开发工作流程](../workflows/development.md)
- **构建系统**: [构建配置](../architecture/build-system.md)
- **故障排除**: [常见问题解决](./troubleshooting.md)

### 核心概念
- **Schema 驱动**: [Schema 系统](../packages/schema.md)
- **CLI 系统**: [命令参考](./commands.md)
- **权限系统**: [认证和权限](../packages/auth-core.md)
- **CRUD 操作**: [CRUD 包文档](../packages/crud.md)

### 配置和命令
- **配置参考**: [配置选项](./configuration.md)
- **CLI 命令**: [命令参考](./commands.md)
- **API 参考**: [API 文档](./api.md)

## 📋 按任务类型分类

### 🔥 紧急问题解决
- **数据库连接问题**: 检查 PgBouncer 配置和连接池设置
- **构建失败**: 运行 `pnpm clean && pnpm install && pnpm build`
- **包依赖问题**: 使用包管理器而非手动编辑配置文件

### 🚀 新功能开发
- **添加新实体**: [开发流程 - 实体开发](../workflows/development.md#实体开发)
- **添加新包**: [开发流程 - 包开发](../workflows/development.md#包开发)
- **添加新命令**: [Core 包 - 命令扩展](../packages/core.md#命令扩展)

### 🔧 系统维护
- **更新文档**: 遵循 JSDoc 增强标准和全栈文档规范
- **版本发布**: [发布流程](../workflows/release.md)
- **测试执行**: [测试策略](../workflows/testing.md)

### 📦 包管理
- **发布包**: [发布策略](../decisions/publishing-strategy.md)
- **版本管理**: [版本控制](../workflows/release.md#版本控制)
- **依赖更新**: [依赖管理](../architecture/package-dependencies.md)

## 🔍 按关键词索引

### A
- **API**: [API 参考](./api.md)
- **Auth**: [认证和权限](../packages/auth-core.md)
- **Architecture**: [系统架构](../architecture/system-architecture.md)

### C
- **CLI**: [命令参考](./commands.md), [Core 包](../packages/core.md)
- **Configuration**: [配置参考](./configuration.md)
- **CRUD**: [CRUD 包](../packages/crud.md)
- **Core**: [Core 包](../packages/core.md)

### D
- **Development**: [开发流程](../workflows/development.md)
- **Decisions**: [技术决策](../decisions/)

### P
- **Packages**: [包文档](../packages/)
- **Progress**: [当前进度](../management/current-progress.md)
- **Priorities**: [任务优先级](../management/task-priorities.md)

### S
- **Schema**: [Schema 包](../packages/schema.md)
- **System**: [系统架构](../architecture/system-architecture.md)

### T
- **Testing**: [测试策略](../workflows/testing.md)
- **Troubleshooting**: [故障排除](./troubleshooting.md)
- **Tasks**: [任务优先级](../management/task-priorities.md)

### U
- **UI**: [UI 包](../packages/ui.md)

### W
- **Workflows**: [工作流程](../workflows/)

## 📊 状态快速查看

### 包开发状态
- ✅ **@linch-kit/schema**: 已发布到 npm
- ✅ **@linch-kit/core**: 核心功能完成
- ✅ **@linch-kit/auth-core**: 重构完成
- ✅ **@linch-kit/crud**: 核心逻辑完成
- ✅ **@linch-kit/ui**: 基础组件完成
- 🔄 **@linch-kit/trpc**: 开发中
- 📋 **@linch-kit/crud-ui**: 待开发
- 📋 **@linch-kit/auth-ui**: 待开发

### 当前任务状态
- ✅ **已完成**: 数据库连接池问题修复
- ✅ **已完成**: 基本 CRUD 操作验证
- ✅ **已完成**: 健康检查 API 正常工作
- 🔴 **高优先级**: 用户管理 API 开发
- 🟡 **中优先级**: 认证流程实现
- 🟢 **低优先级**: 测试覆盖扩展

### 技术债务状态
- ✅ **已解决**: Prisma 连接池问题
- ✅ **已解决**: 数据库连接配置
- 🔴 **重要**: 测试覆盖率达标（≥85%）
- 🟡 **一般**: 性能优化实施
- 🟢 **低**: CI/CD 管道完善

## 🎯 常用操作快速链接

### 开发操作
- [启动开发环境](../overview/quick-start.md#开发环境设置)
- [运行测试](../workflows/testing.md#运行测试)
- [构建项目](../workflows/development.md#构建流程)
- [发布包](../workflows/release.md#发布流程)

### 调试操作
- **数据库问题**: 检查连接字符串和 PgBouncer 配置
- **构建问题**: 运行 `pnpm clean && pnpm build`
- **包依赖**: 使用 `pnpm install --force` 重新安装
- **查看日志**: 使用 `DEBUG=linch:* pnpm dev` 启用调试模式

### 文档操作
- [更新文档](../workflows/maintenance.md#文档维护)
- [添加新文档](../workflows/development.md#文档编写)
- [文档规范](../templates/documentation.md)

---

**最后更新**: 2025-06-20  
**维护**: 自动生成 + 手动维护  
**用途**: 快速定位项目信息和解决问题
