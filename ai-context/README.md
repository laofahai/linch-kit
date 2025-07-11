# LinchKit AI Context 知识库

**版本**: v8.0  
**更新**: 2025-07-11  
**状态**: 重构完成 - 清晰的分层文档结构

## 🗂️ 目录结构

### 00_Core - 核心约束 (按需快速加载)

**分层优化架构** - 按上下文大小和任务类型智能加载：

- **essential-rules.md** - 【3-4KB】核心开发约束精简版
- **quick-checklist.md** - 【1KB】快速检查清单 (30秒-2分钟)

### 00_Getting_Started - 新手入门和日常开发

面向新人和日常开发的基础文档：

- **01_LinchKit_Intro.md** - LinchKit项目介绍和愿景
- **02_Quick_Start.md** - 快速上手指南

### 01_Architecture - 架构深度文档

系统架构和设计文档：

- **01_Core_Principles.md** - 核心设计原则
- **02_System_Architecture.md** - 系统架构概述
- **03_Package_Architecture.md** - 包架构设计
- **04_Complete_Architecture.md** - 完整架构设计
- **05_Advanced_Strategies.md** - 高级策略
- **06_Frontend_Architecture.md** - 前端架构
- **07_Strategic_Architecture_Evolution.md** - 战略架构演进
- **08_AI_First_Strategic_Integration.md** - AI优先战略整合
- **Extension_System.md** - 【整合】Extension系统统一架构

### 01_Quality - 质量保证

AI代码质量和标准：

- **ai-code-quality.md** - AI代码质量标准和机制

### 02_Advanced - 高级功能

高级场景和应急处理：

- **disaster-recovery.md** - 灾难恢复和应急响应

### 02_Guides - 开发指南

详细的开发指南和标准：

- **01_Development_Workflow.md** - 【权威】开发工作流程（已整合v8.0约束）
- **02_AI_Tools_Usage.md** - AI工具使用指南
- **03_AI_Collaboration.md** - AI协作框架
- **04_Module_Development.md** - 模块开发指南

### 02_Standards_and_Guides - 专项标准

专项标准和高级指南：

- **ai-code-quality.md** - AI代码质量标准
- **testing-standards.md** - 测试标准
- **smart-loading-guide.md** - 智能加载指南
- **ai-quality.config.ts** - AI质量配置
- **eslint.config.strict.js** - 严格ESLint配置
- **tsconfig.strict.json** - 严格TypeScript配置

### 03_Reference - 参考资料

API文档和配置参考：

- **01_Packages_API/** - 包API文档
- **02_Configuration.md** - 配置参考
- **02_Package_Reports/** - 包完整性报告
- **03_Dependency_Analysis.md** - 依赖分析
- **04_Extension_Schema.md** - Extension模式

### 98_Project_Management - 项目管理

项目管理相关文档：

- **01_Roadmap.md** - 路线图
- **02_Development_Status.md** - 开发状态
- **04_Documentation_Audit_Report.md** - 文档审计报告

### 99_Archive - 归档

历史文档和升级计划：

- **v8-upgrade-plan/** - v8升级计划文档
- **governance/** - 治理文档
- **modules/** - 模块文档

## 🎯 快速导航

### 开发者日常使用

1. **快速开始** → `00_Core/essential-rules.md` 【3-4KB核心约束】
2. **检查清单** → `00_Core/quick-checklist.md` 【1KB快速验证】
3. **新手入门** → `00_Getting_Started/02_Quick_Start.md`
4. **完整约束** → `02_Guides/01_Development_Workflow.md` 【权威文档】
5. **AI工具使用** → `02_Guides/02_AI_Tools_Usage.md`
6. **包架构参考** → `01_Architecture/03_Package_Architecture.md`

### AI助手（Claude）使用

1. **启动必读** → `manifest.json`
2. **核心约束** → `00_Core/essential-rules.md` 【优先加载】
3. **快速验证** → `00_Core/quick-checklist.md` 【必须检查】
4. **AI质量标准** → `01_Quality/ai-code-quality.md`
5. **完整约束** → `02_Guides/01_Development_Workflow.md`
6. **AI协作** → `02_Guides/03_AI_Collaboration.md`
7. **智能加载** → `02_Standards_and_Guides/smart-loading-guide.md`

### 架构设计参考

1. **系统架构** → `01_Architecture/02_System_Architecture.md`
2. **Extension系统** → `01_Architecture/Extension_System.md`
3. **战略演进** → `01_Architecture/07_Strategic_Architecture_Evolution.md`
4. **AI集成** → `01_Architecture/08_AI_First_Strategic_Integration.md`

## 📋 重要变更说明

### v8.0 重构亮点

1. **🎯 分层优化架构** - 按上下文大小和任务类型智能加载
2. **⚡ 核心约束精简** - 3-4KB核心约束 + 1KB快速检查清单
3. **🧠 AI质量保证** - 专门的AI代码质量标准和机制
4. **🚨 应急响应** - 完整的灾难恢复和应急处理计划
5. **📊 智能推荐** - 基于任务类型的文档智能推荐
6. **🔄 统一核心约束** - 将分散的约束整合到分层架构
7. **🗂️ 清晰目录结构** - 按使用场景重新组织目录
8. **📋 Extension系统整合** - 合并重复的Extension文档
9. **📚 归档历史内容** - 保留所有历史内容在99_Archive
10. **🔗 向后兼容** - 保持所有重要路径的向后兼容性

### 文档迁移对照表

| 旧路径                                     | 新路径                                | 说明                    |
| ------------------------------------------ | ------------------------------------- | ----------------------- |
| ❌ **新增**                                | `00_Core/essential-rules.md`          | 【新增】3-4KB核心约束   |
| ❌ **新增**                                | `00_Core/quick-checklist.md`          | 【新增】1KB快速检查清单 |
| ❌ **新增**                                | `01_Quality/ai-code-quality.md`       | 【新增】AI代码质量标准  |
| ❌ **新增**                                | `02_Advanced/disaster-recovery.md`    | 【新增】灾难恢复计划    |
| `01_Concepts/08_Extension_Architecture.md` | `01_Architecture/Extension_System.md` | 整合Extension文档       |
| `01_Concepts/09_Extension_System.md`       | `01_Architecture/Extension_System.md` | 整合Extension文档       |
| `v8-upgrade-plan/`                         | `99_Archive/v8-upgrade-plan/`         | 移动到归档              |

## 🔍 使用建议

### 对开发者

1. **⚡ 快速开始** - 优先阅读 `00_Core/essential-rules.md` (3-4KB)
2. **📋 每日检查** - 使用 `00_Core/quick-checklist.md` (1KB)
3. **📖 日常开发** - 参考 `02_Guides/01_Development_Workflow.md`
4. **🏗️ 架构设计** - 参考 `01_Architecture/` 目录下的文档
5. **📊 专项标准** - 查看 `02_Standards_and_Guides/` 目录

### 对Claude AI

1. **📋 Session启动** - 必读 `manifest.json` 和 `00_Core/essential-rules.md`
2. **⚡ 快速验证** - 使用 `00_Core/quick-checklist.md` 检查
3. **🧠 AI质量** - 遵循 `01_Quality/ai-code-quality.md` 标准
4. **🚨 应急处理** - 参考 `02_Advanced/disaster-recovery.md`
5. **📊 智能加载** - 根据任务类型选择合适的文档
6. **🔍 上下文理解** - 使用Graph RAG查询相关文档

### 对项目管理

1. **项目状态** - 查看 `98_Project_Management/` 目录
2. **路线图** - 参考 `98_Project_Management/01_Roadmap.md`
3. **历史记录** - 查看 `99_Archive/` 目录

---

**重构完成**: 所有内容已妥善整理，无内容丢失  
**核心原则**: 单一信息源，清晰结构，向后兼容  
**维护者**: Claude AI 🤖
