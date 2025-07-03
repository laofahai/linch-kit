# LinchKit 系统架构总览

## 🏗️ 核心架构原则

### 设计哲学
- **不增加新包**: 基于现有6+1架构扩展，保持简洁
- **职责明确**: 每个包的扩展都在其职责范围内
- **向后兼容**: 现有功能不受影响
- **配置驱动**: 通过配置控制新功能启用

### 架构依赖层次
```
L0: @linch-kit/core      → 基础设施 (日志、配置、插件系统)
L1: @linch-kit/schema    → Schema引擎 (验证、类型生成)
L2: @linch-kit/auth      → 认证权限 (NextAuth + CASL)
L2: @linch-kit/crud      → CRUD操作 (类型安全、权限集成)
L3: @linch-kit/trpc      → API层 (端到端类型安全)
L3: @linch-kit/ui        → UI组件 (shadcn/ui + 企业组件)
L4: modules/console      → 管理平台 (多租户、权限管理)
```

## 🎯 模块化架构设计

### 应用层 (Applications)
```
apps/starter        # 生产级基础应用
apps/demo-app       # 功能演示应用
apps/website        # 文档平台 (Nextra)
```

### 模块层 (Modules)
```
modules/console     # 企业级管理控制台
modules/crm         # 客户关系管理 (规划中)
modules/cms         # 内容管理系统 (规划中)
```

### 插件层 (Plugins)
```
plugins/analytics   # 数据分析插件 (规划中)
plugins/auth        # 认证插件扩展 (规划中)
plugins/storage     # 文件存储插件 (规划中)
```

### 包层 (Packages)
```
@linch-kit/core     # 基础设施包
@linch-kit/schema   # Schema引擎包
@linch-kit/auth     # 认证权限包
@linch-kit/crud     # CRUD操作包
@linch-kit/trpc     # API层包
@linch-kit/ui       # UI组件包
```

## 🔧 Console模块架构定位

### 角色定义
- **定位**: 功能库(Library)，通过npm包被starter集成使用
- **集成关系**: Console依赖所有LinchKit包，提供企业级管理控制台功能
- **设计原则**: 
  - 不是独立应用
  - 不包含数据库逻辑
  - 不处理认证流程
  - 专注管理功能UI和业务逻辑

### 职责边界

**Starter应用职责**:
- 应用外壳和布局容器
- 多标签页管理逻辑
- 全局搜索框UI
- 主导航和路由入口
- 用户认证和会话管理

**Console模块职责**:
- 企业级管理功能UI
- tRPC搜索API提供
- 可嵌入的页面组件
- 租户/用户/权限管理逻辑

## 🚀 三阶段系统演进

### 阶段一：核心体验升级 (当前焦点)
1. **多标签页工作区布局** - 类似VSCode的多Tab工作模式
2. **插件化全局搜索** - Command Palette风格的搜索体验
3. **Console搜索API集成** - 企业级数据搜索能力
4. **路由集成规范** - 组件间协同工作机制

### 阶段二：Console模块功能完善
1. **租户管理CRUD界面**
2. **用户权限管理界面**
3. **系统监控面板**
4. **插件市场界面**

### 阶段三：用户体验完善
1. **企业级主题定制**
2. **统一通知系统**
3. **数据密度切换**

## 🛠️ 技术实现架构

### 核心技术栈
- **框架**: Next.js 15.3.4 + React 19.0.0
- **语言**: TypeScript 5.8.3（严格模式）
- **样式**: Tailwind CSS 4.x + shadcn/ui
- **API**: tRPC + Zod Schema
- **数据**: Prisma + PostgreSQL
- **认证**: NextAuth.js 5.0 + CASL

### 优选第三方库
- **状态管理**: Zustand (轻量级)
- **搜索组件**: cmdk (shadcn/ui推荐)
- **通知系统**: react-hot-toast (成熟方案)
- **路由**: Next.js 15并行路由特性

## 📊 权限系统架构

### 增强型RBAC + 混合行级权限

```typescript
// 权限检查示例 - 扩展现有CASL集成
const permission = await permissionChecker.check({
  user: currentUser,
  action: 'read',
  resource: 'user_profile',
  resourceId: targetUserId
});

if (permission.granted) {
  const data = await userService.findById(targetUserId);
  return permission.filterFields(data); // 字段级过滤
}
```

### 权限模型设计
- **角色继承**: 支持层级化角色体系
- **字段级权限**: 细粒度的数据访问控制
- **行级权限**: 基于条件的数据过滤
- **运行时权限**: 动态权限计算和缓存

## 🎯 成功指标

### 用户体验指标
- **工作效率**: 多页面同时操作，快速切换
- **功能发现**: 全局搜索快速定位任何功能
- **视觉一致**: 企业级品牌定制

### 技术质量指标
- **性能**: 标签页切换<200ms，搜索响应<500ms
- **稳定性**: 无构建错误，完整测试覆盖
- **兼容性**: 主流浏览器支持，响应式设计

### 架构清晰度
- **职责分离**: starter和console边界明确
- **接口标准**: SearchProvider接口可被其他模块复用
- **扩展性**: 新模块轻松集成多标签页和搜索