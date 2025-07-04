# LinchKit AI 驱动工作流 - 快速启动

**版本**: Phase 1 MVP (生产就绪)  
**状态**: ✅ 完全可用  

## 🚀 一键开始

```bash
# 切换到工作流目录
cd .devcontainer/workflow-mvp

# 用自然语言描述你的需求
./scripts/ai-workflow-generator.sh "你的开发需求"
```

**就这么简单！** AI 会自动完成从需求理解到代码实现的全过程。

## 📋 典型使用场景

### 🔐 认证功能开发
```bash
./scripts/ai-workflow-generator.sh "为用户模块添加 JWT 认证支持"
```

### 📊 CRUD 功能开发  
```bash
./scripts/ai-workflow-generator.sh "创建用户管理的数据表格，支持增删改查"
```

### 🔧 API 开发重构
```bash
./scripts/ai-workflow-generator.sh "重构用户 API，添加批量操作和搜索功能"
```

### 🧪 测试开发
```bash
./scripts/ai-workflow-generator.sh "为支付模块编写完整的单元测试"
```

## 🎯 核心特性

- **🧠 智能理解**: 自动识别任务类型和涉及的包
- **⚙️ 自动执行**: 从分支创建到代码实现的完整自动化
- **🛡️ 质量保证**: 强制执行所有 LinchKit 开发规范
- **🔄 连续自动化**: 支持无限次连续工作流执行
- **🤖 AI 协商**: 复杂任务自动启用 Gemini 协商机制

## 📊 监控和控制

### 查看执行状态
```bash
# 查看所有工作流状态
ls -la state/

# 查看特定工作流详情
cat state/工作流ID.state.json
```

### 执行控制
```bash
# 暂停: Ctrl+C
# 恢复: 重新运行工作流配置
./scripts/run-workflow.sh tasks/工作流配置.json
```

### 健康检查
```bash
# 系统健康检查
./scripts/health_check.sh

# 故障自动修复
./scripts/auto_repair.sh
```

## 🎛️ 自动化级别

AI 会根据任务复杂度自动选择执行模式：

- **Safe**: 交互模式，关键决策需要确认
- **Moderate**: 适度自动化，安全默认响应  
- **Dangerous**: 完全自动化，自动接受所有提示

## 🚨 故障排除

### 常见问题

#### 环境检查失败
- 确保安装了 `bun`、`jq`、`git`
- 检查是否在正确的分支工作

#### 工作流执行失败
```bash
# 查看详细错误信息
./scripts/deep_diagnosis.sh 工作流ID

# 查看失败任务的具体错误
jq '.tasks | to_entries[] | select(.value.status == "failed")' state/工作流ID.state.json
```

#### 紧急重置
```bash
# 清理所有状态，重新开始
rm -rf state/*.state.json tasks/ai-generated-*
./scripts/ai-workflow-generator.sh "你的需求"
```

## 📚 完整文档

详细使用指南和架构文档位于主项目的 `ai-context/` 目录：

- **[AI工作流用户指南](../../ai-context/ai_workflow_user_guide.md)** - 详细使用说明
- **[AI工作流系统架构](../../ai-context/ai_workflow_system.md)** - 技术架构文档  
- **[AI工作流监督指南](../../ai-context/ai_workflow_monitoring.md)** - 监督执行和故障排查

## 🎉 成功案例

已成功验证的场景：
- ✅ JWT 认证系统自动化开发
- ✅ 用户管理 CRUD 组件自动化创建
- ✅ API 重构和批量操作自动化实现
- ✅ 连续多个工作流无缝执行

---

**🚀 LinchKit AI 工作流让每个人都能成为高效的全栈开发者！**

只需用自然语言描述你的想法，AI 会自动完成所有技术实现。开始你的 AI 驱动开发之旅吧！