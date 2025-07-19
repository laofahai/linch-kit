# 第二阶段实施计划：集成与示范 (v1.4)

**关联主计划**: `../05_Master_Plan_for_Framework_Stabilization.md`
**AI 执行指南**: `./00_AI_Execution_Guide.md`
**状态**: 待命
**预计周期**: 1-2 周
**依赖阶段**: 第一阶段完成

## 阶段目标

本阶段的目标是将 `apps/starter` 打造成集成所有核心包的最佳实践范例，展示 LinchKit 框架的完整能力。

### 核心成果：
- 完全集成的 LinchKit 框架示范应用
- 所有核心功能的实际使用示例
- 高质量的用户体验和性能表现
- 稳定的集成测试覆盖
- 为第三阶段准备的扩展开发基础

---

## 任务清单：`apps/starter`

### 任务ID: P2-01-应用重构
**任务名称**: starter 应用核心架构重构和集成
**预计工时**: 3-5 天
**依赖任务**: P1-01 到 P1-05 全部完成
**任务类型**: 重构

#### 前置条件
- [ ] 第一阶段的所有核心包任务已完成
- [ ] 已完成 Graph RAG 查询 starter 应用现状
- [ ] 已验证所有核心包的集成测试通过

#### 执行步骤

1. **审计现有应用架构**
   ```bash
   bun run ai:session query "starter application"
   tree apps/starter/app/
   find apps/starter -name "*.tsx" -o -name "*.ts" | head -20
   ```
   预期结果：获得应用现有结构和需要重构的组件列表

2. **重构应用布局和提供器**
   - 修改 `apps/starter/app/layout.tsx`
   - 从 `@linch-kit/platform` 导入 `LinchKitProvider`
   - 配置主题提供器和国际化支持
   - 实现响应式布局和导航结构

3. **重构认证流程**
   ```bash
   # 删除旧的认证代码
   rm -rf apps/starter/app/auth/
   ```
   - 创建 `apps/starter/app/auth/login/page.tsx`
   - 使用 `@linch-kit/auth` 的组件和 hooks
   - 实现登录、登出和注册功能
   - 更新 `middleware.ts` 使用 `@linch-kit/auth/middleware`

4. **重构仪表盘页面**
   - 修改 `apps/starter/app/dashboard/page.tsx`
   - 使用 `@linch-kit/auth` 的 `useSession()`
   - 使用 `@linch-kit/ui` 的 `Card`, `Button` 等组件
   - 实现用户信息显示和操作菜单

5. **实现国际化支持**
   - 创建/完善 `apps/starter/public/locales/` 结构
   - 添加 `en/common.json` 和 `zh/common.json` 翻译文件
   - 使用 `@linch-kit/platform` 的 `useTranslation()`
   - 实现语言切换功能和持久化

6. **实现扩展系统集成**
   - 创建 `apps/starter/app/[extension]/page.tsx`
   - 使用 `@linch-kit/core` 的 `ExtensionLoader`
   - 实现扩展的动态加载和渲染
   - 添加扩展错误处理和限制管理

7. **性能优化和验证**
   ```bash
   # 验证集成和性能
   cd apps/starter
   bun run build
   bun run start
   ```
   成功标志：应用正常启动且所有功能工作正常

#### 验收标准
- [ ] 所有页面和组件都使用 LinchKit 核心包
- [ ] 认证流程完整且安全性通过测试
- [ ] 国际化功能在所有页面正常工作
- [ ] 扩展系统可以动态加载和渲染组件
- [ ] 应用性能指标符合预期（首屏 < 3s）
- [ ] 所有功能都有端到端测试覆盖

#### 失败处理
- **回滚步骤**：
  1. `git stash` 保存当前更改
  2. `git checkout -- apps/starter/`
- **补救措施**：
  - 如果集成问题，优先保证核心功能工作
  - 如果性能问题，优先优化首屏加载时间

#### 输出物
- [ ] 重构后的 `apps/starter/app/layout.tsx`
- [ ] 新的认证流程页面和组件
- [ ] 重构后的仪表盘页面
- [ ] 扩展系统集成代码
- [ ] 国际化资源和配置
- [ ] 端到端测试和性能测试
- [ ] 更新的应用文档和使用指南