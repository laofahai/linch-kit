# End Branch 快捷指令

结束当前分支开发，合并到主分支并清理。

## 执行步骤

### 1. 完成分支开发
确保分支功能已完全开发完成：
- [ ] 所有功能已实现
- [ ] 单元测试已编写并通过
- [ ] 集成测试已通过
- [ ] 文档已更新完成

### 2. 运行完整验证
```bash
bun run validate
```

### 3. 更新项目文档
- [ ] README.md - 更新功能说明
- [ ] CHANGELOG.md - 添加版本更新记录
- [ ] ai-context/98_Project_Management/02_Development_Status.md - 更新开发状态
- [ ] 相关API文档和使用指南

### 4. 提交最终代码
```bash
git add .
git commit -m "feat: [完整功能描述]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 5. 推送分支
```bash
git push origin [当前分支名]
```

### 6. 创建Pull Request
使用以下格式创建PR：
```bash
gh pr create --title "[功能名称]" --body "$(cat <<'EOF'
## Summary
- [主要功能点1]
- [主要功能点2]
- [主要功能点3]

## Test plan
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试验证
- [ ] 文档更新完成

🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)"
```

### 7. 合并后清理
PR合并后执行清理：
```bash
# 切换到主分支
git checkout main
git pull origin main

# 删除本地分支
git branch -d [分支名]

# 删除远程分支
git push origin --delete [分支名]
```

### 8. 准备下一个开发周期
根据roadmap准备下一个功能分支：
```bash
git checkout -b feature/[下一个功能名]
```

## 使用说明

1. 只有在功能完全开发完成时才使用此命令
2. 确保所有测试通过且文档完整
3. PR合并后及时清理分支
4. 为下一个开发周期做好准备