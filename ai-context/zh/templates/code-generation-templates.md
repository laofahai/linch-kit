# 代码生成模板库

## 概述

本文档包含 Linch Kit 项目中使用的代码生成模板，基于 Schema 驱动的开发模式。

> **注意**: 代码生成功能正在开发中，此文档为规划阶段的模板设计。

## 核心模板类型

### 1. Service 类模板
- 基础 CRUD 操作
- 权限验证集成
- 数据验证和业务规则

### 2. tRPC 路由模板
- 类型安全的 API 端点
- 输入输出验证
- 权限中间件集成

### 3. React Hook 模板
- 数据获取和缓存
- 乐观更新
- 错误处理

### 4. CLI 命令模板
- 统一的命令结构
- 选项验证
- 错误处理和日志

## 模板变量

生成代码时需要替换的变量：
- `{EntityName}`: 实体名称（首字母大写）
- `{entityName}`: 实体名称（首字母小写）
- `{entity}`: 实体名称（全小写，用于权限）

## 未来规划

### 自动化生成
计划通过 CLI 命令自动生成代码：

```bash
# 生成完整的 CRUD 代码
linch generate entity User

# 生成特定类型的代码
linch generate service User
linch generate router User
linch generate hook User
```

---

**状态**: 规划阶段
**优先级**: 低（在核心功能完成后实现）
