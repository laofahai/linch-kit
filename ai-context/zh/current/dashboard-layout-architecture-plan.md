# Dashboard 布局组件架构方案

**决策时间**: 2025-07-03  
**状态**: 已确定方案，待实施

## 🎯 核心决策

Dashboard 布局组件采用**三层级渐进式灵活性 + 插件化扩展**架构：

1. **@linch-kit/ui**: 原子级组件，完全自由组装
2. **modules/console**: 多层级API，从简单配置到完全自定义  
3. **插件系统**: 任何层级都可扩展

## 🏗️ 详细架构设计

### 1. 组合式基础组件层 (@linch-kit/ui)

```typescript
// 提供可自由组合的布局原子组件
export {
  Sidebar,
  Header, 
  Main,
  SidebarProvider,
  SidebarTrigger
} from './components'

// 用户完全自由组装示例
function MyCustomLayout() {
  return (
    <SidebarProvider>
      <div className="flex">
        <Sidebar>我的自定义侧边栏</Sidebar>
        <Main>
          <Header>我的自定义头部</Header>
          <div>页面内容</div>
        </Main>
      </div>
    </SidebarProvider>
  )
}
```

### 2. 预制布局模板层 (modules/console)

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

### 3. 业务集成组件层 (modules/console)

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
  const LayoutComponent = layouts[layout] // vertical/horizontal/minimal
  
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

## 🔧 用户灵活性等级

### Level 1: 配置驱动 (最简单)
```typescript
<DashboardLayout
  layout="vertical"
  theme="dark"
  navItems={myNavItems}
  customizations={{
    sidebarWidth: "280px",
    headerHeight: "64px"
  }}
>
  <MyApp />
</DashboardLayout>
```

### Level 2: 组件替换 (中等灵活性)
```typescript
<DashboardLayout
  navItems={myNavItems}
  customComponents={{
    Header: MyCustomHeader,
    Sidebar: MyCustomSidebar
  }}
  plugins={[myPlugin]}
>
  <MyApp />
</DashboardLayout>
```

### Level 3: 模板定制 (高度灵活)
```typescript
<VerticalLayout
  sidebar={<MySidebar><MyLogo /><MyNavigation /></MySidebar>}
  header={<MyHeader><MyBreadcrumb /><MyUserMenu /></MyHeader>}
>
  <MyApp />
</VerticalLayout>
```

### Level 4: 完全自由 (最大灵活性)
```typescript
<SidebarProvider defaultOpen={true}>
  <div className="my-custom-layout">
    <Sidebar variant="floating" className="my-sidebar-styles">
      {/* 完全自定义内容 */}
    </Sidebar>
    <Main className="my-main-styles">
      {/* 完全自定义布局 */}
    </Main>
  </div>
</SidebarProvider>
```

## 🔌 插件化扩展机制

```typescript
const myLayoutPlugin = {
  name: "custom-theme",
  
  // 修改布局配置
  configureLayout: (config) => ({
    ...config,
    theme: "custom-dark"
  }),
  
  // 注入组件
  components: {
    "header-actions": <MyCustomButton />,
    "sidebar-footer": <MyCustomFooter />
  },
  
  // 修改导航
  navigation: (items) => [
    ...items,
    { id: "plugin-page", title: "插件页面", href: "/plugin" }
  ]
}
```

## 📱 运行时布局切换

```typescript
function LayoutSettings() {
  const { layout, setLayout, customizations, setCustomizations } = useLayout()
  
  return (
    <div>
      <select value={layout} onChange={(e) => setLayout(e.target.value)}>
        <option value="vertical">左侧导航</option>
        <option value="horizontal">顶部导航</option>
        <option value="minimal">极简模式</option>
      </select>
      
      <input 
        type="range" 
        value={customizations.sidebarWidth} 
        onChange={(e) => setCustomizations({
          ...customizations,
          sidebarWidth: `${e.target.value}px`
        })}
      />
    </div>
  )
}
```

## 🚀 实施步骤

### 阶段1: 基础重构
1. 确保 `@linch-kit/ui` 的 sidebar 组件是纯展示组件
2. 在 `modules/console` 中创建布局模板组件
3. 重构 `apps/starter` 使用新的布局组件

### 阶段2: 插件系统
1. 实现 `PluginSlot` 和 `useLayout` 钩子
2. 创建插件注册机制
3. 添加运行时布局切换功能

### 阶段3: 完善API
1. 完善类型定义和文档
2. 添加更多预制布局模板
3. 优化性能和用户体验

## 🎯 目标效果

**用户获得的能力：**
- 🎨 **完全自由**: 可以像使用任何UI库一样自由组装
- ⚡ **快速上手**: 提供开箱即用的高级组件
- 🔧 **渐进增强**: 可以从简单配置逐步深入定制
- 🔌 **插件扩展**: 支持插件在任何层级扩展功能
- 📱 **运行时调整**: 支持用户在应用中动态调整布局

## 📝 相关文件位置

- **当前实现**: `apps/starter/components/app-sidebar.tsx`
- **UI基础组件**: `packages/ui/src/components/ui/sidebar.tsx`
- **目标位置**: `modules/console/src/layouts/`
- **类型定义**: `modules/console/src/types/layout.ts`
- **配置示例**: `apps/starter/config/navigation.ts`