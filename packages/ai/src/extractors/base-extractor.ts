/**
 * Base Extractor
 * 
 * 所有数据提取器的基类，提供统一的接口和公共功能
 */

import { isAbsolute, normalize } from 'path'

import { createLogger } from '@linch-kit/core/server'

import type { 
  IExtractor, 
  ExtractionResult, 
  GraphNode, 
  GraphRelationship,
  NodeType,
  RelationType,
  Logger
} from '../types/index.js'

import { ExtractorConfig } from './extractor-config.js'


/**
 * 抽象基础提取器
 */
export abstract class BaseExtractor<T = unknown> implements IExtractor<T> {
  protected logger: Logger
  protected config: ExtractorConfig
  
  constructor(public readonly name: string) {
    this.logger = createLogger({ name: `ai:extractor:${name}` })
    this.config = ExtractorConfig.getInstance()
  }

  /**
   * 执行数据提取 - 模板方法
   */
  async extract(): Promise<ExtractionResult<T>> {
    const startTime = Date.now()
    this.logger.info(`开始执行 ${this.name} 数据提取...`)
    
    try {
      // 1. 预处理
      await this.preExtract()
      
      // 2. 提取原始数据
      const rawData = await this.extractRawData()
      
      // 3. 验证数据
      if (!this.validate(rawData)) {
        throw new Error(`${this.name} 数据验证失败`)
      }
      
      // 4. 转换为图数据
      const { nodes, relationships } = await this.transformToGraph(rawData)
      
      // 5. 后处理
      await this.postExtract()
      
      const endTime = Date.now()
      const metadata = {
        extractor_name: this.name,
        extraction_time: new Date().toISOString(),
        source_count: this.getSourceCount(rawData),
        node_count: nodes.length,
        relationship_count: relationships.length
      }
      
      this.logger.info(`${this.name} 数据提取完成`, {
        duration: endTime - startTime,
        nodeCount: nodes.length,
        relationshipCount: relationships.length
      })
      
      return {
        nodes,
        relationships,
        metadata,
        raw_data: rawData
      }
    } catch (error) {
      this.logger.error(`${this.name} 数据提取失败`, error instanceof Error ? error : undefined, { originalError: error })
      throw error
    }
  }

  /**
   * 提取原始数据 - 子类必须实现
   */
  protected abstract extractRawData(): Promise<T>

  /**
   * 转换为图数据格式 - 子类必须实现
   */
  protected abstract transformToGraph(rawData: T): Promise<{
    nodes: GraphNode[]
    relationships: GraphRelationship[]
  }>

  /**
   * 验证数据 - 子类可以重写
   */
  validate(data: T): boolean {
    return data !== null && data !== undefined
  }

  /**
   * 获取源数据数量 - 子类可以重写
   */
  protected getSourceCount(rawData: T): number {
    if (Array.isArray(rawData)) {
      return rawData.length
    }
    return 1
  }

  /**
   * 预处理钩子 - 子类可以重写
   */
  protected async preExtract(): Promise<void> {
    // 默认空实现
  }

  /**
   * 后处理钩子 - 子类可以重写
   */
  protected async postExtract(): Promise<void> {
    // 默认空实现
  }

  /**
   * 获取提取器支持的节点类型 - 子类必须实现
   */
  abstract getNodeType(): NodeType[]

  /**
   * 获取提取器支持的关系类型 - 子类必须实现
   */
  abstract getRelationTypes(): RelationType[]

  /**
   * 生成节点ID的辅助方法
   */
  protected generateNodeId(type: string, name: string): string {
    return `${type}:${name.replace(/[^a-zA-Z0-9-_]/g, '_')}`
  }

  /**
   * 生成关系ID的辅助方法
   */
  protected generateRelationshipId(type: string, source: string, target: string): string {
    return `${type.toLowerCase()}:${source.replace(/[^a-zA-Z0-9-_]/g, '_')}_${target.replace(/[^a-zA-Z0-9-_]/g, '_')}`
  }

  /**
   * 创建标准元数据
   */
  protected createMetadata(sourceFile?: string, packageName?: string) {
    return {
      created_at: new Date().toISOString(),
      source_file: sourceFile ? this.normalizeFilePath(sourceFile) : undefined,
      package: packageName,
      confidence: 1.0
    }
  }

  /**
   * 规范化文件路径 - 确保返回相对路径，支持跨平台
   */
  protected normalizeFilePath(filePath: string): string {
    // 标准化路径格式（处理反斜杠等）
    const normalizedPath = normalize(filePath)
    
    // 如果是绝对路径，转换为相对路径
    if (isAbsolute(normalizedPath)) {
      return this.config.getRelativePath(normalizedPath)
    }
    
    // 如果已经是相对路径，直接返回
    return normalizedPath
  }

  /**
   * 获取项目根目录
   */
  protected getProjectRoot(): string {
    return this.config.getProjectRoot()
  }

  /**
   * 获取工作目录
   */
  protected getWorkingDirectory(): string {
    return this.config.getWorkingDirectory()
  }

  /**
   * 解析相对于项目根目录的路径
   */
  protected resolveFromProject(relativePath: string): string {
    return this.config.resolveFromProject(relativePath)
  }

  /**
   * 检查路径是否应该被排除
   */
  protected shouldExcludePath(path: string): boolean {
    return this.config.shouldExclude(path)
  }

  /**
   * 检查文件扩展名是否支持
   */
  protected isSupportedExtension(extension: string): boolean {
    return this.config.isSupportedExtension(extension)
  }
}