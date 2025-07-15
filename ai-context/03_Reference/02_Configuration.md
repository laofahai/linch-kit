# LinchKit 配置参考

**版本**: v2.0.3  
**更新**: 2025-07-07  
**类型**: 环境变量和配置系统完整参考

## 🔧 环境配置

### 开发环境要求

#### Node.js 环境

```bash
# 强制要求的 Node.js 版本
NODE_VERSION="v20.19.2"

# 环境路径设置 (必须)
export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"
```

#### 包管理器

```bash
# 强制使用 bun，禁止 npm/yarn
PACKAGE_MANAGER="bun"

# 包管理命令示例
bun install              # 安装依赖
bun add <package>        # 添加依赖
bun remove <package>     # 移除依赖
bun dev                  # 开发模式
bun build                # 构建项目
bun test                 # 运行测试
```

## 🗄️ 数据库配置

### PostgreSQL 配置

```bash
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/linchkit_dev"
DIRECT_URL="postgresql://username:password@localhost:5432/linchkit_dev"

# 开发环境示例
DATABASE_URL="postgresql://postgres:password@localhost:5432/linchkit_dev"
DIRECT_URL="postgresql://postgres:password@localhost:5432/linchkit_dev"

# 生产环境示例
DATABASE_URL="postgresql://user:pass@production-host:5432/linchkit_prod"
DIRECT_URL="postgresql://user:pass@production-host:5432/linchkit_prod"
```

### Prisma 配置

```bash
# Prisma CLI 命令
bunx prisma generate      # 生成 Prisma 客户端
bunx prisma db push      # 推送 schema 到数据库
bunx prisma migrate dev  # 创建开发迁移
bunx prisma studio       # 打开 Prisma Studio
```

## 🔐 认证配置

### NextAuth.js 配置

```bash
# NextAuth 核心配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-minimum-32-characters"

# 生产环境
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="production-secret-key-minimum-32-characters"
```

### OAuth 提供商配置

```bash
# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Discord OAuth
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"
```

## 🧠 AI 服务配置

### Neo4j 图数据库

```bash
# Neo4j 连接配置 (AI 知识图谱)
NEO4J_CONNECTION_URI="neo4j+s://your-instance.databases.neo4j.io"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="your-neo4j-password"

# 本地开发 Neo4j
NEO4J_CONNECTION_URI="neo4j://localhost:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="local-password"
```

### AI Session 工具配置

```bash
# AI Session 工具启用
AI_SESSION_ENABLED="true"

# 图谱同步配置
GRAPH_SYNC_ENABLED="true"
GRAPH_SYNC_INTERVAL="3600"  # 秒为单位

# 查询引擎配置
QUERY_ENGINE_TIMEOUT="30"   # 查询超时时间（秒）
QUERY_CACHE_ENABLED="true"  # 启用查询缓存
```

## 📧 邮件服务配置

### SMTP 配置

```bash
# SMTP 服务器配置
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@yourcompany.com"

# 邮件服务启用
EMAIL_ENABLED="true"
```

## 📁 文件存储配置

### 本地存储

```bash
# 本地文件存储路径
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"  # 10MB in bytes
ALLOWED_FILE_TYPES="jpg,jpeg,png,gif,pdf,doc,docx"
```

### 云存储 (可选)

```bash
# AWS S3 配置
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# 启用云存储
CLOUD_STORAGE_ENABLED="false"
STORAGE_PROVIDER="s3"  # s3 | gcs | azure
```

## 🔍 监控和日志配置

### 日志配置

```bash
# 日志级别
LOG_LEVEL="info"  # error, warn, info, debug, trace

# 日志格式
LOG_FORMAT="json"  # json | pretty

# 日志输出
LOG_FILE="./logs/app.log"
LOG_ROTATION="daily"
```

### 监控配置

```bash
# OpenTelemetry 配置
OTEL_ENABLED="false"
OTEL_SERVICE_NAME="linchkit"
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"

# 健康检查
HEALTH_CHECK_ENABLED="true"
HEALTH_CHECK_PATH="/health"
```

## 🌐 应用配置

### Next.js 应用配置

```bash
# 应用基础配置
APP_NAME="LinchKit"
APP_VERSION="7.2"
APP_ENV="development"  # development | staging | production

# 端口配置
PORT="3000"
HOST="0.0.0.0"

# 安全配置
CORS_ORIGIN="http://localhost:3000"
RATE_LIMIT_ENABLED="true"
RATE_LIMIT_MAX="100"  # 每分钟最大请求数
```

### UI 主题配置

```bash
# 主题系统
DEFAULT_THEME="light"  # light | dark | system
THEME_SWITCHING_ENABLED="true"

# UI 配置
UI_ANIMATION_ENABLED="true"
UI_COMPACT_MODE="false"
```

## 🏢 多租户配置

### 租户系统

```bash
# 多租户功能
MULTITENANCY_ENABLED="true"
DEFAULT_TENANT="default"

# 租户隔离
TENANT_ISOLATION_LEVEL="database"  # database | schema | row
TENANT_SUBDOMAIN_ENABLED="false"
```

### 权限系统

```bash
# CASL 权限配置
PERMISSIONS_ENABLED="true"
DEFAULT_USER_ROLE="USER"
ADMIN_EMAIL="admin@yourcompany.com"

# 权限缓存
PERMISSIONS_CACHE_TTL="3600"  # 秒
```

## 🔧 开发工具配置

### 构建配置

```bash
# 构建优化
BUILD_ANALYZE="false"
BUILD_SOURCEMAP="false"
BUILD_MINIFY="true"

# 开发模式
DEV_TURBO="true"
DEV_HOT_RELOAD="true"
```

### 测试配置

```bash
# 测试环境
TEST_DATABASE_URL="postgresql://postgres:test@localhost:5432/linchkit_test"
TEST_TIMEOUT="30000"  # 毫秒

# 测试覆盖率
COVERAGE_THRESHOLD="80"
COVERAGE_REPORTS="text,html,lcov"
```

## 📋 配置文件示例

### .env.local (开发环境)

```bash
# 数据库
DATABASE_URL="postgresql://postgres:password@localhost:5432/linchkit_dev"
DIRECT_URL="postgresql://postgres:password@localhost:5432/linchkit_dev"

# 认证
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-minimum-32-characters-long"

# GitHub OAuth (开发)
GITHUB_CLIENT_ID="your-dev-github-client-id"
GITHUB_CLIENT_SECRET="your-dev-github-client-secret"

# Neo4j (本地)
NEO4J_CONNECTION_URI="neo4j://localhost:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="local-password"

# 应用配置
APP_ENV="development"
LOG_LEVEL="debug"
AI_SESSION_ENABLED="true"
```

### .env.production (生产环境)

```bash
# 数据库
DATABASE_URL="postgresql://user:pass@prod-host:5432/linchkit_prod"
DIRECT_URL="postgresql://user:pass@prod-host:5432/linchkit_prod"

# 认证
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="production-secret-minimum-32-characters"

# GitHub OAuth (生产)
GITHUB_CLIENT_ID="your-prod-github-client-id"
GITHUB_CLIENT_SECRET="your-prod-github-client-secret"

# Neo4j (生产)
NEO4J_CONNECTION_URI="neo4j+s://prod.databases.neo4j.io"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="production-neo4j-password"

# 应用配置
APP_ENV="production"
LOG_LEVEL="warn"
RATE_LIMIT_ENABLED="true"
OTEL_ENABLED="true"
```

## ⚠️ 安全注意事项

### 敏感信息管理

- ✅ **使用环境变量**: 所有敏感信息都通过环境变量配置
- ✅ **不提交 .env 文件**: .env 文件已加入 .gitignore
- ✅ **生产环境密钥**: 生产环境使用强密钥和不同的配置
- ✅ **定期轮换**: 定期轮换 API 密钥和数据库密码

### 权限配置

- ✅ **最小权限原则**: 数据库用户只授予必要权限
- ✅ **网络隔离**: 生产数据库限制网络访问
- ✅ **审计日志**: 启用所有敏感操作的审计日志

## 🔍 配置验证

### 启动时检查

LinchKit 在启动时会自动验证以下配置：

- 必需环境变量是否存在
- 数据库连接是否正常
- 外部服务（如 Neo4j）是否可达
- 文件权限是否正确

### 配置诊断命令

```bash
# 检查配置
bun run config:check

# 验证数据库连接
bun run db:check

# 验证 AI 服务
bun run ai:session validate
```

---

**配置安全**: 确保所有敏感配置都通过环境变量管理，绝不硬编码到代码中。
