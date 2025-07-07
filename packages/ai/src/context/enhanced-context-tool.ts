/**
 * 增强的上下文查询工具 - 为Claude Code设计的简化版AI助手接口
 * 
 * 这是最终版本：结合简单意图检测 + 结构化输出 + 实现建议
 */

import { createLogger } from '@linch-kit/core/server'

import type { Logger } from '../types/index.js'

import { ContextQueryTool } from './context-query-tool.js'

/**
 * 检测到的开发动作
 */
export enum DetectedAction {
  ADD_FIELD = 'add_field',
  REMOVE_FIELD = 'remove_field', 
  CREATE_API = 'create_api',
  CREATE_UI = 'create_ui',
  ADD_VALIDATION = 'add_validation',
  UNKNOWN = 'unknown'
}

/**
 * 字段建议
 */
export interface FieldSuggestion {
  name: string
  type: string
  nullable: boolean
  zod_schema: string
  prisma_field: string
  validation_rules?: string[]
}

/**
 * 实现步骤
 */
export interface ImplementationStep {
  order: number
  action: string
  file_path: string
  description: string
  code_suggestion?: string
}

/**
 * 增强的上下文响应
 */
export interface EnhancedContextResponse {
  success: boolean
  query: string
  timestamp: string
  execution_time_ms: number
  
  // 查询分析
  query_analysis: {
    detected_action: DetectedAction
    target_entity?: string
    field_name?: string
    confidence: number
  }
  
  // 上下文信息
  context: {
    entity_definition?: {
      name: string
      type: string
      file_path: string
      current_schema?: string
      current_fields: string[]
    }
    related_files: {
      schemas: string[]
      apis: string[]
      ui_components: string[]
      migrations: string[]
      tests: string[]
    }
    dependencies: {
      packages: string[]
      imports: string[]
    }
  }
  
  // AI建议
  suggestions: {
    field_suggestion?: FieldSuggestion
    implementation_steps: ImplementationStep[]
    potential_impacts: string[]
    estimated_effort_minutes: number
  }
  
  // 原始数据（兼容现有格式）
  raw_data?: {
    entities: unknown[]
    relationships: unknown[]
  }
}

/**
 * 增强的上下文查询工具
 */
export class EnhancedContextTool {
  private logger: Logger
  private baseContextTool: ContextQueryTool
  
  constructor() {
    this.logger = createLogger({ name: 'ai:enhanced-context-tool' })
    this.baseContextTool = new ContextQueryTool()
  }
  
  /**
   * 初始化工具
   */
  async initialize(): Promise<void> {
    await this.baseContextTool.initialize()
    this.logger.info('增强上下文工具已初始化')
  }
  
  /**
   * 查询增强上下文
   */
  async queryEnhancedContext(
    query: string,
    options: {
      include_suggestions?: boolean
      include_implementation_steps?: boolean
      format?: 'json' | 'text'
    } = {}
  ): Promise<EnhancedContextResponse> {
    const startTime = Date.now()
    this.logger.info('开始增强上下文查询', { query })
    
    try {
      // 1. 意图检测
      const queryAnalysis = this.detectIntent(query)
      
      // 2. 获取基础上下文
      const baseContext = await this.baseContextTool.queryContext(query)
      
      // 3. 分析实体定义
      const entityDefinition = this.analyzeEntityDefinition(
        queryAnalysis.target_entity,
        baseContext.entities
      )
      
      // 4. 收集相关文件
      const relatedFiles = this.collectRelatedFiles(baseContext.entities)
      
      // 5. 生成AI建议
      const suggestions = this.generateSuggestions(
        queryAnalysis,
        entityDefinition,
        options
      )
      
      const executionTime = Date.now() - startTime
      
      const response: EnhancedContextResponse = {
        success: true,
        query,
        timestamp: new Date().toISOString(),
        execution_time_ms: executionTime,
        query_analysis: queryAnalysis,
        context: {
          entity_definition: entityDefinition,
          related_files: relatedFiles,
          dependencies: this.extractDependencies(baseContext.entities)
        },
        suggestions,
        raw_data: {
          entities: baseContext.entities,
          relationships: baseContext.relationships
        }
      }
      
      this.logger.info('增强上下文查询完成', {
        action: response.query_analysis.detected_action,
        entity: response.query_analysis.target_entity,
        stepsCount: response.suggestions.implementation_steps.length,
        executionTime
      })
      
      return response
      
    } catch (error) {
      this.logger.error('增强上下文查询失败', error instanceof Error ? error : undefined)
      
      return {
        success: false,
        query,
        timestamp: new Date().toISOString(),
        execution_time_ms: Date.now() - startTime,
        query_analysis: {
          detected_action: DetectedAction.UNKNOWN,
          confidence: 0.1
        },
        context: {
          related_files: {
            schemas: [],
            apis: [],
            ui_components: [],
            migrations: [],
            tests: []
          },
          dependencies: { packages: [], imports: [] }
        },
        suggestions: {
          implementation_steps: [],
          potential_impacts: [],
          estimated_effort_minutes: 0
        }
      }
    }
  }
  
  /**
   * 检测用户意图 - 简单但有效的方法
   */
  private detectIntent(query: string): {
    detected_action: DetectedAction
    target_entity?: string
    field_name?: string
    confidence: number
  } {
    const patterns = [
      {
        action: DetectedAction.ADD_FIELD,
        patterns: [/给.*加.*字段/i, /给.*添加.*字段/i, /.*新增.*字段/i, /add.*field/i],
        confidence: 0.9
      },
      {
        action: DetectedAction.REMOVE_FIELD,
        patterns: [/删除.*字段/i, /移除.*字段/i, /remove.*field/i],
        confidence: 0.9
      },
      {
        action: DetectedAction.CREATE_API,
        patterns: [/创建.*API/i, /新建.*接口/i, /create.*api/i],
        confidence: 0.8
      },
      {
        action: DetectedAction.CREATE_UI,
        patterns: [/创建.*页面/i, /新建.*组件/i, /create.*component/i],
        confidence: 0.8
      }
    ]
    
    // 检测动作
    let detectedAction = DetectedAction.UNKNOWN
    let confidence = 0.1
    
    for (const pattern of patterns) {
      for (const regex of pattern.patterns) {
        if (regex.test(query)) {
          detectedAction = pattern.action
          confidence = pattern.confidence
          break
        }
      }
      if (detectedAction !== DetectedAction.UNKNOWN) break
    }
    
    // 提取实体名称
    const targetEntity = this.extractEntityName(query)
    
    // 提取字段名称
    const fieldName = this.extractFieldName(query)
    
    return {
      detected_action: detectedAction,
      target_entity: targetEntity,
      field_name: fieldName,
      confidence
    }
  }
  
  /**
   * 提取实体名称
   */
  private extractEntityName(query: string): string | undefined {
    // 常见实体模式
    const patterns = [
      /(?:给|为)\s*([A-Za-z][A-Za-z0-9]*|用户|user|产品|product)\s*(?:加|添加)/i,
      /(user|User|用户)/i,
      /(product|Product|产品)/i,
      /(order|Order|订单)/i
    ]
    
    for (const pattern of patterns) {
      const match = query.match(pattern)
      if (match) {
        let entity = match[1]
        // 标准化实体名称
        if (entity.includes('用户') || entity.toLowerCase() === 'user') {
          return 'User'
        }
        if (entity.includes('产品') || entity.toLowerCase() === 'product') {
          return 'Product'
        }
        if (entity.includes('订单') || entity.toLowerCase() === 'order') {
          return 'Order'
        }
        return entity.charAt(0).toUpperCase() + entity.slice(1)
      }
    }
    
    return undefined
  }
  
  /**
   * 提取字段名称
   */
  private extractFieldName(query: string): string | undefined {
    const fieldMappings = {
      '生日': 'birthday',
      '年龄': 'age', 
      '电话': 'phone',
      '邮箱': 'email',
      '地址': 'address',
      '头像': 'avatar',
      '描述': 'description'
    }
    
    for (const [chinese, english] of Object.entries(fieldMappings)) {
      if (query.includes(chinese)) {
        return english
      }
    }
    
    // 英文字段名匹配
    const englishMatch = query.match(/(?:add|添加)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:field|字段)/i)
    if (englishMatch) {
      return englishMatch[1]
    }
    
    return undefined
  }
  
  /**
   * 分析实体定义
   */
  private analyzeEntityDefinition(
    entityName?: string,
    entities: unknown[] = []
  ): {
    name: string
    type: string
    file_path: string
    current_schema?: string
    current_fields: string[]
  } | undefined {
    if (!entityName) return undefined
    
    // 从实体中找到目标实体
    const targetEntity = entities.find((entity: unknown) => {
      const e = entity as { name: string; type: string }
      return e.name?.toLowerCase().includes(entityName.toLowerCase())
    })
    
    if (!targetEntity) return undefined
    
    const entity = targetEntity as {
      name: string
      type: string
      path?: string
      description?: string
      exports?: string[]
    }
    
    return {
      name: entity.name,
      type: entity.type,
      file_path: entity.path || '',
      current_schema: entity.description,
      current_fields: entity.exports || []
    }
  }
  
  /**
   * 收集相关文件
   */
  private collectRelatedFiles(entities: unknown[]): {
    schemas: string[]
    apis: string[]
    ui_components: string[]
    migrations: string[]
    tests: string[]
  } {
    const files = {
      schemas: [] as string[],
      apis: [] as string[],
      ui_components: [] as string[],
      migrations: [] as string[],
      tests: [] as string[]
    }
    
    entities.forEach((entity: unknown) => {
      const e = entity as { path?: string; package?: string }
      if (!e.path) return
      
      if (e.path.includes('schema') || e.path.includes('types')) {
        files.schemas.push(e.path)
      } else if (e.path.includes('trpc') || e.path.includes('api')) {
        files.apis.push(e.path)
      } else if (e.path.includes('ui') || e.path.includes('components')) {
        files.ui_components.push(e.path)
      } else if (e.path.includes('test')) {
        files.tests.push(e.path)
      }
    })
    
    // 推断可能的迁移文件
    if (files.schemas.length > 0) {
      files.migrations.push('prisma/schema.prisma')
    }
    
    return files
  }
  
  /**
   * 提取依赖信息
   */
  private extractDependencies(entities: unknown[]): {
    packages: string[]
    imports: string[]
  } {
    const packages = new Set<string>()
    const imports = new Set<string>()
    
    entities.forEach((entity: unknown) => {
      const e = entity as { package?: string; name?: string; type?: string }
      if (e.package) {
        packages.add(e.package)
      }
      
      if (e.type === 'Import' && e.name) {
        imports.add(e.name)
      }
    })
    
    return {
      packages: Array.from(packages),
      imports: Array.from(imports)
    }
  }
  
  /**
   * 生成AI建议
   */
  private generateSuggestions(
    queryAnalysis: {
      detected_action: DetectedAction
      target_entity?: string
      field_name?: string
    },
    entityDefinition?: {
      name: string
      type: string
      file_path: string
      current_fields: string[]
    },
    options: {
      include_suggestions?: boolean
      include_implementation_steps?: boolean
    } = {}
  ): {
    field_suggestion?: FieldSuggestion
    implementation_steps: ImplementationStep[]
    potential_impacts: string[]
    estimated_effort_minutes: number
  } {
    const suggestions: {
      field_suggestion?: FieldSuggestion
      implementation_steps: ImplementationStep[]
      potential_impacts: string[]
      estimated_effort_minutes: number
    } = {
      implementation_steps: [] as ImplementationStep[],
      potential_impacts: [] as string[],
      estimated_effort_minutes: 30
    }
    
    // 生成字段建议
    if (queryAnalysis.detected_action === DetectedAction.ADD_FIELD && 
        queryAnalysis.field_name && 
        options.include_suggestions !== false) {
      suggestions.field_suggestion = this.generateFieldSuggestion(
        queryAnalysis.field_name,
        queryAnalysis.target_entity
      )
    }
    
    // 生成实现步骤
    if (options.include_implementation_steps !== false) {
      suggestions.implementation_steps = this.generateImplementationSteps(
        queryAnalysis,
        entityDefinition
      )
    }
    
    // 生成潜在影响
    suggestions.potential_impacts = this.generatePotentialImpacts(
      queryAnalysis,
      entityDefinition
    )
    
    return suggestions
  }
  
  /**
   * 生成字段建议
   */
  private generateFieldSuggestion(
    fieldName: string,
    _entityName?: string
  ): FieldSuggestion {
    // 根据字段名推断类型
    const typeMapping = {
      birthday: { type: 'Date', zod: 'z.date().optional()', prisma: 'DateTime?' },
      age: { type: 'number', zod: 'z.number().optional()', prisma: 'Int?' },
      email: { type: 'string', zod: 'z.string().email().optional()', prisma: 'String?' },
      phone: { type: 'string', zod: 'z.string().optional()', prisma: 'String?' },
      address: { type: 'string', zod: 'z.string().optional()', prisma: 'String?' },
      avatar: { type: 'string', zod: 'z.string().url().optional()', prisma: 'String?' },
      description: { type: 'string', zod: 'z.string().optional()', prisma: 'String?' }
    }
    
    const mapping = typeMapping[fieldName as keyof typeof typeMapping] || {
      type: 'string',
      zod: 'z.string().optional()',
      prisma: 'String?'
    }
    
    return {
      name: fieldName,
      type: mapping.type,
      nullable: true,
      zod_schema: mapping.zod,
      prisma_field: `${fieldName} ${mapping.prisma}`
    }
  }
  
  /**
   * 生成实现步骤
   */
  private generateImplementationSteps(
    queryAnalysis: {
      detected_action: DetectedAction
      target_entity?: string
      field_name?: string
    },
    entityDefinition?: {
      name: string
      file_path: string
    }
  ): ImplementationStep[] {
    const steps: ImplementationStep[] = []
    
    if (queryAnalysis.detected_action === DetectedAction.ADD_FIELD) {
      // Schema更新
      if (entityDefinition?.file_path) {
        steps.push({
          order: 1,
          action: 'edit_schema',
          file_path: entityDefinition.file_path,
          description: `在${entityDefinition.name}Schema中添加${queryAnalysis.field_name}字段`,
          code_suggestion: `${queryAnalysis.field_name}: z.date().optional(),`
        })
      }
      
      // 数据库迁移
      steps.push({
        order: 2,
        action: 'create_migration',
        file_path: 'prisma/schema.prisma',
        description: '创建Prisma数据库迁移',
        code_suggestion: `bunx prisma migrate dev --name add_${queryAnalysis.field_name}_to_${queryAnalysis.target_entity?.toLowerCase()}`
      })
      
      // API更新
      steps.push({
        order: 3,
        action: 'update_api',
        file_path: `packages/trpc/src/${queryAnalysis.target_entity?.toLowerCase()}.ts`,
        description: '更新tRPC API procedures支持新字段'
      })
      
      // UI更新
      steps.push({
        order: 4,
        action: 'update_ui',
        file_path: `packages/ui/src/forms/${entityDefinition?.name}Form.tsx`,
        description: `在${entityDefinition?.name}表单中添加${queryAnalysis.field_name}输入字段`
      })
      
      // 测试
      steps.push({
        order: 5,
        action: 'add_tests',
        file_path: `packages/schema/src/__tests__/${queryAnalysis.target_entity?.toLowerCase()}.test.ts`,
        description: '为新字段添加测试用例'
      })
    }
    
    return steps
  }
  
  /**
   * 生成潜在影响
   */
  private generatePotentialImpacts(
    queryAnalysis: {
      detected_action: DetectedAction
      target_entity?: string
    },
    entityDefinition?: {
      name: string
    }
  ): string[] {
    const impacts: string[] = []
    
    if (queryAnalysis.detected_action === DetectedAction.ADD_FIELD) {
      impacts.push('需要运行数据库迁移')
      impacts.push('现有API可能需要更新以处理新字段')
      impacts.push('前端表单和显示组件需要更新')
      impacts.push('可能需要更新相关的TypeScript类型定义')
      
      if (entityDefinition?.name === 'User') {
        impacts.push('用户相关的认证和会话管理可能受影响')
      }
    }
    
    return impacts
  }
}