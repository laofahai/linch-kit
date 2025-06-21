# LinchKit 开发规范 (强制执行)

**所有开发活动必须严格遵循以下规范，违反者不得合并代码**

## 🔒 安全要求 (强制)

### 敏感信息处理
```typescript
// ❌ 禁止：硬编码敏感信息
const DATABASE_URL = "postgresql://user:password@host:5432/db"
const API_KEY = "sk-1234567890abcdef"

// ✅ 正确：使用环境变量
const DATABASE_URL = process.env.DATABASE_URL
const API_KEY = process.env.API_KEY
```

### 环境变量命名约定
- 数据库：`DATABASE_URL`、`DB_HOST`、`DB_PASSWORD`
- API 密钥：`API_KEY_*`、`*_API_KEY`
- 认证：`AUTH_SECRET`、`NEXTAUTH_SECRET`
- 第三方服务：`SUPABASE_*`、`FIREBASE_*`

### 提交前检查
- pre-commit hook 自动检查敏感信息
- 发现敏感信息时提交被阻止
- 必须使用 `.env.local` 存储真实凭据

## 🌐 国际化架构 (强制)

### 统一 i18n 实现
```typescript
// ✅ 正确：使用统一架构
import { createPackageI18n, type TranslationFunction } from '@linch-kit/core'

const packageI18n = createPackageI18n({
  packageName: 'ui',
  defaultLocale: 'en',
  defaultMessages: {
    en: { 'button.save': 'Save' },
    'zh-CN': { 'button.save': '保存' }
  }
})

export function getUITranslation(userT?: TranslationFunction) {
  return packageI18n.getTranslation(userT)
}

// ❌ 禁止：包内自定义 i18n
import i18next from 'i18next'
// 禁止在包内直接使用 i18next 或其他 i18n 库
```

### 组件 i18n 模式
```typescript
// ✅ 正确：接受调用方传入的翻译函数
interface ComponentProps {
  t?: TranslationFunction  // 可选的翻译函数
}

function MyComponent({ t, ...props }: ComponentProps) {
  const translate = getUITranslation(t)
  return <button>{translate('button.save')}</button>
}

// ❌ 禁止：组件内部硬编码 i18n
function MyComponent() {
  const { t } = useTranslation() // 禁止在包内直接使用
  return <button>{t('button.save')}</button>
}
```

### 翻译键命名规范
- 使用命名空间前缀：`packageName.component.key`
- 示例：`ui.table.search`、`auth.login.title`
- 支持嵌套：`ui.form.validation.required`

## 📦 包管理规范 (强制)

### 依赖管理
```bash
# ✅ 正确：使用包管理器
export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"
pnpm add package-name
pnpm remove package-name

# ❌ 禁止：手动编辑 package.json
# 除非是复杂配置变更（如自定义脚本、构建配置）
```

### 命令前缀要求
- 所有 npm/pnpm 命令必须添加 PATH 前缀
- 确保使用正确的 Node.js 版本 (v20.19.2)

## 🔧 Context7 MCP 工具使用 (强制)

**使用第三方库前必须查询最新文档**
- 首次使用新库时必须查询完整文档
- 遇到问题时查询故障排除和最佳实践
- 使用 `resolve-library-id_Context7` 和 `get-library-docs_Context7` 工具

## 🛠️ 开发工作流程 (强制)

### 信息收集阶段
1. **使用 codebase-retrieval 工具了解当前状态**
2. **使用 Context7 MCP 查询第三方库最新文档**
3. **制定详细计划**，列出需要修改的文件
4. **获取所有相关符号的详细信息**

### 编辑阶段
1. **使用 str-replace-editor 而非重写文件**
2. **调用 codebase-retrieval 获取编辑相关的详细信息**
3. **保守修改，尊重现有代码库**

### 验证阶段
```bash
# 必须运行的验证命令
pnpm type-check
pnpm lint
pnpm build
```

### MCP Interactive Feedback (强制)
- 每个开发阶段都必须调用 `mcp-feedback-enhanced` 工具
- 收到非空反馈时必须再次调用并根据反馈调整
- 只有用户明确表示结束时才可停止交互

## 📝 代码质量标准 (强制)

### TypeScript 要求
- 所有文件必须使用 TypeScript
- 所有公共 API 必须有 JSDoc 注释
- 复杂逻辑必须有行内注释

### 第三方组件封装
- 保留原生 API 访问能力
- 提供 `...props` 透传机制
- 避免过度封装导致功能受限
- 文档说明高级用法

### 示例：DataTable 组件
```typescript
// ✅ 正确：提供完整的原生 API 访问
<DataTable
  columns={columns}
  data={data}
  tableOptions={{ // 完整的 TanStack Table API
    manualSorting: true,
    enableColumnResizing: true,
    // ... 所有原生选项
  }}
  renderTable={(table) => <CustomTable table={table} />} // 完全自定义
/>
```

## ✅ 提交前检查清单 (强制)

每次开发任务完成前必须确认：
- [ ] **使用 Context7 MCP 查询了所有第三方库的最新文档**
- [ ] 所有文件使用 TypeScript
- [ ] 运行了 `npx eslint --fix`
- [ ] 添加了完整的 JSDoc 注释
- [ ] 通过了所有验证命令
- [ ] 没有破坏性变更
- [ ] 使用了包管理器管理依赖
- [ ] **遵循了统一的国际化架构规范**
- [ ] **没有硬编码敏感信息，已使用环境变量**
- [ ] **完成了所有相关文档的更新 (强制)**
  - [ ] 代码文档 (JSDoc, README, CHANGELOG)
  - [ ] AI Context 文档 (current-tasks.md, development-plan.md 等)
  - [ ] 用户文档 (API 文档, 使用指南, 示例代码)
  - [ ] 文档与代码保持一致性
- [ ] **调用了 mcp-feedback-enhanced 工具获取用户反馈**

## ⚠️ 违规处理

- **任何违反此规范的代码不得合并**
- **必须修复所有违规问题后才能继续**
- **规范更新需要明确记录和通知**

---

**最后更新**: 2025-06-21
**状态**: 永久生效，仅可优化补充
**执行**: 强制执行，无例外
