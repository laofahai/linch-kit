# 故障排除指南

## 🔍 常见问题检查清单

### 1. 配置文件问题

#### ✅ Turborepo 配置
- [ ] `turbo.json` 中没有使用已废弃的 `outputMode`
- [ ] 所有任务都有正确的 `dependsOn` 配置
- [ ] `inputs` 和 `outputs` 配置正确

#### ✅ TypeScript 配置
- [ ] 所有包都有 `tsconfig.json` 和 `tsconfig.build.json`
- [ ] 配置文件正确继承了基础配置
- [ ] React 包有正确的 JSX 配置

#### ✅ tsup 配置
- [ ] 所有包都有 `tsup.config.ts`
- [ ] CLI 包使用 `createCliConfig`
- [ ] React 包使用 `createReactConfig`
- [ ] 普通库使用 `createLibraryConfig`

### 2. 包结构问题

#### ✅ 必需文件
- [ ] 每个包都有 `src/index.ts`
- [ ] `package.json` 有正确的 exports 字段
- [ ] `package.json` 有正确的 scripts

#### ✅ 依赖管理
- [ ] workspace 依赖使用 `workspace:*` 格式
- [ ] 外部依赖版本一致
- [ ] peerDependencies 正确配置

### 3. 构建问题

#### ✅ 构建顺序
- [ ] 依赖图没有循环依赖
- [ ] 构建按正确顺序执行
- [ ] 类型声明文件正确生成

#### ✅ 输出格式
- [ ] 同时生成 ESM 和 CJS 格式
- [ ] 类型声明文件 (.d.ts) 正确
- [ ] sourcemap 文件存在

### 4. 发布问题

#### ✅ 版本管理
- [ ] Changesets 配置正确
- [ ] 版本号遵循语义化版本
- [ ] CHANGELOG 自动生成

#### ✅ 依赖替换
- [ ] workspace:* 正确替换为具体版本
- [ ] 发布后能正确恢复开发配置
- [ ] npm 包信息完整

## 🛠️ 修复步骤

### 1. 重置配置

```bash
# 更新所有配置文件
pnpm setup

# 重新安装依赖
pnpm install
```

### 2. 清理和重建

```bash
# 清理所有构建产物
pnpm clean

# 重新构建
pnpm build:packages
```

### 3. 验证工作流

```bash
# 运行完整测试
pnpm test:workflow

# 检查依赖图
pnpm deps:graph
```

## 🚨 紧急修复

### 构建失败

```bash
# 1. 检查 TypeScript 错误
pnpm check-types

# 2. 检查配置文件
node scripts/update-all-configs.js

# 3. 重新构建
pnpm build:packages
```

### 发布失败

```bash
# 1. 检查 npm 登录状态
npm whoami

# 2. 检查包版本
pnpm changeset status

# 3. 手动发布单个包
cd packages/package-name
npm publish --access public
```

### 依赖问题

```bash
# 1. 检查依赖一致性
pnpm deps:check

# 2. 更新依赖
pnpm update --recursive

# 3. 重新安装
pnpm install
```

## 📊 健康检查

定期运行以下命令确保项目健康：

```bash
# 每日检查
pnpm test:workflow

# 每周检查
pnpm deps:graph
pnpm audit

# 每月检查
pnpm outdated
pnpm update --latest
```

## 🆘 获取帮助

如果遇到无法解决的问题：

1. 查看 [GitHub Issues](https://github.com/your-org/linch-kit/issues)
2. 搜索 [讨论区](https://github.com/your-org/linch-kit/discussions)
3. 提交新的 Issue 并包含：
   - 错误信息
   - 复现步骤
   - 环境信息 (`node --version`, `pnpm --version`)
   - 相关配置文件
