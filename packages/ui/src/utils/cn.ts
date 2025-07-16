/**
 * @fileoverview 样式工具函数 - 基于clsx、tailwind-merge和tailwind-variants
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { tv, type VariantProps } from 'tailwind-variants'

/**
 * 合并Tailwind CSS类名的工具函数
 * @param inputs 类名输入
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 重新导出tailwind-variants的核心功能
 */
export { tv, type VariantProps }

/**
 * 创建组件变体的预配置函数
 * 内置了智能类名合并和冲突解决
 */
export const createVariants = tv
