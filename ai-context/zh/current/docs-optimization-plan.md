# 文档优化执行计划

**创建日期**: 2025-06-28
**目标**: 减少 80% 的文档体积，提高查询效率

## 🚨 紧急优化清单

### 1. 超大文档处理（1000+ 行）
这些文档包含大量示例代码，建议：
- **移除所有示例代码**，改为指向实际代码位置
- **只保留核心 API 说明**
- **创建独立的示例项目**代替文档中的示例

需要处理的文件：
```
ai-context/zh/system-design/packages/*/implementation-guide.md
ai-context/zh/system-design/packages/*/integration-examples.md
```

### 2. 进度文档归档
```bash
# 创建归档目录
mkdir -p ai-context/zh/archive/progress

# 归档已完成包的进度
mv ai-context/zh/project/module-core-progress.md ai-context/zh/archive/progress/
mv ai-context/zh/project/module-schema-progress.md ai-context/zh/archive/progress/
mv ai-context/zh/project/module-auth-progress.md ai-context/zh/archive/progress/
mv ai-context/zh/project/module-crud-progress.md ai-context/zh/archive/progress/
```

### 3. 精简后的文档结构
```
ai-context/zh/
├── current/                        # 精简版当前文档
│   ├── project-status.md          # 50行 - 项目状态概览
│   ├── development-constraints-lite.md  # 60行 - 核心约束
│   └── next-tasks.md              # 20行 - 下一步任务
├── reference/                      # 按需查阅
│   ├── architecture.md            # 保持原样
│   └── packages/                  # 包设计文档（精简版）
└── archive/                       # 历史归档
    └── progress/                  # 历史进度记录
```

## 🎯 立即执行的优化

### Step 1: 创建超精简的包文档模板
每个包只需要一个精简的 README.md（<100行）：
```markdown
# @linch-kit/{包名}

## 功能
[一句话描述]

## 核心 API
[只列出主要 API]

## 集成方式
[简单说明如何集成]

## 参考
- 源码: packages/{包名}/src
- 测试: packages/{包名}/__tests__
- 示例: apps/starter-app/src/components/{包名}
```

### Step 2: 统一配置文档精简
将 800 行的 `unified-config-management.md` 精简为：
- 配置架构图
- 核心配置项列表
- 集成示例链接

### Step 3: 删除所有 integration-examples.md
这些文档平均 1000+ 行，全部是示例代码。建议：
- 示例代码移到 `apps/starter-app`
- 文档只保留指向示例的链接

## 💡 Token 节省估算

当前文档总行数：~25,000 行
精简后预计：~5,000 行
**节省：80% token**

## 🚀 下一步行动

1. **立即归档**已完成包的进度文档
2. **使用精简版文档**启动新 session
3. **逐步迁移**到新的文档结构
4. **定期清理**过时内容