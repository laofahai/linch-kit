# Linch Kit 项目配置提示词

## 目的
指导AI助手进行Linch Kit项目的配置和设置，确保项目能够正确运行并符合最佳实践。

## 项目配置结构

### 1. 核心配置文件
```
project/
├── linch.config.ts          # 主配置文件
├── package.json             # 包配置
├── tsconfig.json           # TypeScript配置
├── .env.example            # 环境变量模板
├── .gitignore              # Git忽略文件
└── README.md               # 项目文档
```

### 2. 开发配置文件
```
project/
├── .eslintrc.js            # ESLint配置
├── .prettierrc             # Prettier配置
├── jest.config.js          # Jest测试配置
├── turbo.json              # Turbo构建配置
└── docker-compose.yml      # Docker配置
```

## 主配置文件 (linch.config.ts)

### 基础配置模板
```typescript
import type { LinchConfig } from '@linch-kit/core'

const config: LinchConfig = {
  // 项目基本信息
  project: {
    name: 'project-name',
    version: '0.1.0',
    description: 'Project description',
    author: 'Author name',
  },

  // 数据库配置
  database: {
    type: 'postgresql',
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/dbname',
  },

  // Schema配置
  schema: {
    entities: ['src/entities/**/*.{ts,tsx}'],
    output: {
      prisma: './prisma/schema.prisma',
      validators: './src/validators/generated.ts',
      mocks: './src/mocks/factories.ts',
      openapi: './docs/api.json',
    },
    database: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL || 'postgresql://localhost:5432/dbname',
    },
    softDelete: true,
  },

  // 插件配置
  plugins: ['@linch-kit/schema'],
}

export default config
```

### 企业级配置
```typescript
const enterpriseConfig: LinchConfig = {
  project: {
    name: 'enterprise-app',
    version: '1.0.0',
    description: 'Enterprise application',
    author: 'Company Name',
  },

  database: {
    type: 'postgresql',
    url: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    },
  },

  schema: {
    entities: ['src/entities/**/*.{ts,tsx}'],
    output: {
      prisma: './prisma/schema.prisma',
      validators: './src/validators/generated.ts',
      mocks: './src/mocks/factories.ts',
      openapi: './docs/api.json',
      types: './src/types/generated.ts',
    },
    database: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL,
    },
    softDelete: true,
    audit: true,
    multiTenant: true,
  },

  auth: {
    userEntity: 'User',
    providers: [
      {
        type: 'credentials',
        id: 'credentials',
        config: {
          name: 'credentials',
          credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
          },
        },
      },
      {
        type: 'oauth',
        id: 'google',
        config: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      },
    ],
    permissions: {
      strategy: 'rbac',
      hierarchical: true,
      multiTenant: true,
    },
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60,
      updateAge: 24 * 60 * 60,
    },
  },

  trpc: {
    endpoint: '/api/trpc',
    enableSubscriptions: true,
    enableBatching: true,
    maxBatchSize: 10,
    transformer: 'superjson',
  },

  plugins: [
    '@linch-kit/schema',
    '@linch-kit/auth-core',
    '@linch-kit/crud',
    '@linch-kit/trpc',
  ],
}
```

## 包配置 (package.json)

### 基础包配置
```json
{
  "name": "project-name",
  "version": "0.1.0",
  "description": "AI-First application built with Linch Kit",
  "main": "dist/index.js",
  "scripts": {
    "dev": "linch dev",
    "build": "linch build",
    "start": "node dist/index.js",
    "test": "linch test",
    "test:watch": "linch test --watch",
    "test:coverage": "linch test --coverage",
    "schema:list": "linch schema:list",
    "schema:generate": "linch schema:generate",
    "schema:validate": "linch schema:validate",
    "db:migrate": "linch db:migrate",
    "db:seed": "linch db:seed",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write src/**/*.{ts,tsx}",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@linch-kit/core": "^0.1.0",
    "@linch-kit/schema": "^0.1.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "jest": "^29.0.0"
  },
  "keywords": ["linch-kit", "ai-first", "rapid-development"],
  "author": "",
  "license": "MIT"
}
```

## TypeScript配置 (tsconfig.json)

### 推荐配置
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/entities/*": ["./src/entities/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/utils/*": ["./src/utils/*"]
    },
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": [
    "src/**/*",
    "tests/**/*",
    "linch.config.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build"
  ]
}
```

## 环境变量配置

### .env.example
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database"

# Application
NODE_ENV=development
PORT=3000
HOST=localhost

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Redis (if using)
REDIS_URL=redis://localhost:6379

# Email (if using)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Storage (if using)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

## 开发工具配置

### ESLint配置 (.eslintrc.js)
```javascript
module.exports = {
  extends: [
    '@linch-kit/eslint-config',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  }
}
```

### Prettier配置 (.prettierrc)
```json
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

## Docker配置

### Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/app
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=app
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## 配置验证

### 配置检查清单
- [ ] 数据库连接配置正确
- [ ] 环境变量设置完整
- [ ] TypeScript配置支持装饰器
- [ ] ESLint和Prettier配置一致
- [ ] 测试配置正确
- [ ] 构建脚本可用
- [ ] 开发服务器可启动
- [ ] 生产构建成功

### 配置测试命令
```bash
# 验证配置
linch config:validate

# 测试数据库连接
linch db:test

# 检查依赖
npm audit

# 类型检查
npm run type-check

# 代码质量检查
npm run lint

# 运行测试
npm test
```

## 最佳实践

1. **环境分离**: 为不同环境使用不同的配置
2. **安全性**: 敏感信息使用环境变量
3. **版本控制**: 配置文件纳入版本控制
4. **文档化**: 配置选项要有清晰的文档
5. **验证**: 启动时验证配置的正确性
6. **默认值**: 为所有配置提供合理的默认值
