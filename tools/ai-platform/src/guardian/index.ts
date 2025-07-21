/**
 * LinchKit AI Guardian 智能体集群
 * 
 * 基于AI Platform的智能开发风险防控体系
 * 采用Gemini推荐的"分层集成架构"设计
 * 
 * 架构设计：
 * - 核心逻辑层: Guardian智能体的全部实现
 * - 接口适配层: Claude Code等接口的适配器
 * - 用户入口层: .claude/commands/ 中的轻量级入口
 * 
 * @version 1.0.0 (Phase 1 - 基础防护体系)
 */

// Phase 1: 基础防护体系
export { ArchWarden } from './.*'

// Phase 1 - Meta-Learner (元学习者) ✅ 实现完成
export { MetaLearner } from './.*'

// Phase 1 - AI开发流程Guardian (新增)
export { PreCheckGuardian, preCheckGuardian } from './.*'
export { QualityGateGuardian, qualityGateGuardian } from './.*'

// Phase 2 - 智能验证系统
export { ContextVerifier } from './.*'
export { SecuritySentinel } from './.*'

// TODO: Phase 3 - 完整智能体集群
// export { QASynthesizer } from './.*'
// export { DecisionCouncil } from './.*'

// TODO: Phase 4 - 进化引擎
// export { EvolutionEngine } from './.*'

/**
 * Guardian 智能体类型定义
 */
export interface GuardianAgent {
  name: string
  version: string
  phase: number
  status: 'active' | 'planned' | 'development'
  capabilities: string[]
}

/**
 * 当前已实现的 Guardian 智能体
 */
export const ACTIVE_GUARDIANS: GuardianAgent[] = [
  {
    name: 'Arch-Warden',
    version: '1.0.0',
    phase: 1,
    status: 'active',
    capabilities: [
      '循环依赖检测',
      '层级违规检查',
      '逆向依赖验证',
      '架构合规评分',
      '智能修复建议'
    ]
  },
  {
    name: 'Meta-Learner',
    version: '1.0.0',
    phase: 1,
    status: 'active',
    capabilities: [
      'AI行为监控',
      '成功模式学习',
      '规则自动优化',
      '改进建议生成',
      '质量趋势分析'
    ]
  },
  {
    name: 'Context-Verifier',
    version: '1.0.0',
    phase: 2,
    status: 'active',
    capabilities: [
      'AI理解一致性验证',
      '语义漂移检测',
      '上下文校准',
      '理解偏差纠正',
      '双向验证机制'
    ]
  },
  {
    name: 'Security-Sentinel',
    version: '1.0.0',
    phase: 2,
    status: 'active',
    capabilities: [
      'Extension代码静态安全分析',
      'AI生成代码安全模式检查',
      '沙箱隔离机制',
      '权限控制和威胁检测',
      'CASL权限系统集成'
    ]
  }
]

/**
 * 计划中的 Guardian 智能体
 */
export const PLANNED_GUARDIANS: GuardianAgent[] = [
  {
    name: 'QA-Synthesizer',
    version: '1.0.0',
    phase: 3,
    status: 'planned',
    capabilities: [
      'AI驱动测试生成',
      'Schema驱动测试',
      '边界条件覆盖',
      '逻辑意图验证'
    ]
  },
  {
    name: 'Decision-Council',
    version: '1.0.0',
    phase: 3,
    status: 'planned',
    capabilities: [
      '多Agent决策辩论',
      '置信度评估',
      '风险分析',
      '人工干预触发'
    ]
  },
  {
    name: 'Evolution-Engine',
    version: '1.0.0',
    phase: 4,
    status: 'planned',
    capabilities: [
      '系统自我进化',
      '架构变化适应',
      '规则动态调整',
      '持续优化'
    ]
  }
]

/**
 * 获取所有 Guardian 智能体信息
 */
export function getAllGuardians(): GuardianAgent[] {
  return [...ACTIVE_GUARDIANS, ...PLANNED_GUARDIANS]
}

/**
 * 根据阶段获取 Guardian 智能体
 */
export function getGuardiansByPhase(phase: number): GuardianAgent[] {
  return getAllGuardians().filter(guardian => guardian.phase === phase)
}

/**
 * 获取当前激活的 Guardian 智能体
 */
export function getActiveGuardians(): GuardianAgent[] {
  return ACTIVE_GUARDIANS
}

export const GUARDIAN_VERSION = '1.0.0-phase1'
export const GUARDIAN_PHASE = 1