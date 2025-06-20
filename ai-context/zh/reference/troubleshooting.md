# 故障排除指南

## 🚨 常见问题解决

### 数据库连接问题

#### 问题: Prisma 连接池错误
**症状**: "prepared statement already exists" 错误

**解决方案**:
1. 检查数据库 URL 配置：
   ```bash
   # 确保包含 PgBouncer 参数
   DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1"
   ```

2. 重新生成 Prisma 客户端：
   ```bash
   export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"
   cd apps/linch-starter
   pnpm prisma generate
   ```

3. 验证连接：
   ```bash
   curl -s http://localhost:3000/api/health | jq .
   ```

#### 问题: 数据库连接失败
**症状**: 应用无法连接数据库

**解决步骤**:
1. 检查环境变量: `.env`
2. 验证数据库 URL 格式
3. 测试网络连接
4. 检查数据库服务状态

### 构建问题

#### 问题: TypeScript 编译错误
**症状**: `pnpm build` 失败

**解决步骤**:
```bash
# 1. 清理构建缓存
pnpm clean

# 2. 重新安装依赖
rm -rf node_modules
pnpm install

# 3. 检查 TypeScript 配置
pnpm typecheck

# 4. 逐个包构建
cd packages/core && pnpm build
cd packages/schema && pnpm build
```

#### 问题: ESLint 错误
**症状**: Lint 检查失败

**解决步骤**:
```bash
# 自动修复 lint 错误
pnpm lint --fix

# 检查剩余错误
pnpm lint
```

### 包依赖问题

#### 问题: 依赖版本冲突
**症状**: 安装或构建时依赖冲突

**解决步骤**:
```bash
# 1. 检查依赖树
pnpm list

# 2. 清理依赖
pnpm clean
rm -rf node_modules

# 3. 强制重新安装
pnpm install --force

# 4. 重新构建
pnpm build
```

#### 问题: 包管理器问题
**症状**: pnpm 命令失败

**解决步骤**:
```bash
# 确保使用正确的 Node.js 版本
export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"

# 检查 pnpm 版本
pnpm --version

# 重新安装 pnpm（如果需要）
npm install -g pnpm@latest
```

### CLI 问题

#### 问题: CLI 命令不工作
**症状**: `pnpm linch` 命令失败

**解决步骤**:
```bash
# 1. 检查工作目录
pwd  # 应该在项目根目录

# 2. 检查包构建
pnpm build

# 3. 检查 CLI 入口
ls -la apps/linch-starter/node_modules/.bin/linch

# 4. 重新安装依赖
pnpm install
```

## 🔍 调试技巧

### 环境验证
```bash
# 检查 Node.js 版本
node --version  # 应该是 20+

# 检查 pnpm 版本
pnpm --version

# 检查工作目录
pwd  # 应该在项目根目录

# 检查环境变量
cat apps/linch-starter/.env
```

### 日志查看
```bash
# 启用调试模式
DEBUG=linch:* pnpm dev

# 查看构建日志
pnpm build --verbose

# 查看测试日志
pnpm test --verbose
```

### 文件检查
```bash
# 检查关键配置文件
ls -la apps/linch-starter/linch.config.js
ls -la apps/linch-starter/.env
ls -la apps/linch-starter/prisma/schema.prisma

# 检查构建输出
ls -la packages/*/dist/
```

## 🚀 性能问题

### 数据库查询优化
- 使用 JSON 字段替代多对多关系
- 避免 N+1 查询问题
- 使用批处理查询
- 建立适当的索引

### 前端性能优化
- 使用 React.memo 优化组件
- 实现虚拟滚动
- 优化数据获取策略
- 使用 SWR 缓存

## 📞 获取帮助

### 文档资源
- [开发标准](../standards/development-standards.md) - 核心开发规范
- [快速参考](./quick-reference.md) - 快速查找信息
- [项目概览](../overview/project-overview.md) - 项目整体介绍

### 开发资源
- [开发工作流程](../workflows/development.md) - 开发规范流程
- [系统架构](../architecture/system-architecture.md) - 理解系统设计
- [包文档](../packages/) - 各包详细文档

### 紧急联系
- GitHub Issues - 报告问题
- 项目文档 - 查看最新信息
- AI 助手 - 获取即时帮助

---

**最后更新**: 2025-06-20  
**维护**: 根据实际问题持续更新  
**用途**: 快速解决开发和使用中遇到的问题
