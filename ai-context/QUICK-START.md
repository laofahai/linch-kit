# 🚀 快速上手指南

*适用于切换工作环境或重新开始开发*

## 📋 环境检查清单

### 必需工具
- [ ] Node.js 18+ 
- [ ] pnpm 8+
- [ ] Git
- [ ] VS Code (推荐)

### VS Code 扩展 (推荐)
- [ ] TypeScript and JavaScript Language Features
- [ ] Tailwind CSS IntelliSense
- [ ] Prisma
- [ ] ES7+ React/Redux/React-Native snippets

## 🔧 项目设置

### 1. 克隆和安装
```bash
git clone <repository-url>
cd linch-kit
pnpm install
```

### 2. 环境变量
```bash
# 复制环境变量模板
cp .env.example .env.local

# 配置数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/linch_kit"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. 数据库设置
```bash
# 启动数据库 (如果使用 Docker)
docker-compose up -d postgres

# 运行数据库迁移
cd apps/web
npx prisma migrate dev
```

### 4. 启动开发服务器
```bash
# 在项目根目录
pnpm dev

# 或者只启动特定应用
pnpm dev --filter web
```

## 📁 项目结构速览

```
linch-kit/
├── apps/
│   ├── web/                 # 主应用 (Next.js)
│   └── docs/                # 文档站点
├── packages/
│   ├── schema/              # 🔥 当前重点：Schema 系统
│   ├── ui/                  # UI 组件库
│   ├── core/                # 核心功能
│   ├── auth/                # 认证模块
│   └── types/               # 共享类型
├── ai-context/              # 🆕 AI 上下文文档
└── plugins/                 # 业务插件 (规划中)
```

## 🎯 当前开发重点

### @linch-kit/schema 包
**位置**: `packages/schema/`
**状态**: 95% 完成，准备发布

**快速测试**:
```bash
cd packages/schema

# 运行示例
npx tsx examples/basic-usage.ts
npx tsx examples/advanced-features.ts

# 测试 CLI
npx tsx src/cli/index.ts --help
```

**当前问题**: 构建配置需要修复
- TypeScript 配置问题
- 文件路径解析错误

## 🔍 常见开发任务

### 1. 修复 Schema 包构建问题
```bash
cd packages/schema

# 检查 TypeScript 配置
cat tsconfig.json

# 尝试构建
pnpm build

# 检查类型
pnpm check-types
```

### 2. 添加新的装饰器
文件: `packages/schema/src/core/decorators.ts`
```typescript
export function newDecorator<T extends z.ZodSchema>(schema: T, options?: any): T {
  return withFieldMeta(schema, { newFeature: options })
}
```

### 3. 扩展代码生成器
文件: `packages/schema/src/generators/`
- `prisma.ts` - Prisma Schema 生成
- `validators.ts` - 验证器生成
- `mock.ts` - Mock 数据生成
- `openapi.ts` - API 文档生成

### 4. 测试新功能
```bash
# 在 packages/schema 目录下
npx tsx examples/basic-usage.ts

# 或创建临时测试文件
echo "import { defineEntity } from './src/index'" > test.ts
npx tsx test.ts
```

## 🐛 常见问题解决

### 构建失败
1. 清理缓存: `pnpm clean` 或 `rm -rf node_modules/.cache`
2. 重新安装: `rm -rf node_modules && pnpm install`
3. 检查 TypeScript 配置: `packages/schema/tsconfig.json`

### 类型错误
1. 检查 Zod 版本兼容性
2. 确认装饰器类型定义正确
3. 查看 `packages/schema/src/core/types.ts`

### CLI 工具问题
1. 确认 Node.js 版本 >= 18
2. 检查文件权限: `chmod +x scripts/publish.sh`
3. 验证配置文件: `linch-schema.config.js`

## 📚 重要文档位置

### 项目文档
- `ai-context/project-overview.md` - 项目总览
- `ai-context/progress/current-status.md` - 当前状态
- `ai-context/architecture/schema-system.md` - Schema 系统设计

### 包文档
- `packages/schema/README.md` - Schema 包文档
- `packages/schema/README.zh-CN.md` - 中文文档
- `packages/schema/PUBLISHING.md` - 发布指南

### 示例代码
- `packages/schema/examples/basic-usage.ts` - 基础用法
- `packages/schema/examples/advanced-features.ts` - 高级功能

## 🎯 下一步行动

### 立即任务 (今天)
1. [ ] 修复 `packages/schema/tsconfig.json` 配置
2. [ ] 解决构建错误
3. [ ] 验证所有示例正常运行

### 短期任务 (本周)
1. [ ] 完成 Schema 包发布
2. [ ] 建立测试框架
3. [ ] 优化文档

### 中期任务 (下周)
1. [ ] 开始插件系统设计
2. [ ] 完善错误处理
3. [ ] 性能优化

## 💡 开发提示

1. **使用 AI 上下文**: 每次开发前先查看 `ai-context/` 目录了解当前状态
2. **更新文档**: 重要进展要及时更新 `current-status.md`
3. **测试驱动**: 每个功能都要有对应的示例或测试
4. **类型优先**: 确保所有代码都有正确的 TypeScript 类型
5. **渐进式开发**: 先让基础功能工作，再添加高级特性

## 🆘 需要帮助时

1. 查看 `ai-context/` 目录下的相关文档
2. 运行示例代码验证功能
3. 检查 GitHub Issues 和 Discussions
4. 参考类似项目的实现方式
