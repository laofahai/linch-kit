/**
 * 简单的优化版测试文件
 * 
 * 只包含优化版的用户模板，用于验证 DTS 构建性能
 */

// 只导入优化版用户模板
export * from './schemas/user-optimized'

// 简单的默认导出
import { OptimizedAuthKit } from './schemas/user-optimized'
export default OptimizedAuthKit
