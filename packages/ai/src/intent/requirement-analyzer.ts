/**
 * 需求分析器 - 将自然语言转换为结构化的开发需求
 * 
 * 这个模块专门为Claude Code设计，用于理解用户的开发意图
 */

import { createLogger } from '@linch-kit/core/server'
import type { Logger } from '../types/index.js'

/**
 * 开发意图类型
 */
export enum DevelopmentIntent {
  ADD_FIELD = 'add_field',           // 添加字段
  REMOVE_FIELD = 'remove_field',     // 删除字段  
  MODIFY_FIELD = 'modify_field',     // 修改字段
  ADD_ENTITY = 'add_entity',         // 添加实体
  ADD_RELATION = 'add_relation',     // 添加关系
  CREATE_API = 'create_api',         // 创建API
  CREATE_UI = 'create_ui',           // 创建UI
  ADD_VALIDATION = 'add_validation', // 添加验证
  REFACTOR = 'refactor',             // 重构
  DEBUG = 'debug',                   // 调试
  OPTIMIZE = 'optimize',             // 优化
  UNKNOWN = 'unknown'                // 未知意图
}

/**
 * 字段类型枚举
 */
export enum FieldType {
  STRING = 'string',
  NUMBER = 'number', 
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  EMAIL = 'email',
  URL = 'url',
  JSON = 'json',
  ARRAY = 'array',
  ENUM = 'enum',
  REFERENCE = 'reference'
}

/**
 * 字段需求定义
 */
export interface FieldRequirement {
  name: string
  type: FieldType
  nullable: boolean
  default_value?: unknown
  validation?: string[]
  description?: string
}

/**
 * 结构化开发需求
 */
export interface DevelopmentRequirement {
  // 基本信息
  intent: DevelopmentIntent
  confidence: number
  description: string
  
  // 实体和字段信息
  target_entity?: string
  field?: FieldRequirement
  
  // 影响范围
  scope: DevelopmentScope[]
  
  // 复杂度评估
  complexity: 'simple' | 'medium' | 'complex'
  estimated_effort_minutes: number
  
  // 元数据
  parsed_at: string
  raw_input: string
}

/**
 * 开发范围
 */
export enum DevelopmentScope {
  SCHEMA = 'schema',         // Schema定义
  DATABASE = 'database',     // 数据库迁移
  API = 'api',              // API层
  UI = 'ui',                // UI组件
  VALIDATION = 'validation', // 数据验证
  TESTS = 'tests'           // 测试用例
}

/**
 * 意图识别模式
 */
interface IntentPattern {
  intent: DevelopmentIntent
  patterns: RegExp[]
  confidence_base: number
  scope_hints: DevelopmentScope[]
}

/**
 * 需求分析器
 */
export class RequirementAnalyzer {
  private logger: Logger
  private intentPatterns: IntentPattern[]
  
  constructor() {
    this.logger = createLogger({ name: 'ai:requirement-analyzer' })
    this.initializeIntentPatterns()
  }
  
  /**
   * 分析用户需求
   */
  async analyzeRequirement(userInput: string): Promise<DevelopmentRequirement> {
    this.logger.info('开始分析用户需求', { userInput })
    
    try {
      // 1. 识别开发意图
      const intent = this.recognizeIntent(userInput)
      
      // 2. 提取实体信息
      const entity = this.extractTargetEntity(userInput)
      
      // 3. 分析字段需求（如果适用）
      const field = this.extractFieldRequirement(userInput, intent)
      
      // 4. 确定影响范围
      const scope = this.determineScope(intent, userInput)
      
      // 5. 评估复杂度
      const complexity = this.assessComplexity(intent, scope, field)
      
      // 6. 估算工作量
      const estimatedEffort = this.estimateEffort(complexity, scope)
      
      // 7. 计算置信度
      const confidence = this.calculateConfidence(intent, entity, field, userInput)
      
      const requirement: DevelopmentRequirement = {
        intent: intent.intent,
        confidence,
        description: this.generateDescription(intent.intent, entity, field),
        target_entity: entity,
        field,
        scope,
        complexity,
        estimated_effort_minutes: estimatedEffort,
        parsed_at: new Date().toISOString(),
        raw_input: userInput
      }
      
      this.logger.info('需求分析完成', {
        intent: requirement.intent,
        confidence: requirement.confidence,
        entity: requirement.target_entity,
        scope: requirement.scope,
        complexity: requirement.complexity
      })
      
      return requirement
      
    } catch (error) {
      this.logger.error('需求分析失败', error instanceof Error ? error : undefined)
      
      // 返回一个低置信度的未知意图
      return {
        intent: DevelopmentIntent.UNKNOWN,
        confidence: 0.1,
        description: '无法理解的需求',
        scope: [],
        complexity: 'simple',
        estimated_effort_minutes: 0,
        parsed_at: new Date().toISOString(),
        raw_input: userInput
      }
    }
  }
  
  /**
   * 初始化意图识别模式
   */
  private initializeIntentPatterns(): void {
    this.intentPatterns = [
      {
        intent: DevelopmentIntent.ADD_FIELD,
        patterns: [
          /给.*加.*字段/i,
          /给.*添加.*字段/i,
          /.*新增.*字段/i,
          /.*增加.*属性/i,
          /add.*field/i,
          /create.*field/i,
          /.*需要.*字段/i,
          /为.*添加/i
        ],
        confidence_base: 0.9,
        scope_hints: [DevelopmentScope.SCHEMA, DevelopmentScope.DATABASE, DevelopmentScope.API, DevelopmentScope.UI]
      },
      {
        intent: DevelopmentIntent.REMOVE_FIELD,
        patterns: [
          /删除.*字段/i,
          /移除.*字段/i,
          /去掉.*属性/i,
          /remove.*field/i,
          /delete.*field/i
        ],
        confidence_base: 0.9,
        scope_hints: [DevelopmentScope.SCHEMA, DevelopmentScope.DATABASE, DevelopmentScope.API, DevelopmentScope.UI]
      },
      {
        intent: DevelopmentIntent.CREATE_API,
        patterns: [
          /创建.*API/i,
          /新建.*接口/i,
          /add.*endpoint/i,
          /create.*route/i,
          /.*需要.*API/i
        ],
        confidence_base: 0.8,
        scope_hints: [DevelopmentScope.API, DevelopmentScope.VALIDATION, DevelopmentScope.TESTS]
      },
      {
        intent: DevelopmentIntent.CREATE_UI,
        patterns: [
          /创建.*页面/i,
          /新建.*组件/i,
          /做.*界面/i,
          /create.*component/i,
          /build.*ui/i,
          /.*前端/i
        ],
        confidence_base: 0.8,
        scope_hints: [DevelopmentScope.UI, DevelopmentScope.API]
      },
      {
        intent: DevelopmentIntent.ADD_VALIDATION,
        patterns: [
          /添加.*验证/i,
          /.*校验/i,
          /add.*validation/i,
          /validate.*input/i
        ],
        confidence_base: 0.7,
        scope_hints: [DevelopmentScope.VALIDATION, DevelopmentScope.SCHEMA]
      }
    ]
  }
  
  /**
   * 识别开发意图
   */
  private recognizeIntent(userInput: string): { intent: DevelopmentIntent; confidence: number } {
    let bestMatch = {
      intent: DevelopmentIntent.UNKNOWN,
      confidence: 0.1
    }
    
    for (const pattern of this.intentPatterns) {
      for (const regex of pattern.patterns) {
        if (regex.test(userInput)) {
          const confidence = pattern.confidence_base
          if (confidence > bestMatch.confidence) {
            bestMatch = {
              intent: pattern.intent,
              confidence
            }
          }
        }
      }
    }
    
    return bestMatch
  }
  
  /**
   * 提取目标实体
   */
  private extractTargetEntity(userInput: string): string | undefined {
    // 常见实体名称模式
    const entityPatterns = [
      /(?:给|为|对)\s*([A-Za-z][A-Za-z0-9]*)\s*(?:加|添加|创建)/i,
      /([A-Za-z][A-Za-z0-9]*)\s*(?:表|实体|模型)/i,
      /(?:user|用户|User)/i,
      /(?:product|产品|Product)/i,
      /(?:order|订单|Order)/i,
      /(?:company|公司|Company)/i
    ]
    
    for (const pattern of entityPatterns) {
      const match = userInput.match(pattern)
      if (match) {
        const entity = match[1] || match[0]
        // 标准化实体名称
        return this.normalizeEntityName(entity)
      }
    }
    
    return undefined
  }
  
  /**
   * 提取字段需求
   */
  private extractFieldRequirement(userInput: string, intent: { intent: DevelopmentIntent }): FieldRequirement | undefined {
    if (intent.intent !== DevelopmentIntent.ADD_FIELD) {
      return undefined
    }
    
    // 提取字段名
    const fieldName = this.extractFieldName(userInput)
    if (!fieldName) return undefined
    
    // 推断字段类型
    const fieldType = this.inferFieldType(userInput, fieldName)
    
    // 判断是否可为空
    const nullable = this.inferNullable(userInput)
    
    // 提取验证规则
    const validation = this.extractValidation(userInput, fieldType)
    
    return {
      name: fieldName,
      type: fieldType,
      nullable,
      validation,
      description: `${fieldName}字段`
    }
  }
  
  /**
   * 提取字段名
   */
  private extractFieldName(userInput: string): string | undefined {
    const fieldPatterns = [
      /(?:加|添加|创建)\s*(?:一个|个)?\s*([a-zA-Z\u4e00-\u9fa5]+)\s*字段/i,
      /([a-zA-Z\u4e00-\u9fa5]+)\s*(?:字段|属性|信息)/i,
      /(?:生日|birthday)/i,
      /(?:年龄|age)/i,
      /(?:电话|phone)/i,
      /(?:地址|address)/i,
      /(?:头像|avatar)/i,
      /(?:描述|description)/i
    ]
    
    for (const pattern of fieldPatterns) {
      const match = userInput.match(pattern)
      if (match) {
        let fieldName = match[1] || match[0]
        return this.normalizeFieldName(fieldName)
      }
    }
    
    return undefined
  }
  
  /**
   * 推断字段类型
   */
  private inferFieldType(userInput: string, fieldName: string): FieldType {
    const typeHints = [
      { patterns: [/生日|birthday|出生日期/i], type: FieldType.DATE },
      { patterns: [/年龄|age/i], type: FieldType.NUMBER },
      { patterns: [/邮箱|email/i], type: FieldType.EMAIL },
      { patterns: [/网址|url|链接/i], type: FieldType.URL },
      { patterns: [/电话|phone|手机/i], type: FieldType.STRING },
      { patterns: [/地址|address/i], type: FieldType.STRING },
      { patterns: [/描述|description|备注/i], type: FieldType.STRING },
      { patterns: [/数量|count|num/i], type: FieldType.NUMBER },
      { patterns: [/状态|status|是否/i], type: FieldType.BOOLEAN },
      { patterns: [/时间|time|创建时间|更新时间/i], type: FieldType.DATETIME },
      { patterns: [/数组|list|列表/i], type: FieldType.ARRAY }
    ]
    
    const fullText = `${userInput} ${fieldName}`
    
    for (const hint of typeHints) {
      for (const pattern of hint.patterns) {
        if (pattern.test(fullText)) {
          return hint.type
        }
      }
    }
    
    // 默认返回字符串类型
    return FieldType.STRING
  }
  
  /**
   * 推断字段是否可为空
   */
  private inferNullable(userInput: string): boolean {
    const requiredPatterns = [/必须|必填|required|不能为空/i]
    const optionalPatterns = [/可选|optional|可以为空|可为空/i]
    
    if (requiredPatterns.some(p => p.test(userInput))) {
      return false
    }
    
    if (optionalPatterns.some(p => p.test(userInput))) {
      return true
    }
    
    // 默认为可选
    return true
  }
  
  /**
   * 提取验证规则
   */
  private extractValidation(userInput: string, fieldType: FieldType): string[] {
    const validations: string[] = []
    
    // 基于字段类型的默认验证
    switch (fieldType) {
      case FieldType.EMAIL:
        validations.push('email_format')
        break
      case FieldType.URL:
        validations.push('url_format')
        break
      case FieldType.DATE:
        validations.push('date_format')
        break
      case FieldType.NUMBER:
        validations.push('numeric')
        break
    }
    
    // 从用户输入中提取额外验证规则
    if (/最大.*长度|max.*length/i.test(userInput)) {
      validations.push('max_length')
    }
    
    if (/最小.*长度|min.*length/i.test(userInput)) {
      validations.push('min_length')
    }
    
    if (/唯一|unique/i.test(userInput)) {
      validations.push('unique')
    }
    
    return validations
  }
  
  /**
   * 确定开发范围
   */
  private determineScope(intent: { intent: DevelopmentIntent }, userInput: string): DevelopmentScope[] {
    const pattern = this.intentPatterns.find(p => p.intent === intent.intent)
    let scopes = [...(pattern?.scope_hints || [])]
    
    // 基于用户输入调整范围
    if (/数据库|database/i.test(userInput)) {
      scopes.push(DevelopmentScope.DATABASE)
    }
    
    if (/测试|test/i.test(userInput)) {
      scopes.push(DevelopmentScope.TESTS)
    }
    
    if (/前端|UI|界面/i.test(userInput)) {
      scopes.push(DevelopmentScope.UI)
    }
    
    if (/API|接口/i.test(userInput)) {
      scopes.push(DevelopmentScope.API)
    }
    
    // 去重
    return [...new Set(scopes)]
  }
  
  /**
   * 评估复杂度
   */
  private assessComplexity(
    intent: DevelopmentIntent,
    scope: DevelopmentScope[],
    field?: FieldRequirement
  ): 'simple' | 'medium' | 'complex' {
    let complexityScore = 0
    
    // 基于意图的基础复杂度
    const intentComplexity = {
      [DevelopmentIntent.ADD_FIELD]: 1,
      [DevelopmentIntent.REMOVE_FIELD]: 1,
      [DevelopmentIntent.MODIFY_FIELD]: 2,
      [DevelopmentIntent.ADD_ENTITY]: 3,
      [DevelopmentIntent.CREATE_API]: 2,
      [DevelopmentIntent.CREATE_UI]: 3,
      [DevelopmentIntent.REFACTOR]: 4
    }
    
    complexityScore += intentComplexity[intent] || 2
    
    // 基于影响范围的复杂度
    complexityScore += scope.length * 0.5
    
    // 基于字段复杂度
    if (field) {
      if (field.validation && field.validation.length > 2) {
        complexityScore += 1
      }
      if (field.type === FieldType.REFERENCE || field.type === FieldType.ARRAY) {
        complexityScore += 1
      }
    }
    
    // 转换为分类
    if (complexityScore <= 2) return 'simple'
    if (complexityScore <= 4) return 'medium'
    return 'complex'
  }
  
  /**
   * 估算工作量
   */
  private estimateEffort(complexity: string, scope: DevelopmentScope[]): number {
    const baseMinutes = {
      simple: 15,
      medium: 45,
      complex: 120
    }
    
    let minutes = baseMinutes[complexity as keyof typeof baseMinutes] || 30
    
    // 每个额外的scope增加时间
    minutes += (scope.length - 1) * 10
    
    return minutes
  }
  
  /**
   * 计算置信度
   */
  private calculateConfidence(
    intent: { confidence: number },
    entity?: string,
    field?: FieldRequirement,
    userInput?: string
  ): number {
    let confidence = intent.confidence
    
    // 有明确实体增加置信度
    if (entity) {
      confidence = Math.min(1.0, confidence + 0.1)
    }
    
    // 有明确字段信息增加置信度
    if (field) {
      confidence = Math.min(1.0, confidence + 0.1)
    }
    
    // 输入越长越详细，置信度可能越高
    if (userInput && userInput.length > 20) {
      confidence = Math.min(1.0, confidence + 0.05)
    }
    
    return confidence
  }
  
  /**
   * 生成需求描述
   */
  private generateDescription(
    intent: DevelopmentIntent,
    entity?: string,
    field?: FieldRequirement
  ): string {
    const intentDescriptions = {
      [DevelopmentIntent.ADD_FIELD]: `为${entity || '实体'}添加${field?.name || '新'}字段`,
      [DevelopmentIntent.REMOVE_FIELD]: `从${entity || '实体'}删除${field?.name || '指定'}字段`,
      [DevelopmentIntent.CREATE_API]: `为${entity || '实体'}创建API接口`,
      [DevelopmentIntent.CREATE_UI]: `为${entity || '实体'}创建UI组件`
    }
    
    return intentDescriptions[intent] || '未知开发需求'
  }
  
  /**
   * 标准化实体名称
   */
  private normalizeEntityName(entityName: string): string {
    // 移除常见的中文词汇
    entityName = entityName.replace(/表|实体|模型|用户|产品/g, '')
    
    // 转换为 PascalCase
    if (entityName.toLowerCase() === 'user' || entityName.includes('用户')) {
      return 'User'
    }
    if (entityName.toLowerCase() === 'product' || entityName.includes('产品')) {
      return 'Product'
    }
    if (entityName.toLowerCase() === 'order' || entityName.includes('订单')) {
      return 'Order'
    }
    
    // 首字母大写
    return entityName.charAt(0).toUpperCase() + entityName.slice(1)
  }
  
  /**
   * 标准化字段名称
   */
  private normalizeFieldName(fieldName: string): string {
    // 中文到英文的映射
    const chineseToEnglish = {
      '生日': 'birthday',
      '年龄': 'age',
      '电话': 'phone',
      '手机': 'mobile',
      '邮箱': 'email',
      '地址': 'address',
      '头像': 'avatar',
      '描述': 'description',
      '备注': 'note',
      '状态': 'status',
      '名称': 'name',
      '标题': 'title'
    }
    
    // 检查是否有中文映射
    for (const [chinese, english] of Object.entries(chineseToEnglish)) {
      if (fieldName.includes(chinese)) {
        return english
      }
    }
    
    // 转换为 camelCase
    return fieldName.charAt(0).toLowerCase() + fieldName.slice(1)
  }
}