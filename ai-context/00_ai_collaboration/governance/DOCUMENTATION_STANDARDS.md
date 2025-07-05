# 文档标准规范 (Documentation Standards)

**版本**: 2.0  
**状态**: 生效中  
**目标**: 统一文档格式、内容要求和AI标识规范

---

## 📋 文档分类与位置 (Document Classification & Location)

### 🤖 AI协作文档
**位置**: `ai-context/00_ai_collaboration/`
- 主指南和治理规范
- AI助手必读文档

### 🏗️ 架构与策略文档  
**位置**: `ai-context/01_strategy_and_architecture/`
- 技术决策和架构设计
- 开发约束和工作流程

### 📚 知识库文档
**位置**: `ai-context/02_knowledge_base/`
- API参考文档
- 包完整性报告
- 技术分析报告

### 📈 规划文档
**位置**: `ai-context/03_planning/`  
- 路线图和开发计划
- 状态跟踪文档

---

## 📝 文档格式标准 (Document Format Standards)

### 必需元数据 (Required Metadata)
每个文档必须包含：
```markdown
# 文档标题 (English Title)

**版本**: x.y  
**状态**: 生效中/草稿/废弃  
**创建**: YYYY-MM-DD  
**更新**: YYYY-MM-DD  
**目标**: 文档目的和受众说明
**AI-Assisted**: true/false
```

### 标题层级规范 (Heading Hierarchy)
- `#` - 文档主标题 (一个)
- `##` - 主要章节
- `###` - 子章节  
- `####` - 细分内容 (避免过深层级)

### 代码块规范 (Code Block Standards)
```markdown
# 指定语言类型
```typescript
// TypeScript 代码示例
interface Example {
  name: string;
}
```

# 配置文件
```json
{
  "name": "example"
}
```

# Shell 命令
```bash
bun install
```
```

### 链接规范 (Link Standards)
- **内部链接**: 使用相对路径 `[文档](./path/to/doc.md)`
- **外部链接**: 使用完整URL `[Next.js](https://nextjs.org)`
- **锚点链接**: `[章节](#章节标题)`

---

## 🏷️ AI 协作标识规范 (AI Collaboration Tagging)

### 内容来源标识
**人类原创内容**: 默认不标记

**AI 辅助生成**: 在元数据中标记
```markdown
**AI-Assisted**: true
```

**AI 完全生成**: 文档末尾添加
```markdown
---
🤖 **Generated with [Claude Code](https://claude.ai/code)**  
**Co-Authored-By**: Claude <noreply@anthropic.com>
```

**混合内容**: 在相关章节标注
```markdown
## 章节标题 [AI-Generated]
内容...

## 另一章节 [AI-Enhanced]  
内容...
```

### 变更追踪标识
```markdown
## 📝 变更日志 (Change Log)

| 版本 | 日期 | 变更说明 | 贡献者 |
|------|------|----------|--------|
| 2.0 | 2025-07-05 | AI辅助重构整合 | Claude + 人类 |
| 1.0 | 2025-01-05 | 初始版本 | 人类 |
```

---

## 📄 文档模板 (Document Templates)

### API文档模板
```markdown
# @linch-kit/package-name API 参考

**版本**: x.y  
**状态**: 生产就绪/开发中  
**AI-Assisted**: true/false  
**目标**: 为开发者提供完整的API参考

## 概述 (Overview)
包的核心功能和用途...

## 安装 (Installation)
```bash
bun add @linch-kit/package-name
```

## 快速开始 (Quick Start)
```typescript
import { MainFunction } from '@linch-kit/package-name';
```

## API 参考 (API Reference)
### 函数 (Functions)
### 类型 (Types)  
### 接口 (Interfaces)

## 示例 (Examples)
实际使用案例...

## 已知问题 (Known Issues)
限制和注意事项...
```

### 设计文档模板
```markdown
# 模块/功能设计文档

**版本**: x.y  
**状态**: 草稿/审查中/已批准  
**AI-Assisted**: true/false  
**目标**: 详细描述设计决策和实现方案

## 背景 (Background)
问题描述和需求分析...

## 目标 (Goals)
要解决的具体问题...

## 设计方案 (Design)
### 架构概览
### 接口设计
### 数据流

## 实现计划 (Implementation Plan)
分步实施策略...

## 验收标准 (Acceptance Criteria)
成功完成的标准...
```

---

## 🔍 质量检查清单 (Quality Checklist)

### ✅ 内容质量
- [ ] 信息准确性已验证
- [ ] 覆盖所有必要信息
- [ ] 逻辑结构清晰
- [ ] 语言简洁易懂
- [ ] 代码示例可运行

### ✅ 格式规范
- [ ] 元数据完整
- [ ] 标题层级正确
- [ ] 代码块指定语言
- [ ] 链接路径正确
- [ ] AI标识规范

### ✅ 一致性
- [ ] 术语使用统一
- [ ] 风格与项目保持一致
- [ ] 引用关系正确
- [ ] 版本信息同步

---

## 🔄 文档生命周期 (Document Lifecycle)

### 1. 创建阶段 (Creation)
- 确定文档类型和位置
- 使用标准模板
- 添加完整元数据
- 标记AI协作状态

### 2. 审查阶段 (Review)
- 内容准确性检查
- 格式规范验证
- 链接有效性测试
- 同行评审

### 3. 发布阶段 (Publishing)
- 合并到主分支
- 更新索引文件
- 通知相关人员

### 4. 维护阶段 (Maintenance)
- 定期内容更新
- 链接有效性检查
- 版本同步管理
- 归档过时内容

---

## 📊 自动化工具 (Automation Tools)

### 格式检查
```bash
# Markdown 格式检查
markdownlint ai-context/**/*.md

# 链接有效性检查
markdown-link-check ai-context/**/*.md

# 拼写检查
cspell "ai-context/**/*.md"
```

### 文档生成
```bash
# API文档自动生成
typedoc --out docs packages/*/src

# 依赖关系图
madge --image graph.svg packages/
```

---

## 🚨 常见问题处理 (Common Issues)

### 链接失效 (Broken Links)
- 使用相对路径避免绝对路径问题
- 定期运行链接检查工具
- 文件移动时同步更新引用

### 版本不同步 (Version Mismatch)
- 代码变更时同步更新文档
- 使用自动化工具检测不一致
- 在CI中强制文档验证

### 重复内容 (Duplicate Content)
- 使用链接引用避免复制粘贴
- 建立单一信息源原则
- 定期审查和整合重复内容

---

**整合来源**: KNOWLEDGE_BASE_GOVERNANCE.md, TEMP_DOCUMENTATION_PLAN.md  
**AI-Assisted**: true