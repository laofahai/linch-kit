# Meta-Learning 分析命令

Meta-Learner 元学习者 - AI行为监控和模式学习分析工具

## 命令功能

Meta-Learner 监控AI开发过程，学习成功和失败模式，提供优化建议。

## 使用方法

```bash
# 启动AI行为监控
bun run meta:monitor

# 分析学习模式  
bun run meta:analyze

# 生成学习报告
bun run meta:report

# 获取优化建议
bun run meta:optimize

# Claude Code 直接调用
claude-meta-learn [action] [options]
```

## 命令选项

- `action`: 操作类型
  - `monitor`: 启动监控
  - `analyze`: 分析模式  
  - `report`: 生成报告
  - `optimize`: 优化建议
- `--verbose`: 详细输出
- `--format=json`: JSON格式输出

## 示例输出

```
🧠 ===== Meta-Learner 模式分析报告 =====

📊 模式概览:
   成功模式: 5
   失败模式: 2  
   反模式: 1

✅ 成功模式 (推荐使用):
   📈 成功模式: 使用Edit执行代码修改，平均质量85.2分
      频率: 12次, 置信度: 90.0%

❌ 失败模式 (需要改进):  
   📉 失败模式: 使用Write执行新文件创建时经常失败，平均质量45.1分
      频率: 8次, 置信度: 80.0%

🧠 ===== 模式分析完成 =====
```

## 集成说明

Meta-Learner 自动监控所有Claude Code工具使用：

- **实时记录**: 每次工具使用都会记录
- **质量评估**: 基于构建结果和违规情况评分
- **模式识别**: 自动识别成功/失败/反模式
- **持续学习**: 定期分析和优化建议

## 数据存储

学习数据存储在 `.claude/meta-learning/` 目录:
- `behavior-records.json`: AI行为记录
- `learning-patterns.json`: 学习模式
- 数据保留30天，自动清理旧记录

## 应用场景

1. **开发质量监控**: 跟踪AI代码生成质量趋势
2. **最佳实践发现**: 识别高质量开发模式
3. **问题预防**: 基于历史失败模式预防问题
4. **团队协作优化**: 分享成功模式给团队