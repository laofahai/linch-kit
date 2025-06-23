/**
 * @ai-context 文件系统工具
 * @ai-purpose 提供便于 AI 理解的文件系统操作工具
 * @ai-safety 包含安全检查和错误处理
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'fs'
import { resolve, dirname, join, extname } from 'path'

import { logger } from './logger'

/**
 * @ai-function 安全地检查文件是否存在
 * @ai-purpose 检查文件或目录是否存在
 * @ai-parameter path: string - 文件路径
 * @ai-return boolean - 是否存在
 * @ai-safety 不会抛出异常
 */
export function pathExists(path: string): boolean {
  try {
    return existsSync(path)
  } catch {
    return false
  }
}

/**
 * @ai-function 安全地读取文件内容
 * @ai-purpose 读取文件内容，支持多种编码
 * @ai-parameter path: string - 文件路径
 * @ai-parameter encoding?: BufferEncoding - 文件编码，默认 utf-8
 * @ai-return string | null - 文件内容或 null
 * @ai-error-handling 读取失败返回 null，不抛出异常
 */
export function readFile(path: string, encoding: BufferEncoding = 'utf-8'): string | null {
  try {
    if (!pathExists(path)) {
      logger.warn('File not found', { path })
      return null
    }
    
    const content = readFileSync(path, encoding)
    logger.debug('File read successfully', { path, size: content.length })
    return content
  } catch (error) {
    logger.error('Failed to read file', { path }, error as Error)
    return null
  }
}

/**
 * @ai-function 安全地写入文件内容
 * @ai-purpose 写入文件内容，自动创建目录
 * @ai-parameter path: string - 文件路径
 * @ai-parameter content: string - 文件内容
 * @ai-parameter encoding?: BufferEncoding - 文件编码，默认 utf-8
 * @ai-return boolean - 是否写入成功
 * @ai-safety 自动创建父目录
 */
export function writeFile(path: string, content: string, encoding: BufferEncoding = 'utf-8'): boolean {
  try {
    // AI: 确保父目录存在
    const dir = dirname(path)
    ensureDir(dir)
    
    writeFileSync(path, content, encoding)
    logger.debug('File written successfully', { path, size: content.length })
    return true
  } catch (error) {
    logger.error('Failed to write file', { path }, error as Error)
    return false
  }
}

/**
 * @ai-function 确保目录存在
 * @ai-purpose 创建目录，如果不存在的话
 * @ai-parameter dir: string - 目录路径
 * @ai-return boolean - 是否成功
 * @ai-recursive 递归创建父目录
 */
export function ensureDir(dir: string): boolean {
  try {
    if (!pathExists(dir)) {
      mkdirSync(dir, { recursive: true })
      logger.debug('Directory created', { dir })
    }
    return true
  } catch (error) {
    logger.error('Failed to create directory', { dir }, error as Error)
    return false
  }
}

/**
 * @ai-function 读取并解析 JSON 文件
 * @ai-purpose 安全地读取和解析 JSON 文件
 * @ai-parameter path: string - JSON 文件路径
 * @ai-return any | null - 解析后的对象或 null
 * @ai-validation 包含 JSON 格式验证
 */
export function readJsonFile(path: string): any | null {
  const content = readFile(path)
  if (!content) {
    return null
  }
  
  try {
    const data = JSON.parse(content)
    logger.debug('JSON file parsed successfully', { path })
    return data
  } catch (error) {
    logger.error('Failed to parse JSON file', { path }, error as Error)
    return null
  }
}

/**
 * @ai-function 写入 JSON 文件
 * @ai-purpose 将对象序列化为 JSON 并写入文件
 * @ai-parameter path: string - JSON 文件路径
 * @ai-parameter data: any - 要写入的数据
 * @ai-parameter indent?: number - JSON 缩进，默认 2
 * @ai-return boolean - 是否写入成功
 */
export function writeJsonFile(path: string, data: any, indent: number = 2): boolean {
  try {
    const content = JSON.stringify(data, null, indent)
    return writeFile(path, content)
  } catch (error) {
    logger.error('Failed to serialize JSON data', { path }, error as Error)
    return false
  }
}

/**
 * @ai-function 获取文件信息
 * @ai-purpose 获取文件或目录的详细信息
 * @ai-parameter path: string - 文件路径
 * @ai-return FileInfo | null - 文件信息或 null
 */
export interface FileInfo {
  /** @ai-field 是否为文件 */
  isFile: boolean
  
  /** @ai-field 是否为目录 */
  isDirectory: boolean
  
  /** @ai-field 文件大小（字节） */
  size: number
  
  /** @ai-field 创建时间 */
  createdAt: Date
  
  /** @ai-field 修改时间 */
  modifiedAt: Date
  
  /** @ai-field 文件扩展名 */
  extension: string
}

export function getFileInfo(path: string): FileInfo | null {
  try {
    if (!pathExists(path)) {
      return null
    }
    
    const stats = statSync(path)
    const info: FileInfo = {
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      extension: extname(path)
    }
    
    logger.debug('File info retrieved', { path, info })
    return info
  } catch (error) {
    logger.error('Failed to get file info', { path }, error as Error)
    return null
  }
}

/**
 * @ai-function 解析文件路径
 * @ai-purpose 将相对路径解析为绝对路径
 * @ai-parameter path: string - 文件路径
 * @ai-parameter basePath?: string - 基础路径，默认为当前工作目录
 * @ai-return string - 绝对路径
 */
export function resolvePath(path: string, basePath?: string): string {
  const base = basePath || process.cwd()
  return resolve(base, path)
}

/**
 * @ai-function 连接路径
 * @ai-purpose 安全地连接多个路径片段
 * @ai-parameter ...paths: string[] - 路径片段
 * @ai-return string - 连接后的路径
 */
export function joinPath(...paths: string[]): string {
  return join(...paths)
}

/**
 * @ai-function 检查路径是否安全
 * @ai-purpose 检查路径是否包含危险的路径遍历
 * @ai-parameter path: string - 要检查的路径
 * @ai-parameter basePath: string - 基础路径
 * @ai-return boolean - 是否安全
 * @ai-security 防止路径遍历攻击
 */
export function isPathSafe(path: string, basePath: string): boolean {
  try {
    const resolvedPath = resolve(basePath, path)
    const resolvedBase = resolve(basePath)
    
    // AI: 检查解析后的路径是否在基础路径内
    return resolvedPath.startsWith(resolvedBase)
  } catch {
    return false
  }
}
