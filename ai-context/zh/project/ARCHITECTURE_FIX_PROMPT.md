# 🚨 LinchKit 架构修复指令 - 明天开始执行

**紧急程度**: 🔴 最高优先级  
**预计时间**: 2-3天  
**负责人**: AI开发助手  
**开始日期**: 2025-06-27  

---

## 📋 执行前准备

### 环境设置
```bash
# 1. 设置正确的Node.js环境
export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"

# 2. 确认工作目录
cd /home/laofahai/workspace/linch-kit

# 3. 检查项目状态
git status
pnpm install
```

### 必读文档
1. `ai-context/zh/project/architecture-review-complete.md` - 完整审查报告
2. `ai-context/zh/system-design/development-constraints.md` - 开发约束（已更新）
3. `ai-context/zh/project/module-core-architecture-review.md` - Core包审查详情

---

## 🎯 第一天任务：修复Schema包 (最高优先级)

### Task 1.1: 集成Core基础设施功能

**目标**: 让Schema包正确使用Core提供的基础设施

**具体操作**:
```typescript
// 1. 修改 packages/schema/src/index.ts
// 添加Core功能导入
import { createLogger, createPackageI18n } from '@linch-kit/core'

// 2. 创建 packages/schema/src/infrastructure.ts
export const logger = createLogger({ name: 'schema' })

export const schemaI18n = createPackageI18n({
  packageName: 'schema',
  defaultLocale: 'en',
  defaultMessages: {
    en: {
      'generator.start': 'Starting code generation for {count} entities',
      'generator.complete': 'Code generation completed successfully',
      'generator.error': 'Code generation failed: {error}',
      'entity.validate.success': 'Entity {name} validation passed',
      'entity.validate.error': 'Entity {name} validation failed: {error}'
    },
    'zh-CN': {
      'generator.start': '开始为 {count} 个实体生成代码',
      'generator.complete': '代码生成成功完成',
      'generator.error': '代码生成失败: {error}',
      'entity.validate.success': '实体 {name} 验证通过',
      'entity.validate.error': '实体 {name} 验证失败: {error}'
    }
  }
})

export const useSchemaTranslation = (userT?: TranslationFunction) =>
  schemaI18n.getTranslation(userT)
```

**验证标准**:
- [ ] Schema包所有console.log替换为logger调用
- [ ] 所有硬编码文本替换为国际化调用
- [ ] 构建成功: `cd packages/schema && pnpm build`

### Task 1.2: 移除重复实现

**目标**: 删除违反规范的重复实现

**具体操作**:
```bash
# 1. 删除重复的插件管理器
rm packages/schema/src/plugins/plugin-manager.ts

# 2. 修改 packages/schema/src/plugins/index.ts
# 移除对plugin-manager的导出
```

**验证标准**:
- [ ] 不再有独立的插件管理实现
- [ ] 所有插件相关功能使用Core的插件系统

### Task 1.3: 实现插件注册

**目标**: 将Schema包注册为Core插件

**具体操作**:
```typescript
// 1. 创建 packages/schema/src/plugin.ts
import type { Plugin } from '@linch-kit/core'
import { logger, useSchemaTranslation } from './infrastructure'

export const schemaPlugin: Plugin = {
  metadata: {
    id: 'schema',
    name: 'Schema Plugin',
    version: '0.1.0',
    description: 'LinchKit Schema驱动开发引擎',
    dependencies: []
  },
  
  async setup(config) {
    const t = useSchemaTranslation()
    logger.info(t('plugin.setup.start', { name: 'Schema' }))
    
    // 初始化Schema系统
    // 注册代码生成器
    // 设置CLI命令
    
    logger.info(t('plugin.setup.complete', { name: 'Schema' }))
  },
  
  async start(config) {
    const t = useSchemaTranslation()
    logger.info(t('plugin.start', { name: 'Schema' }))
    return { success: true }
  },
  
  async stop(config) {
    const t = useSchemaTranslation()
    logger.info(t('plugin.stop', { name: 'Schema' }))
    return { success: true }
  }
}

// 2. 修改 packages/schema/src/index.ts
export { schemaPlugin } from './plugin'
```

**验证标准**:
- [ ] Schema包可以作为插件注册到Core
- [ ] 插件生命周期正常工作
- [ ] 事件通信机制正常

---

## 🎯 第二天任务：审查和修复Auth包

### Task 2.1: Auth包架构深度审查

**目标**: 全面分析Auth包的架构问题

**具体操作**:
1. 使用codebase-retrieval分析Auth包所有文件
2. 检查对Core/Schema功能的使用情况
3. 识别重复实现和架构违规
4. 生成详细的审查报告

### Task 2.2: 修复Auth包架构问题

**目标**: 按照Core包标准修复Auth包

**预期修复内容**:
- 集成Core的日志和国际化
- 实现Auth插件注册
- 移除重复实现
- 确保正确的依赖关系

---

## 🎯 第三天任务：审查和修复CRUD包

### Task 3.1: CRUD包架构深度审查
### Task 3.2: 修复CRUD包架构问题
### Task 3.3: 建立包间插件通信机制

---

## ⚠️ 重要注意事项

### 强制要求
1. **每次修改前必须运行**: `pnpm build` 确保构建成功
2. **每次修改后必须运行**: `pnpm lint` 和 `pnpm type-check`
3. **每个任务完成后更新进度文档**
4. **遇到问题立即记录到进度文档中**

### 验证清单
每个包修复完成后必须通过：
- [ ] 构建成功
- [ ] 类型检查通过
- [ ] ESLint检查通过
- [ ] 正确使用Core基础设施
- [ ] 注册为Core插件
- [ ] 无重复实现

### 文档更新
每天结束时更新：
- `ai-context/zh/project/unified-development-progress.md`
- 对应的包级进度文档

---

## 🚀 开始执行命令

```bash
# 明天开始时运行这个命令开始修复
echo "开始LinchKit架构修复 - $(date)"
echo "当前任务: 修复Schema包架构违规问题"
echo "参考文档: ai-context/zh/project/ARCHITECTURE_FIX_PROMPT.md"
```

**记住**: 质量比速度更重要，确保每个修复都符合架构规范！
