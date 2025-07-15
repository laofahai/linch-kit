# Decision Council Command

## 📋 概述

Decision Council (决策议会) 是LinchKit AI Guardian Phase 3的核心组件，专门用于多Agent架构决策辩论系统，对复杂架构决策进行多角度分析验证。

## 🎯 主要功能

- **多Agent协作**: 模拟不同角色专家的决策分析过程
- **智能置信度评估**: 基于共识级别和风险评估的智能置信度计算
- **争议点识别**: 自动识别不同专家间的观点分歧
- **风险汇总分析**: 综合所有Agent的风险评估，提供整体风险视图
- **实施计划生成**: 基于决策结果自动生成实施步骤和监控计划

## 🤖 AI Agent角色

### 核心专家角色
- **Architect (架构师)**: 关注可扩展性、可维护性、灵活性
- **Security Expert (安全专家)**: 关注安全性、合规性、漏洞防护
- **Performance Expert (性能专家)**: 关注性能、效率、优化
- **Business Analyst (业务分析师)**: 关注业务价值、用户体验、市场适应性
- **Developer (开发者)**: 关注开发速度、代码质量、测试性
- **Quality Assurance (质量保证)**: 关注可测试性、可靠性、质量标准

## 🚀 使用方法

### 基础命令

```bash
# 创建新决策分析
/decision-council decide "选择前端框架"

# 查看决策历史
/decision-council history

# 分析特定决策
/decision-council analyze decision-123

# 生成决策报告
/decision-council report decision-123

# 查看统计信息
/decision-council stats
```

### 高级选项

```bash
# 指定决策类型和优先级
/decision-council decide "数据库选型" --type=technology --priority=critical

# 添加决策选项
/decision-council decide "API架构设计" \
  --option="REST:传统REST API:3:50:简单易懂,广泛支持:性能一般" \
  --option="GraphQL:灵活查询API:7:120:查询灵活,类型安全:学习成本高" \
  --option="tRPC:类型安全RPC:6:100:端到端类型安全:生态相对较小"

# 添加上下文信息
/decision-council decide "缓存策略" \
  --context="packages:core,platform" \
  --context="constraints:内存限制,性能要求" \
  --description="为LinchKit选择合适的缓存策略"

# 不同格式输出
/decision-council history --format=table
/decision-council report decision-123 --format=markdown
/decision-council analyze decision-123 --format=json
```

## 🎚️ 决策类型

### Architecture (架构决策)
- 系统架构设计
- 模块划分策略
- 技术架构选型

### Technology (技术选型)
- 框架和库选择
- 工具链配置
- 第三方服务集成

### Performance (性能权衡)
- 性能优化策略
- 资源分配决策
- 缓存策略选择

### Security (安全策略)
- 安全架构设计
- 权限控制策略
- 数据保护方案

### Integration (集成方案)
- 系统集成策略
- API设计决策
- 数据同步方案

### Refactoring (重构决策)
- 代码重构计划
- 架构演进策略
- 技术债务处理

## 📊 决策分析示例

```
🏛️ 创建新决策分析: 选择状态管理方案
✅ 决策分析完成:
   🎯 决策ID: decision-1704967200123
   📋 推荐方案: zustand
   📊 置信度: 82.5%
   🤝 共识级别: high
   ⚠️ 风险评分: 4.2/10
   👤 需要人工审核: 否

🤖 Agent分析:
   architect: zustand (85.0%)
   developer: zustand (88.0%)
   performance: redux-toolkit (75.0%)
   business: zustand (80.0%)
```

## 📈 置信度评估机制

### 计算要素
- **基础置信度**: 所有Agent置信度的平均值
- **共识调整**: 
  - High共识: +10分
  - Medium共识: +5分
  - Low共识: -5分
  - No共识: -15分
- **Agent数量**: 更多Agent参与 = 更高置信度

### 人工审核触发条件
- 决策优先级为Critical
- 整体风险评分 ≥ 7
- 置信度 < 70%
- 共识级别为Low或None
- 存在4级以上高风险

## 🔍 争议点识别

系统自动识别以下争议：
- **选项分歧**: 不同Agent推荐不同方案
- **关注点差异**: 某些专家独有的关注点
- **评分差异**: 同一标准下的评分分歧过大

## 📋 风险评估体系

### 风险等级 (1-5)
- **1级**: 低风险，影响有限
- **2级**: 轻微风险，可监控
- **3级**: 中等风险，需要注意
- **4级**: 高风险，需要缓解措施
- **5级**: 极高风险，需要立即处理

### 风险类型
- **技术风险**: 实施难度、技术债务
- **业务风险**: 用户体验、市场适应性
- **安全风险**: 数据安全、合规性
- **性能风险**: 系统性能、资源消耗
- **维护风险**: 长期维护、团队技能

## 📊 决策报告格式

生成的决策报告包含：

### 基本信息
- 决策ID、标题、类型、优先级
- 分析时间、共识级别、置信度

### 推荐方案
- 最终推荐选项
- 方案详细描述
- 优缺点分析

### Agent分析结果
- 每个Agent的详细分析
- 推荐理由和关注点
- 具体建议和风险评估

### 风险评估
- 整体风险评分
- 关键风险列表
- 风险缓解计划

### 实施建议
- 分步实施计划
- 监控指标设置
- 回退策略制定

## 🗂️ 数据存储

```
.claude/decision-council/
├── decision-history.json         # 决策历史记录
├── agent-analyses/              # Agent分析详情
│   ├── decision-{id}-architect.json
│   ├── decision-{id}-security.json
│   └── ...
└── reports/                     # 生成的报告
    ├── decision-{id}-report.md
    └── decision-{id}-data.json
```

## 📊 统计信息

Decision Council提供以下统计：

### 整体统计
- 总决策数量
- 平均置信度
- 人工审核率

### 分类统计
- 按决策类型分布
- 按优先级分布
- 按共识级别分布

### 趋势分析
- 决策质量趋势
- Agent分析准确性
- 实施成功率

## ⚠️ 使用注意事项

1. **模拟分析**: 当前版本使用模拟的Agent分析，未来将集成真实的AI模型
2. **人工审核**: 高风险或低置信度决策仍需人工最终确认
3. **上下文限制**: Agent分析基于提供的信息，详细上下文有助于更准确的分析
4. **持续优化**: 基于实际使用反馈持续优化Agent分析算法

## 🔗 集成说明

Decision Council已集成到LinchKit开发工作流:

- **package.json脚本**: `bun run council:*`
- **AI Platform**: 统一的Guardian工具集
- **Graph RAG**: 基于项目上下文的智能分析
- **开发约束**: 遵循LinchKit架构决策流程

## 📚 相关文档

- [AI Guardian Implementation Phases](../ai-context/02_Guides/13_AI_Guardian_Implementation_Phases.md)
- [AI Collaboration](../ai-context/02_Guides/03_AI_Collaboration.md)
- [Strategic Architecture Evolution](../ai-context/01_Architecture/07_Strategic_Architecture_Evolution.md)

---

**提示**: Decision Council提供多角度决策分析，但最终决策权仍在开发团队。建议将其作为决策支持工具，结合团队经验做出最终判断。