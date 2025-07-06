/**
 * ExtractorConfig
 * 
 * 提取器配置管理，解决路径硬编码问题
 * 提供动态工作目录检测和项目结构识别
 */

import { existsSync } from 'fs'
import { resolve, join } from 'path'

export interface ExtractorConfiguration {
  workingDirectory: string
  projectRoot: string
  packageDirectories: string[]
  excludeDirectories: string[]
  supportedExtensions: string[]
  tsConfigPath?: string
}

/**
 * 提取器配置管理器
 */
export class ExtractorConfig {
  private static instance: ExtractorConfig
  private config: ExtractorConfiguration

  private constructor(customWorkingDir?: string) {
    this.config = this.detectProjectConfiguration(customWorkingDir)
  }

  static getInstance(customWorkingDir?: string): ExtractorConfig {
    if (!ExtractorConfig.instance) {
      ExtractorConfig.instance = new ExtractorConfig(customWorkingDir)
    }
    return ExtractorConfig.instance
  }

  /**
   * 获取配置
   */
  getConfig(): ExtractorConfiguration {
    return { ...this.config }
  }

  /**
   * 获取工作目录
   */
  getWorkingDirectory(): string {
    return this.config.workingDirectory
  }

  /**
   * 获取项目根目录
   */
  getProjectRoot(): string {
    return this.config.projectRoot
  }

  /**
   * 获取包目录列表
   */
  getPackageDirectories(): string[] {
    return [...this.config.packageDirectories]
  }

  /**
   * 获取 TypeScript 配置文件路径
   */
  getTsConfigPath(): string | undefined {
    return this.config.tsConfigPath
  }

  /**
   * 检查路径是否应该被排除
   */
  shouldExclude(path: string): boolean {
    const segments = path.split('/')
    return this.config.excludeDirectories.some(excludeDir => 
      segments.includes(excludeDir) || path.includes(excludeDir)
    )
  }

  /**
   * 检查文件扩展名是否支持
   */
  isSupportedExtension(extension: string): boolean {
    return this.config.supportedExtensions.includes(extension.toLowerCase())
  }

  /**
   * 解析相对于项目根目录的路径
   */
  resolveFromProject(relativePath: string): string {
    return resolve(this.config.projectRoot, relativePath)
  }

  /**
   * 获取相对于项目根目录的路径
   */
  getRelativePath(absolutePath: string): string {
    return require('path').relative(this.config.projectRoot, absolutePath)
  }

  /**
   * 自动检测项目配置
   */
  private detectProjectConfiguration(customWorkingDir?: string): ExtractorConfiguration {
    const workingDirectory = customWorkingDir || process.cwd()
    const projectRoot = this.findProjectRoot(workingDirectory)
    
    // 检测项目结构
    const packageDirectories = this.detectPackageDirectories(projectRoot)
    const tsConfigPath = this.findTsConfigPath(projectRoot)

    return {
      workingDirectory,
      projectRoot,
      packageDirectories,
      excludeDirectories: [
        'node_modules',
        '.git',
        'dist',
        'build',
        '.next',
        'coverage',
        '.husky',
        '.vscode',
        '.idea',
        'tmp',
        'temp'
      ],
      supportedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
      tsConfigPath
    }
  }

  /**
   * 查找项目根目录
   */
  private findProjectRoot(startDir: string): string {
    let currentDir = resolve(startDir)
    
    // 向上查找，直到找到包含 package.json 的目录
    while (currentDir !== '/') {
      if (existsSync(join(currentDir, 'package.json'))) {
        // 进一步检查是否是 monorepo 根目录
        if (this.isMonorepoRoot(currentDir)) {
          return currentDir
        }
        
        // 如果不是 monorepo，继续向上查找
        const parentDir = resolve(currentDir, '..')
        if (parentDir === currentDir) {
          // 已经到达根目录
          return currentDir
        }
        
        // 检查父目录是否也有 package.json（monorepo 情况）
        if (existsSync(join(parentDir, 'package.json'))) {
          currentDir = parentDir
          continue
        }
        
        return currentDir
      }
      
      const parentDir = resolve(currentDir, '..')
      if (parentDir === currentDir) {
        // 已经到达根目录，返回开始目录
        return startDir
      }
      currentDir = parentDir
    }
    
    return startDir
  }

  /**
   * 检查是否是 monorepo 根目录
   */
  private isMonorepoRoot(dir: string): boolean {
    const packageJsonPath = join(dir, 'package.json')
    if (!existsSync(packageJsonPath)) {
      return false
    }

    try {
      const packageJson = require(packageJsonPath)
      
      // 检查是否有 workspaces 配置
      if (packageJson.workspaces) {
        return true
      }
      
      // 检查是否有常见的 monorepo 目录结构
      const monorepoIndicators = ['packages', 'modules', 'apps', 'libs']
      return monorepoIndicators.some(indicator => 
        existsSync(join(dir, indicator))
      )
    } catch {
      return false
    }
  }

  /**
   * 检测包目录
   */
  private detectPackageDirectories(projectRoot: string): string[] {
    const potentialDirs = ['packages', 'modules', 'apps', 'libs', 'components']
    const existingDirs: string[] = []

    for (const dir of potentialDirs) {
      const fullPath = join(projectRoot, dir)
      if (existsSync(fullPath)) {
        existingDirs.push(dir)
      }
    }

    return existingDirs
  }

  /**
   * 查找 TypeScript 配置文件
   */
  private findTsConfigPath(projectRoot: string): string | undefined {
    const possiblePaths = [
      'tsconfig.json',
      'tsconfig.build.json',
      'tsconfig.base.json'
    ]

    for (const path of possiblePaths) {
      const fullPath = join(projectRoot, path)
      if (existsSync(fullPath)) {
        return fullPath
      }
    }

    return undefined
  }

  /**
   * 重置配置（用于测试）
   */
  static reset(): void {
    ExtractorConfig.instance = undefined as unknown as ExtractorConfig
  }

  /**
   * 更新工作目录
   */
  updateWorkingDirectory(newWorkingDir: string): void {
    this.config = this.detectProjectConfiguration(newWorkingDir)
  }
}