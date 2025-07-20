/**
 * LinchKit AI Prompt模板引擎
 * 支持结构化Prompt、上下文注入和模板化生成
 * 
 * @version 1.0.0 - Phase 1 AI工作流集成
 */

import { createLogger } from '@linch-kit/core'

const logger = createLogger('prompt-template-engine')

export interface PromptTemplate {
  id: string
  name: string
  description: string
  template: string
  variables: PromptVariable[]
  schema?: PromptSchema
  category: PromptCategory
  version: string
}

export interface PromptVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  description: string
  defaultValue?: unknown
  validation?: VariableValidation
}

export interface VariableValidation {
  minLength?: number
  maxLength?: number
  pattern?: string
  enum?: string[]
}

export interface PromptSchema {
  input: Record<string, unknown>
  output: {
    format: 'json' | 'yaml' | 'markdown' | 'text'
    structure?: Record<string, unknown>
  }
}

export type PromptCategory = 
  | 'code-analysis' 
  | 'architecture-review' 
  | 'documentation' 
  | 'testing' 
  | 'workflow-decision'
  | 'graph-rag-query'

export interface TemplateContext {
  project: {
    name: string
    version: string
    type: string
    constraints?: string[]
  }
  session: {
    id: string
    timestamp: string
    task_description: string
  }
  codebase: {
    packages?: string[]
    current_branch?: string
    recent_commits?: string[]
  }
  variables: Record<string, unknown>
}

export interface PromptGenerationResult {
  prompt: string
  metadata: {
    template_id: string
    variables_used: string[]
    context_injected: boolean
    validation_passed: boolean
  }
  success: boolean
  error?: string
}

/**
 * AI Prompt模板引擎
 * 负责管理和生成结构化的AI Prompts
 */
export class PromptTemplateEngine {
  private templates: Map<string, PromptTemplate> = new Map()

  constructor() {
    this.loadDefaultTemplates()
  }

  /**
   * 注册新的Prompt模板
   */
  registerTemplate(template: PromptTemplate): void {
    this.validateTemplate(template)
    this.templates.set(template.id, template)
    logger.info(`Registered prompt template: ${template.id}`)
  }

  /**
   * 生成Prompt
   */
  generatePrompt(
    templateId: string, 
    context: TemplateContext
  ): PromptGenerationResult {
    const template = this.templates.get(templateId)
    
    if (!template) {
      return {
        prompt: '',
        metadata: {
          template_id: templateId,
          variables_used: [],
          context_injected: false,
          validation_passed: false
        },
        success: false,
        error: `Template ${templateId} not found`
      }
    }

    try {
      // 验证必需变量
      const validationResult = this.validateVariables(template, context.variables)
      if (!validationResult.valid) {
        return {
          prompt: '',
          metadata: {
            template_id: templateId,
            variables_used: [],
            context_injected: false,
            validation_passed: false
          },
          success: false,
          error: `Variable validation failed: ${validationResult.errors.join(', ')}`
        }
      }

      // 注入上下文和变量
      const prompt = this.interpolateTemplate(template.template, {
        ...context.variables,
        project: context.project,
        session: context.session,
        codebase: context.codebase
      })

      const variablesUsed = this.extractUsedVariables(template.template)

      return {
        prompt,
        metadata: {
          template_id: templateId,
          variables_used: variablesUsed,
          context_injected: true,
          validation_passed: true
        },
        success: true
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      return {
        prompt: '',
        metadata: {
          template_id: templateId,
          variables_used: [],
          context_injected: false,
          validation_passed: false
        },
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * 获取指定分类的模板
   */
  getTemplatesByCategory(category: PromptCategory): PromptTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.category === category)
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * 验证模板结构
   */
  private validateTemplate(template: PromptTemplate): void {
    if (!template.id || !template.template) {
      throw new Error('Template must have id and template content')
    }

    // 检查模板变量是否在template中使用
    const usedVariables = this.extractUsedVariables(template.template)
    const definedVariables = template.variables.map(v => v.name)
    
    for (const usedVar of usedVariables) {
      if (!definedVariables.includes(usedVar) && !this.isBuiltinVariable(usedVar)) {
        logger.warn(`Template ${template.id} uses undefined variable: ${usedVar}`)
      }
    }
  }

  /**
   * 验证变量值
   */
  private validateVariables(
    template: PromptTemplate, 
    variables: Record<string, unknown>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    for (const varDef of template.variables) {
      const value = variables[varDef.name]

      // 检查必需变量
      if (varDef.required && (value === undefined || value === null)) {
        errors.push(`Required variable '${varDef.name}' is missing`)
        continue
      }

      // 如果变量不存在且不是必需的，跳过验证
      if (value === undefined || value === null) {
        continue
      }

      // 类型验证
      if (!this.validateVariableType(value, varDef.type)) {
        errors.push(`Variable '${varDef.name}' has invalid type, expected ${varDef.type}`)
      }

      // 额外验证
      if (varDef.validation) {
        const validationErrors = this.validateVariableConstraints(
          varDef.name, 
          value, 
          varDef.validation
        )
        errors.push(...validationErrors)
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * 验证变量类型
   */
  private validateVariableType(value: unknown, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number'
      case 'boolean':
        return typeof value === 'boolean'
      case 'array':
        return Array.isArray(value)
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value)
      default:
        return false
    }
  }

  /**
   * 验证变量约束
   */
  private validateVariableConstraints(
    name: string,
    value: unknown,
    validation: VariableValidation
  ): string[] {
    const errors: string[] = []

    if (typeof value === 'string') {
      if (validation.minLength && value.length < validation.minLength) {
        errors.push(`Variable '${name}' is too short (min: ${validation.minLength})`)
      }
      if (validation.maxLength && value.length > validation.maxLength) {
        errors.push(`Variable '${name}' is too long (max: ${validation.maxLength})`)
      }
      if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
        errors.push(`Variable '${name}' doesn't match pattern: ${validation.pattern}`)
      }
    }

    if (validation.enum && !validation.enum.includes(String(value))) {
      errors.push(`Variable '${name}' must be one of: ${validation.enum.join(', ')}`)
    }

    return errors
  }

  /**
   * 模板插值（带安全防护）
   */
  private interpolateTemplate(template: string, variables: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, varPath) => {
      // 安全检查：防止路径遍历和原型污染
      if (!this.isValidVariablePath(varPath)) {
        logger.warn(`Potentially unsafe variable path blocked: ${varPath}`)
        return match
      }
      
      const value = this.getNestedValue(variables, varPath)
      
      if (value !== undefined) {
        // 安全化变量值，防止模板注入
        const sanitizedValue = this.sanitizeVariableValue(value)
        return String(sanitizedValue)
      }
      
      return match
    })
  }

  /**
   * 验证变量路径是否安全
   */
  private isValidVariablePath(path: string): boolean {
    // 防止原型污染和路径遍历攻击
    const dangerousPatterns = [
      '__proto__',
      'constructor',
      'prototype',
      '..',
      '//',
      'eval',
      'function'
    ]
    
    const lowerPath = path.toLowerCase()
    return !dangerousPatterns.some(pattern => lowerPath.includes(pattern))
  }

  /**
   * 安全化变量值
   */
  private sanitizeVariableValue(value: unknown): unknown {
    if (typeof value === 'string') {
      // 移除潜在的脚本标签和危险字符
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim()
    }
    
    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeVariableValue(item))
    }
    
    if (typeof value === 'object' && value !== null) {
      const sanitized: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(value)) {
        if (this.isValidVariablePath(key)) {
          sanitized[key] = this.sanitizeVariableValue(val)
        }
      }
      return sanitized
    }
    
    return value
  }

  /**
   * 获取嵌套对象值
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' 
        ? (current as Record<string, unknown>)[key]
        : undefined
    }, obj)
  }

  /**
   * 提取模板中使用的变量
   */
  private extractUsedVariables(template: string): string[] {
    const matches = template.match(/\{\{(\w+(?:\.\w+)*)\}\}/g) || []
    return matches.map(match => match.replace(/\{\{|\}\}/g, ''))
  }

  /**
   * 检查是否是内置变量
   */
  private isBuiltinVariable(varName: string): boolean {
    const builtinPrefixes = ['project.', 'session.', 'codebase.']
    return builtinPrefixes.some(prefix => varName.startsWith(prefix))
  }

  /**
   * 加载默认模板
   */
  private loadDefaultTemplates(): void {
    // AI工作流决策模板
    this.registerTemplate({
      id: 'workflow-decision',
      name: 'AI工作流决策分析',
      description: '分析开发任务并提供工作流决策建议',
      category: 'workflow-decision',
      version: '1.0.0',
      template: `分析任务: {{task_description}}

请简洁分析并返回JSON格式：
{
  "complexity_level": 1-5,
  "estimated_effort_hours": number,
  "risks": ["风险1", "风险2"],
  "dependencies": ["组件1", "组件2"],
  "workflow_steps": ["步骤1", "步骤2"],
  "acceptance_criteria": ["标准1", "标准2"]
}`,
      variables: [
        {
          name: 'task_description',
          type: 'string',
          required: true,
          description: '具体的开发任务描述',
          validation: { minLength: 5, maxLength: 1000 }
        }
      ],
      schema: {
        input: { task_description: 'string' },
        output: {
          format: 'json',
          structure: {
            complexity_level: 'number',
            estimated_effort_hours: 'number',
            risks: 'array',
            dependencies: 'array',
            workflow_steps: 'array',
            acceptance_criteria: 'array'
          }
        }
      }
    })

    // 代码架构分析模板
    this.registerTemplate({
      id: 'architecture-analysis',
      name: '代码架构分析',
      description: '分析代码架构并提供改进建议',
      category: 'architecture-review',
      version: '1.0.0',
      template: `分析代码: {{analysis_scope}}

代码:
{{code_content}}

关注: {{focus_areas}}

请简洁分析设计模式、SOLID原则、依赖管理、扩展性、维护性，并提供改进建议。`,
      variables: [
        {
          name: 'analysis_scope',
          type: 'string',
          required: true,
          description: '分析范围描述'
        },
        {
          name: 'focus_areas',
          type: 'array',
          required: false,
          description: '特别关注的架构方面'
        },
        {
          name: 'code_content',
          type: 'string',
          required: true,
          description: '需要分析的代码内容',
          validation: { minLength: 50 }
        }
      ]
    })

    logger.info(`Loaded ${this.templates.size} default prompt templates`)
  }
}

// 工厂函数
export function createPromptTemplateEngine(): PromptTemplateEngine {
  return new PromptTemplateEngine()
}