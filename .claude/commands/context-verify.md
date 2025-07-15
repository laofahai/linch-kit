# Context Verifier - AI理解一致性验证

AI理解一致性验证系统，防止AI理解漂移，确保项目架构理解准确。

## 功能

- **双向验证**: 代码→描述→代码一致性检查
- **语义漂移检测**: 监控AI理解的语义稳定性
- **上下文校准**: 与Graph RAG的理解对比验证
- **异常告警**: 自动检测和纠正理解偏差

## 使用方法

```bash
# 验证整体上下文一致性
bun run context:verify

# 验证特定实体的理解一致性
bun run context:verify --entity="User"

# 捕获理解快照
bun run context:snapshot --entity="Product"

# 检测理解漂移
bun run context:drift --entity="Order"

# 生成详细报告
bun run context:report --verbose
```

## Claude Code 接口

当需要验证AI理解一致性时，调用以下脚本：

```typescript
import { ContextVerifier } from '../tools/ai-platform/src/guardian/context-verifier.js'

const verifier = new ContextVerifier()

// 验证一致性
const result = await verifier.claudeVerify({
  action: 'verify',
  entityName: process.env.ENTITY_NAME,
  verbose: process.env.VERBOSE === 'true',
  format: 'text'
})

console.log(result.output)
process.exit(result.success ? 0 : 1)
```

## 输出格式

### 一致性报告
- 整体一致性分数 (0-100)
- 稳定实体列表
- 检测到的理解漂移
- 严重不一致警告
- 修复建议

### 漂移检测
- 漂移类型：semantic, structural, behavioral, critical
- 严重程度：low, medium, high, critical
- 漂移分数 (0-100)
- 证据和建议

## 集成说明

Context Verifier是LinchKit AI Guardian智能体集群的Phase 2组件，与以下系统集成：

- **Graph RAG**: 作为理解基准
- **Meta-Learner**: 学习理解模式
- **Arch-Warden**: 架构理解验证

## 配置选项

- `driftThreshold`: 漂移阈值 (默认15%)
- `criticalDriftThreshold`: 严重漂移阈值 (默认40%)
- `verificationInterval`: 验证间隔 (默认6小时)
- `semanticSimilarityThreshold`: 语义相似度阈值 (默认0.7)

## 错误处理

如果验证失败，检查：
1. Graph RAG系统状态
2. 项目上下文是否同步
3. 理解快照是否存在
4. 配置参数是否正确