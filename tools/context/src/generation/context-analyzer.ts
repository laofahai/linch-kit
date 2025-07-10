/**
 * Context Analyzer
 *
 * LinchKit Vibe Coding Engine 上下文分析器
 * 负责从代码知识图谱中提取相关上下文和生成建议
 */

import { createLogger } from '@linch-kit/core/server'

import type { Logger } from '../types/index.js'
import type { GraphNode, GraphRelationship } from '../types/index.js'

import type { IContextAnalyzer, ContextAnalysis } from './types.js'

/**
 * 上下文分析器实现
 */
export class ContextAnalyzer implements IContextAnalyzer {
  private logger: Logger

  // LinchKit 内部包映射
  private readonly linchkitPackages = new Set([
    '@linch-kit/core',
    '@linch-kit/schema',
    '@linch-kit/auth',
    '@linch-kit/crud',
    '@linch-kit/trpc',
    '@linch-kit/ui',
  ])

  // 关键词权重映射
  private readonly keywordWeights = new Map([
    // 函数相关
    ['function', 0.9],
    ['method', 0.8],
    ['create', 0.7],
    ['get', 0.6],
    ['set', 0.6],
    ['update', 0.6],
    ['delete', 0.6],

    // 类相关
    ['class', 0.9],
    ['interface', 0.8],
    ['type', 0.7],

    // React 相关
    ['component', 0.9],
    ['hook', 0.8],
    ['props', 0.7],
    ['state', 0.7],

    // 认证相关
    ['auth', 0.8],
    ['login', 0.7],
    ['user', 0.7],
    ['permission', 0.7],

    // 数据相关
    ['schema', 0.8],
    ['model', 0.7],
    ['crud', 0.8],
    ['database', 0.6],

    // API 相关
    ['api', 0.8],
    ['route', 0.7],
    ['endpoint', 0.7],
    ['trpc', 0.8],
  ])

  constructor() {
    this.logger = createLogger('ContextAnalyzer')
  }

  /**
   * 分析生成上下文
   */
  async analyze(
    prompt: string,
    nodes: GraphNode[],
    relationships: GraphRelationship[]
  ): Promise<ContextAnalysis> {
    this.logger.info('开始分析生成上下文', {
      prompt: prompt.substring(0, 100) + '...',
      nodeCount: nodes.length,
      relationshipCount: relationships.length,
    })

    try {
      // 1. 提取相关节点
      const relevantNodes = await this.extractRelevantNodes(prompt, nodes)

      // 2. 分析依赖关系
      const dependencyAnalysis = await this.analyzeDependencies(nodes, relationships)

      // 3. 生成基础上下文分析
      const contextAnalysis: ContextAnalysis = {
        relevant_nodes: relevantNodes,
        suggested_imports: [],
        dependency_analysis: dependencyAnalysis,
        patterns: await this.identifyPatterns(prompt, relevantNodes),
        recommendations: await this.generateRecommendations(prompt, relevantNodes),
      }

      // 4. 推荐导入语句
      contextAnalysis.suggested_imports = await this.suggestImports(contextAnalysis)

      this.logger.info('上下文分析完成', {
        relevantNodesCount: relevantNodes.length,
        suggestedImportsCount: contextAnalysis.suggested_imports.length,
        patternsCount: contextAnalysis.patterns.length,
      })

      return contextAnalysis
    } catch (error) {
      this.logger.error('上下文分析失败', { error })
      throw error
    }
  }

  /**
   * 提取相关节点
   */
  async extractRelevantNodes(
    prompt: string,
    nodes: GraphNode[]
  ): Promise<
    Array<{
      node: GraphNode
      relevance_score: number
      reason: string
    }>
  > {
    const promptLower = prompt.toLowerCase()
    const promptWords = promptLower.split(/\s+/)

    const nodeScores = nodes.map(node => {
      let score = 0
      let reasons: string[] = []

      // 1. 名称匹配
      if (
        node.name &&
        promptWords.some(
          word => node.name.toLowerCase().includes(word) || word.includes(node.name.toLowerCase())
        )
      ) {
        score += 0.8
        reasons.push('名称匹配')
      }

      // 2. 类型匹配
      if (node.type && promptLower.includes(node.type.toLowerCase())) {
        score += 0.6
        reasons.push('类型匹配')
      }

      // 3. 包匹配 - LinchKit 包优先
      if (node.package && this.linchkitPackages.has(node.package)) {
        score += 0.5
        reasons.push('LinchKit内部包')
      }

      // 4. 关键词权重匹配
      for (const [keyword, weight] of this.keywordWeights) {
        if (promptLower.includes(keyword)) {
          if (
            node.name?.toLowerCase().includes(keyword) ||
            node.type?.toLowerCase().includes(keyword)
          ) {
            score += weight * 0.5
            reasons.push(`关键词匹配: ${keyword}`)
          }
        }
      }

      // 5. 描述匹配（如果有）
      if (node.description) {
        const descriptionLower = node.description.toLowerCase()
        const matchingWords = promptWords.filter(
          word => descriptionLower.includes(word) && word.length > 2
        )
        if (matchingWords.length > 0) {
          score += matchingWords.length * 0.1
          reasons.push('描述相关')
        }
      }

      return {
        node,
        relevance_score: Math.min(score, 1), // 限制最大分数为1
        reason: reasons.length > 0 ? reasons.join(', ') : '无明显关联',
      }
    })

    // 按相关性评分排序，取前20个相关节点
    return nodeScores
      .filter(item => item.relevance_score > 0.1) // 过滤低相关性节点
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 20)
  }

  /**
   * 推荐导入语句
   */
  async suggestImports(context: ContextAnalysis): Promise<ContextAnalysis['suggested_imports']> {
    const imports: ContextAnalysis['suggested_imports'] = []
    const seenModules = new Set<string>()

    for (const { node } of context.relevant_nodes) {
      if (!node.package || seenModules.has(node.package)) continue

      seenModules.add(node.package)

      // 确定来源类型
      let source: 'linchkit' | 'external' | 'local' = 'external'
      let confidence = 0.5

      if (this.linchkitPackages.has(node.package)) {
        source = 'linchkit'
        confidence = 0.9
      } else if (node.package.startsWith('./') || node.package.startsWith('../')) {
        source = 'local'
        confidence = 0.7
      }

      // 收集该包的导出项
      const exports = context.relevant_nodes
        .filter(item => item.node.package === node.package)
        .map(item => item.node.name)
        .filter((name): name is string => Boolean(name))
        .slice(0, 5) // 限制导出项数量

      if (exports.length > 0) {
        imports.push({
          module: node.package,
          exports,
          confidence,
          source,
        })
      }
    }

    // 按置信度排序，LinchKit 包优先
    return imports.sort((a, b) => {
      if (a.source === 'linchkit' && b.source !== 'linchkit') return -1
      if (b.source === 'linchkit' && a.source !== 'linchkit') return 1
      return b.confidence - a.confidence
    })
  }

  /**
   * 分析依赖关系
   */
  async analyzeDependencies(
    nodes: GraphNode[],
    _relationships: GraphRelationship[]
  ): Promise<ContextAnalysis['dependency_analysis']> {
    const packages = new Set<string>()
    const linchkitPackages = new Set<string>()
    const conflicts: string[] = []

    // 从节点中提取包信息
    for (const node of nodes) {
      if (node.package) {
        packages.add(node.package)
        if (this.linchkitPackages.has(node.package)) {
          linchkitPackages.add(node.package)
        }
      }
    }

    // 检查潜在冲突
    const packagesArray = Array.from(packages)
    for (let i = 0; i < packagesArray.length; i++) {
      for (let j = i + 1; j < packagesArray.length; j++) {
        const pkg1 = packagesArray[i]
        const pkg2 = packagesArray[j]

        // 检查相似的包名（可能的冲突）
        if (this.arePackagesConflicting(pkg1, pkg2)) {
          conflicts.push(`${pkg1} 与 ${pkg2} 可能存在功能重复`)
        }
      }
    }

    return {
      required_packages: Array.from(linchkitPackages),
      optional_packages: Array.from(packages).filter(pkg => !this.linchkitPackages.has(pkg)),
      potential_conflicts: conflicts,
    }
  }

  /**
   * 识别代码模式
   */
  private async identifyPatterns(
    prompt: string,
    relevantNodes: Array<{ node: GraphNode; relevance_score: number; reason: string }>
  ): Promise<ContextAnalysis['patterns']> {
    const patterns: ContextAnalysis['patterns'] = []
    const promptLower = prompt.toLowerCase()

    // 认证模式
    if (
      promptLower.includes('auth') ||
      promptLower.includes('login') ||
      promptLower.includes('user')
    ) {
      const authNodes = relevantNodes.filter(
        item =>
          item.node.package === '@linch-kit/auth' || item.node.name?.toLowerCase().includes('auth')
      )

      if (authNodes.length > 0) {
        patterns.push({
          name: 'Authentication Pattern',
          description: 'LinchKit 认证模式，使用 @linch-kit/auth 实现用户认证和权限管理',
          confidence: 0.8,
          examples: [
            'import { auth } from "@linch-kit/auth"',
            'const user = await auth.getCurrentUser()',
            'if (!auth.hasPermission(user, "read")) throw new Error("Unauthorized")',
          ],
        })
      }
    }

    // CRUD 模式
    if (
      promptLower.includes('crud') ||
      promptLower.includes('create') ||
      promptLower.includes('database')
    ) {
      const crudNodes = relevantNodes.filter(item => item.node.package === '@linch-kit/crud')

      if (crudNodes.length > 0) {
        patterns.push({
          name: 'CRUD Operations Pattern',
          description: '使用 @linch-kit/crud 实现类型安全的数据库操作',
          confidence: 0.8,
          examples: [
            'import { createCrudOperations } from "@linch-kit/crud"',
            'const { create, read, update, delete: del } = createCrudOperations(UserSchema)',
            'const user = await create({ name: "John", email: "john@example.com" })',
          ],
        })
      }
    }

    // React 组件模式
    if (promptLower.includes('component') || promptLower.includes('react')) {
      patterns.push({
        name: 'React Component Pattern',
        description: 'LinchKit React 组件模式，使用 TypeScript 和 shadcn/ui',
        confidence: 0.7,
        examples: [
          'import { Button } from "@linch-kit/ui"',
          'interface Props { title: string }',
          'export function MyComponent({ title }: Props) { return <Button>{title}</Button> }',
        ],
      })
    }

    return patterns
  }

  /**
   * 生成架构建议
   */
  private async generateRecommendations(
    prompt: string,
    relevantNodes: Array<{ node: GraphNode; relevance_score: number; reason: string }>
  ): Promise<ContextAnalysis['recommendations']> {
    const recommendations: ContextAnalysis['recommendations'] = []
    const promptLower = prompt.toLowerCase()

    // 架构建议
    const hasLinchKitNodes = relevantNodes.some(
      item => item.node.package && this.linchkitPackages.has(item.node.package)
    )

    if (hasLinchKitNodes) {
      recommendations.push({
        category: 'architecture',
        suggestion: '优先使用 LinchKit 内部包功能，避免重复实现',
        priority: 'high',
      })
    }

    // 性能建议
    if (promptLower.includes('api') || promptLower.includes('endpoint')) {
      recommendations.push({
        category: 'performance',
        suggestion: '使用 tRPC 实现类型安全的 API，避免运行时类型错误',
        priority: 'medium',
      })
    }

    // 安全建议
    if (promptLower.includes('auth') || promptLower.includes('user')) {
      recommendations.push({
        category: 'security',
        suggestion: '使用 @linch-kit/auth 的权限验证机制，确保安全访问控制',
        priority: 'high',
      })
    }

    // 维护性建议
    if (relevantNodes.length > 10) {
      recommendations.push({
        category: 'maintainability',
        suggestion: '考虑将复杂功能拆分为多个小模块，提高代码可维护性',
        priority: 'medium',
      })
    }

    return recommendations
  }

  /**
   * 检查包是否可能冲突
   */
  private arePackagesConflicting(pkg1: string, pkg2: string): boolean {
    // 简单的冲突检测逻辑
    const conflictPairs = [
      ['react', 'vue'],
      ['express', 'fastify'],
      ['jest', 'vitest'],
    ]

    return conflictPairs.some(
      ([a, b]) => (pkg1.includes(a) && pkg2.includes(b)) || (pkg1.includes(b) && pkg2.includes(a))
    )
  }
}
