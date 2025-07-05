# 工作流程规范 (Workflow Procedures)

**版本**: 2.0  
**状态**: 生效中  
**目标**: 定义AI助手和人类开发者的标准工作流程

---

## 🚀 AI助手标准工作流程 (AI Assistant Standard Workflow)

### 阶段1：任务理解与准备 (Task Understanding & Preparation)

#### 1.1 Session 初始化检查清单
```markdown
□ 阅读 AI_COLLABORATION_MASTER_GUIDE.md
□ 检查 workflow_and_constraints.md 中的最新约束
□ 查看 roadmap.md 了解当前项目状态  
□ 确认Git分支状态和工作目录
□ 理解用户任务范围和期望
```

#### 1.2 任务复杂度评估
- **简单任务** (≤2步): 直接执行
- **中等任务** (3-5步): 使用TodoWrite规划
- **复杂任务** (>5步): 分解为多个session

#### 1.3 上下文收集策略
```bash
# 优先级搜索顺序
1. ai-context/02_knowledge_base/ (已有解决方案)
2. packages/*/README.md (包文档)  
3. 源代码 (src/**/*.ts)
4. 测试代码 (__tests__/**/*.test.ts)
```

### 阶段2：分析与规划 (Analysis & Planning)

#### 2.1 功能复用检查 (MANDATORY)
```bash
# 强制执行的检查流程
1. 搜索关键词: grep -r "关键功能" packages/*/src
2. 查阅API文档: ai-context/02_knowledge_base/library_api/
3. 确认无重复实现: bun check-reuse [关键词]
```

#### 2.2 影响分析
- **代码影响**: 识别受影响的包和模块
- **测试影响**: 确定需要更新的测试
- **文档影响**: 确定需要更新的文档

#### 2.3 任务规划模板
```markdown
## 开发计划：[任务名称]
- [ ] 0. 功能复用检查 ✅ (必须先完成)
- [ ] 1. 创建功能分支
- [ ] 2. [具体实现步骤1]
- [ ] 3. [具体实现步骤2]  
- [ ] 4. 编写/更新测试
- [ ] 5. 运行质量检查
- [ ] 6. 更新文档
- [ ] 7. 提交符合规范的commit
```

### 阶段3：实现与验证 (Implementation & Validation)

#### 3.1 分支管理规范
```bash
# 分支命名模式
feature/[task-name]     # 新功能
fix/[issue-description] # Bug修复  
docs/[doc-update]       # 文档更新
refactor/[module-name]  # 重构

# 分支操作流程
git checkout main
git pull origin main
git checkout -b feature/task-name
```

#### 3.2 代码实现标准
- **TypeScript严格模式**: 禁止`any`，使用`unknown`
- **包依赖顺序**: core → schema → auth → crud → trpc → ui
- **错误处理**: 使用统一的错误类型
- **日志记录**: 使用@linch-kit/core的logger

#### 3.3 质量检查流程 (Definition of Done)
```bash
# 必须全部通过
bun lint          # ESLint检查
bun type-check    # TypeScript检查  
bun test          # 单元测试
bun test:coverage # 覆盖率检查
bun build         # 构建验证
```

### 阶段4：文档与提交 (Documentation & Commit)

#### 4.1 文档更新要求
- **API变更**: 更新library_api文档
- **新功能**: 更新README和示例
- **配置变更**: 更新相关配置文档

#### 4.2 Commit规范 (Conventional Commits)
```bash
# 格式: type(scope): description
feat(auth): add OAuth2 provider support
fix(core): resolve memory leak in plugin system  
docs(api): update authentication examples
test(crud): add edge case coverage
refactor(ui): improve component organization
```

#### 4.3 提交前检查清单
```markdown
□ 所有质量检查通过
□ 测试覆盖率达标 (core>90%, 其他>80%)
□ 文档已同步更新
□ 无临时或调试代码
□ Commit信息符合规范
```

---

## 🔄 特殊场景处理流程 (Special Scenario Procedures)

### 场景1：紧急Bug修复
```markdown
1. 创建hotfix分支: hotfix/critical-issue
2. 最小化修复范围
3. 快速测试验证
4. 直接合并到main (跳过常规PR流程)
5. 事后补充完整测试和文档
```

### 场景2：大型重构任务
```markdown
1. 创建设计文档: DESIGN.md
2. 分解为多个小任务
3. 使用feature分支开发
4. 增量合并和验证
5. 整合临时文档到主文档体系
```

### 场景3：实验性功能
```markdown
1. 创建experiment分支: experiment/new-feature
2. 独立开发和测试
3. 评估可行性和影响
4. 决定是否合并到主线
```

### 场景4：文档整理任务
```markdown
1. 创建docs分支
2. 整理和更新文档
3. 验证链接和格式
4. 合并到主分支
5. 清理过时或重复内容
```

---

## 🤝 人机协作流程 (Human-AI Collaboration)

### 人类角色与职责
- **决策制定**: 架构方向、优先级、资源分配
- **代码审查**: 质量把控、最佳实践指导
- **需求澄清**: 功能详细说明、验收标准
- **最终确认**: 发布、部署、重要变更

### AI助手角色与职责  
- **信息收集**: 搜索文档、分析代码、理解上下文
- **方案生成**: 提供实现建议、最佳实践推荐
- **代码实现**: 编写符合规范的代码和测试
- **文档维护**: 同步更新文档、保持一致性

### 协作边界
```markdown
🟢 AI可独立执行:
- 代码补全和优化
- 测试用例编写
- 文档格式化和更新
- 常规重构和清理

🟡 AI需要确认:
- 新功能设计决策
- 架构变更建议
- 外部依赖更新
- 破坏性变更

🔴 AI禁止执行:
- 删除重要功能
- 推送到生产分支
- 修改CI/CD配置
- 暴露敏感信息
```

---

## 📊 流程度量与改进 (Process Metrics & Improvement)

### 关键指标 (Key Metrics)
- **任务完成时间**: 从开始到完成的耗时
- **质量指标**: 测试覆盖率、bug率、重构频率
- **协作效率**: 人机交互次数、决策延迟
- **文档同步率**: 代码变更与文档更新的一致性

### 持续改进机制
```markdown
1. 定期流程回顾 (每月)
2. 收集反馈和痛点
3. 识别优化机会
4. 试点新流程
5. 评估效果并推广
```

### 常见问题与解决方案

**问题**: 频繁的merge冲突
**解决**: 小批量提交、及时rebase、功能分支策略

**问题**: 测试覆盖率不达标  
**解决**: TDD开发模式、自动化覆盖率检查

**问题**: 文档滞后于代码
**解决**: 代码审查时强制检查文档更新

**问题**: AI理解偏差
**解决**: 清晰的任务描述、分步确认、示例驱动

---

## 🛠️ 工具与自动化 (Tools & Automation)

### 必需工具
```bash
# 代码质量
eslint              # 代码规范检查
prettier            # 代码格式化
typescript          # 类型检查
vitest              # 测试运行器

# 文档工具  
markdownlint        # Markdown格式检查
markdown-link-check # 链接有效性检查
typedoc             # API文档生成

# Git工具
husky               # Git hooks
conventional-commits # 提交规范
```

### 自动化流程
```yaml
# .github/workflows/quality.yml
- name: Quality Check
  run: |
    bun install
    bun lint
    bun type-check  
    bun test:coverage
    bun build
```

### AI助手工具使用规范
- **Bash**: 用于运行命令和脚本
- **Read/Write**: 用于文件操作
- **Grep/Glob**: 用于搜索和定位
- **TodoWrite**: 用于任务规划和跟踪

---

**整合来源**: AI_COLLABORATION_FRAMEWORK.md, workflow_and_constraints.md  
**AI-Assisted**: true