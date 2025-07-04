# LinchKit AI 驱动工作流 - 下一个 Session 完整指导

## 🚨 强制性 Session 初始化 (Pre-flight Checklist)

**触发指令**: 用户说 "继续开发 AI 工作流" 或类似关键词

### 阶段 1: 强制性文档阅读 (必须按顺序完成)

**⚠️ 在执行任何操作前，必须严格按顺序阅读以下文档：**

1. **项目核心指导** (最高优先级)
   ```bash
   # 必读文档 1: 项目总体指导
   cat /home/laofahai/workspace/linch-kit/CLAUDE.md
   ```
   - 📋 Phase 1 强制性 Session 初始化流程
   - 🏛️ LinchKit 架构状态和技术栈
   - 📚 知识库导航和约束要求

2. **开发规范约束** (强制遵守)
   ```bash
   # 必读文档 2: 开发约束和工作流程
   cat /home/laofahai/workspace/linch-kit/ai-context/workflow_and_constraints.md
   ```
   - 🚨 TypeScript 严格模式要求
   - 📦 bun 包管理器强制使用
   - 🏗️ 架构依赖顺序规范
   - 🧪 测试覆盖率标准

3. **当前工作流状态** (上下文理解)
   ```bash
   # 必读文档 3: 当前开发进度
   cat /home/laofahai/workspace/linch-kit/.devcontainer/workflow-mvp/AI_AUTOMATION_PROGRESS.md
   ```
   - ✅ 已完成功能清单
   - 🔄 待完成任务列表
   - 📁 文件结构说明

4. **并行开发架构** (技术方案)
   ```bash
   # 必读文档 4: 并行开发工作流架构
   cat /home/laofahai/workspace/linch-kit/ai-context/system_architecture/parallel_development_workflow.md
   ```
   - 🎯 Phase 1-3 实施策略
   - 🛡️ 风险管控机制
   - 📋 成功标准定义

### 阶段 2: 环境和状态检查

5. **分支安全检查** (🔴 最高优先级)
   ```bash
   git branch --show-current
   git status --porcelain
   ```
   - 确保在 `feature/parallel-development-workflow` 分支
   - 检查工作目录状态

6. **任务状态检查**
   ```bash
   # 检查待办事项
   TodoRead
   ```

7. **工作流系统状态**
   ```bash
   cd /home/laofahai/workspace/linch-kit/.devcontainer/workflow-mvp
   ./scripts/status.sh
   ```

### 阶段 3: 任务明确化

8. **当前 Session 目标确认**
   - ✅ 已完成: Phase 1 MVP + AI 自动生成器
   - 🎯 本 Session: 测试和优化完全 AI 驱动系统
   - 🔄 核心任务: 验证端到端自动化流程

## 🤖 核心任务: 完全 AI 驱动验证

### 任务描述
**用户只需提供自然语言，Claude 自动完成从需求分析到代码执行的全流程**

### 测试场景 (按优先级执行)

#### 🚀 场景 1: 基础 AI 工作流测试
```bash
cd /home/laofahai/workspace/linch-kit/.devcontainer/workflow-mvp
./scripts/ai-workflow-generator.sh "为用户模块添加基础的增删改查功能"
```

#### 🔧 场景 2: 复杂任务处理测试
```bash
./scripts/ai-workflow-generator.sh "重构认证系统，添加多因素认证和会话管理"
```

#### 🧪 场景 3: 跨包协调测试
```bash
./scripts/ai-workflow-generator.sh "创建完整的用户权限管理界面，包括角色分配和权限矩阵"
```

### 验证要点

1. **AI 自然语言解析** ✅
   - 任务类型识别准确性
   - 复杂度评估合理性
   - 包依赖分析正确性

2. **Gemini 协商机制** 🔄
   - 复杂任务自动触发协商
   - 网络失败时的降级处理
   - 协商结果的有效集成

3. **LinchKit 规范强制** ✅
   - TypeScript 严格模式检查
   - bun 包管理器使用
   - 架构依赖顺序验证
   - 分支安全检查

4. **工作流自动执行** 🔄
   - 任务依赖关系处理
   - 失败任务的智能分析
   - 进度监控和报告生成

## 🛠️ 优化任务清单

### 高优先级
- [ ] 完善 AI 任务分解算法
- [ ] 优化 Gemini 协商提示词
- [ ] 增强失败分析的智能程度
- [ ] 添加更多任务类型模板

### 中优先级  
- [ ] 实现多 AI 代理冲突检测
- [ ] 增加实时进度推送
- [ ] 扩展 AI 模板库
- [ ] 优化用户交互体验

## 📋 质量标准

### 功能性要求
- ✅ 支持完全自然语言输入
- ✅ 自动生成符合规范的工作流
- ✅ 端到端执行无人工干预
- 🔄 智能错误处理和恢复

### 性能要求
- ⏱️ 工作流生成时间 < 30秒
- 🎯 任务解析准确率 > 90%
- 🔄 系统执行成功率 > 85%

### 合规要求
- 🛡️ 100% 遵循 LinchKit 开发规范
- 🔒 强制分支安全检查
- 📊 测试覆盖率要求达标
- 🏗️ 架构依赖顺序正确

## 🎯 成功标准

用户输入: **"帮我实现一个用户管理功能"**

Claude 自动完成:
1. 📝 解析需求 (用户管理 = CRUD + 权限 + UI)
2. 🤝 Gemini 协商 (复杂任务获得专家建议)  
3. ⚙️ 生成工作流 (遵循所有 LinchKit 规范)
4. 🚀 自动执行 (创建分支、安装依赖、测试等)
5. 📊 进度监控 (实时状态更新)
6. ✅ 完成报告 (结果摘要和后续建议)

**全程用户无需任何技术操作，只需提供自然语言需求！**

## 💡 开发提示

### 调试技巧
```bash
# 查看 AI 生成的配置
cat tasks/ai-generated-*.json | jq '.'

# 查看执行状态
cat state/ai-generated-*.state.json | jq '.'

# 启用详细日志
bash -x scripts/ai-workflow-generator.sh "测试任务"
```

### 常见问题处理
- **Gemini 连接失败**: 使用内置专家知识继续
- **任务解析错误**: 检查关键词匹配逻辑
- **执行失败**: 查看 AI 失败分析建议

---

**🚀 立即开始: 让 Claude 完全接管开发流程，实现真正的 AI-First 开发体验！**