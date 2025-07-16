# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.6] - 2025-07-16

### 🔧 Fixed
- **Extension刷新持久化问题完全解决**: 修复Console Extension在页面刷新后显示占位符的关键问题
- **智能重试机制**: 实现300ms延迟 + 强制重新初始化的可靠机制
- **组件注册可靠性**: 强化UI组件注册逻辑，确保页面刷新后正确重新注册
- **TypeScript严格模式**: 修复所有类型检查警告和ESLint违规

### 🧪 Added
- **Extension刷新E2E测试**: 新增专门的E2E测试套件验证刷新持久化功能
- **Console App Wrapper**: 创建统一的Console Extension UI组件包装器
- **调试系统完善**: 统一使用LinchKit Logger，提供详细的调试信息

### 📊 Technical Improvements
- **测试覆盖率**: 所有5个Extension刷新相关E2E测试通过验证
- **代码质量**: ESLint零违规，TypeScript严格模式100%通过
- **用户体验**: 彻底解决页面刷新显示占位符问题

## [2.0.5] - 2025-07-16

### ✨ Added
- **Extension集成系统完整实现**: 完成Starter与Extension的完整集成架构
- **类型系统统一**: 统一使用`@linch-kit/core/client`类型定义
- **UI组件动态加载**: 实现Extension UI组件动态加载机制
- **Extension注册系统**: Console Extension注册和管理系统

### 🔧 Fixed
- **构建系统修复**: 解决客户端/服务端组件导入冲突
- **类型定义修复**: 修复所有Extension相关类型错误
- **组件导入优化**: 统一UI组件导入路径

## [2.0.4] - 2025-07-15

### 🎨 Fixed
- **Tailwind样式问题修复**: 解决UI包和Starter应用中的样式加载问题
- **CSS变量系统**: 建立完整的CSS变量系统，支持主题切换
- **代码质量保持**: 在修复过程中保持ESLint零违规状态
