# LinchKit Token 优化指南

**创建日期**: 2025-06-28
**用途**: 优化 AI Context 文档的 token 使用效率

## 🎯 Token 优化策略

### 1. 文档精简原则
- **删除冗余内容**: 移除已完成包的详细开发历史
- **保留关键信息**: 架构设计、开发约束、当前进度
- **使用引用**: 详细内容通过文件路径引用而非重复

### 2. Context 文档优化
```bash
# 核心文档（必须保留）
CLAUDE.md                    # AI开发指导，保留核心约束
unified-development-progress.md  # 仅保留最新进度和下一步计划

# 可按需加载的文档
system-design/architecture.md    # 架构参考时加载
system-design/packages/*.md      # 开发特定包时加载
shared/*.md                     # 需要规范时加载
```

### 3. 下一个 Session 的精简 Prompt

```
继续开发 LinchKit 项目。

当前状态：
- Phase 3 tRPC包已完成，starter-app集成验证通过
- 下一步：开发 @linch-kit/ui 组件库
- 技术栈：React 18 + TypeScript + Tailwind CSS + shadcn/ui

开发重点：
1. Schema驱动的表单组件
2. CRUD表格组件
3. 设计系统集成
4. 在starter-app中验证

请先检查最新进度，然后开始UI包开发。
```

### 4. AI Context 文档精简方案

#### 需要精简的文档：
1. **unified-development-progress.md**
   - 删除 Phase 1/2 的详细历史（行60-410）
   - 仅保留总结和当前状态

2. **各包的 progress 文档**
   - 已完成的包可以归档
   - 创建 `archive/` 目录存放历史记录

3. **CLAUDE.md 优化**
   - 删除过时的开发状态
   - 精简冗余的说明文字
   - 保留核心约束和命令

#### 文档结构优化：
```
ai-context/zh/
├── CLAUDE.md                    # 精简版核心指导（<500行）
├── project/
│   ├── current-status.md        # 当前状态（<100行）
│   ├── next-steps.md           # 下一步计划（<50行）
│   └── archive/                # 历史记录归档
├── system-design/              # 按需加载
└── shared/                     # 按需加载
```

### 5. Token 使用监控

建议在每个 session 结束时：
1. 运行 `/cost` 命令查看 token 使用
2. 精简过长的对话历史
3. 归档已完成的开发记录
4. 使用简洁的 prompt 启动新 session

### 6. 最佳实践

#### DO：
- ✅ 使用文件路径引用代替内容复制
- ✅ 定期归档完成的开发记录
- ✅ 保持 prompt 简洁明确
- ✅ 使用 Task 工具批量搜索

#### DON'T：
- ❌ 在 context 中保留完整的历史记录
- ❌ 重复已知的架构信息
- ❌ 在 prompt 中包含冗长的说明
- ❌ 保留过时的开发状态

## 📊 预期效果

通过以上优化，预计可以：
- 减少 60-70% 的 context token 使用
- 提高 AI 响应速度和准确性
- 保持开发连续性和上下文
- 更高效地完成剩余开发任务