# 第三阶段实施计划：开发者体验 (v1.4)

**关联主计划**: `../05_Master_Plan_for_Framework_Stabilization.md`
**AI 执行指南**: `./00_AI_Execution_Guide.md`
**状态**: 待命
**预计周期**: 1-2 周
**依赖阶段**: 第二阶段完成

## 阶段目标

本阶段的目标是让第三方开发者可以轻松、顺畅地为 LinchKit 开发新扩展，提供完整的工具链和文档支持。

### 核心成果：
- 完整的扩展开发文档和教程
- 开箱即用的扩展项目脚手架
- 高质量的扩展开发示例和最佳实践
- 扩展开发工具链的整合和优化
- 稳定的扩展发布和分发机制

---

## 任务清单：范例与文档

### 任务ID: P3-01-文档完善
**任务名称**: 扩展开发文档和示例完善
**预计工时**: 2-3 天
**依赖任务**: P2-01-应用重构
**任务类型**: 文档

#### 前置条件
- [ ] 第二阶段的 starter 应用重构已完成
- [ ] 已完成 Graph RAG 查询现有扩展示例
- [ ] 已验证扩展系统的基本功能

#### 执行步骤

1. **审计现有扩展示例**
   ```bash
   bun run ai:session query "extension examples"
   tree extensions/example-counter/
   tree extensions/console/
   ```
   预期结果：获得现有扩展示例的代码结构和 API 使用情况

2. **审计和更新扩展示例**
   - 审查 `extensions/example-counter/` 代码
   - 审查 `extensions/console/` 代码
   - 确保所有 API 调用遵循最新规范
   - 修复不符合最新架构的代码

3. **完善示例文档**
   - 为 `extensions/example-counter/` 创建详细的 `README.md`
   - 为 `extensions/console/` 创建详细的 `README.md`
   - 添加安装、开发、构建、测试指南
   - 包含最佳实践和常见问题解答

4. **添加代码注释**
   - 为 `extensions/example-counter/src/register.ts` 添加详细注释
   - 为 `extensions/console/src/register.ts` 添加详细注释
   - 添加关键组件和函数的 JSDoc 注释
   - 解释扩展生命周期和事件处理

5. **创建扩展开发指南**
   - 创建 `ai-context/02_Guides/16_Extension_Development_Guide.md`
   - 包含以下内容：
     - 快速开始教程
     - 扩展架构和生命周期
     - API 参考和最佳实践
     - 测试和调试指南
     - 发布和分发流程

6. **确保所有示例使用 bun**
   ```bash
   # 检查和更新所有脚本命令
   grep -r "npm\|yarn" extensions/ || echo "No npm/yarn found"
   ```
   - 将所有 `npm`/`yarn` 命令更新为 `bun`
   - 更新所有文档中的命令示例

7. **文档验证和测试**
   ```bash
   # 验证示例项目可以正常运行
   cd extensions/example-counter && bun install && bun run build
   cd extensions/console && bun install && bun run build
   ```
   成功标志：所有示例项目都可以正常构建和运行

#### 验收标准
- [ ] 所有扩展示例都使用最新的 LinchKit API
- [ ] 每个示例都有完整详细的 README.md
- [ ] 所有关键代码都有清晰的注释和文档
- [ ] 扩展开发指南完整且实用
- [ ] 所有命令示例都使用 bun
- [ ] 文档中的所有示例都经过验证可以正常运行

#### 失败处理
- **回滚步骤**：
  1. `git stash` 保存当前更改
  2. `git checkout -- extensions/`
- **补救措施**：
  - 如果扩展示例无法正常运行，优先修复核心功能
  - 如果文档过于复杂，优先保证基本使用指南的准确性

#### 输出物
- [ ] 更新的 `extensions/example-counter/README.md`
- [ ] 更新的 `extensions/console/README.md`
- [ ] 添加注释的扩展代码文件
- [ ] 完整的 `ai-context/02_Guides/16_Extension_Development_Guide.md`
- [ ] 扩展开发最佳实践文档
- [ ] 扩展开发测试和验证报告

---

## 任务清单：脚手架

### 任务ID: P3-02-脚手架开发
**任务名称**: 创建扩展项目脚手架工具
**预计工时**: 1-2 天
**依赖任务**: P3-01-文档完善
**任务类型**: 开发

#### 前置条件
- [ ] 扩展开发文档和示例已完善
- [ ] 已完成 Graph RAG 查询现有脚手架工具
- [ ] 已验证扩展项目的基本结构和要求

#### 执行步骤

1. **审计现有脚手架工具**
   ```bash
   bun run ai:session query "create-linch-kit-extension"
   find packages/ -name "create-*" -type d
   ```
   预期结果：获得现有脚手架工具的状态和架构

2. **创建脚手架包结构**
   ```bash
   mkdir -p packages/create-linch-kit-extension
   cd packages/create-linch-kit-extension
   ```
   - 创建包的基本结构和配置文件
   - 设置 `package.json` 和构建配置
   - 配置 CLI 入口点和可执行文件

3. **安装依赖和设置环境**
   ```bash
   bun add commander chalk fs-extra
   bun add -d @types/fs-extra
   ```
   预期结果：依赖包安装成功

4. **创建扩展项目模板**
   - 创建 `template/` 目录结构
   - 基于 `extensions/example-counter` 创建最小化模板
   - 包含基本的扩展文件结构：
     - `package.json` 模板
     - `src/register.ts` 模板
     - `src/components/` 模板
     - `README.md` 模板
     - `tsconfig.json` 模板

5. **实现 CLI 主程序**
   - 创建/完善 `src/cli.ts`
   - 实现 `bunx create-linch-kit-extension <dir>` 命令
   - 添加参数解析和验证
   - 实现模板文件复制和变量替换
   - 添加友好的用户交互和错误处理

6. **实现模板替换逻辑**
   - 实现动态替换模板中的变量：
     - 项目名称
     - 作者信息
     - 扩展描述
     - 版本号
   - 支持交互式配置和默认值

7. **测试和发布准备**
   ```bash
   # 测试脚手架工具
   bun run build
   bun run test
   # 测试实际创建流程
   cd /tmp && bunx ./packages/create-linch-kit-extension/dist/cli.js test-extension
   ```
   成功标志：可以正常创建扩展项目并运行

8. **发布到 npm**
   ```bash
   # 发布到 npm registry
   npm publish --access public
   ```
   成功标志：包成功发布到 npm

#### 验收标准
- [ ] CLI 工具可以正常安装和运行
- [ ] 生成的扩展项目结构完整且符合规范
- [ ] 模板替换功能正常工作
- [ ] 生成的项目可以正常构建和运行
- [ ] CLI 工具有完整的错误处理和用户提示
- [ ] 包成功发布到 npm 并可以通过 bunx 使用

#### 失败处理
- **回滚步骤**：
  1. `git stash` 保存当前更改
  2. `git checkout -- packages/create-linch-kit-extension/`
- **补救措施**：
  - 如果 npm 发布失败，先确保本地功能正常
  - 如果模板复杂度过高，优先保证基本功能可用

#### 输出物
- [ ] 完整的 `packages/create-linch-kit-extension/` 包
- [ ] 扩展项目模板文件
- [ ] CLI 工具源代码和构建产物
- [ ] 工具使用文档和测试报告
- [ ] npm 包发布记录和版本管理

---

## 阶段总结和验证

### 阶段验收标准

#### 功能验证
- [ ] 扩展开发文档完整且实用
- [ ] 扩展示例可以正常运行和学习
- [ ] 脚手架工具可以快速创建可用的扩展项目
- [ ] 扩展开发工作流程顺畅且符合最佳实践

#### 质量验证
- [ ] 所有文档中的代码示例都经过测试验证
- [ ] 脚手架工具生成的项目符合质量标准
- [ ] 扩展开发流程的性能和效率满足需求

#### 用户体验验证
- [ ] 新手开发者可以在 30 分钟内创建第一个扩展
- [ ] 开发者可以轻松找到所需的文档和示例
- [ ] 工具链集成无缝且符合直觉

### 阶段交付物

1. **文档交付物**
   - 更新的扩展示例项目文档
   - 完整的扩展开发指南
   - 扩展开发最佳实践文档
   - API 参考文档更新

2. **工具交付物**
   - 完整的扩展项目脚手架工具
   - 发布到 npm 的工具包
   - 工具使用文档和测试报告

3. **示例交付物**
   - 更新的扩展示例项目
   - 示例项目的测试和验证
   - 最佳实践案例分析

### 下一阶段准备

在第三阶段完成后，必须为第四阶段做好以下准备：

- [ ] 扩展开发工具链的稳定版本发布
- [ ] 所有文档和示例的最终审查
- [ ] 第四阶段任务依赖关系验证
- [ ] 整体框架质量评估和稳定化准备

---

**版本更新日志**:
- v1.4 (2025-07-17): 完善任务模板和执行标准，增加阶段验证和总结
- v1.3: 初始任务清单版本
- v1.2: 增加任务依赖关系
- v1.1: 基础任务定义
- v1.0: 初始版本