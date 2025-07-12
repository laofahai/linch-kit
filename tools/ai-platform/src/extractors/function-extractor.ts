/**
 * FunctionExtractor
 *
 * 使用 ts-morph 提取 TypeScript/JavaScript 代码中的函数、类、接口、类型定义等
 * 分析代码结构和函数调用关系，构建详细的代码知识图谱
 */

import { readdir, stat } from 'fs/promises'
import { join, extname } from 'path'

import {
  Project,
  SourceFile,
  SyntaxKind,
  FunctionDeclaration,
  MethodDeclaration,
  ArrowFunction,
  ClassDeclaration,
  InterfaceDeclaration,
  TypeAliasDeclaration,
  ParameterDeclaration,
  PropertySignature,
  MethodSignature,
  PropertyDeclaration,
  CallExpression,
  VariableDeclaration,
  ExpressionWithTypeArguments,
} from 'ts-morph'

import { NodeType, RelationType, type GraphNode, type GraphRelationship } from '../types/index.js'
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
  lineNumber: number
  endLineNumber: number
  jsdoc?: string
  accessModifier?: 'public' | 'private' | 'protected'
  calls: string[] // 调用的其他函数
  packageName?: string
}

interface ClassInfo {
  name: string
  isAbstract: boolean
  isExported: boolean
  extendsClass?: string
  implementsInterfaces: string[]
  filePath: string
  lineNumber: number
  endLineNumber: number
  jsdoc?: string
  accessModifier?: 'public' | 'private' | 'protected'
  methods: string[]
  properties: string[]
  packageName?: string
}

interface InterfaceInfo {
  name: string
  extendsInterfaces: string[]
  isExported: boolean
  filePath: string
  lineNumber: number
  endLineNumber: number
  jsdoc?: string
  properties: Array<{
    name: string
    type?: string
    optional?: boolean
  }>
  methods: Array<{
    name: string
    signature: string
    returnType?: string
  }>
  packageName?: string
}

interface TypeInfo {
  name: string
  definition: string
  isExported: boolean
  filePath: string
  lineNumber: number
  jsdoc?: string
  referencedTypes: string[]
  packageName?: string
}

interface CodeAnalysis {
  functions: FunctionInfo[]
  classes: ClassInfo[]
  interfaces: InterfaceInfo[]
  types: TypeInfo[]
}

/**
 * 函数和代码结构提取器
 */
export class FunctionExtractor extends BaseExtractor<CodeAnalysis> {
  private project: Project
  private sourceFiles: SourceFile[] = []

  constructor(workingDirectory?: string) {
    super('FunctionExtractor', workingDirectory)
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

  protected async extractRawData(): Promise<CodeAnalysis> {
    const startTime = Date.now()
    this.logger.info('开始提取代码结构信息...')

    // 收集所有 TypeScript/JavaScript 文件
    const files = await this.collectCodeFiles()
    this.logger.info(`找到 ${files.length} 个代码文件`)

    // 添加文件到项目
    for (const filePath of files) {
      try {
        this.sourceFiles.push(this.project.addSourceFileAtPath(filePath))
      } catch (error) {
        this.logger.warn(`无法解析文件 ${filePath}`, {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    const analysis: CodeAnalysis = {
      functions: [],
      classes: [],
      interfaces: [],
      types: [],
    }

    // 分析每个源文件
    for (const sourceFile of this.sourceFiles) {
      try {
        const fileAnalysis = await this.analyzeSourceFile(sourceFile)

        analysis.functions.push(...fileAnalysis.functions)
        analysis.classes.push(...fileAnalysis.classes)
        analysis.interfaces.push(...fileAnalysis.interfaces)
        analysis.types.push(...fileAnalysis.types)
      } catch (error) {
        this.logger.warn(`分析文件失败: ${sourceFile.getFilePath()}`, {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    const endTime = Date.now()
    this.logger.info('代码结构提取完成', {
      duration: endTime - startTime,
      functionsCount: analysis.functions.length,
      classesCount: analysis.classes.length,
      interfacesCount: analysis.interfaces.length,
      typesCount: analysis.types.length,
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

  private async analyzeSourceFile(sourceFile: SourceFile): Promise<CodeAnalysis> {
    const filePath = this.normalizeFilePath(sourceFile.getFilePath())
    const packageName = this.getPackageNameFromPath(filePath)

    const analysis: CodeAnalysis = {
      functions: [],
      classes: [],
      interfaces: [],
      types: [],
    }

    // 分析函数声明
    sourceFile.getFunctions().forEach(func => {
      const funcInfo = this.extractFunctionInfo(func, filePath, packageName)
      if (funcInfo) {
        analysis.functions.push(funcInfo)
      }
    })

    // 分析方法和箭头函数
    sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration).forEach(method => {
      const methodInfo = this.extractMethodInfo(method, filePath, packageName)
      if (methodInfo) {
        analysis.functions.push(methodInfo)
      }
    })

    sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction).forEach(arrow => {
      const funcInfo = this.extractArrowFunctionInfo(arrow, filePath, packageName)
      if (funcInfo) {
        analysis.functions.push(funcInfo)
      }
    })

    // 分析类声明
    sourceFile.getClasses().forEach(cls => {
      const classInfo = this.extractClassInfo(cls, filePath, packageName)
      if (classInfo) {
        analysis.classes.push(classInfo)
      }
    })

    // 分析接口声明
    sourceFile.getInterfaces().forEach(iface => {
      const interfaceInfo = this.extractInterfaceInfo(iface, filePath, packageName)
      if (interfaceInfo) {
        analysis.interfaces.push(interfaceInfo)
      }
    })

    // 分析类型别名
    sourceFile.getTypeAliases().forEach(typeAlias => {
      const typeInfo = this.extractTypeInfo(typeAlias, filePath, packageName)
      if (typeInfo) {
        analysis.types.push(typeInfo)
      }
    })

    return analysis
  }

  private extractFunctionInfo(
    func: FunctionDeclaration,
    filePath: string,
    packageName?: string
  ): FunctionInfo | null {
    const name = func.getName()
    if (!name) return null

    const signature = func.getText().substring(0, 200) // 限制长度
    const startLine = this.safeLineNumber(func.getStartLineNumber())
    const endLine = this.safeLineNumber(func.getEndLineNumber())

    // 提取参数信息
    const parameters = func.getParameters().map((param: ParameterDeclaration) => ({
      name: param.getName(),
      type: param.getTypeNode()?.getText(),
      optional: param.hasQuestionToken(),
      defaultValue: param.getInitializer()?.getText(),
    }))

    // 提取返回类型
    const returnType = func.getReturnTypeNode()?.getText()

    // 检查修饰符
    const isAsync = func.hasModifier(SyntaxKind.AsyncKeyword)
    const isExported = func.isExported()
    const isGenerator = func.isGenerator()

    // 提取 JSDoc
    const jsdoc = func.getJsDocs()?.[0]?.getDescription()

    // 分析函数调用
    const calls = this.extractFunctionCalls(func)

    return {
      name,
      signature,
      parameters,
      returnType,
      isAsync,
      isExported,
      isGenerator,
      filePath,
      lineNumber: startLine,
      endLineNumber: endLine,
      jsdoc,
      calls,
      packageName,
    }
  }

  private extractMethodInfo(
    method: MethodDeclaration,
    filePath: string,
    packageName?: string
  ): FunctionInfo | null {
    const name = method.getName()
    if (!name) return null

    const signature = method.getText().substring(0, 200)
    const startLine = this.safeLineNumber(method.getStartLineNumber())
    const endLine = this.safeLineNumber(method.getEndLineNumber())

    const parameters = method.getParameters().map((param: ParameterDeclaration) => ({
      name: param.getName(),
      type: param.getTypeNode()?.getText(),
      optional: param.hasQuestionToken(),
      defaultValue: param.getInitializer()?.getText(),
    }))

    const returnType = method.getReturnTypeNode()?.getText()
    const isAsync = method.hasModifier(SyntaxKind.AsyncKeyword)
    const isGenerator = method.isGenerator()

    // 获取访问修饰符
    let accessModifier: 'public' | 'private' | 'protected' | undefined
    if (method.hasModifier(SyntaxKind.PrivateKeyword)) {
      accessModifier = 'private'
    } else if (method.hasModifier(SyntaxKind.ProtectedKeyword)) {
      accessModifier = 'protected'
    } else {
      accessModifier = 'public'
    }

    const jsdoc = method.getJsDocs()?.[0]?.getDescription()
    const calls = this.extractFunctionCalls(method)

    return {
      name,
      signature,
      parameters,
      returnType,
      isAsync,
      isExported: false, // 方法不直接导出
      isGenerator,
      filePath,
      lineNumber: startLine,
      endLineNumber: endLine,
      jsdoc,
      accessModifier,
      calls,
      packageName,
    }
  }

  private extractArrowFunctionInfo(
    arrow: ArrowFunction,
    filePath: string,
    packageName?: string
  ): FunctionInfo | null {
    // 只提取有名称的箭头函数（变量声明）
    const parent = arrow.getParent()
    if (!parent || parent.getKind() !== SyntaxKind.VariableDeclaration) {
      return null
    }

    const variableDeclaration = parent as VariableDeclaration
    const name = variableDeclaration.getName() || 'anonymous'
    const signature = arrow.getText().substring(0, 200)
    const startLine = this.safeLineNumber(arrow.getStartLineNumber())
    const endLine = this.safeLineNumber(arrow.getEndLineNumber())

    const parameters = arrow.getParameters().map((param: ParameterDeclaration) => ({
      name: param.getName(),
      type: param.getTypeNode()?.getText(),
      optional: param.hasQuestionToken(),
      defaultValue: param.getInitializer()?.getText(),
    }))

    const returnType = arrow.getReturnTypeNode()?.getText()
    const isAsync = arrow.hasModifier(SyntaxKind.AsyncKeyword)

    const calls = this.extractFunctionCalls(arrow)

    return {
      name,
      signature,
      parameters,
      returnType,
      isAsync,
      isExported: false,
      isGenerator: false,
      filePath,
      lineNumber: startLine,
      endLineNumber: endLine,
      calls,
      packageName,
    }
  }

  private extractClassInfo(
    cls: ClassDeclaration,
    filePath: string,
    packageName?: string
  ): ClassInfo | null {
    const name = cls.getName()
    if (!name) return null

    const startLine = this.safeLineNumber(cls.getStartLineNumber())
    const endLine = this.safeLineNumber(cls.getEndLineNumber())

    const isAbstract = cls.hasModifier(SyntaxKind.AbstractKeyword)
    const isExported = cls.isExported()

    // 获取继承和实现信息
    const extendsClass = cls.getExtends()?.getExpression()?.getText()
    const implementsInterfaces = cls
      .getImplements()
      .map((impl: ExpressionWithTypeArguments) => impl.getText())

    // 获取访问修饰符
    let accessModifier: 'public' | 'private' | 'protected' | undefined
    if (cls.hasModifier(SyntaxKind.PrivateKeyword)) {
      accessModifier = 'private'
    } else if (cls.hasModifier(SyntaxKind.ProtectedKeyword)) {
      accessModifier = 'protected'
    } else {
      accessModifier = 'public'
    }

    // 获取方法和属性
    const methods = cls.getMethods().map((method: MethodDeclaration) => method.getName() || '')
    const properties = cls.getProperties().map((prop: PropertyDeclaration) => prop.getName() || '')

    const jsdoc = cls.getJsDocs()?.[0]?.getDescription()

    return {
      name,
      isAbstract,
      isExported,
      extendsClass,
      implementsInterfaces,
      filePath,
      lineNumber: startLine,
      endLineNumber: endLine,
      jsdoc,
      accessModifier,
      methods,
      properties,
      packageName,
    }
  }

  private extractInterfaceInfo(
    iface: InterfaceDeclaration,
    filePath: string,
    packageName?: string
  ): InterfaceInfo | null {
    const name = iface.getName()
    if (!name) return null

    const startLine = this.safeLineNumber(iface.getStartLineNumber())
    const endLine = this.safeLineNumber(iface.getEndLineNumber())

    const isExported = iface.isExported()
    const extendsInterfaces = iface
      .getExtends()
      .map((ext: ExpressionWithTypeArguments) => ext.getText())

    // 获取属性和方法
    const properties = iface.getProperties().map((prop: PropertySignature) => ({
      name: prop.getName(),
      type: prop.getTypeNode()?.getText(),
      optional: prop.hasQuestionToken(),
    }))

    const methods = iface.getMethods().map((method: MethodSignature) => ({
      name: method.getName(),
      signature: method.getText(),
      returnType: method.getReturnTypeNode()?.getText(),
    }))

    const jsdoc = iface.getJsDocs()?.[0]?.getDescription()

    return {
      name,
      extendsInterfaces,
      isExported,
      filePath,
      lineNumber: startLine,
      endLineNumber: endLine,
      jsdoc,
      properties,
      methods,
      packageName,
    }
  }

  private extractTypeInfo(
    typeAlias: TypeAliasDeclaration,
    filePath: string,
    packageName?: string
  ): TypeInfo | null {
    const name = typeAlias.getName()
    if (!name) return null

    const definition = typeAlias.getTypeNode()?.getText() || ''
    const isExported = typeAlias.isExported()
    const startLine = this.safeLineNumber(typeAlias.getStartLineNumber())
    const jsdoc = typeAlias.getJsDocs()?.[0]?.getDescription()

    // 分析引用的类型
    const referencedTypes: string[] = []
    // 这里可以添加更复杂的类型引用分析

    return {
      name,
      definition,
      isExported,
      filePath,
      lineNumber: startLine,
      jsdoc,
      referencedTypes,
      packageName,
    }
  }

  private extractFunctionCalls(
    node: FunctionDeclaration | MethodDeclaration | ArrowFunction
  ): string[] {
    const calls: string[] = []

    // 查找所有函数调用表达式
    node.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((callExpr: CallExpression) => {
      const expression = callExpr.getExpression()
      const callName = expression.getText()
      if (callName && !calls.includes(callName)) {
        calls.push(callName)
      }
    })

    return calls
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

  protected async transformToGraph(rawData: CodeAnalysis): Promise<{
    nodes: GraphNode[]
    relationships: GraphRelationship[]
  }> {
    const nodes: GraphNode[] = []
    const relationships: GraphRelationship[] = []

    // 创建函数节点
    for (const func of rawData.functions) {
      const nodeId = NodeIdGenerator.api(
        func.packageName || 'unknown',
        func.name,
        'function',
        func.filePath
      )

      const functionNode: GraphNode = {
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
          file_path: func.filePath,
          line_number: func.lineNumber,
          end_line_number: func.endLineNumber,
          jsdoc: func.jsdoc,
          access_modifier: func.accessModifier,
        },
        metadata: this.createMetadata(func.filePath, func.packageName),
      }

      nodes.push(functionNode)

      // 创建函数调用关系
      for (const calledFunction of func.calls) {
        const targetId = NodeIdGenerator.api(
          func.packageName || 'unknown',
          calledFunction,
          'function',
          func.filePath
        )
        const relationshipId = RelationshipIdGenerator.create(RelationType.CALLS, nodeId, targetId)

        relationships.push({
          id: relationshipId,
          type: RelationType.CALLS,
          source: nodeId,
          target: targetId,
          metadata: this.createMetadata(func.filePath, func.packageName),
        })
      }
    }

    // 创建类节点
    for (const cls of rawData.classes) {
      const nodeId = NodeIdGenerator.api(
        cls.packageName || 'unknown',
        cls.name,
        'class',
        cls.filePath
      )

      const classNode: GraphNode = {
        id: nodeId,
        type: NodeType.CLASS,
        name: cls.name,
        properties: {
          is_abstract: cls.isAbstract,
          is_exported: cls.isExported,
          extends_class: cls.extendsClass,
          implements_interfaces: cls.implementsInterfaces,
          file_path: cls.filePath,
          line_number: cls.lineNumber,
          end_line_number: cls.endLineNumber,
          jsdoc: cls.jsdoc,
          access_modifier: cls.accessModifier,
          methods_count: cls.methods.length,
          properties_count: cls.properties.length,
        },
        metadata: this.createMetadata(cls.filePath, cls.packageName),
      }

      nodes.push(classNode)

      // 创建继承关系
      if (cls.extendsClass) {
        const parentId = NodeIdGenerator.api(
          cls.packageName || 'unknown',
          cls.extendsClass,
          'class'
        )
        const relationshipId = RelationshipIdGenerator.create(
          RelationType.EXTENDS,
          nodeId,
          parentId
        )

        relationships.push({
          id: relationshipId,
          type: RelationType.EXTENDS,
          source: nodeId,
          target: parentId,
          metadata: this.createMetadata(cls.filePath, cls.packageName),
        })
      }

      // 创建实现关系
      for (const interfaceName of cls.implementsInterfaces) {
        const interfaceId = NodeIdGenerator.api(
          cls.packageName || 'unknown',
          interfaceName,
          'interface'
        )
        const relationshipId = RelationshipIdGenerator.create(
          RelationType.IMPLEMENTS,
          nodeId,
          interfaceId
        )

        relationships.push({
          id: relationshipId,
          type: RelationType.IMPLEMENTS,
          source: nodeId,
          target: interfaceId,
          metadata: this.createMetadata(cls.filePath, cls.packageName),
        })
      }
    }

    // 创建接口节点
    for (const iface of rawData.interfaces) {
      const nodeId = NodeIdGenerator.api(
        iface.packageName || 'unknown',
        iface.name,
        'interface',
        iface.filePath
      )

      const interfaceNode: GraphNode = {
        id: nodeId,
        type: NodeType.INTERFACE,
        name: iface.name,
        properties: {
          extends_interfaces: iface.extendsInterfaces,
          is_exported: iface.isExported,
          file_path: iface.filePath,
          line_number: iface.lineNumber,
          end_line_number: iface.endLineNumber,
          jsdoc: iface.jsdoc,
          properties_count: iface.properties.length,
          methods_count: iface.methods.length,
        },
        metadata: this.createMetadata(iface.filePath, iface.packageName),
      }

      nodes.push(interfaceNode)

      // 创建接口继承关系
      for (const parentInterface of iface.extendsInterfaces) {
        const parentId = NodeIdGenerator.api(
          iface.packageName || 'unknown',
          parentInterface,
          'interface'
        )
        const relationshipId = RelationshipIdGenerator.create(
          RelationType.EXTENDS,
          nodeId,
          parentId
        )

        relationships.push({
          id: relationshipId,
          type: RelationType.EXTENDS,
          source: nodeId,
          target: parentId,
          metadata: this.createMetadata(iface.filePath, iface.packageName),
        })
      }
    }

    // 创建类型节点
    for (const type of rawData.types) {
      const nodeId = NodeIdGenerator.api(
        type.packageName || 'unknown',
        type.name,
        'type',
        type.filePath
      )

      const typeNode: GraphNode = {
        id: nodeId,
        type: NodeType.TYPE,
        name: type.name,
        properties: {
          definition: type.definition,
          is_exported: type.isExported,
          file_path: type.filePath,
          line_number: type.lineNumber,
          jsdoc: type.jsdoc,
        },
        metadata: this.createMetadata(type.filePath, type.packageName),
      }

      nodes.push(typeNode)
    }

    this.logger.info('图数据转换完成', {
      nodeCount: nodes.length,
      relationshipCount: relationships.length,
    })

    return { nodes, relationships }
  }

  getNodeType(): NodeType[] {
    return [NodeType.FUNCTION, NodeType.CLASS, NodeType.INTERFACE, NodeType.TYPE]
  }

  getRelationTypes(): RelationType[] {
    return [
      RelationType.CALLS,
      RelationType.EXTENDS,
      RelationType.IMPLEMENTS,
      RelationType.USES_TYPE,
      RelationType.RETURNS,
      RelationType.PARAMETER,
    ]
  }

  protected getSourceCount(rawData: CodeAnalysis): number {
    return (
      rawData.functions.length +
      rawData.classes.length +
      rawData.interfaces.length +
      rawData.types.length
    )
  }
}
