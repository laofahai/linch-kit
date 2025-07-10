/**
 * LinchKit AI Extractors
 *
 * 统一的数据提取器导出
 */

export { BaseExtractor } from './base-extractor.js'
export { PackageExtractor } from './package-extractor.js'
export { DocumentExtractor } from './document-extractor.js'
export { SchemaExtractor } from './schema-extractor.js'
export { FunctionExtractor } from './function-extractor.js'
export { ImportExtractor } from './import-extractor.js'
export { CorrelationAnalyzer } from './correlation-analyzer.js'

// 提取器注册表
import type { IExtractor } from '../types/index.js'

import { PackageExtractor } from './package-extractor.js'
import { DocumentExtractor } from './document-extractor.js'
import { SchemaExtractor } from './schema-extractor.js'
import { FunctionExtractor } from './function-extractor.js'
import { ImportExtractor } from './import-extractor.js'

/**
 * 可用的提取器映射
 */
export const AVAILABLE_EXTRACTORS = {
  package: PackageExtractor,
  document: DocumentExtractor,
  schema: SchemaExtractor,
  function: FunctionExtractor,
  import: ImportExtractor,
  // api: APIExtractor,            // 待实现
  // database: DatabaseExtractor   // 待实现
} as const

export type ExtractorType = keyof typeof AVAILABLE_EXTRACTORS

/**
 * 创建提取器实例
 */
export function createExtractor(type: ExtractorType): IExtractor {
  const ExtractorClass = AVAILABLE_EXTRACTORS[type]
  if (!ExtractorClass) {
    throw new Error(`未知的提取器类型: ${type}`)
  }
  return new ExtractorClass()
}

/**
 * 获取所有可用的提取器类型
 */
export function getAvailableExtractorTypes(): ExtractorType[] {
  return Object.keys(AVAILABLE_EXTRACTORS) as ExtractorType[]
}
