# Linch Kit 代码生成指导

## 目的

指导 AI 助手使用 Linch Kit 的代码生成流程，确保生成的代码符合项目规范和最佳实践。

## 上下文

**参考文档**:
- `ai-context/zh/packages/schema.md` - Schema 系统详解
- `ai-context/zh/templates/code-generation-templates.md` - 代码模板库
- `ai-context/zh/templates/ai-first-practices.md` - AI-First 开发原则

Linch Kit 采用 Schema 驱动的开发模式，基于模板自动生成各种代码。

## 代码生成流程

### 1. Schema-First 开发流程

**步骤**:
1. **定义 Schema**: 使用 `@linch-kit/schema` 定义实体
2. **生成代码**: 使用 CLI 命令或模板生成相关代码
3. **验证结果**: 确保生成的代码符合规范
4. **测试集成**: 验证生成的代码能正常工作

**详细 Schema 定义**: 参考 `ai-context/zh/packages/schema.md`

### 2. 代码生成命令

```bash
# 生成完整的 CRUD 代码
linch generate entity User

# 生成特定类型的代码
linch generate service User
linch generate router User
linch generate hook User
linch generate test User
```

### 3. 使用模板生成

**模板位置**: `ai-context/zh/templates/code-generation-templates.md`

**可用模板**:
- Service 类模板
- tRPC 路由模板
- React Hook 模板
- CLI 命令模板
- 测试模板

### 4. 质量标准

**参考**: `ai-context/zh/templates/ai-first-practices.md`

**必须满足**:
- ✅ 完整的 TypeScript 类型定义
- ✅ 详细的 JSDoc 注释
- ✅ 错误处理和验证
- ✅ 权限检查集成
- ✅ 测试用例覆盖

## 生成步骤指导

### 步骤 1: 准备 Schema

1. 在 `app/_lib/schemas/` 目录下创建实体文件
2. 使用 `defineEntity` 定义实体结构
3. 添加必要的装饰器 (primary, unique, createdAt 等)
4. 验证 Schema 定义: `linch schema-list`

### 步骤 2: 生成代码

1. 选择合适的生成命令或模板
2. 执行代码生成
3. 检查生成的文件位置和内容
4. 验证 TypeScript 类型检查通过

### 步骤 3: 集成验证

1. 运行构建命令: `pnpm build`
2. 运行测试: `pnpm test`
3. 手动验证功能正确性
4. 检查 API 端点是否正常工作

### 步骤 4: 文档更新

1. 更新 API 文档
2. 添加使用示例
3. 更新相关的 ai-context 文档
4. 更新 CHANGELOG

## 常见问题处理

### 生成失败
1. 检查 Schema 定义是否正确
2. 验证配置文件 `linch.config.ts`
3. 确认模板文件存在
4. 查看错误日志

### 类型错误
1. 重新生成 Prisma 客户端
2. 检查导入路径
3. 验证 Schema 导出
4. 重新构建项目

### 集成问题
1. 检查路由注册
2. 验证权限配置
3. 确认数据库迁移
4. 测试 API 端点

## 最佳实践

### 1. 命名规范
- 实体名称使用 PascalCase
- 文件名使用 kebab-case
- 变量名使用 camelCase

### 2. 代码组织
- 按功能模块组织代码
- 保持文件结构一致
- 使用统一的导入顺序

### 3. 测试策略
- 为每个生成的 Service 编写单元测试
- 为 API 路由编写集成测试
- 确保测试覆盖率达标

### 4. 文档维护
- 及时更新 API 文档
- 保持示例代码的准确性
- 同步更新相关文档

## 质量检查清单

### 生成前检查
- [ ] Schema 定义完整正确
- [ ] 配置文件设置正确
- [ ] 模板文件可用
- [ ] 目标目录存在

### 生成后检查
- [ ] 代码生成成功
- [ ] TypeScript 类型检查通过
- [ ] 构建成功
- [ ] 测试通过

### 集成检查
- [ ] API 端点正常工作
- [ ] 权限验证正确
- [ ] 数据库操作正常
- [ ] 前端集成无误

---

**使用说明**:
1. 严格按照 Schema-First 流程执行
2. 使用现有模板而非重新编写
3. 确保生成的代码符合质量标准
4. 及时更新相关文档

**相关文档**:
- [Schema 包文档](../../ai-context/zh/packages/schema.md)
- [代码模板库](../../ai-context/zh/templates/code-generation-templates.md)
- [AI-First 最佳实践](../../ai-context/zh/templates/ai-first-practices.md)
