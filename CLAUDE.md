# LinchKit AI 开发助手指导（精简版）

**版本**: v3.0
**项目**: LinchKit - AI-First 全栈开发框架

## 🚀 项目概述

LinchKit 是企业级 AI-First 全栈开发框架，采用 Schema 驱动架构，提供端到端类型安全。

### 架构层次
```
L0: @linch-kit/core      ✅ 基础设施
L1: @linch-kit/schema    ✅ Schema引擎
L2: @linch-kit/auth      ✅ 认证权限
L2: @linch-kit/crud      ✅ CRUD操作
L3: @linch-kit/trpc      ✅ API层
L3: @linch-kit/ui        🚧 UI组件
L4: @linch-kit/console   ⏳ 管理平台
L4: @linch-kit/ai        ⏳ AI集成
```

## 📚 文档位置
- **当前进度**: `ai-context/zh/project/unified-development-progress.md`
- **开发约束**: `ai-context/zh/current/development-constraints-lite.md`
- **架构设计**: `ai-context/zh/system-design/architecture.md`
- **包设计**: `ai-context/zh/system-design/packages/{包名}.md`

## 🛠️ 开发命令
```bash
# 环境设置（每次必须）
export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"

# 开发流程
pnpm dev        # 开发模式
pnpm build      # 构建验证
pnpm test       # 测试
pnpm validate   # 完整验证
```

## 🔒 核心约束
1. **TypeScript 严格模式**，禁止 `any`
2. **仅使用 pnpm**，禁止 npm/yarn
3. **依赖顺序**: core → schema → auth → crud → trpc → ui → console → ai
4. **测试覆盖**: core>90%, 其他>80%
5. **构建时间**: <10秒

## 🎯 开发工作流
1. 查看当前进度文档
2. 按架构层次顺序开发
3. 运行验证命令
4. 在 starter-app 中验证
5. 更新进度文档

## 💡 AI 开发模式
当用户说"继续开发"时：
1. 读取 `unified-development-progress.md`
2. 确定下一个开发任务
3. 参考对应包的设计文档
4. 实施并验证
5. 更新进度

## 📋 当前状态（2025-06-28）
- ✅ Phase 1-2 完成：基础设施 + 业务逻辑层
- ✅ Phase 3 进行中：tRPC 完成，UI 包待开发
- ⏳ Phase 4 待开始：企业级特性