/**
 * @ai-context 通用类型定义
 * @ai-purpose 定义整个 core 包共享的通用类型
 * @ai-reusable 这些类型可以在多个模块中使用
 */

/**
 * @ai-type 日志级别类型
 * @ai-purpose 定义日志输出的详细程度
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * @ai-type AI 标签类型
 * @ai-purpose 用于 AI 系统理解和分类功能
 */
export type AITag = 
  | 'generation'   // 代码生成
  | 'validation'   // 验证相关
  | 'migration'    // 迁移相关
  | 'testing'      // 测试相关
  | 'deployment'   // 部署相关
  | 'monitoring'   // 监控相关
  | 'security'     // 安全相关
  | 'performance'  // 性能相关
  | 'ui'           // 用户界面
  | 'api'          // API 相关
  | 'database'     // 数据库相关
  | 'auth'         // 认证相关
  | 'config'       // 配置相关
  | 'cli'          // 命令行相关
  | 'plugin'       // 插件相关

/**
 * @ai-interface 可选配置接口
 * @ai-purpose 定义可选配置的通用结构
 */
export interface OptionalConfig {
  /** @ai-field 是否启用 */
  enabled?: boolean
  
  /** @ai-field 配置选项 */
  options?: Record<string, any>
}

/**
 * @ai-interface 带版本的对象
 * @ai-purpose 为对象添加版本信息
 */
export interface Versioned {
  /** @ai-field 版本号 */
  version: string
}

/**
 * @ai-interface 带名称的对象
 * @ai-purpose 为对象添加名称标识
 */
export interface Named {
  /** @ai-field 名称 */
  name: string
  
  /** @ai-field 描述 */
  description?: string
}

/**
 * @ai-interface 带时间戳的对象
 * @ai-purpose 为对象添加时间戳信息
 */
export interface Timestamped {
  /** @ai-field 创建时间 */
  createdAt: Date
  
  /** @ai-field 更新时间 */
  updatedAt: Date
}

/**
 * @ai-interface 异步操作结果
 * @ai-purpose 标准化异步操作的返回值
 */
export interface AsyncResult<T = any, E = Error> {
  /** @ai-field 是否成功 */
  success: boolean
  
  /** @ai-field 结果数据（成功时） */
  data?: T
  
  /** @ai-field 错误信息（失败时） */
  error?: E
  
  /** @ai-field 操作耗时（毫秒） */
  duration?: number
}

/**
 * @ai-interface 分页参数
 * @ai-purpose 定义分页查询的参数
 */
export interface PaginationParams {
  /** @ai-field 页码，从 1 开始 */
  page?: number
  
  /** @ai-field 每页大小 */
  pageSize?: number
  
  /** @ai-field 排序字段 */
  sortBy?: string
  
  /** @ai-field 排序方向 */
  sortOrder?: 'asc' | 'desc'
}

/**
 * @ai-interface 分页结果
 * @ai-purpose 定义分页查询的结果
 */
export interface PaginatedResult<T> {
  /** @ai-field 数据列表 */
  items: T[]
  
  /** @ai-field 总数量 */
  total: number
  
  /** @ai-field 当前页码 */
  page: number
  
  /** @ai-field 每页大小 */
  pageSize: number
  
  /** @ai-field 总页数 */
  totalPages: number
  
  /** @ai-field 是否有下一页 */
  hasNext: boolean
  
  /** @ai-field 是否有上一页 */
  hasPrev: boolean
}

/**
 * @ai-interface 键值对
 * @ai-purpose 通用的键值对结构
 */
export interface KeyValue<K = string, V = any> {
  /** @ai-field 键 */
  key: K
  
  /** @ai-field 值 */
  value: V
}

/**
 * @ai-interface 选项项
 * @ai-purpose 用于选择器、下拉框等的选项
 */
export interface Option<T = any> {
  /** @ai-field 显示标签 */
  label: string
  
  /** @ai-field 选项值 */
  value: T
  
  /** @ai-field 是否禁用 */
  disabled?: boolean
  
  /** @ai-field 描述信息 */
  description?: string
}

/**
 * @ai-interface 进度信息
 * @ai-purpose 描述操作的进度状态
 */
export interface Progress {
  /** @ai-field 当前进度（0-100） */
  percentage: number
  
  /** @ai-field 当前步骤 */
  current: number
  
  /** @ai-field 总步骤数 */
  total: number
  
  /** @ai-field 当前步骤描述 */
  message?: string
  
  /** @ai-field 是否完成 */
  completed: boolean
}

/**
 * @ai-type 环境类型
 * @ai-purpose 定义应用运行环境
 */
export type Environment = 'development' | 'production' | 'test' | 'staging'

/**
 * @ai-type 数据库提供商
 * @ai-purpose 定义支持的数据库类型
 */
export type DatabaseProvider = 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver'

/**
 * @ai-type 深度可选
 * @ai-purpose 将对象的所有属性（包括嵌套）设为可选
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * @ai-type 深度必需
 * @ai-purpose 将对象的所有属性（包括嵌套）设为必需
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

/**
 * @ai-type 提取函数参数类型
 * @ai-purpose 提取函数的参数类型
 */
export type ExtractArgs<T> = T extends (...args: infer A) => any ? A : never

/**
 * @ai-type 提取函数返回类型
 * @ai-purpose 提取函数的返回类型
 */
export type ExtractReturn<T> = T extends (...args: any[]) => infer R ? R : never

/**
 * @ai-type 提取 Promise 类型
 * @ai-purpose 提取 Promise 包装的类型
 */
export type ExtractPromise<T> = T extends Promise<infer U> ? U : T

/**
 * @ai-type 字符串字面量联合转数组
 * @ai-purpose 将字符串字面量联合类型转换为数组类型
 */
export type UnionToArray<T> = T extends any ? T[] : never

/**
 * @ai-interface 可序列化对象
 * @ai-purpose 定义可以安全序列化的对象类型
 */
export type Serializable = 
  | string 
  | number 
  | boolean 
  | null 
  | undefined
  | Serializable[] 
  | { [key: string]: Serializable }

/**
 * @ai-interface 构造函数类型
 * @ai-purpose 定义类的构造函数类型
 */
export type Constructor<T = {}> = new (...args: any[]) => T

/**
 * @ai-interface 抽象构造函数类型
 * @ai-purpose 定义抽象类的构造函数类型
 */
export type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T

/**
 * @ai-interface 混入类型
 * @ai-purpose 用于类混入模式的类型定义
 */
export type Mixin<T extends Constructor> = T & Constructor
