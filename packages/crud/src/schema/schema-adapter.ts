/**
 * CRUD Schema 适配器
 */

import type {
  SchemaIntegration,
  FieldConfig,
  RelationConfig,
  ListViewConfig,
  FormViewConfig,
  DetailViewConfig
} from '../types'

/**
 * CRUD Schema 适配器实现
 */
export class CRUDSchemaAdapter {
  constructor(private schema: SchemaIntegration) {}

  /**
   * 获取字段定义
   */
  getFields(): FieldConfig[] {
    return this.schema.fields || []
  }

  /**
   * 获取关联定义
   */
  getRelations(): RelationConfig[] {
    return this.schema.relations || []
  }

  /**
   * 获取验证规则
   */
  getValidationRules(): any {
    // 临时实现，返回空对象
    return {}
  }

  /**
   * 获取 UI 配置
   */
  getUIConfig(): any {
    return this.schema.ui || {}
  }

  /**
   * 自动生成列表配置
   */
  generateListConfig(): ListViewConfig {
    const fields = this.getFields()
    const listFields = fields
      .filter(field => field.display?.list !== false)
      .map(field => String(field.name))
      .slice(0, 5) // 默认显示前5个字段

    return {
      columns: listFields,
      pageSize: 10,
      actions: [
        { name: 'edit', label: 'Edit', icon: 'edit', type: 'button', variant: 'primary', handler: () => {} },
        { name: 'delete', label: 'Delete', icon: 'delete', type: 'button', variant: 'danger', handler: () => {} }
      ],
      layout: 'table'
    }
  }

  /**
   * 自动生成表单配置
   */
  generateFormConfig(): FormViewConfig {
    const fields = this.getFields()
    const formFields = fields
      .filter(field => field.display?.form !== false && !field.readonly)
      .map(field => String(field.name))

    return {
      fields: formFields,
      layout: 'vertical',
      validation: 'realtime'
    }
  }

  /**
   * 自动生成详情配置
   */
  generateDetailConfig(): DetailViewConfig {
    const fields = this.getFields()
    const detailFields = fields
      .filter(field => field.display?.detail !== false)
      .map(field => String(field.name))

    return {
      fields: detailFields,
      layout: 'vertical',
      actions: [
        { name: 'edit', label: 'Edit', icon: 'edit', type: 'button', variant: 'primary', handler: () => {} },
        { name: 'delete', label: 'Delete', icon: 'delete', type: 'button', variant: 'danger', handler: () => {} }
      ]
    }
  }

  /**
   * 根据字段类型生成默认配置
   */
  private getFieldDefaultConfig(field: FieldConfig): Partial<FieldConfig> {
    const defaults: Partial<FieldConfig> = {
      display: {
        list: true,
        detail: true,
        form: true,
        filter: true,
        sort: true
      }
    }

    // 根据字段类型调整默认配置
    switch (field.type) {
      case 'string':
        defaults.validation = {
          maxLength: 255
        }
        break
      case 'number':
        defaults.validation = {
          min: 0
        }
        break
      case 'email':
        defaults.validation = {
          pattern: '^[^@]+@[^@]+\\.[^@]+$'
        }
        break
      case 'date':
      case 'datetime':
        defaults.format = {
          dateFormat: field.type === 'date' ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm:ss'
        }
        break
    }

    return defaults
  }

  /**
   * 获取字段的完整配置（包含默认值）
   */
  getFieldConfig(fieldName: string): FieldConfig | null {
    const field = this.getFields().find(f => f.name === fieldName)
    if (!field) {
      return null
    }

    const defaults = this.getFieldDefaultConfig(field)
    return { ...defaults, ...field }
  }

  /**
   * 获取所有字段的完整配置
   */
  getAllFieldConfigs(): FieldConfig[] {
    return this.getFields().map(field => {
      const defaults = this.getFieldDefaultConfig(field)
      return { ...defaults, ...field }
    })
  }

  /**
   * 检查字段是否可见
   */
  isFieldVisible(fieldName: string, context: 'list' | 'detail' | 'form'): boolean {
    const field = this.getFieldConfig(fieldName)
    if (!field) {
      return false
    }

    return field.display?.[context] !== false
  }

  /**
   * 检查字段是否可编辑
   */
  isFieldEditable(fieldName: string): boolean {
    const field = this.getFieldConfig(fieldName)
    if (!field) {
      return false
    }

    return !field.readonly && field.display?.form !== false
  }

  /**
   * 获取字段的验证规则
   */
  getFieldValidation(fieldName: string): any {
    const field = this.getFieldConfig(fieldName)
    return field?.validation || {}
  }

  /**
   * 获取字段的格式化配置
   */
  getFieldFormat(fieldName: string): any {
    const field = this.getFieldConfig(fieldName)
    return field?.format || {}
  }
}
