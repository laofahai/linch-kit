/**
 * LinchKit Vibe Coding Engine
 *
 * AI-驱动的智能代码生成引擎
 */

// 核心类型
export type {
  GenerationContext,
  ContextAnalysis,
  GeneratedCode,
  DependencyInfo,
  ValidationResult,
  IVibeCodingEngine,
  IContextAnalyzer,
} from './types.js'

export {
  GenerationContextType,
  TechStack,
  QualityLevel,
  GenerationContextSchema,
  ContextAnalysisSchema,
  GeneratedCodeSchema,
  DependencyInfoSchema,
} from './types.js'

// 核心引擎 (即将实现)
export { VibeCodingEngine } from './vibe-coding-engine.js'

// 上下文分析器 (即将实现)
export { ContextAnalyzer } from './context-analyzer.js'
