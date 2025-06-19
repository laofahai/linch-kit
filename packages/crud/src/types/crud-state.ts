/**
 * CRUD 状态管理相关类型定义
 */

import type {
  PaginationMeta,
  SortOptions,
  FilterOptions,
  SearchOptions,
  APIError
} from './index'

/**
 * CRUD 状态接口
 */
export interface CRUDState<T> {
  // 数据状态
  items: T[]
  currentItem: T | null
  selectedItems: T[]
  
  // 加载状态
  loading: LoadingState
  
  // 错误状态
  errors: ErrorState
  
  // 分页状态
  pagination: PaginationState
  
  // 筛选状态
  filters: FilterState
  
  // 排序状态
  sort: SortState
  
  // 搜索状态
  search: SearchState
  
  // 选择状态
  selection: SelectionState
  
  // 视图状态
  view: ViewState
  
  // 缓存状态
  cache: CacheState
  
  // 元数据
  metadata: Record<string, any>
}

/**
 * 加载状态
 */
export interface LoadingState {
  list: boolean
  detail: boolean
  create: boolean
  update: boolean
  delete: boolean
  bulkCreate: boolean
  bulkUpdate: boolean
  bulkDelete: boolean
  search: boolean
  export: boolean
  import: boolean
}

/**
 * 错误状态
 */
export interface ErrorState {
  list: APIError | null
  detail: APIError | null
  create: APIError | null
  update: APIError | null
  delete: APIError | null
  bulkCreate: APIError | null
  bulkUpdate: APIError | null
  bulkDelete: APIError | null
  search: APIError | null
  export: APIError | null
  import: APIError | null
  
  // 表单验证错误
  validation: Record<string, string[]>
  
  // 全局错误
  global: APIError | null
}

/**
 * 分页状态
 */
export interface PaginationState {
  current: PaginationMeta
  history: PaginationMeta[]
}

/**
 * 筛选状态
 */
export interface FilterState {
  active: FilterOptions
  available: FilterDefinition[]
  presets: FilterPreset[]
}

/**
 * 筛选定义
 */
export interface FilterDefinition {
  field: string
  label: string
  type: 'text' | 'select' | 'date' | 'number' | 'boolean' | 'range'
  options?: Array<{ label: string; value: any }>
  multiple?: boolean
  defaultValue?: any
}

/**
 * 筛选预设
 */
export interface FilterPreset {
  name: string
  label: string
  filters: FilterOptions
  default?: boolean
}

/**
 * 排序状态
 */
export interface SortState {
  active: SortOptions
  available: SortDefinition[]
}

/**
 * 排序定义
 */
export interface SortDefinition {
  field: string
  label: string
  defaultDirection?: 'asc' | 'desc'
  sortable?: boolean
}

/**
 * 搜索状态
 */
export interface SearchState {
  query: string
  options: SearchOptions
  results: SearchResult[]
  suggestions: string[]
  history: string[]
}

/**
 * 搜索结果
 */
export interface SearchResult {
  id: string
  title: string
  description?: string
  highlights?: Record<string, string[]>
  score?: number
}

/**
 * 选择状态
 */
export interface SelectionState {
  mode: 'none' | 'single' | 'multiple'
  selectedIds: string[]
  selectAll: boolean
  indeterminate: boolean
}

/**
 * 视图状态
 */
export interface ViewState {
  // 当前视图模式
  mode: 'list' | 'detail' | 'create' | 'edit'
  
  // 列表视图状态
  list: {
    layout: 'table' | 'grid' | 'list'
    columns: ColumnState[]
    density: 'compact' | 'normal' | 'comfortable'
  }
  
  // 表单视图状态
  form: {
    mode: 'create' | 'edit'
    dirty: boolean
    touched: Record<string, boolean>
    values: Record<string, any>
    initialValues: Record<string, any>
  }
  
  // 详情视图状态
  detail: {
    activeTab?: string
    expandedSections: string[]
  }
}

/**
 * 列状态
 */
export interface ColumnState {
  field: string
  visible: boolean
  width?: number
  order: number
  pinned?: 'left' | 'right'
}

/**
 * 缓存状态
 */
export interface CacheState {
  enabled: boolean
  keys: string[]
  lastUpdated: Record<string, Date>
  hitRate: number
}

/**
 * 状态操作接口
 */
export interface CRUDStateActions<T> {
  // 数据操作
  setItems(items: T[]): void
  addItem(item: T): void
  updateItem(id: string, updates: Partial<T>): void
  removeItem(id: string): void
  setCurrentItem(item: T | null): void
  
  // 加载状态操作
  setLoading(operation: keyof LoadingState, loading: boolean): void
  
  // 错误状态操作
  setError(operation: keyof ErrorState, error: APIError | null): void
  clearErrors(): void
  setValidationErrors(errors: Record<string, string[]>): void
  
  // 分页操作
  setPagination(pagination: PaginationMeta): void
  nextPage(): void
  prevPage(): void
  goToPage(page: number): void
  
  // 筛选操作
  setFilters(filters: FilterOptions): void
  addFilter(filter: FilterOptions[0]): void
  removeFilter(field: string): void
  clearFilters(): void
  applyFilterPreset(preset: FilterPreset): void
  
  // 排序操作
  setSort(sort: SortOptions): void
  addSort(field: string, direction: 'asc' | 'desc'): void
  removeSort(field: string): void
  clearSort(): void
  
  // 搜索操作
  setSearch(query: string, options?: SearchOptions): void
  clearSearch(): void
  addSearchHistory(query: string): void
  
  // 选择操作
  setSelection(ids: string[]): void
  selectItem(id: string): void
  deselectItem(id: string): void
  selectAll(): void
  deselectAll(): void
  toggleSelection(id: string): void
  
  // 视图操作
  setViewMode(mode: ViewState['mode']): void
  setListLayout(layout: ViewState['list']['layout']): void
  setColumnVisibility(field: string, visible: boolean): void
  setColumnWidth(field: string, width: number): void
  setColumnOrder(columns: ColumnState[]): void
  
  // 表单操作
  setFormValues(values: Record<string, any>): void
  setFormValue(field: string, value: any): void
  setFormTouched(field: string, touched: boolean): void
  setFormDirty(dirty: boolean): void
  resetForm(): void
  
  // 缓存操作
  invalidateCache(keys?: string[]): void
  updateCacheStats(hitRate: number): void
}

/**
 * 状态监听器类型
 */
export type StateListener<T> = (state: CRUDState<T>, prevState: CRUDState<T>) => void

/**
 * 状态选择器类型
 */
export type StateSelector<T, R> = (state: CRUDState<T>) => R

/**
 * 状态管理器接口
 */
export interface CRUDStateManager<T> {
  // 状态访问
  getState(): CRUDState<T>
  
  // 状态更新
  setState(updates: Partial<CRUDState<T>>): void
  
  // 状态监听
  subscribe(listener: StateListener<T>): () => void
  
  // 状态选择
  select<R>(selector: StateSelector<T, R>): R
  
  // 状态重置
  reset(): void
  
  // 状态持久化
  persist(): void
  restore(): void
  
  // 状态操作
  actions: CRUDStateActions<T>
}
