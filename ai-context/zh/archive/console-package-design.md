# @linch-kit/console

LinchKit 的企业级管理控制台，提供完整的 SaaS 管理功能，包括多租户管理、系统监控、插件市场、用户权限管理等。

## 特性

- 🏢 **多租户管理**: 企业级多租户架构和资源隔离
- 👥 **用户权限**: 细粒度的 RBAC/ABAC 权限管理
- 📊 **实时监控**: 系统性能、健康状态、业务指标监控
- 🔌 **插件市场**: 插件发现、安装、配置和管理
- 🗄️ **数据管理**: Schema 编辑、数据迁移、备份恢复
- 🔍 **审计日志**: 完整的操作记录和安全审计
- 🎛️ **仪表盘**: 可定制的企业级仪表盘
- ⚙️ **系统配置**: 全局设置和环境配置管理

## 安装

```bash
pnpm add @linch-kit/console
```

## 快速开始

### 1. 基础配置

```typescript
import { ConsoleApp, createConsoleConfig } from '@linch-kit/console';

const config = createConsoleConfig({
  // 数据库配置
  database: {
    url: process.env.DATABASE_URL
  },
  
  // 认证配置
  auth: {
    providers: ['local', 'oauth'],
    session: {
      secret: process.env.SESSION_SECRET,
      maxAge: 24 * 60 * 60 * 1000 // 24小时
    }
  },
  
  // 监控配置
  monitoring: {
    enabled: true,
    metrics: {
      prometheus: {
        endpoint: '/metrics'
      }
    }
  },
  
  // 插件配置
  plugins: {
    marketplace: {
      enabled: true,
      autoUpdate: false
    }
  }
});

const console = new ConsoleApp(config);
await console.start();
```

### 2. 启动控制台

```typescript
// app.ts
import express from 'express';
import { ConsoleApp } from '@linch-kit/console';

const app = express();
const console = new ConsoleApp({
  port: 3001,
  basePath: '/admin',
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true
  }
});

// 挂载控制台
app.use('/admin', console.router);

app.listen(3000, () => {
  console.log('Console running at http://localhost:3000/admin');
});
```

### 3. 前端集成

```tsx
// admin/App.tsx
import { ConsoleProvider, Dashboard } from '@linch-kit/console/react';

function AdminApp() {
  return (
    <ConsoleProvider
      apiUrl="http://localhost:3000/admin/api"
      auth={{
        loginUrl: '/admin/login',
        logoutUrl: '/admin/logout'
      }}
    >
      <Dashboard />
    </ConsoleProvider>
  );
}

export default AdminApp;
```

## 📁 文档导航

| 文档 | 状态 | 描述 |
|------|------|------|
| [实现指南](./implementation-guide.md) | ✅ 完成 | 控制台架构和模块设计 |
| [集成示例](./integration-examples.md) | ✅ 完成 | 部署和配置示例 |

## API 参考

### ConsoleApp

主要的控制台应用程序类。

```typescript
interface ConsoleAppOptions {
  port?: number;
  basePath?: string;
  cors?: CorsOptions;
  auth?: AuthConfig;
  monitoring?: MonitoringConfig;
  plugins?: PluginConfig;
  database?: DatabaseConfig;
}

class ConsoleApp {
  constructor(options: ConsoleAppOptions);
  
  // 启动控制台
  async start(): Promise<void>;
  
  // 停止控制台
  async stop(): Promise<void>;
  
  // 获取 Express 路由器
  get router(): express.Router;
  
  // 获取插件管理器
  get plugins(): PluginManager;
  
  // 获取监控管理器
  get monitoring(): MonitoringManager;
}
```

### 配置接口

#### AuthConfig

```typescript
interface AuthConfig {
  providers: ('local' | 'oauth' | 'saml')[];
  session: {
    secret: string;
    maxAge: number;
    secure?: boolean;
  };
  oauth?: {
    google?: OAuthProviderConfig;
    github?: OAuthProviderConfig;
    microsoft?: OAuthProviderConfig;
  };
  saml?: SAMLConfig;
}
```

#### MonitoringConfig

```typescript
interface MonitoringConfig {
  enabled: boolean;
  metrics: {
    prometheus?: {
      endpoint: string;
      labels?: Record<string, string>;
    };
  };
  health: {
    endpoint: string;
    checks: HealthCheck[];
  };
  alerts: {
    email?: EmailAlertConfig;
    webhook?: WebhookAlertConfig;
  };
}
```

#### PluginConfig

```typescript
interface PluginConfig {
  marketplace: {
    enabled: boolean;
    autoUpdate: boolean;
    registry?: string;
  };
  development: {
    hotReload: boolean;
    devMode: boolean;
  };
}
```

### React 组件

#### ConsoleProvider

```typescript
interface ConsoleProviderProps {
  apiUrl: string;
  auth: {
    loginUrl: string;
    logoutUrl: string;
  };
  theme?: 'light' | 'dark' | 'auto';
  children: React.ReactNode;
}

function ConsoleProvider(props: ConsoleProviderProps): JSX.Element;
```

#### Dashboard

```typescript
interface DashboardProps {
  layout?: 'sidebar' | 'top-nav';
  widgets?: WidgetConfig[];
  customPages?: PageConfig[];
}

function Dashboard(props: DashboardProps): JSX.Element;
```

#### 页面组件

```typescript
// 用户管理
function UserManagement(): JSX.Element;

// 租户管理
function TenantManagement(): JSX.Element;

// 系统监控
function SystemMonitoring(): JSX.Element;

// 插件市场
function PluginMarketplace(): JSX.Element;

// 审计日志
function AuditLogs(): JSX.Element;

// 系统设置
function SystemSettings(): JSX.Element;
```

### Hooks

#### useConsole

```typescript
interface ConsoleContext {
  user: User | null;
  tenant: Tenant | null;
  permissions: string[];
  config: ConsoleConfig;
}

function useConsole(): ConsoleContext;
```

#### useMonitoring

```typescript
interface MonitoringData {
  system: SystemMetrics;
  application: ApplicationMetrics;
  database: DatabaseMetrics;
}

function useMonitoring(): {
  data: MonitoringData;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
};
```

#### usePlugins

```typescript
interface PluginInfo {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  config: any;
}

function usePlugins(): {
  plugins: PluginInfo[];
  install: (pluginId: string) => Promise<void>;
  uninstall: (pluginId: string) => Promise<void>;
  enable: (pluginId: string) => Promise<void>;
  disable: (pluginId: string) => Promise<void>;
  configure: (pluginId: string, config: any) => Promise<void>;
};
```

### 工具函数

#### createConsoleConfig

```typescript
function createConsoleConfig(options: Partial<ConsoleAppOptions>): ConsoleAppOptions;
```

#### validateConfig

```typescript
function validateConfig(config: ConsoleAppOptions): ValidationResult;
```

#### setupDatabase

```typescript
function setupDatabase(config: DatabaseConfig): Promise<Database>;
```

## 权限系统

### 预定义角色

- **Super Admin**: 超级管理员，拥有所有权限
- **Tenant Admin**: 租户管理员，管理单个租户
- **User Manager**: 用户管理员，管理用户和权限
- **Plugin Manager**: 插件管理员，管理插件安装和配置
- **Monitor**: 监控人员，查看系统状态和日志
- **Auditor**: 审计人员，查看审计日志

### 权限列表

```typescript
const PERMISSIONS = {
  // 用户管理
  'users:read': '查看用户',
  'users:create': '创建用户',
  'users:update': '更新用户',
  'users:delete': '删除用户',
  
  // 租户管理
  'tenants:read': '查看租户',
  'tenants:create': '创建租户',
  'tenants:update': '更新租户',
  'tenants:delete': '删除租户',
  
  // 系统监控
  'monitoring:read': '查看监控',
  'monitoring:configure': '配置监控',
  
  // 插件管理
  'plugins:read': '查看插件',
  'plugins:install': '安装插件',
  'plugins:configure': '配置插件',
  'plugins:uninstall': '卸载插件',
  
  // 审计日志
  'audit:read': '查看审计日志',
  
  // 系统设置
  'settings:read': '查看设置',
  'settings:update': '更新设置'
};
```

## 自定义开发

### 自定义页面

```typescript
// pages/CustomPage.tsx
import { ConsolePage, PageHeader, Card } from '@linch-kit/console/react';

function CustomPage() {
  return (
    <ConsolePage>
      <PageHeader title="自定义页面" />
      <Card>
        <p>自定义内容</p>
      </Card>
    </ConsolePage>
  );
}

// 注册页面
console.addPage({
  path: '/custom',
  component: CustomPage,
  title: '自定义页面',
  permissions: ['custom:read']
});
```

### 自定义插件

```typescript
// plugins/custom-plugin.ts
import { Plugin } from '@linch-kit/console';

export class CustomPlugin extends Plugin {
  name = 'custom-plugin';
  version = '1.0.0';
  
  async onInstall() {
    // 插件安装逻辑
  }
  
  async onEnable() {
    // 插件启用逻辑
  }
  
  async onDisable() {
    // 插件禁用逻辑
  }
  
  getRoutes() {
    return [
      {
        path: '/custom-feature',
        component: CustomFeatureComponent
      }
    ];
  }
  
  getMenuItems() {
    return [
      {
        key: 'custom-feature',
        label: '自定义功能',
        icon: '🔧',
        path: '/custom-feature'
      }
    ];
  }
}
```

## 部署配置

### Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

### 环境变量

```bash
# .env
DATABASE_URL=postgresql://user:pass@localhost:5432/console
SESSION_SECRET=your-session-secret
REDIS_URL=redis://localhost:6379

# 认证配置
OAUTH_GOOGLE_CLIENT_ID=your-google-client-id
OAUTH_GOOGLE_CLIENT_SECRET=your-google-secret

# 监控配置
PROMETHEUS_ENABLED=true
HEALTH_CHECK_INTERVAL=30000

# 插件配置
PLUGIN_MARKETPLACE_ENABLED=true
PLUGIN_AUTO_UPDATE=false
```

## 最佳实践

1. **安全第一**: 始终验证权限，记录敏感操作
2. **性能优化**: 使用缓存和分页，避免大量数据查询
3. **用户体验**: 提供清晰的反馈和错误信息
4. **可维护性**: 保持代码模块化，使用类型安全
5. **监控告警**: 设置关键指标监控和及时告警

## License

MIT