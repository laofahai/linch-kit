# LinchKit 核心开发约束（精简版）

**版本**: v2.0
**更新**: 2025-06-28

## 🔒 强制性技术约束

### TypeScript
- **必须**: 所有代码使用 `.ts/.tsx`，严格模式 (`strict: true`)
- **禁止**: `any` 类型，使用 `unknown` 替代
- **Zod**: 禁止 `z.any()`，使用 `z.unknown()`

### 架构
- **依赖顺序**: core → schema → auth → crud → trpc → ui → console → ai
- **禁止**: 循环依赖、跨层依赖、功能重复实现
- **插件化**: 所有包作为 Core 插件运行

### 开发环境
- **Node.js**: >= 20.19.2
- **包管理**: 仅 pnpm (>= 10.12.1)
- **路径**: `export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"`

### 质量标准
- **构建时间**: DTS < 10秒
- **测试覆盖**: core>90%, schema>85%, 其他>80%
- **代码检查**: ESLint 100% 通过
- **文档**: 中文 README + JSDoc

### 第三方库策略
- **优先集成**: Prometheus、OpenTelemetry、Pino、Commander.js
- **适配器模式**: 保持 LinchKit 接口一致性
- **版本锁定**: 使用精确版本号

### 国际化
- **强制支持**: 所有包必须支持 i18n
- **使用**: @linch-kit/core 的 i18n 系统
- **语言**: 至少 en + zh-CN

### 安全
- **禁止**: 提交密钥、Token、密码
- **必须**: .env + dotenv-safe
- **定期**: pnpm audit

## 🔄 强制性工作流程

### 每次 Session 开始
1. **环境设置**: `export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"`
2. **状态检查**: 查看 `ai-context/zh/current/next-tasks.md`
3. **进度了解**: 查看 `ai-context/zh/project/unified-development-progress.md`

### 开发完成必须
1. **质量验证**:
   ```bash
   pnpm build      # 构建验证 (<10秒)
   pnpm lint       # 代码检查 (100%通过)
   pnpm test       # 测试验证 (覆盖率达标)
   pnpm type-check # TypeScript检查
   ```

2. **进度更新**: 每次开发结束前必须更新
   - `ai-context/zh/current/next-tasks.md` - 下一步任务
   - `ai-context/zh/project/unified-development-progress.md` - 整体进度