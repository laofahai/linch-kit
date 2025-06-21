# LinchKit 开发工作流程规范

**版本**: 1.0  
**最后更新**: 2025-06-21  
**状态**: 强制执行

## 🎯 核心原则

### 1. AI-First 开发方法论
- **Context7 MCP 优先**: 使用第三方库前必须查询最新官方文档
- **MCP Interactive Feedback**: 每个开发阶段必须获取用户反馈
- **文档驱动**: 先更新 ai-context 和 README，再进行实现
- **规范优先**: 严格遵循 `ai-context/zh/standards/` 下的所有开发规范

### 2. 质量保证原则
- **类型安全**: 所有代码必须通过 TypeScript 检查
- **测试覆盖**: 新功能必须有对应的测试
- **安全优先**: 禁止硬编码敏感信息，使用环境变量
- **性能考虑**: 优化构建和运行时性能

## 📋 完整开发流程

### 阶段1: 信息收集和规划 (必须)

#### 1.1 项目状态了解
```bash
# 必须执行的步骤
1. 使用 codebase-retrieval 了解当前项目状态
2. 查看 ai-context/zh/current-tasks.md 了解当前任务
3. 检查 ai-context/zh/standards/ 下的相关规范
4. 使用 Context7 MCP 查询相关第三方库的最新文档
```

#### 1.2 计划制定和确认
```bash
# 制定详细计划
1. 列出需要修改的具体文件
2. 确定技术实现方案
3. 评估对其他模块的影响
4. 制定测试策略
5. 调用 mcp-feedback-enhanced 获取用户确认
```

### 阶段2: 环境准备和开发 (必须)

#### 2.1 环境准备
```bash
# 设置开发环境
export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"
pnpm install
pnpm build:packages
```

#### 2.2 代码开发规范
```bash
# 开发顺序
1. 更新类型定义 (@linch-kit/types)
2. 实现核心逻辑
3. 添加 UI 组件 (如适用)
4. 更新文档和示例
5. 编写测试用例
```

#### 2.3 开发过程要求
- **使用 str-replace-editor** 而非重写文件
- **调用 codebase-retrieval** 获取编辑相关的详细信息
- **保守修改**，尊重现有代码库
- **遵循所有开发规范**和标准

### 阶段3: 质量验证 (必须)

#### 3.1 自动化检查
```bash
# 必须通过的检查
pnpm type-check    # TypeScript 类型检查
pnpm lint          # ESLint 代码规范检查
pnpm test          # 单元测试
pnpm build         # 构建检查
```

#### 3.2 手动验证
- **功能测试**: 在 linch-starter 中验证新功能
- **回归测试**: 确保现有功能正常
- **性能测试**: 检查性能影响
- **安全检查**: 确保无敏感信息泄露

### 阶段4: 文档更新 (强制执行)

**⚠️ 重要**: 所有开发工作完成后必须同步更新相关文档，这是强制性要求。

#### 4.1 代码文档更新 (必须)
- [ ] **JSDoc 注释**: 所有新增/修改的函数必须有完整的 JSDoc
  ```typescript
  /**
   * @description 详细功能描述
   * @param {type} param - 参数说明
   * @returns {type} 返回值说明
   * @example
   * ```typescript
   * const result = myFunction(param);
   * ```
   */
  ```
- [ ] **包级 README**: 更新 `packages/*/README.md` 反映最新功能
- [ ] **CHANGELOG**: 在 `packages/*/CHANGELOG.md` 记录重要变更
- [ ] **类型文档**: 更新 TypeScript 类型定义和说明

#### 4.2 AI Context 文档更新 (强制)
- [ ] **current-tasks.md**: 更新任务状态和进度
  ```markdown
  - [x] 已完成的任务描述
  - [ ] 下一步任务计划
  ```
- [ ] **development-plan.md**: 调整开发计划和优先级
- [ ] **code-locations.md**: 添加新的重要文件位置
- [ ] **architecture-design.md**: 记录架构变更和技术决策

#### 4.3 用户文档更新 (必须)
- [ ] **API 文档**: 更新 API 接口文档和示例
- [ ] **使用指南**: 更新功能使用说明和最佳实践
- [ ] **示例代码**: 提供完整的、可运行的使用示例
- [ ] **迁移指南**: 如有破坏性变更，提供详细迁移说明

#### 4.4 文档更新验证机制
```bash
# 文档更新检查清单
1. 所有修改的包都有对应的文档更新
2. AI context 文档反映最新状态
3. 示例代码可以正常运行
4. 文档链接和引用正确
5. 中英文文档保持同步 (如适用)
```

### 阶段5: 最终验证和反馈 (必须)

#### 5.1 完整性检查
- **功能完整性**: 所有计划功能都已实现
- **文档完整性**: 所有相关文档都已更新
- **测试完整性**: 测试覆盖率达标
- **规范遵循**: 所有开发规范都已遵循

#### 5.2 用户反馈
```bash
# 最终反馈步骤
1. 调用 mcp-feedback-enhanced 展示完成结果
2. 提供功能演示和文档链接
3. 说明主要变更和影响
4. 确认用户满意度
```

## 🔧 包管理规范

### 依赖管理 (强制)
```bash
# ✅ 正确做法 - 使用包管理器
export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"
pnpm add package-name
pnpm add -D dev-package-name
pnpm remove package-name

# ❌ 错误做法 - 手动编辑配置文件
# 禁止直接编辑 package.json, requirements.txt 等
```

### shadcn/ui 组件管理 (强制)
```bash
# ✅ 正确做法 - 使用官方 CLI
export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add dialog

# ❌ 错误做法 - 手动创建组件
# 禁止手动创建 shadcn/ui 组件
```

## 🌐 国际化开发流程

### 文本内容处理 (强制)
```typescript
// ✅ 正确流程
1. 识别所有用户可见文本
2. 创建 i18n 键值对
3. 使用 createPackageI18n 创建翻译函数
4. 在组件中使用翻译函数
5. 测试多语言切换功能

// 示例
import { createPackageI18n } from '@linch-kit/core'
const { t: uiT } = createPackageI18n('ui')

const MyComponent = () => (
  <div>
    <h1>{uiT('components.myComponent.title')}</h1>
    <Button>{uiT('common.actions.save')}</Button>
  </div>
)
```

### 翻译文件管理
```bash
# 翻译文件位置
packages/{package}/src/locales/
├── en/common.json
├── zh-CN/common.json
└── index.ts
```

## 🚨 强制检查点

### 代码提交前 (必须通过)
- [ ] 所有文本内容已国际化
- [ ] 通过 TypeScript 类型检查
- [ ] 通过 ESLint 代码规范检查
- [ ] 通过单元测试
- [ ] 无硬编码敏感信息
- [ ] **所有相关文档已更新**

### 功能完成前 (必须通过)
- [ ] 在 linch-starter 中验证功能
- [ ] 完成相关测试
- [ ] **更新 API 文档**
- [ ] **更新 AI context 文档**
- [ ] 调用 mcp-feedback-enhanced 获取反馈

### 发布前 (必须通过)
- [ ] 完整的回归测试
- [ ] 性能基准测试
- [ ] 安全扫描
- [ ] **文档完整性检查**
- [ ] **用户文档可用性测试**

## ⚠️ 违规处理

### 文档更新违规
- **未更新代码文档**: 代码不得合并
- **未更新 AI context**: 任务视为未完成
- **文档与代码不一致**: 必须修复后才能继续
- **示例代码无法运行**: 必须提供可运行示例

### 处理流程
1. **发现违规**: 立即停止开发流程
2. **修复问题**: 按照规范要求修复
3. **重新验证**: 通过所有检查点
4. **继续流程**: 完成剩余步骤

---

**注意**: 此工作流程为强制性要求，所有开发活动必须严格遵守。文档更新是开发流程的重要组成部分，不可省略。
