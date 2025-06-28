/**
 * @fileoverview 样式工具函数 - 基于clsx和tailwind-merge
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合并Tailwind CSS类名的工具函数
 * @param inputs 类名输入
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}