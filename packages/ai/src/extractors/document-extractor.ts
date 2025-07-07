import { readFile, readdir, stat } from 'fs/promises'
import { extname, join, relative } from 'path'

import { NodeIdGenerator, NodeType, RelationType, RelationshipIdGenerator, type GraphNode, type GraphRelationship } from '../types/index.js'

import { BaseExtractor } from './base-extractor.js'

interface DocumentFile {
  name: string
  path: string
  relativePath: string
  extension: string
  size: number
  content: string
  lastModified: Date
}

interface DocumentMetadata {
  title?: string
  description?: string
  author?: string
  date?: string
  tags?: string[]
  toc?: string[]
}

interface DocumentStructure {
  headings: Array<{ level: number; text: string; line: number }>
  sections: Array<{ title: string; content: string; level: number }>
  codeBlocks: Array<{ language: string; content: string; line: number }>
  links: Array<{ text: string; url: string; line: number }>
}

interface ContentAnalysis {
  references: Record<string, DocumentFile[]>
  metadata: Record<string, DocumentMetadata>
  structure: Record<string, DocumentStructure>
}

/**
 * 文档提取器
 * 
 * 提取项目中的文档文件，如 README.md、CHANGELOG.md、设计文档等
 * 分析文档之间的关联关系和与包的关系
 */
export class DocumentExtractor extends BaseExtractor {
  constructor(workingDirectory?: string) {
    super('DocumentExtractor', workingDirectory)
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
  async transformToGraph(rawData: { documents: DocumentFile[], contentAnalysis: ContentAnalysis }) {
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
  async scanDirectoryForDocs(dirPath: string, basePath = process.cwd()): Promise<DocumentFile[]> {
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
            const subDocs: DocumentFile[] = await this.scanDirectoryForDocs(itemPath, basePath)
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
            pkgDocs.forEach((doc: DocumentFile & { package?: string; packagePath?: string }) => {
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
  async analyzeDocumentContents(documents: DocumentFile[]): Promise<ContentAnalysis> {
    const analysis: ContentAnalysis = {
      references: {},
      metadata: {},
      structure: {}
    }
    
    const tempAnalysis = {
      references: new Map<string, string[]>(),
      concepts: new Map<string, string[]>(),
      apiMentions: new Map<string, string[]>()
    }

    for (const doc of documents) {
      // 提取文档引用（如 [text](./other-doc.md)）
      const references = this.extractDocumentReferences(doc.content, doc.relativePath)
      if (references.length > 0) {
        tempAnalysis.references.set(doc.relativePath, references)
        analysis.references[doc.relativePath] = documents.filter(d => 
          references.some(ref => d.relativePath.includes(ref))
        )
      }

      // 提取概念和术语
      const concepts = this.extractConcepts(doc.content)
      if (concepts.length > 0) {
        tempAnalysis.concepts.set(doc.relativePath, concepts)
      }

      // 提取 API 提及
      const apiMentions = this.extractAPIReferences(doc.content)
      if (apiMentions.length > 0) {
        tempAnalysis.apiMentions.set(doc.relativePath, apiMentions)
      }

      // 提取元数据和结构
      analysis.metadata[doc.relativePath] = this.extractDocumentMetadata(doc.content)
      analysis.structure[doc.relativePath] = this.extractDocumentStructure(doc.content)
    }

    return analysis
  }

  /**
   * 提取文档引用
   */
  extractDocumentReferences(content: string, _currentPath: string): string[] {
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
  createDocumentNode(doc: DocumentFile & { package?: string }): GraphNode {
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
  createDocumentRelationships(documents: DocumentFile[], analysis: ContentAnalysis): GraphRelationship[] {
    const relationships = []

    // 创建文档引用关系
    for (const [docPath, referencedDocs] of Object.entries(analysis.references)) {
      for (const refDoc of referencedDocs) {
        const relationship: GraphRelationship = {
          id: RelationshipIdGenerator.create(
            RelationType.REFERENCES,
            NodeIdGenerator.document(docPath),
            NodeIdGenerator.document(refDoc.relativePath)
          ),
          type: RelationType.REFERENCES,
          source: NodeIdGenerator.document(docPath),
          target: NodeIdGenerator.document(refDoc.relativePath),
          properties: {
            reference_type: 'document_link',
            link_path: refDoc.relativePath
          },
          metadata: {
            ...this.createMetadata(),
            confidence: 0.9
          }
        }
        relationships.push(relationship)
      }
    }

    return relationships
  }

  /**
   * 解析文档路径
   */
  resolveDocumentPath(currentPath: string, referencePath: string, documents: DocumentFile[]): string | null {
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
  validate(data: { documents: DocumentFile[]; contentAnalysis: ContentAnalysis }): boolean {
    return Array.isArray(data.documents) && 
           data.documents.length > 0 && 
           data.contentAnalysis != null
  }

  /**
   * 获取源数据数量
   */
  getSourceCount(rawData: { documents: DocumentFile[] }): number {
    return rawData.documents.length
  }

  /**
   * 提取文档元数据
   */
  private extractDocumentMetadata(content: string): DocumentMetadata {
    const metadata: DocumentMetadata = {}
    
    // 提取标题
    const titleMatch = content.match(/^#\s+(.+)$/m)
    if (titleMatch) {
      metadata.title = titleMatch[1].trim()
    }
    
    // 提取作者和日期（从 frontmatter 或文档开头）
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1]
      const authorMatch = frontmatter.match(/author:\s*(.+)/)
      const dateMatch = frontmatter.match(/date:\s*(.+)/)
      
      if (authorMatch) metadata.author = authorMatch[1].trim()
      if (dateMatch) metadata.date = dateMatch[1].trim()
    }
    
    // 提取标签
    const tagMatches = content.match(/#[\w-]+/g)
    if (tagMatches) {
      metadata.tags = tagMatches.map(tag => tag.slice(1))
    }
    
    return metadata
  }

  /**
   * 提取文档结构
   */
  private extractDocumentStructure(content: string): DocumentStructure {
    const structure: DocumentStructure = {
      headings: [],
      sections: [],
      codeBlocks: [],
      links: []
    }
    
    const lines = content.split('\n')
    
    lines.forEach((line, index) => {
      // 提取标题
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
      if (headingMatch) {
        structure.headings.push({
          level: headingMatch[1].length,
          text: headingMatch[2].trim(),
          line: index + 1
        })
      }
      
      // 提取代码块
      const codeBlockMatch = line.match(/^```(\w+)?/)
      if (codeBlockMatch) {
        const language = codeBlockMatch[1] || 'text'
        structure.codeBlocks.push({
          language,
          content: '', // 简化实现
          line: index + 1
        })
      }
      
      // 提取链接
      const linkMatches = line.match(/\[([^\]]+)\]\(([^)]+)\)/g)
      if (linkMatches) {
        linkMatches.forEach(match => {
          const linkMatch = match.match(/\[([^\]]+)\]\(([^)]+)\)/)
          if (linkMatch) {
            structure.links.push({
              text: linkMatch[1],
              url: linkMatch[2],
              line: index + 1
            })
          }
        })
      }
    })
    
    return structure
  }
}