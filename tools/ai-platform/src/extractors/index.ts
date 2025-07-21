/**
 * LinchKit AI Extractors
 *
 * 统一的数据提取器导出
 */

export { BaseExtractor } from './base-extractor'
export { PackageExtractor } from './package-extractor'
export { DocumentExtractor } from './document-extractor'
export { SchemaExtractor } from './schema-extractor'
export { FunctionExtractor } from './function-extractor'
export { ImportExtractor } from './import-extractor'
export { CorrelationAnalyzer } from './correlation-analyzer'

// 提取器注册表
import type { IExtractor } from '../types/index'

import { PackageExtractor } from './package-extractor'
import { DocumentExtractor } from './document-extractor'
import { SchemaExtractor } from './schema-extractor'
import { FunctionExtractor } from './function-extractor'
import { ImportExtractor } from './import-extractor'

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
