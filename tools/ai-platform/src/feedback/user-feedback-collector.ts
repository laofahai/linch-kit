/**
 * 用户反馈收集器
 * 
 * 简单有效的用户反馈收集和分析系统
 * 专注于可操作的反馈数据，避免过度复杂化
 */

import { createLogger } from '@linch-kit/core'
import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const logger = createLogger('user-feedback-collector')

export interface UserFeedback {
  id: string
  queryId: string
  userId?: string
  sessionId: string
  timestamp: Date
  
  // 核心反馈数据
  rating: number // 1-5分，5是最好
  relevantResults: string[] // 用户认为相关的结果ID
  irrelevantResults: string[] // 用户认为不相关的结果ID
  
  // 可选的详细反馈
  comment?: string
  expectedButMissing?: string // 用户期望但没找到的内容
  queryRefinement?: string // 用户如何改进查询
  
  // 隐式反馈
  clickedResults: string[]
  timeSpentOnResults: number // 秒
  queryRefinements: number // 用户修改查询的次数
  taskCompleted: boolean // 用户是否完成了任务
}

export interface FeedbackStats {
  totalFeedbacks: number
  averageRating: number
  mostRelevantResults: Array<{ resultId: string; relevanceCount: number }>
  commonIssues: Array<{ issue: string; frequency: number }>
  queryImprovements: Array<{ original: string; improved: string; count: number }>
  userSatisfactionTrend: Array<{ date: string; satisfaction: number }>
}

export interface SimpleFeedbackRequest {
  queryId: string
  userId?: string
  sessionId?: string
  
  // 最简单的反馈形式
  thumbsUp?: boolean // 简单的好/坏反馈
  relevantResults?: string[] // 点赞的结果
  irrelevantResults?: string[] // 点踩的结果
  comment?: string // 可选评论
}

export class UserFeedbackCollector {
  private feedbacks: UserFeedback[] = []
  private dataDir: string
  private maxFeedbacks = 10000 // 最多保存10000条反馈

  constructor() {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    this.dataDir = join(currentDir, '../../../..', '.claude', 'user-feedback')
  }

  /**
   * 初始化反馈收集器
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true })
      await this.loadExistingFeedbacks()
      logger.info('用户反馈收集器初始化完成', {
        dataDir: this.dataDir,
        existingFeedbacks: this.feedbacks.length
      })
    } catch (error) {
      logger.error('反馈收集器初始化失败', error instanceof Error ? error : undefined)
      throw error
    }
  }

  /**
   * 收集简单反馈（推荐使用）
   */
  async collectSimpleFeedback(request: SimpleFeedbackRequest): Promise<string> {
    const feedbackId = this.generateFeedbackId()
    
    const feedback: UserFeedback = {
      id: feedbackId,
      queryId: request.queryId,
      userId: request.userId,
      sessionId: request.sessionId || 'anonymous',
      timestamp: new Date(),
      
      // 将简单反馈转换为详细格式
      rating: request.thumbsUp === true ? 5 : request.thumbsUp === false ? 1 : 3,
      relevantResults: request.relevantResults || [],
      irrelevantResults: request.irrelevantResults || [],
      comment: request.comment,
      
      // 默认值
      clickedResults: [],
      timeSpentOnResults: 0,
      queryRefinements: 0,
      taskCompleted: request.thumbsUp === true
    }
    
    await this.saveFeedback(feedback)
    
    logger.info('简单反馈已收集', {
      feedbackId,
      queryId: request.queryId,
      thumbsUp: request.thumbsUp,
      relevantCount: request.relevantResults?.length || 0
    })
    
    return feedbackId
  }

  /**
   * 收集详细反馈
   */
  async collectDetailedFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): Promise<string> {
    const feedbackId = this.generateFeedbackId()
    
    const fullFeedback: UserFeedback = {
      ...feedback,
      id: feedbackId,
      timestamp: new Date()
    }
    
    await this.saveFeedback(fullFeedback)
    
    logger.info('详细反馈已收集', {
      feedbackId,
      queryId: feedback.queryId,
      rating: feedback.rating,
      relevantCount: feedback.relevantResults.length
    })
    
    return feedbackId
  }

  /**
   * 更新隐式反馈
   */
  async updateImplicitFeedback(queryId: string, update: {
    clickedResults?: string[]
    timeSpentOnResults?: number
    queryRefinements?: number
    taskCompleted?: boolean
  }): Promise<void> {
    const feedback = this.feedbacks.find(f => f.queryId === queryId)
    if (!feedback) {
      logger.warn('未找到对应的反馈记录', { queryId })
      return
    }
    
    // 更新隐式反馈数据
    if (update.clickedResults) {
      feedback.clickedResults = [...new Set([...feedback.clickedResults, ...update.clickedResults])]
    }
    if (update.timeSpentOnResults !== undefined) {
      feedback.timeSpentOnResults += update.timeSpentOnResults
    }
    if (update.queryRefinements !== undefined) {
      feedback.queryRefinements = update.queryRefinements
    }
    if (update.taskCompleted !== undefined) {
      feedback.taskCompleted = update.taskCompleted
    }
    
    await this.persistFeedbacks()
    
    logger.debug('隐式反馈已更新', { queryId, update })
  }

  /**
   * 获取反馈统计
   */
  async getFeedbackStats(timeRange?: { start: Date; end: Date }): Promise<FeedbackStats> {
    let filteredFeedbacks = this.feedbacks
    
    if (timeRange) {
      filteredFeedbacks = this.feedbacks.filter(f => 
        f.timestamp >= timeRange.start && f.timestamp <= timeRange.end
      )
    }
    
    if (filteredFeedbacks.length === 0) {
      return {
        totalFeedbacks: 0,
        averageRating: 0,
        mostRelevantResults: [],
        commonIssues: [],
        queryImprovements: [],
        userSatisfactionTrend: []
      }
    }
    
    // 计算平均评分
    const averageRating = filteredFeedbacks.reduce((sum, f) => sum + f.rating, 0) / filteredFeedbacks.length
    
    // 统计最相关的结果
    const relevantResultsMap = new Map<string, number>()
    filteredFeedbacks.forEach(f => {
      f.relevantResults.forEach(resultId => {
        relevantResultsMap.set(resultId, (relevantResultsMap.get(resultId) || 0) + 1)
      })
    })
    
    const mostRelevantResults = Array.from(relevantResultsMap.entries())
      .map(([resultId, count]) => ({ resultId, relevanceCount: count }))
      .sort((a, b) => b.relevanceCount - a.relevanceCount)
      .slice(0, 10)
    
    // 分析常见问题
    const commonIssues = this.analyzeCommonIssues(filteredFeedbacks)
    
    // 分析查询改进
    const queryImprovements = this.analyzeQueryImprovements(filteredFeedbacks)
    
    // 用户满意度趋势
    const userSatisfactionTrend = this.calculateSatisfactionTrend(filteredFeedbacks)
    
    return {
      totalFeedbacks: filteredFeedbacks.length,
      averageRating,
      mostRelevantResults,
      commonIssues,
      queryImprovements,
      userSatisfactionTrend
    }
  }

  /**
   * 获取查询改进建议
   */
  async getQueryImprovementSuggestions(queryPattern: string): Promise<string[]> {
    const suggestions: string[] = []
    
    // 基于历史反馈分析查询模式
    const relatedFeedbacks = this.feedbacks.filter(f => 
      f.queryRefinement && f.rating >= 4
    )
    
    for (const feedback of relatedFeedbacks) {
      if (feedback.queryRefinement && this.isQuerySimilar(queryPattern, feedback.queryRefinement)) {
        suggestions.push(feedback.queryRefinement)
      }
    }
    
    // 去重并返回前5个建议
    return [...new Set(suggestions)].slice(0, 5)
  }

  /**
   * 获取高质量结果推荐
   */
  async getHighQualityResults(resultType?: string): Promise<string[]> {
    const relevantResultsMap = new Map<string, { count: number; avgRating: number }>()
    
    this.feedbacks.forEach(feedback => {
      feedback.relevantResults.forEach(resultId => {
        const existing = relevantResultsMap.get(resultId) || { count: 0, avgRating: 0 }
        existing.count++
        existing.avgRating = (existing.avgRating * (existing.count - 1) + feedback.rating) / existing.count
        relevantResultsMap.set(resultId, existing)
      })
    })
    
    return Array.from(relevantResultsMap.entries())
      .filter(([_, stats]) => stats.count >= 3 && stats.avgRating >= 4.0) // 至少3次推荐，平均4分以上
      .sort((a, b) => b[1].avgRating * b[1].count - a[1].avgRating * a[1].count) // 综合排序
      .map(([resultId]) => resultId)
      .slice(0, 20)
  }

  /**
   * 私有方法
   */
  private async saveFeedback(feedback: UserFeedback): Promise<void> {
    this.feedbacks.push(feedback)
    
    // 保持反馈数量在限制范围内
    if (this.feedbacks.length > this.maxFeedbacks) {
      this.feedbacks.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      this.feedbacks = this.feedbacks.slice(0, this.maxFeedbacks)
    }
    
    await this.persistFeedbacks()
  }

  private async persistFeedbacks(): Promise<void> {
    try {
      const feedbackFile = join(this.dataDir, 'user-feedbacks.json')
      const feedbackData = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        feedbacks: this.feedbacks
      }
      
      await fs.writeFile(feedbackFile, JSON.stringify(feedbackData, null, 2))
    } catch (error) {
      logger.error('持久化反馈数据失败', error instanceof Error ? error : undefined)
    }
  }

  private async loadExistingFeedbacks(): Promise<void> {
    try {
      const feedbackFile = join(this.dataDir, 'user-feedbacks.json')
      const content = await fs.readFile(feedbackFile, 'utf-8')
      const data = JSON.parse(content)
      
      if (data.feedbacks && Array.isArray(data.feedbacks)) {
        this.feedbacks = data.feedbacks.map(f => ({
          ...f,
          timestamp: new Date(f.timestamp)
        }))
        
        logger.info('已加载历史反馈数据', { count: this.feedbacks.length })
      }
    } catch (error) {
      // 文件不存在或格式错误，从空开始
      logger.info('未找到历史反馈数据，从空开始')
    }
  }

  private generateFeedbackId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }

  private analyzeCommonIssues(feedbacks: UserFeedback[]): Array<{ issue: string; frequency: number }> {
    const issueMap = new Map<string, number>()
    
    // 低评分反馈的评论作为问题来源
    feedbacks
      .filter(f => f.rating <= 2 && f.comment)
      .forEach(f => {
        if (f.comment) {
          // 简化的问题分类
          if (f.comment.includes('找不到') || f.comment.includes('没有结果')) {
            issueMap.set('找不到相关结果', (issueMap.get('找不到相关结果') || 0) + 1)
          } else if (f.comment.includes('太多') || f.comment.includes('结果过多')) {
            issueMap.set('结果过多', (issueMap.get('结果过多') || 0) + 1)
          } else if (f.comment.includes('不准确') || f.comment.includes('不相关')) {
            issueMap.set('结果不准确', (issueMap.get('结果不准确') || 0) + 1)
          } else if (f.comment.includes('慢') || f.comment.includes('速度')) {
            issueMap.set('查询速度慢', (issueMap.get('查询速度慢') || 0) + 1)
          }
        }
      })
    
    return Array.from(issueMap.entries())
      .map(([issue, frequency]) => ({ issue, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
  }

  private analyzeQueryImprovements(feedbacks: UserFeedback[]): Array<{ original: string; improved: string; count: number }> {
    const improvementMap = new Map<string, number>()
    
    feedbacks
      .filter(f => f.queryRefinement && f.rating >= 4)
      .forEach(f => {
        const key = `${f.queryId}->${f.queryRefinement}`
        improvementMap.set(key, (improvementMap.get(key) || 0) + 1)
      })
    
    return Array.from(improvementMap.entries())
      .map(([key, count]) => {
        const [original, improved] = key.split('->')
        return { original, improved, count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  private calculateSatisfactionTrend(feedbacks: UserFeedback[]): Array<{ date: string; satisfaction: number }> {
    const dailyRatings = new Map<string, number[]>()
    
    feedbacks.forEach(f => {
      const date = f.timestamp.toISOString().split('T')[0]
      if (!dailyRatings.has(date)) {
        dailyRatings.set(date, [])
      }
      dailyRatings.get(date)!.push(f.rating)
    })
    
    return Array.from(dailyRatings.entries())
      .map(([date, ratings]) => ({
        date,
        satisfaction: ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private isQuerySimilar(query1: string, query2: string): boolean {
    // 简单的相似度检查
    const words1 = new Set(query1.toLowerCase().split(/\s+/))
    const words2 = new Set(query2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(word => words2.has(word)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size > 0.3 // 30%以上重叠认为相似
  }

  /**
   * 清理旧数据
   */
  async cleanupOldFeedbacks(daysToKeep: number = 90): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    const beforeCount = this.feedbacks.length
    this.feedbacks = this.feedbacks.filter(f => f.timestamp >= cutoffDate)
    const afterCount = this.feedbacks.length
    
    if (beforeCount !== afterCount) {
      await this.persistFeedbacks()
      logger.info('旧反馈数据已清理', {
        removed: beforeCount - afterCount,
        remaining: afterCount
      })
    }
  }

  /**
   * 导出反馈数据
   */
  async exportFeedbacks(format: 'json' | 'csv' = 'json'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `feedbacks-export-${timestamp}.${format}`
    const exportPath = join(this.dataDir, filename)
    
    if (format === 'json') {
      await fs.writeFile(exportPath, JSON.stringify({
        exportDate: new Date().toISOString(),
        totalFeedbacks: this.feedbacks.length,
        feedbacks: this.feedbacks
      }, null, 2))
    } else {
      // CSV导出
      const csvHeaders = 'id,queryId,rating,timestamp,relevantResults,comment\n'
      const csvRows = this.feedbacks.map(f => 
        `${f.id},${f.queryId},${f.rating},${f.timestamp.toISOString()},"${f.relevantResults.join(';')}","${(f.comment || '').replace(/"/g, '""')}"`
      ).join('\n')
      
      await fs.writeFile(exportPath, csvHeaders + csvRows)
    }
    
    logger.info('反馈数据已导出', { exportPath, format, count: this.feedbacks.length })
    return exportPath
  }
}

// 工厂函数
export function createUserFeedbackCollector(): UserFeedbackCollector {
  return new UserFeedbackCollector()
}

// 简单的反馈收集工具函数
export function createSimpleFeedbackInterface() {
  return {
    thumbsUp: (queryId: string, relevantResults?: string[]) => ({
      queryId,
      thumbsUp: true,
      relevantResults
    }),
    
    thumbsDown: (queryId: string, irrelevantResults?: string[], comment?: string) => ({
      queryId,
      thumbsUp: false,
      irrelevantResults,
      comment
    }),
    
    neutral: (queryId: string, comment?: string) => ({
      queryId,
      comment
    })
  }
}