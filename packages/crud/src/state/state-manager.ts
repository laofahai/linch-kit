/**
 * CRUD 状态管理器
 */

import { EventEmitter } from 'eventemitter3'

import type {
  CRUDState,
  CRUDStateActions,
  CRUDStateManager as ICRUDStateManager,
  StateListener,
  StateSelector,
  LoadingState,
  ErrorState,
  PaginationMeta,
  FilterOptions,
  SortOptions,
  SearchOptions,
  APIError,
  CRUDEvents
} from '../types'

/**
 * 创建初始状态
 */
function createInitialState<T>(): CRUDState<T> {
  return {
    items: [],
    currentItem: null,
    selectedItems: [],
    
    loading: {
      list: false,
      detail: false,
      create: false,
      update: false,
      delete: false,
      bulkCreate: false,
      bulkUpdate: false,
      bulkDelete: false,
      search: false,
      export: false,
      import: false
    },
    
    errors: {
      list: null,
      detail: null,
      create: null,
      update: null,
      delete: null,
      bulkCreate: null,
      bulkUpdate: null,
      bulkDelete: null,
      search: null,
      export: null,
      import: null,
      validation: {},
      global: null
    },
    
    pagination: {
      current: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
        offset: 0
      },
      history: []
    },
    
    filters: {
      active: [],
      available: [],
      presets: []
    },
    
    sort: {
      active: [],
      available: []
    },
    
    search: {
      query: '',
      options: { query: '' },
      results: [],
      suggestions: [],
      history: []
    },
    
    selection: {
      mode: 'multiple',
      selectedIds: [],
      selectAll: false,
      indeterminate: false
    },
    
    view: {
      mode: 'list',
      list: {
        layout: 'table',
        columns: [],
        density: 'normal'
      },
      form: {
        mode: 'create',
        dirty: false,
        touched: {},
        values: {},
        initialValues: {}
      },
      detail: {
        expandedSections: []
      }
    },
    
    cache: {
      enabled: false,
      keys: [],
      lastUpdated: {},
      hitRate: 0
    },
    
    metadata: {}
  }
}

/**
 * CRUD 状态管理器实现
 */
export class CRUDStateManager<T> implements ICRUDStateManager<T> {
  private state: CRUDState<T>
  private listeners: Set<StateListener<T>> = new Set()
  
  public readonly actions: CRUDStateActions<T>

  constructor(private eventEmitter?: EventEmitter<CRUDEvents<T>>) {
    this.state = createInitialState<T>()
    this.actions = this.createActions()
  }

  /**
   * 获取当前状态
   */
  getState(): CRUDState<T> {
    return { ...this.state }
  }

  /**
   * 更新状态
   */
  setState(updates: Partial<CRUDState<T>>): void {
    const prevState = { ...this.state }
    this.state = { ...this.state, ...updates }
    
    // 通知监听器
    this.notifyListeners(this.state, prevState)
    
    // 触发状态变更事件
    if (this.eventEmitter) {
      const changes = Object.keys(updates)
      this.eventEmitter.emit('state:changed', {
        newState: this.state,
        prevState,
        changes
      })
    }
  }

  /**
   * 订阅状态变更
   */
  subscribe(listener: StateListener<T>): () => void {
    this.listeners.add(listener)
    
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * 选择状态
   */
  select<R>(selector: StateSelector<T, R>): R {
    return selector(this.state)
  }

  /**
   * 重置状态
   */
  reset(): void {
    const prevState = { ...this.state }
    this.state = createInitialState<T>()
    this.notifyListeners(this.state, prevState)
  }

  /**
   * 持久化状态
   */
  persist(): void {
    try {
      const serializedState = JSON.stringify(this.state)
      // @ts-ignore
      localStorage.setItem('crud-state', serializedState)
    } catch (error) {
      console.warn('Failed to persist state:', error)
    }
  }

  /**
   * 恢复状态
   */
  restore(): void {
    try {
      // @ts-ignore
      const serializedState = localStorage.getItem('crud-state')
      if (serializedState) {
        const restoredState = JSON.parse(serializedState)
        this.setState(restoredState)
      }
    } catch (error) {
      console.warn('Failed to restore state:', error)
    }
  }

  /**
   * 通知监听器
   */
  private notifyListeners(newState: CRUDState<T>, prevState: CRUDState<T>): void {
    for (const listener of this.listeners) {
      try {
        listener(newState, prevState)
      } catch (error) {
        console.error('State listener error:', error)
      }
    }
  }

  /**
   * 创建状态操作
   */
  private createActions(): CRUDStateActions<T> {
    return {
      // 数据操作
      setItems: (items: T[]) => {
        this.setState({ items })
      },
      
      addItem: (item: T) => {
        this.setState({
          items: [...this.state.items, item]
        })
      },
      
      updateItem: (id: string, updates: Partial<T>) => {
        const items = this.state.items.map(item => 
          (item as any).id === id ? { ...item, ...updates } : item
        )
        this.setState({ items })
      },
      
      removeItem: (id: string) => {
        const items = this.state.items.filter(item => (item as any).id !== id)
        this.setState({ items })
      },
      
      setCurrentItem: (item: T | null) => {
        this.setState({ currentItem: item })
      },

      // 加载状态操作
      setLoading: (operation: keyof LoadingState, loading: boolean) => {
        this.setState({
          loading: { ...this.state.loading, [operation]: loading }
        })
        
        if (this.eventEmitter) {
          this.eventEmitter.emit('loading:changed', { operation, loading })
        }
      },

      // 错误状态操作
      setError: (operation: keyof ErrorState, error: APIError | null) => {
        this.setState({
          errors: { ...this.state.errors, [operation]: error }
        })
        
        if (this.eventEmitter) {
          this.eventEmitter.emit('error:changed', { operation, error })
        }
      },
      
      clearErrors: () => {
        this.setState({
          errors: {
            ...this.state.errors,
            list: null,
            detail: null,
            create: null,
            update: null,
            delete: null,
            global: null
          }
        })
      },
      
      setValidationErrors: (errors: Record<string, string[]>) => {
        this.setState({
          errors: { ...this.state.errors, validation: errors }
        })
      },

      // 分页操作
      setPagination: (pagination: PaginationMeta) => {
        this.setState({
          pagination: {
            current: pagination,
            history: [...this.state.pagination.history, pagination].slice(-10) // 保留最近10次
          }
        })
      },
      
      nextPage: () => {
        const { current } = this.state.pagination
        if (current.hasNext) {
          this.actions.setPagination({
            ...current,
            page: current.page + 1,
            offset: current.offset + current.limit
          })
        }
      },
      
      prevPage: () => {
        const { current } = this.state.pagination
        if (current.hasPrev) {
          this.actions.setPagination({
            ...current,
            page: current.page - 1,
            offset: Math.max(0, current.offset - current.limit)
          })
        }
      },
      
      goToPage: (page: number) => {
        const { current } = this.state.pagination
        this.actions.setPagination({
          ...current,
          page,
          offset: (page - 1) * current.limit
        })
      },

      // 筛选操作
      setFilters: (filters: FilterOptions) => {
        this.setState({
          filters: { ...this.state.filters, active: filters }
        })
      },
      
      addFilter: (filter) => {
        const active = [...this.state.filters.active, filter]
        this.setState({
          filters: { ...this.state.filters, active }
        })
      },
      
      removeFilter: (field: string) => {
        const active = this.state.filters.active.filter(f => f.field !== field)
        this.setState({
          filters: { ...this.state.filters, active }
        })
      },
      
      clearFilters: () => {
        this.setState({
          filters: { ...this.state.filters, active: [] }
        })
      },
      
      applyFilterPreset: (preset) => {
        this.setState({
          filters: { ...this.state.filters, active: preset.filters }
        })
      },

      // 排序操作
      setSort: (sort: SortOptions) => {
        this.setState({
          sort: { ...this.state.sort, active: sort }
        })
      },
      
      addSort: (field: string, direction: 'asc' | 'desc') => {
        const active = [...this.state.sort.active, { field, direction }]
        this.setState({
          sort: { ...this.state.sort, active }
        })
      },
      
      removeSort: (field: string) => {
        const active = this.state.sort.active.filter(s => s.field !== field)
        this.setState({
          sort: { ...this.state.sort, active }
        })
      },
      
      clearSort: () => {
        this.setState({
          sort: { ...this.state.sort, active: [] }
        })
      },

      // 搜索操作
      setSearch: (query: string, options?: SearchOptions) => {
        this.setState({
          search: {
            ...this.state.search,
            query,
            options: options || { query }
          }
        })
      },
      
      clearSearch: () => {
        this.setState({
          search: {
            ...this.state.search,
            query: '',
            options: { query: '' },
            results: []
          }
        })
      },
      
      addSearchHistory: (query: string) => {
        const history = [query, ...this.state.search.history.filter(h => h !== query)].slice(0, 10)
        this.setState({
          search: { ...this.state.search, history }
        })
      },

      // 选择操作
      setSelection: (ids: string[]) => {
        this.setState({
          selection: {
            ...this.state.selection,
            selectedIds: ids,
            selectAll: ids.length === this.state.items.length,
            indeterminate: ids.length > 0 && ids.length < this.state.items.length
          }
        })
      },
      
      selectItem: (id: string) => {
        const selectedIds = [...this.state.selection.selectedIds, id]
        this.actions.setSelection(selectedIds)
      },
      
      deselectItem: (id: string) => {
        const selectedIds = this.state.selection.selectedIds.filter(selectedId => selectedId !== id)
        this.actions.setSelection(selectedIds)
      },
      
      selectAll: () => {
        const allIds = this.state.items.map(item => (item as any).id)
        this.actions.setSelection(allIds)
      },
      
      deselectAll: () => {
        this.actions.setSelection([])
      },
      
      toggleSelection: (id: string) => {
        if (this.state.selection.selectedIds.includes(id)) {
          this.actions.deselectItem(id)
        } else {
          this.actions.selectItem(id)
        }
      },

      // 视图操作
      setViewMode: (mode) => {
        this.setState({
          view: { ...this.state.view, mode }
        })
      },
      
      setListLayout: (layout) => {
        this.setState({
          view: {
            ...this.state.view,
            list: { ...this.state.view.list, layout }
          }
        })
      },
      
      setColumnVisibility: (field: string, visible: boolean) => {
        const columns = this.state.view.list.columns.map(col =>
          col.field === field ? { ...col, visible } : col
        )
        this.setState({
          view: {
            ...this.state.view,
            list: { ...this.state.view.list, columns }
          }
        })
      },
      
      setColumnWidth: (field: string, width: number) => {
        const columns = this.state.view.list.columns.map(col =>
          col.field === field ? { ...col, width } : col
        )
        this.setState({
          view: {
            ...this.state.view,
            list: { ...this.state.view.list, columns }
          }
        })
      },
      
      setColumnOrder: (columns) => {
        this.setState({
          view: {
            ...this.state.view,
            list: { ...this.state.view.list, columns }
          }
        })
      },

      // 表单操作
      setFormValues: (values: Record<string, any>) => {
        this.setState({
          view: {
            ...this.state.view,
            form: { ...this.state.view.form, values }
          }
        })
      },
      
      setFormValue: (field: string, value: any) => {
        this.setState({
          view: {
            ...this.state.view,
            form: {
              ...this.state.view.form,
              values: { ...this.state.view.form.values, [field]: value }
            }
          }
        })
      },
      
      setFormTouched: (field: string, touched: boolean) => {
        this.setState({
          view: {
            ...this.state.view,
            form: {
              ...this.state.view.form,
              touched: { ...this.state.view.form.touched, [field]: touched }
            }
          }
        })
      },
      
      setFormDirty: (dirty: boolean) => {
        this.setState({
          view: {
            ...this.state.view,
            form: { ...this.state.view.form, dirty }
          }
        })
      },
      
      resetForm: () => {
        this.setState({
          view: {
            ...this.state.view,
            form: {
              mode: 'create',
              dirty: false,
              touched: {},
              values: {},
              initialValues: {}
            }
          }
        })
      },

      // 缓存操作
      invalidateCache: (keys?: string[]) => {
        if (keys) {
          const remainingKeys = this.state.cache.keys.filter(key => !keys.includes(key))
          this.setState({
            cache: { ...this.state.cache, keys: remainingKeys }
          })
        } else {
          this.setState({
            cache: { ...this.state.cache, keys: [], lastUpdated: {} }
          })
        }
      },
      
      updateCacheStats: (hitRate: number) => {
        this.setState({
          cache: { ...this.state.cache, hitRate }
        })
      }
    }
  }
}
