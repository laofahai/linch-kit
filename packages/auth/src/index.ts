/**
 * @linch-kit/auth 认证权限包主入口
 *
 * 企业级认证和权限管理解决方案 - 基于 NextAuth.js 的适配器架构
 * 遵循 LinchKit "不重复造轮子" 原则，使用成熟的第三方认证解决方案
 *
 * @module @linch-kit/auth
 * @version 0.1.0
 */

// ==================== NextAuth.js 核心导出 ====================
/**
 * 基于 NextAuth.js 的认证核心
 * 使用成熟的认证解决方案而非重新发明轮子
 */
export { default as NextAuth } from 'next-auth'
export type { NextAuthConfig, Session, User } from 'next-auth'

// ==================== NextAuth.js React hooks 导出 ====================
/**
 * NextAuth.js React hooks - 用于客户端认证状态管理
 */
export { useSession, signIn, signOut, getSession } from 'next-auth/react'

// ==================== LinchKit 适配器导出 ====================
/**
 * LinchKit 认证适配器 - 在 NextAuth.js 基础上添加企业级特性
 */
export { createLinchKitAuthConfig } from './adapters/nextauth-adapter'

// ==================== 权限引擎导出 ====================
/**
 * 权限引擎 - 基于CASL的权限控制
 * 保留企业级权限管理功能
 */
export { CASLPermissionEngine } from './permissions/casl-engine'
export { 
  EnhancedPermissionEngine, 
  createEnhancedPermissionEngine,
  type EnhancedPermissionResult 
} from './permissions/enhanced-permission-engine'

// ==================== 服务导出 ====================
/**
 * 权限管理服务
 */
export * from './services'

// ==================== 中间件导出 ====================
/**
 * 权限检查中间件
 */
export * from './middleware'

// ==================== 企业级扩展导出 ====================
/**
 * 企业级认证扩展 - 在成熟方案基础上的增强功能
 * 注意：审计日志功能已移至 @linch-kit/core，Prisma 适配器已移至 @linch-kit/trpc
 */
export { EnterpriseAuthExtensions } from './extensions/enterprise'
export { MFAManager } from './extensions/mfa'

// ==================== 类型定义导出 ====================
/**
 * LinchKit 认证类型定义
 */
export type * from './types'

// ==================== React组件导出 ====================
/**
 * React认证组件
 */
export { AuthProvider } from './components/AuthProvider'

// ==================== tRPC路由工厂导出 ====================
/**
 * tRPC路由工厂函数 - 避免循环依赖
 */
export { createAuthRouter } from './trpc/router-factory'

// ==================== 版本信息 ====================
/**
 * 包版本信息
 */
export const VERSION = '0.1.0'
