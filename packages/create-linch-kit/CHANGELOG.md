# Changelog

## 2.0.1

### Patch Changes

- [`041cf55`](https://github.com/laofahai/linch-kit/commit/041cf55958880e37630ab651035f422757145674) Thanks [@laofahai](https://github.com/laofahai)! - 完善 create-linch-kit 脚手架工具，修复类型错误和 lint 问题，支持从 GitHub 下载模板并自动配置项目

## [1.0.2] - 2025-07-02

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
