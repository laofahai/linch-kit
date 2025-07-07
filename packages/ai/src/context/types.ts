/**
 * Context Query Tool 类型定义
 */

import { z } from 'zod'

/**
 * 实体类型枚举
 */
export enum EntityType {
  CLASS = 'Class',
  INTERFACE = 'Interface',
  FUNCTION = 'Function',
  SCHEMA = 'Schema',
  COMPONENT = 'Component'
}

/**
 * 关系类型枚举
 */
export enum RelationType {
  IMPLEMENTS = 'IMPLEMENTS',
  EXTENDS = 'EXTENDS',
  USES = 'USES',
  CALLS = 'CALLS',
  IMPORTS = 'IMPORTS'
}

/**
 * 实体信息 Schema
 */
export const EntityInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['Class', 'Interface', 'Function', 'Schema', 'Component']),
  package: z.string(),
  description: z.string().optional(),
  path: z.string().optional(),
  exports: z.array(z.string()).optional(),
  relevance: z.number().min(0).max(1)
})

/**
 * 关系信息 Schema
 */
export const RelationshipInfoSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.enum(['IMPLEMENTS', 'EXTENDS', 'USES', 'CALLS', 'IMPORTS']),
  description: z.string().optional()
})

/**
 * 文档引用 Schema
 */
export const DocReferenceSchema = z.object({
  title: z.string(),
  path: z.string(),
  section: z.string().optional(),
  relevance: z.number().min(0).max(1)
})

/**
 * 使用示例 Schema
 */
export const ExampleSchema = z.object({
  description: z.string(),
  code: z.string(),
  source: z.string()
})

/**
 * 最佳实践 Schema
 */
export const BestPracticeSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.string(),
  examples: z.array(z.string()),
  references: z.array(z.string())
})

/**
 * 代码模式 Schema
 */
export const PatternSchema = z.object({
  name: z.string(),
  description: z.string(),
  usage: z.string(),
  related_entities: z.array(z.string())
})

/**
 * 上下文信息 Schema
 */
export const ContextInfoSchema = z.object({
  entities: z.array(EntityInfoSchema),
  relationships: z.array(RelationshipInfoSchema),
  documentation: z.array(DocReferenceSchema),
  examples: z.array(ExampleSchema),
  metadata: z.object({
    query: z.string(),
    timestamp: z.string(),
    relevance_score: z.number().min(0).max(1),
    total_results: z.number().int().min(0)
  })
})

// 导出类型
export type EntityInfo = z.infer<typeof EntityInfoSchema>
export type RelationshipInfo = z.infer<typeof RelationshipInfoSchema>
export type DocReference = z.infer<typeof DocReferenceSchema>
export type Example = z.infer<typeof ExampleSchema>
export type BestPractice = z.infer<typeof BestPracticeSchema>
export type Pattern = z.infer<typeof PatternSchema>
export type ContextInfo = z.infer<typeof ContextInfoSchema>