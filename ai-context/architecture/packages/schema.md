# @linch-kit/schema 包详细规划

**包版本**: v1.0.0
**创建日期**: 2025-06-23
**开发优先级**: P0 - 最高
**预估工期**: 4-5天
**依赖**: @linch-kit/core
**参考实现**: 现有代码库 packages/schema/ (已发布 v0.2.1)

---

## 📋 模块概览

### 功能定位
@linch-kit/schema 是 LinchKit 生态系统的数据模式定义和代码生成核心，作为 Schema 驱动架构的核心实现，它是整个系统的数据源头。提供统一的实体定义、类型推导、验证器生成和代码生成功能，确保从数据模式到应用代码的一致性和类型安全。

### 在 LinchKit 生态系统中的角色定位
- **数据源头**: 作为所有数据结构定义的单一来源
- **类型生成器**: 为其他包提供 TypeScript 类型定义
- **代码生成中心**: 自动生成 Prisma Schema、验证器、Mock 数据等
- **开发工具**: 提供 CLI 命令和开发时工具支持
- **插件平台**: 为代码生成提供可扩展的插件机制

### 职责边界
- ✅ **Schema 定义**: defineField、defineEntity 统一接口
- ✅ **类型推导**: 基于 Zod 的 TypeScript 类型生成
- ✅ **代码生成**: Prisma Schema、验证器、Mock 数据生成
- ✅ **装饰器系统**: primary、unique、timestamps、softDelete 等
- ✅ **CLI 集成**: schema 相关命令和插件
- ✅ **插件支持**: 提供插件埋点和扩展机制
- ❌ **数据操作**: 不直接操作数据库
- ❌ **业务逻辑**: 不包含具体业务规则

### 技术特色
- **Schema 驱动**: 以 Zod Schema 为单一数据源，确保数据一致性
- **类型安全**: 端到端 TypeScript 类型推导，编译时错误检查
- **代码生成**: 自动生成各种代码和配置，减少手工维护
- **性能优化**: 避免复杂类型推导，DTS 构建 < 10秒
- **AI 友好**: 结构化定义便于 AI 理解和生成
- **可扩展**: 插件化的代码生成器，支持自定义扩展

---

## 🔌 API 设计

### 公共接口

#### 字段定义 API
```typescript
/**
 * 字段定义工厂函数
 * @description 提供类型安全的字段定义接口
 * @since v1.0.0
 */
export const defineField = {
  /**
   * 字符串字段
   * @param options - 字符串字段选项
   * @returns Zod 字符串 Schema
   * @example
   * ```typescript
   * const nameField = defineField.string({
   *   min: 2,
   *   max: 50,
   *   description: '用户姓名'
   * })
   * ```
   */
  string: (options?: StringFieldOptions) => ZodString,

  /**
   * 数字字段
   * @param options - 数字字段选项
   * @returns Zod 数字 Schema
   * @example
   * ```typescript
   * const ageField = defineField.number({
   *   min: 0,
   *   max: 120,
   *   int: true
   * })
   * ```
   */
  number: (options?: NumberFieldOptions) => ZodNumber,

  /**
   * 布尔字段
   * @param options - 布尔字段选项
   * @returns Zod 布尔 Schema
   */
  boolean: (options?: BooleanFieldOptions) => ZodBoolean,

  /**
   * 日期字段
   * @param options - 日期字段选项
   * @returns Zod 日期 Schema
   */
  date: (options?: DateFieldOptions) => ZodDate,

  /**
   * 数组字段
   * @param item - 数组元素类型
   * @param options - 数组字段选项
   * @returns Zod 数组 Schema
   */
  array: <T>(item: T, options?: ArrayFieldOptions) => ZodArray<T>,

  /**
   * 对象字段
   * @param shape - 对象形状定义
   * @param options - 对象字段选项
   * @returns Zod 对象 Schema
   */
  object: <T>(shape: T, options?: ObjectFieldOptions) => ZodObject<T>,

  /**
   * JSON 字段
   * @param options - JSON 字段选项
   * @returns Zod Unknown Schema
   */
  json: (options?: JsonFieldOptions) => ZodUnknown,

  /**
   * 枚举字段
   * @param values - 枚举值数组
   * @param options - 枚举字段选项
   * @returns Zod 枚举 Schema
   */
  enum: <T extends string[]>(values: T, options?: EnumFieldOptions) => ZodEnum<T>,

  /**
   * 主键字段
   * @param options - 主键字段选项
   * @returns Zod 字符串 Schema
   */
  primary: (options?: PrimaryFieldOptions) => ZodString,

  /**
   * 关系字段
   * @param target - 目标实体名称
   * @param options - 关系字段选项
   * @returns Zod 字符串 Schema
   */
  relation: (target: string, options?: RelationFieldOptions) => ZodString,

  // 装饰器字段
  timestamps: () => TimestampFields,
  softDelete: () => SoftDeleteFields,

  // 验证器字段
  email: () => ZodString,
  url: () => ZodString,
  uuid: () => ZodString,

  // UI 相关字段
  text: (options?: TextFieldOptions) => ZodString,
  textarea: (options?: TextareaFieldOptions) => ZodString,
  select: <T extends string[]>(options: T, selectOptions?: SelectFieldOptions) => ZodEnum<T>,
  multiSelect: <T extends string[]>(options: T, multiSelectOptions?: MultiSelectFieldOptions) => ZodArray<ZodEnum<T>>,
}
```

#### 实体定义 API
```typescript
/**
 * 实体定义函数
 * @description 定义数据实体的结构和元数据
 * @param name - 实体名称
 * @param fields - 字段定义
 * @param options - 实体选项
 * @returns 实体定义对象
 * @throws {EntityDefinitionError} 当实体定义无效时
 * @example
 * ```typescript
 * const User = defineEntity('User', {
 *   id: defineField.primary(),
 *   email: defineField.string().email(),
 *   name: defineField.string({ min: 2, max: 50 }),
 *   ...defineField.timestamps()
 * }, {
 *   tableName: 'users',
 *   displayName: '用户',
 *   description: '系统用户实体'
 * })
 * ```
 */
export function defineEntity<T extends Record<string, any>>(
  name: string,
  fields: T,
  options?: EntityOptions
): EntityDefinition<T>

/**
 * 代码生成器接口
 * @description 统一的代码生成器接口
 */
export interface CodeGenerator {
  /**
   * 生成代码
   * @param entities - 实体定义列表
   * @param options - 生成选项
   * @returns 生成的代码字符串
   */
  generate(entities: EntityDefinition[], options?: GenerateOptions): Promise<string>

  /**
   * 验证生成配置
   * @param options - 生成选项
   * @returns 验证结果
   */
  validateOptions(options: GenerateOptions): ValidationResult
}

/**
 * 插件注册接口
 * @description 为代码生成器提供插件扩展能力
 */
export interface SchemaPlugin {
  /**
   * 插件名称
   */
  name: string

  /**
   * 插件版本
   */
  version: string

  /**
   * 注册钩子
   * @param hooks - 钩子系统
   */
  registerHooks(hooks: HookSystem): void

  /**
   * 注册生成器
   * @param registry - 生成器注册表
   */
  registerGenerators?(registry: GeneratorRegistry): void
}
```

### TypeScript 类型定义

#### 核心类型
```typescript
/**
 * 实体定义接口
 * @description 定义实体的完整结构
 */
export interface EntityDefinition<T extends Record<string, any> = any> {
  /** 实体名称 */
  name: string
  /** 字段定义 */
  fields: T
  /** 实体选项 */
  options: EntityOptions
  /** Zod Schema */
  schema: ZodObject<T>
  /** 基础类型 */
  _type: z.infer<ZodObject<T>>
  /** 创建类型 */
  _createType: z.infer<ZodObject<CreateFields<T>>>
  /** 更新类型 */
  _updateType: z.infer<ZodObject<UpdateFields<T>>>
  /** 查询类型 */
  _queryType: z.infer<ZodObject<QueryFields<T>>>
}

/**
 * 实体选项接口
 * @description 实体的配置选项
 */
export interface EntityOptions {
  /** 数据库表名 */
  tableName?: string
  /** 显示名称 */
  displayName?: string
  /** 实体描述 */
  description?: string
  /** 图标 */
  icon?: string
  /** 权限配置 */
  permissions?: PermissionConfig
  /** UI 配置 */
  ui?: UIConfig
  /** 索引配置 */
  indexes?: IndexConfig[]
  /** 约束配置 */
  constraints?: ConstraintConfig[]
}

/**
 * 字段选项基础接口
 * @description 所有字段类型的基础选项
 */
export interface BaseFieldOptions {
  /** 字段描述 */
  description?: string
  /** 默认值 */
  default?: any
  /** 是否可选 */
  optional?: boolean
  /** 是否可为空 */
  nullable?: boolean
  /** UI 配置 */
  ui?: FieldUIConfig
  /** 验证配置 */
  validation?: ValidationConfig
}

/**
 * 字符串字段选项
 */
export interface StringFieldOptions extends BaseFieldOptions {
  /** 最小长度 */
  min?: number
  /** 最大长度 */
  max?: number
  /** 正则表达式 */
  regex?: RegExp
  /** 预定义格式 */
  format?: 'email' | 'url' | 'uuid' | 'slug'
}

/**
 * 数字字段选项
 */
export interface NumberFieldOptions extends BaseFieldOptions {
  /** 最小值 */
  min?: number
  /** 最大值 */
  max?: number
  /** 是否为整数 */
  int?: boolean
  /** 是否为正数 */
  positive?: boolean
  /** 精度 */
  precision?: number
}
```

### 契约规范

#### 实体定义契约
1. **命名规范**: 实体名称使用 PascalCase，字段名称使用 camelCase
2. **主键要求**: 每个实体必须有且仅有一个主键字段
3. **关系定义**: 关系字段必须指向有效的实体名称
4. **类型一致性**: 字段类型必须与 Zod Schema 保持一致

#### 代码生成契约
1. **幂等性**: 相同输入必须产生相同输出
2. **增量更新**: 支持增量代码生成，不覆盖手动修改
3. **错误处理**: 生成失败时提供详细错误信息
4. **版本兼容**: 向后兼容的代码生成

#### 插件系统契约
1. **钩子执行**: 插件钩子按优先级顺序执行
2. **错误隔离**: 插件错误不影响核心功能
3. **资源管理**: 插件负责清理自己的资源
4. **配置验证**: 插件配置必须通过 Schema 验证

### 版本兼容性策略

#### Schema 版本管理
- **Schema 版本**: 每个实体定义包含版本信息
- **迁移支持**: 提供 Schema 迁移工具和指南
- **向后兼容**: 新版本保持对旧版本的兼容性
- **废弃策略**: 废弃功能提供至少一个版本的过渡期

#### API 兼容性
- **接口稳定**: 公共 API 保持稳定，新增功能使用可选参数
- **类型演进**: TypeScript 类型定义支持渐进式演进
- **生成器兼容**: 代码生成器输出格式保持向后兼容
- **插件兼容**: 插件接口保持稳定，支持多版本插件

---

## 🏗️ 架构设计

### 目录结构
```
packages/schema/
├── src/
│   ├── core/                         # 核心定义系统
│   │   ├── types.ts                  # 核心类型定义
│   │   ├── decorators.ts             # 装饰器实现
│   │   ├── entity.ts                 # 实体定义核心
│   │   ├── field.ts                  # 字段定义核心
│   │   ├── relations.ts              # 关系定义
│   │   ├── ui-types.ts               # UI 相关类型
│   │   └── index.ts                  # 核心导出
│   ├── generators/                   # 代码生成器
│   │   ├── prisma.ts                 # Prisma Schema 生成
│   │   ├── validators.ts             # 验证器生成
│   │   ├── mock.ts                   # Mock 数据生成
│   │   ├── openapi.ts                # OpenAPI 规范生成
│   │   ├── types.ts                  # TypeScript 类型生成
│   │   ├── forms.ts                  # 表单配置生成
│   │   └── index.ts                  # 生成器导出
│   ├── plugins/                      # 插件集成
│   │   ├── cli-plugin.ts             # CLI 插件
│   │   ├── hooks.ts                  # 插件钩子
│   │   └── index.ts                  # 插件导出
│   ├── utils/                        # 工具函数
│   │   ├── type-helpers.ts           # 类型辅助函数
│   │   ├── validation.ts             # 验证工具
│   │   ├── formatting.ts             # 格式化工具
│   │   └── index.ts                  # 工具导出
│   ├── i18n/                         # 国际化
│   │   ├── messages.ts               # 消息定义
│   │   ├── locales/                  # 语言文件
│   │   │   ├── en.ts                 # 英文
│   │   │   └── zh-CN.ts              # 中文
│   │   └── index.ts                  # i18n 导出
│   └── index.ts                      # 包主入口
├── tests/                            # 测试文件
├── examples/                         # 使用示例
├── package.json
├── tsconfig.json
├── README.md
└── CHANGELOG.md
```

### 核心 API 设计

#### 字段定义 API
```typescript
export const defineField = {
  // 基础类型
  string: (options?: StringFieldOptions) => ZodString,
  number: (options?: NumberFieldOptions) => ZodNumber,
  boolean: (options?: BooleanFieldOptions) => ZodBoolean,
  date: (options?: DateFieldOptions) => ZodDate,
  
  // 复合类型
  array: <T>(item: T, options?: ArrayFieldOptions) => ZodArray<T>,
  object: <T>(shape: T, options?: ObjectFieldOptions) => ZodObject<T>,
  json: (options?: JsonFieldOptions) => ZodUnknown,
  enum: <T extends string[]>(values: T, options?: EnumFieldOptions) => ZodEnum<T>,
  
  // 特殊字段
  primary: (options?: PrimaryFieldOptions) => ZodString,
  relation: (target: string, options?: RelationFieldOptions) => ZodString,
  
  // 装饰器
  timestamps: () => TimestampFields,
  softDelete: () => SoftDeleteFields,
  
  // 验证器
  email: () => ZodString,
  url: () => ZodString,
  uuid: () => ZodString,
  
  // UI 相关
  text: (options?: TextFieldOptions) => ZodString,
  textarea: (options?: TextareaFieldOptions) => ZodString,
  select: <T extends string[]>(options: T, selectOptions?: SelectFieldOptions) => ZodEnum<T>,
  multiSelect: <T extends string[]>(options: T, multiSelectOptions?: MultiSelectFieldOptions) => ZodArray<ZodEnum<T>>,
}
```

#### 实体定义 API
```typescript
export function defineEntity<T extends Record<string, any>>(
  name: string,
  fields: T,
  options?: EntityOptions
): EntityDefinition<T> {
  return {
    name,
    fields,
    options: {
      tableName: options?.tableName || name.toLowerCase(),
      displayName: options?.displayName || name,
      description: options?.description,
      icon: options?.icon,
      permissions: options?.permissions,
      ui: options?.ui,
      ...options
    },
    schema: z.object(fields),
    // 类型推导
    _type: {} as z.infer<ZodObject<T>>,
    _createType: {} as z.infer<ZodObject<CreateFields<T>>>,
    _updateType: {} as z.infer<ZodObject<UpdateFields<T>>>,
    _queryType: {} as z.infer<ZodObject<QueryFields<T>>>,
  }
}
```

#### 装饰器实现
```typescript
export const decorators = {
  primary: (options?: PrimaryOptions) => ({
    type: 'primary' as const,
    options: {
      autoGenerate: options?.autoGenerate ?? true,
      type: options?.type || 'cuid',
      ...options
    }
  }),
  
  unique: (options?: UniqueOptions) => ({
    type: 'unique' as const,
    options: {
      name: options?.name,
      fields: options?.fields,
      ...options
    }
  }),
  
  index: (options?: IndexOptions) => ({
    type: 'index' as const,
    options: {
      name: options?.name,
      fields: options?.fields,
      type: options?.type || 'btree',
      ...options
    }
  }),
  
  timestamps: () => ({
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
  }),
  
  softDelete: () => ({
    deletedAt: z.date().optional(),
  }),
  
  relation: (target: string, options?: RelationOptions) => ({
    type: 'relation' as const,
    target,
    options: {
      type: options?.type || 'one-to-many',
      foreignKey: options?.foreignKey,
      references: options?.references || 'id',
      onDelete: options?.onDelete || 'cascade',
      onUpdate: options?.onUpdate || 'cascade',
      ...options
    }
  })
}
```

---

## 🔧 实现细节

### 核心算法

#### 类型推导算法
```typescript
/**
 * 类型推导引擎
 * @description 基于 Zod Schema 进行 TypeScript 类型推导
 * @complexity O(n) 其中 n 是字段数量
 */
export class TypeInferenceEngine {
  /**
   * 推导实体类型
   * @param entity - 实体定义
   * @returns 推导的类型信息
   */
  inferEntityTypes<T extends Record<string, any>>(
    entity: EntityDefinition<T>
  ): InferredTypes<T> {
    const baseType = this.inferBaseType(entity.fields)
    const createType = this.inferCreateType(entity.fields)
    const updateType = this.inferUpdateType(entity.fields)
    const queryType = this.inferQueryType(entity.fields)

    return {
      base: baseType,
      create: createType,
      update: updateType,
      query: queryType,
      relations: this.inferRelationTypes(entity.fields)
    }
  }

  /**
   * 推导基础类型
   * @param fields - 字段定义
   * @returns 基础类型定义
   */
  private inferBaseType<T extends Record<string, any>>(fields: T): BaseTypeInfo {
    const typeMap: Record<string, TypeInfo> = {}

    for (const [fieldName, fieldSchema] of Object.entries(fields)) {
      typeMap[fieldName] = this.inferFieldType(fieldSchema)
    }

    return {
      fields: typeMap,
      required: this.extractRequiredFields(fields),
      optional: this.extractOptionalFields(fields)
    }
  }

  /**
   * 推导字段类型
   * @param field - 字段 Schema
   * @returns 字段类型信息
   */
  private inferFieldType(field: any): TypeInfo {
    if (field instanceof z.ZodString) {
      return {
        type: 'string',
        nullable: field.isOptional(),
        constraints: this.extractStringConstraints(field)
      }
    }

    if (field instanceof z.ZodNumber) {
      return {
        type: 'number',
        nullable: field.isOptional(),
        constraints: this.extractNumberConstraints(field)
      }
    }

    if (field instanceof z.ZodBoolean) {
      return {
        type: 'boolean',
        nullable: field.isOptional()
      }
    }

    if (field instanceof z.ZodDate) {
      return {
        type: 'Date',
        nullable: field.isOptional()
      }
    }

    if (field instanceof z.ZodArray) {
      return {
        type: 'array',
        elementType: this.inferFieldType(field.element),
        nullable: field.isOptional()
      }
    }

    return {
      type: 'unknown',
      nullable: true
    }
  }

  /**
   * 推导创建类型（排除自动生成字段）
   * @param fields - 字段定义
   * @returns 创建类型定义
   */
  private inferCreateType<T extends Record<string, any>>(fields: T): CreateTypeInfo {
    const createFields: Record<string, TypeInfo> = {}

    for (const [fieldName, fieldSchema] of Object.entries(fields)) {
      // 排除主键和时间戳字段
      if (this.isAutoGeneratedField(fieldName, fieldSchema)) {
        continue
      }

      createFields[fieldName] = this.inferFieldType(fieldSchema)
    }

    return {
      fields: createFields,
      required: this.extractRequiredFields(createFields),
      optional: this.extractOptionalFields(createFields)
    }
  }

  private isAutoGeneratedField(fieldName: string, fieldSchema: any): boolean {
    // 检查是否为自动生成字段
    return fieldName === 'id' ||
           fieldName === 'createdAt' ||
           fieldName === 'updatedAt' ||
           this.hasDecorator(fieldSchema, 'primary')
  }
}

export interface InferredTypes<T> {
  base: BaseTypeInfo
  create: CreateTypeInfo
  update: UpdateTypeInfo
  query: QueryTypeInfo
  relations: RelationTypeInfo[]
}

export interface TypeInfo {
  type: string
  nullable: boolean
  constraints?: any
  elementType?: TypeInfo
}
```

#### Schema 验证算法
```typescript
/**
 * Schema 验证引擎
 * @description 提供多层次的 Schema 验证机制
 */
export class SchemaValidationEngine {
  /**
   * 验证实体定义
   * @param entity - 实体定义
   * @returns 验证结果
   */
  validateEntity(entity: EntityDefinition): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 1. 基础验证
    this.validateBasicStructure(entity, errors)

    // 2. 字段验证
    this.validateFields(entity.fields, errors, warnings)

    // 3. 关系验证
    this.validateRelations(entity, errors, warnings)

    // 4. 约束验证
    this.validateConstraints(entity, errors, warnings)

    // 5. 性能验证
    this.validatePerformance(entity, warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateValidationScore(errors, warnings)
    }
  }

  /**
   * 验证基础结构
   * @param entity - 实体定义
   * @param errors - 错误收集器
   */
  private validateBasicStructure(entity: EntityDefinition, errors: ValidationError[]): void {
    // 验证实体名称
    if (!entity.name || typeof entity.name !== 'string') {
      errors.push({
        type: 'structure',
        field: 'name',
        message: 'Entity name is required and must be a string',
        severity: 'error'
      })
    }

    // 验证命名规范
    if (entity.name && !/^[A-Z][a-zA-Z0-9]*$/.test(entity.name)) {
      errors.push({
        type: 'naming',
        field: 'name',
        message: 'Entity name must be PascalCase',
        severity: 'error'
      })
    }

    // 验证字段存在
    if (!entity.fields || Object.keys(entity.fields).length === 0) {
      errors.push({
        type: 'structure',
        field: 'fields',
        message: 'Entity must have at least one field',
        severity: 'error'
      })
    }
  }

  /**
   * 验证字段定义
   * @param fields - 字段定义
   * @param errors - 错误收集器
   * @param warnings - 警告收集器
   */
  private validateFields(
    fields: Record<string, any>,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    let hasPrimaryKey = false

    for (const [fieldName, fieldSchema] of Object.entries(fields)) {
      // 验证字段名称
      if (!/^[a-z][a-zA-Z0-9]*$/.test(fieldName)) {
        errors.push({
          type: 'naming',
          field: fieldName,
          message: 'Field name must be camelCase',
          severity: 'error'
        })
      }

      // 检查主键
      if (this.isPrimaryKeyField(fieldSchema)) {
        if (hasPrimaryKey) {
          errors.push({
            type: 'constraint',
            field: fieldName,
            message: 'Entity can have only one primary key',
            severity: 'error'
          })
        }
        hasPrimaryKey = true
      }

      // 验证字段类型
      this.validateFieldType(fieldName, fieldSchema, errors, warnings)
    }

    // 确保有主键
    if (!hasPrimaryKey) {
      errors.push({
        type: 'constraint',
        field: 'fields',
        message: 'Entity must have a primary key field',
        severity: 'error'
      })
    }
  }

  /**
   * 验证关系定义
   * @param entity - 实体定义
   * @param errors - 错误收集器
   * @param warnings - 警告收集器
   */
  private validateRelations(
    entity: EntityDefinition,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    for (const [fieldName, fieldSchema] of Object.entries(entity.fields)) {
      if (this.isRelationField(fieldSchema)) {
        const relationTarget = this.getRelationTarget(fieldSchema)

        // 验证关系目标存在（这里需要全局实体注册表）
        if (!this.entityExists(relationTarget)) {
          warnings.push({
            type: 'relation',
            field: fieldName,
            message: `Relation target '${relationTarget}' not found`,
            severity: 'warning'
          })
        }

        // 验证关系类型
        const relationType = this.getRelationType(fieldSchema)
        if (!['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many'].includes(relationType)) {
          errors.push({
            type: 'relation',
            field: fieldName,
            message: `Invalid relation type: ${relationType}`,
            severity: 'error'
          })
        }
      }
    }
  }

  private calculateValidationScore(errors: ValidationError[], warnings: ValidationWarning[]): number {
    const errorPenalty = errors.length * 20
    const warningPenalty = warnings.length * 5
    return Math.max(0, 100 - errorPenalty - warningPenalty)
  }
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  score: number
}

export interface ValidationError {
  type: 'structure' | 'naming' | 'constraint' | 'relation' | 'type'
  field: string
  message: string
  severity: 'error'
}

export interface ValidationWarning {
  type: 'performance' | 'relation' | 'naming' | 'best-practice'
  field: string
  message: string
  severity: 'warning'
}
```

### 数据结构

#### 实体注册表
```typescript
/**
 * 实体注册表
 * @description 管理所有实体定义的中央注册表
 */
export class EntityRegistry {
  private entities = new Map<string, EntityDefinition>()
  private dependencies = new Map<string, Set<string>>()
  private reverseDependencies = new Map<string, Set<string>>()

  /**
   * 注册实体
   * @param entity - 实体定义
   * @throws {EntityAlreadyExistsError} 当实体已存在时
   */
  register(entity: EntityDefinition): void {
    if (this.entities.has(entity.name)) {
      throw new EntityAlreadyExistsError(`Entity ${entity.name} already exists`)
    }

    this.entities.set(entity.name, entity)
    this.buildDependencyMaps(entity)
    this.validateCircularDependencies()
  }

  /**
   * 获取实体
   * @param name - 实体名称
   * @returns 实体定义或 undefined
   */
  get(name: string): EntityDefinition | undefined {
    return this.entities.get(name)
  }

  /**
   * 获取所有实体
   * @returns 实体定义数组
   */
  getAll(): EntityDefinition[] {
    return Array.from(this.entities.values())
  }

  /**
   * 获取实体依赖
   * @param name - 实体名称
   * @returns 依赖的实体名称集合
   */
  getDependencies(name: string): Set<string> {
    return this.dependencies.get(name) || new Set()
  }

  /**
   * 获取依赖此实体的其他实体
   * @param name - 实体名称
   * @returns 依赖此实体的实体名称集合
   */
  getDependents(name: string): Set<string> {
    return this.reverseDependencies.get(name) || new Set()
  }

  /**
   * 获取拓扑排序的实体列表
   * @returns 按依赖顺序排列的实体列表
   */
  getTopologicalOrder(): EntityDefinition[] {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const result: EntityDefinition[] = []

    const visit = (entityName: string) => {
      if (visiting.has(entityName)) {
        throw new CircularDependencyError(`Circular dependency detected: ${entityName}`)
      }

      if (visited.has(entityName)) {
        return
      }

      visiting.add(entityName)

      const dependencies = this.getDependencies(entityName)
      for (const dep of dependencies) {
        visit(dep)
      }

      visiting.delete(entityName)
      visited.add(entityName)

      const entity = this.entities.get(entityName)
      if (entity) {
        result.push(entity)
      }
    }

    for (const entityName of this.entities.keys()) {
      if (!visited.has(entityName)) {
        visit(entityName)
      }
    }

    return result
  }

  private buildDependencyMaps(entity: EntityDefinition): void {
    const dependencies = new Set<string>()

    for (const [fieldName, fieldSchema] of Object.entries(entity.fields)) {
      if (this.isRelationField(fieldSchema)) {
        const target = this.getRelationTarget(fieldSchema)
        dependencies.add(target)

        // 构建反向依赖
        if (!this.reverseDependencies.has(target)) {
          this.reverseDependencies.set(target, new Set())
        }
        this.reverseDependencies.get(target)!.add(entity.name)
      }
    }

    this.dependencies.set(entity.name, dependencies)
  }

  private validateCircularDependencies(): void {
    try {
      this.getTopologicalOrder()
    } catch (error) {
      if (error instanceof CircularDependencyError) {
        throw error
      }
    }
  }
}
```

### 设计模式

#### 建造者模式 - 实体构建器
```typescript
/**
 * 实体构建器 - 实现建造者模式
 * @description 提供流式 API 构建复杂实体定义
 */
export class EntityBuilder {
  private name: string = ''
  private fields: Record<string, any> = {}
  private options: EntityOptions = {}

  /**
   * 设置实体名称
   * @param name - 实体名称
   * @returns 构建器实例
   */
  setName(name: string): EntityBuilder {
    this.name = name
    return this
  }

  /**
   * 添加字段
   * @param name - 字段名称
   * @param field - 字段定义
   * @returns 构建器实例
   */
  addField(name: string, field: any): EntityBuilder {
    this.fields[name] = field
    return this
  }

  /**
   * 批量添加字段
   * @param fields - 字段定义对象
   * @returns 构建器实例
   */
  addFields(fields: Record<string, any>): EntityBuilder {
    Object.assign(this.fields, fields)
    return this
  }

  /**
   * 添加主键字段
   * @param name - 字段名称
   * @param options - 主键选项
   * @returns 构建器实例
   */
  addPrimaryKey(name: string = 'id', options?: PrimaryFieldOptions): EntityBuilder {
    this.fields[name] = defineField.primary(options)
    return this
  }

  /**
   * 添加时间戳字段
   * @returns 构建器实例
   */
  addTimestamps(): EntityBuilder {
    Object.assign(this.fields, defineField.timestamps())
    return this
  }

  /**
   * 添加软删除字段
   * @returns 构建器实例
   */
  addSoftDelete(): EntityBuilder {
    Object.assign(this.fields, defineField.softDelete())
    return this
  }

  /**
   * 设置表名
   * @param tableName - 表名
   * @returns 构建器实例
   */
  setTableName(tableName: string): EntityBuilder {
    this.options.tableName = tableName
    return this
  }

  /**
   * 设置显示名称
   * @param displayName - 显示名称
   * @returns 构建器实例
   */
  setDisplayName(displayName: string): EntityBuilder {
    this.options.displayName = displayName
    return this
  }

  /**
   * 设置描述
   * @param description - 描述
   * @returns 构建器实例
   */
  setDescription(description: string): EntityBuilder {
    this.options.description = description
    return this
  }

  /**
   * 构建实体定义
   * @returns 实体定义
   * @throws {EntityBuildError} 当构建失败时
   */
  build(): EntityDefinition {
    if (!this.name) {
      throw new EntityBuildError('Entity name is required')
    }

    if (Object.keys(this.fields).length === 0) {
      throw new EntityBuildError('Entity must have at least one field')
    }

    return defineEntity(this.name, this.fields, this.options)
  }

  /**
   * 重置构建器
   * @returns 构建器实例
   */
  reset(): EntityBuilder {
    this.name = ''
    this.fields = {}
    this.options = {}
    return this
  }
}

// 使用示例
const User = new EntityBuilder()
  .setName('User')
  .addPrimaryKey()
  .addField('email', defineField.string().email())
  .addField('name', defineField.string({ min: 2, max: 50 }))
  .addField('age', defineField.number({ min: 0, max: 120 }))
  .addTimestamps()
  .setTableName('users')
  .setDisplayName('用户')
  .setDescription('系统用户实体')
  .build()
```

#### 策略模式 - 代码生成策略
```typescript
/**
 * 代码生成策略接口
 * @description 定义代码生成的统一接口
 */
export abstract class CodeGenerationStrategy {
  abstract generate(entities: EntityDefinition[], options?: any): Promise<string>
  abstract validate(entities: EntityDefinition[]): ValidationResult
  abstract getFileExtension(): string
  abstract getOutputPath(options?: any): string
}

/**
 * Prisma 生成策略
 */
export class PrismaGenerationStrategy extends CodeGenerationStrategy {
  async generate(entities: EntityDefinition[], options?: PrismaGenerateOptions): Promise<string> {
    const generator = new PrismaGenerator()

    entities.forEach(entity => generator.addEntity(entity))

    return generator.generate()
  }

  validate(entities: EntityDefinition[]): ValidationResult {
    const errors: ValidationError[] = []

    // Prisma 特定验证
    entities.forEach(entity => {
      // 检查不支持的类型
      for (const [fieldName, field] of Object.entries(entity.fields)) {
        if (this.isUnsupportedType(field)) {
          errors.push({
            type: 'type',
            field: fieldName,
            message: `Unsupported type for Prisma: ${typeof field}`,
            severity: 'error'
          })
        }
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      score: errors.length === 0 ? 100 : 0
    }
  }

  getFileExtension(): string {
    return '.prisma'
  }

  getOutputPath(options?: PrismaGenerateOptions): string {
    return options?.outputPath || 'prisma/schema.prisma'
  }

  private isUnsupportedType(field: any): boolean {
    // 检查 Prisma 不支持的类型
    return false // 简化实现
  }
}

/**
 * TypeScript 类型生成策略
 */
export class TypeScriptGenerationStrategy extends CodeGenerationStrategy {
  async generate(entities: EntityDefinition[], options?: TypeScriptGenerateOptions): Promise<string> {
    const typeGenerator = new TypeScriptTypeGenerator()

    return typeGenerator.generateTypes(entities, options)
  }

  validate(entities: EntityDefinition[]): ValidationResult {
    // TypeScript 特定验证
    return {
      isValid: true,
      errors: [],
      warnings: [],
      score: 100
    }
  }

  getFileExtension(): string {
    return '.ts'
  }

  getOutputPath(options?: TypeScriptGenerateOptions): string {
    return options?.outputPath || 'src/types/entities.ts'
  }
}

/**
 * 代码生成上下文
 * @description 使用策略模式的代码生成器
 */
export class CodeGenerationContext {
  private strategy: CodeGenerationStrategy

  constructor(strategy: CodeGenerationStrategy) {
    this.strategy = strategy
  }

  /**
   * 设置生成策略
   * @param strategy - 生成策略
   */
  setStrategy(strategy: CodeGenerationStrategy): void {
    this.strategy = strategy
  }

  /**
   * 执行代码生成
   * @param entities - 实体定义列表
   * @param options - 生成选项
   * @returns 生成的代码
   */
  async generate(entities: EntityDefinition[], options?: any): Promise<string> {
    // 验证实体
    const validationResult = this.strategy.validate(entities)
    if (!validationResult.isValid) {
      throw new CodeGenerationError('Entity validation failed', validationResult.errors)
    }

    // 生成代码
    return await this.strategy.generate(entities, options)
  }

  /**
   * 获取输出路径
   * @param options - 生成选项
   * @returns 输出路径
   */
  getOutputPath(options?: any): string {
    return this.strategy.getOutputPath(options)
  }
}
```

### 架构决策

#### Schema 驱动架构
- **单一数据源**: 以 Zod Schema 作为唯一的数据结构定义来源
- **类型安全**: 通过 TypeScript 类型推导确保编译时类型安全
- **代码生成**: 基于 Schema 自动生成各种代码和配置文件
- **一致性保证**: 确保数据库、API、前端的数据结构一致性

#### 性能优化策略
- **懒加载**: 代码生成器按需加载，减少启动时间
- **缓存机制**: 缓存类型推导结果和生成的代码
- **增量生成**: 支持增量代码生成，只更新变化的部分
- **并行处理**: 多个实体的代码生成可以并行执行

#### 扩展性设计
- **插件化生成器**: 支持自定义代码生成器插件
- **钩子系统**: 在关键流程提供钩子扩展点
- **策略模式**: 支持多种代码生成策略
- **模板系统**: 支持自定义代码生成模板

---

## 🔧 核心实现

### Prisma 生成器
```typescript
export class PrismaGenerator {
  private entities: Map<string, EntityDefinition> = new Map()
  
  addEntity(entity: EntityDefinition): void {
    this.entities.set(entity.name, entity)
  }
  
  generate(): string {
    const models = Array.from(this.entities.values())
      .map(entity => this.generateModel(entity))
      .join('\n\n')
    
    return `
// This file is auto-generated by @linch-kit/schema
// Do not edit manually

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

${models}
`
  }
  
  private generateModel(entity: EntityDefinition): string {
    const fields = this.generateFields(entity)
    const relations = this.generateRelations(entity)
    const indexes = this.generateIndexes(entity)
    
    return `
model ${entity.name} {
${fields}
${relations}
${indexes}
  @@map("${entity.options.tableName}")
}
`
  }
  
  private generateFields(entity: EntityDefinition): string {
    return Object.entries(entity.fields)
      .map(([name, field]) => this.generateField(name, field))
      .join('\n')
  }
  
  private generateField(name: string, field: any): string {
    const type = this.mapZodTypeToPrisma(field)
    const modifiers = this.generateFieldModifiers(field)
    
    return `  ${name} ${type}${modifiers}`
  }
  
  private mapZodTypeToPrisma(field: any): string {
    // Zod 类型到 Prisma 类型的映射逻辑
    if (field instanceof z.ZodString) return 'String'
    if (field instanceof z.ZodNumber) return 'Int'
    if (field instanceof z.ZodBoolean) return 'Boolean'
    if (field instanceof z.ZodDate) return 'DateTime'
    if (field instanceof z.ZodArray) return `${this.mapZodTypeToPrisma(field.element)}[]`
    
    return 'String' // 默认类型
  }
}
```

### 验证器生成器
```typescript
export class ValidatorGenerator {
  generateValidators(entity: EntityDefinition): ValidatorSet {
    return {
      create: this.generateCreateValidator(entity),
      update: this.generateUpdateValidator(entity),
      query: this.generateQueryValidator(entity),
      response: this.generateResponseValidator(entity),
    }
  }
  
  private generateCreateValidator(entity: EntityDefinition): ZodSchema {
    const createFields = this.extractCreateFields(entity.fields)
    return z.object(createFields)
  }
  
  private generateUpdateValidator(entity: EntityDefinition): ZodSchema {
    const updateFields = this.extractUpdateFields(entity.fields)
    return z.object(updateFields).partial()
  }
  
  private generateQueryValidator(entity: EntityDefinition): ZodSchema {
    const queryFields = this.extractQueryFields(entity.fields)
    return z.object({
      where: z.object(queryFields).partial().optional(),
      orderBy: z.record(z.enum(['asc', 'desc'])).optional(),
      take: z.number().positive().optional(),
      skip: z.number().nonnegative().optional(),
      include: z.record(z.boolean()).optional(),
    })
  }
  
  private generateResponseValidator(entity: EntityDefinition): ZodSchema {
    return entity.schema
  }
}
```

### Mock 数据生成器
```typescript
export class MockGenerator {
  generateMockData(entity: EntityDefinition, count = 10): any[] {
    return Array.from({ length: count }, () => this.generateSingleMock(entity))
  }
  
  private generateSingleMock(entity: EntityDefinition): any {
    const mock: any = {}
    
    for (const [fieldName, fieldSchema] of Object.entries(entity.fields)) {
      mock[fieldName] = this.generateFieldMock(fieldSchema)
    }
    
    return mock
  }
  
  private generateFieldMock(field: any): any {
    if (field instanceof z.ZodString) {
      return this.generateStringMock(field)
    }
    if (field instanceof z.ZodNumber) {
      return Math.floor(Math.random() * 1000)
    }
    if (field instanceof z.ZodBoolean) {
      return Math.random() > 0.5
    }
    if (field instanceof z.ZodDate) {
      return new Date()
    }
    if (field instanceof z.ZodArray) {
      const length = Math.floor(Math.random() * 5) + 1
      return Array.from({ length }, () => this.generateFieldMock(field.element))
    }
    
    return null
  }
  
  private generateStringMock(field: z.ZodString): string {
    // 根据字段约束生成合适的字符串
    const checks = field._def.checks || []
    
    for (const check of checks) {
      if (check.kind === 'email') {
        return `user${Math.floor(Math.random() * 1000)}@example.com`
      }
      if (check.kind === 'url') {
        return `https://example.com/path${Math.floor(Math.random() * 1000)}`
      }
      if (check.kind === 'uuid') {
        return crypto.randomUUID()
      }
    }
    
    return `string_${Math.floor(Math.random() * 1000)}`
  }
}
```

---

## 🔗 集成接口

### 与其他 LinchKit 包的交互方式

#### Core 包集成
```typescript
/**
 * Core 包集成接口
 * @description 与 @linch-kit/core 的插件系统集成
 */
export interface CoreIntegration {
  /**
   * 注册 Schema 插件到 Core 系统
   * @param core - Core 插件系统
   */
  registerWithCore(core: PluginSystem): void

  /**
   * 获取 Schema 配置
   * @returns Schema 配置对象
   */
  getSchemaConfig(): SchemaConfig

  /**
   * 监听 Core 事件
   * @param eventBus - Core 事件总线
   */
  subscribeToEvents(eventBus: EventBus): void
}

// Core 包集成实现
export class SchemaCoreIntegration implements CoreIntegration {
  constructor(private registry: EntityRegistry) {}

  registerWithCore(core: PluginSystem): void {
    // 注册 Schema 相关钩子
    core.hooks.register('app:before-start', async (context) => {
      // 在应用启动前验证所有实体定义
      await this.validateAllEntities()
    })

    core.hooks.register('dev:hot-reload', async (context) => {
      // 开发模式下的热重载支持
      await this.reloadEntities(context.data.changedFiles)
    })

    // 注册 Schema 服务
    core.services.register('schema', {
      registry: this.registry,
      defineEntity,
      defineField,
      generators: {
        prisma: new PrismaGenerator(),
        validators: new ValidatorGenerator(),
        mock: new MockGenerator()
      }
    })
  }

  getSchemaConfig(): SchemaConfig {
    return {
      entities: this.registry.getAll(),
      generators: ['prisma', 'validators', 'mock'],
      outputPaths: {
        prisma: 'prisma/schema.prisma',
        validators: 'src/validators/index.ts',
        types: 'src/types/entities.ts'
      }
    }
  }

  subscribeToEvents(eventBus: EventBus): void {
    // 监听实体变更事件
    eventBus.on('entity:created', (event) => {
      this.handleEntityCreated(event.payload)
    })

    eventBus.on('entity:updated', (event) => {
      this.handleEntityUpdated(event.payload)
    })

    eventBus.on('entity:deleted', (event) => {
      this.handleEntityDeleted(event.payload)
    })
  }

  private async validateAllEntities(): Promise<void> {
    const entities = this.registry.getAll()
    const validator = new SchemaValidationEngine()

    for (const entity of entities) {
      const result = validator.validateEntity(entity)
      if (!result.isValid) {
        throw new SchemaValidationError(`Entity ${entity.name} validation failed`, result.errors)
      }
    }
  }
}
```

#### Auth 包集成
```typescript
/**
 * Auth 包集成接口
 * @description 为认证包提供用户和权限实体定义
 */
export interface AuthIntegration {
  /**
   * 定义用户实体
   * @param options - 用户实体选项
   * @returns 用户实体定义
   */
  defineUserEntity(options?: UserEntityOptions): EntityDefinition

  /**
   * 定义角色实体
   * @param options - 角色实体选项
   * @returns 角色实体定义
   */
  defineRoleEntity(options?: RoleEntityOptions): EntityDefinition

  /**
   * 定义权限实体
   * @param options - 权限实体选项
   * @returns 权限实体定义
   */
  definePermissionEntity(options?: PermissionEntityOptions): EntityDefinition

  /**
   * 生成认证相关的验证器
   * @returns 认证验证器集合
   */
  generateAuthValidators(): AuthValidatorSet
}

// Auth 包集成实现
export class SchemaAuthIntegration implements AuthIntegration {
  defineUserEntity(options?: UserEntityOptions): EntityDefinition {
    return defineEntity('User', {
      id: defineField.primary(),
      email: defineField.string().email(),
      username: defineField.string({ min: 3, max: 30 }).optional(),
      password: defineField.string({ min: 8 }),
      firstName: defineField.string({ max: 50 }).optional(),
      lastName: defineField.string({ max: 50 }).optional(),
      avatar: defineField.string().url().optional(),
      emailVerified: defineField.boolean().default(false),
      isActive: defineField.boolean().default(true),
      lastLoginAt: defineField.date().optional(),
      ...defineField.timestamps(),
      ...defineField.softDelete(),
      // 关系字段
      roles: defineField.relation('Role', { type: 'many-to-many' }),
      sessions: defineField.relation('Session', { type: 'one-to-many' })
    }, {
      tableName: options?.tableName || 'users',
      displayName: '用户',
      description: '系统用户实体',
      permissions: {
        create: ['admin', 'user:create'],
        read: ['admin', 'user:read', 'self'],
        update: ['admin', 'user:update', 'self'],
        delete: ['admin', 'user:delete']
      }
    })
  }

  defineRoleEntity(options?: RoleEntityOptions): EntityDefinition {
    return defineEntity('Role', {
      id: defineField.primary(),
      name: defineField.string({ min: 2, max: 50 }),
      description: defineField.string({ max: 200 }).optional(),
      isSystem: defineField.boolean().default(false),
      ...defineField.timestamps(),
      // 关系字段
      users: defineField.relation('User', { type: 'many-to-many' }),
      permissions: defineField.relation('Permission', { type: 'many-to-many' })
    }, {
      tableName: options?.tableName || 'roles',
      displayName: '角色',
      description: '用户角色实体'
    })
  }

  definePermissionEntity(options?: PermissionEntityOptions): EntityDefinition {
    return defineEntity('Permission', {
      id: defineField.primary(),
      name: defineField.string({ min: 2, max: 100 }),
      resource: defineField.string({ max: 50 }),
      action: defineField.enum(['create', 'read', 'update', 'delete', 'manage']),
      description: defineField.string({ max: 200 }).optional(),
      ...defineField.timestamps(),
      // 关系字段
      roles: defineField.relation('Role', { type: 'many-to-many' })
    }, {
      tableName: options?.tableName || 'permissions',
      displayName: '权限',
      description: '系统权限实体'
    })
  }

  generateAuthValidators(): AuthValidatorSet {
    const userEntity = this.defineUserEntity()
    const roleEntity = this.defineRoleEntity()
    const permissionEntity = this.definePermissionEntity()

    const generator = new ValidatorGenerator()

    return {
      user: generator.generateValidators(userEntity),
      role: generator.generateValidators(roleEntity),
      permission: generator.generateValidators(permissionEntity),
      // 特殊验证器
      login: z.object({
        email: z.string().email(),
        password: z.string().min(8)
      }),
      register: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().max(50).optional(),
        lastName: z.string().max(50).optional()
      }),
      changePassword: z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
        confirmPassword: z.string()
      }).refine(data => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"]
      })
    }
  }
}

export interface AuthValidatorSet {
  user: ValidatorSet
  role: ValidatorSet
  permission: ValidatorSet
  login: ZodSchema
  register: ZodSchema
  changePassword: ZodSchema
}
```

#### CRUD 包集成
```typescript
/**
 * CRUD 包集成接口
 * @description 为 CRUD 包提供实体定义和验证器
 */
export interface CrudIntegration {
  /**
   * 获取实体的 CRUD 验证器
   * @param entityName - 实体名称
   * @returns CRUD 验证器集合
   */
  getCrudValidators(entityName: string): CrudValidatorSet

  /**
   * 生成实体的查询构建器
   * @param entityName - 实体名称
   * @returns 查询构建器
   */
  generateQueryBuilder(entityName: string): QueryBuilder

  /**
   * 获取实体的关系信息
   * @param entityName - 实体名称
   * @returns 关系信息
   */
  getEntityRelations(entityName: string): RelationInfo[]

  /**
   * 生成批量操作验证器
   * @param entityName - 实体名称
   * @returns 批量操作验证器
   */
  generateBatchValidators(entityName: string): BatchValidatorSet
}

// CRUD 包集成实现
export class SchemaCrudIntegration implements CrudIntegration {
  constructor(private registry: EntityRegistry) {}

  getCrudValidators(entityName: string): CrudValidatorSet {
    const entity = this.registry.get(entityName)
    if (!entity) {
      throw new EntityNotFoundError(`Entity ${entityName} not found`)
    }

    const generator = new ValidatorGenerator()
    const baseValidators = generator.generateValidators(entity)

    return {
      ...baseValidators,
      // 扩展的 CRUD 验证器
      findMany: z.object({
        where: baseValidators.query.shape.where,
        orderBy: baseValidators.query.shape.orderBy,
        take: z.number().positive().max(1000).optional(),
        skip: z.number().nonnegative().optional(),
        include: this.generateIncludeValidator(entity),
        select: this.generateSelectValidator(entity)
      }),
      findUnique: z.object({
        where: this.generateUniqueWhereValidator(entity),
        include: this.generateIncludeValidator(entity),
        select: this.generateSelectValidator(entity)
      }),
      createMany: z.object({
        data: z.array(baseValidators.create),
        skipDuplicates: z.boolean().optional()
      }),
      updateMany: z.object({
        where: baseValidators.query.shape.where,
        data: baseValidators.update
      }),
      deleteMany: z.object({
        where: baseValidators.query.shape.where
      })
    }
  }

  generateQueryBuilder(entityName: string): QueryBuilder {
    const entity = this.registry.get(entityName)
    if (!entity) {
      throw new EntityNotFoundError(`Entity ${entityName} not found`)
    }

    return new QueryBuilder(entity)
  }

  getEntityRelations(entityName: string): RelationInfo[] {
    const entity = this.registry.get(entityName)
    if (!entity) {
      throw new EntityNotFoundError(`Entity ${entityName} not found`)
    }

    const relations: RelationInfo[] = []

    for (const [fieldName, fieldSchema] of Object.entries(entity.fields)) {
      if (this.isRelationField(fieldSchema)) {
        relations.push({
          fieldName,
          targetEntity: this.getRelationTarget(fieldSchema),
          relationType: this.getRelationType(fieldSchema),
          foreignKey: this.getForeignKey(fieldSchema),
          references: this.getReferences(fieldSchema)
        })
      }
    }

    return relations
  }

  generateBatchValidators(entityName: string): BatchValidatorSet {
    const crudValidators = this.getCrudValidators(entityName)

    return {
      batchCreate: z.object({
        data: z.array(crudValidators.create).min(1).max(1000)
      }),
      batchUpdate: z.object({
        operations: z.array(z.object({
          where: crudValidators.findUnique.shape.where,
          data: crudValidators.update
        })).min(1).max(100)
      }),
      batchDelete: z.object({
        ids: z.array(z.string()).min(1).max(100)
      })
    }
  }

  private generateIncludeValidator(entity: EntityDefinition): ZodSchema {
    const relations = this.getEntityRelations(entity.name)
    const includeShape: Record<string, any> = {}

    for (const relation of relations) {
      includeShape[relation.fieldName] = z.boolean().optional()
    }

    return z.object(includeShape).optional()
  }

  private generateSelectValidator(entity: EntityDefinition): ZodSchema {
    const selectShape: Record<string, any> = {}

    for (const fieldName of Object.keys(entity.fields)) {
      selectShape[fieldName] = z.boolean().optional()
    }

    return z.object(selectShape).optional()
  }

  private generateUniqueWhereValidator(entity: EntityDefinition): ZodSchema {
    // 生成唯一字段的 where 条件验证器
    const uniqueFields = this.getUniqueFields(entity)
    const whereOptions: ZodSchema[] = []

    for (const field of uniqueFields) {
      whereOptions.push(z.object({ [field]: z.any() }))
    }

    return z.union(whereOptions as [ZodSchema, ZodSchema, ...ZodSchema[]])
  }
}

export interface CrudValidatorSet extends ValidatorSet {
  findMany: ZodSchema
  findUnique: ZodSchema
  createMany: ZodSchema
  updateMany: ZodSchema
  deleteMany: ZodSchema
}

export interface BatchValidatorSet {
  batchCreate: ZodSchema
  batchUpdate: ZodSchema
  batchDelete: ZodSchema
}

export interface RelationInfo {
  fieldName: string
  targetEntity: string
  relationType: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
  foreignKey?: string
  references?: string
}
```

### 依赖关系

#### 依赖链管理
```typescript
/**
 * Schema 依赖链管理器
 * @description 管理 Schema 包在依赖链中的位置和职责
 */
export class SchemaDependencyManager {
  /**
   * 向上游包（Core）提供的服务
   */
  getUpstreamServices(): UpstreamServices {
    return {
      // 为 Core 提供实体注册服务
      entityRegistry: this.registry,

      // 为 Core 提供 Schema 验证服务
      schemaValidator: new SchemaValidationEngine(),

      // 为 Core 提供代码生成服务
      codeGenerators: {
        prisma: new PrismaGenerator(),
        validators: new ValidatorGenerator(),
        mock: new MockGenerator(),
        types: new TypeScriptTypeGenerator()
      },

      // 为 Core 提供 CLI 命令
      cliCommands: this.getCLICommands()
    }
  }

  /**
   * 向下游包提供的服务
   */
  getDownstreamServices(): DownstreamServices {
    return {
      // 为 Auth 包提供用户相关实体
      authEntities: new SchemaAuthIntegration(),

      // 为 CRUD 包提供验证器和查询构建器
      crudIntegration: new SchemaCrudIntegration(this.registry),

      // 为 tRPC 包提供 API Schema
      apiSchemas: new SchemaApiIntegration(this.registry),

      // 为 UI 包提供表单配置
      uiConfigs: new SchemaUIIntegration(this.registry)
    }
  }

  /**
   * 依赖注入配置
   */
  configureDependencyInjection(container: DependencyContainer): void {
    // 注册 Schema 服务
    container.register('schema:registry', this.registry, { singleton: true })
    container.register('schema:validator', new SchemaValidationEngine())
    container.register('schema:generators', this.getCodeGenerators())

    // 注册集成服务
    container.register('schema:auth-integration', new SchemaAuthIntegration())
    container.register('schema:crud-integration', new SchemaCrudIntegration(this.registry))
    container.register('schema:api-integration', new SchemaApiIntegration(this.registry))
    container.register('schema:ui-integration', new SchemaUIIntegration(this.registry))
  }

  private getCLICommands(): CLICommand[] {
    return [
      {
        name: 'schema:list',
        description: 'List all defined entities',
        handler: this.listEntities.bind(this)
      },
      {
        name: 'schema:validate',
        description: 'Validate all entity definitions',
        handler: this.validateEntities.bind(this)
      },
      {
        name: 'schema:generate',
        description: 'Generate code from schemas',
        options: [
          { name: 'type', type: 'string', choices: ['prisma', 'validators', 'types', 'all'] },
          { name: 'output', type: 'string', description: 'Output directory' }
        ],
        handler: this.generateCode.bind(this)
      }
    ]
  }
}

export interface UpstreamServices {
  entityRegistry: EntityRegistry
  schemaValidator: SchemaValidationEngine
  codeGenerators: Record<string, CodeGenerator>
  cliCommands: CLICommand[]
}

export interface DownstreamServices {
  authEntities: SchemaAuthIntegration
  crudIntegration: SchemaCrudIntegration
  apiSchemas: SchemaApiIntegration
  uiConfigs: SchemaUIIntegration
}
```

### 数据流

#### Schema 数据流管理
```typescript
/**
 * Schema 数据流管理器
 * @description 管理 Schema 定义到代码生成的数据流
 */
export class SchemaDataFlowManager {
  private dataStreams = new Map<string, SchemaDataStream>()

  /**
   * 创建实体定义数据流
   * @param entityName - 实体名称
   * @returns 数据流实例
   */
  createEntityStream(entityName: string): SchemaDataStream {
    const stream = new SchemaDataStream(entityName, {
      bufferSize: 100,
      transform: this.transformEntityData.bind(this),
      validate: this.validateEntityData.bind(this)
    })

    this.dataStreams.set(entityName, stream)
    return stream
  }

  /**
   * 发布实体变更事件
   * @param entityName - 实体名称
   * @param changeType - 变更类型
   * @param data - 变更数据
   */
  publishEntityChange(entityName: string, changeType: EntityChangeType, data: any): void {
    const stream = this.dataStreams.get(entityName)
    if (stream) {
      stream.publish({
        type: changeType,
        entity: entityName,
        data,
        timestamp: Date.now()
      })
    }

    // 触发代码重新生成
    this.triggerCodeRegeneration(entityName, changeType)
  }

  /**
   * 订阅实体变更
   * @param entityName - 实体名称
   * @param subscriber - 订阅者
   */
  subscribeToEntityChanges(entityName: string, subscriber: EntityChangeSubscriber): void {
    const stream = this.dataStreams.get(entityName)
    if (stream) {
      stream.subscribe(subscriber)
    }
  }

  private transformEntityData(data: any): any {
    // 数据转换逻辑
    return {
      ...data,
      processedAt: Date.now(),
      version: this.getEntityVersion(data.entity)
    }
  }

  private validateEntityData(data: any): boolean {
    // 数据验证逻辑
    return data.entity && data.type && data.data
  }

  private triggerCodeRegeneration(entityName: string, changeType: EntityChangeType): void {
    // 根据变更类型决定需要重新生成的代码
    const regenerationTasks: string[] = []

    switch (changeType) {
      case 'created':
      case 'deleted':
        regenerationTasks.push('prisma', 'validators', 'types')
        break
      case 'updated':
        regenerationTasks.push('validators', 'types')
        break
      case 'field-added':
      case 'field-removed':
        regenerationTasks.push('prisma', 'validators', 'types')
        break
      case 'field-updated':
        regenerationTasks.push('validators')
        break
    }

    // 异步执行代码生成任务
    this.executeRegenerationTasks(entityName, regenerationTasks)
  }

  private async executeRegenerationTasks(entityName: string, tasks: string[]): Promise<void> {
    for (const task of tasks) {
      try {
        await this.executeGenerationTask(task, entityName)
      } catch (error) {
        console.error(`Code generation task ${task} failed for entity ${entityName}:`, error)
      }
    }
  }
}

export type EntityChangeType = 'created' | 'updated' | 'deleted' | 'field-added' | 'field-removed' | 'field-updated'

export interface EntityChangeSubscriber {
  onEntityChange(change: EntityChangeEvent): void
}

export interface EntityChangeEvent {
  type: EntityChangeType
  entity: string
  data: any
  timestamp: number
}

export class SchemaDataStream {
  private subscribers = new Set<EntityChangeSubscriber>()
  private buffer: EntityChangeEvent[] = []

  constructor(
    private entityName: string,
    private config: SchemaDataStreamConfig
  ) {}

  publish(event: EntityChangeEvent): void {
    // 验证数据
    if (this.config.validate && !this.config.validate(event)) {
      throw new Error(`Invalid data for entity ${this.entityName}`)
    }

    // 转换数据
    const transformedEvent = this.config.transform ? this.config.transform(event) : event

    // 添加到缓冲区
    this.buffer.push(transformedEvent)
    if (this.buffer.length > this.config.bufferSize) {
      this.buffer.shift() // 移除最旧的事件
    }

    // 通知订阅者
    for (const subscriber of this.subscribers) {
      try {
        subscriber.onEntityChange(transformedEvent)
      } catch (error) {
        console.error('Subscriber error:', error)
      }
    }
  }

  subscribe(subscriber: EntityChangeSubscriber): void {
    this.subscribers.add(subscriber)
  }

  unsubscribe(subscriber: EntityChangeSubscriber): void {
    this.subscribers.delete(subscriber)
  }
}

export interface SchemaDataStreamConfig {
  bufferSize: number
  transform?: (data: any) => any
  validate?: (data: any) => boolean
}
```

---

## 🔌 插件集成

### CLI 插件
```typescript
export class SchemaCLIPlugin implements Plugin {
  id = 'schema-cli'
  name = 'Schema CLI Plugin'
  version = '1.0.0'
  type = 'plugin' as const
  
  async activate(context: PluginContext): Promise<void> {
    // 注册 schema 相关命令
    context.services.cli.registerCommand({
      name: 'schema:list',
      description: 'List all defined entities',
      handler: this.listEntities.bind(this)
    })
    
    context.services.cli.registerCommand({
      name: 'schema:generate:prisma',
      description: 'Generate Prisma schema',
      handler: this.generatePrisma.bind(this)
    })
    
    context.services.cli.registerCommand({
      name: 'schema:generate:validators',
      description: 'Generate validators',
      handler: this.generateValidators.bind(this)
    })
    
    context.services.cli.registerCommand({
      name: 'schema:generate:mocks',
      description: 'Generate mock data',
      handler: this.generateMocks.bind(this)
    })
  }
  
  private async listEntities(): Promise<void> {
    const entities = await this.discoverEntities()
    console.table(entities.map(e => ({
      Name: e.name,
      Fields: Object.keys(e.fields).length,
      Table: e.options.tableName
    })))
  }
  
  private async generatePrisma(): Promise<void> {
    const entities = await this.discoverEntities()
    const generator = new PrismaGenerator()
    
    entities.forEach(entity => generator.addEntity(entity))
    const schema = generator.generate()
    
    await fs.writeFile('prisma/schema.prisma', schema)
    console.log('✅ Prisma schema generated')
  }
}
```

### 插件钩子
```typescript
export const schemaHooks = {
  // 实体定义钩子
  'schema:before-define-entity': 'defineEntity 调用前',
  'schema:after-define-entity': 'defineEntity 调用后',
  
  // 字段定义钩子
  'schema:before-define-field': 'defineField 调用前',
  'schema:after-define-field': 'defineField 调用后',
  
  // 代码生成钩子
  'schema:before-generate': '代码生成前',
  'schema:after-generate': '代码生成后',
  'schema:before-generate-prisma': 'Prisma 生成前',
  'schema:after-generate-prisma': 'Prisma 生成后',
  
  // 验证钩子
  'schema:before-validate': '验证前',
  'schema:after-validate': '验证后',
} as const
```

---

## 📊 性能约束

### 构建性能
- **DTS 构建时间**: < 10秒 (避免复杂类型推导)
- **代码生成时间**: < 5秒 (标准项目)
- **包大小**: < 1MB (压缩后)

### 运行时性能
- **实体定义**: < 1ms (单个实体)
- **验证器生成**: < 10ms (单个实体)
- **Mock 数据生成**: < 100ms (100条记录)

### 类型推导约束
- **泛型嵌套深度**: < 3层
- **禁止使用 z.any()**: 使用 z.unknown()
- **避免复杂联合类型**: 保持类型简单明确

---

## 🎯 最佳实践

### 推荐使用模式

#### 实体定义最佳实践
```typescript
/**
 * 标准实体定义模板
 * @description 推荐的实体定义模式和结构
 */

// ✅ 推荐：使用建造者模式定义复杂实体
const User = new EntityBuilder()
  .setName('User')
  .addPrimaryKey('id', { type: 'cuid' })
  .addField('email', defineField.string().email())
  .addField('username', defineField.string({ min: 3, max: 30 }))
  .addField('profile', defineField.object({
    firstName: defineField.string({ max: 50 }),
    lastName: defineField.string({ max: 50 }),
    avatar: defineField.string().url().optional(),
    bio: defineField.string({ max: 500 }).optional()
  }))
  .addTimestamps()
  .addSoftDelete()
  .setTableName('users')
  .setDisplayName('用户')
  .setDescription('系统用户实体')
  .build()

// ✅ 推荐：使用函数式定义简单实体
const Tag = defineEntity('Tag', {
  id: defineField.primary(),
  name: defineField.string({ min: 1, max: 50 }),
  color: defineField.string().regex(/^#[0-9A-F]{6}$/i),
  description: defineField.string({ max: 200 }).optional(),
  ...defineField.timestamps()
}, {
  tableName: 'tags',
  displayName: '标签'
})

// ✅ 推荐：定义关系实体
const Post = defineEntity('Post', {
  id: defineField.primary(),
  title: defineField.string({ min: 1, max: 200 }),
  content: defineField.textarea({ min: 1 }),
  status: defineField.enum(['draft', 'published', 'archived']),
  publishedAt: defineField.date().optional(),

  // 关系字段
  authorId: defineField.relation('User', { type: 'many-to-one' }),
  categoryId: defineField.relation('Category', { type: 'many-to-one' }),
  tags: defineField.relation('Tag', { type: 'many-to-many' }),

  ...defineField.timestamps(),
  ...defineField.softDelete()
}, {
  tableName: 'posts',
  displayName: '文章',
  indexes: [
    { fields: ['status', 'publishedAt'] },
    { fields: ['authorId'] },
    { fields: ['categoryId'] }
  ]
})
```

#### 字段定义最佳实践
```typescript
/**
 * 字段定义最佳实践
 * @description 展示如何正确定义各种类型的字段
 */

// ✅ 推荐：字符串字段的正确定义
const stringFields = {
  // 基础字符串
  name: defineField.string({ min: 2, max: 50 }),

  // 邮箱字段
  email: defineField.string().email(),

  // URL 字段
  website: defineField.string().url().optional(),

  // 枚举字段
  status: defineField.enum(['active', 'inactive', 'pending']),

  // 文本区域
  description: defineField.textarea({ max: 1000 }).optional(),

  // 正则验证
  phoneNumber: defineField.string().regex(/^\+?[1-9]\d{1,14}$/),

  // 自定义验证
  username: defineField.string({ min: 3, max: 30 })
    .regex(/^[a-zA-Z0-9_]+$/)
    .refine(async (value) => {
      // 异步验证用户名唯一性
      return await checkUsernameUnique(value)
    }, { message: 'Username already exists' })
}

// ✅ 推荐：数字字段的正确定义
const numberFields = {
  // 整数
  age: defineField.number({ min: 0, max: 120, int: true }),

  // 浮点数
  price: defineField.number({ min: 0, precision: 2 }),

  // 正数
  quantity: defineField.number({ positive: true, int: true }),

  // 评分
  rating: defineField.number({ min: 1, max: 5 })
}

// ✅ 推荐：复合字段的正确定义
const complexFields = {
  // 数组字段
  tags: defineField.array(defineField.string({ max: 50 })),

  // 对象字段
  address: defineField.object({
    street: defineField.string({ max: 100 }),
    city: defineField.string({ max: 50 }),
    zipCode: defineField.string({ max: 10 }),
    country: defineField.string({ max: 50 })
  }),

  // JSON 字段
  metadata: defineField.json().optional(),

  // 关系字段
  userId: defineField.relation('User', {
    type: 'many-to-one',
    foreignKey: 'user_id',
    onDelete: 'cascade'
  })
}
```

#### 代码生成最佳实践
```typescript
/**
 * 代码生成最佳实践
 * @description 展示如何正确使用代码生成功能
 */

// ✅ 推荐：使用配置驱动的代码生成
const generationConfig = {
  prisma: {
    outputPath: 'prisma/schema.prisma',
    provider: 'postgresql',
    previewFeatures: ['fullTextSearch', 'jsonProtocol']
  },
  validators: {
    outputPath: 'src/validators/index.ts',
    includeTypes: ['create', 'update', 'query'],
    exportFormat: 'named'
  },
  types: {
    outputPath: 'src/types/entities.ts',
    includeRelations: true,
    generateHelpers: true
  },
  mock: {
    outputPath: 'src/mocks/data.ts',
    recordCount: 100,
    locale: 'zh-CN'
  }
}

// ✅ 推荐：批量代码生成
async function generateAllCode() {
  const entities = registry.getAll()
  const context = new CodeGenerationContext(new PrismaGenerationStrategy())

  // 生成 Prisma Schema
  const prismaCode = await context.generate(entities, generationConfig.prisma)
  await fs.writeFile(generationConfig.prisma.outputPath, prismaCode)

  // 生成验证器
  context.setStrategy(new ValidatorGenerationStrategy())
  const validatorCode = await context.generate(entities, generationConfig.validators)
  await fs.writeFile(generationConfig.validators.outputPath, validatorCode)

  // 生成类型定义
  context.setStrategy(new TypeScriptGenerationStrategy())
  const typeCode = await context.generate(entities, generationConfig.types)
  await fs.writeFile(generationConfig.types.outputPath, typeCode)
}

// ✅ 推荐：增量代码生成
async function generateIncrementalCode(changedEntities: string[]) {
  const entities = changedEntities.map(name => registry.get(name)).filter(Boolean)

  if (entities.length === 0) return

  // 只重新生成受影响的代码
  const affectedGenerators = determineAffectedGenerators(entities)

  for (const generatorType of affectedGenerators) {
    await generateCodeForType(generatorType, entities)
  }
}
```

### 反模式警告

#### 常见错误模式
```typescript
/**
 * 反模式警告
 * @description 列出常见的错误使用模式和解决方案
 */

// ❌ 反模式 1: 过度复杂的类型定义
const badComplexType = defineField.object({
  level1: defineField.object({
    level2: defineField.object({
      level3: defineField.object({
        value: defineField.string()
      })
    })
  })
})

// ✅ 正确模式：扁平化结构
const goodFlatType = defineField.object({
  category: defineField.string(),
  subcategory: defineField.string(),
  item: defineField.string(),
  value: defineField.string()
})

// ❌ 反模式 2: 缺少验证的字段
const badFieldWithoutValidation = defineField.string() // 没有长度限制

// ✅ 正确模式：适当的验证
const goodFieldWithValidation = defineField.string({ min: 1, max: 255 })

// ❌ 反模式 3: 不一致的命名
const badNaming = defineEntity('user_profile', { // 应该使用 PascalCase
  user_name: defineField.string(), // 应该使用 camelCase
  Email: defineField.string().email() // 应该使用 camelCase
})

// ✅ 正确模式：一致的命名规范
const goodNaming = defineEntity('UserProfile', {
  userName: defineField.string(),
  email: defineField.string().email()
})

// ❌ 反模式 4: 忽略关系定义
const badRelation = defineEntity('Post', {
  authorId: defineField.string() // 应该明确定义为关系字段
})

// ✅ 正确模式：明确的关系定义
const goodRelation = defineEntity('Post', {
  authorId: defineField.relation('User', {
    type: 'many-to-one',
    foreignKey: 'author_id',
    onDelete: 'cascade'
  })
})

// ❌ 反模式 5: 硬编码的枚举值
const badEnum = defineField.enum(['1', '2', '3']) // 没有语义

// ✅ 正确模式：语义化的枚举值
const goodEnum = defineField.enum(['draft', 'published', 'archived'])

// ❌ 反模式 6: 忽略性能考虑
const badPerformance = defineEntity('LargeEntity', {
  // 大量字段没有索引
  field1: defineField.string(),
  field2: defineField.string(),
  // ... 50+ 字段
  searchableText: defineField.string({ max: 10000 }) // 没有全文索引
})

// ✅ 正确模式：考虑性能的设计
const goodPerformance = defineEntity('OptimizedEntity', {
  id: defineField.primary(),
  title: defineField.string({ max: 200 }),
  content: defineField.textarea(),
  status: defineField.enum(['active', 'inactive']),
  createdAt: defineField.date(),
  updatedAt: defineField.date()
}, {
  indexes: [
    { fields: ['status'] },
    { fields: ['createdAt'] },
    { fields: ['title'], type: 'fulltext' }
  ]
})
```

### 性能优化建议

#### Schema 设计性能优化
```typescript
/**
 * Schema 性能优化建议
 * @description 提供 Schema 设计的性能优化指导
 */

// 1. 合理使用索引
const optimizedEntity = defineEntity('Article', {
  id: defineField.primary(),
  title: defineField.string({ max: 200 }),
  content: defineField.textarea(),
  status: defineField.enum(['draft', 'published']),
  publishedAt: defineField.date().optional(),
  authorId: defineField.relation('User', { type: 'many-to-one' }),
  categoryId: defineField.relation('Category', { type: 'many-to-one' }),
  ...defineField.timestamps()
}, {
  indexes: [
    // 单字段索引
    { fields: ['status'] },
    { fields: ['publishedAt'] },
    { fields: ['authorId'] },

    // 复合索引
    { fields: ['status', 'publishedAt'] },
    { fields: ['authorId', 'status'] },

    // 全文索引
    { fields: ['title', 'content'], type: 'fulltext' }
  ]
})

// 2. 避免过深的嵌套
// ❌ 避免
const deepNested = defineField.object({
  level1: defineField.object({
    level2: defineField.object({
      level3: defineField.string()
    })
  })
})

// ✅ 推荐：使用扁平结构
const flatStructure = defineField.object({
  level1_level2_level3: defineField.string()
})

// 3. 合理使用关系
// ❌ 避免：过多的关系字段
const tooManyRelations = defineEntity('User', {
  id: defineField.primary(),
  posts: defineField.relation('Post', { type: 'one-to-many' }),
  comments: defineField.relation('Comment', { type: 'one-to-many' }),
  likes: defineField.relation('Like', { type: 'one-to-many' }),
  followers: defineField.relation('User', { type: 'many-to-many' }),
  following: defineField.relation('User', { type: 'many-to-many' }),
  // ... 更多关系
})

// ✅ 推荐：按需加载关系
const optimizedUser = defineEntity('User', {
  id: defineField.primary(),
  email: defineField.string().email(),
  name: defineField.string({ max: 100 }),
  ...defineField.timestamps()
  // 关系通过查询时按需加载
})

// 4. 字段长度优化
const optimizedFields = {
  // ✅ 合理的字段长度
  title: defineField.string({ max: 200 }), // 而不是无限制
  slug: defineField.string({ max: 100 }),
  description: defineField.string({ max: 500 }),

  // ✅ 使用适当的数字类型
  count: defineField.number({ int: true, min: 0 }), // 而不是浮点数
  price: defineField.number({ precision: 2, min: 0 }) // 明确精度
}

// 5. 缓存友好的设计
const cacheOptimized = defineEntity('CachedEntity', {
  id: defineField.primary(),
  // 经常查询的字段放在前面
  status: defineField.enum(['active', 'inactive']),
  name: defineField.string({ max: 100 }),
  // 不经常查询的字段放在后面
  metadata: defineField.json().optional(),
  largeText: defineField.textarea().optional()
}, {
  // 为经常查询的字段组合创建索引
  indexes: [
    { fields: ['status', 'name'] }
  ]
})
```

#### 代码生成性能优化
```typescript
/**
 * 代码生成性能优化
 * @description 优化代码生成的性能和效率
 */

// 1. 增量生成策略
export class IncrementalCodeGenerator {
  private lastGenerationTime = new Map<string, number>()
  private entityHashes = new Map<string, string>()

  async generateIfChanged(entity: EntityDefinition): Promise<boolean> {
    const currentHash = this.calculateEntityHash(entity)
    const lastHash = this.entityHashes.get(entity.name)

    if (currentHash === lastHash) {
      return false // 没有变化，跳过生成
    }

    await this.generateCode(entity)
    this.entityHashes.set(entity.name, currentHash)
    this.lastGenerationTime.set(entity.name, Date.now())

    return true
  }

  private calculateEntityHash(entity: EntityDefinition): string {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(entity))
      .digest('hex')
  }
}

// 2. 并行生成
export class ParallelCodeGenerator {
  async generateAll(entities: EntityDefinition[]): Promise<void> {
    const generators = [
      new PrismaGenerator(),
      new ValidatorGenerator(),
      new TypeScriptTypeGenerator(),
      new MockGenerator()
    ]

    // 并行执行所有生成器
    await Promise.all(
      generators.map(async (generator) => {
        const code = await generator.generate(entities)
        await this.writeToFile(generator.getOutputPath(), code)
      })
    )
  }
}

// 3. 缓存机制
export class CachedCodeGenerator {
  private cache = new Map<string, string>()

  async generate(entities: EntityDefinition[]): Promise<string> {
    const cacheKey = this.getCacheKey(entities)

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    const code = await this.doGenerate(entities)
    this.cache.set(cacheKey, code)

    return code
  }

  private getCacheKey(entities: EntityDefinition[]): string {
    return entities
      .map(e => `${e.name}:${this.calculateEntityHash(e)}`)
      .join('|')
  }
}
```

---

## 🧪 测试策略

### 测试覆盖率要求
- **总体覆盖率**: > 85% (Schema 驱动架构的高标准)
- **核心模块**: > 90% (defineField, defineEntity)
- **代码生成器**: > 85% (Prisma, Validators, Mock)
- **CLI 插件**: > 80%
- **集成接口**: > 80%

### 测试金字塔策略

#### 单元测试 (70%)
- **字段定义测试**: 每种字段类型的独立测试
- **实体定义测试**: 实体构建和验证的测试
- **代码生成器测试**: 各种生成器的输出测试
- **验证引擎测试**: Schema 验证逻辑的测试
- **工具函数测试**: 纯函数的输入输出测试

#### 集成测试 (20%)
- **端到端代码生成**: 从 Schema 定义到代码输出的完整流程
- **包间集成**: 与 Core、Auth、CRUD 包的集成测试
- **CLI 命令测试**: 命令行工具的完整功能测试
- **数据流测试**: Schema 变更到代码重新生成的流程测试

#### 端到端测试 (10%)
- **完整开发流程**: 从实体定义到应用运行的完整测试
- **性能基准测试**: 代码生成性能和类型推导性能测试
- **兼容性测试**: 不同版本间的兼容性验证

### 测试工具和方法

#### 测试框架配置
```typescript
/**
 * Jest 配置 - Schema 包专用
 */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/core/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
}
```

#### 测试辅助工具
```typescript
/**
 * Schema 测试工具类
 * @description 提供 Schema 测试的辅助工具
 */
export class SchemaTestUtils {
  /**
   * 创建测试实体注册表
   * @returns 测试用的实体注册表
   */
  static createTestRegistry(): EntityRegistry {
    return new EntityRegistry()
  }

  /**
   * 创建模拟实体
   * @param overrides - 实体属性覆盖
   * @returns 模拟实体定义
   */
  static createMockEntity(overrides?: Partial<EntityDefinition>): EntityDefinition {
    return defineEntity('TestEntity', {
      id: defineField.primary(),
      name: defineField.string({ min: 1, max: 100 }),
      email: defineField.string().email(),
      age: defineField.number({ min: 0, max: 120 }),
      isActive: defineField.boolean().default(true),
      ...defineField.timestamps()
    }, {
      tableName: 'test_entities',
      displayName: 'Test Entity',
      ...overrides
    })
  }

  /**
   * 验证生成的代码
   * @param code - 生成的代码
   * @param expectedPatterns - 期望的模式
   * @returns 验证结果
   */
  static validateGeneratedCode(code: string, expectedPatterns: string[]): boolean {
    return expectedPatterns.every(pattern => {
      const regex = new RegExp(pattern)
      return regex.test(code)
    })
  }

  /**
   * 比较实体定义
   * @param entity1 - 实体1
   * @param entity2 - 实体2
   * @returns 是否相等
   */
  static compareEntities(entity1: EntityDefinition, entity2: EntityDefinition): boolean {
    return JSON.stringify(entity1) === JSON.stringify(entity2)
  }

  /**
   * 创建测试数据
   * @param entity - 实体定义
   * @param count - 数据数量
   * @returns 测试数据数组
   */
  static createTestData(entity: EntityDefinition, count = 10): any[] {
    const generator = new MockGenerator()
    return generator.generateMockData(entity, count)
  }
}
```

### 具体测试用例
```typescript
describe('defineEntity', () => {
  test('should define entity with correct schema', () => {
    const User = defineEntity('User', {
      id: defineField.primary(),
      email: defineField.string().email(),
      name: defineField.string().min(2).max(50),
      age: defineField.number().min(0).max(120),
      isActive: defineField.boolean().default(true),
      ...defineField.timestamps(),
    })
    
    expect(User.name).toBe('User')
    expect(User.schema).toBeInstanceOf(z.ZodObject)
    expect(User.options.tableName).toBe('user')
  })
})

describe('PrismaGenerator', () => {
  test('should generate valid Prisma schema', () => {
    const generator = new PrismaGenerator()
    const User = defineEntity('User', {
      id: defineField.primary(),
      email: defineField.string().email(),
    })
    
    generator.addEntity(User)
    const schema = generator.generate()
    
    expect(schema).toContain('model User')
    expect(schema).toContain('id String @id')
    expect(schema).toContain('email String')
  })
})
```

---

## 🚀 开发指南

### 开发步骤
1. **第一天**: 核心类型定义和 defineField 实现
2. **第二天**: defineEntity 实现和装饰器系统
3. **第三天**: Prisma 生成器和验证器生成器
4. **第四天**: Mock 生成器和 CLI 插件
5. **第五天**: 测试完善和性能优化

### 验收标准
- [ ] defineField 和 defineEntity API 完整
- [ ] Prisma Schema 生成正确
- [ ] 验证器生成功能完整
- [ ] CLI 命令正常工作
- [ ] 测试覆盖率 > 85%
- [ ] DTS 构建时间 < 10秒
- [ ] 插件钩子系统可用

---

## 🤖 AI 集成支持

### AI-First 开发方法论的具体应用

#### 结构化 Schema 设计
```typescript
/**
 * AI 友好的 Schema 设计
 * @description 所有 Schema 定义都便于 AI 理解和处理
 */
export interface AIFriendlyEntityDefinition extends EntityDefinition {
  // 1. 明确的元数据
  metadata: {
    category: 'business' | 'system' | 'reference' | 'audit'
    domain: string
    complexity: 'simple' | 'medium' | 'complex'
    aiGenerated: boolean
    lastModified: string
  }

  // 2. 结构化的字段描述
  fields: Record<string, AIFriendlyField>

  // 3. 语义化的关系定义
  relations: {
    [key: string]: {
      type: RelationType
      target: string
      description: string
      businessRule?: string
    }
  }

  // 4. 业务规则描述
  businessRules: {
    validation: string[]
    constraints: string[]
    triggers: string[]
  }
}

export interface AIFriendlyField {
  schema: ZodSchema
  description: string
  businessMeaning: string
  examples: any[]
  constraints: string[]
  uiHints: {
    component: string
    label: string
    placeholder?: string
    helpText?: string
  }
}
```

#### AI 工具集成点
```typescript
/**
 * AI 工具集成接口
 * @description 为 AI 工具提供 Schema 相关的集成能力
 */
export interface SchemaAIIntegration {
  /**
   * 生成实体定义
   * @param description - 自然语言描述
   * @returns 生成的实体定义
   */
  generateEntityFromDescription(description: string): Promise<EntityDefinition>

  /**
   * 优化 Schema 设计
   * @param entity - 实体定义
   * @returns 优化建议
   */
  optimizeSchema(entity: EntityDefinition): Promise<SchemaOptimizationSuggestion[]>

  /**
   * 生成测试数据
   * @param entity - 实体定义
   * @param requirements - 测试需求
   * @returns 智能生成的测试数据
   */
  generateIntelligentTestData(entity: EntityDefinition, requirements: TestDataRequirements): Promise<any[]>

  /**
   * 验证业务规则
   * @param entity - 实体定义
   * @param businessContext - 业务上下文
   * @returns 验证结果和建议
   */
  validateBusinessRules(entity: EntityDefinition, businessContext: BusinessContext): Promise<BusinessRuleValidation>

  /**
   * 生成 API 文档
   * @param entities - 实体定义列表
   * @returns 智能生成的 API 文档
   */
  generateAPIDocumentation(entities: EntityDefinition[]): Promise<string>
}

// AI 工具集成实现
export class SchemaAIAssistant implements SchemaAIIntegration {
  constructor(private aiProvider: AIProvider) {}

  async generateEntityFromDescription(description: string): Promise<EntityDefinition> {
    const prompt = this.buildEntityGenerationPrompt(description)
    const response = await this.aiProvider.complete(prompt)

    return this.parseEntityFromAIResponse(response)
  }

  async optimizeSchema(entity: EntityDefinition): Promise<SchemaOptimizationSuggestion[]> {
    const analysis = this.analyzeSchemaStructure(entity)
    const prompt = this.buildOptimizationPrompt(entity, analysis)
    const response = await this.aiProvider.complete(prompt)

    return this.parseOptimizationSuggestions(response)
  }

  async generateIntelligentTestData(
    entity: EntityDefinition,
    requirements: TestDataRequirements
  ): Promise<any[]> {
    const prompt = this.buildTestDataPrompt(entity, requirements)
    const response = await this.aiProvider.complete(prompt)

    return this.parseTestDataFromResponse(response)
  }

  async validateBusinessRules(
    entity: EntityDefinition,
    businessContext: BusinessContext
  ): Promise<BusinessRuleValidation> {
    const prompt = this.buildBusinessRulePrompt(entity, businessContext)
    const response = await this.aiProvider.complete(prompt)

    return this.parseBusinessRuleValidation(response)
  }

  async generateAPIDocumentation(entities: EntityDefinition[]): Promise<string> {
    const prompt = this.buildDocumentationPrompt(entities)
    const response = await this.aiProvider.complete(prompt)

    return this.formatAPIDocumentation(response)
  }

  private buildEntityGenerationPrompt(description: string): string {
    return `
Based on the following description, generate a LinchKit entity definition:

Description: ${description}

Please provide:
1. Entity name (PascalCase)
2. Field definitions with appropriate types and validations
3. Relationships to other entities (if applicable)
4. Indexes for performance
5. Business rules and constraints

Use the defineEntity and defineField APIs from @linch-kit/schema.
Ensure the schema is type-safe and follows best practices.
`
  }

  private buildOptimizationPrompt(entity: EntityDefinition, analysis: any): string {
    return `
Analyze the following entity definition and provide optimization suggestions:

Entity: ${JSON.stringify(entity, null, 2)}
Current Analysis: ${JSON.stringify(analysis, null, 2)}

Please suggest improvements for:
1. Performance (indexes, field types)
2. Data integrity (constraints, validations)
3. Maintainability (naming, structure)
4. Scalability (relationships, normalization)
5. Security (sensitive data handling)

Provide specific, actionable recommendations.
`
  }
}

export interface SchemaOptimizationSuggestion {
  type: 'performance' | 'integrity' | 'maintainability' | 'scalability' | 'security'
  priority: 'high' | 'medium' | 'low'
  description: string
  currentIssue: string
  suggestedFix: string
  codeExample?: string
  impact: string
}

export interface TestDataRequirements {
  count: number
  scenarios: string[]
  constraints: Record<string, any>
  relationships: boolean
}

export interface BusinessContext {
  domain: string
  industry: string
  regulations: string[]
  businessRules: string[]
}

export interface BusinessRuleValidation {
  isValid: boolean
  violations: BusinessRuleViolation[]
  suggestions: string[]
  complianceScore: number
}

export interface BusinessRuleViolation {
  rule: string
  field: string
  severity: 'error' | 'warning' | 'info'
  description: string
  suggestedFix: string
}
```

#### AI 辅助开发工具
```typescript
/**
 * AI 辅助的 Schema 开发工具
 * @description 提供 AI 驱动的开发体验优化
 */
export class AISchemaDevTools {
  /**
   * 智能字段建议
   * @param entityName - 实体名称
   * @param existingFields - 已有字段
   * @returns 建议的字段列表
   */
  static async suggestFields(entityName: string, existingFields: string[]): Promise<FieldSuggestion[]> {
    const commonPatterns = this.getCommonEntityPatterns(entityName)
    const missingFields = commonPatterns.filter(field => !existingFields.includes(field.name))

    return missingFields.map(field => ({
      ...field,
      confidence: this.calculateConfidence(entityName, field),
      reasoning: this.generateReasoning(entityName, field)
    }))
  }

  /**
   * 智能关系推荐
   * @param entity - 当前实体
   * @param allEntities - 所有实体
   * @returns 推荐的关系
   */
  static async suggestRelationships(
    entity: EntityDefinition,
    allEntities: EntityDefinition[]
  ): Promise<RelationshipSuggestion[]> {
    const suggestions: RelationshipSuggestion[] = []

    for (const otherEntity of allEntities) {
      if (otherEntity.name === entity.name) continue

      const relationship = this.analyzeRelationshipPotential(entity, otherEntity)
      if (relationship.confidence > 0.7) {
        suggestions.push(relationship)
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * 智能验证规则生成
   * @param field - 字段定义
   * @param context - 业务上下文
   * @returns 建议的验证规则
   */
  static async generateValidationRules(
    field: any,
    context: ValidationContext
  ): Promise<ValidationRule[]> {
    const rules: ValidationRule[] = []

    // 基于字段类型的基础验证
    rules.push(...this.getTypeBasedValidations(field))

    // 基于业务上下文的验证
    rules.push(...this.getContextBasedValidations(field, context))

    // 基于安全考虑的验证
    rules.push(...this.getSecurityValidations(field))

    return rules
  }

  /**
   * 智能索引建议
   * @param entity - 实体定义
   * @param queryPatterns - 查询模式
   * @returns 建议的索引
   */
  static async suggestIndexes(
    entity: EntityDefinition,
    queryPatterns: QueryPattern[]
  ): Promise<IndexSuggestion[]> {
    const suggestions: IndexSuggestion[] = []

    // 分析查询模式
    for (const pattern of queryPatterns) {
      const index = this.analyzeQueryPattern(entity, pattern)
      if (index) {
        suggestions.push(index)
      }
    }

    // 添加常见的索引模式
    suggestions.push(...this.getCommonIndexPatterns(entity))

    return this.deduplicateIndexes(suggestions)
  }

  /**
   * 代码质量分析
   * @param entity - 实体定义
   * @returns 质量分析报告
   */
  static async analyzeCodeQuality(entity: EntityDefinition): Promise<QualityAnalysisReport> {
    const issues: QualityIssue[] = []

    // 命名规范检查
    issues.push(...this.checkNamingConventions(entity))

    // 结构复杂度检查
    issues.push(...this.checkStructuralComplexity(entity))

    // 性能影响检查
    issues.push(...this.checkPerformanceImpact(entity))

    // 安全性检查
    issues.push(...this.checkSecurityConcerns(entity))

    return {
      score: this.calculateQualityScore(issues),
      issues,
      suggestions: this.generateImprovementSuggestions(issues)
    }
  }

  private static getCommonEntityPatterns(entityName: string): FieldPattern[] {
    const patterns: Record<string, FieldPattern[]> = {
      'User': [
        { name: 'email', type: 'string', validation: 'email', required: true },
        { name: 'firstName', type: 'string', maxLength: 50 },
        { name: 'lastName', type: 'string', maxLength: 50 },
        { name: 'avatar', type: 'string', validation: 'url', optional: true },
        { name: 'isActive', type: 'boolean', default: true }
      ],
      'Post': [
        { name: 'title', type: 'string', maxLength: 200, required: true },
        { name: 'content', type: 'text', required: true },
        { name: 'status', type: 'enum', values: ['draft', 'published', 'archived'] },
        { name: 'publishedAt', type: 'date', optional: true },
        { name: 'authorId', type: 'relation', target: 'User' }
      ],
      'Product': [
        { name: 'name', type: 'string', maxLength: 100, required: true },
        { name: 'description', type: 'text' },
        { name: 'price', type: 'number', precision: 2, min: 0 },
        { name: 'sku', type: 'string', unique: true },
        { name: 'inStock', type: 'boolean', default: true }
      ]
    }

    return patterns[entityName] || []
  }
}

export interface FieldSuggestion {
  name: string
  type: string
  validation?: string
  confidence: number
  reasoning: string
  codeExample: string
}

export interface RelationshipSuggestion {
  targetEntity: string
  relationType: RelationType
  confidence: number
  reasoning: string
  foreignKey?: string
}

export interface ValidationRule {
  type: string
  description: string
  implementation: string
  reasoning: string
}

export interface IndexSuggestion {
  fields: string[]
  type: 'btree' | 'hash' | 'fulltext'
  reasoning: string
  estimatedImpact: string
}

export interface QualityAnalysisReport {
  score: number
  issues: QualityIssue[]
  suggestions: string[]
}

export interface QualityIssue {
  type: 'naming' | 'structure' | 'performance' | 'security'
  severity: 'error' | 'warning' | 'info'
  description: string
  location: string
  suggestedFix: string
}
```

### AI 工具集成点

#### 自然语言到 Schema 转换
- **需求描述解析**: 将自然语言需求转换为结构化的实体定义
- **业务规则提取**: 从业务描述中提取验证规则和约束
- **关系识别**: 自动识别实体间的关系和依赖
- **字段类型推断**: 基于描述智能推断字段类型和验证规则

#### 智能代码生成
- **上下文感知生成**: 基于项目上下文生成相关的代码
- **最佳实践应用**: 自动应用行业最佳实践和设计模式
- **性能优化**: 生成性能优化的 Schema 和索引
- **安全增强**: 自动添加安全相关的验证和约束

#### 开发体验优化
- **智能补全**: 在定义 Schema 时提供智能建议
- **错误预防**: 在开发阶段预防常见错误
- **重构建议**: 提供 Schema 重构和优化建议
- **文档生成**: 自动生成详细的 API 文档和使用指南

### 开发工作流集成

#### AI 驱动的开发流程
1. **需求分析**: AI 分析业务需求并生成初始 Schema
2. **迭代优化**: 基于反馈持续优化 Schema 设计
3. **代码生成**: 自动生成高质量的代码和配置
4. **质量检查**: AI 检查代码质量和潜在问题
5. **文档同步**: 自动更新文档和注释
6. **测试生成**: 生成全面的测试用例

#### AI 友好的错误处理
```typescript
/**
 * AI 友好的 Schema 错误处理
 * @description 提供结构化的错误信息，便于 AI 分析和处理
 */
export class AIFriendlySchemaError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context: SchemaErrorContext,
    public readonly suggestions: string[] = [],
    public readonly relatedDocs: string[] = [],
    public readonly autoFixable: boolean = false
  ) {
    super(message)
    this.name = 'AIFriendlySchemaError'
  }

  /**
   * 转换为 AI 可处理的格式
   * @returns AI 友好的错误描述
   */
  toAIFormat(): AISchemaErrorFormat {
    return {
      type: 'schema-error',
      code: this.code,
      message: this.message,
      context: this.context,
      suggestions: this.suggestions,
      relatedDocs: this.relatedDocs,
      autoFixable: this.autoFixable,
      timestamp: new Date().toISOString(),
      stackTrace: this.stack
    }
  }

  /**
   * 生成自动修复代码
   * @returns 修复代码或 null
   */
  generateAutoFix(): string | null {
    if (!this.autoFixable) return null

    return this.context.autoFixGenerator?.(this.context) || null
  }
}

export interface SchemaErrorContext {
  entityName?: string
  fieldName?: string
  errorLocation: string
  currentValue: any
  expectedValue?: any
  autoFixGenerator?: (context: SchemaErrorContext) => string
}

export interface AISchemaErrorFormat {
  type: 'schema-error'
  code: string
  message: string
  context: SchemaErrorContext
  suggestions: string[]
  relatedDocs: string[]
  autoFixable: boolean
  timestamp: string
  stackTrace?: string
}
```

---

**重要提醒**: @linch-kit/schema 是 Schema 驱动架构的核心，其 API 设计和性能直接影响整个系统的开发体验。必须特别注意类型推导的性能和 API 的易用性。所有设计都应该遵循 AI-First 原则，确保 AI 工具能够有效理解和处理 Schema 定义，为开发者提供智能化的开发体验。
