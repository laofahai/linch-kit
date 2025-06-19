/**
 * CRUD 操作实现
 */

import { EventEmitter } from 'eventemitter3'

import type {
  ExtendedCRUDOperations,
  DataSource,
  ListOptions,
  PaginatedResponse,
  CreateInput,
  UpdateInput,
  BulkUpdateInput,
  BulkOperationResult,
  OperationResult,
  SearchOptions,
  CRUDEvents,
  CRUDStateManager,
  CRUDContext,
  ImportOptions
} from '../types'
import { CRUDOperation } from '../types/crud-operations'

/**
 * CRUD 操作实现类
 */
export class CRUDOperationsImpl<T> implements ExtendedCRUDOperations<T> {
  constructor(
    private dataSource: DataSource<T>,
    private eventEmitter: EventEmitter<CRUDEvents<T>>,
    private stateManager: CRUDStateManager<T>
  ) {}

  /**
   * 列表查询
   */
  async list(options?: ListOptions, context?: CRUDContext): Promise<PaginatedResponse<T>> {
    try {
      // 设置加载状态
      this.stateManager.actions.setLoading('list', true)
      this.stateManager.actions.setError('list', null)
      
      // 触发前置事件
      this.eventEmitter.emit('before:list', { options, context })
      
      // 执行查询
      const result = await this.dataSource.list(options, context)
      
      // 更新状态
      this.stateManager.actions.setItems(result.data)
      this.stateManager.actions.setPagination(result.pagination)
      
      // 触发后置事件
      this.eventEmitter.emit('after:list', { result, options, context })
      
      return result
    } catch (error) {
      const apiError = this.handleError(error as Error, CRUDOperation.LIST)
      this.stateManager.actions.setError('list', apiError)
      this.eventEmitter.emit('list:error', { error: error as Error, options, context })
      throw error
    } finally {
      this.stateManager.actions.setLoading('list', false)
    }
  }

  /**
   * 获取单项
   */
  async get(id: string, context?: CRUDContext): Promise<T | null> {
    try {
      this.stateManager.actions.setLoading('detail', true)
      this.stateManager.actions.setError('detail', null)
      
      this.eventEmitter.emit('before:get', { id, context })
      
      const result = await this.dataSource.get(id, context)
      
      if (result) {
        this.stateManager.actions.setCurrentItem(result)
      }
      
      this.eventEmitter.emit('after:get', { result, id, context })
      
      return result
    } catch (error) {
      const apiError = this.handleError(error as Error, CRUDOperation.GET)
      this.stateManager.actions.setError('detail', apiError)
      this.eventEmitter.emit('get:error', { error: error as Error, id, context })
      throw error
    } finally {
      this.stateManager.actions.setLoading('detail', false)
    }
  }

  /**
   * 搜索
   */
  async search(options: SearchOptions, context?: CRUDContext): Promise<PaginatedResponse<T>> {
    try {
      this.stateManager.actions.setLoading('search', true)
      this.stateManager.actions.setError('search', null)
      
      this.eventEmitter.emit('before:search', { options, context })
      
      const result = await this.dataSource.search(options, context)
      
      // 更新搜索状态
      this.stateManager.actions.setSearch(options.query, options)
      
      this.eventEmitter.emit('after:search', { result, options, context })
      
      return result
    } catch (error) {
      const apiError = this.handleError(error as Error, CRUDOperation.SEARCH)
      this.stateManager.actions.setError('search', apiError)
      this.eventEmitter.emit('search:error', { error: error as Error, options, context })
      throw error
    } finally {
      this.stateManager.actions.setLoading('search', false)
    }
  }

  /**
   * 计数
   */
  async count(options?: Omit<ListOptions, 'pagination'>, context?: CRUDContext): Promise<number> {
    try {
      return await this.dataSource.count(options, context)
    } catch (error) {
      this.handleError(error as Error, CRUDOperation.COUNT)
      throw error
    }
  }

  /**
   * 创建
   */
  async create(data: CreateInput<T>, context?: CRUDContext): Promise<OperationResult<T>> {
    try {
      this.stateManager.actions.setLoading('create', true)
      this.stateManager.actions.setError('create', null)
      
      this.eventEmitter.emit('before:create', { data, context })
      
      const result = await this.dataSource.create(data, context)
      
      // 添加到状态
      this.stateManager.actions.addItem(result)
      
      const operationResult: OperationResult<T> = {
        success: true,
        data: result
      }
      
      this.eventEmitter.emit('after:create', { result: operationResult, data, context })
      
      return operationResult
    } catch (error) {
      const apiError = this.handleError(error as Error, CRUDOperation.CREATE)
      this.stateManager.actions.setError('create', apiError)
      this.eventEmitter.emit('create:error', { error: error as Error, data, context })
      throw error
    } finally {
      this.stateManager.actions.setLoading('create', false)
    }
  }

  /**
   * 更新
   */
  async update(id: string, data: UpdateInput<T>, context?: CRUDContext): Promise<OperationResult<T>> {
    try {
      this.stateManager.actions.setLoading('update', true)
      this.stateManager.actions.setError('update', null)
      
      this.eventEmitter.emit('before:update', { id, data, context })
      
      const result = await this.dataSource.update(id, data, context)
      
      // 更新状态
      this.stateManager.actions.updateItem(id, result as Partial<T>)
      
      const operationResult: OperationResult<T> = {
        success: true,
        data: result
      }
      
      this.eventEmitter.emit('after:update', { result: operationResult, id, data, context })
      
      return operationResult
    } catch (error) {
      const apiError = this.handleError(error as Error, CRUDOperation.UPDATE)
      this.stateManager.actions.setError('update', apiError)
      this.eventEmitter.emit('update:error', { error: error as Error, id, data, context })
      throw error
    } finally {
      this.stateManager.actions.setLoading('update', false)
    }
  }

  /**
   * 删除
   */
  async delete(id: string, context?: CRUDContext): Promise<OperationResult<void>> {
    try {
      this.stateManager.actions.setLoading('delete', true)
      this.stateManager.actions.setError('delete', null)
      
      this.eventEmitter.emit('before:delete', { id, context })
      
      await this.dataSource.delete(id, context)
      
      // 从状态中移除
      this.stateManager.actions.removeItem(id)
      
      const operationResult: OperationResult<void> = {
        success: true
      }
      
      this.eventEmitter.emit('after:delete', { result: operationResult, id, context })
      
      return operationResult
    } catch (error) {
      const apiError = this.handleError(error as Error, CRUDOperation.DELETE)
      this.stateManager.actions.setError('delete', apiError)
      this.eventEmitter.emit('delete:error', { error: error as Error, id, context })
      throw error
    } finally {
      this.stateManager.actions.setLoading('delete', false)
    }
  }

  /**
   * 批量创建
   */
  async bulkCreate(data: CreateInput<T>[], context?: CRUDContext): Promise<OperationResult<T[]>> {
    try {
      this.stateManager.actions.setLoading('bulkCreate', true)
      this.stateManager.actions.setError('bulkCreate', null)
      
      this.eventEmitter.emit('before:bulk-create', { data, context })
      
      const result = await this.dataSource.bulkCreate?.(data, context) || []
      
      // 添加到状态
      for (const item of result) {
        this.stateManager.actions.addItem(item)
      }
      
      const operationResult: OperationResult<T[]> = {
        success: true,
        data: result
      }
      
      this.eventEmitter.emit('after:bulk-create', { result: operationResult, data, context })
      
      return operationResult
    } catch (error) {
      const apiError = this.handleError(error as Error, CRUDOperation.BULK_CREATE)
      this.stateManager.actions.setError('bulkCreate', apiError)
      this.eventEmitter.emit('bulk-create:error', { error: error as Error, data, context })
      throw error
    } finally {
      this.stateManager.actions.setLoading('bulkCreate', false)
    }
  }

  /**
   * 批量更新
   */
  async bulkUpdate(updates: BulkUpdateInput<T>[], context?: CRUDContext): Promise<BulkOperationResult> {
    try {
      this.stateManager.actions.setLoading('bulkUpdate', true)
      this.stateManager.actions.setError('bulkUpdate', null)
      
      this.eventEmitter.emit('before:bulk-update', { updates, context })
      
      const result = await this.dataSource.bulkUpdate?.(updates, context) || {
        success: false,
        processed: 0,
        failed: updates.length
      }
      
      this.eventEmitter.emit('after:bulk-update', { result, updates, context })
      
      return result
    } catch (error) {
      const apiError = this.handleError(error as Error, CRUDOperation.BULK_UPDATE)
      this.stateManager.actions.setError('bulkUpdate', apiError)
      this.eventEmitter.emit('bulk-update:error', { error: error as Error, updates, context })
      throw error
    } finally {
      this.stateManager.actions.setLoading('bulkUpdate', false)
    }
  }

  /**
   * 批量删除
   */
  async bulkDelete(ids: string[], context?: CRUDContext): Promise<BulkOperationResult> {
    try {
      this.stateManager.actions.setLoading('bulkDelete', true)
      this.stateManager.actions.setError('bulkDelete', null)
      
      this.eventEmitter.emit('before:bulk-delete', { ids, context })
      
      const result = await this.dataSource.bulkDelete?.(ids, context) || {
        success: false,
        processed: 0,
        failed: ids.length
      }
      
      // 从状态中移除成功删除的项
      if (result.success) {
        for (const id of ids) {
          this.stateManager.actions.removeItem(id)
        }
      }
      
      this.eventEmitter.emit('after:bulk-delete', { result, ids, context })
      
      return result
    } catch (error) {
      const apiError = this.handleError(error as Error, CRUDOperation.BULK_DELETE)
      this.stateManager.actions.setError('bulkDelete', apiError)
      this.eventEmitter.emit('bulk-delete:error', { error: error as Error, ids, context })
      throw error
    } finally {
      this.stateManager.actions.setLoading('bulkDelete', false)
    }
  }

  /**
   * 复制
   */
  async duplicate(id: string, overrides?: Partial<CreateInput<T>>, context?: CRUDContext): Promise<OperationResult<T>> {
    if (!this.dataSource.duplicate) {
      throw new Error('Duplicate operation not supported by data source')
    }
    
    try {
      const result = await this.dataSource.duplicate(id, overrides, context)
      this.stateManager.actions.addItem(result)
      
      return {
        success: true,
        data: result
      }
    } catch (error) {
      this.handleError(error as Error, CRUDOperation.DUPLICATE)
      throw error
    }
  }

  /**
   * 恢复 (软删除)
   */
  async restore(id: string, context?: CRUDContext): Promise<OperationResult<T>> {
    if (!this.dataSource.restore) {
      throw new Error('Restore operation not supported by data source')
    }
    
    try {
      const result = await this.dataSource.restore(id, context)
      this.stateManager.actions.addItem(result)
      
      return {
        success: true,
        data: result
      }
    } catch (error) {
      this.handleError(error as Error, CRUDOperation.RESTORE)
      throw error
    }
  }

  /**
   * 归档
   */
  async archive(id: string, context?: CRUDContext): Promise<OperationResult<void>> {
    if (!this.dataSource.archive) {
      throw new Error('Archive operation not supported by data source')
    }
    
    try {
      await this.dataSource.archive(id, context)
      this.stateManager.actions.removeItem(id)
      
      return {
        success: true
      }
    } catch (error) {
      this.handleError(error as Error, CRUDOperation.ARCHIVE)
      throw error
    }
  }

  /**
   * 获取关联数据
   */
  async getRelated<R>(id: string, relation: string, options?: ListOptions, context?: CRUDContext): Promise<PaginatedResponse<R>> {
    if (!this.dataSource.getRelated) {
      throw new Error('Get related operation not supported by data source')
    }
    
    return this.dataSource.getRelated<R>(id, relation, options, context)
  }

  /**
   * 添加关联
   */
  async addRelation(id: string, relation: string, relatedId: string, context?: CRUDContext): Promise<OperationResult<void>> {
    if (!this.dataSource.addRelation) {
      throw new Error('Add relation operation not supported by data source')
    }
    
    try {
      await this.dataSource.addRelation(id, relation, relatedId, context)
      return { success: true }
    } catch (error) {
      this.handleError(error as Error, 'addRelation' as any)
      throw error
    }
  }

  /**
   * 移除关联
   */
  async removeRelation(id: string, relation: string, relatedId: string, context?: CRUDContext): Promise<OperationResult<void>> {
    if (!this.dataSource.removeRelation) {
      throw new Error('Remove relation operation not supported by data source')
    }
    
    try {
      await this.dataSource.removeRelation(id, relation, relatedId, context)
      return { success: true }
    } catch (error) {
      this.handleError(error as Error, 'removeRelation' as any)
      throw error
    }
  }

  /**
   * 导出数据
   */
  async export(options?: ListOptions, _format: 'csv' | 'xlsx' | 'json' = 'json', context?: CRUDContext): Promise<OperationResult<string>> {
    try {
      this.stateManager.actions.setLoading('export', true)
      
      // 获取所有数据
      const data = await this.dataSource.list(options, context)
      
      // 简单的 JSON 导出实现
      const exportData = JSON.stringify(data.data, null, 2)
      
      return {
        success: true,
        data: exportData
      }
    } catch (error) {
      const apiError = this.handleError(error as Error, CRUDOperation.EXPORT)
      this.stateManager.actions.setError('export', apiError)
      throw error
    } finally {
      this.stateManager.actions.setLoading('export', false)
    }
  }

  /**
   * 导入数据
   */
  async import(data: any[], _options?: ImportOptions, context?: CRUDContext): Promise<BulkOperationResult> {
    try {
      this.stateManager.actions.setLoading('import', true)
      
      // 简单的导入实现
      const results = await this.bulkCreate(data as CreateInput<T>[], context)
      
      return {
        success: true,
        processed: results.data?.length || 0,
        failed: 0
      }
    } catch (error) {
      const apiError = this.handleError(error as Error, CRUDOperation.IMPORT)
      this.stateManager.actions.setError('import', apiError)
      throw error
    } finally {
      this.stateManager.actions.setLoading('import', false)
    }
  }

  /**
   * 获取版本历史
   */
  async getVersions(_id: string, _context?: CRUDContext): Promise<PaginatedResponse<T>> {
    // 临时实现，返回空结果
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
        offset: 0
      }
    }
  }

  /**
   * 恢复到指定版本
   */
  async revertToVersion(_id: string, _version: string, _context?: CRUDContext): Promise<OperationResult<T>> {
    throw new Error('Version revert not implemented')
  }

  /**
   * 错误处理
   */
  private handleError(error: Error, operation: CRUDOperation): any {
    return {
      code: 'OPERATION_FAILED',
      message: error.message,
      details: { operation }
    }
  }
}
