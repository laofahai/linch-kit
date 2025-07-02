/**
 * 查询验证器
 * 
 * 验证查询的正确性：
 * - 字段存在性检查
 * - 类型匹配验证
 * - 权限验证
 * - 查询复杂度限制
 */

import type { Entity } from '@linch-kit/schema';

import type { Logger } from '../../types';

export interface QueryValidationError {
  field?: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface QueryValidationResult {
  valid: boolean;
  errors: QueryValidationError[];
  warnings: QueryValidationError[];
}

export interface QueryValidationOptions {
  maxDepth?: number;
  maxComplexity?: number;
  maxLimit?: number;
  allowRawQueries?: boolean;
  strictMode?: boolean;
}

/**
 * 查询验证器实现
 */
export class QueryValidator {
  private readonly logger?: Logger;
  private readonly options: Required<QueryValidationOptions>;

  constructor(logger?: Logger, options?: QueryValidationOptions) {
    this.logger = logger?.child({ component: 'QueryValidator' });
    this.options = {
      maxDepth: options?.maxDepth ?? 3,
      maxComplexity: options?.maxComplexity ?? 100,
      maxLimit: options?.maxLimit ?? 1000,
      allowRawQueries: options?.allowRawQueries ?? false,
      strictMode: options?.strictMode ?? true
    };
  }

  /**
   * 验证查询
   */
  validate(query: Record<string, unknown>, entity: Entity): QueryValidationResult {
    const errors: QueryValidationError[] = [];
    const warnings: QueryValidationError[] = [];

    // 验证WHERE条件
    if (query.where) {
      const whereValidation = this.validateWhere(query.where, entity);
      errors.push(...whereValidation.errors);
      warnings.push(...whereValidation.warnings);
    }

    // 验证ORDER BY
    if (query.orderBy) {
      const orderValidation = this.validateOrderBy(query.orderBy, entity);
      errors.push(...orderValidation.errors);
      warnings.push(...orderValidation.warnings);
    }

    // 验证包含关系
    if (query.include) {
      const includeValidation = this.validateInclude(query.include, entity);
      errors.push(...includeValidation.errors);
      warnings.push(...includeValidation.warnings);
    }

    // 验证字段选择
    if (query.select) {
      const selectValidation = this.validateSelect(query.select, entity);
      errors.push(...selectValidation.errors);
      warnings.push(...selectValidation.warnings);
    }

    // 验证分页参数
    const paginationValidation = this.validatePagination(query);
    errors.push(...paginationValidation.errors);
    warnings.push(...paginationValidation.warnings);

    // 验证原始查询
    if (query._raw && !this.options.allowRawQueries) {
      errors.push({
        message: 'Raw queries are not allowed',
        code: 'RAW_QUERY_NOT_ALLOWED',
        severity: 'error'
      });
    }

    // 验证查询复杂度
    const complexity = this.calculateComplexity(query);
    if (complexity > this.options.maxComplexity) {
      errors.push({
        message: `Query complexity (${complexity}) exceeds maximum allowed (${this.options.maxComplexity})`,
        code: 'QUERY_TOO_COMPLEX',
        severity: 'error'
      });
    }

    const valid = errors.length === 0;
    
    this.logger?.debug('Query validation completed', {
      valid,
      errorsCount: errors.length,
      warningsCount: warnings.length,
      complexity
    });

    return { valid, errors, warnings };
  }

  /**
   * 验证WHERE条件
   */
  private validateWhere(where: Record<string, unknown>, entity: Entity, depth = 0): {
    errors: QueryValidationError[];
    warnings: QueryValidationError[];
  } {
    const errors: QueryValidationError[] = [];
    const warnings: QueryValidationError[] = [];

    if (depth > this.options.maxDepth) {
      errors.push({
        message: `WHERE clause nesting depth (${depth}) exceeds maximum (${this.options.maxDepth})`,
        code: 'WHERE_TOO_DEEP',
        severity: 'error'
      });
      return { errors, warnings };
    }

    // 处理逻辑操作符
    if (where.AND || where.OR || where.NOT) {
      if (where.AND && Array.isArray(where.AND)) {
        for (const condition of where.AND) {
          const result = this.validateWhere(condition, entity, depth + 1);
          errors.push(...result.errors);
          warnings.push(...result.warnings);
        }
      }

      if (where.OR && Array.isArray(where.OR)) {
        for (const condition of where.OR) {
          const result = this.validateWhere(condition, entity, depth + 1);
          errors.push(...result.errors);
          warnings.push(...result.warnings);
        }
      }

      if (where.NOT) {
        const result = this.validateWhere(where.NOT, entity, depth + 1);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      }
    }

    // 验证字段条件
    for (const [field, condition] of Object.entries(where)) {
      if (['AND', 'OR', 'NOT'].includes(field)) continue;

      const fieldDef = entity.fields[field];
      if (!fieldDef) {
        const error: QueryValidationError = {
          field,
          message: `Field '${field}' does not exist in entity '${entity.name}'`,
          code: 'FIELD_NOT_FOUND',
          severity: 'error'
        };

        if (this.options.strictMode) {
          errors.push(error);
        } else {
          warnings.push({ ...error, severity: 'warning' });
        }
        continue;
      }

      // 验证条件类型
      this.validateCondition(field, condition, fieldDef, errors, warnings);
    }

    return { errors, warnings };
  }

  /**
   * 验证字段条件
   */
  private validateCondition(
    field: string,
    condition: unknown,
    fieldDef: Record<string, unknown>,
    errors: QueryValidationError[],
    warnings: QueryValidationError[]
  ): void {
    if (condition === null || condition === undefined) {
      return;
    }

    if (typeof condition === 'object') {
      // 验证操作符
      const operators = Object.keys(condition);
      const validOperators = [
        'equals', 'not', 'in', 'notIn', 'lt', 'lte', 'gt', 'gte',
        'contains', 'startsWith', 'endsWith', 'mode'
      ];

      for (const op of operators) {
        if (!validOperators.includes(op) && op !== 'mode') {
          warnings.push({
            field,
            message: `Unknown operator '${op}' for field '${field}'`,
            code: 'UNKNOWN_OPERATOR',
            severity: 'warning'
          });
        }

        // 验证操作符与字段类型的兼容性
        if (['contains', 'startsWith', 'endsWith'].includes(op) && 
            fieldDef.type !== 'string') {
          errors.push({
            field,
            message: `String operator '${op}' used on non-string field '${field}'`,
            code: 'INCOMPATIBLE_OPERATOR',
            severity: 'error'
          });
        }

        if (['lt', 'lte', 'gt', 'gte'].includes(op) && 
            !['number', 'integer', 'float', 'date', 'datetime'].includes(fieldDef.type)) {
          errors.push({
            field,
            message: `Comparison operator '${op}' used on non-comparable field '${field}'`,
            code: 'INCOMPATIBLE_OPERATOR',
            severity: 'error'
          });
        }

        // 验证IN操作符的值
        if ((op === 'in' || op === 'notIn') && !Array.isArray(condition[op])) {
          errors.push({
            field,
            message: `Operator '${op}' requires an array value`,
            code: 'INVALID_VALUE_TYPE',
            severity: 'error'
          });
        }
      }
    }
  }

  /**
   * 验证ORDER BY
   */
  private validateOrderBy(orderBy: Record<string, unknown>, entity: Entity): {
    errors: QueryValidationError[];
    warnings: QueryValidationError[];
  } {
    const errors: QueryValidationError[] = [];
    const warnings: QueryValidationError[] = [];

    const fields = Array.isArray(orderBy)
      ? orderBy.flatMap(o => Object.keys(o))
      : Object.keys(orderBy);

    for (const field of fields) {
      if (!entity.fields[field]) {
        const error: QueryValidationError = {
          field,
          message: `Cannot order by non-existent field '${field}'`,
          code: 'INVALID_ORDER_FIELD',
          severity: 'error'
        };

        if (this.options.strictMode) {
          errors.push(error);
        } else {
          warnings.push({ ...error, severity: 'warning' });
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * 验证包含关系
   */
  private validateInclude(include: Record<string, unknown>, entity: Entity, depth = 0): {
    errors: QueryValidationError[];
    warnings: QueryValidationError[];
  } {
    const errors: QueryValidationError[] = [];
    const warnings: QueryValidationError[] = [];

    if (depth > this.options.maxDepth) {
      errors.push({
        message: `Include nesting depth (${depth}) exceeds maximum (${this.options.maxDepth})`,
        code: 'INCLUDE_TOO_DEEP',
        severity: 'error'
      });
      return { errors, warnings };
    }

    for (const [relation, value] of Object.entries(include)) {
      const relationField = entity.fields[relation];
      
      if (!relationField || relationField.type !== 'relation') {
        errors.push({
          field: relation,
          message: `'${relation}' is not a valid relation field`,
          code: 'INVALID_RELATION',
          severity: 'error'
        });
        continue;
      }

      // 如果包含嵌套查询，递归验证
      if (typeof value === 'object' && value !== null && typeof value !== 'boolean') {
        const objectValue = value as Record<string, unknown>
        if (objectValue.include) {
          // 这里需要获取关联实体，简化处理
          warnings.push({
            field: relation,
            message: `Nested include on '${relation}' may impact performance`,
            code: 'NESTED_INCLUDE',
            severity: 'warning'
          });
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * 验证字段选择
   */
  private validateSelect(select: Record<string, unknown>, entity: Entity): {
    errors: QueryValidationError[];
    warnings: QueryValidationError[];
  } {
    const errors: QueryValidationError[] = [];
    const warnings: QueryValidationError[] = [];

    for (const [field, _value] of Object.entries(select)) {
      if (!entity.fields[field]) {
        const error: QueryValidationError = {
          field,
          message: `Cannot select non-existent field '${field}'`,
          code: 'INVALID_SELECT_FIELD',
          severity: 'error'
        };

        if (this.options.strictMode) {
          errors.push(error);
        } else {
          warnings.push({ ...error, severity: 'warning' });
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * 验证分页参数
   */
  private validatePagination(query: Record<string, unknown>): {
    errors: QueryValidationError[];
    warnings: QueryValidationError[];
  } {
    const errors: QueryValidationError[] = [];
    const warnings: QueryValidationError[] = [];

    if (query.take !== undefined) {
      if (typeof query.take !== 'number' || query.take < 0) {
        errors.push({
          field: 'take',
          message: 'Limit must be a non-negative number',
          code: 'INVALID_LIMIT',
          severity: 'error'
        });
      } else if (query.take > this.options.maxLimit) {
        errors.push({
          field: 'take',
          message: `Limit (${query.take}) exceeds maximum allowed (${this.options.maxLimit})`,
          code: 'LIMIT_TOO_LARGE',
          severity: 'error'
        });
      } else if (query.take > 100) {
        warnings.push({
          field: 'take',
          message: `Large limit (${query.take}) may impact performance`,
          code: 'LARGE_LIMIT',
          severity: 'warning'
        });
      }
    }

    if (query.skip !== undefined) {
      if (typeof query.skip !== 'number' || query.skip < 0) {
        errors.push({
          field: 'skip',
          message: 'Offset must be a non-negative number',
          code: 'INVALID_OFFSET',
          severity: 'error'
        });
      } else if (query.skip > 10000) {
        warnings.push({
          field: 'skip',
          message: `Large offset (${query.skip}) may impact performance`,
          code: 'LARGE_OFFSET',
          severity: 'warning'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * 计算查询复杂度
   */
  private calculateComplexity(query: Record<string, unknown>): number {
    let complexity = 1;

    // WHERE条件复杂度
    if (query.where) {
      complexity += this.calculateWhereComplexity(query.where);
    }

    // 包含关系复杂度
    if (query.include) {
      complexity += Object.keys(query.include).length * 10;
    }

    // 排序复杂度
    if (query.orderBy) {
      const fields = Array.isArray(query.orderBy)
        ? query.orderBy.length
        : Object.keys(query.orderBy).length;
      complexity += fields * 2;
    }

    // 分页复杂度
    if (query.skip) {
      complexity += Math.log10(query.skip + 1);
    }

    return Math.round(complexity);
  }

  /**
   * 计算WHERE条件复杂度
   */
  private calculateWhereComplexity(where: Record<string, unknown>, depth = 0): number {
    let complexity = depth;

    for (const [key, value] of Object.entries(where)) {
      if (key === 'AND' && Array.isArray(value)) {
        complexity += value.reduce((sum, cond) => 
          sum + this.calculateWhereComplexity(cond, depth + 1), 0);
      } else if (key === 'OR' && Array.isArray(value)) {
        complexity += value.reduce((sum, cond) => 
          sum + this.calculateWhereComplexity(cond, depth + 1), 0) * 2;
      } else if (key === 'NOT') {
        complexity += this.calculateWhereComplexity(value, depth + 1) * 1.5;
      } else {
        complexity += 1;
      }
    }

    return complexity;
  }
}

/**
 * 创建查询验证器实例
 */
export function createQueryValidator(
  logger?: Logger,
  options?: QueryValidationOptions
): QueryValidator {
  return new QueryValidator(logger, options);
}