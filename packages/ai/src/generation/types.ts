/**
 * Vibe Coding Engine Types
 * 
 * 代码生成引擎的核心类型定义
 */

import { z } from 'zod'

import type { GraphNode, GraphRelationship } from '../types/index.js'

/**
 * 代码生成上下文类型
 */
export enum GenerationContextType {
  FUNCTION = 'function',           // 函数生成
  CLASS = 'class',                 // 类生成
  INTERFACE = 'interface',         // 接口生成
  COMPONENT = 'component',         // React 组件生成
  API_ROUTE = 'api_route',         // API 路由生成
  SCHEMA = 'schema',               // Schema 定义生成
  TEST = 'test',                   // 测试用例生成
  UTILITY = 'utility',             // 工具函数生成
  HOOK = 'hook',                   // React Hook 生成
  MIDDLEWARE = 'middleware'        // 中间件生成
}

/**
 * 技术栈类型
 */
export enum TechStack {
  TYPESCRIPT = 'typescript',
  REACT = 'react',
  NEXT_JS = 'nextjs',
  TRPC = 'trpc',
  PRISMA = 'prisma',
  ZOD = 'zod',
  TAILWIND = 'tailwind',
  SHADCN_UI = 'shadcn-ui'
}

/**
 * 代码质量级别
 */
export enum QualityLevel {
  PROTOTYPE = 'prototype',         // 原型级别
  DEVELOPMENT = 'development',     // 开发级别
  PRODUCTION = 'production'        // 生产级别
}

/**
 * 生成上下文 Schema
 */
export const GenerationContextSchema = z.object({
  type: z.nativeEnum(GenerationContextType).describe('生成类型'),
  tech_stack: z.array(z.nativeEnum(TechStack)).describe('技术栈'),
  quality_level: z.nativeEnum(QualityLevel).default(QualityLevel.DEVELOPMENT).describe('质量级别'),
  target_package: z.string().optional().describe('目标包名'),
  target_file: z.string().optional().describe('目标文件路径'),
  existing_imports: z.array(z.string()).default([]).describe('现有导入'),
  constraints: z.object({
    max_lines: z.number().default(200).describe('最大行数'),
    include_tests: z.boolean().default(false).describe('是否包含测试'),
    include_docs: z.boolean().default(true).describe('是否包含文档'),
    follow_conventions: z.boolean().default(true).describe('是否遵循约定')
  }).default({}).describe('生成约束'),
  metadata: z.record(z.unknown()).optional().describe('额外元数据')
})

/**
 * 上下文分析结果 Schema
 */
export const ContextAnalysisSchema = z.object({
  relevant_nodes: z.array(z.object({
    node: z.custom<GraphNode>(),
    relevance_score: z.number().min(0).max(1).describe('相关性评分'),
    reason: z.string().describe('相关性原因')
  })).describe('相关节点'),
  
  suggested_imports: z.array(z.object({
    module: z.string().describe('模块名'),
    exports: z.array(z.string()).describe('导出项'),
    confidence: z.number().min(0).max(1).describe('置信度'),
    source: z.enum(['linchkit', 'external', 'local']).describe('来源类型')
  })).describe('建议导入'),
  
  dependency_analysis: z.object({
    required_packages: z.array(z.string()).describe('必需包'),
    optional_packages: z.array(z.string()).describe('可选包'),
    potential_conflicts: z.array(z.string()).describe('潜在冲突')
  }).describe('依赖分析'),
  
  patterns: z.array(z.object({
    name: z.string().describe('模式名称'),
    description: z.string().describe('模式描述'),
    confidence: z.number().min(0).max(1).describe('置信度'),
    examples: z.array(z.string()).describe('示例代码')
  })).describe('识别的代码模式'),
  
  recommendations: z.array(z.object({
    category: z.enum(['architecture', 'performance', 'security', 'maintainability']).describe('建议类别'),
    suggestion: z.string().describe('建议内容'),
    priority: z.enum(['high', 'medium', 'low']).describe('优先级')
  })).describe('架构建议')
})

/**
 * 生成的代码 Schema
 */
export const GeneratedCodeSchema = z.object({
  code: z.string().describe('生成的代码'),
  imports: z.array(z.string()).describe('导入语句'),
  exports: z.array(z.string()).describe('导出项'),
  dependencies: z.object({
    internal: z.array(z.string()).describe('内部依赖'),
    external: z.array(z.string()).describe('外部依赖')
  }).describe('依赖信息'),
  metadata: z.object({
    generated_at: z.string().describe('生成时间'),
    tech_stack: z.array(z.nativeEnum(TechStack)).describe('使用的技术栈'),
    confidence: z.number().min(0).max(1).describe('生成置信度'),
    estimated_lines: z.number().describe('预估行数'),
    complexity_score: z.number().min(0).max(10).describe('复杂度评分')
  }).describe('生成元数据'),
  validation: z.object({
    syntax_valid: z.boolean().describe('语法有效性'),
    type_safe: z.boolean().describe('类型安全性'),
    lint_compliant: z.boolean().describe('ESLint 合规性'),
    warnings: z.array(z.string()).describe('警告信息'),
    suggestions: z.array(z.string()).describe('改进建议')
  }).describe('代码验证结果')
})

/**
 * 依赖信息 Schema
 */
export const DependencyInfoSchema = z.object({
  name: z.string().describe('依赖名称'),
  type: z.enum(['direct', 'indirect', 'peer', 'dev']).describe('依赖类型'),
  source: z.enum(['linchkit', 'npm', 'local']).describe('依赖来源'),
  version: z.string().optional().describe('版本要求'),
  import_path: z.string().describe('导入路径'),
  exports_used: z.array(z.string()).describe('使用的导出项'),
  confidence: z.number().min(0).max(1).describe('推理置信度'),
  reason: z.string().describe('推理原因')
})

/**
 * TypeScript 类型定义
 */
export type GenerationContext = z.infer<typeof GenerationContextSchema>
export type ContextAnalysis = z.infer<typeof ContextAnalysisSchema>
export type GeneratedCode = z.infer<typeof GeneratedCodeSchema>
export type DependencyInfo = z.infer<typeof DependencyInfoSchema>
export type ValidationResult = GeneratedCode['validation']

/**
 * Vibe Coding Engine 核心接口
 */
export interface IVibeCodingEngine {
  /**
   * 基于自然语言提示生成代码
   */
  generateCode(prompt: string, context?: Partial<GenerationContext>): Promise<GeneratedCode>

  /**
   * 基于图谱查询获取上下文
   */
  analyzeContext(prompt: string): Promise<ContextAnalysis>

  /**
   * 智能依赖推理
   */
  inferDependencies(code: string): Promise<DependencyInfo[]>

  /**
   * 代码质量验证
   */
  validateGeneration(code: string): Promise<ValidationResult>

  /**
   * 获取代码生成建议
   */
  getSuggestions(prompt: string): Promise<string[]>
}

/**
 * 上下文分析器接口
 */
export interface IContextAnalyzer {
  /**
   * 分析生成上下文
   */
  analyze(prompt: string, nodes: GraphNode[], relationships: GraphRelationship[]): Promise<ContextAnalysis>

  /**
   * 提取相关节点
   */
  extractRelevantNodes(prompt: string, nodes: GraphNode[]): Promise<Array<{
    node: GraphNode
    relevance_score: number
    reason: string
  }>>

  /**
   * 推荐导入语句
   */
  suggestImports(context: ContextAnalysis): Promise<ContextAnalysis['suggested_imports']>

  /**
   * 分析依赖关系
   */
  analyzeDependencies(nodes: GraphNode[], relationships: GraphRelationship[]): Promise<ContextAnalysis['dependency_analysis']>
}