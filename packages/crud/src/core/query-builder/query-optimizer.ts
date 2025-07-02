/**
 * 查询优化器
 * 
 * 优化查询性能：
 * - 查询条件优化
 * - 索引提示
 * - 查询计划分析
 * - 批量查询合并
 */

import type { Entity } from '@linch-kit/schema';

import type { Logger } from '../../types';

export interface QueryOptimizationHint {
  type: 'index' | 'join' | 'filter' | 'sort' | 'limit';
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
  field?: string;
}

export interface OptimizedQuery {
  query: Record<string, unknown>;
  hints: QueryOptimizationHint[];
  estimatedCost: number;
}

/**
 * 查询优化器实现
 */
export class QueryOptimizer {
  private readonly logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger?.child({ component: 'QueryOptimizer' });
  }

  /**
   * 优化查询
   */
  optimize(query: Record<string, unknown>, entity: Entity): OptimizedQuery {
    const hints: QueryOptimizationHint[] = [];
    let optimizedQuery = { ...query };
    let estimatedCost = 0;

    // 分析WHERE条件
    if (query.where) {
      const whereOptimization = this.optimizeWhere(query.where, entity);
      hints.push(...whereOptimization.hints);
      optimizedQuery.where = whereOptimization.optimizedWhere;
      estimatedCost += whereOptimization.cost;
    }

    // 分析ORDER BY
    if (query.orderBy) {
      const orderOptimization = this.optimizeOrderBy(query.orderBy, entity);
      hints.push(...orderOptimization.hints);
      estimatedCost += orderOptimization.cost;
    }

    // 分析关联查询
    if (query.include) {
      const includeOptimization = this.optimizeInclude(query.include, entity);
      hints.push(...includeOptimization.hints);
      optimizedQuery.include = includeOptimization.optimizedInclude;
      estimatedCost += includeOptimization.cost;
    }

    // 分析分页
    if (query.take || query.skip) {
      const paginationOptimization = this.optimizePagination(query, entity);
      hints.push(...paginationOptimization.hints);
      estimatedCost += paginationOptimization.cost;
    }

    // 分析字段选择
    if (query.select) {
      const selectOptimization = this.optimizeSelect(query.select, entity);
      hints.push(...selectOptimization.hints);
      estimatedCost += selectOptimization.cost;
    }

    this.logger?.debug('Query optimization completed', {
      originalQuery: query,
      optimizedQuery,
      hintsCount: hints.length,
      estimatedCost
    });

    return {
      query: optimizedQuery,
      hints,
      estimatedCost
    };
  }

  /**
   * 优化WHERE条件
   */
  private optimizeWhere(where: Record<string, unknown>, entity: Entity): {
    optimizedWhere: Record<string, unknown>;
    hints: QueryOptimizationHint[];
    cost: number;
  } {
    const hints: QueryOptimizationHint[] = [];
    let cost = 0;
    const optimizedWhere = { ...where };

    // 检查索引使用
    for (const [field, condition] of Object.entries(where)) {
      const fieldDef = entity.fields[field];
      
      if (fieldDef) {
        // 检查是否有索引
        if (fieldDef.index || fieldDef.unique) {
          hints.push({
            type: 'index',
            field,
            suggestion: `Using index on field '${field}'`,
            impact: 'high'
          });
          cost += 1; // 使用索引的成本较低
        } else if (this.isFrequentlyQueried(field)) {
          hints.push({
            type: 'index',
            field,
            suggestion: `Consider adding index on frequently queried field '${field}'`,
            impact: 'medium'
          });
          cost += 10; // 没有索引的成本较高
        }

        // 优化特定条件
        if (typeof condition === 'object' && condition !== null) {
          // 优化IN查询
          if ('in' in condition && Array.isArray(condition.in) && condition.in.length > 100) {
            hints.push({
              type: 'filter',
              field,
              suggestion: `Large IN clause (${condition.in.length} items) on '${field}' may impact performance`,
              impact: 'high'
            });
            cost += condition.in.length * 0.1;
          }

          // 优化LIKE查询
          if ('contains' in condition || 'startsWith' in condition || 'endsWith' in condition) {
            if (!fieldDef.index) {
              hints.push({
                type: 'filter',
                field,
                suggestion: `Text search on '${field}' without index may be slow`,
                impact: 'medium'
              });
              cost += 20;
            }
          }
        }
      }
    }

    // 优化复合条件
    if (where.AND && Array.isArray(where.AND) && where.AND.length > 5) {
      hints.push({
        type: 'filter',
        suggestion: `Complex AND condition with ${where.AND.length} clauses may impact performance`,
        impact: 'medium'
      });
      cost += where.AND.length * 2;
    }

    if (where.OR && Array.isArray(where.OR)) {
      hints.push({
        type: 'filter',
        suggestion: 'OR conditions generally perform worse than AND conditions',
        impact: 'medium'
      });
      cost += where.OR.length * 5;
    }

    return { optimizedWhere, hints, cost };
  }

  /**
   * 优化ORDER BY
   */
  private optimizeOrderBy(orderBy: Record<string, unknown>, entity: Entity): {
    hints: QueryOptimizationHint[];
    cost: number;
  } {
    const hints: QueryOptimizationHint[] = [];
    let cost = 0;

    const fields = Array.isArray(orderBy) 
      ? orderBy.flatMap(o => Object.keys(o))
      : Object.keys(orderBy);

    for (const field of fields) {
      const fieldDef = entity.fields[field];
      
      if (fieldDef && !fieldDef.index) {
        hints.push({
          type: 'sort',
          field,
          suggestion: `Sorting by non-index field '${field}' may be slow`,
          impact: 'medium'
        });
        cost += 15;
      }
    }

    if (fields.length > 3) {
      hints.push({
        type: 'sort',
        suggestion: `Sorting by ${fields.length} fields may impact performance`,
        impact: 'low'
      });
      cost += fields.length * 3;
    }

    return { hints, cost };
  }

  /**
   * 优化关联查询
   */
  private optimizeInclude(include: Record<string, unknown>, _entity: Entity): {
    optimizedInclude: Record<string, unknown>;
    hints: QueryOptimizationHint[];
    cost: number;
  } {
    const hints: QueryOptimizationHint[] = [];
    let cost = 0;
    const optimizedInclude = { ...include };

    const includeCount = Object.keys(include).length;
    
    if (includeCount > 3) {
      hints.push({
        type: 'join',
        suggestion: `Including ${includeCount} relations may cause N+1 queries`,
        impact: 'high'
      });
      cost += includeCount * 10;
    }

    // 检查嵌套深度
    const maxDepth = this.getIncludeDepth(include);
    if (maxDepth > 2) {
      hints.push({
        type: 'join',
        suggestion: `Deep nesting (${maxDepth} levels) in includes may impact performance`,
        impact: 'high'
      });
      cost += maxDepth * 15;
    }

    return { optimizedInclude, hints, cost };
  }

  /**
   * 优化分页
   */
  private optimizePagination(query: Record<string, unknown>, _entity: Entity): {
    hints: QueryOptimizationHint[];
    cost: number;
  } {
    const hints: QueryOptimizationHint[] = [];
    let cost = 0;

    if (query.skip && query.skip > 10000) {
      hints.push({
        type: 'limit',
        suggestion: `Large offset (${query.skip}) may be inefficient. Consider cursor-based pagination`,
        impact: 'high'
      });
      cost += query.skip * 0.001;
    }

    if (query.take && query.take > 1000) {
      hints.push({
        type: 'limit',
        suggestion: `Large limit (${query.take}) may impact memory usage`,
        impact: 'medium'
      });
      cost += query.take * 0.01;
    }

    if (!query.orderBy && (query.skip || query.take)) {
      hints.push({
        type: 'limit',
        suggestion: 'Pagination without ORDER BY may return inconsistent results',
        impact: 'medium'
      });
    }

    return { hints, cost };
  }

  /**
   * 优化字段选择
   */
  private optimizeSelect(select: Record<string, unknown>, entity: Entity): {
    hints: QueryOptimizationHint[];
    cost: number;
  } {
    const hints: QueryOptimizationHint[] = [];
    let cost = 0;

    const selectedFields = this.countSelectedFields(select);
    const totalFields = Object.keys(entity.fields).length;

    if (selectedFields < totalFields * 0.3) {
      hints.push({
        type: 'filter',
        suggestion: 'Selecting specific fields reduces data transfer',
        impact: 'low'
      });
      cost -= 5; // 选择特定字段实际上是优化
    }

    return { hints, cost };
  }

  /**
   * 检查字段是否经常被查询
   */
  private isFrequentlyQueried(field: string): boolean {
    // 这里可以集成实际的查询统计
    const frequentFields = ['id', 'createdAt', 'updatedAt', 'status', 'userId', 'tenantId'];
    return frequentFields.includes(field);
  }

  /**
   * 计算Include的最大深度
   */
  private getIncludeDepth(include: Record<string, unknown>, depth = 1): number {
    let maxDepth = depth;

    for (const value of Object.values(include)) {
      if (typeof value === 'object' && value !== null && 'include' in value) {
        const nestedDepth = this.getIncludeDepth(value.include, depth + 1);
        maxDepth = Math.max(maxDepth, nestedDepth);
      }
    }

    return maxDepth;
  }

  /**
   * 计算选择的字段数量
   */
  private countSelectedFields(select: Record<string, unknown>): number {
    let count = 0;

    for (const value of Object.values(select)) {
      if (value === true) {
        count++;
      } else if (typeof value === 'object' && value !== null && 'select' in value) {
        count += this.countSelectedFields(value.select);
      }
    }

    return count;
  }

  /**
   * 批量优化查询
   */
  batchOptimize(queries: Array<{ query: Record<string, unknown>; entity: Entity }>): Array<OptimizedQuery> {
    const optimizedQueries: OptimizedQuery[] = [];
    const batchHints: QueryOptimizationHint[] = [];

    // 检查是否可以合并查询
    const similarQueries = this.findSimilarQueries(queries);
    if (similarQueries.length > 1) {
      batchHints.push({
        type: 'filter',
        suggestion: `Found ${similarQueries.length} similar queries that could be combined`,
        impact: 'high'
      });
    }

    // 优化每个查询
    for (const { query, entity } of queries) {
      const optimized = this.optimize(query, entity);
      optimized.hints.push(...batchHints);
      optimizedQueries.push(optimized);
    }

    return optimizedQueries;
  }

  /**
   * 查找相似查询
   */
  private findSimilarQueries(queries: Array<{ query: Record<string, unknown>; entity: Entity }>): number[] {
    const similar: number[] = [];
    
    // 简单的相似性检查（可以扩展）
    const entityGroups = new Map<string, number[]>();
    
    queries.forEach((q, index) => {
      const group = entityGroups.get(q.entity.name) || [];
      group.push(index);
      entityGroups.set(q.entity.name, group);
    });

    for (const group of entityGroups.values()) {
      if (group.length > 1) {
        similar.push(...group);
      }
    }

    return similar;
  }
}

/**
 * 创建查询优化器实例
 */
export function createQueryOptimizer(logger?: Logger): QueryOptimizer {
  return new QueryOptimizer(logger);
}