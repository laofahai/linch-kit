# LinchKit Bun.js 迁移方案

**创建日期**: 2025-01-04  
**更新日期**: 2025-01-04  
**状态**: 第一阶段完成，进行中  
**优先级**: 高

## 背景

LinchKit 作为 AI-First 全栈开发框架，追求极致的性能和开发效率。经过与 Gemini 协商评估，决定从 pnpm + Node.js 迁移到 Bun.js。

## 迁移评估结果

### ✅ 技术栈兼容性
- **Next.js 15 & React 19**: 高度兼容，Vercel 官方支持
- **Prisma**: 完全兼容，官方支持 Bun
- **tRPC**: 高度兼容，与运行时无关
- **TypeScript & ESLint**: 完全兼容，Bun 内置 TS 支持
- **Monorepo**: 完全兼容，支持 workspaces

### 🚀 性能提升预期
- **依赖安装**: 比 pnpm 快 2-20 倍
- **脚本执行**: 启动开销大幅降低
- **运行时性能**: JavaScriptCore 引擎性能优于 V8
- **测试速度**: 比 Jest 快 5-10 倍，比 Vitest 快 1.5-2 倍
- **构建速度**: 脚本调用和文件操作加速

### ⚠️ 风险评估
- **Node.js API 兼容性**: 边缘情况可能存在差异
- **postinstall 脚本**: 部分包可能需要特殊处理
- **幽灵依赖**: Bun 的扁平结构可能掩盖依赖问题

## 迁移进度

### ✅ 第一阶段：环境准备（已完成）
- [x] 创建 feature/migrate-to-bun 分支
- [x] 安装 Bun 运行时 v1.2.18
- [x] 备份当前配置（pnpm-lock.yaml.backup, pnpm-workspace.yaml.backup）

### ✅ 第二阶段：包管理迁移（已完成）
- [x] 配置 Bun workspaces（添加 workspaces 字段到 package.json）
- [x] 清理 node_modules 和 pnpm-lock.yaml
- [x] 运行 bun install 生成 bun.lockb（1449 包，68.72s）
- [x] 信任必要的 postinstall 脚本（@tailwindcss/oxide, protobufjs, unrs-resolver）

### ✅ 第三阶段：脚本更新（已完成）
- [x] 更新根目录 package.json 中的 scripts
- [x] 更新子包 scripts（apps/starter, packages/create-linch-kit, packages/schema）
- [x] 保留 packageManager 字段供 turbo 使用

### ⏳ 第四阶段：测试迁移（进行中）
- [ ] 评估 bun test vs vitest 性能对比
- [ ] 迁移测试配置（如果 bun test 更优）
- [ ] 验证测试覆盖率

### ✅ 第五阶段：CI/CD 更新（已完成）
- [x] 更新 .github/workflows/ci.yml 使用 oven-sh/setup-bun
- [x] 更新 .github/workflows/release.yml 使用 oven-sh/setup-bun
- [x] 调整所有构建和部署脚本

### ⏳ 第六阶段：验证和文档（待完成）
- [x] 验证构建流程（turbo build:packages 16.722s）
- [x] 验证开发服务器（成功启动）
- [x] 验证测试运行（core 包 57 测试 305ms）
- [ ] 更新开发文档中的 pnpm 命令
- [ ] 全面测试所有应用和包
- [ ] 记录性能对比数据

## 具体实施步骤

### 1. 安装 Bun
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc  # 或 ~/.zshrc
bun --version
```

### 2. 配置 Workspace
编辑根目录 `package.json`：
```json
{
  "workspaces": ["apps/*", "packages/*", "modules/*"]
}
```

### 3. 迁移依赖
```bash
# 备份当前锁文件
cp pnpm-lock.yaml pnpm-lock.yaml.backup

# 清理
rm -rf node_modules pnpm-lock.yaml
find . -name "node_modules" -type d -prune -exec rm -rf {} +

# 安装
bun install
```

### 4. 更新脚本示例
```json
// 之前
"scripts": {
  "dev": "pnpm run --parallel dev",
  "build": "pnpm run build:packages && pnpm run build:apps"
}

// 之后
"scripts": {
  "dev": "bun run --parallel dev",
  "build": "bun run build:packages && bun run build:apps"
}
```

### 5. CI/CD 配置
```yaml
# .github/workflows/ci.yml
- name: Setup Bun
  uses: oven-sh/setup-bun@v1
  with:
    bun-version: latest

- name: Install dependencies
  run: bun install --frozen-lockfile

- name: Run tests
  run: bun test

- name: Build
  run: bun run build
```

## 🎯 实际成果（第一阶段）

### 性能验证结果
1. **依赖安装**: bun install 68.72s（1449 包首次安装）
2. **构建速度**: turbo build:packages 16.722s（6个包并行）
3. **测试速度**: @linch-kit/core 305ms（57个测试用例）
4. **开发服务器**: 成功启动，热重载正常

### 技术兼容性
- ✅ Next.js 15 + React 19 完全兼容
- ✅ Prisma 完全支持
- ✅ tRPC 无缝集成
- ✅ TypeScript 内置转译
- ✅ Turbo 兼容（需保留 packageManager 字段）

### 发现的问题和解决方案
1. **Turbo 依赖**: 需要全局安装 pnpm 供 turbo 使用
2. **Trusted Dependencies**: 需要信任特定的 postinstall 脚本
3. **端口冲突**: 多应用并行开发时正常现象

## 回退方案

如遇到不可解决的问题：
1. 切回 main 分支
2. 恢复 pnpm-lock.yaml.backup
3. 运行 `pnpm install`
4. 记录问题供后续解决

## 参考资源

- [Bun 官方文档](https://bun.sh/docs)
- [Bun + Next.js 指南](https://bun.sh/guides/ecosystem/nextjs)
- [Bun + Prisma 集成](https://bun.sh/guides/ecosystem/prisma)
- [从 Node.js 迁移到 Bun](https://bun.sh/docs/runtime/nodejs-apis)