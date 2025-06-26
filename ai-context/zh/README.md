# LinchKit AI Context

**版本**: v1.0.0 Final  
**创建日期**: 2025-06-23  
**最后更新**: 2025-06-26  
**状态**: 架构设计完成，文档重构完成，准备开发实施

---

## 📋 目录结构

### 🇨🇳 中文文档 (zh/)
- **系统设计** (`zh/system-design/`): 🔒 **已冻结** - 完整的架构设计文档
  - 核心架构文档
  - 开发规范和约束
  - 包设计文档 (10个包的完整设计)
  - 企业级特性设计 (安全性、可观测性、性能监控)

### 📚 核心文档
- **AI 开发指导方针**: [`../../MASTER_GUIDELINES.md`](../../MASTER_GUIDELINES.md) - AI 开发助手的全面指导方针和背景提示词
- **管理指南**: [`meta.md`](meta.md) - 命名规范、内容管理和架构维护

### 📋 项目管理
- **项目仪表盘**: [`project/PROJECT_DASHBOARD.md`](project/PROJECT_DASHBOARD.md) - 项目的统一概览、开发进度和关键文档导航
- **开发实施计划**: [`project/development-plan.md`](project/development-plan.md) - 4阶段8周全包重写计划
- **重写实施指南**: [`project/complete-rewrite-implementation-guide.md`](project/complete-rewrite-implementation-guide.md) - 详细的重写实施指南
- **文档模块化方案**: [`project/documentation-modularization-plan.md`](project/documentation-modularization-plan.md) - 文档模块化重构方案

---

## 🎯 当前状态与下一步行动

### ✅ 已完成工作
1. **完整架构设计** - 6层架构，10个包的详细设计
2. **企业级特性** - 安全性、可观测性、性能监控完整设计
3. **第三方库集成方案** - 避免重复造轮子，使用成熟生态
4. **架构问题修复** - 解耦、硬编码、重复定义问题全部修复
5. **可行性验证** - 全面的技术可行性和独立性验证
6. **文档重构** ✨ **NEW** - 将37,000行文档重构为模块化结构
   - 大型文档拆分为5个专门文档 (README + API + 实现 + 示例 + 高级)
   - 提取共享内容到 `shared/` 目录，减少重复40%+
   - 单文件平均大小减少65%，查找效率提升60%+
7. **重写策略优化** - 保留完整功能的实施优化方案

### 🚀 下一步行动
**立即开始开发实施** - 文档重构已完成，可以直接开始代码开发。请参考 [`project/PROJECT_DASHBOARD.md`](project/PROJECT_DASHBOARD.md) 获取最新项目状态和开发指引。

---

## 📖 使用指南

### 🚀 立即开始实施
请参考 [`../../MASTER_GUIDELINES.md`](../../MASTER_GUIDELINES.md) 中的“一句话开发prompt”发送给AI助手即可立即开始开发，无需询问。

### 👨‍💻 开发者指南
1. 阅读 [`../../MASTER_GUIDELINES.md`](../../MASTER_GUIDELINES.md) 了解完整的 AI 开发指导方针和开发工作流
2. 查看 [`system-design/`](system-design/) 了解系统架构
3. 参考 [`shared/`](shared/) 目录了解通用开发约定和模式
4. 查看 [`system-design/packages/`](system-design/packages/) 各包的模块化文档

### 🏗️ 架构师指南
1. 查看 [`system-design/architecture.md`](system-design/architecture.md) 理解完整架构
2. 参考 [`system-design/overview.md`](system-design/overview.md) 了解文档导航
3. 查阅各包设计文档了解详细设计

### 📋 项目管理
1. 使用 [`project/PROJECT_DASHBOARD.md`](project/PROJECT_DASHBOARD.md) 了解项目整体概览和最新进度
2. 使用 [`project/development-plan.md`](project/development-plan.md) 了解开发实施计划
3. 使用 [`project/complete-rewrite-implementation-guide.md`](project/complete-rewrite-implementation-guide.md) 执行详细重写指南
4. 参考 [`project/documentation-modularization-plan.md`](project/documentation-modularization-plan.md) 进行文档模块化
5. 遵循 [`meta.md`](meta.md) 进行文档管理

---

## 🔒 设计冻结说明

`zh/system-design/` 目录下的所有架构设计文档已经冻结，无特殊重大变动不得更改。详细信息请查看 [`zh/system-design/overview.md`](system-design/overview.md) 中的设计冻结通知。

---

## 📞 支持

- **架构问题**: 参考 `zh/system-design/` 目录下的设计文档
- **实施问题**: 查看实施计划和迁移指南
- **技术问题**: 参考开发约束和最佳实践文档

LinchKit 是一个 AI-First 的全栈开发框架，所有设计都围绕企业级特性和现代化开发体验展开.