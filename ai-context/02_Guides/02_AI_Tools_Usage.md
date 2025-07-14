# LinchKit AI 工具使用指南

**版本**: v2.0.3  
**更新**: 2025-07-07  
**状态**: AI Session 工具和 Graph RAG 的统一使用指南

## 🎯 概述

LinchKit 提供了完整的 AI 工具生态，包括：

- **AI Session 工具**: `bun run ai:session` - 自动化开发流程
- **Neo4j 知识图谱**: 5,446+ 节点的项目知识图谱
- **Graph RAG 查询**: 智能项目上下文查询
- **智能分支管理**: 基于任务描述自动生成分支名

## 🚀 AI Session 工具

### ⚡ 快速启动

```bash
# 自动执行所有初始化检查（分支、环境、依赖）
bun run ai:session init "[任务描述]"

# 或者简单的环境检查
bun run ai:session init
```

### 🌳 智能分支创建

**Claude 会根据任务描述智能生成英文分支名**:

```bash
# Claude调用方式（推荐）
bun run ai:session branch add-user-avatar "给用户添加头像功能"

# 直接指定分支名
bun run ai:session branch fix-login-bug "修复登录错误"
```

**分支名规范**:

- 自动添加 `feature/` 前缀
- 只允许字母、数字、连字符、下划线
- Claude 会将中文任务描述转换为简洁的英文分支名

### 🎯 上下文查询（强制执行）

**任何代码相关任务都必须先查询项目上下文**:

```bash
# 查询实体定义和相关文件
bun run ai:session query "[实体名]"

# 查询符号定义（函数、类、接口）
bun run ai:session symbol "[符号名]"

# 查询实现模式
bun run ai:session pattern "[模式]" "[实体]"
```

### 🔄 图谱数据同步（强制执行）

```bash
# 同步Neo4j图谱数据
bun run ai:session sync

# 完整验证（包含图谱同步）
bun run ai:session validate
```

## 📊 Neo4j 知识图谱

### 当前状态

- **节点数量**: 5,446 个代码实体
- **关系数量**: 7,969 个依赖关系
- **关系类型**: `CALLS`, `EXTENDS`, `IMPLEMENTS`, `IMPORTS`
- **更新频率**: 每次代码变更后自动同步

### 图谱 Schema

```
节点类型:
- Package (包)
- Function (函数)
- Class (类)
- Interface (接口)
- Schema (数据模型)

关系类型:
- CALLS (调用关系)
- EXTENDS (继承关系)
- IMPLEMENTS (实现关系)
- IMPORTS (导入关系)
- DEPENDS_ON (依赖关系)
```

## 🧠 Graph RAG 查询

### 查询引擎状态

- **基础查询**: ✅ 已完成 - 实体查找、关系查询
- **意图识别**: ✅ 已优化 - 中文自然语言查询识别
- **性能**: 平均查询时间 1.4-2.3 秒
- **准确率**: 结构查询 90%+，使用关系查询待增强

### 使用方式

#### 1. 通过 AI Session 工具

```bash
# 查找实体和相关文件
bun run ai:session query "User"
bun run ai:session query "Product"

# 查找符号定义
bun run ai:session symbol "UserSchema"
bun run ai:session symbol "createUser"

# 查找实现模式
bun run ai:session pattern "add_field" "User"
bun run ai:session pattern "create_api" "Product"
```

#### 2. 直接 Neo4j 查询

```bash
# 运行智能查询引擎
bun dist/cli/index.js

# 示例查询
> 找到所有认证相关的类
> 查找所有React组件
> 显示Schema相关的接口
```

### 支持的查询类型

#### 实体查询

- **查找类**: "找到所有认证相关的类"
- **查找函数**: "查找createUser函数"
- **查找接口**: "显示Schema相关的接口"
- **查找组件**: "查找所有React组件"

#### 关系查询

- **依赖关系**: "显示Package之间的依赖"
- **调用关系**: "查找哪些函数调用了authenticate"
- **继承关系**: "显示Component的继承层次"

#### 架构查询

- **模块结构**: "显示auth包的结构"
- **API关系**: "查找tRPC路由定义"
- **Schema定义**: "显示User实体的字段"

## 🔧 工具集成工作流

### 🔴 强制使用场景

**所有AI开发、文档、分析操作都必须先通过Neo4j图谱获取项目上下文：**

#### 代码开发场景

1. **添加字段**: `bun run ai:session query "EntityName"`
2. **创建API**: `bun run ai:session pattern "create_api" "EntityName"`
3. **修改现有功能**: `bun run ai:session symbol "FunctionName"`
4. **创建新组件**: `bun run ai:session pattern "create_component"`
5. **集成第三方库**: `bun run ai:session pattern "integration"`
6. **重构代码**: `bun run ai:session query "TargetEntity"`
7. **调试问题**: `bun run ai:session symbol "ProblemFunction"`

#### 文档操作场景

8. **编写文档**: 查询相关代码实体确保准确性
9. **更新API文档**: `bun run ai:session symbol "APIFunction"`
10. **架构分析**: `bun run ai:session pattern "architecture_pattern"`

#### 分析和决策场景

11. **技术选型**: 查询现有技术栈和依赖关系
12. **影响分析**: 查询变更影响的相关组件
13. **代码审查**: 验证代码一致性和最佳实践

### 📋 Claude 的标准工作模式

**Phase 1: 理解用户需求**

```typescript
// Claude内部分析（示例）
const userRequest = '我要给user加一个生日字段'
const analysis = {
  action: 'add_field',
  entity: 'User',
  field: 'birthday',
  type: 'Date',
}
```

**Phase 2: 查询项目上下文**

```bash
# Claude必须调用工具获取信息
bun run ai:session query "User"
```

**Phase 3: 基于查询结果执行开发**

```typescript
// 根据工具返回的信息，Claude使用现有工具：
await Read(userSchemaPath)      // 读取schema文件
await Edit(userSchemaPath, ...) // 编辑添加字段
await Bash("bunx prisma migrate dev") // 创建迁移
// ... 继续其他步骤
```

### 🎯 工具返回的结构化信息

```json
{
  "success": true,
  "results": {
    "primary_target": {
      "name": "User",
      "file_path": "packages/schema/src/user.ts",
      "current_fields": ["id", "name", "email"]
    },
    "related_files": {
      "schemas": ["packages/schema/src/user.ts"],
      "apis": ["packages/trpc/src/user.ts"],
      "ui_components": ["packages/ui/src/forms/UserForm.tsx"]
    },
    "suggestions": {
      "add_field": {
        "steps": [
          "1. 编辑 packages/schema/src/user.ts 更新Schema定义",
          "2. 运行 bunx prisma migrate dev 创建数据库迁移",
          "3. 更新相关的tRPC API procedures",
          "4. 更新相关的UI表单组件"
        ]
      }
    }
  }
}
```

## ⚠️ 重要约束

### 严格禁止的行为

**❌ 绝不允许：**

- 直接猜测文件位置和代码结构
- 在没有查询工具信息的情况下修改代码
- 忽略工具返回的实现建议
- 创建与现有模式不一致的代码
- **跳过Neo4j上下文查询，直接进行任何代码操作**
- **基于记忆或假设进行架构分析或技术决策**
- **不验证代码一致性就编写文档或注释**

### 必须遵循的流程

**✅ 必须遵循：**

- **每次AI操作前必须通过Neo4j图谱查询获取准确的项目上下文**
- 严格按照工具建议的文件路径和模式
- 使用工具返回的相关文件列表
- 遵循LinchKit的架构约束和最佳实践
- **所有代码分析、文档编写、架构决策都基于实时图谱数据**
- **任何技术选型或影响分析都先查询现有依赖关系**

## 🎪 完整使用示例

### 示例：Claude处理添加字段请求

```
用户: "给User添加一个phone字段"

Claude: 我来帮你为User添加phone字段。首先让我查询User实体的相关信息...

[调用工具]
$ bun run ai:session query "User"

我发现User定义在 packages/schema/src/user.ts，当前包含字段：id, name, email

相关文件：
- Schema: packages/schema/src/user.ts
- API: packages/trpc/src/user.ts
- UI: packages/ui/src/forms/UserForm.tsx

现在我来执行以下步骤：

1. 更新User Schema...
[使用Edit工具修改packages/schema/src/user.ts]

2. 创建数据库迁移...
[使用Bash工具运行bunx prisma migrate dev]

3. 更新相关API...
[继续执行其他步骤]

4. 同步图谱数据...
[运行 bun run ai:session sync]

完成！User现在支持phone字段了。
```

## 📈 性能和限制

### 当前性能指标

- **查询响应时间**: 1.4-2.3 秒
- **意图识别准确率**: 70%+ （中文查询）
- **结构查询准确率**: 90%+
- **数据同步时间**: 通常 < 30 秒

### 已知限制

- **使用关系查询**: 需要增强数据提取器
- **复杂逻辑查询**: 当前主要支持结构化查询
- **实时更新**: 需要手动触发同步

### 改进计划

- [ ] 增强代码使用关系的提取
- [ ] 提升自然语言查询识别
- [ ] 实现实时数据同步
- [ ] 添加查询缓存机制

---

**核心原则：Claude负责理解和执行，工具负责提供准确的项目信息**
