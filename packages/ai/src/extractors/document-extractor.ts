import { readFile, readdir, stat } from 'fs/promises'
import { join, extname, relative } from 'path'

import { NodeType, RelationType, type GraphNode, type GraphRelationship } from '../types/index.js'
import { NodeIdGenerator, RelationshipIdGenerator } from '../types/index.js'

import { BaseExtractor } from './base-extractor.js'

/**
 * 文档提取器
 * 
 * 提取项目中的文档文件，如 README.md、CHANGELOG.md、设计文档等
 * 分析文档之间的关联关系和与包的关系
 */
export class DocumentExtractor extends BaseExtractor {
  constructor() {
    super('DocumentExtractor')
  }

  getNodeType() {
    return [NodeType.DOCUMENT]
  }

  getRelationTypes() {
    return [RelationType.DOCUMENTS, RelationType.REFERENCES]
  }

  /**
   * 提取文档原始数据
   */
  async extractRawData() {
    const documents = await this.scanDocuments()
    const contentAnalysis = await this.analyzeDocumentContents(documents)
    
    return {
      documents,
      contentAnalysis
    }
  }

  /**
   * 转换为Graph数据格式
   */
  async transformToGraph(rawData: { documents: any[], contentAnalysis: any }) {
    const nodes: GraphNode[] = []
    const relationships: GraphRelationship[] = []

    // 创建文档节点
    for (const doc of rawData.documents) {
      const documentNode = this.createDocumentNode(doc)
      nodes.push(documentNode)
    }

    // 创建文档间的关联关系
    const docRelationships = this.createDocumentRelationships(rawData.documents, rawData.contentAnalysis)
    relationships.push(...docRelationships)

    return { nodes, relationships }
  }

  /**
   * 扫描项目中的文档文件
   */
  async scanDocuments() {
    const documents = []
    
    // 扫描项目根目录的文档
    const rootDocs = await this.scanDirectoryForDocs(process.cwd())
    documents.push(...rootDocs)

    // 扫描包目录中的文档
    const packageDocs = await this.scanPackageDocuments()
    documents.push(...packageDocs)

    // 扫描 ai-context 目录的文档
    const aiContextDocs = await this.scanDirectoryForDocs(join(process.cwd(), 'ai-context'))
    documents.push(...aiContextDocs)

    this.logger.debug(`发现 ${documents.length} 个文档文件`, {
      documentPaths: documents.map(d => d.relativePath)
    })

    return documents
  }

  /**
   * 扫描指定目录中的文档文件
   */
  async scanDirectoryForDocs(dirPath: string, basePath = process.cwd()): Promise<any[]> {
    const documents = []
    const documentExtensions = ['.md', '.txt', '.rst', '.adoc']

    try {
      const items = await readdir(dirPath)
      
      for (const item of items) {
        const itemPath = join(dirPath, item)
        const stats = await stat(itemPath)

        if (stats.isFile()) {
          const ext = extname(item).toLowerCase()
          if (documentExtensions.includes(ext)) {
            const content = await readFile(itemPath, 'utf8')
            const relativePath = relative(basePath, itemPath)
            
            documents.push({
              name: item,
              path: itemPath,
              relativePath,
              extension: ext,
              size: stats.size,
              content,
              lastModified: stats.mtime
            })
          }
        } else if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          // 递归扫描子目录（最多2层深度）
          const currentRelativePath = relative(basePath, itemPath)
          const depth = currentRelativePath.split('/').length
          if (depth <= 3) {
            const subDocs: any[] = await this.scanDirectoryForDocs(itemPath, basePath)
            documents.push(...subDocs)
          }
        }
      }
    } catch (error) {
      this.logger.debug(`扫描目录失败: ${dirPath}`, { error })
    }

    return documents
  }

  /**
   * 扫描包目录中的文档
   */
  async scanPackageDocuments() {
    const documents = []
    const packageDirs = ['packages', 'modules']

    for (const packageDir of packageDirs) {
      const packagePath = join(process.cwd(), packageDir)
      
      try {
        const packages = await readdir(packagePath)
        
        for (const pkg of packages) {
          const pkgPath = join(packagePath, pkg)
          const stats = await stat(pkgPath)
          
          if (stats.isDirectory()) {
            const pkgDocs = await this.scanDirectoryForDocs(pkgPath)
            // 添加包信息到文档元数据
            pkgDocs.forEach((doc: any) => {
              doc.package = `@linch-kit/${pkg}`
              doc.packagePath = relative(process.cwd(), pkgPath)
            })
            documents.push(...pkgDocs)
          }
        }
      } catch {
        this.logger.debug(`包目录不存在: ${packagePath}`)
      }
    }

    return documents
  }

  /**
   * 分析文档内容
   */
  async analyzeDocumentContents(documents: any[]) {
    const analysis = {
      references: new Map<string, string[]>(),
      concepts: new Map<string, string[]>(),
      apiMentions: new Map<string, string[]>()
    }

    for (const doc of documents) {
      // 提取文档引用（如 [text](./other-doc.md)）
      const references = this.extractDocumentReferences(doc.content, doc.relativePath)
      if (references.length > 0) {
        analysis.references.set(doc.relativePath, references)
      }

      // 提取概念和术语
      const concepts = this.extractConcepts(doc.content)
      if (concepts.length > 0) {
        analysis.concepts.set(doc.relativePath, concepts)
      }

      // 提取 API 提及
      const apiMentions = this.extractAPIReferences(doc.content)
      if (apiMentions.length > 0) {
        analysis.apiMentions.set(doc.relativePath, apiMentions)
      }
    }

    return analysis
  }

  /**
   * 提取文档引用
   */
  extractDocumentReferences(content: string, currentPath: string): string[] {
    const references = []
    
    // Markdown 链接 [text](path)
    const markdownLinks = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []
    for (const link of markdownLinks) {
      const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (match && match[2]) {
        const linkPath = match[2]
        // 只处理相对路径的文档链接
        if (linkPath.startsWith('./') || linkPath.startsWith('../') || 
            linkPath.endsWith('.md') || linkPath.endsWith('.txt')) {
          references.push(linkPath)
        }
      }
    }

    // 文件路径引用
    const pathReferences = content.match(/(?:\.\/|\.\.\/)[a-zA-Z0-9/_-]+\.(md|txt|rst)/g) || []
    references.push(...pathReferences)

    return [...new Set(references)] // 去重
  }

  /**
   * 提取概念和术语
   */
  extractConcepts(content: string): string[] {
    const concepts = []
    
    // 提取标题中的概念
    const headers = content.match(/^#+\s+(.+)$/gm) || []
    for (const header of headers) {
      const concept = header.replace(/^#+\s+/, '').trim()
      if (concept.length > 2 && concept.length < 50) {
        concepts.push(concept)
      }
    }

    // 提取代码块中的类型名
    const codeBlocks = content.match(/```[\s\S]*?```/g) || []
    for (const block of codeBlocks) {
      const typeMatches = block.match(/(?:interface|class|type|enum)\s+([A-Z][a-zA-Z0-9]+)/g) || []
      for (const match of typeMatches) {
        const typeName = match.split(/\s+/)[1]
        if (typeName) {
          concepts.push(typeName)
        }
      }
    }

    return [...new Set(concepts)] // 去重
  }

  /**
   * 提取 API 引用
   */
  extractAPIReferences(content: string): string[] {
    const apiRefs = []
    
    // 函数调用模式
    const functionCalls = content.match(/[a-zA-Z_$][a-zA-Z0-9_$]*\(/g) || []
    for (const call of functionCalls) {
      const funcName = call.slice(0, -1) // 移除左括号
      if (funcName.length > 2 && /^[a-z]/.test(funcName)) { // 小写开头的函数
        apiRefs.push(funcName)
      }
    }

    // 类/接口引用
    const typeRefs = content.match(/[A-Z][a-zA-Z0-9]*(?=\s|$|[^a-zA-Z0-9])/g) || []
    apiRefs.push(...typeRefs)

    return [...new Set(apiRefs)] // 去重
  }

  /**
   * 创建文档节点
   */
  createDocumentNode(doc: any): GraphNode {
    const title = this.extractDocumentTitle(doc.content) || doc.name
    
    return {
      id: NodeIdGenerator.document(doc.relativePath),
      type: NodeType.DOCUMENT,
      name: title,
      properties: {
        file_path: doc.relativePath,
        file_type: doc.extension.slice(1), // 移除点号
        content_hash: this.calculateContentHash(doc.content),
        title,
        size: doc.size,
        sections: this.extractSections(doc.content)
      },
      metadata: this.createMetadata(doc.relativePath, doc.package)
    }
  }

  /**
   * 提取文档标题
   */
  extractDocumentTitle(content: string): string | null {
    // 查找第一个一级标题
    const h1Match = content.match(/^#\s+(.+)$/m)
    if (h1Match) {
      return h1Match[1].trim()
    }

    // 查找第一个二级标题
    const h2Match = content.match(/^##\s+(.+)$/m)
    if (h2Match) {
      return h2Match[1].trim()
    }

    return null
  }

  /**
   * 提取文档章节
   */
  extractSections(content: string): string[] {
    const sections = []
    const headers = content.match(/^#{1,3}\s+(.+)$/gm) || []
    
    for (const header of headers) {
      const section = header.replace(/^#+\s+/, '').trim()
      sections.push(section)
    }

    return sections
  }

  /**
   * 计算内容哈希（简单版本）
   */
  calculateContentHash(content: string): string {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * 创建文档间的关联关系
   */
  createDocumentRelationships(documents: any[], analysis: any): GraphRelationship[] {
    const relationships = []

    // 创建文档引用关系
    for (const [docPath, references] of analysis.references) {
      for (const refPath of references) {
        // 解析相对路径为绝对路径
        const resolvedPath = this.resolveDocumentPath(docPath, refPath, documents)
        if (resolvedPath) {
          const relationship: GraphRelationship = {
            id: RelationshipIdGenerator.create(
              RelationType.REFERENCES,
              NodeIdGenerator.document(docPath),
              NodeIdGenerator.document(resolvedPath)
            ),
            type: RelationType.REFERENCES,
            source: NodeIdGenerator.document(docPath),
            target: NodeIdGenerator.document(resolvedPath),
            properties: {
              reference_type: 'document_link',
              link_path: refPath
            },
            metadata: {
              ...this.createMetadata(),
              confidence: 0.9
            }
          }
          relationships.push(relationship)
        }
      }
    }

    return relationships
  }

  /**
   * 解析文档路径
   */
  resolveDocumentPath(currentPath: string, referencePath: string, documents: any[]): string | null {
    // 如果是绝对路径，直接使用
    if (!referencePath.startsWith('./') && !referencePath.startsWith('../')) {
      const found = documents.find(doc => doc.relativePath === referencePath)
      return found ? referencePath : null
    }

    // 解析相对路径
    const currentDir = currentPath.split('/').slice(0, -1).join('/')
    let resolvedPath = referencePath

    if (referencePath.startsWith('./')) {
      resolvedPath = join(currentDir, referencePath.slice(2))
    } else if (referencePath.startsWith('../')) {
      const parts = referencePath.split('/')
      let dirPath = currentDir.split('/')
      
      for (const part of parts) {
        if (part === '..') {
          dirPath.pop()
        } else if (part !== '.') {
          dirPath.push(part)
        }
      }
      
      resolvedPath = dirPath.join('/')
    }

    // 查找匹配的文档
    const found = documents.find(doc => doc.relativePath === resolvedPath)
    return found ? resolvedPath : null
  }

  /**
   * 验证提取的数据
   */
  validate(data: any): boolean {
    return Array.isArray(data.documents) && 
           data.documents.length > 0 && 
           data.contentAnalysis != null
  }

  /**
   * 获取源数据数量
   */
  getSourceCount(rawData: any): number {
    return rawData.documents.length
  }
}