# @linch-kit/console 集成示例

## 完整部署示例

### 1. Docker Compose 部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  # 数据库
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: linchkit_console
      POSTGRES_USER: linchkit
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  # Redis 缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
  
  # 控制台后端
  console-backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://linchkit:${DB_PASSWORD}@postgres:5432/linchkit_console
      - REDIS_URL=redis://redis:6379
      - SESSION_SECRET=${SESSION_SECRET}
      - OAUTH_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - OAUTH_GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
    volumes:
      - ./plugins:/app/plugins
      - ./uploads:/app/uploads
  
  # 控制台前端
  console-frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    environment:
      - REACT_APP_API_URL=http://localhost:3001/api
    ports:
      - "3000:80"
    depends_on:
      - console-backend
  
  # Prometheus 监控
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
  
  # Grafana 仪表盘
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3002:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
```

```dockerfile
# Dockerfile.backend
FROM node:20-alpine

WORKDIR /app

# 复制 package.json 和 lock 文件
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 安装依赖
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --prod

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# 启动命令
CMD ["pnpm", "start"]
```

```dockerfile
# Dockerfile.frontend
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build:frontend

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. Kubernetes 部署

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: linchkit-console

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: console-config
  namespace: linchkit-console
data:
  NODE_ENV: "production"
  REDIS_URL: "redis://redis-service:6379"
  PROMETHEUS_ENABLED: "true"
  PLUGIN_MARKETPLACE_ENABLED: "true"

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: console-secrets
  namespace: linchkit-console
type: Opaque
data:
  database-url: <base64-encoded-database-url>
  session-secret: <base64-encoded-session-secret>
  google-client-id: <base64-encoded-google-client-id>
  google-client-secret: <base64-encoded-google-client-secret>

---
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: console-backend
  namespace: linchkit-console
spec:
  replicas: 3
  selector:
    matchLabels:
      app: console-backend
  template:
    metadata:
      labels:
        app: console-backend
    spec:
      containers:
      - name: console-backend
        image: linchkit/console-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: console-secrets
              key: database-url
        - name: SESSION_SECRET
          valueFrom:
            secretKeyRef:
              name: console-secrets
              key: session-secret
        envFrom:
        - configMapRef:
            name: console-config
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"

---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: console-backend-service
  namespace: linchkit-console
spec:
  selector:
    app: console-backend
  ports:
  - port: 80
    targetPort: 3001
  type: ClusterIP

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: console-ingress
  namespace: linchkit-console
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - console.your-domain.com
    secretName: console-tls
  rules:
  - host: console.your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: console-frontend-service
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: console-backend-service
            port:
              number: 80
```

### 3. Helm Chart 部署

```yaml
# helm/Chart.yaml
apiVersion: v2
name: linchkit-console
description: LinchKit Console Helm Chart
type: application
version: 1.0.0
appVersion: "1.0.0"

dependencies:
- name: postgresql
  version: 12.x.x
  repository: https://charts.bitnami.com/bitnami
- name: redis
  version: 17.x.x
  repository: https://charts.bitnami.com/bitnami
```

```yaml
# helm/values.yaml
replicaCount: 3

image:
  backend:
    repository: linchkit/console-backend
    tag: latest
    pullPolicy: IfNotPresent
  frontend:
    repository: linchkit/console-frontend
    tag: latest
    pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
  - host: console.your-domain.com
    paths:
    - path: /
      pathType: Prefix
  tls:
  - secretName: console-tls
    hosts:
    - console.your-domain.com

# 数据库配置
postgresql:
  enabled: true
  auth:
    postgresPassword: "your-postgres-password"
    database: "linchkit_console"

# Redis 配置
redis:
  enabled: true
  auth:
    enabled: false

# 监控配置
monitoring:
  prometheus:
    enabled: true
  grafana:
    enabled: true

# 控制台配置
console:
  auth:
    providers:
    - local
    - oauth
  plugins:
    marketplace:
      enabled: true
      autoUpdate: false
  monitoring:
    enabled: true
```

## 企业集成示例

### 1. 与现有认证系统集成

```typescript
// integrations/sso/SAMLAuthProvider.ts
import { AuthProvider } from '@linch-kit/console';
import * as saml from 'samlify';

export class SAMLAuthProvider extends AuthProvider {
  name = 'saml';
  
  private serviceProvider: any;
  private identityProvider: any;
  
  constructor(config: SAMLConfig) {
    super();
    
    this.serviceProvider = saml.ServiceProvider({
      entityID: config.entityId,
      assertionConsumerService: [{
        Binding: saml.Constants.namespace.binding.post,
        Location: config.acsUrl
      }]
    });
    
    this.identityProvider = saml.IdentityProvider({
      entityID: config.idpEntityId,
      singleSignOnService: [{
        Binding: saml.Constants.namespace.binding.redirect,
        Location: config.ssoUrl
      }]
    });
  }
  
  async authenticate(req: Request): Promise<AuthResult> {
    if (req.method === 'POST' && req.path === '/auth/saml/acs') {
      return this.handleSAMLResponse(req);
    }
    
    if (req.path === '/auth/saml/login') {
      return this.initiateSAMLLogin(req);
    }
    
    return { success: false, message: 'Invalid SAML request' };
  }
  
  private async handleSAMLResponse(req: Request): Promise<AuthResult> {
    try {
      const { extract } = await this.serviceProvider.parseLoginResponse(
        this.identityProvider,
        'post',
        req
      );
      
      const user = await this.createOrUpdateUser({
        email: extract.attributes.email,
        name: extract.attributes.name,
        roles: this.mapSAMLRoles(extract.attributes.roles)
      });
      
      return { 
        success: true, 
        user,
        token: await this.generateToken(user)
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'SAML authentication failed' 
      };
    }
  }
  
  private async initiateSAMLLogin(req: Request): Promise<AuthResult> {
    const { context } = await this.serviceProvider.createLoginRequest(
      this.identityProvider,
      'redirect'
    );
    
    return {
      success: true,
      redirect: context
    };
  }
  
  private mapSAMLRoles(samlRoles: string[]): string[] {
    const roleMapping = {
      'Admin': ['admin'],
      'Manager': ['manager', 'user'],
      'User': ['user']
    };
    
    return samlRoles.flatMap(role => roleMapping[role] || ['user']);
  }
}
```

### 2. 与企业监控系统集成

```typescript
// integrations/monitoring/DatadogIntegration.ts
import { MonitoringIntegration } from '@linch-kit/console';

export class DatadogIntegration extends MonitoringIntegration {
  name = 'datadog';
  
  private client: any;
  
  constructor(config: DatadogConfig) {
    super();
    this.client = require('@datadog/datadog-api-client');
    
    this.client.setConfiguration({
      apiKey: config.apiKey,
      appKey: config.appKey
    });
  }
  
  async sendMetrics(metrics: Metric[]): Promise<void> {
    const datadogMetrics = metrics.map(metric => ({
      metric: `linchkit.console.${metric.name}`,
      type: metric.type,
      points: [[Date.now() / 1000, metric.value]],
      tags: metric.tags
    }));
    
    await this.client.v1.SubmitMetrics({
      series: datadogMetrics
    });
  }
  
  async sendEvent(event: Event): Promise<void> {
    await this.client.v1.CreateEvent({
      title: event.title,
      text: event.message,
      tags: event.tags,
      alertType: event.level,
      sourceTypeName: 'linchkit-console'
    });
  }
  
  async createDashboard(): Promise<string> {
    const dashboard = await this.client.v1.CreateDashboard({
      title: 'LinchKit Console Metrics',
      widgets: [
        {
          definition: {
            type: 'timeseries',
            requests: [{
              q: 'avg:linchkit.console.http_requests_total{*}',
              displayType: 'line'
            }],
            title: 'HTTP Requests'
          }
        },
        {
          definition: {
            type: 'query_value',
            requests: [{
              q: 'avg:linchkit.console.active_users{*}',
              aggregator: 'last'
            }],
            title: 'Active Users'
          }
        }
      ]
    });
    
    return dashboard.url;
  }
}
```

### 3. 与企业通知系统集成

```typescript
// integrations/notifications/SlackIntegration.ts
import { NotificationIntegration } from '@linch-kit/console';

export class SlackIntegration extends NotificationIntegration {
  name = 'slack';
  
  constructor(private config: SlackConfig) {
    super();
  }
  
  async sendAlert(alert: Alert): Promise<void> {
    const webhook = this.config.webhookUrl;
    const color = this.getAlertColor(alert.level);
    
    const message = {
      channel: this.config.channel,
      username: 'LinchKit Console',
      icon_emoji: ':warning:',
      attachments: [{
        color,
        title: alert.title,
        text: alert.message,
        fields: [
          {
            title: 'Environment',
            value: process.env.NODE_ENV,
            short: true
          },
          {
            title: 'Timestamp',
            value: new Date().toISOString(),
            short: true
          }
        ],
        footer: 'LinchKit Console',
        ts: Math.floor(Date.now() / 1000)
      }]
    };
    
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  }
  
  async sendUserNotification(user: User, notification: Notification): Promise<void> {
    const userSlackId = await this.getUserSlackId(user.email);
    if (!userSlackId) return;
    
    await this.sendDirectMessage(userSlackId, {
      text: notification.message,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: notification.message
          }
        },
        {
          type: 'actions',
          elements: notification.actions?.map(action => ({
            type: 'button',
            text: {
              type: 'plain_text',
              text: action.label
            },
            url: action.url
          })) || []
        }
      ]
    });
  }
  
  private getAlertColor(level: string): string {
    switch (level) {
      case 'critical': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'good';
      default: return '#439FE0';
    }
  }
  
  private async getUserSlackId(email: string): Promise<string | null> {
    // 从 Slack API 获取用户 ID
    const response = await fetch(`${this.config.apiUrl}/users.lookupByEmail`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.botToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const data = await response.json();
    return data.user?.id || null;
  }
}
```

## 高级配置示例

### 1. 多环境配置

```typescript
// config/environments/production.ts
export const productionConfig = {
  database: {
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    pool: {
      min: 5,
      max: 20,
      idle: 10000
    }
  },
  
  auth: {
    providers: ['saml', 'oauth'],
    session: {
      secret: process.env.SESSION_SECRET,
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
      secure: true,
      httpOnly: true,
      sameSite: 'strict'
    },
    saml: {
      entityId: process.env.SAML_ENTITY_ID,
      idpEntityId: process.env.SAML_IDP_ENTITY_ID,
      ssoUrl: process.env.SAML_SSO_URL,
      acsUrl: process.env.SAML_ACS_URL,
      cert: process.env.SAML_CERT
    }
  },
  
  monitoring: {
    enabled: true,
    metrics: {
      prometheus: {
        endpoint: '/metrics',
        labels: {
          environment: 'production',
          service: 'linchkit-console'
        }
      }
    },
    health: {
      endpoint: '/health',
      checks: [
        'database',
        'redis',
        'external-apis'
      ]
    },
    alerts: {
      email: {
        smtp: {
          host: process.env.SMTP_HOST,
          port: 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        },
        from: 'alerts@your-company.com',
        to: ['ops@your-company.com']
      },
      slack: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: '#alerts'
      }
    }
  },
  
  plugins: {
    marketplace: {
      enabled: true,
      autoUpdate: false,
      registry: 'https://plugins.your-company.com'
    },
    development: {
      hotReload: false,
      devMode: false
    },
    security: {
      allowUnsigned: false,
      trustedPublishers: [
        'your-company',
        'trusted-partner'
      ]
    }
  },
  
  security: {
    cors: {
      origin: [
        'https://console.your-company.com',
        'https://app.your-company.com'
      ],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // requests per window
    },
    csrf: {
      enabled: true,
      secret: process.env.CSRF_SECRET
    }
  },
  
  logging: {
    level: 'info',
    format: 'json',
    outputs: [
      {
        type: 'file',
        filename: '/var/log/linchkit-console.log',
        maxsize: 10485760, // 10MB
        maxFiles: 5
      },
      {
        type: 'datadog',
        apiKey: process.env.DATADOG_API_KEY,
        service: 'linchkit-console'
      }
    ]
  }
};
```

### 2. 负载均衡配置

```nginx
# nginx.conf
upstream console_backend {
    least_conn;
    server console-backend-1:3001 weight=1 max_fails=3 fail_timeout=30s;
    server console-backend-2:3001 weight=1 max_fails=3 fail_timeout=30s;
    server console-backend-3:3001 weight=1 max_fails=3 fail_timeout=30s;
}

upstream console_frontend {
    least_conn;
    server console-frontend-1:80 weight=1 max_fails=3 fail_timeout=30s;
    server console-frontend-2:80 weight=1 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name console.your-company.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name console.your-company.com;
    
    ssl_certificate /etc/ssl/certs/console.crt;
    ssl_certificate_key /etc/ssl/private/console.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # API 路由
    location /api/ {
        proxy_pass http://console_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket 支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态文件
    location /static/ {
        proxy_pass http://console_frontend;
        proxy_cache static_cache;
        proxy_cache_valid 200 1h;
        add_header X-Cache-Status $upstream_cache_status;
    }
    
    # 前端应用
    location / {
        proxy_pass http://console_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://console_backend/health;
        access_log off;
    }
}

# 缓存配置
proxy_cache_path /var/cache/nginx/static levels=1:2 keys_zone=static_cache:10m max_size=1g inactive=60m use_temp_path=off;
```

### 3. 监控和告警配置

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "console_alerts.yml"

scrape_configs:
  - job_name: 'linchkit-console'
    static_configs:
      - targets: ['console-backend:3001']
    metrics_path: '/metrics'
    scrape_interval: 5s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

```yaml
# console_alerts.yml
groups:
- name: console_alerts
  rules:
  - alert: ConsoleHighResponseTime
    expr: histogram_quantile(0.95, http_request_duration_seconds_bucket{job="linchkit-console"}) > 0.5
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "Console high response time"
      description: "95th percentile response time is {{ $value }}s"
  
  - alert: ConsoleHighErrorRate
    expr: rate(http_requests_total{job="linchkit-console",status=~"5.."}[5m]) > 0.1
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Console high error rate"
      description: "Error rate is {{ $value }} requests/second"
  
  - alert: ConsoleDown
    expr: up{job="linchkit-console"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Console is down"
      description: "Console has been down for more than 1 minute"
```

### 4. 自动化部署脚本

```bash
#!/bin/bash
# deploy.sh

set -e

# 配置
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
NAMESPACE="linchkit-console-${ENVIRONMENT}"

echo "Deploying LinchKit Console v${VERSION} to ${ENVIRONMENT}"

# 检查前置条件
if ! command -v kubectl &> /dev/null; then
    echo "kubectl is required but not installed"
    exit 1
fi

if ! command -v helm &> /dev/null; then
    echo "helm is required but not installed"
    exit 1
fi

# 创建命名空间
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# 部署数据库 secrets
kubectl create secret generic console-secrets \
    --namespace=${NAMESPACE} \
    --from-literal=database-url="${DATABASE_URL}" \
    --from-literal=session-secret="${SESSION_SECRET}" \
    --from-literal=google-client-id="${GOOGLE_CLIENT_ID}" \
    --from-literal=google-client-secret="${GOOGLE_CLIENT_SECRET}" \
    --dry-run=client -o yaml | kubectl apply -f -

# 部署 Helm chart
helm upgrade --install linchkit-console ./helm \
    --namespace=${NAMESPACE} \
    --set image.backend.tag=${VERSION} \
    --set image.frontend.tag=${VERSION} \
    --set environment=${ENVIRONMENT} \
    --values=./helm/values-${ENVIRONMENT}.yaml \
    --wait \
    --timeout=600s

# 等待部署完成
echo "Waiting for deployment to be ready..."
kubectl rollout status deployment/console-backend -n ${NAMESPACE}
kubectl rollout status deployment/console-frontend -n ${NAMESPACE}

# 运行健康检查
echo "Running health check..."
BACKEND_SERVICE=$(kubectl get service console-backend-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
if curl -f "http://${BACKEND_SERVICE}/health" > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

# 运行数据库迁移
echo "Running database migrations..."
kubectl run migration-job \
    --namespace=${NAMESPACE} \
    --image=linchkit/console-backend:${VERSION} \
    --restart=Never \
    --env="DATABASE_URL=${DATABASE_URL}" \
    --command -- npm run migrate

echo "🚀 Deployment completed successfully!"
echo "Frontend: https://console-${ENVIRONMENT}.your-company.com"
echo "API: https://console-${ENVIRONMENT}.your-company.com/api"
```

这些集成示例展示了如何在生产环境中部署和配置 @linch-kit/console，包括 Docker 容器化、Kubernetes 编排、企业系统集成、负载均衡、监控告警和自动化部署等关键方面。