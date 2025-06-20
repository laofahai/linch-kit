# Linch Kit 测试策略指导

## 目的

指导 AI 助手为 Linch Kit 项目编写高质量的测试用例，确保代码质量、功能正确性和系统稳定性。

## 上下文

**参考文档**:
- `ai-context/zh/workflows/testing.md` - 完整测试策略和模板
- `ai-context/zh/templates/ai-first-practices.md` - AI-First 开发原则
- `ai-context/zh/workflows/development.md` - 开发流程

Linch Kit 采用多层次测试策略，包括单元测试、集成测试和端到端测试。

## 测试策略概览

### 测试金字塔

```
    E2E 测试 (5% - 核心用户流程)
         ↑
    集成测试 (15% - 关键模块交互)
         ↑
    单元测试 (80% - 快速反馈)
```

### 覆盖率要求

- **语句覆盖率**: 80%+
- **分支覆盖率**: 75%+
- **函数覆盖率**: 80%+
- **行覆盖率**: 80%+

## 测试编写流程

### 1. 确定测试类型

**根据测试目标选择**:
- **单元测试**: 测试单个函数/类的行为
- **集成测试**: 测试模块间交互
- **E2E 测试**: 测试完整用户流程

### 2. 使用测试模板

**模板位置**: `ai-context/zh/workflows/testing.md`

**可用模板**:
- Service 单元测试模板
- API 集成测试模板
- E2E 测试模板
- Mock 数据工厂模板

### 3. 遵循测试原则

**AAA 模式**:
- **Arrange**: 准备测试数据
- **Act**: 执行被测试的操作
- **Assert**: 验证结果

**FIRST 原则**:
- **Fast**: 快速执行
- **Independent**: 测试独立
- **Repeatable**: 可重复执行
- **Self-validating**: 自我验证
- **Timely**: 及时编写

## 测试编写指导

### 单元测试

**测试对象**: Service 类、工具函数、Schema 验证

**编写步骤**:
1. 创建测试文件 (`*.test.ts`)
2. 设置 Mock 依赖
3. 编写测试用例
4. 验证覆盖率

**示例结构**:
```typescript
describe('UserService', () => {
  let service: UserService
  let mockDb: jest.Mocked<PrismaClient>
  
  beforeEach(() => {
    // 设置 Mock
  })
  
  describe('create', () => {
    it('should create user with valid data', async () => {
      // Arrange, Act, Assert
    })
    
    it('should throw error when validation fails', async () => {
      // 错误情况测试
    })
  })
})
```

### 集成测试

**测试对象**: API 端点、数据库操作、模块交互

**编写步骤**:
1. 设置测试数据库
2. 创建测试调用器
3. 编写 API 测试
4. 清理测试数据

**关键点**:
- 使用真实的数据库连接
- 测试完整的请求-响应流程
- 验证数据持久化

### E2E 测试

**测试对象**: 完整用户流程、页面交互

**编写步骤**:
1. 使用 Page Object 模式
2. 编写用户场景测试
3. 验证页面状态
4. 检查数据一致性

**关键点**:
- 测试关键业务流程
- 使用稳定的选择器
- 处理异步操作

## 测试工具使用

### 单元测试工具

```bash
# 运行单元测试
pnpm test

# 运行特定测试文件
pnpm test user.test.ts

# 生成覆盖率报告
pnpm test:coverage
```

### 集成测试工具

```bash
# 运行集成测试
pnpm test:integration

# 设置测试数据库
pnpm test:db:setup
```

### E2E 测试工具

```bash
# 运行 E2E 测试
pnpm test:e2e

# 运行特定浏览器
pnpm test:e2e --project=chromium
```

## 测试数据管理

### 使用数据工厂

**参考**: `ai-context/zh/workflows/testing.md#测试数据管理`

```typescript
// 使用工厂创建测试数据
const user = UserFactory.create({
  email: 'test@example.com'
})
```

### Mock 策略

**Mock 外部依赖**:
- 数据库操作
- 外部 API 调用
- 文件系统操作
- 时间相关函数

## 质量检查清单

### 测试编写检查
- [ ] 测试覆盖所有主要功能
- [ ] 包含正常和异常情况
- [ ] 使用清晰的测试名称
- [ ] 遵循 AAA 模式

### 测试质量检查
- [ ] 测试独立且可重复
- [ ] 覆盖率达到要求
- [ ] 测试执行速度合理
- [ ] Mock 使用恰当

### 集成检查
- [ ] 所有测试通过
- [ ] CI/CD 集成正常
- [ ] 测试报告生成
- [ ] 覆盖率报告可用

## 常见问题处理

### 测试失败
1. 检查测试环境配置
2. 验证 Mock 设置
3. 确认测试数据正确
4. 查看详细错误信息

### 覆盖率不足
1. 识别未覆盖的代码
2. 添加缺失的测试用例
3. 检查测试配置
4. 排除不需要测试的代码

### 测试运行缓慢
1. 优化测试数据设置
2. 使用并行执行
3. 减少不必要的 Mock
4. 优化数据库操作

## 最佳实践

### 1. 测试命名
- 使用描述性的测试名称
- 说明测试的条件和期望结果
- 保持命名一致性

### 2. 测试组织
- 按功能模块组织测试
- 使用 describe 分组相关测试
- 保持测试文件结构清晰

### 3. 测试维护
- 定期更新测试用例
- 清理过时的测试
- 保持测试与代码同步

---

**使用说明**:
1. 根据测试类型选择合适的模板和工具
2. 遵循测试原则和最佳实践
3. 确保测试覆盖率达到要求
4. 定期维护和更新测试用例

**相关文档**:
- [测试工作流程](../../ai-context/zh/workflows/testing.md)
- [开发流程](../../ai-context/zh/workflows/development.md)
- [AI-First 最佳实践](../../ai-context/zh/templates/ai-first-practices.md)
