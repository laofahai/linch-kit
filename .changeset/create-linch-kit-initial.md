---
"create-linch-kit": major
---

feat: 添加 create-linch-kit 脚手架工具

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