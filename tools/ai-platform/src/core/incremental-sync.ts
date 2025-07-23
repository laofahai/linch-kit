/**
 * 增量同步管理器
 * 
 * 功能：
 * 1. 跟踪文件变更
 * 2. 只提取变更文件的数据
 * 3. 避免重复数据生成
 * 4. 提升同步性能
 */

import { readdir, stat, readFile, writeFile } from 'fs/promises'
import { join, relative } from 'path'
import { createHash } from 'crypto'
import { createLogger } from '@linch-kit/core/server'
import { PATHS } from './constants'

const logger = createLogger({ name: 'incremental-sync' })

interface FileMetadata {
  path: string
  size: number
  mtime: number
  hash: string
}

interface SyncState {
  lastSync: number
  files: Map<string, FileMetadata>
  version: string
}

export class IncrementalSyncManager {
  private stateFile: string
  private rootPath: string
  private state: SyncState

  constructor(rootPath: string = process.cwd()) {
    this.rootPath = rootPath
    this.stateFile = join(rootPath, '.linchkit', 'sync-state.json')
    this.state = {
      lastSync: 0,
      files: new Map(),
      version: '1.0.0'
    }
  }

  /**
   * 加载同步状态
   */
  async loadState(): Promise<void> {
    try {
      const content = await readFile(this.stateFile, 'utf-8')
      const data = JSON.parse(content)
      
      this.state = {
        lastSync: data.lastSync || 0,
        files: new Map(data.files || []),
        version: data.version || '1.0.0'
      }
      
      logger.debug('同步状态加载成功', { 
        lastSync: new Date(this.state.lastSync),
        fileCount: this.state.files.size 
      })
    } catch (error) {
      logger.info('首次运行，创建新的同步状态')
      this.state = {
        lastSync: 0,
        files: new Map(),
        version: '1.0.0'
      }
    }
  }

  /**
   * 保存同步状态
   */
  async saveState(): Promise<void> {
    try {
      const data = {
        lastSync: this.state.lastSync,
        files: Array.from(this.state.files.entries()),
        version: this.state.version
      }
      
      // 确保目录存在
      const dir = join(this.rootPath, '.linchkit')
      await readdir(dir).catch(() => 
        require('fs').mkdirSync(dir, { recursive: true })
      )
      
      await writeFile(this.stateFile, JSON.stringify(data, null, 2))
      logger.debug('同步状态保存成功')
    } catch (error) {
      logger.warn('同步状态保存失败', { error })
    }
  }

  /**
   * 计算文件哈希
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    try {
      const content = await readFile(filePath)
      return createHash('md5').update(content).digest('hex')
    } catch (error) {
      return ''
    }
  }

  /**
   * 扫描并识别变更文件
   */
  async scanChangedFiles(patterns: string[] = ['**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx']): Promise<{
    changed: string[]
    added: string[]
    deleted: string[]
    unchanged: string[]
  }> {
    logger.info('开始扫描文件变更...')
    
    const changed: string[] = []
    const added: string[] = []
    const deleted: string[] = []
    const unchanged: string[] = []
    
    // 扫描当前文件
    const currentFiles = await this.scanFiles(patterns)
    const currentFileMap = new Map<string, FileMetadata>()
    
    for (const filePath of currentFiles) {
      try {
        const stats = await stat(filePath)
        const relativePath = relative(this.rootPath, filePath)
        const hash = await this.calculateFileHash(filePath)
        
        const metadata: FileMetadata = {
          path: relativePath,
          size: stats.size,
          mtime: stats.mtimeMs,
          hash
        }
        
        currentFileMap.set(relativePath, metadata)
        
        const oldMetadata = this.state.files.get(relativePath)
        if (!oldMetadata) {
          added.push(filePath)
        } else if (
          oldMetadata.size !== stats.size ||
          oldMetadata.mtime !== stats.mtimeMs ||
          oldMetadata.hash !== hash
        ) {
          changed.push(filePath)
        } else {
          unchanged.push(filePath)
        }
      } catch (error) {
        logger.warn(`文件扫描失败: ${filePath}`, { error })
      }
    }
    
    // 识别已删除的文件
    for (const [oldPath] of this.state.files) {
      if (!currentFileMap.has(oldPath)) {
        deleted.push(join(this.rootPath, oldPath))
      }
    }
    
    // 更新状态
    this.state.files = currentFileMap
    this.state.lastSync = Date.now()
    
    logger.info('文件扫描完成', {
      total: currentFiles.length,
      changed: changed.length,
      added: added.length,
      deleted: deleted.length,
      unchanged: unchanged.length
    })
    
    return { changed, added, deleted, unchanged }
  }

  /**
   * 扫描符合模式的文件
   */
  private async scanFiles(patterns: string[]): Promise<string[]> {
    const files: string[] = []
    
    const scanDir = async (dir: string): Promise<void> => {
      try {
        const entries = await readdir(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = join(dir, entry.name)
          
          if (entry.isDirectory()) {
            // 跳过常见的忽略目录
            if (this.shouldSkipDirectory(entry.name)) {
              continue
            }
            await scanDir(fullPath)
          } else if (entry.isFile()) {
            if (this.matchesPatterns(fullPath, patterns)) {
              files.push(fullPath)
            }
          }
        }
      } catch (error) {
        logger.debug(`目录扫描失败: ${dir}`, { error })
      }
    }
    
    await scanDir(this.rootPath)
    return files
  }

  /**
   * 检查是否应该跳过目录
   */
  private shouldSkipDirectory(name: string): boolean {
    const skipDirs = [
      'node_modules',
      '.git',
      '.next',
      '.linchkit',
      'dist',
      'build',
      '.turbo',
      'coverage',
      '.nyc_output'
    ]
    return skipDirs.includes(name) || name.startsWith('.')
  }

  /**
   * 检查文件是否匹配模式
   */
  private matchesPatterns(filePath: string, patterns: string[]): boolean {
    const ext = filePath.split('.').pop()?.toLowerCase()
    const allowedExts = ['ts', 'js', 'tsx', 'jsx', 'json', 'md']
    return allowedExts.includes(ext || '')
  }

  /**
   * 检查是否需要完整同步
   */
  shouldForceFullSync(): boolean {
    const lastSync = new Date(this.state.lastSync)
    const now = new Date()
    const daysSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24)
    
    // 超过7天强制完整同步
    return daysSinceLastSync > 7 || this.state.files.size === 0
  }

  /**
   * 获取同步统计信息
   */
  getStats() {
    return {
      lastSync: new Date(this.state.lastSync),
      trackedFiles: this.state.files.size,
      version: this.state.version
    }
  }
}