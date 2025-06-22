# Linch Kit AI 工作流入口

**最后更新**: 2025-06-21  
**文档版本**: v3.0  
**原始来源**: 新建文件，作为 AI 继续开发的统一入口点  
**维护责任**: AI 助手 + 开发团队

---

## 🎯 AI 助手快速上手指南

### 第一步：理解项目现状
请按顺序阅读以下核心文档：

1. **[项目核心要点](../core/project-essentials.md)** - 了解项目定位、技术栈和当前状态
2. **[包架构设计](../core/package-architecture.md)** - 理解包结构和依赖关系
3. **[当前进度](./current-progress.md)** - 查看最新开发状态和任务优先级

### 第二步：遵循开发标准
**必须严格遵循**：
- **[开发规范](../standards/development-standards.md)** - 永久性开发标准，不可违背
- **[工作流程标准](../standards/workflow-standards.md)** - 开发、测试、发布流程
- **[UI 组件标准](../standards/ui-standards.md)** - UI 开发规范

### 第三步：定位关键代码
使用 **[代码位置索引](../core/code-locations.md)** 快速定位需要修改的文件。

## 🚀 当前开发重点

### 最新状态 (2025-06-21)
- ✅ **已完成**: linch-starter 基座应用前端认证集成 (2025-06-20)
- 🔄 **进行中**: AI Context 重构优化 (当前任务)
- 📋 **下一步**: 产品管理模块开发

### 核心包状态
| 包名 | 状态 | 发布状态 | 说明 |
|------|------|----------|------|
| @linch-kit/schema | ✅ 完成 | 已发布 npm | 数据模式和代码生成 |
| @linch-kit/core | ✅ 完成 | 待发布 | CLI、配置、插件系统 |
| @linch-kit/auth-core | ✅ 完成 | 待发布 | 认证和权限管理 |
| @linch-kit/crud | ✅ 完成 | 待发布 | CRUD 操作核心 |
| @linch-kit/trpc | ✅ 完成 | 待发布 | tRPC 集成 |
| @linch-kit/ui | ✅ 完成 | 待发布 | 基础 UI 组件 |

## 🔧 开发环境快速验证

### 环境检查命令
```bash
# 确认工作目录
cd /home/laofahai/workspace/linch-kit
pwd

# 设置 Node.js 路径
export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"

# 验证核心功能
pnpm linch --help              # CLI 基础功能
pnpm linch plugin:list         # 插件加载状态
pnpm linch schema:list         # Schema 系统状态

# 启动开发服务器
pnpm dev                       # 启动 starter 应用
```

### 预期正常输出
- CLI 命令应该正常响应
- 插件加载应该显示已加载的插件数量
- Schema 系统应该列出 9 个实体
- 开发服务器应该在 http://localhost:3000 启动

## 📋 常见开发任务模板

### 1. 添加新功能
```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 开发前信息收集
# 使用 codebase-retrieval 工具了解相关代码

# 3. 开发过程
# - 编写代码
# - 添加 JSDoc 注释
# - 编写测试

# 4. 验证和提交
export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"
pnpm lint                      # 代码检查
npx eslint --fix src/          # 自动修复
pnpm build                     # 构建验证
pnpm test                      # 运行测试

git add .
git commit -m "feat: add new feature"
```

### 2. 修复问题
```bash
# 1. 问题分析
# 使用 codebase-retrieval 工具定位问题代码

# 2. 修复实施
# - 修复根本原因，不创建变通方案
# - 添加测试覆盖

# 3. 验证修复
pnpm linch schema:generate:prisma  # 重新生成 schema
pnpm build                         # 构建验证
pnpm test                          # 测试验证

git commit -m "fix: resolve specific issue"
```

### 3. 更新文档
```bash
# 修改代码后必须同步更新文档
# 重点更新：
# - current-progress.md (开发进度)
# - 相关技术文档
# - 包的 README.md

git commit -m "docs: update documentation after feature implementation"
```

## ⚠️ 重要注意事项

### 强制要求
1. **所有文件必须使用 TypeScript** (.ts/.tsx)，禁止转换为 .js
2. **修改后必须运行** `npx eslint --fix`
3. **新增方法必须添加完整 JSDoc 注释**
4. **使用包管理器管理依赖**，禁止手动编辑 package.json
5. **生成文件只能通过 CLI 命令生成**，禁止手动编辑

### 架构原则
1. **禁止跨包重复实现**，使用统一核心接口
2. **不允许破坏性变更**，修复根本原因而非创建变通方案
3. **优先使用现有成熟解决方案**，避免重复造轮子

### 数据库配置
- **使用 Supabase PostgreSQL**: `postgresql://postgres.lgbedpaxwdtflbueedom:pXHCBzAHfyusZ9w1@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
- **使用 PgBouncer 模式**: 避免 prepared statement 冲突
- **Prisma 客户端单例模式**: 避免多实例冲突

## 🔄 任务完成后的标准流程

### 1. 代码质量检查
```bash
# 必须通过的检查项
- [ ] 所有文件使用 TypeScript
- [ ] 运行了 `npx eslint --fix`
- [ ] 添加了完整的 JSDoc 注释
- [ ] 通过了所有验证命令
- [ ] 没有破坏性变更
- [ ] 使用了包管理器管理依赖
```

### 2. 文档同步更新
```bash
# 必须更新的文档
- [ ] current-progress.md - 开发进度状态
- [ ] 相关的技术文档和架构说明
- [ ] 包的 README.md (如果修改了包)
```

### 3. 测试验证
```bash
# 建议的测试流程
- [ ] 编写或更新单元测试
- [ ] 运行完整测试套件
- [ ] 验证功能在 starter 应用中正常工作
```

## 🆘 遇到问题时的处理流程

### 1. 技术问题
- 查看 **[代码位置索引](../core/code-locations.md)** 定位相关代码
- 使用 `codebase-retrieval` 工具获取详细信息
- 参考 **[工作流程标准](../standards/workflow-standards.md)** 中的常见问题解决方案

### 2. 架构问题
- 查看 **[包架构设计](../core/package-architecture.md)** 了解设计原则
- 确保遵循架构决策记录 (ADR)
- 避免违反 **[开发规范](../standards/development-standards.md)**

### 3. 流程问题
- 参考 **[工作流程标准](../standards/workflow-standards.md)**
- 确保遵循 Git 工作流程和提交规范
- 检查是否遗漏了必要的验证步骤

---

**开始开发前请确认**：
1. ✅ 已阅读并理解项目核心要点
2. ✅ 已了解当前开发状态和优先级
3. ✅ 已熟悉必须遵循的开发标准
4. ✅ 已验证开发环境正常工作

**记住**：质量比速度更重要，架构一致性比临时解决方案更重要！
