# LinchKit 配置管理指南

## 📋 概述

LinchKit 采用统一的配置管理系统，通过 `configs` 包提供基础配置，供所有应用和包继承使用。这种方式避免了配置重复，提高了维护效率。

## 🗂️ 配置结构

```
configs/
├── package.json          # 配置包定义
├── tsconfig.base.json    # TypeScript 基础配置
├── tailwind.base.ts      # Tailwind 基础配置
├── eslint.base.js        # ESLint 基础配置
└── prettier.base.js      # Prettier 基础配置
```

## 🎨 样式配置管理

### CSS 变量统一管理

**❌ 避免重复**：
```css
/* apps/starter/app/globals.css - 错误示例 */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... 重复的CSS变量 */
}
```

**✅ 正确做法**：
```css
/* apps/starter/app/globals.css - 正确示例 */
@import '@linch-kit/ui/styles/globals.css';
```

### Tailwind 配置继承

**❌ 避免重复**：
```typescript
// tailwind.config.ts - 错误示例
export default {
  content: [...],
  theme: {
    container: { /* 重复配置 */ },
    extend: {
      colors: { /* 重复的颜色定义 */ }
    }
  }
}
```

**✅ 正确做法**：
```typescript
// tailwind.config.ts - 正确示例
import { baseTailwindConfig } from '../../configs/tailwind.base'

export default {
  content: [...],
  ...baseTailwindConfig,
  // 可以在这里覆盖或扩展基础配置
}
```

## 🔧 开发工具配置

### ESLint 配置继承

**✅ 推荐做法**：
```javascript
// eslint.config.js
import { baseESLintConfig } from '@linch-kit/configs/eslint.base'

export default [
  ...baseESLintConfig,
  {
    // 项目特定规则
    rules: {
      // 覆盖或添加规则
    }
  }
]
```

### Prettier 配置继承

**✅ 推荐做法**：
```javascript
// prettier.config.js
import { basePrettierConfig } from '@linch-kit/configs/prettier.base'

export default {
  ...basePrettierConfig,
  // 项目特定配置
}
```

## 🚨 AI Guardian 集成

### 配置重复检测

AI Guardian 现在包含配置重复检测功能：

```bash
bun run ai:guardian:validate "任务描述"
```

**检测内容**：
- CSS 变量重复
- Tailwind 配置重复
- ESLint 配置不一致
- 配置格式混用

**检测结果**：
- 🚨 **违规项**：必须修复的重复配置
- ⚠️ **警告项**：建议优化的配置

## 📦 包结构最佳实践

### 新建应用配置

1. **依赖configs包**：
```json
{
  "dependencies": {
    "@linch-kit/configs": "workspace:*"
  }
}
```

2. **继承基础配置**：
```typescript
// 继承基础Tailwind配置
import { baseTailwindConfig } from '../../configs/tailwind.base'
```

3. **项目特定配置**：
```typescript
// 仅添加项目特定的内容路径
export default {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  ...baseTailwindConfig
}
```

### 配置文件检查清单

- [ ] CSS变量通过@import导入，而非重复定义
- [ ] Tailwind配置继承基础配置
- [ ] ESLint配置使用统一格式（推荐flat config）
- [ ] 所有配置文件遵循项目约定

## 🔄 维护和更新

### 基础配置更新

当需要更新基础配置时：

1. **修改configs包**：
```bash
cd configs
# 编辑相关配置文件
```

2. **测试影响范围**：
```bash
# 运行AI Guardian验证
bun run ai:guardian:validate "配置更新测试"
```

3. **全项目验证**：
```bash
# 构建所有包
bun run build
```

### 配置冲突解决

当AI Guardian检测到配置重复时：

1. **分析重复原因**：查看检测报告中的具体文件路径
2. **选择优先级**：UI包 > configs > 应用特定配置
3. **移除重复**：删除低优先级的重复配置
4. **验证修复**：重新运行AI Guardian验证

## 🎯 最佳实践总结

1. **单一源头**：所有基础配置来自configs包
2. **继承优先**：优先继承而非复制
3. **最小覆盖**：仅覆盖必要的项目特定配置
4. **自动检测**：利用AI Guardian持续监控配置重复
5. **渐进式**：逐步将现有配置迁移到新体系

---

**配置管理原则**：简化维护，避免重复，保持一致性。