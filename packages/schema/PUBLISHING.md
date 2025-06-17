# 发布指南

## 发布到 npm

### 前置条件

1. **npm 账号**: 确保有 npm 账号并已登录
   ```bash
   npm login
   ```

2. **权限**: 确保有 `@linch-kit` scope 的发布权限

3. **构建工具**: 确保已安装依赖
   ```bash
   pnpm install
   ```

### 发布步骤

#### 方法1: 使用发布脚本 (推荐)

```bash
cd packages/schema
./scripts/publish.sh
```

脚本会自动：
- 检查 git 状态
- 清理并构建项目
- 运行类型检查
- 测试 CLI 工具
- 显示将要发布的文件
- 确认后发布

#### 方法2: 手动发布

```bash
cd packages/schema

# 1. 清理并构建
rm -rf dist
pnpm build

# 2. 检查类型
pnpm check-types

# 3. 测试构建结果
node dist/cli/index.js --help

# 4. 预览发布内容
npm pack --dry-run

# 5. 发布
npm publish
```

#### 方法3: 从根目录使用 Turborepo

```bash
# 在项目根目录
pnpm build --filter @linch-kit/schema
pnpm publish --filter @linch-kit/schema
```

### 版本管理

#### 更新版本

```bash
cd packages/schema

# 补丁版本 (0.1.0 -> 0.1.1)
npm version patch

# 小版本 (0.1.0 -> 0.2.0)
npm version minor

# 大版本 (0.1.0 -> 1.0.0)
npm version major
```

#### 预发布版本

```bash
# 发布 beta 版本
npm version prerelease --preid=beta
npm publish --tag beta

# 发布 alpha 版本
npm version prerelease --preid=alpha
npm publish --tag alpha
```

### 发布后操作

1. **创建 Git Tag**
   ```bash
   git tag v$(node -p "require('./package.json').version")
   git push origin --tags
   ```

2. **创建 GitHub Release**
   - 访问 GitHub 仓库
   - 点击 "Releases" -> "Create a new release"
   - 选择刚创建的 tag
   - 填写 Release notes

3. **更新文档**
   - 更新 CHANGELOG.md
   - 更新相关文档中的版本号

### CI/CD 自动发布

可以设置 GitHub Actions 自动发布：

```yaml
# .github/workflows/publish-schema.yml
name: Publish Schema Package

on:
  push:
    tags:
      - 'schema-v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build package
        run: pnpm build --filter @linch-kit/schema
      
      - name: Publish to npm
        run: pnpm publish --filter @linch-kit/schema --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 发布检查清单

发布前确保：

- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] CHANGELOG.md 已更新
- [ ] 版本号已正确更新
- [ ] 构建成功且无错误
- [ ] CLI 工具正常工作
- [ ] 示例代码可以运行
- [ ] README 中的安装说明正确

### 故障排除

#### 发布失败

1. **权限问题**
   ```bash
   npm whoami  # 检查当前登录用户
   npm access list packages @linch-kit  # 检查包权限
   ```

2. **版本冲突**
   ```bash
   npm view @linch-kit/schema versions --json  # 查看已发布版本
   ```

3. **构建问题**
   ```bash
   rm -rf node_modules dist
   pnpm install
   pnpm build
   ```

#### 撤销发布

```bash
# 撤销最近发布的版本 (仅在发布后24小时内)
npm unpublish @linch-kit/schema@版本号

# 废弃版本 (推荐)
npm deprecate @linch-kit/schema@版本号 "版本废弃原因"
```

### 最佳实践

1. **语义化版本**: 遵循 [SemVer](https://semver.org/) 规范
2. **变更日志**: 维护详细的 CHANGELOG.md
3. **测试**: 发布前充分测试
4. **文档**: 保持文档与代码同步
5. **标签**: 为每个发布版本创建 Git tag
6. **备份**: 重要版本发布前备份代码
