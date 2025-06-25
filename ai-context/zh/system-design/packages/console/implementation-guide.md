# @linch-kit/console 实现指南

## 概述

@linch-kit/console 是 LinchKit 的企业级管理控制台，提供完整的 SaaS 管理功能。基于微服务架构，支持多租户管理、实时监控、插件市场、用户权限管理等企业级特性。

## 核心架构

### 1. 项目结构

```
src/
├── server/              # 服务端实现
│   ├── app.ts          # 主应用
│   ├── routes/         # API 路由
│   ├── middleware/     # 中间件
│   ├── controllers/    # 控制器
│   ├── services/       # 业务服务
│   └── plugins/        # 插件系统
├── client/             # 前端实现
│   ├── components/     # React 组件
│   ├── pages/          # 页面组件
│   ├── hooks/          # React Hooks
│   ├── contexts/       # React Context
│   └── utils/          # 工具函数
├── shared/             # 共享代码
│   ├── types/          # 类型定义
│   ├── schemas/        # 数据模型
│   └── constants/      # 常量定义
└── index.ts            # 主导出
```

### 2. 核心导出

```typescript
// src/index.ts
export * from './server';
export * from './client';
export * from './shared';

// 主要导出
export {
  // 服务端
  ConsoleApp,
  createConsoleConfig,
  setupDatabase,
  
  // 客户端
  ConsoleProvider,
  Dashboard,
  useConsole,
  useMonitoring,
  usePlugins,
  
  // 工具
  validateConfig,
  createPlugin,
  
  // 类型
  ConsoleAppOptions,
  PluginConfig,
  MonitoringConfig
} from './main';
```

## 服务端实现

### 1. 主应用类

```typescript
// src/server/app.ts
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { core } from '@linch-kit/core';
import { auth } from '@linch-kit/auth';
import { ConsoleAppOptions } from '../shared/types';
import { PluginManager } from './plugins/PluginManager';
import { MonitoringManager } from './services/MonitoringManager';
import { createRoutes } from './routes';

export class ConsoleApp {
  private app: express.Application;
  private server?: any;
  private pluginManager: PluginManager;
  private monitoringManager: MonitoringManager;
  
  constructor(private options: ConsoleAppOptions) {
    this.app = express();
    this.pluginManager = new PluginManager(options.plugins);
    this.monitoringManager = new MonitoringManager(options.monitoring);
    
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  private setupMiddleware() {
    // CORS 配置
    this.app.use(cors(this.options.cors));
    
    // 请求解析
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Session 配置
    this.app.use(session({
      secret: this.options.auth?.session.secret || 'default-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: this.options.auth?.session.maxAge || 24 * 60 * 60 * 1000,
        secure: this.options.auth?.session.secure || false
      }
    }));
    
    // 认证中间件
    this.app.use(auth.middleware());
    
    // 日志中间件
    this.app.use(core.middleware.logging());
    
    // 监控中间件
    if (this.options.monitoring?.enabled) {
      this.app.use(this.monitoringManager.middleware());
    }
  }
  
  private setupRoutes() {
    const routes = createRoutes({
      pluginManager: this.pluginManager,
      monitoringManager: this.monitoringManager
    });
    
    // API 路由
    this.app.use('/api', routes);
    
    // 静态文件服务
    this.app.use('/static', express.static('public'));
    
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version
      });
    });
  }
  
  async start(): Promise<void> {
    // 初始化数据库
    await this.setupDatabase();
    
    // 初始化插件
    await this.pluginManager.initialize();
    
    // 启动监控
    if (this.options.monitoring?.enabled) {
      await this.monitoringManager.start();
    }
    
    // 启动服务器
    const port = this.options.port || 3001;
    this.server = this.app.listen(port, () => {
      core.logger.info(`Console server started on port ${port}`);
    });
  }
  
  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
    
    await this.pluginManager.shutdown();
    await this.monitoringManager.stop();
    
    core.logger.info('Console server stopped');
  }
  
  private async setupDatabase() {
    if (this.options.database) {
      await core.database.connect(this.options.database);
      await this.runMigrations();
    }
  }
  
  private async runMigrations() {
    // 运行数据库迁移
    const migrations = [
      'create_users_table',
      'create_tenants_table',
      'create_plugins_table',
      'create_audit_logs_table'
    ];
    
    for (const migration of migrations) {
      await core.database.runMigration(migration);
    }
  }
  
  get router(): express.Router {
    return this.app as any;
  }
  
  get plugins(): PluginManager {
    return this.pluginManager;
  }
  
  get monitoring(): MonitoringManager {
    return this.monitoringManager;
  }
}
```

### 2. 路由系统

```typescript
// src/server/routes/index.ts
import { Router } from 'express';
import { authRoutes } from './auth';
import { userRoutes } from './users';
import { tenantRoutes } from './tenants';
import { pluginRoutes } from './plugins';
import { monitoringRoutes } from './monitoring';
import { auditRoutes } from './audit';

interface RouteOptions {
  pluginManager: PluginManager;
  monitoringManager: MonitoringManager;
}

export function createRoutes(options: RouteOptions): Router {
  const router = Router();
  
  // 认证路由
  router.use('/auth', authRoutes);
  
  // 用户管理路由
  router.use('/users', userRoutes);
  
  // 租户管理路由
  router.use('/tenants', tenantRoutes);
  
  // 插件管理路由
  router.use('/plugins', pluginRoutes(options.pluginManager));
  
  // 监控路由
  router.use('/monitoring', monitoringRoutes(options.monitoringManager));
  
  // 审计日志路由
  router.use('/audit', auditRoutes);
  
  return router;
}
```

```typescript
// src/server/routes/users.ts
import { Router } from 'express';
import { auth } from '@linch-kit/auth';
import { UserController } from '../controllers/UserController';

const router = Router();
const userController = new UserController();

// 获取用户列表
router.get('/',
  auth.requirePermission('users:read'),
  userController.list
);

// 创建用户
router.post('/',
  auth.requirePermission('users:create'),
  userController.create
);

// 获取用户详情
router.get('/:id',
  auth.requirePermission('users:read'),
  userController.get
);

// 更新用户
router.put('/:id',
  auth.requirePermission('users:update'),
  userController.update
);

// 删除用户
router.delete('/:id',
  auth.requirePermission('users:delete'),
  userController.delete
);

export { router as userRoutes };
```

### 3. 控制器实现

```typescript
// src/server/controllers/UserController.ts
import { Request, Response } from 'express';
import { auth } from '@linch-kit/auth';
import { crud } from '@linch-kit/crud';
import { core } from '@linch-kit/core';
import { UserService } from '../services/UserService';

export class UserController {
  private userService = new UserService();
  
  list = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, search, role } = req.query;
      
      const filter: any = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      if (role) {
        filter.roles = { $in: [role] };
      }
      
      const result = await crud.paginate('users', {
        filter,
        page: Number(page),
        limit: Number(limit),
        sort: { createdAt: -1 }
      });
      
      res.json(result);
    } catch (error) {
      core.logger.error('Failed to list users', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  create = async (req: Request, res: Response) => {
    try {
      const userData = req.body;
      
      // 验证输入
      const validation = await this.userService.validateUser(userData);
      if (!validation.valid) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validation.errors 
        });
      }
      
      // 检查邮箱是否已存在
      const existingUser = await crud.findOne('users', { email: userData.email });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      
      // 创建用户
      const user = await this.userService.createUser(userData);
      
      // 记录审计日志
      await this.userService.logAudit({
        action: 'user:create',
        actor: req.user.id,
        target: user.id,
        details: { email: user.email }
      });
      
      res.status(201).json(user);
    } catch (error) {
      core.logger.error('Failed to create user', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  get = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await crud.findById('users', id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      core.logger.error('Failed to get user', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const user = await crud.findById('users', id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // 验证更新数据
      const validation = await this.userService.validateUpdate(updateData);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.errors
        });
      }
      
      const updatedUser = await crud.update('users', id, updateData);
      
      // 记录审计日志
      await this.userService.logAudit({
        action: 'user:update',
        actor: req.user.id,
        target: id,
        details: updateData
      });
      
      res.json(updatedUser);
    } catch (error) {
      core.logger.error('Failed to update user', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const user = await crud.findById('users', id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // 检查是否可以删除
      if (user.id === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
      }
      
      await crud.delete('users', id);
      
      // 记录审计日志
      await this.userService.logAudit({
        action: 'user:delete',
        actor: req.user.id,
        target: id,
        details: { email: user.email }
      });
      
      res.status(204).send();
    } catch (error) {
      core.logger.error('Failed to delete user', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
```

### 4. 插件系统

```typescript
// src/server/plugins/PluginManager.ts
import { EventEmitter } from 'events';
import { core } from '@linch-kit/core';
import { Plugin } from './Plugin';
import { PluginConfig } from '../../shared/types';

export class PluginManager extends EventEmitter {
  private plugins = new Map<string, Plugin>();
  private registry = new Map<string, any>();
  
  constructor(private config: PluginConfig = {}) {
    super();
  }
  
  async initialize(): Promise<void> {
    // 从数据库加载已安装的插件
    const installedPlugins = await this.loadInstalledPlugins();
    
    for (const pluginData of installedPlugins) {
      if (pluginData.enabled) {
        await this.loadPlugin(pluginData);
      }
    }
    
    core.logger.info(`Loaded ${this.plugins.size} plugins`);
  }
  
  async installPlugin(pluginId: string, version?: string): Promise<void> {
    try {
      // 从注册表下载插件
      const pluginPackage = await this.downloadPlugin(pluginId, version);
      
      // 验证插件
      await this.validatePlugin(pluginPackage);
      
      // 安装插件
      const plugin = await this.loadPluginFromPackage(pluginPackage);
      
      // 运行安装钩子
      await plugin.onInstall();
      
      // 保存到数据库
      await this.savePluginToDatabase(plugin);
      
      // 启用插件
      if (plugin.autoEnable) {
        await this.enablePlugin(pluginId);
      }
      
      this.emit('plugin:installed', { pluginId, version });
      core.logger.info(`Plugin ${pluginId} installed successfully`);
    } catch (error) {
      core.logger.error(`Failed to install plugin ${pluginId}`, error);
      throw error;
    }
  }
  
  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    try {
      await plugin.onEnable();
      plugin.enabled = true;
      
      // 更新数据库
      await this.updatePluginStatus(pluginId, true);
      
      this.emit('plugin:enabled', { pluginId });
      core.logger.info(`Plugin ${pluginId} enabled`);
    } catch (error) {
      core.logger.error(`Failed to enable plugin ${pluginId}`, error);
      throw error;
    }
  }
  
  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    try {
      await plugin.onDisable();
      plugin.enabled = false;
      
      // 更新数据库
      await this.updatePluginStatus(pluginId, false);
      
      this.emit('plugin:disabled', { pluginId });
      core.logger.info(`Plugin ${pluginId} disabled`);
    } catch (error) {
      core.logger.error(`Failed to disable plugin ${pluginId}`, error);
      throw error;
    }
  }
  
  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    try {
      // 先禁用插件
      if (plugin.enabled) {
        await this.disablePlugin(pluginId);
      }
      
      // 运行卸载钩子
      await plugin.onUninstall();
      
      // 从内存中移除
      this.plugins.delete(pluginId);
      
      // 从数据库删除
      await this.deletePluginFromDatabase(pluginId);
      
      this.emit('plugin:uninstalled', { pluginId });
      core.logger.info(`Plugin ${pluginId} uninstalled`);
    } catch (error) {
      core.logger.error(`Failed to uninstall plugin ${pluginId}`, error);
      throw error;
    }
  }
  
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }
  
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
  
  getEnabledPlugins(): Plugin[] {
    return this.getAllPlugins().filter(plugin => plugin.enabled);
  }
  
  async configurePlugin(pluginId: string, config: any): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    // 验证配置
    await plugin.validateConfig(config);
    
    // 应用配置
    await plugin.configure(config);
    
    // 保存配置
    await this.savePluginConfig(pluginId, config);
    
    this.emit('plugin:configured', { pluginId, config });
  }
  
  async shutdown(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.enabled) {
        await plugin.onDisable();
      }
    }
    
    this.plugins.clear();
    core.logger.info('Plugin manager shutdown');
  }
  
  private async loadInstalledPlugins(): Promise<any[]> {
    // 从数据库加载插件列表
    return await core.database.find('plugins', {});
  }
  
  private async downloadPlugin(pluginId: string, version?: string): Promise<any> {
    // 从插件注册表下载
    const registryUrl = this.config.marketplace?.registry || 'https://plugins.linchkit.com';
    const response = await fetch(`${registryUrl}/${pluginId}/${version || 'latest'}`);
    
    if (!response.ok) {
      throw new Error(`Failed to download plugin: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  private async validatePlugin(pluginPackage: any): Promise<void> {
    // 验证插件包结构和安全性
    const requiredFields = ['name', 'version', 'main', 'permissions'];
    
    for (const field of requiredFields) {
      if (!pluginPackage[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // 验证权限请求
    await this.validatePermissions(pluginPackage.permissions);
  }
  
  private async validatePermissions(permissions: string[]): Promise<void> {
    // 验证插件请求的权限是否合理
    const dangerousPermissions = ['system:admin', 'database:raw'];
    
    for (const permission of permissions) {
      if (dangerousPermissions.includes(permission)) {
        throw new Error(`Plugin requests dangerous permission: ${permission}`);
      }
    }
  }
}
```

```typescript
// src/server/plugins/Plugin.ts
export abstract class Plugin {
  abstract name: string;
  abstract version: string;
  abstract description: string;
  
  enabled = false;
  autoEnable = false;
  permissions: string[] = [];
  dependencies: string[] = [];
  config: any = {};
  
  // 生命周期钩子
  async onInstall(): Promise<void> {
    // 插件安装时调用
  }
  
  async onUninstall(): Promise<void> {
    // 插件卸载时调用
  }
  
  async onEnable(): Promise<void> {
    // 插件启用时调用
  }
  
  async onDisable(): Promise<void> {
    // 插件禁用时调用
  }
  
  async configure(config: any): Promise<void> {
    this.config = config;
  }
  
  async validateConfig(config: any): Promise<void> {
    // 验证配置
  }
  
  // 扩展点
  getRoutes(): any[] {
    return [];
  }
  
  getMenuItems(): any[] {
    return [];
  }
  
  getWidgets(): any[] {
    return [];
  }
  
  getPermissions(): string[] {
    return this.permissions;
  }
}
```

### 5. 监控系统

```typescript
// src/server/services/MonitoringManager.ts
import { EventEmitter } from 'events';
import { core } from '@linch-kit/core';
import { MonitoringConfig } from '../../shared/types';

export class MonitoringManager extends EventEmitter {
  private healthChecks = new Map<string, HealthCheck>();
  private alerts = new Map<string, Alert>();
  private metrics: any;
  
  constructor(private config: MonitoringConfig = { enabled: false }) {
    super();
    
    if (config.metrics?.prometheus) {
      this.setupPrometheus();
    }
  }
  
  async start(): Promise<void> {
    if (!this.config.enabled) return;
    
    // 启动健康检查
    this.startHealthChecks();
    
    // 启动指标收集
    this.startMetricsCollection();
    
    // 启动告警监控
    this.startAlertMonitoring();
    
    core.logger.info('Monitoring started');
  }
  
  async stop(): Promise<void> {
    // 停止所有监控任务
    this.stopHealthChecks();
    this.stopMetricsCollection();
    this.stopAlertMonitoring();
    
    core.logger.info('Monitoring stopped');
  }
  
  middleware() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        
        // 记录请求指标
        this.recordRequestMetric({
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration
        });
      });
      
      next();
    };
  }
  
  addHealthCheck(name: string, check: HealthCheck): void {
    this.healthChecks.set(name, check);
  }
  
  removeHealthCheck(name: string): void {
    this.healthChecks.delete(name);
  }
  
  async runHealthChecks(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    
    for (const [name, check] of this.healthChecks) {
      try {
        const result = await check.run();
        results.push({
          name,
          status: result.healthy ? 'healthy' : 'unhealthy',
          message: result.message,
          timestamp: new Date()
        });
      } catch (error) {
        results.push({
          name,
          status: 'error',
          message: error.message,
          timestamp: new Date()
        });
      }
    }
    
    return results;
  }
  
  addAlert(name: string, alert: Alert): void {
    this.alerts.set(name, alert);
  }
  
  async checkAlerts(): Promise<void> {
    for (const [name, alert] of this.alerts) {
      try {
        const triggered = await alert.check();
        if (triggered) {
          await this.triggerAlert(name, alert);
        }
      } catch (error) {
        core.logger.error(`Alert check failed: ${name}`, error);
      }
    }
  }
  
  private async triggerAlert(name: string, alert: Alert): Promise<void> {
    core.logger.warn(`Alert triggered: ${name}`);
    
    // 发送邮件通知
    if (this.config.alerts?.email) {
      await this.sendEmailAlert(name, alert);
    }
    
    // 发送 Webhook 通知
    if (this.config.alerts?.webhook) {
      await this.sendWebhookAlert(name, alert);
    }
    
    this.emit('alert:triggered', { name, alert });
  }
  
  private setupPrometheus(): void {
    const prometheus = require('prom-client');
    
    // 创建指标
    this.metrics = {
      httpRequestDuration: new prometheus.Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'path', 'status_code']
      }),
      
      httpRequestTotal: new prometheus.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'path', 'status_code']
      }),
      
      systemMemoryUsage: new prometheus.Gauge({
        name: 'system_memory_usage_bytes',
        help: 'System memory usage in bytes'
      }),
      
      systemCpuUsage: new prometheus.Gauge({
        name: 'system_cpu_usage_percent',
        help: 'System CPU usage percentage'
      })
    };
    
    // 注册默认指标
    prometheus.collectDefaultMetrics();
  }
  
  private recordRequestMetric(data: any): void {
    if (this.metrics) {
      this.metrics.httpRequestDuration
        .labels(data.method, data.path, data.statusCode)
        .observe(data.duration / 1000);
      
      this.metrics.httpRequestTotal
        .labels(data.method, data.path, data.statusCode)
        .inc();
    }
  }
  
  private startHealthChecks(): void {
    setInterval(async () => {
      await this.runHealthChecks();
    }, this.config.health?.interval || 30000);
  }
  
  private startMetricsCollection(): void {
    setInterval(() => {
      if (this.metrics) {
        // 收集系统指标
        const memUsage = process.memoryUsage();
        this.metrics.systemMemoryUsage.set(memUsage.heapUsed);
        
        const cpuUsage = process.cpuUsage();
        this.metrics.systemCpuUsage.set(
          (cpuUsage.user + cpuUsage.system) / 1000000
        );
      }
    }, 5000);
  }
  
  private startAlertMonitoring(): void {
    setInterval(async () => {
      await this.checkAlerts();
    }, 60000);
  }
  
  private stopHealthChecks(): void {
    // 实现停止逻辑
  }
  
  private stopMetricsCollection(): void {
    // 实现停止逻辑
  }
  
  private stopAlertMonitoring(): void {
    // 实现停止逻辑
  }
}
```

## 客户端实现

### 1. React Provider

```typescript
// src/client/contexts/ConsoleProvider.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { LinchKitUIProvider } from '@linch-kit/ui';
import { ConsoleProviderProps, ConsoleState, ConsoleAction } from '../types';
import { consoleReducer, initialState } from './consoleReducer';
import { ConsoleApi } from '../services/ConsoleApi';

const ConsoleContext = createContext<{
  state: ConsoleState;
  dispatch: React.Dispatch<ConsoleAction>;
  api: ConsoleApi;
} | null>(null);

export const useConsole = () => {
  const context = useContext(ConsoleContext);
  if (!context) {
    throw new Error('useConsole must be used within ConsoleProvider');
  }
  return context;
};

export const ConsoleProvider: React.FC<ConsoleProviderProps> = ({
  apiUrl,
  auth,
  theme = 'auto',
  children
}) => {
  const [state, dispatch] = useReducer(consoleReducer, initialState);
  const api = new ConsoleApi(apiUrl);
  
  useEffect(() => {
    // 初始化控制台
    const initializeConsole = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        // 检查认证状态
        const user = await api.getCurrentUser();
        if (user) {
          dispatch({ type: 'SET_USER', payload: user });
          
          // 加载用户权限
          const permissions = await api.getUserPermissions();
          dispatch({ type: 'SET_PERMISSIONS', payload: permissions });
          
          // 加载租户信息
          if (user.tenantId) {
            const tenant = await api.getTenant(user.tenantId);
            dispatch({ type: 'SET_TENANT', payload: tenant });
          }
        }
      } catch (error) {
        console.error('Failed to initialize console:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    initializeConsole();
  }, [apiUrl]);
  
  const contextValue = {
    state,
    dispatch,
    api
  };
  
  return (
    <ConsoleContext.Provider value={contextValue}>
      <LinchKitUIProvider theme={theme}>
        {children}
      </LinchKitUIProvider>
    </ConsoleContext.Provider>
  );
};
```

### 2. 主仪表盘组件

```typescript
// src/client/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Layout, Sidebar, Header, MainContent } from '@linch-kit/ui';
import { useConsole } from '../contexts/ConsoleProvider';
import { Navigation } from './Navigation';
import { PageRouter } from './PageRouter';
import { NotificationCenter } from './NotificationCenter';
import { UserMenu } from './UserMenu';

export const Dashboard: React.FC = () => {
  const { state, api } = useConsole();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  if (state.loading) {
    return <div>Loading...</div>;
  }
  
  if (!state.user) {
    return <div>Please login</div>;
  }
  
  return (
    <Layout>
      <Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              ☰
            </button>
            <h1 className="text-xl font-semibold">LinchKit Console</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationCenter />
            <UserMenu user={state.user} />
          </div>
        </div>
      </Header>
      
      <div className="flex flex-1">
        <Sidebar collapsed={sidebarCollapsed}>
          <Navigation permissions={state.permissions} />
        </Sidebar>
        
        <MainContent>
          <PageRouter />
        </MainContent>
      </div>
    </Layout>
  );
};
```

### 3. 页面路由

```typescript
// src/client/components/PageRouter.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useConsole } from '../contexts/ConsoleProvider';
import { UserManagement } from '../pages/UserManagement';
import { TenantManagement } from '../pages/TenantManagement';
import { SystemMonitoring } from '../pages/SystemMonitoring';
import { PluginMarketplace } from '../pages/PluginMarketplace';
import { AuditLogs } from '../pages/AuditLogs';
import { SystemSettings } from '../pages/SystemSettings';
import { Dashboard as DashboardPage } from '../pages/Dashboard';

export const PageRouter: React.FC = () => {
  const { state } = useConsole();
  
  const hasPermission = (permission: string) => {
    return state.permissions.includes(permission) || 
           state.permissions.includes('admin:all');
  };
  
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      
      {hasPermission('users:read') && (
        <Route path="/users" element={<UserManagement />} />
      )}
      
      {hasPermission('tenants:read') && (
        <Route path="/tenants" element={<TenantManagement />} />
      )}
      
      {hasPermission('monitoring:read') && (
        <Route path="/monitoring" element={<SystemMonitoring />} />
      )}
      
      {hasPermission('plugins:read') && (
        <Route path="/plugins" element={<PluginMarketplace />} />
      )}
      
      {hasPermission('audit:read') && (
        <Route path="/audit" element={<AuditLogs />} />
      )}
      
      {hasPermission('settings:read') && (
        <Route path="/settings" element={<SystemSettings />} />
      )}
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
```

### 4. 用户管理页面

```typescript
// src/client/pages/UserManagement.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  SchemaTable,
  Button,
  Modal,
  SchemaForm,
  toast,
  Input,
  Select
} from '@linch-kit/ui';
import { useConsole } from '../contexts/ConsoleProvider';

const userSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: '姓名', minLength: 2 },
    email: { type: 'string', format: 'email', title: '邮箱' },
    roles: {
      type: 'array',
      title: '角色',
      items: {
        type: 'string',
        enum: ['admin', 'user', 'manager'],
        enumNames: ['管理员', '用户', '经理']
      }
    },
    active: { type: 'boolean', title: '激活状态' }
  },
  required: ['name', 'email']
};

export const UserManagement: React.FC = () => {
  const { state, api } = useConsole();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  
  const hasCreatePermission = state.permissions.includes('users:create');
  const hasUpdatePermission = state.permissions.includes('users:update');
  const hasDeletePermission = state.permissions.includes('users:delete');
  
  useEffect(() => {
    loadUsers();
  }, [searchTerm, selectedRole]);
  
  const loadUsers = async () => {
    try {
      setLoading(true);
      const result = await api.getUsers({
        search: searchTerm,
        role: selectedRole
      });
      setUsers(result.data);
    } catch (error) {
      toast.error('加载用户失败');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };
  
  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };
  
  const handleDeleteUser = async (user: any) => {
    if (window.confirm(`确定删除用户 ${user.name}？`)) {
      try {
        await api.deleteUser(user.id);
        toast.success('删除成功');
        await loadUsers();
      } catch (error) {
        toast.error('删除失败');
      }
    }
  };
  
  const handleSubmit = async (formData: any) => {
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
        toast.success('更新成功');
      } else {
        await api.createUser(formData);
        toast.success('创建成功');
      }
      
      setIsModalOpen(false);
      await loadUsers();
    } catch (error) {
      toast.error(editingUser ? '更新失败' : '创建失败');
    }
  };
  
  const actions = [];
  if (hasUpdatePermission) {
    actions.push({
      key: 'edit',
      label: '编辑',
      icon: '✏️',
      onClick: handleEditUser
    });
  }
  if (hasDeletePermission) {
    actions.push({
      key: 'delete',
      label: '删除',
      icon: '🗑️',
      danger: true,
      onClick: handleDeleteUser
    });
  }
  
  return (
    <div className="space-y-6">
      <Card title="用户管理">
        <div className="mb-6 flex space-x-4">
          <Input
            placeholder="搜索用户..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="flex-1"
          />
          
          <Select
            placeholder="筛选角色"
            value={selectedRole}
            onChange={setSelectedRole}
            options={[
              { label: '全部', value: '' },
              { label: '管理员', value: 'admin' },
              { label: '用户', value: 'user' },
              { label: '经理', value: 'manager' }
            ]}
          />
          
          {hasCreatePermission && (
            <Button onClick={handleCreateUser}>
              创建用户
            </Button>
          )}
        </div>
        
        <SchemaTable
          schema={userSchema}
          data={users}
          loading={loading}
          actions={actions}
          pagination={{
            pageSize: 10,
            showSizeChanger: true
          }}
        />
      </Card>
      
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? '编辑用户' : '创建用户'}
        width={600}
      >
        <SchemaForm
          schema={userSchema}
          data={editingUser}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
```

## 测试策略

### 1. 后端测试

```typescript
// tests/server/UserController.test.ts
import request from 'supertest';
import { ConsoleApp } from '../../src/server/app';
import { createTestDatabase } from '../helpers/database';

describe('UserController', () => {
  let app: ConsoleApp;
  let testDb: any;
  
  beforeAll(async () => {
    testDb = await createTestDatabase();
    app = new ConsoleApp({
      database: testDb.config,
      auth: { providers: ['local'] }
    });
    await app.start();
  });
  
  afterAll(async () => {
    await app.stop();
    await testDb.cleanup();
  });
  
  describe('GET /api/users', () => {
    it('should return user list for authorized user', async () => {
      const token = await testDb.createAuthToken('admin');
      
      const response = await request(app.router)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('should return 401 for unauthorized user', async () => {
      await request(app.router)
        .get('/api/users')
        .expect(401);
    });
  });
  
  describe('POST /api/users', () => {
    it('should create user with valid data', async () => {
      const token = await testDb.createAuthToken('admin');
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        roles: ['user']
      };
      
      const response = await request(app.router)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(userData)
        .expect(201);
      
      expect(response.body).toMatchObject(userData);
      expect(response.body).toHaveProperty('id');
    });
    
    it('should return 400 for invalid data', async () => {
      const token = await testDb.createAuthToken('admin');
      
      await request(app.router)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test' }) // 缺少 email
        .expect(400);
    });
  });
});
```

### 2. 前端测试

```typescript
// tests/client/UserManagement.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConsoleProvider } from '../../src/client/contexts/ConsoleProvider';
import { UserManagement } from '../../src/client/pages/UserManagement';
import { mockApi } from '../mocks/api';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ConsoleProvider apiUrl="http://localhost:3001/api">
        {component}
      </ConsoleProvider>
    </BrowserRouter>
  );
};

describe('UserManagement', () => {
  beforeEach(() => {
    mockApi.reset();
  });
  
  it('should render user list', async () => {
    mockApi.getUsers.mockResolvedValue({
      data: [
        { id: '1', name: 'John Doe', email: 'john@example.com', roles: ['user'] }
      ]
    });
    
    renderWithProviders(<UserManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });
  
  it('should open create user modal', async () => {
    mockApi.getUsers.mockResolvedValue({ data: [] });
    
    renderWithProviders(<UserManagement />);
    
    fireEvent.click(screen.getByText('创建用户'));
    
    await waitFor(() => {
      expect(screen.getByText('创建用户')).toBeInTheDocument();
    });
  });
  
  it('should create user successfully', async () => {
    mockApi.getUsers.mockResolvedValue({ data: [] });
    mockApi.createUser.mockResolvedValue({
      id: '1',
      name: 'New User',
      email: 'new@example.com'
    });
    
    renderWithProviders(<UserManagement />);
    
    fireEvent.click(screen.getByText('创建用户'));
    
    fireEvent.change(screen.getByLabelText('姓名 *'), {
      target: { value: 'New User' }
    });
    fireEvent.change(screen.getByLabelText('邮箱 *'), {
      target: { value: 'new@example.com' }
    });
    
    fireEvent.click(screen.getByText('提交'));
    
    await waitFor(() => {
      expect(mockApi.createUser).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com'
      });
    });
  });
});
```

### 3. 集成测试

```typescript
// tests/integration/console.test.ts
import { ConsoleApp } from '../../src/server/app';
import { createTestConfig } from '../helpers/config';

describe('Console Integration', () => {
  let console: ConsoleApp;
  
  beforeAll(async () => {
    const config = createTestConfig();
    console = new ConsoleApp(config);
    await console.start();
  });
  
  afterAll(async () => {
    await console.stop();
  });
  
  it('should start console successfully', () => {
    expect(console).toBeDefined();
    expect(console.router).toBeDefined();
  });
  
  it('should load plugins successfully', async () => {
    const plugins = console.plugins.getAllPlugins();
    expect(plugins).toBeDefined();
  });
  
  it('should respond to health check', async () => {
    const response = await request(console.router)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('ok');
  });
});
```

这个实现指南提供了 @linch-kit/console 包的完整架构和实现方案，涵盖了服务端、客户端、插件系统、监控系统等关键组件的详细实现。