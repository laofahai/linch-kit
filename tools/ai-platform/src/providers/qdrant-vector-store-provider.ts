/**
 * Qdrant Vector Store Provider
 * 基于语义相似性的向量搜索集成
 * 
 * 提供代码语义理解和相似性检索功能
 * 与Graph RAG协同工作，构建混合检索系统
 */

import { QdrantClient } from '@qdrant/js-client-rest'
import { createLogger } from '@linch-kit/core'

const logger = createLogger('qdrant-vector-store')

export interface QdrantConfig {
  url: string
  apiKey?: string
  collectionName?: string
  vectorSize?: number
  distance?: 'Cosine' | 'Euclidean' | 'Dot'
  timeout?: number
}

export interface VectorSearchRequest {
  query: string
  queryVector?: number[]
  limit?: number
  scoreThreshold?: number
  filter?: Record<string, any>
  withPayload?: boolean
  withVector?: boolean
}

export interface VectorSearchResult {
  id: string | number
  score: number
  payload?: Record<string, any>
  vector?: number[]
}

export interface VectorStoreResponse {
  results: VectorSearchResult[]
  success: boolean
  error?: string
  executionTime: number
  metadata?: {
    collection: string
    queryType: 'semantic' | 'hybrid'
    totalFound: number
  }
}

export interface DocumentEmbedding {
  id: string
  vector: number[]
  payload: {
    content: string
    type: 'code' | 'doc' | 'comment' | 'schema'
    filePath?: string
    functionName?: string
    className?: string
    lineNumber?: number
    package?: string
    description?: string
    keywords?: string[]
    lastUpdated?: string
  }
}

export class QdrantVectorStoreProvider {
  private client: QdrantClient
  private config: QdrantConfig
  private providerName = 'qdrant-vector-store'
  private collectionName: string

  constructor(config: QdrantConfig) {
    if (!config.url) {
      throw new Error('Qdrant URL is required')
    }

    this.config = {
      collectionName: 'linchkit-code-vectors',
      vectorSize: 1536, // OpenAI embedding size
      distance: 'Cosine',
      timeout: 30000,
      ...config
    }

    this.collectionName = this.config.collectionName!

    // 初始化 Qdrant 客户端
    this.client = new QdrantClient({
      url: this.config.url,
      apiKey: this.config.apiKey,
      timeout: this.config.timeout
    })

    logger.info('Qdrant Vector Store Provider 已初始化', {
      url: this.config.url,
      collection: this.collectionName,
      vectorSize: this.config.vectorSize
    })
  }

  /**
   * 初始化向量集合
   */
  async initializeCollection(): Promise<void> {
    try {
      logger.info('检查Qdrant集合状态...', { collection: this.collectionName })

      // 检查集合是否存在
      const collections = await this.client.getCollections()
      const collectionExists = collections.collections.some(
        col => col.name === this.collectionName
      )

      if (!collectionExists) {
        logger.info('创建新的Qdrant集合...', {
          collection: this.collectionName,
          vectorSize: this.config.vectorSize,
          distance: this.config.distance
        })

        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.config.vectorSize!,
            distance: this.config.distance!
          },
          optimizers_config: {
            default_segment_number: 2,
            memmap_threshold: 20000
          },
          replication_factor: 1
        })

        // 创建索引
        await this.client.createFieldIndex(this.collectionName, {
          field_name: 'type',
          field_schema: 'keyword'
        })

        await this.client.createFieldIndex(this.collectionName, {
          field_name: 'package',
          field_schema: 'keyword'
        })

        logger.info('Qdrant集合创建成功')
      } else {
        logger.info('Qdrant集合已存在，跳过创建')
      }

      // 获取集合信息
      const collectionInfo = await this.client.getCollection(this.collectionName)
      logger.info('Qdrant集合信息', {
        pointsCount: collectionInfo.points_count,
        vectorsCount: collectionInfo.vectors_count,
        status: collectionInfo.status
      })

    } catch (error) {
      logger.error('Qdrant集合初始化失败', error instanceof Error ? error : undefined)
      throw error
    }
  }

  /**
   * 语义搜索
   */
  async search(request: VectorSearchRequest): Promise<VectorStoreResponse> {
    const startTime = Date.now()

    try {
      logger.info('执行向量语义搜索', {
        hasQuery: !!request.query,
        hasVector: !!request.queryVector,
        limit: request.limit || 10
      })

      if (!request.queryVector && !request.query) {
        throw new Error('查询向量或查询文本是必需的')
      }

      // 如果没有提供向量，需要先生成embedding
      let queryVector = request.queryVector
      if (!queryVector && request.query) {
        // TODO: 集成embedding生成器 (OpenAI/HuggingFace)
        throw new Error('需要实现文本到向量的转换功能')
      }

      const searchRequest = {
        vector: queryVector!,
        limit: request.limit || 10,
        score_threshold: request.scoreThreshold,
        with_payload: request.withPayload !== false,
        with_vector: request.withVector || false,
        filter: request.filter
      }

      const searchResult = await this.client.search(this.collectionName, searchRequest)
      const executionTime = Date.now() - startTime

      const results: VectorSearchResult[] = searchResult.map(point => ({
        id: point.id,
        score: point.score || 0,
        payload: point.payload,
        vector: point.vector
      }))

      logger.info('向量搜索完成', {
        resultCount: results.length,
        executionTime,
        bestScore: results[0]?.score
      })

      return {
        results,
        success: true,
        executionTime,
        metadata: {
          collection: this.collectionName,
          queryType: 'semantic',
          totalFound: results.length
        }
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      logger.error('向量搜索失败', error instanceof Error ? error : undefined, {
        executionTime,
        request: {
          hasQuery: !!request.query,
          hasVector: !!request.queryVector,
          limit: request.limit
        }
      })

      return {
        results: [],
        success: false,
        error: errorMessage,
        executionTime,
        metadata: {
          collection: this.collectionName,
          queryType: 'semantic',
          totalFound: 0
        }
      }
    }
  }

  /**
   * 批量插入文档向量
   */
  async upsertDocuments(documents: DocumentEmbedding[]): Promise<void> {
    try {
      logger.info('批量插入文档向量', { count: documents.length })

      const points = documents.map(doc => ({
        id: doc.id,
        vector: doc.vector,
        payload: doc.payload
      }))

      await this.client.upsert(this.collectionName, {
        wait: true,
        points
      })

      logger.info('文档向量插入成功', { count: documents.length })

    } catch (error) {
      logger.error('文档向量插入失败', error instanceof Error ? error : undefined)
      throw error
    }
  }

  /**
   * 删除文档向量
   */
  async deleteDocuments(ids: (string | number)[]): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        points: ids
      })

      logger.info('文档向量删除成功', { count: ids.length })

    } catch (error) {
      logger.error('文档向量删除失败', error instanceof Error ? error : undefined)
      throw error
    }
  }

  /**
   * 获取集合统计信息
   */
  async getStats(): Promise<{
    pointsCount: number
    vectorsCount?: number
    indexedVectorsCount?: number
    status: string
  }> {
    try {
      const info = await this.client.getCollection(this.collectionName)
      return {
        pointsCount: info.points_count || 0,
        vectorsCount: info.vectors_count,
        indexedVectorsCount: info.indexed_vectors_count,
        status: info.status
      }
    } catch (error) {
      logger.error('获取集合统计失败', error instanceof Error ? error : undefined)
      throw error
    }
  }

  /**
   * 清空集合
   */
  async clearCollection(): Promise<void> {
    try {
      logger.warn('清空向量集合...', { collection: this.collectionName })

      await this.client.delete(this.collectionName, {
        wait: true,
        filter: {} // 删除所有点
      })

      logger.info('向量集合已清空')
    } catch (error) {
      logger.error('清空向量集合失败', error instanceof Error ? error : undefined)
      throw error
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const collections = await this.client.getCollections()
      return collections.collections.some(col => col.name === this.collectionName)
    } catch (error) {
      logger.error('Qdrant健康检查失败', error instanceof Error ? error : undefined)
      return false
    }
  }

  getProviderName(): string {
    return this.providerName
  }

  getCollectionName(): string {
    return this.collectionName
  }

  /**
   * 混合搜索 - 结合向量相似性和元数据过滤
   */
  async hybridSearch(
    queryVector: number[],
    filters: {
      type?: string[]
      package?: string[]
      filePath?: string
      keywords?: string[]
    },
    limit: number = 10
  ): Promise<VectorStoreResponse> {
    const startTime = Date.now()

    try {
      // 构建过滤条件
      const filter: any = {}
      
      if (filters.type && filters.type.length > 0) {
        filter.type = { any: filters.type }
      }
      
      if (filters.package && filters.package.length > 0) {
        filter.package = { any: filters.package }
      }
      
      if (filters.filePath) {
        filter.filePath = { match: { value: filters.filePath } }
      }
      
      if (filters.keywords && filters.keywords.length > 0) {
        filter.keywords = { any: filters.keywords }
      }

      return await this.search({
        query: '', // 使用向量搜索
        queryVector,
        limit,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        withPayload: true,
        scoreThreshold: 0.7
      })

    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      return {
        results: [],
        success: false,
        error: errorMessage,
        executionTime,
        metadata: {
          collection: this.collectionName,
          queryType: 'hybrid',
          totalFound: 0
        }
      }
    }
  }
}

// 工厂函数
export function createQdrantVectorStoreProvider(config: QdrantConfig): QdrantVectorStoreProvider {
  return new QdrantVectorStoreProvider(config)
}