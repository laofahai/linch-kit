# 统一配置和 CLI 架构设计

## 📋 概述

为了提供更好的开发体验和更清晰的架构，我们将配置管理和 CLI 工具从各个包中抽取出来，创建统一的配置管理和命令行工具。

## 🏗️ 新架构

### 包结构

```
packages/
├── schema/           # Schema 定义和生成（移除 CLI）
├── auth-core/        # 认证核心逻辑（移除 CLI 和配置）
├── config/           # 统一配置管理包 🆕
├── cli/              # 统一 CLI 工具包 🆕
├── auth-ui-vue/      # Vue UI 组件（后续）
└── auth-ui-react/    # React UI 组件（后续）
```

### 核心优势

1. **统一配置文件**：`linch.config.ts` 管理所有包的配置
2. **统一 CLI**：`npx linch` 命令管理所有功能
3. **数据库配置支持**：应用级配置可以存储在数据库中
4. **更好的解耦**：每个包职责更单一

## 📦 @linch-kit/config

### 功能特性

- **统一配置文件**：支持 TypeScript、JavaScript、JSON 等格式
- **数据库配置**：应用配置可存储在数据库中，支持动态更新
- **多环境支持**：开发、测试、生产环境配置隔离
- **类型安全**：完整的 TypeScript 类型定义和验证
- **配置提供者**：文件、数据库、内存等多种配置源

### 配置文件结构

```typescript
// linch.config.ts
import type { LinchConfig } from '@linch-kit/config'

const config: LinchConfig = {
  // 数据库配置
  database: {
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD
  },

  // Schema 配置
  schema: {
    outputDir: './src/generated',
    generatePrisma: true,
    generateMock: false,
    generateOpenAPI: true
  },

  // Auth 配置
  auth: {
    userEntity: 'enterprise',
    providers: [
      {
        type: 'shared-token',
        id: 'shared-token',
        config: {
          token: process.env.SHARED_TOKEN,
          apiUrl: process.env.SHARED_TOKEN_API_URL
        }
      }
    ],
    permissions: {
      strategy: 'rbac',
      hierarchical: true,  // 支持部门层级权限
      multiTenant: false
    }
  },

  // 应用配置（可选，也可以从数据库加载）
  app: {
    name: 'My Application',
    environment: 'development',
    features: {
      userRegistration: true,
      emailVerification: true,
      departmentHierarchy: true
    },
    theme: {
      primaryColor: '#3b82f6',
      logo: '/logo.png'
    }
  }
}

export default config
```

### 数据库配置支持

应用级配置可以存储在数据库中，支持运行时动态更新：

```sql
-- 配置表结构
CREATE TABLE config (
  id VARCHAR(255) PRIMARY KEY,
  key VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,  -- 'app' | 'feature' | 'custom'
  environment VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(key, environment)
);
```

### API 示例

```typescript
import { 
  loadLinchConfig, 
  ConfigManager, 
  FileConfigProvider,
  createDatabaseConfigProvider 
} from '@linch-kit/config'

// 加载配置
const config = await loadLinchConfig({
  configPath: './linch.config.ts',
  loadAppFromDatabase: true
})

// 使用配置管理器
const configManager = new ConfigManager([
  new FileConfigProvider(),
  createDatabaseConfigProvider(config.database)
])

const fullConfig = await configManager.load()

// 监听配置变化
configManager.watch((newConfig) => {
  console.log('Configuration updated:', newConfig)
})
```

## 🛠️ @linch-kit/cli

### 功能特性

- **统一命令**：`npx linch` 管理所有 Linch Kit 功能
- **丰富的子命令**：初始化、配置、生成、开发、部署等
- **交互式界面**：友好的命令行交互体验
- **预设模板**：博客、企业、SaaS 等项目模板
- **插件系统**：支持第三方插件扩展

### 命令结构

```bash
# 项目初始化
npx linch init --template=enterprise --name=my-app

# 配置管理
npx linch config init --preset=saas
npx linch config validate
npx linch config set app.features.billing true --db
npx linch config get app.name

# Schema 生成
npx linch schema generate --all
npx linch schema validate

# Auth 管理
npx linch auth generate --kit=enterprise --departments
npx linch auth permissions --strategy=rbac --hierarchical

# 开发和部署
npx linch dev --port=3000
npx linch build --analyze
npx linch deploy --env=production

# 数据库管理
npx linch db migrate --reset
npx linch db seed --env=development

# 插件管理
npx linch plugin list
npx linch plugin install @linch-kit/plugin-analytics
```

### 预设模板

#### 博客模板
```typescript
{
  database: { type: 'sqlite', database: './blog.db' },
  auth: {
    userEntity: 'basic',
    providers: [{ type: 'credentials', id: 'email-password' }],
    permissions: { strategy: 'rbac', hierarchical: false }
  },
  app: {
    name: 'My Blog',
    features: { userRegistration: true, comments: true }
  }
}
```

#### 企业模板
```typescript
{
  database: { type: 'postgresql' },
  auth: {
    userEntity: 'enterprise',
    providers: [
      { type: 'shared-token', id: 'sso' },
      { type: 'oauth', id: 'google' }
    ],
    permissions: { strategy: 'rbac', hierarchical: true }
  },
  app: {
    name: 'Enterprise App',
    features: { 
      ssoLogin: true,
      departmentHierarchy: true 
    }
  }
}
```

#### SaaS 模板
```typescript
{
  database: { type: 'postgresql' },
  auth: {
    userEntity: 'multi-tenant',
    permissions: { strategy: 'rbac', hierarchical: true, multiTenant: true }
  },
  app: {
    name: 'SaaS Platform',
    features: {
      multiTenant: true,
      billing: true,
      analytics: true
    }
  }
}
```

## 🔄 迁移指南

### 从现有架构迁移

1. **安装新包**
```bash
npm install @linch-kit/config @linch-kit/cli
```

2. **创建统一配置文件**
```bash
npx linch config init --preset=enterprise
```

3. **迁移现有配置**
- 将 `auth.config.ts` 的内容合并到 `linch.config.ts` 的 `auth` 部分
- 将 Schema 配置合并到 `schema` 部分

4. **更新命令**
```bash
# 旧命令
npx @linch-kit/auth-core generate:auth
npx @linch-kit/schema generate:prisma

# 新命令
npx linch auth generate
npx linch schema generate --prisma
```

## 🎯 实施计划

### Phase 1: 基础架构 ✅
- [x] 创建 @linch-kit/config 包
- [x] 创建 @linch-kit/cli 包
- [x] 定义配置类型和验证
- [x] 实现文件配置提供者

### Phase 2: 数据库配置支持
- [ ] 实现数据库配置提供者
- [ ] 支持 PostgreSQL、MySQL、SQLite
- [ ] 配置迁移工具
- [ ] 功能开关管理

### Phase 3: CLI 命令实现
- [ ] 实现所有子命令
- [ ] 交互式配置向导
- [ ] 项目模板生成
- [ ] 插件系统

### Phase 4: 现有包重构
- [ ] 从 auth-core 移除 CLI 和配置
- [ ] 从 schema 移除 CLI
- [ ] 更新文档和示例
- [ ] 向后兼容性测试

### Phase 5: 高级功能
- [ ] 配置热重载
- [ ] 配置版本管理
- [ ] 配置备份和恢复
- [ ] 多项目配置管理

## 🔧 技术细节

### 配置加载优先级

1. 命令行参数
2. 环境变量
3. 数据库配置（应用级）
4. 配置文件
5. 默认值

### 配置验证

使用 Zod 进行运行时配置验证：

```typescript
import { z } from 'zod'

const LinchConfigSchema = z.object({
  database: DatabaseConfigSchema,
  schema: SchemaConfigSchema.optional(),
  auth: AuthConfigSchema.optional(),
  app: AppConfigSchema.optional()
})
```

### 插件系统

支持第三方插件扩展 CLI 功能：

```typescript
// 插件接口
interface LinchPlugin {
  name: string
  commands?: Command[]
  hooks?: {
    beforeBuild?: () => void
    afterBuild?: () => void
  }
}
```

## 📚 相关文档

- [配置文件参考](../config/config-reference.md)
- [CLI 命令参考](../cli/command-reference.md)
- [插件开发指南](../plugins/plugin-development.md)
- [数据库配置指南](../config/database-config.md)

## 🤝 贡献

欢迎贡献代码和建议！请参考 [贡献指南](../../CONTRIBUTING.md)。
