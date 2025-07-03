# LinchKit 架构与设计

## 🏗️ 系统架构概览

### 核心架构原则
- **不增加新包**: 基于现有6+1架构扩展
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

## 🎯 核心系统设计

### Console模块架构定位
- **定位**: 功能库(Library)，通过npm包被starter集成使用
- **集成关系**: Console依赖所有LinchKit包，提供企业级管理控制台功能
- **设计原则**: 不是独立应用，不包含数据库，不处理认证
- **职责边界**: 提供管理功能UI/逻辑、搜索API、页面组件、业务逻辑

### 三阶段系统设计

#### 阶段一：核心体验升级架构

**1. 多标签页工作区布局**
- **技术方案**:
  - 状态管理: Zustand管理标签页状态
  - 路由集成: Next.js并行路由(Parallel Routes)实现无刷新切换
  - 功能特性: 标签页拖拽排序、固定、关闭、左右滚动
  - 持久化: localStorage保存标签页状态，刷新后恢复工作区

```typescript
interface Tab {
  id: string;
  path: string;
  title: string;
  closable: boolean;
  pinned?: boolean;
}
```

**2. 插件化全局搜索(Command Palette)**
- **技术方案**:
  - 基础组件: 集成cmdk库(shadcn/ui官方推荐)
  - 插件化API: 在@linch-kit/core中定义SearchProvider接口
  - 注册机制: 全局searchRegistry对象，支持动态注册搜索内容

```typescript
interface SearchResult {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onSelect: () => void;
}

interface SearchProvider {
  name: string;
  getResults: (query: string) => Promise<SearchResult[]>;
}
```

**3. Console搜索API集成**
- **实现方式**:
  - tRPC路由: 创建专门的搜索procedure
  - 数据源: 查询Console管理的所有业务实体
  - 返回格式: 标准SearchResult格式

**4. 路由集成规范**
- **集成方式**:
  - 职责分离: starter负责标签页外壳，console负责标签页内容
  - 路由嵌套: ConsoleRouter在标签页内部处理子页面导航
  - 状态同步: 标签页标题与console页面标题同步

#### 阶段二：Console模块功能完善
- 遵循规划: 严格按照modules/console/DESIGN.md的Phase 1-4执行
- 当前状态: Phase 1已完成，进入Phase 2页面组件开发
- 重点功能: 租户管理CRUD界面、用户权限管理界面、系统监控面板、插件市场界面

#### 阶段三：用户体验完善
- 企业级主题定制: 租户级别的品牌定制
- 统一通知系统: 集成react-hot-toast
- 数据密度切换: 表格组件支持"舒适"/"紧凑"视图切换

### 职责边界设计

**Starter应用职责**:
- 应用外壳: 多标签页布局容器和管理逻辑
- 全局搜索: 搜索框UI和结果汇总展示
- 主导航: 侧边栏菜单和路由入口
- 认证流程: 用户登录和会话管理

**Console模块职责**:
- 管理功能: 租户、用户、权限、插件管理的UI和逻辑
- 搜索API: 提供tRPC搜索接口给全局搜索调用
- 页面组件: 可在标签页内加载的管理界面
- 业务逻辑: 企业级管理控制台的核心功能

## 🎨 Dashboard 布局架构

### 三层级渐进式灵活性架构

1. **@linch-kit/ui**: 原子级组件，完全自由组装
2. **modules/console**: 多层级API，从简单配置到完全自定义
3. **插件系统**: 任何层级都可扩展

### 组合式基础组件层
```typescript
// 提供可自由组合的布局原子组件
export {
  Sidebar,
  Header, 
  Main,
  SidebarProvider,
  SidebarTrigger
} from './components'
```

### 预制布局模板层
```typescript
// 提供常用布局模板，但完全可定制
export function VerticalLayout({ 
  sidebar,
  header, 
  children,
  className,
  ...layoutProps 
}) {
  return (
    <SidebarProvider {...layoutProps}>
      <div className={cn("flex min-h-screen", className)}>
        {sidebar || <DefaultSidebar />}
        <Main>
          {header || <DefaultHeader />}
          {children}
        </Main>
      </div>
    </SidebarProvider>
  )
}
```

### 业务集成组件层
```typescript
export function DashboardLayout({
  navItems,
  user,
  theme = "system",
  layout = "vertical",
  customizations = {},
  plugins = [],
  children
}) {
  const LayoutComponent = layouts[layout]
  
  return (
    <LayoutComponent
      sidebar={<Sidebar><Navigation items={navItems} plugins={plugins} /></Sidebar>}
      header={<Header><UserMenu user={user} /><PluginSlot name="header-actions" /></Header>}
      {...customizations}
    >
      {children}
    </LayoutComponent>
  )
}
```

## 🔧 权限系统架构

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

### Schema设计扩展
```prisma
// 扩展现有用户/角色模型
model Permission {
  id            String   @id @default(cuid())
  action        String   // create, read, update, delete
  subject       String   // User, Tenant, Billing, etc.
  
  // 字段级权限控制
  allowedFields String[] // 允许访问的字段
  deniedFields  String[] // 禁止访问的字段
  
  // 行级权限控制
  rowConditions Json?    // 行级过滤条件
  
  roles         RolePermission[]
  @@unique([action, subject])
}

model Role {
  id           String   @id @default(cuid())
  name         String   @unique
  description  String?
  permissions  RolePermission[]
  users        UserRole[]
  tenantId     String?
  
  // 角色继承
  parentRoleId String?
  parentRole   Role?   @relation("RoleHierarchy", fields: [parentRoleId], references: [id])
  childRoles   Role[]  @relation("RoleHierarchy")
  
  @@index([tenantId])
}
```

## 🛠️ 技术实现架构

### 第三方库选择
- **状态管理**: Zustand (轻量级，符合约束)
- **搜索组件**: cmdk (shadcn/ui推荐)
- **通知系统**: react-hot-toast (成熟方案)
- **路由**: Next.js 15并行路由特性

### 扩展包能力分析

**@linch-kit/auth 扩展潜力**:
- 现有能力: 已集成 `@casl/ability` (RBAC/ABAC支持)、NextAuth.js 5.0 认证基础
- 扩展方向: 增强权限检查器、行级/字段级权限控制、角色继承系统

**modules/console 扩展潜力**:
- 现有能力: 描述包含 "多租户管理、权限控制"、完整的组件/服务/API导出结构
- 扩展方向: 权限管理UI组件、多租户管理界面、系统监控和审计

**@linch-kit/core 扩展潜力**:
- 现有能力: 基础设施和核心功能、配置管理和插件系统
- 扩展方向: 事件系统、实时通信基础、审计日志框架

## 🎯 成功指标

### 用户体验指标
- **工作效率**: 用户可同时打开多个管理页面，快速切换
- **功能发现**: 通过全局搜索快速找到任何功能和数据
- **视觉一致**: 企业级定制主题和品牌一致性

### 技术质量指标
- **性能**: 标签页切换<200ms，搜索响应<500ms
- **稳定性**: 无构建错误，测试覆盖率>80%
- **兼容性**: 支持主流浏览器，响应式设计

### 架构清晰度
- **职责分离**: starter和console边界清晰
- **接口标准**: SearchProvider接口可被其他模块复用
- **扩展性**: 新模块可轻松集成到多标签页和全局搜索

## 💡 关键决策记录

1. **多Tab vs Breadcrumb**: 经双AI协商确认，多Tab更适合企业级应用
2. **Console角色**: 确认为功能库而非独立应用，集成到starter使用
3. **搜索架构**: 采用插件化设计，支持多模块联邦搜索
4. **技术选型**: 优先使用成熟第三方库，避免重复造轮子
5. **开发顺序**: 用户体验升级优先于内部功能完善
6. **布局系统**: 采用三层级渐进式灵活性 + 插件化扩展架构