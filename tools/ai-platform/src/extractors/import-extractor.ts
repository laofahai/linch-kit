/**
 * ImportExtractor
 *
 * 使用 ts-morph 分析模块导入导出关系，构建跨包依赖图谱
 * 识别循环依赖和关键路径，支持动态导入分析
 */

import { readdir, stat } from 'fs/promises'
import { join, extname } from 'path'

import {
  Project,
  SourceFile,
  SyntaxKind,
  ImportDeclaration,
  ExportDeclaration,
  ImportSpecifier,
  ExportSpecifier,
} from 'ts-morph'

import { NodeType, RelationType, type GraphNode, type GraphRelationship } from '../types/index'
import { NodeIdGenerator, RelationshipIdGenerator } from '../types/index'

import { BaseExtractor } from './base-extractor'

interface ImportInfo {
  specifiers: Array<{
    imported: string
    local: string
    type: 'default' | 'namespace' | 'named'
  }>
  source: string
  filePath: string
  lineNumber?: number
  isDynamic: boolean
  packageName?: string
}

interface ExportInfo {
  specifiers: Array<{
    exported: string
    local: string
    type: 'default' | 'namespace' | 'named'
  }>
  source?: string
  filePath: string
  lineNumber?: number
  packageName?: string
}

interface ModuleDependency {
  from: string
  to: string
  importedItems: string[]
  dependencyType: 'internal' | 'external'
}

interface DependencyAnalysis {
  imports: ImportInfo[]
  exports: ExportInfo[]
  dependencies: ModuleDependency[]
}

/**
 * 导入导出关系提取器
 */
export class ImportExtractor extends BaseExtractor<DependencyAnalysis> {
  private project: Project
  private sourceFiles: SourceFile[] = []

  constructor(workingDirectory?: string) {
    super('ImportExtractor', workingDirectory)
    const tsConfigPath = this.config.getTsConfigPath()
    this.project = new Project({
      tsConfigFilePath: tsConfigPath,
      skipAddingFilesFromTsConfig: true,
      skipFileDependencyResolution: true,
    })
  }

  /**
   * 安全地转换行号，处理BigInt类型
   */
  private safeLineNumber(lineNumber: number | bigint): number {
    return typeof lineNumber === 'bigint' ? Number(lineNumber) : lineNumber
  }

  protected async extractRawData(): Promise<DependencyAnalysis> {
    const startTime = Date.now()
    this.logger.info('开始分析模块依赖关系...')

    // 收集所有代码文件
    const files = await this.collectCodeFiles()
    this.logger.info(`找到 ${files.length} 个代码文件`)

    // 添加文件到项目
    for (const filePath of files) {
      try {
        this.sourceFiles.push(this.project.addSourceFileAtPath(filePath))
      } catch (error) {
        this.logger.warn(`无法解析模块 ${filePath}`, {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    const analysis: DependencyAnalysis = {
      imports: [],
      exports: [],
      dependencies: [],
    }

    // 分析每个源文件
    for (const sourceFile of this.sourceFiles) {
      try {
        const fileAnalysis = await this.analyzeSourceFile(sourceFile)

        analysis.imports.push(...fileAnalysis.imports)
        analysis.exports.push(...fileAnalysis.exports)
        analysis.dependencies.push(...fileAnalysis.dependencies)
      } catch (error) {
        this.logger.warn(`分析文件失败: ${sourceFile.getFilePath()}`, {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    const endTime = Date.now()
    this.logger.info('模块依赖分析完成', {
      duration: endTime - startTime,
      importsCount: analysis.imports.length,
      exportsCount: analysis.exports.length,
      dependenciesCount: analysis.dependencies.length,
    })

    return analysis
  }

  private async collectCodeFiles(): Promise<string[]> {
    const files: string[] = []

    const scanDirectory = async (dir: string): Promise<void> => {
      try {
        const items = await readdir(dir)

        for (const item of items) {
          const fullPath = join(dir, item)

          if (this.shouldExcludePath(item) || item.startsWith('.')) {
            continue
          }

          const stats = await stat(fullPath)

          if (stats.isDirectory()) {
            await scanDirectory(fullPath)
          } else if (stats.isFile()) {
            const ext = extname(item)
            if (this.isSupportedExtension(ext)) {
              files.push(fullPath)
            }
          }
        }
      } catch (error) {
        this.logger.warn(`扫描目录失败: ${dir}`, {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // 扫描项目根目录
    await scanDirectory(this.getProjectRoot())

    // 扫描包目录
    const packageDirs = this.config.getPackageDirectories()
    for (const packageDir of packageDirs) {
      const packagePath = join(this.getProjectRoot(), packageDir)
      try {
        const packages = await readdir(packagePath)
        for (const pkg of packages) {
          const pkgPath = join(packagePath, pkg)
          const stats = await stat(pkgPath)
          if (stats.isDirectory()) {
            await scanDirectory(pkgPath)
          }
        }
      } catch {
        // 目录不存在，跳过
      }
    }

    return files
  }

  private async analyzeSourceFile(sourceFile: SourceFile): Promise<DependencyAnalysis> {
    const filePath = this.normalizeFilePath(sourceFile.getFilePath())
    const packageName = this.getPackageNameFromPath(filePath)

    const analysis: DependencyAnalysis = {
      imports: [],
      exports: [],
      dependencies: [],
    }

    // 分析静态导入
    sourceFile.getImportDeclarations().forEach(importDecl => {
      const importInfo = this.extractImportInfo(importDecl, filePath, packageName)
      if (importInfo) {
        analysis.imports.push(importInfo)

        // 计算依赖关系
        const dependency = this.createDependency(importInfo, filePath)
        if (dependency) {
          analysis.dependencies.push(dependency)
        }
      }
    })

    // 分析导出声明
    sourceFile.getExportDeclarations().forEach(exportDecl => {
      const exportInfo = this.extractExportInfo(exportDecl, filePath, packageName)
      if (exportInfo) {
        analysis.exports.push(exportInfo)
      }
    })

    // 分析默认导出
    const defaultExport = sourceFile.getDefaultExportSymbol()
    if (defaultExport) {
      analysis.exports.push({
        specifiers: [
          {
            exported: 'default',
            local: defaultExport.getName() || 'default',
            type: 'default',
          },
        ],
        filePath,
        packageName,
      })
    }

    // 分析动态导入
    sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(call => {
      if (call.getExpression().getKind() === SyntaxKind.ImportKeyword) {
        const arg = call.getArguments()[0]
        if (arg && arg.getKind() === SyntaxKind.StringLiteral) {
          const moduleSpecifier = arg.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralValue()

          const dynamicImport: ImportInfo = {
            specifiers: [
              {
                imported: '*',
                local: '*',
                type: 'namespace',
              },
            ],
            source: moduleSpecifier,
            filePath,
            lineNumber: this.safeLineNumber(call.getStartLineNumber()),
            isDynamic: true,
            packageName,
          }

          analysis.imports.push(dynamicImport)

          const dependency = this.createDependency(dynamicImport, filePath)
          if (dependency) {
            analysis.dependencies.push(dependency)
          }
        }
      }
    })

    return analysis
  }

  private extractImportInfo(
    importDecl: ImportDeclaration,
    filePath: string,
    packageName?: string
  ): ImportInfo | null {
    const source = importDecl.getModuleSpecifierValue()
    if (!source) return null

    const specifiers: ImportInfo['specifiers'] = []

    // 处理命名导入
    importDecl.getNamedImports().forEach((namedImport: ImportSpecifier) => {
      specifiers.push({
        imported: namedImport.getName(),
        local: namedImport.getAliasNode()?.getText() || namedImport.getName(),
        type: 'named',
      })
    })

    // 处理默认导入
    const defaultImport = importDecl.getDefaultImport()
    if (defaultImport) {
      specifiers.push({
        imported: 'default',
        local: defaultImport.getText(),
        type: 'default',
      })
    }

    // 处理命名空间导入
    const namespaceImport = importDecl.getNamespaceImport()
    if (namespaceImport) {
      specifiers.push({
        imported: '*',
        local: namespaceImport.getText(),
        type: 'namespace',
      })
    }

    return {
      specifiers,
      source,
      filePath,
      lineNumber: this.safeLineNumber(importDecl.getStartLineNumber()),
      isDynamic: false,
      packageName,
    }
  }

  private extractExportInfo(
    exportDecl: ExportDeclaration,
    filePath: string,
    packageName?: string
  ): ExportInfo | null {
    const specifiers: ExportInfo['specifiers'] = []

    // 处理命名导出
    exportDecl.getNamedExports().forEach((namedExport: ExportSpecifier) => {
      specifiers.push({
        exported: namedExport.getAliasNode()?.getText() || namedExport.getName(),
        local: namedExport.getName(),
        type: 'named',
      })
    })

    // 处理重新导出
    const source = exportDecl.getModuleSpecifier()?.getLiteralValue()

    if (specifiers.length === 0 && !source) return null

    return {
      specifiers,
      source,
      filePath,
      lineNumber: this.safeLineNumber(exportDecl.getStartLineNumber()),
      packageName,
    }
  }

  private createDependency(importInfo: ImportInfo, fromFile: string): ModuleDependency | null {
    const dependencyType = this.isExternalModule(importInfo.source) ? 'external' : 'internal'
    const importedItems = importInfo.specifiers.map(s => s.imported)

    return {
      from: fromFile,
      to: importInfo.source,
      importedItems,
      dependencyType,
    }
  }

  private isExternalModule(source: string): boolean {
    return !source.startsWith('.') && !source.startsWith('/')
  }

  private getPackageNameFromPath(filePath: string): string | undefined {
    const segments = filePath.split('/')

    // 检查 packages/ 目录
    const packagesIndex = segments.findIndex(segment => segment === 'packages')
    if (packagesIndex >= 0 && packagesIndex < segments.length - 1) {
      return `@linch-kit/${segments[packagesIndex + 1]}`
    }

    // 检查 apps/ 目录
    const appsIndex = segments.findIndex(segment => segment === 'apps')
    if (appsIndex >= 0 && appsIndex < segments.length - 1) {
      return segments[appsIndex + 1]
    }

    // 检查 modules/ 目录
    const modulesIndex = segments.findIndex(segment => segment === 'modules')
    if (modulesIndex >= 0 && modulesIndex < segments.length - 1) {
      return segments[modulesIndex + 1]
    }

    return undefined
  }

  protected async transformToGraph(rawData: DependencyAnalysis): Promise<{
    nodes: GraphNode[]
    relationships: GraphRelationship[]
  }> {
    const nodes: GraphNode[] = []
    const relationships: GraphRelationship[] = []

    // 创建导入节点
    for (const importInfo of rawData.imports) {
      for (const spec of importInfo.specifiers) {
        const importId = NodeIdGenerator.generate(
          NodeType.IMPORT,
          `${spec.imported}_from_${importInfo.source}`,
          importInfo.packageName || 'unknown'
        )

        const importNode: GraphNode = {
          id: importId,
          type: NodeType.IMPORT,
          name: `${spec.imported} from ${importInfo.source}`,
          properties: {
            imported_name: spec.imported,
            local_name: spec.local,
            import_type: spec.type,
            source: importInfo.source,
            is_dynamic: importInfo.isDynamic,
            file_path: importInfo.filePath,
            line_number: importInfo.lineNumber,
          },
          metadata: this.createMetadata(importInfo.filePath, importInfo.packageName),
        }

        nodes.push(importNode)

        // 创建文件导入关系
        const fileNodeId = NodeIdGenerator.generate(
          NodeType.FILE,
          importInfo.filePath,
          importInfo.packageName || 'unknown'
        )
        const importRelId = RelationshipIdGenerator.generate(
          RelationType.IMPORTS,
          fileNodeId,
          importId
        )

        relationships.push({
          id: importRelId,
          type: RelationType.IMPORTS,
          source: fileNodeId,
          target: importId,
          properties: {
            import_type: importInfo.isDynamic ? 'dynamic' : 'static',
          },
          metadata: this.createMetadata(importInfo.filePath, importInfo.packageName),
        })
      }
    }

    // 创建导出节点
    for (const exportInfo of rawData.exports) {
      for (const spec of exportInfo.specifiers) {
        const exportId = NodeIdGenerator.generate(
          NodeType.EXPORT,
          spec.exported,
          exportInfo.packageName || 'unknown'
        )

        const exportNode: GraphNode = {
          id: exportId,
          type: NodeType.EXPORT,
          name: `export ${spec.exported}`,
          properties: {
            exported_name: spec.exported,
            local_name: spec.local,
            export_type: spec.type,
            source: exportInfo.source,
            file_path: exportInfo.filePath,
            line_number: exportInfo.lineNumber,
          },
          metadata: this.createMetadata(exportInfo.filePath, exportInfo.packageName),
        }

        nodes.push(exportNode)

        // 创建文件导出关系
        const fileNodeId = NodeIdGenerator.generate(
          NodeType.FILE,
          exportInfo.filePath,
          exportInfo.packageName || 'unknown'
        )
        const exportRelId = RelationshipIdGenerator.generate(
          RelationType.EXPORTS,
          fileNodeId,
          exportId
        )

        relationships.push({
          id: exportRelId,
          type: RelationType.EXPORTS,
          source: fileNodeId,
          target: exportId,
          metadata: this.createMetadata(exportInfo.filePath, exportInfo.packageName),
        })
      }
    }

    // 创建模块依赖关系
    for (const dependency of rawData.dependencies) {
      const sourceFileId = NodeIdGenerator.generate(NodeType.FILE, dependency.from, 'unknown')
      const targetFileId =
        dependency.dependencyType === 'internal'
          ? NodeIdGenerator.generate(NodeType.FILE, dependency.to, 'unknown')
          : `external:${dependency.to.replace(/[^a-zA-Z0-9-_]/g, '_')}`

      const depRelId = RelationshipIdGenerator.generate(
        RelationType.DEPENDS_ON,
        sourceFileId,
        targetFileId
      )

      relationships.push({
        id: depRelId,
        type: RelationType.DEPENDS_ON,
        source: sourceFileId,
        target: targetFileId,
        properties: {
          dependency_type: dependency.dependencyType,
          imported_items: dependency.importedItems,
        },
        metadata: this.createMetadata(dependency.from),
      })
    }

    this.logger.info('导入导出图数据转换完成', {
      nodeCount: nodes.length,
      relationshipCount: relationships.length,
    })

    return { nodes, relationships }
  }

  getNodeType(): NodeType[] {
    return [NodeType.IMPORT, NodeType.EXPORT]
  }

  getRelationTypes(): RelationType[] {
    return [RelationType.IMPORTS, RelationType.EXPORTS, RelationType.DEPENDS_ON]
  }

  protected getSourceCount(rawData: DependencyAnalysis): number {
    return rawData.imports.length + rawData.exports.length
  }
}
