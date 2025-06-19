/**
 * tRPC 集成相关类型定义
 */

/**
 * tRPC 路由选项
 */
export interface TRPCRouterOptions {
  /** 基础路径 */
  basePath: string
  
  /** 程序配置 */
  procedures: ProcedureConfig
  
  /** 中间件配置 */
  middleware: MiddlewareConfig
  
  /** 认证配置 */
  auth?: AuthConfig
}

/**
 * 程序配置
 */
export interface ProcedureConfig {
  /** 列表查询 */
  list?: boolean
  
  /** 获取单项 */
  get?: boolean
  
  /** 创建 */
  create?: boolean
  
  /** 更新 */
  update?: boolean
  
  /** 删除 */
  delete?: boolean
  
  /** 搜索 */
  search?: boolean
  
  /** 批量操作 */
  bulkOperations?: boolean
  
  /** 计数 */
  count?: boolean
  
  /** 导出 */
  export?: boolean
  
  /** 导入 */
  import?: boolean
}

/**
 * 中间件配置
 */
export interface MiddlewareConfig {
  /** 认证中间件 */
  auth?: boolean
  
  /** 权限中间件 */
  permissions?: boolean
  
  /** 验证中间件 */
  validation?: boolean
  
  /** 日志中间件 */
  logging?: boolean
  
  /** 限流中间件 */
  rateLimit?: boolean
  
  /** 缓存中间件 */
  cache?: boolean
}

/**
 * 认证配置
 */
export interface AuthConfig {
  /** 是否必需认证 */
  required?: boolean
  
  /** 允许的角色 */
  roles?: string[]
  
  /** 权限要求 */
  permissions?: string[]
  
  /** 自定义认证检查 */
  customCheck?: (ctx: any) => boolean | Promise<boolean>
}

/**
 * tRPC 程序定义
 */
export interface TRPCProcedure {
  /** 输入验证 */
  input?: any
  
  /** 输出验证 */
  output?: any
  
  /** 中间件 */
  middleware?: any[]
  
  /** 解析器 */
  resolve: (params: { input: any; ctx: any }) => any
}

/**
 * tRPC 路由定义
 */
export interface TRPCRouter {
  /** 程序映射 */
  [key: string]: TRPCProcedure | TRPCRouter | any
}

/**
 * tRPC 客户端选项
 */
export interface TRPCClientOptions {
  /** 服务端 URL */
  url: string
  
  /** 请求头 */
  headers?: Record<string, string>
  
  /** 认证 token */
  token?: string
  
  /** 超时时间 */
  timeout?: number
  
  /** 重试次数 */
  retries?: number
}

/**
 * tRPC 客户端接口
 */
export interface TRPCClient<T> {
  /** 列表查询 */
  list: {
    query: (input?: any) => Promise<any>
    useQuery: (input?: any) => any
  }
  
  /** 获取单项 */
  get: {
    query: (input: { id: string }) => Promise<T | null>
    useQuery: (input: { id: string }) => any
  }
  
  /** 创建 */
  create: {
    mutate: (input: any) => Promise<any>
    useMutation: () => any
  }
  
  /** 更新 */
  update: {
    mutate: (input: { id: string; data: any }) => Promise<any>
    useMutation: () => any
  }
  
  /** 删除 */
  delete: {
    mutate: (input: { id: string }) => Promise<any>
    useMutation: () => any
  }
  
  /** 搜索 */
  search?: {
    query: (input: any) => Promise<any>
    useQuery: (input: any) => any
  }
  
  /** 批量操作 */
  bulkCreate?: {
    mutate: (input: { data: any[] }) => Promise<any>
    useMutation: () => any
  }
  
  bulkUpdate?: {
    mutate: (input: { updates: any[] }) => Promise<any>
    useMutation: () => any
  }
  
  bulkDelete?: {
    mutate: (input: { ids: string[] }) => Promise<any>
    useMutation: () => any
  }
}

/**
 * tRPC 集成配置
 */
export interface CRUDTRPCIntegration<T> {
  /** 自动生成 tRPC 路由 */
  generateRouter(options: TRPCRouterOptions): TRPCRouter
  
  /** 生成客户端 */
  generateClient(options: TRPCClientOptions): TRPCClient<T>
  
  /** 路由配置 */
  routerConfig: TRPCRouterOptions
  
  /** 中间件集成 */
  middleware: MiddlewareConfig
  
  /** 客户端配置 */
  clientConfig?: TRPCClientOptions
}

/**
 * tRPC 中间件函数
 */
export type TRPCMiddleware = (params: {
  ctx: any
  next: () => Promise<any>
  input?: any
  path?: string
  type?: 'query' | 'mutation' | 'subscription'
}) => Promise<any>

/**
 * tRPC 错误类型
 */
export interface TRPCError {
  code: string
  message: string
  data?: any
  cause?: Error
}

/**
 * tRPC 上下文扩展
 */
export interface TRPCContext {
  /** 用户信息 */
  user?: any
  
  /** 会话信息 */
  session?: any
  
  /** 权限信息 */
  permissions?: Record<string, boolean>
  
  /** 租户信息 */
  tenant?: string
  
  /** 请求信息 */
  req?: any
  
  /** 响应信息 */
  res?: any
  
  /** 自定义数据 */
  [key: string]: any
}

/**
 * tRPC 程序构建器
 */
export interface TRPCProcedureBuilder {
  /** 输入验证 */
  input<T>(schema: T): TRPCProcedureBuilder
  
  /** 输出验证 */
  output<T>(schema: T): TRPCProcedureBuilder
  
  /** 添加中间件 */
  use(middleware: TRPCMiddleware): TRPCProcedureBuilder
  
  /** 查询程序 */
  query<T>(resolver: (params: { input: any; ctx: TRPCContext }) => T): TRPCProcedure
  
  /** 变更程序 */
  mutation<T>(resolver: (params: { input: any; ctx: TRPCContext }) => T): TRPCProcedure
  
  /** 订阅程序 */
  subscription<T>(resolver: (params: { input: any; ctx: TRPCContext }) => T): TRPCProcedure
}

/**
 * tRPC 路由构建器
 */
export interface TRPCRouterBuilder {
  /** 创建程序 */
  procedure: TRPCProcedureBuilder
  
  /** 创建路由 */
  router(routes: Record<string, TRPCProcedure | TRPCRouter>): TRPCRouter
  
  /** 合并路由 */
  mergeRouters(...routers: TRPCRouter[]): TRPCRouter
}
