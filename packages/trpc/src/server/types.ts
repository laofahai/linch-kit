/**
 * tRPC 类型定义
 *
 * 在此定义 AppRouter 类型，避免跨包引用
 */

import { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

/**
 * 定义一个更具体的路由结构接口，避免与内置方法冲突
 * 这里只声明我们实际会用到的路由
 */
export interface AppRouter {
  user: any
  // 添加其他路由占位符，与实际应用路由结构对应
  report?: any
  [key: string]: any // 支持其他动态路由

  // 避免类型错误，确保 createClient 可以正常工作
  _def: any
  createCaller: any
}

// 输入输出类型辅助
export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>
