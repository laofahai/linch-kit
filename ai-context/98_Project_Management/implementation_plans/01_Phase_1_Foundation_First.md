# 第一阶段实施计划：奠定坚实基础 (v1.3)

**关联主计划**: `../05_Master_Plan_for_Framework_Stabilization.md`
**状态**: 待命

---

## 任务清单：`@linch-kit/shared-types`

- **[ ] Audit**: 审查 `src/` 目录，确保所有导出的类型都是跨包共享所必需的。
- **[ ] Implement `src/user.ts`**: 定义并导出 `interface User`, `interface Session`。
- **[ ] Implement `src/framework.ts`**: 定义并导出 `interface LinchKitConfig`, `interface ExtensionManifest`。
- **[ ] Implement `src/i18n.ts`**: 定义并导出 `type TranslationResources`。
- **[ ] Finalize**: 确保 `tsconfig.base.json` 中 `noImplicitAny` 已开启，并移除包内所有 `any` 类型。

---

## 任务清单：`@linch-kit/core`

- **[ ] Audit**: 评估 `src/` 目录，识别可重用逻辑和待办事项。
- **[ ] Implement `src/services/ConfigService.ts`**: 创建 `ConfigService` 类，其 `get(key)` 方法能从 `linchkit.config.json` 和环境变量中合并配置。
- **[ ] Implement `src/extension/ExtensionLoader.ts`**: 创建 `ExtensionLoader` 类，实现 `load(manifest)`, `unload(id)`, `get(id)` 方法。
- **[ ] Implement `src/services/LoggerService.ts`**: 使用 `pino` 封装，提供 `info`, `warn`, `error` 方法。
- **[ ] Implement `src/services/EventBusService.ts`**: 使用 `mitt` 封装，提供 `on`, `off`, `emit` 方法。
- **[ ] Implement `src/i18n/I18nService.ts`**: 创建 `I18nService`，实现 `loadTranslations(lng, ns)` 方法，用于加载翻译文件。

---

## 任务清单：`@linch-kit/ui`

- **[ ] Audit**: 评估 `src/` 目录，盘点现有组件。
- **[ ] Setup**: `bun add radix-ui-themes`。
- **[ ] Implement `src/themes/`**: 定义基于 CSS 变量的亮/暗主题。
- **[ ] Implement `src/components/`**: 基于 Radix 封装 `Button`, `Input`, `Modal` 等核心组件。
- **[ ] Implement Storybook**: 为每个组件编写 `.stories.tsx` 文件。

---

## 任务清单：`@linch-kit/auth`

- **[ ] Audit**: 评估 `src/` 目录，特别是 `next-auth` 的现有配置。
- **[ ] Setup**: `bun add next-auth`。
- **[ ] Implement `src/config.ts`**: 创建并导出 `authOptions: NextAuthOptions`，设置 `session.strategy = 'jwt'`。
- **[ ] Implement `src/providers/credentials.ts`**: 实现 `CredentialsProvider` 的 `authorize` 函数。
- **[ ] Implement Callbacks**: 在 `authOptions` 中配置 `jwt` 和 `session` 回调，将用户 ID 写入 token。
- **[ ] Implement `src/middleware.ts`**: 从 `next-auth/middleware` 导出 `default`，并配置 `matcher`。

---

## 任务清单：`@linch-kit/platform`

- **[ ] Audit**: 评估 `src/` 目录，识别现有 hooks 和 providers。
- **[ ] Setup**: `bun add zustand i18next react-i18next`。
- **[ ] Implement `src/i18n/client.ts`**: 使用 `i18next.use(initReactI18next).init()` 配置 i18n 实例。
- **[ ] Implement `src/providers/LinchKitProvider.tsx`**: 在内部组合 `SessionProvider` 和 `I18nextProvider`。
- **[ ] Implement `src/hooks/useLinchKit.ts`**: 创建 Hook 用于访问 `core` 提供的服务。
- **[ ] Implement `src/hooks/useTranslation.ts`**: 重新导出 `react-i18next` 的 `useTranslation` Hook。
- **[ ] Implement `src/store/app.ts`**: 使用 `zustand` 创建 `useAppStore` Hook。