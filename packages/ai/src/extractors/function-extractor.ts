/**
 * Function Extractor
 * 
 * 提取 TypeScript/JavaScript 文件中的函数定义、参数、返回类型、JSDoc 等信息
 */

import { readFile, readdir, stat } from 'fs/promises'
import { join, extname, relative } from 'path'

import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'

import { 
  NodeType, 
  RelationType, 
  type GraphNode, 
  type GraphRelationship,
  type FunctionNode 
} from '../types/index.js'
import { NodeIdGenerator, RelationshipIdGenerator } from '../types/index.js'

import { BaseExtractor } from './base-extractor.js'

interface FunctionInfo {
  name: string
  signature: string
  parameters: Array<{
    name: string
    type?: string
    optional?: boolean
    defaultValue?: string
  }>
  returnType?: string
  isAsync: boolean
  isExported: boolean
  isGenerator: boolean
  filePath: string
  relativePath: string
  lineNumber?: number
  endLineNumber?: number
  jsdoc?: string
  accessModifier?: 'public' | 'private' | 'protected'
  complexity?: number
  packageName?: string
}

interface ClassInfo {
  name: string
  isAbstract: boolean
  isExported: boolean
  extendsClass?: string
  implementsInterfaces: string[]
  filePath: string
  relativePath: string
  lineNumber?: number
  endLineNumber?: number
  jsdoc?: string
  accessModifier?: 'public' | 'private' | 'protected'
  methods: FunctionInfo[]
  properties: Array<{
    name: string
    type?: string
    isStatic?: boolean
    accessModifier?: 'public' | 'private' | 'protected'
  }>
  packageName?: string
}

interface InterfaceInfo {
  name: string
  isExported: boolean
  extendsInterfaces: string[]
  filePath: string
  relativePath: string
  lineNumber?: number
  endLineNumber?: number
  jsdoc?: string
  methods: Array<{
    name: string
    signature: string
    parameters: Array<{
      name: string
      type?: string
      optional?: boolean
    }>
    returnType?: string
  }>
  properties: Array<{
    name: string
    type?: string
    optional?: boolean
  }>
  packageName?: string
}

interface ImportInfo {
  specifiers: Array<{
    imported: string
    local: string
    type: 'default' | 'namespace' | 'named'
  }>
  source: string
  filePath: string
  relativePath: string
  lineNumber?: number
  packageName?: string
}

interface ExtractionData {
  functions: FunctionInfo[]
  classes: ClassInfo[]
  interfaces: InterfaceInfo[]
  imports: ImportInfo[]
  files: Array<{
    path: string
    relativePath: string
    packageName?: string
  }>
}

/**
 * 函数提取器
 * 
 * 使用 Babel AST 解析 TypeScript/JavaScript 代码，提取函数、类、接口等信息
 */
export class FunctionExtractor extends BaseExtractor<ExtractionData> {
  private readonly supportedExtensions = ['.ts', '.js', '.tsx', '.jsx']
  private readonly excludeDirs = ['node_modules', 'dist', 'build', '.next', '.git', 'coverage']

  constructor() {
    super('FunctionExtractor')
  }

  getNodeType() {
    return [NodeType.FUNCTION, NodeType.CLASS, NodeType.INTERFACE, NodeType.IMPORT, NodeType.EXPORT, NodeType.FILE]
  }

  getRelationTypes() {
    return [
      RelationType.CONTAINS,
      RelationType.CALLS,
      RelationType.IMPLEMENTS,
      RelationType.EXTENDS,
      RelationType.IMPORTS,
      RelationType.EXPORTS,
      RelationType.RETURNS,
      RelationType.PARAMETER
    ]
  }

  /**
   * 提取原始数据
   */
  async extractRawData(): Promise<ExtractionData> {
    const files = await this.scanCodeFiles()
    const functions: FunctionInfo[] = []
    const classes: ClassInfo[] = []
    const interfaces: InterfaceInfo[] = []
    const imports: ImportInfo[] = []

    this.logger.info(`发现 ${files.length} 个代码文件`)

    for (const file of files) {
      try {
        const analysis = await this.analyzeFile(file.path, file.relativePath, file.packageName)
        
        functions.push(...analysis.functions)
        classes.push(...analysis.classes)
        interfaces.push(...analysis.interfaces)
        imports.push(...analysis.imports)
      } catch (error) {
        this.logger.warn(`分析文件失败: ${file.relativePath}`, { error })
      }
    }

    this.logger.info('代码分析完成', {
      functionsCount: functions.length,
      classesCount: classes.length,
      interfacesCount: interfaces.length,
      importsCount: imports.length
    })

    return {
      functions,
      classes,
      interfaces,
      imports,
      files
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
    rawData.functions.forEach(func => allFiles.add(func.relativePath))
    rawData.classes.forEach(cls => allFiles.add(cls.relativePath))
    rawData.interfaces.forEach(iface => allFiles.add(iface.relativePath))
    rawData.imports.forEach(imp => allFiles.add(imp.relativePath))

    // 为每个文件创建文件节点
    for (const filePath of allFiles) {
      if (!processedFiles.has(filePath)) {
        const fileNode = this.createFileNode(filePath)
        nodes.push(fileNode)
        fileNodeMap.set(filePath, fileNode)
        processedFiles.add(filePath)
      }
    }

    // 创建函数节点
    for (const func of rawData.functions) {
      const functionNode = this.createFunctionNode(func)
      nodes.push(functionNode)

      // 创建文件包含关系
      const containsRel = this.createContainsRelationship(func.relativePath, functionNode.id)
      if (containsRel) relationships.push(containsRel)
    }

    // 创建类节点
    for (const cls of rawData.classes) {
      const classNode = this.createClassNode(cls)
      nodes.push(classNode)

      // 创建文件包含关系
      const containsRel = this.createContainsRelationship(cls.relativePath, classNode.id)
      if (containsRel) relationships.push(containsRel)

      // 创建类方法节点和关系
      for (const method of cls.methods) {
        const methodNode = this.createFunctionNode(method, cls.name)
        nodes.push(methodNode)

        // 类包含方法关系
        const methodRel: GraphRelationship = {
          id: RelationshipIdGenerator.create(RelationType.CONTAINS, classNode.id, methodNode.id),
          type: RelationType.CONTAINS,
          source: classNode.id,
          target: methodNode.id,
          metadata: this.createMetadata(cls.relativePath, cls.packageName)
        }
        relationships.push(methodRel)
      }
    }

    // 创建接口节点
    for (const iface of rawData.interfaces) {
      const interfaceNode = this.createInterfaceNode(iface)
      nodes.push(interfaceNode)

      // 创建文件包含关系
      const containsRel = this.createContainsRelationship(iface.relativePath, interfaceNode.id)
      if (containsRel) relationships.push(containsRel)
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
      
      // 跳过空文件或只包含注释的文件
      if (!content.trim() || content.trim().startsWith('//') && !content.includes('function') && !content.includes('class')) {
        return { functions: [], classes: [], interfaces: [], imports: [] }
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

    const functions: FunctionInfo[] = []
    const classes: ClassInfo[] = []
    const interfaces: InterfaceInfo[] = []
    const imports: ImportInfo[] = []

    traverse(ast, {
      FunctionDeclaration: (path) => {
        const func = this.extractFunction(path.node, filePath, relativePath, packageName)
        if (func) functions.push(func)
      },

      ArrowFunctionExpression: (path) => {
        // 只处理变量声明中的箭头函数
        if (t.isVariableDeclarator(path.parent) && t.isIdentifier(path.parent.id)) {
          const func = this.extractArrowFunction(path.node, path.parent.id, filePath, relativePath, packageName)
          if (func) functions.push(func)
        }
      },

      ClassDeclaration: (path) => {
        const cls = this.extractClass(path.node, filePath, relativePath, packageName)
        if (cls) classes.push(cls)
      },

      TSInterfaceDeclaration: (path) => {
        const iface = this.extractInterface(path.node, filePath, relativePath, packageName)
        if (iface) interfaces.push(iface)
      },

      ImportDeclaration: (path) => {
        const importInfo = this.extractImport(path.node, filePath, relativePath, packageName)
        if (importInfo) imports.push(importInfo)
      }
    })

      return { functions, classes, interfaces, imports }
    } catch (error) {
      this.logger.debug(`文件解析失败: ${relativePath}`, { 
        error: error instanceof Error ? error.message : String(error),
        filePath: relativePath 
      })
      return { functions: [], classes: [], interfaces: [], imports: [] }
    }
  }

  /**
   * 提取函数信息
   */
  private extractFunction(
    node: t.FunctionDeclaration, 
    filePath: string, 
    relativePath: string, 
    packageName?: string
  ): FunctionInfo | null {
    if (!node.id) return null

    const name = node.id.name
    const parameters = this.extractParameters(node.params)
    const returnType = this.extractReturnType(node.returnType)
    const isAsync = node.async || false
    const isGenerator = node.generator || false

    return {
      name,
      signature: this.generateFunctionSignature(name, parameters, returnType, isAsync, isGenerator),
      parameters,
      returnType,
      isAsync,
      isExported: this.isExported(node),
      isGenerator,
      filePath,
      relativePath,
      lineNumber: node.loc?.start.line,
      endLineNumber: node.loc?.end.line,
      jsdoc: this.extractJSDoc(node),
      packageName
    }
  }

  /**
   * 提取箭头函数信息
   */
  private extractArrowFunction(
    node: t.ArrowFunctionExpression,
    id: t.Identifier,
    filePath: string,
    relativePath: string,
    packageName?: string
  ): FunctionInfo | null {
    const name = id.name
    const parameters = this.extractParameters(node.params)
    const returnType = this.extractReturnType(node.returnType)
    const isAsync = node.async || false

    return {
      name,
      signature: this.generateFunctionSignature(name, parameters, returnType, isAsync, false),
      parameters,
      returnType,
      isAsync,
      isExported: false, // 箭头函数的导出状态需要从上下文判断
      isGenerator: false,
      filePath,
      relativePath,
      lineNumber: node.loc?.start.line,
      endLineNumber: node.loc?.end.line,
      packageName
    }
  }

  /**
   * 提取类信息
   */
  private extractClass(
    node: t.ClassDeclaration,
    filePath: string,
    relativePath: string,
    packageName?: string
  ): ClassInfo | null {
    if (!node.id) return null

    const name = node.id.name
    const methods: FunctionInfo[] = []
    const properties: Array<{
      name: string
      type?: string
      isStatic?: boolean
      accessModifier?: 'public' | 'private' | 'protected'
    }> = []

    // 提取类方法和属性
    for (const member of node.body.body) {
      if (t.isMethodDefinition(member) || t.isClassMethod(member)) {
        if (t.isIdentifier(member.key)) {
          const method = this.extractClassMethod(member, filePath, relativePath, packageName, name)
          if (method) methods.push(method)
        }
      } else if (t.isClassProperty(member)) {
        if (t.isIdentifier(member.key)) {
          properties.push({
            name: member.key.name,
            type: this.extractTypeAnnotation(member.typeAnnotation),
            isStatic: member.static || false
          })
        }
      }
    }

    return {
      name,
      isAbstract: false, // TypeScript abstract 需要特殊处理
      isExported: this.isExported(node),
      extendsClass: node.superClass && t.isIdentifier(node.superClass) ? node.superClass.name : undefined,
      implementsInterfaces: [], // TypeScript implements 需要特殊处理
      filePath,
      relativePath,
      lineNumber: node.loc?.start.line,
      endLineNumber: node.loc?.end.line,
      jsdoc: this.extractJSDoc(node),
      methods,
      properties,
      packageName
    }
  }

  /**
   * 提取接口信息
   */
  private extractInterface(
    node: t.TSInterfaceDeclaration,
    filePath: string,
    relativePath: string,
    packageName?: string
  ): InterfaceInfo | null {
    const name = node.id.name
    const methods: Array<{
      name: string
      signature: string
      parameters: Array<{
        name: string
        type?: string
        optional?: boolean
      }>
      returnType?: string
    }> = []
    const properties: Array<{
      name: string
      type?: string
      optional?: boolean
    }> = []

    // 提取接口成员
    for (const member of node.body.body) {
      if (t.isTSMethodSignature(member)) {
        if (t.isIdentifier(member.key)) {
          const parameters = this.extractParameters(member.parameters)
          const returnType = this.extractReturnType(member.typeAnnotation)
          methods.push({
            name: member.key.name,
            signature: this.generateFunctionSignature(member.key.name, parameters, returnType),
            parameters,
            returnType
          })
        }
      } else if (t.isTSPropertySignature(member)) {
        if (t.isIdentifier(member.key)) {
          properties.push({
            name: member.key.name,
            type: this.extractTypeAnnotation(member.typeAnnotation),
            optional: member.optional || false
          })
        }
      }
    }

    return {
      name,
      isExported: this.isExported(node),
      extendsInterfaces: [], // extends 处理
      filePath,
      relativePath,
      lineNumber: node.loc?.start.line,
      endLineNumber: node.loc?.end.line,
      jsdoc: this.extractJSDoc(node),
      methods,
      properties,
      packageName
    }
  }

  /**
   * 提取导入信息
   */
  private extractImport(
    node: t.ImportDeclaration,
    filePath: string,
    relativePath: string,
    packageName?: string
  ): ImportInfo | null {
    const specifiers: Array<{
      imported: string
      local: string
      type: 'default' | 'namespace' | 'named'
    }> = []

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
      source: node.source.value,
      filePath,
      relativePath,
      lineNumber: node.loc?.start.line,
      packageName
    }
  }

  // 工具方法
  private extractParameters(params: Array<t.LVal | t.RestElement>): Array<{
    name: string
    type?: string
    optional?: boolean
    defaultValue?: string
  }> {
    return params.map(param => {
      if (t.isIdentifier(param)) {
        return {
          name: param.name,
          type: this.extractTypeAnnotation(param.typeAnnotation),
          optional: param.optional || false
        }
      } else if (t.isAssignmentPattern(param) && t.isIdentifier(param.left)) {
        return {
          name: param.left.name,
          type: this.extractTypeAnnotation(param.left.typeAnnotation),
          optional: true,
          defaultValue: this.getDefaultValue(param.right)
        }
      }
      return { name: 'unknown' }
    })
  }

  private extractReturnType(typeAnnotation?: t.TSTypeAnnotation | t.Noop | null): string | undefined {
    if (!typeAnnotation || !('typeAnnotation' in typeAnnotation)) return undefined
    return this.typeToString(typeAnnotation.typeAnnotation)
  }

  private extractTypeAnnotation(typeAnnotation?: t.TSTypeAnnotation | t.Noop | null): string | undefined {
    if (!typeAnnotation || !('typeAnnotation' in typeAnnotation)) return undefined
    return this.typeToString(typeAnnotation.typeAnnotation)
  }

  private typeToString(type: t.TSType): string {
    if (t.isTSStringKeyword(type)) return 'string'
    if (t.isTSNumberKeyword(type)) return 'number'
    if (t.isTSBooleanKeyword(type)) return 'boolean'
    if (t.isTSAnyKeyword(type)) return 'any'
    if (t.isTSUnknownKeyword(type)) return 'unknown'
    if (t.isTSVoidKeyword(type)) return 'void'
    if (t.isTSTypeReference(type) && t.isIdentifier(type.typeName)) {
      return type.typeName.name
    }
    return 'unknown'
  }

  private getDefaultValue(node: t.Expression): string {
    if (t.isStringLiteral(node)) return `"${node.value}"`
    if (t.isNumericLiteral(node)) return String(node.value)
    if (t.isBooleanLiteral(node)) return String(node.value)
    if (t.isNullLiteral(node)) return 'null'
    if (t.isIdentifier(node) && node.name === 'undefined') return 'undefined'
    return 'unknown'
  }

  private isExported(node: t.Node): boolean {
    // 简化的导出检测，实际实现需要检查父节点
    return false
  }

  private extractJSDoc(node: t.Node): string | undefined {
    // JSDoc 提取需要访问注释，这里简化处理
    return undefined
  }

  private extractClassMethod(
    node: t.MethodDefinition | t.ClassMethod,
    filePath: string,
    relativePath: string,
    packageName?: string,
    className?: string
  ): FunctionInfo | null {
    if (!t.isIdentifier(node.key)) return null

    const name = node.key.name
    const parameters = this.extractParameters(node.params)
    const returnType = this.extractReturnType(node.returnType)
    const isAsync = node.async || false

    return {
      name: `${className}.${name}`,
      signature: this.generateFunctionSignature(name, parameters, returnType, isAsync),
      parameters,
      returnType,
      isAsync,
      isExported: false,
      isGenerator: node.generator || false,
      filePath,
      relativePath,
      lineNumber: node.loc?.start.line,
      endLineNumber: node.loc?.end.line,
      packageName
    }
  }

  private generateFunctionSignature(
    name: string,
    parameters: Array<{ name: string; type?: string; optional?: boolean }>,
    returnType?: string,
    isAsync?: boolean,
    isGenerator?: boolean
  ): string {
    const asyncPrefix = isAsync ? 'async ' : ''
    const generatorPrefix = isGenerator ? '*' : ''
    const paramStr = parameters.map(p => 
      `${p.name}${p.optional ? '?' : ''}${p.type ? `: ${p.type}` : ''}`
    ).join(', ')
    const returnStr = returnType ? `: ${returnType}` : ''
    
    return `${asyncPrefix}function${generatorPrefix} ${name}(${paramStr})${returnStr}`
  }

  // 节点创建方法
  private createFunctionNode(func: FunctionInfo, className?: string): GraphNode {
    const nodeId = className 
      ? NodeIdGenerator.api(func.packageName || 'unknown', `${className}.${func.name}`, 'method')
      : NodeIdGenerator.api(func.packageName || 'unknown', func.name, 'function')

    return {
      id: nodeId,
      type: NodeType.FUNCTION,
      name: func.name,
      properties: {
        signature: func.signature,
        parameters: func.parameters,
        return_type: func.returnType,
        is_async: func.isAsync,
        is_exported: func.isExported,
        is_generator: func.isGenerator,
        file_path: func.relativePath,
        line_number: func.lineNumber,
        end_line_number: func.endLineNumber,
        jsdoc: func.jsdoc,
        access_modifier: func.accessModifier,
        complexity: func.complexity
      },
      metadata: this.createMetadata(func.relativePath, func.packageName)
    }
  }

  private createClassNode(cls: ClassInfo): GraphNode {
    const nodeId = NodeIdGenerator.api(cls.packageName || 'unknown', cls.name, 'class')

    return {
      id: nodeId,
      type: NodeType.CLASS,
      name: cls.name,
      properties: {
        is_abstract: cls.isAbstract,
        is_exported: cls.isExported,
        extends_class: cls.extendsClass,
        implements_interfaces: cls.implementsInterfaces,
        file_path: cls.relativePath,
        line_number: cls.lineNumber,
        end_line_number: cls.endLineNumber,
        jsdoc: cls.jsdoc,
        access_modifier: cls.accessModifier,
        methods_count: cls.methods.length,
        properties_count: cls.properties.length
      },
      metadata: this.createMetadata(cls.relativePath, cls.packageName)
    }
  }

  private createInterfaceNode(iface: InterfaceInfo): GraphNode {
    const nodeId = NodeIdGenerator.api(iface.packageName || 'unknown', iface.name, 'interface')

    return {
      id: nodeId,
      type: NodeType.INTERFACE,
      name: iface.name,
      properties: {
        extends_interfaces: iface.extendsInterfaces,
        is_exported: iface.isExported,
        file_path: iface.relativePath,
        line_number: iface.lineNumber,
        end_line_number: iface.endLineNumber,
        jsdoc: iface.jsdoc,
        properties_count: iface.properties.length,
        methods_count: iface.methods.length
      },
      metadata: this.createMetadata(iface.relativePath, iface.packageName)
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

  private createContainsRelationship(filePath: string, nodeId: string): GraphRelationship | null {
    // 这里需要根据文件路径找到对应的文件节点ID
    // 简化实现，实际需要与其他提取器协调
    const fileNodeId = `file:${filePath.replace(/[^a-zA-Z0-9-_]/g, '_')}`

    return {
      id: RelationshipIdGenerator.create(RelationType.CONTAINS, fileNodeId, nodeId),
      type: RelationType.CONTAINS,
      source: fileNodeId,
      target: nodeId,
      metadata: this.createMetadata(filePath)
    }
  }

  /**
   * 验证提取的数据
   */
  validate(data: ExtractionData): boolean {
    return Array.isArray(data.functions) && 
           Array.isArray(data.classes) && 
           Array.isArray(data.interfaces) &&
           Array.isArray(data.imports) &&
           Array.isArray(data.files)
  }

  /**
   * 获取源数据数量
   */
  protected getSourceCount(rawData: ExtractionData): number {
    return rawData.functions.length + rawData.classes.length + rawData.interfaces.length
  }
}