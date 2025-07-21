/**
 * 关系去重和优化工具
 * 
 * 用于在存储到Neo4j之前对关系进行去重和质量优化
 */

import { createLogger } from '@linch-kit/core/server'
import type { GraphRelationship, RelationType } from '../types/index'

const logger = createLogger({ name: 'relationship-dedup' })

export interface DeduplicationResult {
  originalCount: number
  deduplicatedCount: number
  removedCount: number
  relationships: GraphRelationship[]
  stats: {
    byType: Record<string, number>
    byQuality: Record<string, number>
  }
}

/**
 * 关系去重器
 */
export class RelationshipDeduplicator {
  private readonly logger = logger

  /**
   * 执行关系去重和优化
   */
  deduplicate(relationships: GraphRelationship[]): DeduplicationResult {
    this.logger.info(`开始关系去重，原始数量: ${relationships.length}`)

    const originalCount = relationships.length

    // 1. 基础去重：完全相同的关系
    let dedupedRelations = this.removeExactDuplicates(relationships)
    this.logger.debug(`完全重复去重后: ${dedupedRelations.length}`)

    // 2. 语义去重：相同语义的不同关系类型
    dedupedRelations = this.removeSemanticDuplicates(dedupedRelations)
    this.logger.debug(`语义去重后: ${dedupedRelations.length}`)

    // 3. 质量过滤：移除低质量关系
    dedupedRelations = this.filterLowQualityRelationships(dedupedRelations)
    this.logger.debug(`质量过滤后: ${dedupedRelations.length}`)

    // 4. 层级优化：优先保留更具体的关系类型
    dedupedRelations = this.optimizeRelationshipHierarchy(dedupedRelations)
    this.logger.debug(`层级优化后: ${dedupedRelations.length}`)

    const stats = this.calculateStats(dedupedRelations)

    this.logger.info(`关系去重完成，剩余: ${dedupedRelations.length}，减少: ${originalCount - dedupedRelations.length}`)

    return {
      originalCount,
      deduplicatedCount: dedupedRelations.length,
      removedCount: originalCount - dedupedRelations.length,
      relationships: dedupedRelations,
      stats
    }
  }

  /**
   * 移除完全相同的关系
   */
  private removeExactDuplicates(relationships: GraphRelationship[]): GraphRelationship[] {
    const seen = new Set<string>()
    const unique: GraphRelationship[] = []

    for (const rel of relationships) {
      const key = `${rel.source}-${rel.type}-${rel.target}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(rel)
      }
    }

    this.logger.debug(`移除完全重复: ${relationships.length - unique.length} 个`)
    return unique
  }

  /**
   * 移除语义重复的关系
   * 例如：RELATED_TO vs REFERENCES 指向同一对节点
   */
  private removeSemanticDuplicates(relationships: GraphRelationship[]): GraphRelationship[] {
    const relationMap = new Map<string, GraphRelationship[]>()

    // 按节点对分组
    for (const rel of relationships) {
      const pairKey = `${rel.source}:${rel.target}`
      if (!relationMap.has(pairKey)) {
        relationMap.set(pairKey, [])
      }
      relationMap.get(pairKey)!.push(rel)
    }

    const deduplicated: GraphRelationship[] = []
    let removedCount = 0

    // 对每个节点对，选择最好的关系
    for (const [pairKey, relations] of relationMap) {
      if (relations.length === 1) {
        deduplicated.push(relations[0])
      } else {
        // 多个关系时，选择质量最高的
        const best = this.selectBestRelationship(relations)
        deduplicated.push(best)
        removedCount += relations.length - 1
      }
    }

    this.logger.debug(`移除语义重复: ${removedCount} 个`)
    return deduplicated
  }

  /**
   * 选择最佳关系
   */
  private selectBestRelationship(relations: GraphRelationship[]): GraphRelationship {
    // 关系类型优先级（越小越优先）
    const typePriority: Record<RelationType, number> = {
      'IMPORTS': 1,
      'EXPORTS': 2, 
      'CONTAINS': 3,
      'DEFINES': 4,
      'IMPLEMENTS': 5,
      'EXTENDS': 6,
      'HAS_METHOD': 7,
      'CALLS': 8,
      'USES_TYPE': 9,
      'DEPENDS_ON': 10,
      'REFERENCES': 11,
      'RELATED_TO': 12,
      'DOCUMENTS': 13
    }

    return relations.sort((a, b) => {
      // 1. 按类型优先级排序
      const priorityA = typePriority[a.type] || 99
      const priorityB = typePriority[b.type] || 99
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      // 2. 按置信度排序
      const confidenceA = (a.metadata?.confidence as number) || (a.properties?.confidence as number) || 0
      const confidenceB = (b.metadata?.confidence as number) || (b.properties?.confidence as number) || 0
      if (confidenceA !== confidenceB) {
        return confidenceB - confidenceA
      }

      // 3. 按创建时间排序（更新的优先）
      const timeA = new Date(a.metadata?.created_at as string || 0).getTime()
      const timeB = new Date(b.metadata?.created_at as string || 0).getTime()
      return timeB - timeA
    })[0]
  }

  /**
   * 过滤低质量关系
   */
  private filterLowQualityRelationships(relationships: GraphRelationship[]): GraphRelationship[] {
    const filtered = relationships.filter(rel => {
      // 1. 检查置信度
      const confidence = (rel.metadata?.confidence as number) || (rel.properties?.confidence as number) || 1
      if (confidence < 0.2) {
        return false
      }

      // 2. 检查RELATED_TO关系的质量
      if (rel.type === 'RELATED_TO') {
        const description = rel.properties?.description as string || ''
        // 保留有明确语义的RELATED_TO关系
        if (!description || description === '语义相关') {
          return confidence > 0.5
        }
      }

      // 3. 检查REFERENCES关系的必要性
      if (rel.type === 'REFERENCES') {
        // 如果已有更具体的关系（IMPORTS, USES_TYPE等），则不需要REFERENCES
        const hasSpecificRelation = relationships.some(other => 
          other.source === rel.source && 
          other.target === rel.target &&
          other.type !== 'REFERENCES' &&
          ['IMPORTS', 'USES_TYPE', 'CALLS', 'CONTAINS', 'DEFINES'].includes(other.type)
        )
        if (hasSpecificRelation) {
          return false
        }
      }

      return true
    })

    this.logger.debug(`质量过滤移除: ${relationships.length - filtered.length} 个`)
    return filtered
  }

  /**
   * 优化关系层级
   */
  private optimizeRelationshipHierarchy(relationships: GraphRelationship[]): GraphRelationship[] {
    const optimized: GraphRelationship[] = []
    const processed = new Set<string>()

    // 按优先级处理关系
    const sortedRelations = relationships.sort((a, b) => {
      const priorityA = this.getRelationshipPriority(a)
      const priorityB = this.getRelationshipPriority(b)
      return priorityA - priorityB
    })

    for (const rel of sortedRelations) {
      const key = `${rel.source}:${rel.target}`
      
      if (!processed.has(key)) {
        optimized.push(rel)
        processed.add(key)
      }
    }

    this.logger.debug(`层级优化后: ${optimized.length} 个`)
    return optimized
  }

  /**
   * 获取关系优先级
   */
  private getRelationshipPriority(rel: GraphRelationship): number {
    const typePriority: Record<RelationType, number> = {
      'IMPORTS': 1,
      'EXPORTS': 2,
      'CONTAINS': 3,
      'DEFINES': 4,
      'IMPLEMENTS': 5,
      'EXTENDS': 6,
      'HAS_METHOD': 7,
      'CALLS': 8,
      'USES_TYPE': 9,
      'DEPENDS_ON': 10,
      'REFERENCES': 11,
      'RELATED_TO': 12,
      'DOCUMENTS': 13
    }

    const basePriority = typePriority[rel.type] || 99
    const confidence = (rel.metadata?.confidence as number) || (rel.properties?.confidence as number) || 0
    
    // 优先级 = 基础优先级 - 置信度加成
    return basePriority - (confidence * 0.5)
  }

  /**
   * 计算统计信息
   */
  private calculateStats(relationships: GraphRelationship[]): {
    byType: Record<string, number>
    byQuality: Record<string, number>
  } {
    const byType: Record<string, number> = {}
    const byQuality: Record<string, number> = {
      'high': 0,     // confidence > 0.7
      'medium': 0,   // 0.4 <= confidence <= 0.7
      'low': 0       // confidence < 0.4
    }

    for (const rel of relationships) {
      // 按类型统计
      byType[rel.type] = (byType[rel.type] || 0) + 1

      // 按质量统计
      const confidence = (rel.metadata?.confidence as number) || (rel.properties?.confidence as number) || 1
      if (confidence > 0.7) {
        byQuality.high++
      } else if (confidence >= 0.4) {
        byQuality.medium++
      } else {
        byQuality.low++
      }
    }

    return { byType, byQuality }
  }
}

/**
 * 便捷函数：对关系数组进行去重
 */
export function deduplicateRelationships(relationships: GraphRelationship[]): DeduplicationResult {
  const deduplicator = new RelationshipDeduplicator()
  return deduplicator.deduplicate(relationships)
}