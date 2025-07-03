# LinchKit 系统设计架构

**版本**: v1.0  
**更新**: 2025-07-03  
**状态**: 基于双AI协商制定  

---

## 🎯 系统架构设计

### 📋 Console模块角色确认

根据设计文档确认：
- **Console定位**: 功能库(Library)，通过npm包被starter集成使用
- **集成关系**: Console依赖所有LinchKit包，提供企业级管理控制台功能
- **设计原则**: 不是独立应用，不包含数据库，不处理认证
- **当前状态**: Phase 1基础架构已完成(100%)

---

## 🚀 三阶段系统设计

### **阶段一：核心体验升级架构**

#### 1. 多标签页工作区布局
- **技术方案**:
  - **状态管理**: 使用Zustand管理标签页状态
  - **路由集成**: 使用Next.js并行路由(Parallel Routes)实现无刷新切换
  - **功能特性**: 标签页拖拽排序、固定、关闭、左右滚动
  - **持久化**: localStorage保存标签页状态，刷新后恢复工作区
- **数据结构**:
  ```typescript
  interface Tab {
    id: string;
    path: string;
    title: string;
    closable: boolean;
    pinned?: boolean;
  }
  ```

#### 2. 插件化全局搜索(Command Palette)
- **技术方案**:
  - **基础组件**: 集成cmdk库(shadcn/ui官方推荐)
  - **插件化API**: 在@linch-kit/core中定义SearchProvider接口
  - **注册机制**: 全局searchRegistry对象，支持动态注册搜索内容
- **接口设计**:
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

#### 3. Console搜索API集成
- **实现方式**:
  - **tRPC路由**: 创建专门的搜索procedure
  - **数据源**: 查询Console管理的所有业务实体
  - **返回格式**: 标准SearchResult格式
- **搜索内容**:
  - 租户管理 → "张三公司" → 跳转到租户详情
  - 用户管理 → "李四" → 跳转到用户编辑
  - 系统设置 → "权限配置" → 直接打开相应页面

#### 4. 路由集成规范
- **集成方式**:
  - **职责分离**: starter负责标签页外壳，console负责标签页内容
  - **路由嵌套**: ConsoleRouter在标签页内部处理子页面导航
  - **状态同步**: 标签页标题与console页面标题同步

### **阶段二：Console模块功能完善**

#### 5. Console内部开发
- **遵循规划**: 严格按照modules/console/DESIGN.md的Phase 1-4执行
- **当前状态**: Phase 1已完成，进入Phase 2页面组件开发
- **重点功能**:
  - 租户管理CRUD界面
  - 用户权限管理界面
  - 系统监控面板
  - 插件市场界面

### **阶段三：用户体验完善**

#### 6. 企业级主题定制
- **功能**: 租户级别的品牌定制
- **实现**: 租户管理员可自定义主题色彩、上传Logo
- **存储**: 配置保存在租户设置中，动态应用

#### 7. 统一通知系统
- **技术**: 集成react-hot-toast
- **API**: 提供useNotifier hook
- **集成**: 在tRPC操作成功/失败后自动调用

#### 8. 数据密度切换
- **功能**: 表格组件支持"舒适"/"紧凑"视图切换
- **适配**: 不同屏幕尺寸和信息密度偏好

---

## 🛠️ 技术实现架构

### 第三方库选择
- **状态管理**: Zustand (轻量级，符合约束)
- **搜索组件**: cmdk (shadcn/ui推荐)
- **通知系统**: react-hot-toast (成熟方案)
- **路由**: Next.js 15并行路由特性

### 开发规范
- **遵循约束**: 严格按照development-constraints.md执行
- **包功能复用**: 必须使用LinchKit内部包功能
- **架构依赖**: core → schema → auth → crud → trpc → ui → console
- **质量标准**: 测试覆盖率>80%，构建时间<10秒

### Context7优先
- **必须查询**: Next.js、React、TypeScript、Tailwind CSS相关技术
- **实时文档**: 获取最新版本的官方最佳实践
- **触发方式**: 在相关技术任务中添加"use context7"关键词

---

## 📋 职责边界设计

### Starter应用职责
- **应用外壳**: 多标签页布局容器和管理逻辑
- **全局搜索**: 搜索框UI和结果汇总展示
- **主导航**: 侧边栏菜单和路由入口
- **认证流程**: 用户登录和会话管理

### Console模块职责
- **管理功能**: 租户、用户、权限、插件管理的UI和逻辑
- **搜索API**: 提供tRPC搜索接口给全局搜索调用
- **页面组件**: 可在标签页内加载的管理界面
- **业务逻辑**: 企业级管理控制台的核心功能

---

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

---

## 💡 关键决策记录

1. **多Tab vs Breadcrumb**: 经双AI协商确认，多Tab更适合企业级应用
2. **Console角色**: 确认为功能库而非独立应用，集成到starter使用
3. **搜索架构**: 采用插件化设计，支持多模块联邦搜索
4. **技术选型**: 优先使用成熟第三方库，避免重复造轮子
5. **开发顺序**: 用户体验升级优先于内部功能完善

这个系统设计将显著提升LinchKit的企业级应用体验，同时强化其作为AI-First开发框架的核心价值。