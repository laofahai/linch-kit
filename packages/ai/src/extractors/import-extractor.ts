/**
 * Import Extractor
 * 
 * 专门分析模块导入导出关系，构建代码依赖图谱
 */

import { readFile, readdir, stat } from 'fs/promises'
import { join, extname, relative, resolve, dirname } from 'path'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'

import { 
  NodeType, 
  RelationType, 
  type GraphNode, 
  type GraphRelationship
} from '../types/index.js'
import { NodeIdGenerator, RelationshipIdGenerator } from '../types/index.js'
import { BaseExtractor } from './base-extractor.js'

interface ImportStatement {
  specifiers: Array<{
    imported: string    // 导入的名称
    local: string      // 本地名称
    type: 'default' | 'namespace' | 'named'
  }>
  source: string       // 导入源路径
  resolvedPath?: string // 解析后的绝对路径
  isExternal: boolean  // 是否外部依赖
  filePath: string     // 当前文件路径
  relativePath: string // 相对路径
  lineNumber?: number
  packageName?: string
}

interface ExportStatement {
  specifiers: Array<{
    exported: string   // 导出的名称
    local: string     // 本地名称
    type: 'default' | 'namespace' | 'named'
  }>
  source?: string      // 重新导出的源
  resolvedPath?: string
  isReexport: boolean  // 是否重新导出
  filePath: string
  relativePath: string
  lineNumber?: number
  packageName?: string
}

interface ModuleDependency {
  from: string         // 依赖方文件
  to: string          // 被依赖文件/模块
  importedItems: string[] // 导入的具体项目
  dependencyType: 'internal' | 'external' | 'builtin'
  isTypeOnly: boolean  // 是否仅类型导入
}

interface ExtractionData {
  imports: ImportStatement[]
  exports: ExportStatement[]
  dependencies: ModuleDependency[]
  files: Array<{
    path: string
    relativePath: string
    packageName?: string
    exports: string[]    // 该文件导出的所有项目
    imports: string[]    // 该文件导入的所有项目
  }>
}

/**
 * 导入导出关系提取器
 */
export class ImportExtractor extends BaseExtractor<ExtractionData> {
  private readonly supportedExtensions = ['.ts', '.js', '.tsx', '.jsx']
  private readonly excludeDirs = ['node_modules', 'dist', 'build', '.next', '.git', 'coverage']
  private readonly builtinModules = new Set([
    'fs', 'path', 'http', 'https', 'url', 'os', 'crypto', 'util', 'events', 'stream',
    'buffer', 'child_process', 'cluster', 'dgram', 'dns', 'net', 'readline', 'repl',
    'tls', 'tty', 'vm', 'worker_threads', 'zlib', 'assert', 'async_hooks'
  ])

  constructor() {
    super('ImportExtractor')
  }

  getNodeType() {
    return [NodeType.IMPORT, NodeType.EXPORT, NodeType.FILE]
  }

  getRelationTypes() {
    return [
      RelationType.IMPORTS,
      RelationType.EXPORTS, 
      RelationType.DEPENDS_ON,
      RelationType.REFERENCES
    ]
  }

  /**
   * 提取原始数据
   */
  async extractRawData(): Promise<ExtractionData> {
    const files = await this.scanCodeFiles()
    const imports: ImportStatement[] = []
    const exports: ExportStatement[] = []
    const dependencies: ModuleDependency[] = []
    const fileInfos: ExtractionData['files'] = []

    this.logger.info(`分析 ${files.length} 个文件的导入导出关系`)

    for (const file of files) {
      try {
        const analysis = await this.analyzeFile(file.path, file.relativePath, file.packageName)
        
        imports.push(...analysis.imports)
        exports.push(...analysis.exports)
        
        // 计算依赖关系
        const fileDeps = this.calculateDependencies(analysis.imports, file.relativePath)
        dependencies.push(...fileDeps)
        
        // 收集文件信息
        fileInfos.push({
          path: file.path,
          relativePath: file.relativePath,
          packageName: file.packageName,
          exports: analysis.exports.flatMap(exp => exp.specifiers.map(s => s.exported)),
          imports: analysis.imports.flatMap(imp => imp.specifiers.map(s => s.local))
        })
      } catch (error) {
        this.logger.warn(`分析文件失败: ${file.relativePath}`, { error })
      }
    }

    this.logger.info('导入导出分析完成', {
      importsCount: imports.length,
      exportsCount: exports.length,
      dependenciesCount: dependencies.length
    })

    return {
      imports,
      exports, 
      dependencies,
      files: fileInfos
    }
  }

  /**
   * 转换为图数据格式
   */
  async transformToGraph(rawData: ExtractionData): Promise<{
    nodes: GraphNode[]
    relationships: GraphRelationship[]
  }> {
    const nodes: GraphNode[] = []
    const relationships: GraphRelationship[] = []

    // 创建文件节点 (避免关系创建失败)
    const fileNodeMap = new Map<string, GraphNode>()
    const processedFiles = new Set<string>()

    // 从所有数据中收集唯一的文件路径
    const allFiles = new Set<string>()
    rawData.imports.forEach(imp => allFiles.add(imp.relativePath))
    rawData.exports.forEach(exp => allFiles.add(exp.relativePath))
    rawData.dependencies.forEach(dep => {
      allFiles.add(dep.from)
      if (dep.dependencyType === 'internal') allFiles.add(dep.to)
    })

    // 为每个文件创建文件节点
    for (const filePath of allFiles) {
      if (!processedFiles.has(filePath)) {
        const fileNode = this.createFileNode(filePath)
        nodes.push(fileNode)
        fileNodeMap.set(filePath, fileNode)
        processedFiles.add(filePath)
      }
    }

    // 创建导入节点
    for (const importStmt of rawData.imports) {
      for (const spec of importStmt.specifiers) {
        const importNode = this.createImportNode(importStmt, spec)
        nodes.push(importNode)

        // 创建文件到导入的关系
        const fileImportRel = this.createFileImportRelationship(importStmt.relativePath, importNode.id)
        if (fileImportRel) relationships.push(fileImportRel)
      }
    }

    // 创建导出节点
    for (const exportStmt of rawData.exports) {
      for (const spec of exportStmt.specifiers) {
        const exportNode = this.createExportNode(exportStmt, spec)
        nodes.push(exportNode)

        // 创建文件到导出的关系
        const fileExportRel = this.createFileExportRelationship(exportStmt.relativePath, exportNode.id)
        if (fileExportRel) relationships.push(fileExportRel)
      }
    }

    // 创建依赖关系
    for (const dep of rawData.dependencies) {
      const depRel = this.createDependencyRelationship(dep)
      if (depRel) relationships.push(depRel)
    }

    return { nodes, relationships }
  }

  /**
   * 扫描代码文件
   */
  private async scanCodeFiles() {
    const files: Array<{ path: string; relativePath: string; packageName?: string }> = []
    
    // 扫描项目根目录
    await this.scanDirectory(process.cwd(), files)
    
    // 扫描包目录
    const packageDirs = ['packages', 'modules', 'apps']
    for (const packageDir of packageDirs) {
      const packagePath = join(process.cwd(), packageDir)
      try {
        const packages = await readdir(packagePath)
        for (const pkg of packages) {
          const pkgPath = join(packagePath, pkg)
          const stats = await stat(pkgPath)
          if (stats.isDirectory()) {
            await this.scanDirectory(pkgPath, files, `@linch-kit/${pkg}`)
          }
        }
      } catch {
        // 目录不存在，跳过
      }
    }

    return files
  }

  /**
   * 扫描目录中的代码文件
   */
  private async scanDirectory(
    dirPath: string, 
    files: Array<{ path: string; relativePath: string; packageName?: string }>, 
    packageName?: string
  ) {
    try {
      const items = await readdir(dirPath)
      
      for (const item of items) {
        if (this.excludeDirs.includes(item) || item.startsWith('.')) {
          continue
        }

        const itemPath = join(dirPath, item)
        const stats = await stat(itemPath)
        const relativePath = relative(process.cwd(), itemPath)

        if (stats.isFile()) {
          const ext = extname(item).toLowerCase()
          if (this.supportedExtensions.includes(ext)) {
            files.push({
              path: itemPath,
              relativePath,
              packageName
            })
          }
        } else if (stats.isDirectory()) {
          // 递归扫描子目录（限制深度）
          const depth = relativePath.split('/').length
          if (depth <= 5) {
            await this.scanDirectory(itemPath, files, packageName)
          }
        }
      }
    } catch (error) {
      this.logger.debug(`扫描目录失败: ${dirPath}`, { error })
    }
  }

  /**
   * 分析单个文件
   */
  private async analyzeFile(filePath: string, relativePath: string, packageName?: string) {
    try {
      const content = await readFile(filePath, 'utf8')
      
      // 跳过空文件
      if (!content.trim()) {
        return { imports: [], exports: [] }
      }
      
      const ast = parse(content, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowAwaitOutsideFunction: true,
        allowReturnOutsideFunction: true,
        allowSuperOutsideMethod: true,
        allowUndeclaredExports: true,
        plugins: [
          'typescript',
          'jsx',
          'decorators-legacy',
          'classProperties',
          'objectRestSpread',
          'optionalChaining',
          'nullishCoalescingOperator',
          'dynamicImport',
          'importMeta',
          'bigInt',
          'optionalCatchBinding',
          'throwExpressions',
          'topLevelAwait',
          'classStaticBlock',
          'privateIn'
        ]
      })

      const imports: ImportStatement[] = []
      const exports: ExportStatement[] = []

      traverse(ast, {
        ImportDeclaration: (path) => {
          const importStmt = this.extractImport(path.node, filePath, relativePath, packageName)
          if (importStmt) imports.push(importStmt)
        },

        ExportNamedDeclaration: (path) => {
          const exportStmt = this.extractNamedExport(path.node, filePath, relativePath, packageName)
          if (exportStmt) exports.push(exportStmt)
        },

        ExportDefaultDeclaration: (path) => {
          const exportStmt = this.extractDefaultExport(path.node, filePath, relativePath, packageName)
          if (exportStmt) exports.push(exportStmt)
        },

        ExportAllDeclaration: (path) => {
          const exportStmt = this.extractAllExport(path.node, filePath, relativePath, packageName)
          if (exportStmt) exports.push(exportStmt)
        }
      })

      return { imports, exports }
    } catch (error) {
      this.logger.debug(`文件解析失败: ${relativePath}`, { 
        error: error instanceof Error ? error.message : String(error),
        filePath: relativePath 
      })
      return { imports: [], exports: [] }
    }
  }

  /**
   * 提取导入声明
   */
  private extractImport(
    node: t.ImportDeclaration,
    filePath: string,
    relativePath: string,
    packageName?: string
  ): ImportStatement | null {
    const specifiers: ImportStatement['specifiers'] = []
    const source = node.source.value
    const isExternal = this.isExternalModule(source)

    for (const spec of node.specifiers) {
      if (t.isImportDefaultSpecifier(spec)) {
        specifiers.push({
          imported: 'default',
          local: spec.local.name,
          type: 'default'
        })
      } else if (t.isImportNamespaceSpecifier(spec)) {
        specifiers.push({
          imported: '*',
          local: spec.local.name,
          type: 'namespace'
        })
      } else if (t.isImportSpecifier(spec)) {
        const imported = t.isIdentifier(spec.imported) ? spec.imported.name : spec.imported.value
        specifiers.push({
          imported,
          local: spec.local.name,
          type: 'named'
        })
      }
    }

    return {
      specifiers,
      source,
      resolvedPath: isExternal ? undefined : this.resolveImportPath(source, filePath),
      isExternal,
      filePath,
      relativePath,
      lineNumber: node.loc?.start.line,
      packageName
    }
  }

  /**
   * 提取命名导出
   */
  private extractNamedExport(
    node: t.ExportNamedDeclaration,
    filePath: string,
    relativePath: string,
    packageName?: string
  ): ExportStatement | null {
    const specifiers: ExportStatement['specifiers'] = []
    const source = node.source?.value
    const isReexport = !!source

    if (node.specifiers.length > 0) {
      for (const spec of node.specifiers) {
        if (t.isExportSpecifier(spec)) {
          const exported = t.isIdentifier(spec.exported) ? spec.exported.name : spec.exported.value
          const local = spec.local.name
          specifiers.push({
            exported,
            local,
            type: 'named'
          })
        }
      }
    } else if (node.declaration) {
      // 直接导出声明
      const exported = this.extractDeclarationName(node.declaration)
      if (exported) {
        specifiers.push({
          exported,
          local: exported,
          type: 'named'
        })
      }
    }

    if (specifiers.length === 0) return null

    return {
      specifiers,
      source,
      resolvedPath: source && !this.isExternalModule(source) ? this.resolveImportPath(source, filePath) : undefined,
      isReexport,
      filePath,
      relativePath,
      lineNumber: node.loc?.start.line,
      packageName
    }
  }

  /**
   * 提取默认导出
   */
  private extractDefaultExport(
    node: t.ExportDefaultDeclaration,
    filePath: string,
    relativePath: string,
    packageName?: string
  ): ExportStatement | null {
    const exportedName = this.extractDeclarationName(node.declaration) || 'default'

    return {
      specifiers: [{
        exported: 'default',
        local: exportedName,
        type: 'default'
      }],
      isReexport: false,
      filePath,
      relativePath,
      lineNumber: node.loc?.start.line,
      packageName
    }
  }

  /**
   * 提取全部导出
   */
  private extractAllExport(
    node: t.ExportAllDeclaration,
    filePath: string,
    relativePath: string,
    packageName?: string
  ): ExportStatement | null {
    if (!node.source) return null

    const source = node.source.value

    return {
      specifiers: [{
        exported: '*',
        local: '*',
        type: 'namespace'
      }],
      source,
      resolvedPath: !this.isExternalModule(source) ? this.resolveImportPath(source, filePath) : undefined,
      isReexport: true,
      filePath,
      relativePath,
      lineNumber: node.loc?.start.line,
      packageName
    }
  }

  /**
   * 计算依赖关系
   */
  private calculateDependencies(imports: ImportStatement[], fromFile: string): ModuleDependency[] {
    const dependencies: ModuleDependency[] = []

    for (const imp of imports) {
      const dependencyType = this.getDependencyType(imp.source)
      const importedItems = imp.specifiers.map(s => s.imported)
      
      dependencies.push({
        from: fromFile,
        to: imp.resolvedPath || imp.source,
        importedItems,
        dependencyType,
        isTypeOnly: false // TODO: 检测类型导入
      })
    }

    return dependencies
  }

  // 工具方法
  private isExternalModule(source: string): boolean {
    return !source.startsWith('.') && !source.startsWith('/')
  }

  private getDependencyType(source: string): 'internal' | 'external' | 'builtin' {
    if (this.builtinModules.has(source)) return 'builtin'
    if (this.isExternalModule(source)) return 'external'
    return 'internal'
  }

  private resolveImportPath(source: string, fromFile: string): string {
    try {
      const dir = dirname(fromFile)
      const resolved = resolve(dir, source)
      return relative(process.cwd(), resolved)
    } catch {
      return source
    }
  }

  private extractDeclarationName(declaration: t.Declaration | t.Expression): string | null {
    if (t.isFunctionDeclaration(declaration) && declaration.id) {
      return declaration.id.name
    }
    if (t.isClassDeclaration(declaration) && declaration.id) {
      return declaration.id.name
    }
    if (t.isVariableDeclaration(declaration)) {
      const declarator = declaration.declarations[0]
      if (declarator && t.isIdentifier(declarator.id)) {
        return declarator.id.name
      }
    }
    if (t.isIdentifier(declaration)) {
      return declaration.name
    }
    return null
  }

  // 节点创建方法
  private createImportNode(importStmt: ImportStatement, spec: ImportStatement['specifiers'][0]): GraphNode {
    const nodeId = NodeIdGenerator.api(
      importStmt.packageName || 'unknown', 
      `${importStmt.source}:${spec.imported}`, 
      'import'
    )

    return {
      id: nodeId,
      type: NodeType.IMPORT,
      name: `${spec.imported} from ${importStmt.source}`,
      properties: {
        imported_name: spec.imported,
        local_name: spec.local,
        import_type: spec.type,
        source: importStmt.source,
        resolved_path: importStmt.resolvedPath,
        is_external: importStmt.isExternal,
        file_path: importStmt.relativePath,
        line_number: importStmt.lineNumber
      },
      metadata: this.createMetadata(importStmt.relativePath, importStmt.packageName)
    }
  }

  private createExportNode(exportStmt: ExportStatement, spec: ExportStatement['specifiers'][0]): GraphNode {
    const nodeId = NodeIdGenerator.api(
      exportStmt.packageName || 'unknown',
      `export:${spec.exported}`,
      'export'
    )

    return {
      id: nodeId,
      type: NodeType.EXPORT,
      name: `export ${spec.exported}`,
      properties: {
        exported_name: spec.exported,
        local_name: spec.local,
        export_type: spec.type,
        source: exportStmt.source,
        resolved_path: exportStmt.resolvedPath,
        is_reexport: exportStmt.isReexport,
        file_path: exportStmt.relativePath,
        line_number: exportStmt.lineNumber
      },
      metadata: this.createMetadata(exportStmt.relativePath, exportStmt.packageName)
    }
  }

  private createFileImportRelationship(filePath: string, importNodeId: string): GraphRelationship | null {
    const fileNodeId = `file:${filePath.replace(/[^a-zA-Z0-9-_]/g, '_')}`

    return {
      id: RelationshipIdGenerator.create(RelationType.IMPORTS, fileNodeId, importNodeId),
      type: RelationType.IMPORTS,
      source: fileNodeId,
      target: importNodeId,
      metadata: this.createMetadata(filePath)
    }
  }

  private createFileExportRelationship(filePath: string, exportNodeId: string): GraphRelationship | null {
    const fileNodeId = `file:${filePath.replace(/[^a-zA-Z0-9-_]/g, '_')}`

    return {
      id: RelationshipIdGenerator.create(RelationType.EXPORTS, fileNodeId, exportNodeId),
      type: RelationType.EXPORTS,
      source: fileNodeId,
      target: exportNodeId,
      metadata: this.createMetadata(filePath)
    }
  }

  /**
   * 创建文件节点
   */
  private createFileNode(filePath: string): GraphNode {
    const fileNodeId = `file:${filePath.replace(/[^a-zA-Z0-9-_]/g, '_')}`
    const fileName = filePath.split('/').pop() || filePath
    const packageName = this.getPackageNameFromPath(filePath)

    return {
      id: fileNodeId,
      type: NodeType.FILE,
      name: fileName,
      properties: {
        path: filePath,
        packageName,
        extension: fileName.split('.').pop() || '',
        size: 0 // 实际应该获取文件大小
      },
      metadata: this.createMetadata(filePath, packageName)
    }
  }

  /**
   * 从文件路径获取包名
   */
  private getPackageNameFromPath(filePath: string): string | undefined {
    // 简单的包名推断逻辑
    const segments = filePath.split('/')
    const packagesIndex = segments.findIndex(segment => segment === 'packages')
    
    if (packagesIndex >= 0 && packagesIndex < segments.length - 1) {
      // 如果路径包含 packages/，取下一个段作为包名
      return segments[packagesIndex + 1]
    }
    
    // 如果是 apps/ 目录
    const appsIndex = segments.findIndex(segment => segment === 'apps')
    if (appsIndex >= 0 && appsIndex < segments.length - 1) {
      return segments[appsIndex + 1]
    }
    
    // 如果是 modules/ 目录
    const modulesIndex = segments.findIndex(segment => segment === 'modules')
    if (modulesIndex >= 0 && modulesIndex < segments.length - 1) {
      return segments[modulesIndex + 1]
    }
    
    return undefined
  }

  private createDependencyRelationship(dep: ModuleDependency): GraphRelationship | null {
    const fromNodeId = `file:${dep.from.replace(/[^a-zA-Z0-9-_]/g, '_')}`
    const toNodeId = dep.dependencyType === 'internal' 
      ? `file:${dep.to.replace(/[^a-zA-Z0-9-_]/g, '_')}`
      : `external:${dep.to.replace(/[^a-zA-Z0-9-_]/g, '_')}`

    return {
      id: RelationshipIdGenerator.create(RelationType.DEPENDS_ON, fromNodeId, toNodeId),
      type: RelationType.DEPENDS_ON,
      source: fromNodeId,
      target: toNodeId,
      properties: {
        dependency_type: dep.dependencyType,
        imported_items: dep.importedItems,
        is_type_only: dep.isTypeOnly
      },
      metadata: this.createMetadata(dep.from)
    }
  }

  /**
   * 验证提取的数据
   */
  validate(data: ExtractionData): boolean {
    return Array.isArray(data.imports) && 
           Array.isArray(data.exports) && 
           Array.isArray(data.dependencies) &&
           Array.isArray(data.files)
  }

  /**
   * 获取源数据数量
   */
  protected getSourceCount(rawData: ExtractionData): number {
    return rawData.imports.length + rawData.exports.length
  }
}