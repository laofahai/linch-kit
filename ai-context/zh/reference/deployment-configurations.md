# 部署配置参考

## 概述

本文档包含 Linch Kit 项目的各种部署配置文件和脚本，支持多种部署方式。

## Vercel 部署配置

### vercel.json

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "apps/starter/.next",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["hkg1", "sin1"],
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "NEXTAUTH_URL": "@nextauth_url"
  },
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  },
  "functions": {
    "apps/starter/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### 环境变量配置

```bash
# 生产环境变量
DATABASE_URL="postgresql://user:password@host:5432/database"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# 第三方服务
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# 可选服务
REDIS_URL="redis://localhost:6379"
S3_BUCKET="your-s3-bucket"
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"

# 监控和日志
SENTRY_DSN="your-sentry-dsn"
LOG_LEVEL="info"
```

## Docker 部署配置

### Dockerfile

```dockerfile
# 多阶段构建
FROM node:18-alpine AS base

# 安装 pnpm
RUN npm install -g pnpm

# 设置工作目录
WORKDIR /app

# 复制 package.json 文件
COPY package.json pnpm-lock.yaml ./
COPY packages/*/package.json ./packages/*/
COPY apps/*/package.json ./apps/*/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 生产阶段
FROM node:18-alpine AS production

RUN npm install -g pnpm

WORKDIR /app

# 复制构建结果
COPY --from=base /app/apps/starter/.next ./apps/starter/.next
COPY --from=base /app/apps/starter/public ./apps/starter/public
COPY --from=base /app/apps/starter/package.json ./apps/starter/
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 设置文件权限
CHOWN nextjs:nodejs /app
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 启动应用
CMD ["pnpm", "start"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/linchkit
      - NEXTAUTH_SECRET=your-secret-key
      - NEXTAUTH_URL=http://localhost:3000
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=linchkit
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

## 数据库配置

### PostgreSQL 生产配置

```sql
-- postgresql.conf 优化配置

# 连接设置
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# WAL 设置
wal_buffers = 16MB
checkpoint_completion_target = 0.9
wal_writer_delay = 200ms

# 查询优化
random_page_cost = 1.1
effective_io_concurrency = 200

# 日志设置
log_statement = 'all'
log_duration = on
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# 安全设置
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
ssl_ca_file = 'ca.crt'
```

### 数据库初始化脚本

```sql
-- init-db.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- 创建应用用户
CREATE USER linchkit_app WITH PASSWORD 'secure_password';

-- 授权
GRANT CONNECT ON DATABASE linchkit TO linchkit_app;
GRANT USAGE ON SCHEMA public TO linchkit_app;
GRANT CREATE ON SCHEMA public TO linchkit_app;

-- 设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO linchkit_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT USAGE, SELECT ON SEQUENCES TO linchkit_app;
```

## Nginx 配置

### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # 限流配置
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL 配置
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;

        # 安全头
        add_header Strict-Transport-Security "max-age=63072000" always;
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # 静态文件缓存
        location /_next/static/ {
            proxy_pass http://app;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API 限流
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 登录限流
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 默认代理
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 部署脚本

### 自动化部署脚本

```bash
#!/bin/bash
# deploy.sh

set -e

# 配置
ENVIRONMENT=${1:-production}
VERSION=$(git rev-parse --short HEAD)
BACKUP_DIR="/backups"

echo "🚀 开始部署到 $ENVIRONMENT 环境..."
echo "📦 版本: $VERSION"

# 1. 预检查
echo "🔍 执行预检查..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm 未安装"
    exit 1
fi

# 2. 备份数据库
echo "💾 备份数据库..."
mkdir -p $BACKUP_DIR
pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"

# 3. 构建应用
echo "🔨 构建应用..."
pnpm install --frozen-lockfile
pnpm build
pnpm test

# 4. 构建 Docker 镜像
echo "🐳 构建 Docker 镜像..."
docker build -t linchkit:$VERSION .
docker tag linchkit:$VERSION linchkit:latest

# 5. 停止旧容器
echo "🛑 停止旧容器..."
docker-compose down

# 6. 启动新容器
echo "🚀 启动新容器..."
docker-compose up -d

# 7. 健康检查
echo "🏥 执行健康检查..."
sleep 30
if curl -f http://localhost:3000/api/health; then
    echo "✅ 部署成功!"
else
    echo "❌ 健康检查失败，开始回滚..."
    docker-compose down
    # 回滚逻辑
    exit 1
fi

# 8. 清理旧镜像
echo "🧹 清理旧镜像..."
docker image prune -f

echo "🎉 部署完成!"
```

### 回滚脚本

```bash
#!/bin/bash
# rollback.sh

set -e

PREVIOUS_VERSION=$1

if [ -z "$PREVIOUS_VERSION" ]; then
    echo "请指定要回滚的版本"
    echo "用法: ./rollback.sh <version>"
    exit 1
fi

echo "🔄 回滚到版本: $PREVIOUS_VERSION"

# 1. 停止当前容器
docker-compose down

# 2. 回滚镜像
docker tag linchkit:$PREVIOUS_VERSION linchkit:latest

# 3. 启动容器
docker-compose up -d

# 4. 健康检查
sleep 30
if curl -f http://localhost:3000/api/health; then
    echo "✅ 回滚成功!"
else
    echo "❌ 回滚失败!"
    exit 1
fi
```

## 监控配置

### 健康检查端点

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`
    
    // 检查关键服务
    const checks = {
      database: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }
    
    return NextResponse.json(checks, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Health check failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
```

---

**维护说明**:
- 配置文件应该根据实际环境进行调整
- 定期更新安全配置和证书
- 监控部署脚本的执行结果
- 保持备份策略的有效性
