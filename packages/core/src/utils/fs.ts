/**
 * 文件系统工具函数
 * @module utils/fs
 */

import { promises as fs, Stats } from 'fs'
import { join, dirname, extname } from 'path'

/**
 * 检查文件是否存在
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}

/**
 * 确保目录存在
 */
export async function ensureDir(path: string): Promise<void> {
  try {
    await fs.mkdir(path, { recursive: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error
    }
  }
}

/**
 * 安全读取文件
 */
export async function readFile(path: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
  try {
    return await fs.readFile(path, encoding)
  } catch (error) {
    throw new Error(
      `Failed to read file ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * 安全写入文件
 */
export async function writeFile(
  path: string,
  content: string,
  encoding: BufferEncoding = 'utf-8'
): Promise<void> {
  try {
    await ensureDir(dirname(path))
    await fs.writeFile(path, content, encoding)
  } catch (error) {
    throw new Error(
      `Failed to write file ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * 读取JSON文件
 */
export async function readJson<T = unknown>(path: string): Promise<T> {
  const content = await readFile(path)
  try {
    return JSON.parse(content)
  } catch (error) {
    throw new Error(
      `Failed to parse JSON file ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * 写入JSON文件
 */
export async function writeJson(path: string, data: unknown, indent = 2): Promise<void> {
  const content = JSON.stringify(data, null, indent)
  await writeFile(path, content)
}

/**
 * 获取文件统计信息
 */
export async function stat(path: string): Promise<Stats | null> {
  try {
    return await fs.stat(path)
  } catch {
    return null
  }
}

/**
 * 列出目录内容
 */
export async function readDir(path: string): Promise<string[]> {
  try {
    return await fs.readdir(path)
  } catch (error) {
    throw new Error(
      `Failed to read directory ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * 递归查找文件
 */
export async function findFiles(
  dir: string,
  pattern: RegExp | string,
  options: { maxDepth?: number; includeHidden?: boolean } = {}
): Promise<string[]> {
  const { maxDepth = Infinity, includeHidden = false } = options
  const results: string[] = []

  const search = async (currentDir: string, depth: number): Promise<void> => {
    if (depth > maxDepth) return

    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true })

      for (const entry of entries) {
        if (!includeHidden && entry.name.startsWith('.')) {
          continue
        }

        const fullPath = join(currentDir, entry.name)

        if (entry.isDirectory()) {
          await search(fullPath, depth + 1)
        } else if (entry.isFile()) {
          const matches =
            pattern instanceof RegExp ? pattern.test(entry.name) : entry.name.includes(pattern)

          if (matches) {
            results.push(fullPath)
          }
        }
      }
    } catch {
      // 忽略权限错误等，继续搜索
    }
  }

  await search(dir, 0)
  return results
}

/**
 * 复制文件
 */
export async function copyFile(src: string, dest: string): Promise<void> {
  try {
    await ensureDir(dirname(dest))
    await fs.copyFile(src, dest)
  } catch (error) {
    throw new Error(
      `Failed to copy file from ${src} to ${dest}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * 删除文件或目录
 */
export async function remove(path: string): Promise<void> {
  try {
    const stats = await stat(path)
    if (!stats) return

    if (stats.isDirectory()) {
      await fs.rmdir(path, { recursive: true })
    } else {
      await fs.unlink(path)
    }
  } catch (error) {
    throw new Error(
      `Failed to remove ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * 获取文件扩展名
 */
export function getExtension(path: string): string {
  return extname(path).toLowerCase()
}

/**
 * 检查文件是否为特定类型
 */
export function isFileType(path: string, types: string[]): boolean {
  const ext = getExtension(path)
  return types.some(type => ext === (type.startsWith('.') ? type : `.${type}`))
}
