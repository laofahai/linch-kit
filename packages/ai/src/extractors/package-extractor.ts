/**
 * Package Dependency Extractor
 * 
 * 提取 LinchKit 包依赖关系和元数据
 * 基于现有的 deps-graph.js 逻辑，符合包复用约束
 */

import { readdir, readFile, access, stat } from 'fs/promises'
import { join, relative, extname } from 'path'

import { NodeIdGenerator, RelationshipIdGenerator } from '../types/index.js'
import type {
  GraphNode,
  GraphRelationship,
  PackageNode
} from '../types/index.js'
import { NodeType, RelationType } from '../types/index.js'

import { BaseExtractor } from './base-extractor.js'

interface PackageInfo {
  name: string
  path: string
  packageJson: {
    name: string
    version?: string
    description?: string
    main?: string
    types?: string
    keywords?: string[]
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
  }
}

interface PackageExtractionData {
  packages: PackageInfo[]
  buildOrder: string[]
  dependencies: Map<string, Set<string>>
}

/**
 * 包依赖提取器
 * 复用现有的依赖分析逻辑，转换为统一的Graph格式
 */
export class PackageExtractor extends BaseExtractor<PackageExtractionData> {
  constructor(workingDirectory?: string) {
    super('PackageExtractor', workingDirectory)
  }

  getNodeType(): NodeType[] {
    return [NodeType.PACKAGE, NodeType.FILE]
  }

  getRelationTypes(): RelationType[] {
    return [RelationType.DEPENDS_ON, RelationType.CONTAINS]
  }

  /**
   * 提取包依赖原始数据
   */
  protected async extractRawData(): Promise<PackageExtractionData> {
    const packages = await this.scanWorkspacePackages()
    const dependencies = await this.analyzeDependencies(packages)
    const buildOrder = this.calculateBuildOrder(packages, dependencies)
    
    return {
      packages,
      buildOrder,
      dependencies
    }
  }

  /**
   * 转换为Graph数据格式
   */
  protected async transformToGraph(rawData: PackageExtractionData): Promise<{
    nodes: GraphNode[]
    relationships: GraphRelationship[]
  }> {
    const nodes: GraphNode[] = []
    const relationships: GraphRelationship[] = []
    
    // 1. 创建包节点
    for (const pkg of rawData.packages) {
      const packageNode = this.createPackageNode(pkg)
      nodes.push(packageNode)
      
      // 2. 添加关键文件节点
      const fileNodes = await this.createFileNodes(pkg)
      nodes.push(...fileNodes.nodes)
      relationships.push(...fileNodes.relationships)
    }
    
    // 3. 创建依赖关系
    for (const [packageName, deps] of rawData.dependencies) {
      for (const dep of deps) {
        const relationship = this.createDependencyRelationship(packageName, dep)
        relationships.push(relationship)
      }
    }
    
    return { nodes, relationships }
  }

  /**
   * 扫描工作空间包
   */
  private async scanWorkspacePackages(): Promise<PackageInfo[]> {
    const packages: PackageInfo[] = []
    
    // 扫描 packages 目录
    await this.scanDirectory(join(process.cwd(), 'packages'), packages)
    
    // 扫描 modules 目录  
    await this.scanDirectory(join(process.cwd(), 'modules'), packages)
    
    this.logger.debug(`发现 ${packages.length} 个包`, {
      packageNames: packages.map(p => p.name)
    })
    
    return packages
  }

  /**
   * 扫描指定目录下的包
   */
  private async scanDirectory(dirPath: string, packages: PackageInfo[]): Promise<void> {
    try {
      const items = await readdir(dirPath)
      
      for (const item of items) {
        const itemPath = join(dirPath, item)
        const packageJsonPath = join(itemPath, 'package.json')
        
        try {
          await access(packageJsonPath)
          const content = await readFile(packageJsonPath, 'utf8')
          const packageJson = JSON.parse(content)
          
          if (packageJson.name) {
            packages.push({
              name: packageJson.name,
              path: itemPath,
              packageJson
            })
          }
        } catch {
          // package.json 不存在或格式错误，跳过
        }
      }
    } catch {
      // 目录不存在，跳过
      this.logger.debug(`目录 ${dirPath} 不存在，跳过扫描`)
    }
  }

  /**
   * 分析包依赖关系
   */
  private async analyzeDependencies(packages: PackageInfo[]): Promise<Map<string, Set<string>>> {
    const dependencies = new Map<string, Set<string>>()
    
    for (const pkg of packages) {
      const deps = new Set<string>()
      
      // 收集所有类型的依赖
      const allDeps = {
        ...pkg.packageJson.dependencies,
        ...pkg.packageJson.devDependencies,
        ...pkg.packageJson.peerDependencies
      }
      
      // 只关心 LinchKit 内部包依赖
      for (const depName of Object.keys(allDeps)) {
        if (depName.startsWith('@linch-kit/')) {
          deps.add(depName)
        }
      }
      
      dependencies.set(pkg.name, deps)
    }
    
    return dependencies
  }

  /**
   * 计算构建顺序 (拓扑排序)
   */
  private calculateBuildOrder(
    packages: PackageInfo[], 
    dependencies: Map<string, Set<string>>
  ): string[] {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const buildOrder: string[] = []
    const packageMap = new Map(packages.map(p => [p.name, p]))
    
    const visit = (packageName: string): void => {
      if (visited.has(packageName)) return
      if (visiting.has(packageName)) {
        this.logger.warn(`检测到循环依赖: ${packageName}`)
        return
      }
      
      visiting.add(packageName)
      
      const deps = dependencies.get(packageName) || new Set()
      for (const dep of deps) {
        if (packageMap.has(dep)) {
          visit(dep)
        }
      }
      
      visiting.delete(packageName)
      visited.add(packageName)
      buildOrder.push(packageName)
    }
    
    // 访问所有包
    for (const pkg of packages) {
      visit(pkg.name)
    }
    
    return buildOrder
  }

  /**
   * 创建包节点
   */
  private createPackageNode(pkg: PackageInfo): PackageNode {
    return {
      id: NodeIdGenerator.package(pkg.name),
      type: NodeType.PACKAGE,
      name: pkg.name,
      properties: {
        version: pkg.packageJson.version || '1.0.0',
        description: pkg.packageJson.description || '',
        path: relative(process.cwd(), pkg.path),
        main: pkg.packageJson.main || '',
        types: pkg.packageJson.types || '',
        keywords: pkg.packageJson.keywords || [],
        dependencies: Object.keys(pkg.packageJson.dependencies || {}),
        devDependencies: Object.keys(pkg.packageJson.devDependencies || {})
      },
      metadata: this.createMetadata(
        join(pkg.path, 'package.json'),
        pkg.name
      )
    }
  }

  /**
   * 创建文件节点和包含关系
   */
  private async createFileNodes(pkg: PackageInfo): Promise<{
    nodes: GraphNode[]
    relationships: GraphRelationship[]
  }> {
    const nodes: GraphNode[] = []
    const relationships: GraphRelationship[] = []
    
    const keyFiles = [
      'README.md',
      'CHANGELOG.md',
      'DESIGN.md',
      'src/index.ts',
      'src/index.js',
      'package.json'
    ]
    
    for (const fileName of keyFiles) {
      const filePath = join(pkg.path, fileName)
      
      try {
        await access(filePath)
        const fileStats = await stat(filePath)
        
        // 创建文件节点
        const fileNode: GraphNode = {
          id: NodeIdGenerator.file(pkg.name, fileName),
          type: NodeType.FILE,
          name: fileName,
          properties: {
            file_type: extname(fileName).slice(1) || 'unknown',
            file_path: relative(process.cwd(), filePath),
            size: fileStats.size,
            is_key_file: true
          },
          metadata: this.createMetadata(filePath, pkg.name)
        }
        
        nodes.push(fileNode)
        
        // 创建包含关系
        const containsRelationship: GraphRelationship = {
          id: RelationshipIdGenerator.create(
            RelationType.CONTAINS,
            NodeIdGenerator.package(pkg.name),
            fileNode.id
          ),
          type: RelationType.CONTAINS,
          source: NodeIdGenerator.package(pkg.name),
          target: fileNode.id,
          properties: {
            file_type: fileNode.properties?.file_type,
            is_entry_point: fileName.includes('index.') || fileName === 'package.json'
          },
          metadata: this.createMetadata()
        }
        
        relationships.push(containsRelationship)
        
      } catch {
        // 文件不存在，跳过
      }
    }
    
    return { nodes, relationships }
  }

  /**
   * 创建依赖关系
   */
  private createDependencyRelationship(sourcePackage: string, targetPackage: string): GraphRelationship {
    return {
      id: RelationshipIdGenerator.create(
        RelationType.DEPENDS_ON,
        NodeIdGenerator.package(sourcePackage),
        NodeIdGenerator.package(targetPackage)
      ),
      type: RelationType.DEPENDS_ON,
      source: NodeIdGenerator.package(sourcePackage),
      target: NodeIdGenerator.package(targetPackage),
      properties: {
        dependency_type: 'package',
        is_internal: true
      },
      metadata: {
        ...this.createMetadata(),
        confidence: 1.0
      }
    }
  }

  /**
   * 验证提取的数据
   */
  validate(data: PackageExtractionData): boolean {
    return (
      Array.isArray(data.packages) &&
      data.packages.length > 0 &&
      Array.isArray(data.buildOrder) &&
      data.dependencies instanceof Map
    )
  }

  /**
   * 获取源数据数量
   */
  protected getSourceCount(rawData: PackageExtractionData): number {
    return rawData.packages.length
  }
}