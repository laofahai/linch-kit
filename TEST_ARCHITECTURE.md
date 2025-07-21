# LinchKit 全面测试架构设计

## 📋 测试架构概述

LinchKit monorepo 全面测试架构，支持单元测试、集成测试、E2E测试以及AI工作流测试自动化。

### 🎯 设计目标

- **80%测试覆盖率质量门禁**
- **TDD支持的七状态工作流引擎**  
- **AI工作流测试自动化集成**
- **多层次测试策略（Unit → Integration → E2E）**
- **并行测试执行优化**

## 🏗️ 架构层次

### 1. 单元测试层 (Unit Tests)
- **框架**: Bun Test (原生高性能测试运行器)
- **覆盖范围**: 函数、类、组件逻辑
- **执行环境**: Bun runtime + DOM环境
- **配置位置**: `bunfig.toml` (Bun配置)

### 2. 集成测试层 (Integration Tests)  
- **框架**: Bun Test + Testcontainers
- **覆盖范围**: API接口、数据库交互、外部服务
- **执行环境**: Docker容器化环境
- **数据库**: PostgreSQL + Neo4j 测试实例

### 3. E2E测试层 (End-to-End Tests)
- **框架**: Playwright
- **覆盖范围**: 完整用户流程、跨应用交互
- **执行环境**: 多浏览器并行 (Chromium, Firefox, WebKit)
- **配置**: `playwright.config.ts` (已存在)

### 4. AI工作流测试层 (AI Workflow Tests)
- **框架**: 自定义测试引擎 + Bun Test
- **覆盖范围**: AI Guardian、Graph RAG、七状态工作流
- **Mock策略**: AI Provider模拟、Neo4j测试数据

## 📦 workspace包级别配置

### packages/* - 核心包测试
```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch", 
    "test:coverage": "bun test --coverage"
  }
}
```

### apps/* - 应用级测试
```json
{
  "scripts": {
    "test": "bun test",
    "test:integration": "bun test test/integration/",
    "test:e2e": "playwright test"
  }
}
```

### extensions/* - 扩展测试
```json
{
  "scripts": {
    "test": "bun test",
    "test:integration": "bun test test/integration/"
  }
}
```

## 🔧 技术栈选择

### 核心测试框架
- **Bun Test**: 原生高性能测试运行器，TypeScript原生支持
- **Playwright**: 稳定的E2E测试，多浏览器支持
- **Testing Library**: React/Vue组件测试
- **Testcontainers**: 集成测试的容器化环境

### 测试工具
- **Bun内置覆盖率**: 原生代码覆盖率支持
- **msw**: API模拟
- **@faker-js/faker**: 测试数据生成
- **happy-dom**: 轻量级DOM环境

## 📊 覆盖率配置

### 80%质量门禁标准
```typescript
export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'json', 'html', 'clover'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        perFile: true
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/__tests__/**'
      ]
    }
  }
})
```

## 🤖 AI工作流测试集成

### 测试场景
1. **AI Guardian验证测试**
2. **Graph RAG查询测试** 
3. **七状态工作流引擎测试**
4. **Claude Code Commands测试**
5. **智能查询引擎测试**

### 测试数据
- Mock Gemini API响应
- Neo4j测试数据集
- 工作流状态快照

## 📈 CI/CD集成

### GitHub Actions工作流
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run Unit Tests
        run: bun run test --coverage
      
  integration-tests: 
    runs-on: ubuntu-latest
    services:
      postgres: ...
      neo4j: ...
    steps:
      - name: Run Integration Tests
        run: bun run test:integration
        
  e2e-tests:
    runs-on: ubuntu-latest  
    steps:
      - name: Run E2E Tests
        run: bun run test:e2e
```

## 🚀 实施计划

### Phase 1: 基础设施搭建
1. 安装和配置Vitest
2. 迁移现有Jest测试
3. 建立共享测试配置

### Phase 2: 测试套件生成
1. 为packages/*生成单元测试
2. 为apps/*生成集成测试  
3. 为extensions/*生成功能测试

### Phase 3: AI工作流集成
1. AI Guardian测试自动化
2. Graph RAG测试数据准备
3. 七状态工作流TDD支持

### Phase 4: 质量门禁
1. 80%覆盖率强制执行
2. CI/CD流水线集成
3. 自动化测试报告

## 📋 文件结构

```
linch-kit/
├── vitest.config.base.ts          # 基础Vitest配置
├── vitest.workspace.ts             # Workspace配置  
├── playwright.config.ts            # E2E测试配置
├── packages/
│   └── */
│       ├── src/
│       │   └── __tests__/         # 单元测试
│       ├── vitest.config.ts       # 包级配置
│       └── test/                  # 集成测试
├── apps/
│   └── */  
│       ├── src/
│       │   └── __tests__/         # 单元测试
│       ├── test/
│       │   ├── integration/       # 集成测试
│       │   └── e2e/              # E2E测试
│       └── vitest.config.ts
└── tools/
    └── testing/
        ├── setup/                 # 测试环境设置
        ├── fixtures/              # 测试数据
        ├── mocks/                 # Mock工具
        └── ai-workflow/           # AI工作流测试
```

## 🎯 预期成果

1. **全面测试覆盖**: 80%+ 代码覆盖率
2. **快速反馈循环**: < 30秒单元测试执行
3. **可靠CI/CD**: 零误报的自动化测试
4. **TDD友好**: 支持测试驱动开发工作流
5. **AI集成**: 智能测试生成和维护