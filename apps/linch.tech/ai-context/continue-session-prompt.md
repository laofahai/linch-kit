# Linch.tech 网站开发继续会话 Prompt

## 🎯 当前任务概述

你需要继续完成 Linch.tech 网站的开发工作。这是一个基于 Nextra 4.x 的文档网站，已经完成了基础架构和核心组件开发，但还有关键功能需要实现。

## 📋 立即需要解决的问题

### 🔥 最高优先级：i18n 国际化
**问题**: 所有组件都是硬编码英文，缺少中英文支持
**要求**: 
1. 研究并配置 Nextra 4.x 的 i18n 支持
2. 为所有组件添加翻译支持 (中文/英文)
3. 实现语言切换功能
4. 创建翻译文件

### ⚠️ 次要优先级：调试和完善
1. **测试 Nextra 配置** - 确保开发服务器正常启动
2. **完善页面内容** - 根据 ai-context 设计文档补全页面
3. **移动端优化** - 确保响应式设计完美

## 📁 项目结构和现状

### 已完成 ✅
```
apps/linch.tech/
├── app/
│   ├── layout.tsx          # ✅ Nextra 主布局配置
│   ├── page.mdx           # ✅ 首页 (集成所有组件)
│   ├── docs/
│   │   ├── page.mdx       # ✅ 文档首页
│   │   └── getting-started/page.mdx  # ✅ 快速开始
│   └── globals.css        # ✅ 蓝紫色主题样式
├── components/            # ✅ 所有核心组件已完成
│   ├── Hero.tsx          # 英雄区域 + 代码演示
│   ├── Features.tsx      # 4个核心特性
│   ├── ProductMatrix.tsx # 产品生态展示
│   ├── TechStack.tsx     # 技术栈
│   ├── CodeExamples.tsx  # 代码示例
│   ├── SocialProof.tsx   # 统计数据
│   └── QuickStart.tsx    # 快速开始流程
└── next.config.ts         # ✅ Nextra 配置
```

### 缺失 ❌
- **i18n 国际化系统** (最重要)
- 产品详情页面 (/products/*)
- 社区页面 (/community)  
- 企业页面 (/enterprise)
- 完整的文档结构

## 🎨 设计要求

### 主题风格
- **蓝紫色配色方案**: Primary hsl(220, 100%, 50%), Secondary hsl(270, 100%, 60%)
- **参考风格**: https://linch-tech.vercel.app/ (用户喜欢的简洁大方风格)
- **现代化设计**: 渐变背景、圆角卡片、悬停效果
- **响应式**: 移动端优先

### 内容参考
查看 `apps/linch.tech/ai-context/` 目录下的设计文档：
- `homepage-design.md` - 首页设计方案
- `information-architecture.md` - 信息架构
- `project-overview.md` - 项目概览

## 🛠 技术栈

- **Next.js 15** + **Nextra 4.2.17**
- **React 19** + **TypeScript**
- **Tailwind CSS 4.0**
- **nextra-theme-docs**
- **@radix-ui/react-icons**

## 📝 开发指南

### 第一步：i18n 配置
1. 研究 Nextra 4.x 的 i18n 配置方法
2. 配置中英文语言支持
3. 修改 `next.config.ts` 添加 i18n 配置
4. 创建语言文件结构

### 第二步：组件国际化
1. 提取所有硬编码文本到翻译文件
2. 改造组件使用翻译函数
3. 实现语言切换功能
4. 测试中英文切换

### 第三步：内容完善
1. 根据 ai-context 设计文档创建缺失页面
2. 完善文档结构
3. 优化移动端体验

## 🚀 启动命令

```bash
cd apps/linch.tech
export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"
pnpm dev
```

## 📖 重要提醒

1. **优先级**: i18n > 调试 > 内容完善
2. **设计一致性**: 保持蓝紫色主题和现代化风格
3. **参考文档**: 充分利用 ai-context 中的设计方案
4. **用户体验**: 确保中英文用户都有良好体验
5. **响应式**: 移动端体验同样重要

## 🎯 成功标准

- [ ] 网站支持完整的中英文切换
- [ ] 所有页面在移动端正常显示
- [ ] 开发服务器稳定运行
- [ ] 设计风格与参考保持一致
- [ ] 所有核心页面内容完整

---

**开始工作**: 请先检查当前项目状态，然后重点解决 i18n 国际化问题。记住要保持蓝紫色的设计风格！
