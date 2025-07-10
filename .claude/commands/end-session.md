# End Session 快捷指令

结束当前开发session并准备下一个session。

## 执行步骤

### 1. 更新相关文档
请更新以下文档（如有需要）：
- [ ] 功能文档 - 如有新功能添加
- [ ] API文档 - 如有接口变更
- [ ] 使用指南 - 如有用法更新
- [ ] ai-context/04_Project_Management/02_Development_Status.md - 更新开发进度

### 2. 代码质量检查
运行快速验证：
```bash
bun run validate:light
```

### 3. 提交当前进度
```bash
git add .
git commit -m "feat: [描述本次完成的功能或进度]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 4. 推送到当前分支
```bash
git push origin [当前分支名]
```

### 5. 准备下一个Session Prompt

根据当前完成的工作，使用以下模板准备下一个session：

```
/start 继续LinchKit项目开发

**🎯 当前状态**：
- ✅ 已完成：[刚完成的阶段性任务]
- ✅ 代码已提交并推送到分支：[分支名]
- ✅ 当前进度已保存

**🔧 下一步任务**：
1. **[下一个主要任务]**
2. **[次要任务或优化]**
3. **[测试和验证]**
4. **[文档更新]**

**📚 重要约束**：
- 严格遵循CLAUDE.md中的开发约束
- 使用bun:test测试框架（禁止vitest）
- 完成后运行完整验证：bun run validate
- 保持代码质量和测试覆盖率

**🎨 技术重点**：
- [本次session的技术重点]
- [需要特别关注的问题]
- [性能或用户体验优化]

继续推进LinchKit项目的开发工作！
```

## 使用说明

1. 根据当前完成的实际工作填写prompt模板中的占位符
2. 保存生成的prompt用于下一个session
3. 确保所有代码已提交推送完成
4. 验证项目状态正常后结束当前session