# LinchKit npm 发布策略

**版本**: v1.0  
**更新**: 2025-07-01  
**状态**: 规划中

---

## 📦 发布策略概览

### 🎯 核心原则
- **开源友好 + 商业平衡**: 核心功能开源，企业功能收费
- **易用性优先**: 用户能够快速上手和使用
- **生态建设**: 培养开发者社区和生态
- **维护可持续**: 控制维护成本和复杂度

---

## 📋 包发布清单

### ✅ 全部开源发布到npm (MIT)

#### 框架核心包
**@linch-kit/core** - 基础设施  
**@linch-kit/schema** - Schema引擎  
**@linch-kit/auth** - 完整认证权限系统 (包括RBAC/ABAC)  
**@linch-kit/crud** - CRUD操作  
**@linch-kit/trpc** - API层  
**@linch-kit/ui** - UI组件库  
**@linch-kit/console** - 管理控制台框架（包含基础审计界面）

#### 脚手架和模板
**create-linch-kit** - CLI脚手架工具  
**starter模板** - 完整可运行的示例应用

### 💼 业务模块收费 (新增方向)

#### 垂直行业模块
- **@linch-kit/erp** - ERP系统模块
- **@linch-kit/crm** - CRM系统模块  
- **@linch-kit/ecommerce** - 电商系统模块
- **@linch-kit/cms** - 内容管理模块
- **@linch-kit/wms** - 仓储管理模块
- **@linch-kit/hrm** - 人力资源模块

#### 高级功能模块
- **@linch-kit/analytics** - 高级数据分析和BI模块
- **@linch-kit/workflow** - 工作流引擎和审批流程
- **@linch-kit/billing** - 计费系统和订阅管理
- **@linch-kit/audit-pro** - 高级审计和合规模块（基于core的audit基础功能扩展）

### 🚫 不发布

#### apps/docs
**类型**: 文档站点  
**分发方式**: 在线文档部署

---

## 🔄 版本管理策略

### 统一版本发布
- 所有公开包使用统一版本号
- 通过 changesets 管理版本和 changelog
- 企业版本独立版本管理

### 发布流程
```bash
# 1. 版本变更
pnpm changeset

# 2. 版本更新
pnpm changeset:version

# 3. 构建验证
pnpm build && pnpm test

# 4. 发布到npm
pnpm changeset:publish
```

### 版本语义化
- **Major**: 破坏性变更
- **Minor**: 新功能添加
- **Patch**: 问题修复

---

## 🏗️ 基础设施建设

### CI/CD Pipeline

#### 自动化构建
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test
      - run: pnpm lint
```

#### 自动发布
```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    branches: [main]
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm changeset:publish
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 包配置标准化

#### package.json 模板
```json
{
  "name": "@linch-kit/package-name",
  "version": "0.1.0",
  "description": "LinchKit package description",
  "keywords": ["linch-kit", "keyword"],
  "license": "MIT",
  "publishConfig": {
    "access": "public"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

### 构建配置统一

#### tsup.config.ts
```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom'],
  treeshake: true
})
```

---

## 💰 商业模式设计

### 开源版本 (免费)
- 完整的基础开发能力
- 基础认证和权限
- 社区支持
- MIT 开源协议

### 企业版本 (付费)
- 高级权限管理
- 企业管理控制台
- 多租户支持
- 技术支持和咨询
- 私有部署支持

### 授权机制
```typescript
// 企业功能检查
if (!hasEnterpriseFeature('advanced-rbac')) {
  throw new Error('Enterprise feature requires license')
}
```

---

## 🚨 风险评估和缓解

### 风险识别
1. **开源竞争**: 核心功能开源可能被竞品复制
2. **维护成本**: 多包管理增加维护复杂度
3. **用户流失**: 商业功能门槛可能影响采用
4. **技术债务**: 版本兼容性管理

### 缓解策略
1. **技术护城河**: 通过持续创新保持领先
2. **自动化**: 完善的CI/CD和测试覆盖
3. **渐进式**: 用户可以逐步升级到企业版
4. **社区建设**: 培养活跃的开发者社区

---

## 📊 成功指标

### 技术指标
- npm 下载量 > 10k/月 (6个月内)
- GitHub Stars > 1k (1年内)
- 社区贡献者 > 50 (1年内)

### 商业指标
- 企业版客户 > 10 (1年内)
- 技术支持订阅 > 100 (2年内)
- 合作伙伴生态 > 5 (2年内)

---

## 📅 实施路线图

### Phase 1: 基础发布 (1-2个月)
- 完善6个开源包的构建和文档
- 建立CI/CD pipeline
- 发布到npm和建立官网

### Phase 2: 社区建设 (3-6个月)  
- 发布starter模板
- 完善文档和示例
- 社区推广和合作

### Phase 3: 商业化 (6-12个月)
- 企业版功能开发
- 授权系统建设
- 商业客户获取

这个策略平衡了开源生态建设和商业价值，为LinchKit的长期发展奠定基础。