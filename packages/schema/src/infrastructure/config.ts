/**
 * @linch-kit/schema 配置管理
 * 
 * Schema包的配置定义和默认值
 * 
 * @module infrastructure/config
 */

/**
 * Schema包配置接口
 * 定义Schema包的所有配置选项
 */
export interface SchemaConfig {
  /** 输入目录 */
  input?: string
  /** 输出目录 */
  output?: string
  /** 启用的生成器 */
  generators?: string[]
  /** 是否启用TypeScript */
  typescript?: boolean
  /** 是否启用装饰器 */
  decorators?: boolean
  /** 是否启用示例 */
  examples?: boolean
  /** 是否启用监听模式 */
  watch?: boolean
  /** 是否清理输出目录 */
  clean?: boolean
}

/**
 * 默认Schema配置
 * 提供合理的默认值
 */
export const defaultSchemaConfig: SchemaConfig = {
  input: './src/schema',
  output: './generated',
  generators: ['typescript', 'prisma'],
  typescript: true,
  decorators: false,
  examples: false,
  watch: false,
  clean: false
}
