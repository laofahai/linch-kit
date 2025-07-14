# LinchKit AI Platform 架构设计文档

**版本**: v1.0.0  
**作者**: Claude Code  
**创建日期**: 2025-07-14  
**目的**: 全面分析现有ai-platform架构，为AI Guardian集成提供指导

## 📋 文档目的

本文档分析LinchKit AI Platform的现有架构，评估其能力边界，为后续的AI Guardian集成和/start命令集成提供架构指导。

## 🏗️ 整体架构概览

### 核心定位
AI Platform是LinchKit的**L4 AI集成层**，提供Graph RAG知识图谱和AI工具支持。

### 架构层次
```
tools/ai-platform/
├── src/                    # 核心源码
│   ├── types/             # 类型定义层
│   ├── extractors/        # 数据提取层
│   ├── graph/             # Graph RAG数据层
│   ├── query/             # 智能查询层
│   ├── context/           # 上下文分析层
│   ├── guardian/          # AI Guardian智能体层
│   ├── generation/        # 代码生成层(将废弃)
│   ├── cli/               # CLI接口层
│   └── config/            # 配置管理层
├── scripts/               # 可执行脚本层
└── dist/                  # 构建输出层
```

## 🧩 核心模块详细分析

### 1. Graph RAG系统 (src/graph/, src/query/)

#### 能力评估
- ✅ **Neo4j服务**: 完整的图数据库连接和查询
- ✅ **智能查询引擎**: 基于Cypher的复杂查询
- ✅ **数据提取器**: 支持多种文件类型的知识提取
- ✅ **上下文查询**: 项目级智能上下文分析

#### 关键实现
```typescript
// src/graph/neo4j-service.ts
export class Neo4jService implements IGraphService
  - connect(): 连接Neo4j AuraDB
  - query(): 执行Cypher查询
  - disconnect(): 清理连接

// src/query/intelligent-query-engine.ts  
export class IntelligentQueryEngine
  - findEntity(): 查找实体定义
  - findSymbol(): 查找符号定义
  - findPattern(): 查找实现模式
```

#### 使用方式
```bash
# 通过scripts调用
bun run ai:session query "关键词" --debug
bun tools/ai-platform/scripts/session-tools.js query "关键词"
```

### 2. Guardian智能体集群 (src/guardian/)

#### 现有Guardian Agent

##### Phase 1 - 基础防护 (已实现)
- **ArchWarden**: 架构合规性检查
  - 循环依赖检测
  - 层级违规检查  
  - 架构评分
- **MetaLearner**: AI行为监控
  - 成功模式学习
  - 规则自动优化

##### Phase 2 - 智能验证 (已实现)  
- **ContextVerifier**: AI理解一致性验证
  - 语义漂移检测
  - 上下文校准
- **SecuritySentinel**: 安全代码分析
  - Extension安全检查
  - 权限控制检测

##### Phase 3 - 高级智能体 (规划中)
- **QASynthesizer**: AI驱动测试生成
- **DecisionCouncil**: 多Agent决策辩论

#### Guardian接口设计
```typescript
export interface GuardianAgent {
  name: string
  version: string
  phase: number
  status: 'active' | 'planned' | 'development'
  capabilities: string[]
}
```

#### 使用方式
```bash
# 通过scripts调用
bun tools/ai-platform/scripts/arch-check.js --verbose
bun tools/ai-platform/scripts/context-verifier.js
```

### 3. CLI系统 (src/cli/, scripts/)

#### CLI架构
- **Plugin系统**: `src/cli/plugin.ts` - CLI插件机制
- **命令模块**: `src/cli/commands/` - 具体命令实现
- **脚本集合**: `scripts/` - 11个可执行脚本

#### 可用脚本分析
```bash
# 核心AI功能
session-tools.js        # Graph RAG查询 (★核心)
context-cli.js          # 上下文分析
graph-data-extractor.js # 数据提取

# Guardian功能  
arch-check.js           # 架构检查
context-verifier.js     # 上下文验证
security-sentinel.js    # 安全检查
decision-council.js     # 决策分析

# 高级功能
meta-learner.js         # 元学习
evolution-engine.js     # 进化引擎
qa-synthesizer.js       # QA生成
```

### 4. 包管理和构建 (package.json, tsup.config.ts)

#### 构建系统
- **构建工具**: tsup - 现代TypeScript构建
- **依赖管理**: 依赖@linch-kit/core
- **输出**: dist/ - ES模块格式

#### Scripts配置
```json
{
  "build": "tsup",
  "dev": "tsup --watch", 
  "query": "bun run scripts/session-tools.js",
  "extract": "bun run scripts/graph-data-extractor.js",
  "context": "bun run scripts/context-cli.js"
}
```

## 🔍 能力差距分析

### 与Essential_Rules.md要求对比

#### ✅ 已满足的要求
1. **Graph RAG查询**: `bun run ai:session query` - ✅ 存在且功能完整
2. **架构检查**: `arch-check.js` - ✅ 存在Arch-Warden
3. **上下文验证**: `context-verifier.js` - ✅ 存在ContextVerifier  
4. **依赖检查**: 通过Graph RAG查询实现 - ✅ 部分满足

#### ❌ 缺失的要求
1. **ai:pre-check**: Essential_Rules.md引用但不存在
2. **ai:quality-gate**: Essential_Rules.md引用但不存在
3. **ai:context-verify**: 有ContextVerifier但命令名不匹配
4. **统一AI Provider**: 无AI调用抽象层

### /start命令集成分析

#### 当前/start调用
```bash
# 当前调用的脚本
bun run ai:guardian:validate "任务描述"
# 实际执行: bun tools/ai-guardian/session-validator.ts
```

#### ai-platform能力映射
```bash
# 可以替换为ai-platform调用
bun tools/ai-platform/scripts/context-verifier.js --action=validate
bun tools/ai-platform/scripts/arch-check.js --strict
bun tools/ai-platform/scripts/session-tools.js query "任务描述"
```

## 🎯 集成策略建议

### 策略A: 最小集成 (推荐)
1. **创建缺失脚本映射**:
   - `ai:pre-check` → ai-platform的组合调用
   - `ai:quality-gate` → ai-platform的组合调用
   - `ai:context-verify` → context-verifier.js
   
2. **更新根目录package.json**:
   ```json
   {
     "ai:pre-check": "bun tools/ai-platform/scripts/context-verifier.js --pre-check",
     "ai:quality-gate": "bun tools/ai-platform/scripts/arch-check.js --quality-gate", 
     "ai:context-verify": "bun tools/ai-platform/scripts/context-verifier.js --verify",
     "ai:guardian:validate": "bun tools/ai-platform/scripts/guardian-validate.js"
   }
   ```

3. **删除重复的ai-guardian目录**

### 策略B: AI Provider集成
1. **在ai-platform中添加provider模块**
2. **扩展Guardian支持AI调用**
3. **创建统一的`lk-ai`命令**

### 策略C: 完全重构
1. **将ai-platform提升为核心AI服务**
2. **重新设计CLI架构**
3. **统一所有AI相关功能**

## 🚨 风险评估

### 策略A风险 (低风险)
- ✅ 最小改动，不破坏现有功能
- ✅ 利用现有成熟的Guardian系统
- ⚠️ 可能存在命令名称不一致

### 策略B风险 (中风险)
- ✅ 提供真正的AI能力集成
- ⚠️ 需要大量新代码，可能引入bug
- ⚠️ AI Provider配置管理复杂

### 策略C风险 (高风险)
- ⚠️ 大规模重构，影响稳定性
- ⚠️ 可能破坏现有的/start命令
- ❌ 开发周期长，复杂度高

## 📋 实施建议

### 推荐方案: 策略A + 部分策略B

1. **第一阶段**: 实施策略A，快速解决缺失脚本问题
2. **第二阶段**: 添加简单的AI Provider支持
3. **第三阶段**: 渐进式增强Guardian AI能力

### 具体步骤
1. ✅ **立即**: 写设计文档分析现状 (本文档)
2. 🔄 **接下来**: 创建缺失脚本的ai-platform映射
3. 🔄 **然后**: 更新/start命令使用ai-platform
4. 🔄 **最后**: 删除重复的ai-guardian目录

## 🔧 技术决策

### AI Provider需求评估
基于现有Guardian脚本分析，**真正需要AI调用的场景有限**：
- 大部分检查是基于规则和静态分析
- Graph RAG查询已提供项目上下文
- 现有Guardian已经很智能

### 建议的AI Provider范围
- **最小化**: 仅为特定Guardian添加AI分析能力
- **聚焦**: 专注于代码质量分析和架构决策
- **渐进**: 先证明价值再扩展

## 📊 总结

LinchKit AI Platform是一个**非常成熟和完整的AI基础设施**，具备：
- 完整的Graph RAG知识图谱系统
- 成熟的Guardian智能体集群
- 丰富的CLI工具和脚本
- 良好的包管理和构建系统

**主要缺失**仅为Essential_Rules.md中引用的几个特定脚本名称，可以通过**最小化集成**快速解决。

**建议**: 采用策略A进行快速集成，避免重复建设，充分利用现有成熟架构。