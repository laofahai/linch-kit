# Changelog

## 2.0.0

### Major Changes

- c8239de: feat: 添加 create-linch-kit 脚手架工具

  🎉 新增 create-linch-kit NPM 包，让用户能够一键创建 LinchKit 项目

  **功能特性:**
  - 🚀 一键创建: `npx create-linch-kit my-app`
  - ⚡ 快速模板下载: 使用 degit 从 GitHub 下载模板
  - 🔧 智能配置替换: 自动替换项目名称和依赖版本
  - 📦 包管理器检测: 智能检测 pnpm > yarn > npm
  - 🎨 中文交互界面: 友好的中文提示和错误信息
  - 🛠️ 灵活选项: 支持 --no-install 和 --no-git 选项

  **技术实现:**
  - TypeScript + Commander.js CLI 框架
  - degit 模板下载，无需 Git 克隆
  - chalk + ora + prompts 用户体验组件
  - 自动将 workspace 依赖替换为 NPM ^1.0.2 版本

  **用户体验:**
  - 交互式项目名称输入
  - 目录存在时的覆盖确认
  - 完整的成功提示和后续步骤指导
  - 详细的使用文档和变更日志

## [1.0.0] - 2025-07-02

### Added

- 🎉 首次发布 create-linch-kit 脚手架工具
- ⚡ 使用 degit 快速下载模板，无需 Git 克隆
- 🔧 自动替换项目配置和依赖版本
- 📦 智能检测包管理器 (pnpm > yarn > npm)
- 🎨 交互式项目创建流程
- 🚀 支持跳过依赖安装和 Git 初始化
- 📝 完整的项目创建后提示信息

### Features

- 基于 LinchKit v1.0.2 生态
- 支持 AI-First 全栈开发框架
- 预配置 Next.js 15 + React 19
- 集成 TypeScript 严格模式
- 包含 shadcn/ui + Tailwind CSS
- 内置认证和权限系统
- 提供企业级管理后台

### Technical

- 使用 TypeScript 开发
- 基于 Commander.js CLI 框架
- 集成 chalk、ora、prompts 交互组件
- 支持 CommonJS 和 ESM 环境
