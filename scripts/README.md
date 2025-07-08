# LinchKit 项目脚本

## 📋 脚本目录结构

```
scripts/
├── README.md              # 本文档
├── ai/                    # AI相关工具
│   ├── session-tools.js   # 主要AI助手工具
│   └── context-cli.js     # 上下文查询工具
└── dev/                   # 开发工具
    └── deps-graph.js      # 依赖关系分析
```

## 🤖 AI 工具

### session-tools.js

**主要AI助手工具集合**
**运行**: `bun run ai:session <command>`
**功能**:

- Session初始化和环境检查
- 项目上下文查询（实体、符号、模式）
- Neo4j图谱数据同步
- 代码质量验证（基础/完整）
- 分支管理

### context-cli.js

**AI上下文查询工具**
**运行**: `bun scripts/ai/context-cli.js`
**功能**:

- 查询实体定义和相关文件
- 查询符号定义（函数、类、接口）
- 查询实现模式

## 🔧 开发工具

### deps-graph.js

**包依赖关系分析**
**运行**: `bun run deps:graph`
**功能**:

- 分析monorepo包依赖关系
- 生成依赖图谱
- 检测循环依赖

## 📚 使用示例

```bash
# AI Session 工具
bun run ai:session init "新功能开发"
bun run ai:session query "User"
bun run ai:session check
bun run ai:session validate

# 开发工具
bun run deps:graph
```

#### dev-tools.js

**用途**: 开发工具集合
**运行**: `node scripts/dev-tools.js`
**功能**:

- 开发环境设置
- 工具链验证

#### release.js

**用途**: 版本发布工具
**运行**: `node scripts/release.js`
**功能**:

- 自动化版本发布流程
- 生成变更日志

## 🔄 数据维护工作流

### 定期更新Neo4j数据

```bash
# 重新提取项目图谱数据
bun scripts/graph-data-extractor.ts

# 验证图谱数据质量
bun scripts/ai-context/ai-context-cli-fast.js --find-entity "User" --include-related
```

### 包依赖分析

```bash
# 生成依赖关系图
node scripts/deps-graph.js

# 检查依赖一致性
bun validate
```

## 🚮 已清理的脚本

以下脚本已删除（原因）：

- `architecture-analysis.js` - 生成静态报告，输出已过时
- `complexity-analysis.js` - 功能与其他工具重复
- `performance-benchmark.js` - 基准测试结果过时
- `generate-architecture-diagram.js` - 图表生成需求变更
- `release.cjs` / `release.js` - 已使用changesets + CI/CD替代
- `dev-tools.js` - 开发工具功能重复，使用turbo dev替代
- `ai-context-cli-v2.js` / `ai-context-cli-fast.js` - 合并为统一版本

## ⚠️ 使用说明

1. **环境依赖**: 确保安装了必要的依赖 (Neo4j, bun, node)
2. **配置检查**: 运行前检查 `.env.local` 中的数据库配置
3. **定期维护**: 建议每次重大代码变更后运行数据提取脚本
