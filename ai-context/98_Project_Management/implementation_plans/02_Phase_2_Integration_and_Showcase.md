# 第二阶段实施计划：集成与示范 (v1.3)

**关联主计划**: `../05_Master_Plan_for_Framework_Stabilization.md`
**状态**: 待命

---

## 任务清单：`apps/starter`

- **[ ] Audit**: 评估 `apps/starter/` 目录，识别所有需要被重构的本地临时实现。

- **[ ] Refactor `app/layout.tsx`**:
    - `[ ]` 从 `@linch-kit/platform` 导入 `LinchKitProvider`。
    - `[ ]` 使用 `LinchKitProvider` 包裹 `<body>` 内的 `children`。

- **[ ] Refactor Auth Flow**:
    - `[ ]` 删除 `app/auth/` 目录下的所有旧代码。
    - `[ ]` 创建 `app/auth/login/page.tsx`，使用 `@linch-kit/auth` 的 `LoginForm` 组件。
    - `[ ]` 确保 `middleware.ts` 的内容是 `export { default } from '@linch-kit/auth/middleware'`。

- **[ ] Refactor Dashboard Page (`app/dashboard/page.tsx`)**:
    - `[ ]` 使用 `@linch-kit/auth` 的 `useSession()` 获取用户信息。
    - `[ ]` 使用 `@linch-kit/ui` 的 `Card` 组件布局页面。
    - `[ ]` 在 `public/locales/en/common.json` 和 `public/locales/zh/common.json` 中添加翻译。
    - `[ ]` 使用 `@linch-kit/platform` 的 `useTranslation()` Hook 来渲染多语言文本。

- **[ ] Refactor Extension System (`app/[extension]/page.tsx`)**:
    - `[ ]` 从路由参数获取 `extensionId`。
    - `[ ]` 调用 `@linch-kit/core` 的 `ExtensionLoader.get(extensionId)` 获取扩展组件。
    - `[ ]` 在页面上渲染该组件。