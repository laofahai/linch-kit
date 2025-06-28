# LinchKit 下一步任务

**更新**: 2025-06-28
**任务**: 开发 @linch-kit/ui 组件库

## 🎯 当前任务
开发 @linch-kit/ui - Schema 驱动的 UI 组件库

## ✨ 核心功能
1. **Schema 表单组件** - 基于字段定义自动生成表单
2. **CRUD 表格组件** - 数据展示、分页、排序、筛选
3. **设计系统集成** - 扩展 shadcn/ui 组件
4. **主题系统** - 亮/暗主题切换支持
5. **国际化支持** - 使用 Core 的 i18n 系统

## 🛠️ 技术栈
- React 18.3.1
- TypeScript 5.8.3（严格模式）
- Tailwind CSS v4.0.0-alpha
- shadcn/ui 组件库
- @linch-kit/schema 集成

## ✅ 验证方式
```bash
pnpm build         # DTS < 10秒
pnpm test          # 覆盖率 > 80%
pnpm lint          # 100% 通过
# 在 starter-app 中添加 UI 演示页面
```