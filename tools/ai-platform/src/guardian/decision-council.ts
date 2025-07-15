/**
 * Decision Council (决策议会) - LinchKit AI Guardian Phase 3
 * 
 * 多Agent架构决策辩论系统，对复杂架构决策进行多角度分析验证
 * 
 * @version 1.0.0
 * @author Claude AI Guardian
 * @created 2025-07-14
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

import { createLogger } from '@linch-kit/core'

const logger = createLogger({ name: 'decision-council' });

/**
 * 决策类型
 */
export enum DecisionType {
  ARCHITECTURE = 'architecture',     // 架构决策
  TECHNOLOGY = 'technology',          // 技术选型
  PERFORMANCE = 'performance',        // 性能权衡
  SECURITY = 'security',              // 安全策略
  INTEGRATION = 'integration',        // 集成方案
  REFACTORING = 'refactoring'         // 重构决策
}

/**
 * 决策优先级
 */
export enum DecisionPriority {
  CRITICAL = 'critical',      // 关键决策
  HIGH = 'high',              // 高优先级
  MEDIUM = 'medium',          // 中优先级
  LOW = 'low'                 // 低优先级
}

/**
 * AI Agent角色
 */
export enum AgentRole {
  ARCHITECT = 'architect',           // 架构师角色
  SECURITY_EXPERT = 'security',      // 安全专家
  PERFORMANCE_EXPERT = 'performance', // 性能专家
  BUSINESS_ANALYST = 'business',     // 业务分析师
  DEVELOPER = 'developer',           // 开发者角色
  QUALITY_ASSURANCE = 'qa'           // 质量保证
}

/**
 * 决策输入
 */
export interface DecisionInput {
  /** 决策ID */
  id: string;
  /** 决策标题 */
  title: string;
  /** 决策描述 */
  description: string;
  /** 决策类型 */
  type: DecisionType;
  /** 优先级 */
  priority: DecisionPriority;
  /** 上下文信息 */
  context: {
    /** 相关文件 */
    files?: string[];
    /** 相关包/模块 */
    packages?: string[];
    /** 技术栈约束 */
    constraints?: string[];
    /** 业务需求 */
    requirements?: string[];
  };
  /** 可选方案 */
  options: DecisionOption[];
  /** 截止时间 */
  deadline?: string;
}

/**
 * 决策选项
 */
export interface DecisionOption {
  /** 选项ID */
  id: string;
  /** 选项名称 */
  name: string;
  /** 选项描述 */
  description: string;
  /** 优点 */
  pros: string[];
  /** 缺点 */
  cons: string[];
  /** 技术复杂度 (1-10) */
  complexity: number;
  /** 实施成本 */
  cost: {
    /** 开发时间 (小时) */
    development: number;
    /** 维护成本 (相对值) */
    maintenance: number;
    /** 学习成本 (相对值) */
    learning: number;
  };
  /** 风险评估 */
  risks: Risk[];
}

/**
 * 风险评估
 */
export interface Risk {
  /** 风险描述 */
  description: string;
  /** 风险等级 (1-5) */
  level: number;
  /** 影响范围 */
  impact: string;
  /** 缓解措施 */
  mitigation?: string;
}

/**
 * Agent分析结果
 */
export interface AgentAnalysis {
  /** Agent角色 */
  role: AgentRole;
  /** 推荐选项ID */
  recommendedOption: string;
  /** 置信度 (0-100) */
  confidence: number;
  /** 分析理由 */
  reasoning: string[];
  /** 关注点 */
  concerns: string[];
  /** 建议 */
  suggestions: string[];
  /** 风险评估 */
  riskAssessment: {
    /** 主要风险 */
    majorRisks: Risk[];
    /** 风险评分 (1-10) */
    riskScore: number;
  };
  /** 评分细节 */
  scoring: {
    [criterion: string]: number; // 各项评分 (1-10)
  };
}

/**
 * 议会决策结果
 */
export interface CouncilDecision {
  /** 决策ID */
  decisionId: string;
  /** 最终推荐选项 */
  recommendedOption: string;
  /** 整体置信度 */
  confidence: number;
  /** Agent分析结果 */
  agentAnalyses: AgentAnalysis[];
  /** 共识级别 */
  consensusLevel: 'high' | 'medium' | 'low' | 'none';
  /** 争议点 */
  controversies: string[];
  /** 风险汇总 */
  riskSummary: {
    /** 整体风险评分 */
    overallRisk: number;
    /** 关键风险 */
    criticalRisks: Risk[];
    /** 风险缓解建议 */
    mitigationPlan: string[];
  };
  /** 实施建议 */
  implementationPlan: {
    /** 实施步骤 */
    steps: string[];
    /** 监控指标 */
    monitoringMetrics: string[];
    /** 回退策略 */
    rollbackPlan: string[];
  };
  /** 决策时间 */
  decidedAt: string;
  /** 需要人工审核 */
  requiresHumanReview: boolean;
}

/**
 * 决策历史记录
 */
export interface DecisionHistory {
  /** 决策输入 */
  input: DecisionInput;
  /** 决策结果 */
  result: CouncilDecision;
  /** 实施状态 */
  implementationStatus: 'pending' | 'in_progress' | 'completed' | 'failed';
  /** 实际结果 */
  actualOutcome?: {
    /** 是否成功 */
    success: boolean;
    /** 实际成本 */
    actualCost: number;
    /** 遇到的问题 */
    issues: string[];
    /** 经验教训 */
    lessons: string[];
  };
}

/**
 * Decision Council 决策议会主类
 */
export class DecisionCouncil {
  private dataDir: string;
  private decisionHistory: Map<string, DecisionHistory> = new Map();

  constructor() {
    this.dataDir = join(process.cwd(), '.claude', 'decision-council');
    this.ensureDataDir();
    this.loadDecisionHistory();
  }

  /**
   * 确保数据目录存在
   */
  private ensureDataDir(): void {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
      logger.info('创建Decision Council数据目录', { path: this.dataDir });
    }
  }

  /**
   * 加载决策历史
   */
  private loadDecisionHistory(): void {
    const historyFile = join(this.dataDir, 'decision-history.json');
    if (existsSync(historyFile)) {
      try {
        const content = readFileSync(historyFile, 'utf-8');
        const history = JSON.parse(content);
        this.decisionHistory = new Map(Object.entries(history));
        logger.info('决策历史加载完成', { count: this.decisionHistory.size });
      } catch (error) {
        logger.error('决策历史加载失败', { error: (error as Error).message });
      }
    }
  }

  /**
   * 保存决策历史
   */
  private saveDecisionHistory(): void {
    const historyFile = join(this.dataDir, 'decision-history.json');
    const historyObj = Object.fromEntries(this.decisionHistory);
    writeFileSync(historyFile, JSON.stringify(historyObj, null, 2));
  }

  /**
   * 进行决策分析
   */
  public async analyzeDecision(input: DecisionInput): Promise<CouncilDecision> {
    logger.info('开始决策分析', { 
      decisionId: input.id, 
      type: input.type, 
      priority: input.priority 
    });

    try {
      // 1. 获取各Agent分析
      const agentAnalyses = await this.collectAgentAnalyses(input);

      // 2. 计算共识级别
      const consensusLevel = this.calculateConsensus(agentAnalyses);

      // 3. 确定最终推荐
      const recommendedOption = this.determineRecommendation(agentAnalyses);

      // 4. 计算整体置信度
      const confidence = this.calculateOverallConfidence(agentAnalyses, consensusLevel);

      // 5. 识别争议点
      const controversies = this.identifyControversies(agentAnalyses);

      // 6. 汇总风险
      const riskSummary = this.summarizeRisks(agentAnalyses, input.options);

      // 7. 生成实施建议
      const implementationPlan = this.generateImplementationPlan(
        recommendedOption, 
        input.options, 
        agentAnalyses
      );

      // 8. 判断是否需要人工审核
      const requiresHumanReview = this.shouldRequireHumanReview(
        input, 
        confidence, 
        consensusLevel, 
        riskSummary
      );

      const decision: CouncilDecision = {
        decisionId: input.id,
        recommendedOption,
        confidence,
        agentAnalyses,
        consensusLevel,
        controversies,
        riskSummary,
        implementationPlan,
        decidedAt: new Date().toISOString(),
        requiresHumanReview
      };

      // 保存决策记录
      this.decisionHistory.set(input.id, {
        input,
        result: decision,
        implementationStatus: 'pending'
      });
      this.saveDecisionHistory();

      logger.info('决策分析完成', {
        decisionId: input.id,
        recommendedOption,
        confidence,
        consensusLevel,
        requiresHumanReview
      });

      return decision;
    } catch (error) {
      logger.error('决策分析失败', { 
        decisionId: input.id, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * 收集各Agent分析
   */
  private async collectAgentAnalyses(input: DecisionInput): Promise<AgentAnalysis[]> {
    const agents = this.selectRelevantAgents(input.type);
    const analyses: AgentAnalysis[] = [];

    for (const agentRole of agents) {
      try {
        const analysis = await this.getAgentAnalysis(agentRole, input);
        analyses.push(analysis);
      } catch (error) {
        logger.warn(`Agent ${agentRole} 分析失败`, { error: (error as Error).message });
      }
    }

    return analyses;
  }

  /**
   * 选择相关的Agent
   */
  private selectRelevantAgents(decisionType: DecisionType): AgentRole[] {
    const baseAgents = [AgentRole.ARCHITECT, AgentRole.DEVELOPER];

    switch (decisionType) {
      case DecisionType.ARCHITECTURE:
        return [...baseAgents, AgentRole.PERFORMANCE_EXPERT, AgentRole.SECURITY_EXPERT];
      
      case DecisionType.TECHNOLOGY:
        return [...baseAgents, AgentRole.BUSINESS_ANALYST, AgentRole.QUALITY_ASSURANCE];
      
      case DecisionType.PERFORMANCE:
        return [...baseAgents, AgentRole.PERFORMANCE_EXPERT];
      
      case DecisionType.SECURITY:
        return [...baseAgents, AgentRole.SECURITY_EXPERT, AgentRole.QUALITY_ASSURANCE];
      
      case DecisionType.INTEGRATION:
        return [...baseAgents, AgentRole.SECURITY_EXPERT, AgentRole.BUSINESS_ANALYST];
      
      case DecisionType.REFACTORING:
        return [...baseAgents, AgentRole.QUALITY_ASSURANCE, AgentRole.PERFORMANCE_EXPERT];
      
      default:
        return baseAgents;
    }
  }

  /**
   * 获取单个Agent的分析
   */
  private async getAgentAnalysis(role: AgentRole, input: DecisionInput): Promise<AgentAnalysis> {
    // 模拟不同Agent的分析逻辑
    // 在实际实现中，这里会调用不同的AI模型或专家系统
    
    logger.debug(`正在获取 ${role} 的分析...`, { decisionId: input.id });

    // 基于角色的分析策略
    const analysis = this.simulateAgentAnalysis(role, input);
    
    // 添加一些随机性以模拟真实的AI分析
    await this.simulateAnalysisDelay();

    return analysis;
  }

  /**
   * 模拟Agent分析 (实际实现中会替换为真实的AI分析)
   */
  private simulateAgentAnalysis(role: AgentRole, input: DecisionInput): AgentAnalysis {
    const options = input.options;
    
    // 基于角色特点进行分析
    let scoring: { [criterion: string]: number } = {};
    let concerns: string[] = [];
    let suggestions: string[] = [];
    let riskScore = 5;

    switch (role) {
      case AgentRole.ARCHITECT:
        scoring = {
          scalability: this.scoreOptions(options, 'scalability'),
          maintainability: this.scoreOptions(options, 'maintainability'),
          flexibility: this.scoreOptions(options, 'flexibility')
        };
        concerns = ['系统架构的长期演进性', '模块间耦合度', '技术债务累积'];
        suggestions = ['建议采用分层架构', '考虑微服务架构的适用性', '制定架构演进路线图'];
        break;

      case AgentRole.SECURITY_EXPERT:
        scoring = {
          security: this.scoreOptions(options, 'security'),
          compliance: this.scoreOptions(options, 'compliance'),
          vulnerability: this.scoreOptions(options, 'vulnerability')
        };
        concerns = ['数据安全和隐私保护', '认证授权机制', '安全漏洞风险'];
        suggestions = ['实施多层安全防护', '定期安全审计', '建立应急响应流程'];
        riskScore = Math.max(6, riskScore);
        break;

      case AgentRole.PERFORMANCE_EXPERT:
        scoring = {
          performance: this.scoreOptions(options, 'performance'),
          efficiency: this.scoreOptions(options, 'efficiency'),
          optimization: this.scoreOptions(options, 'optimization')
        };
        concerns = ['系统响应时间', '资源利用率', '性能瓶颈'];
        suggestions = ['建立性能基准测试', '实施性能监控', '优化关键路径'];
        break;

      case AgentRole.BUSINESS_ANALYST:
        scoring = {
          business_value: this.scoreOptions(options, 'business_value'),
          user_experience: this.scoreOptions(options, 'user_experience'),
          market_fit: this.scoreOptions(options, 'market_fit')
        };
        concerns = ['业务价值实现', '用户体验影响', '市场竞争力'];
        suggestions = ['明确业务目标', '收集用户反馈', '分析竞品方案'];
        break;

      case AgentRole.DEVELOPER:
        scoring = {
          development_speed: this.scoreOptions(options, 'development_speed'),
          code_quality: this.scoreOptions(options, 'code_quality'),
          testing: this.scoreOptions(options, 'testing')
        };
        concerns = ['开发复杂度', '代码可维护性', '测试覆盖率'];
        suggestions = ['采用最佳实践', '建立代码规范', '完善测试策略'];
        break;

      case AgentRole.QUALITY_ASSURANCE:
        scoring = {
          testability: this.scoreOptions(options, 'testability'),
          reliability: this.scoreOptions(options, 'reliability'),
          quality: this.scoreOptions(options, 'quality')
        };
        concerns = ['质量保证流程', '测试自动化', '缺陷率控制'];
        suggestions = ['建立质量门禁', '实施自动化测试', '制定质量指标'];
        break;
    }

    // 计算推荐选项
    const recommendedOption = this.getTopScoredOption(options, scoring);
    
    // 计算置信度
    const confidence = this.calculateAgentConfidence(scoring, options.length);

    // 生成风险评估
    const majorRisks = this.generateRisks(role, input, options);

    return {
      role,
      recommendedOption,
      confidence,
      reasoning: this.generateReasoning(role, scoring, recommendedOption, options),
      concerns,
      suggestions,
      riskAssessment: {
        majorRisks,
        riskScore
      },
      scoring
    };
  }

  /**
   * 为选项评分
   */
  private scoreOptions(options: DecisionOption[], criterion: string): number {
    // 简化的评分逻辑，基于选项的复杂度和成本
    const avgComplexity = options.reduce((sum, opt) => sum + opt.complexity, 0) / options.length;
    const avgCost = options.reduce((sum, opt) => sum + opt.cost.development, 0) / options.length;
    
    // 根据不同标准调整评分逻辑
    let baseScore = 7; // 基础分数
    
    if (criterion.includes('performance') || criterion.includes('efficiency')) {
      baseScore = Math.max(1, 10 - avgComplexity);
    } else if (criterion.includes('security')) {
      baseScore = Math.max(5, 9 - Math.floor(avgCost / 100));
    } else if (criterion.includes('cost') || criterion.includes('speed')) {
      baseScore = Math.max(1, 10 - Math.floor(avgCost / 50));
    }

    // 添加随机波动
    return Math.max(1, Math.min(10, baseScore + (Math.random() - 0.5) * 2));
  }

  /**
   * 获取评分最高的选项
   */
  private getTopScoredOption(options: DecisionOption[], scoring: { [criterion: string]: number }): string {
    const scores = Object.values(scoring);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // 简化逻辑：选择复杂度适中的选项
    const bestOption = options.find(opt => 
      opt.complexity <= avgScore && opt.cost.development <= avgScore * 20
    ) || options[0];

    return bestOption.id;
  }

  /**
   * 计算Agent置信度
   */
  private calculateAgentConfidence(scoring: { [criterion: string]: number }, optionCount: number): number {
    const scores = Object.values(scoring);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    
    // 置信度基于评分稳定性和选项数量
    let confidence = avgScore * 10; // 转换为百分比
    confidence -= variance * 5; // 方差越大，置信度越低
    confidence -= optionCount * 2; // 选项越多，决策越困难
    
    return Math.max(50, Math.min(100, confidence));
  }

  /**
   * 生成推理过程
   */
  private generateReasoning(
    role: AgentRole, 
    scoring: { [criterion: string]: number }, 
    recommendedOption: string, 
    options: DecisionOption[]
  ): string[] {
    const reasoning: string[] = [];
    const option = options.find(opt => opt.id === recommendedOption);
    
    if (!option) return reasoning;

    reasoning.push(`从${role}角度分析，推荐选择"${option.name}"`);

    // 基于评分生成推理
    Object.entries(scoring).forEach(([criterion, score]) => {
      if (score >= 7) {
        reasoning.push(`在${criterion}方面表现出色 (评分: ${score.toFixed(1)})`);
      } else if (score <= 4) {
        reasoning.push(`在${criterion}方面需要关注 (评分: ${score.toFixed(1)})`);
      }
    });

    // 基于选项特点生成推理
    if (option.complexity <= 5) {
      reasoning.push('实施复杂度适中，风险可控');
    } else {
      reasoning.push('实施复杂度较高，需要充分准备');
    }

    if (option.cost.development <= 100) {
      reasoning.push('开发成本合理，投入产出比良好');
    }

    return reasoning;
  }

  /**
   * 生成风险
   */
  private generateRisks(role: AgentRole, input: DecisionInput, options: DecisionOption[]): Risk[] {
    const risks: Risk[] = [];

    // 基于角色生成特定风险
    switch (role) {
      case AgentRole.ARCHITECT:
        risks.push({
          description: '架构决策可能影响系统的长期演进能力',
          level: 3,
          impact: '中长期开发效率和维护成本',
          mitigation: '建立架构评审机制和演进计划'
        });
        break;

      case AgentRole.SECURITY_EXPERT:
        risks.push({
          description: '安全配置不当可能导致数据泄露',
          level: 4,
          impact: '用户数据和业务安全',
          mitigation: '实施安全审计和漏洞扫描'
        });
        break;

      case AgentRole.PERFORMANCE_EXPERT:
        risks.push({
          description: '性能问题可能在高负载时暴露',
          level: 3,
          impact: '用户体验和系统稳定性',
          mitigation: '建立性能监控和压力测试'
        });
        break;
    }

    // 基于选项复杂度生成风险
    const avgComplexity = options.reduce((sum, opt) => sum + opt.complexity, 0) / options.length;
    if (avgComplexity > 7) {
      risks.push({
        description: '实施复杂度高，可能导致进度延期',
        level: 3,
        impact: '项目进度和资源投入',
        mitigation: '分阶段实施，建立里程碑检查'
      });
    }

    return risks;
  }

  /**
   * 模拟分析延迟
   */
  private async simulateAnalysisDelay(): Promise<void> {
    // 模拟AI分析时间
    return new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  }

  /**
   * 计算共识级别
   */
  private calculateConsensus(analyses: AgentAnalysis[]): 'high' | 'medium' | 'low' | 'none' {
    if (analyses.length === 0) return 'none';

    // 统计推荐选项
    const recommendations = new Map<string, number>();
    analyses.forEach(analysis => {
      const count = recommendations.get(analysis.recommendedOption) || 0;
      recommendations.set(analysis.recommendedOption, count + 1);
    });

    const maxCount = Math.max(...recommendations.values());
    const consensusRatio = maxCount / analyses.length;

    if (consensusRatio >= 0.8) return 'high';
    if (consensusRatio >= 0.6) return 'medium';
    if (consensusRatio >= 0.4) return 'low';
    return 'none';
  }

  /**
   * 确定最终推荐
   */
  private determineRecommendation(analyses: AgentAnalysis[]): string {
    if (analyses.length === 0) throw new Error('没有Agent分析结果');

    // 使用加权投票
    const votes = new Map<string, number>();
    
    analyses.forEach(analysis => {
      const weight = analysis.confidence / 100; // 置信度作为权重
      const currentVotes = votes.get(analysis.recommendedOption) || 0;
      votes.set(analysis.recommendedOption, currentVotes + weight);
    });

    // 获取票数最高的选项
    let maxVotes = 0;
    let recommendedOption = '';
    
    votes.forEach((voteCount, option) => {
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        recommendedOption = option;
      }
    });

    return recommendedOption;
  }

  /**
   * 计算整体置信度
   */
  private calculateOverallConfidence(
    analyses: AgentAnalysis[], 
    consensusLevel: string
  ): number {
    if (analyses.length === 0) return 0;

    // 基础置信度：所有Agent置信度的平均值
    const avgConfidence = analyses.reduce((sum, analysis) => sum + analysis.confidence, 0) / analyses.length;

    // 共识调整
    let consensusBonus = 0;
    switch (consensusLevel) {
      case 'high': consensusBonus = 10; break;
      case 'medium': consensusBonus = 5; break;
      case 'low': consensusBonus = -5; break;
      case 'none': consensusBonus = -15; break;
    }

    // Agent数量调整：更多Agent参与，置信度更高
    const agentCountBonus = Math.min(5, analyses.length - 1);

    const finalConfidence = avgConfidence + consensusBonus + agentCountBonus;
    return Math.max(0, Math.min(100, finalConfidence));
  }

  /**
   * 识别争议点
   */
  private identifyControversies(analyses: AgentAnalysis[]): string[] {
    const controversies: string[] = [];

    // 分析推荐选项分歧
    const recommendations = new Map<string, AgentRole[]>();
    analyses.forEach(analysis => {
      if (!recommendations.has(analysis.recommendedOption)) {
        recommendations.set(analysis.recommendedOption, []);
      }
      recommendations.get(analysis.recommendedOption)!.push(analysis.role);
    });

    if (recommendations.size > 1) {
      recommendations.forEach((agents, option) => {
        if (agents.length >= 2) {
          controversies.push(`${agents.join('、')} 支持选项 "${option}"`);
        }
      });
    }

    // 分析关注点分歧
    const allConcerns = analyses.flatMap(analysis => analysis.concerns);
    const concernCounts = new Map<string, number>();
    allConcerns.forEach(concern => {
      concernCounts.set(concern, (concernCounts.get(concern) || 0) + 1);
    });

    concernCounts.forEach((count, concern) => {
      if (count === 1 && analyses.length > 2) {
        controversies.push(`仅有一名专家关注: ${concern}`);
      }
    });

    return controversies;
  }

  /**
   * 汇总风险
   */
  private summarizeRisks(analyses: AgentAnalysis[], options: DecisionOption[]): CouncilDecision['riskSummary'] {
    const allRisks = analyses.flatMap(analysis => analysis.riskAssessment.majorRisks);
    const riskScores = analyses.map(analysis => analysis.riskAssessment.riskScore);
    
    // 计算整体风险评分
    const overallRisk = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;

    // 识别关键风险（高等级且多个Agent提及）
    const riskCounts = new Map<string, { risk: Risk; count: number }>();
    allRisks.forEach(risk => {
      const key = risk.description;
      if (riskCounts.has(key)) {
        riskCounts.get(key)!.count++;
      } else {
        riskCounts.set(key, { risk, count: 1 });
      }
    });

    const criticalRisks = Array.from(riskCounts.values())
      .filter(item => item.risk.level >= 3 || item.count > 1)
      .map(item => item.risk);

    // 生成缓解计划
    const mitigationPlan = this.generateMitigationPlan(criticalRisks, analyses);

    return {
      overallRisk: Math.round(overallRisk * 10) / 10,
      criticalRisks,
      mitigationPlan
    };
  }

  /**
   * 生成缓解计划
   */
  private generateMitigationPlan(risks: Risk[], analyses: AgentAnalysis[]): string[] {
    const plan: string[] = [];

    // 从风险中提取缓解措施
    risks.forEach(risk => {
      if (risk.mitigation) {
        plan.push(risk.mitigation);
      }
    });

    // 从Agent建议中提取相关措施
    const allSuggestions = analyses.flatMap(analysis => analysis.suggestions);
    const uniqueSuggestions = [...new Set(allSuggestions)];
    plan.push(...uniqueSuggestions.slice(0, 3)); // 取前3个建议

    // 添加通用缓解措施
    plan.push('建立定期评估和调整机制');
    plan.push('设置关键指标监控');

    return [...new Set(plan)]; // 去重
  }

  /**
   * 生成实施建议
   */
  private generateImplementationPlan(
    recommendedOption: string, 
    options: DecisionOption[], 
    analyses: AgentAnalysis[]
  ): CouncilDecision['implementationPlan'] {
    const option = options.find(opt => opt.id === recommendedOption);
    if (!option) {
      throw new Error(`未找到推荐选项: ${recommendedOption}`);
    }

    // 基于选项复杂度生成实施步骤
    const steps: string[] = [];
    
    if (option.complexity >= 7) {
      steps.push('进行详细的技术方案设计');
      steps.push('建立开发团队和资源配置');
      steps.push('分阶段实施，设置里程碑检查');
    } else {
      steps.push('制定实施计划和时间表');
      steps.push('分配开发资源');
    }

    steps.push('开始核心功能开发');
    steps.push('进行测试验证');
    steps.push('部署上线');
    steps.push('监控运行状态');

    // 生成监控指标
    const monitoringMetrics: string[] = [
      '实施进度跟踪',
      '质量指标监控',
      '性能指标监控'
    ];

    // 添加基于Agent建议的监控指标
    analyses.forEach(analysis => {
      if (analysis.role === AgentRole.PERFORMANCE_EXPERT) {
        monitoringMetrics.push('响应时间和吞吐量');
      }
      if (analysis.role === AgentRole.SECURITY_EXPERT) {
        monitoringMetrics.push('安全事件和漏洞扫描');
      }
    });

    // 生成回退策略
    const rollbackPlan: string[] = [
      '建立回退触发条件',
      '准备数据备份和恢复方案',
      '制定紧急回退流程',
      '设置回退后的恢复计划'
    ];

    return {
      steps: [...new Set(steps)],
      monitoringMetrics: [...new Set(monitoringMetrics)],
      rollbackPlan
    };
  }

  /**
   * 判断是否需要人工审核
   */
  private shouldRequireHumanReview(
    input: DecisionInput,
    confidence: number,
    consensusLevel: string,
    riskSummary: CouncilDecision['riskSummary']
  ): boolean {
    // 高风险决策需要人工审核
    if (input.priority === DecisionPriority.CRITICAL) return true;
    if (riskSummary.overallRisk >= 7) return true;
    if (confidence < 70) return true;
    if (consensusLevel === 'none' || consensusLevel === 'low') return true;
    
    // 有关键风险需要人工审核
    const hasHighRisk = riskSummary.criticalRisks.some(risk => risk.level >= 4);
    if (hasHighRisk) return true;

    return false;
  }

  /**
   * 获取决策历史
   */
  public getDecisionHistory(decisionId?: string): DecisionHistory[] {
    if (decisionId) {
      const history = this.decisionHistory.get(decisionId);
      return history ? [history] : [];
    }
    return Array.from(this.decisionHistory.values());
  }

  /**
   * 更新实施状态
   */
  public updateImplementationStatus(
    decisionId: string, 
    status: DecisionHistory['implementationStatus'],
    outcome?: DecisionHistory['actualOutcome']
  ): void {
    const history = this.decisionHistory.get(decisionId);
    if (!history) {
      throw new Error(`未找到决策记录: ${decisionId}`);
    }

    history.implementationStatus = status;
    if (outcome) {
      history.actualOutcome = outcome;
    }

    this.saveDecisionHistory();
    logger.info('实施状态更新', { decisionId, status });
  }

  /**
   * 生成决策报告
   */
  public generateDecisionReport(decision: CouncilDecision): string {
    const { input } = this.decisionHistory.get(decision.decisionId) || { input: null };
    if (!input) {
      throw new Error('未找到决策输入信息');
    }

    const option = input.options.find(opt => opt.id === decision.recommendedOption);
    
    let report = `# 决策分析报告\n\n`;
    report += `**决策ID**: ${decision.decisionId}\n`;
    report += `**决策标题**: ${input.title}\n`;
    report += `**决策类型**: ${input.type}\n`;
    report += `**优先级**: ${input.priority}\n`;
    report += `**分析时间**: ${decision.decidedAt}\n\n`;

    report += `## 最终推荐\n\n`;
    report += `**推荐方案**: ${option?.name || decision.recommendedOption}\n`;
    report += `**整体置信度**: ${decision.confidence.toFixed(1)}%\n`;
    report += `**共识级别**: ${decision.consensusLevel}\n\n`;

    if (option) {
      report += `### 方案详情\n\n`;
      report += `**描述**: ${option.description}\n\n`;
      report += `**优点**:\n`;
      option.pros.forEach(pro => report += `- ${pro}\n`);
      report += `\n**缺点**:\n`;
      option.cons.forEach(con => report += `- ${con}\n`);
      report += `\n`;
    }

    report += `## Agent分析结果\n\n`;
    decision.agentAnalyses.forEach(analysis => {
      report += `### ${analysis.role} (置信度: ${analysis.confidence.toFixed(1)}%)\n\n`;
      report += `**推荐选项**: ${analysis.recommendedOption}\n\n`;
      
      report += `**分析理由**:\n`;
      analysis.reasoning.forEach(reason => report += `- ${reason}\n`);
      
      report += `\n**关注点**:\n`;
      analysis.concerns.forEach(concern => report += `- ${concern}\n`);
      
      report += `\n**建议**:\n`;
      analysis.suggestions.forEach(suggestion => report += `- ${suggestion}\n`);
      report += `\n`;
    });

    if (decision.controversies.length > 0) {
      report += `## 争议点\n\n`;
      decision.controversies.forEach(controversy => report += `- ${controversy}\n`);
      report += `\n`;
    }

    report += `## 风险评估\n\n`;
    report += `**整体风险评分**: ${decision.riskSummary.overallRisk}/10\n\n`;
    
    if (decision.riskSummary.criticalRisks.length > 0) {
      report += `**关键风险**:\n`;
      decision.riskSummary.criticalRisks.forEach(risk => {
        report += `- **${risk.description}** (等级: ${risk.level}/5)\n`;
        report += `  - 影响: ${risk.impact}\n`;
        if (risk.mitigation) {
          report += `  - 缓解: ${risk.mitigation}\n`;
        }
      });
      report += `\n`;
    }

    report += `**风险缓解计划**:\n`;
    decision.riskSummary.mitigationPlan.forEach(plan => report += `- ${plan}\n`);
    report += `\n`;

    report += `## 实施建议\n\n`;
    report += `**实施步骤**:\n`;
    decision.implementationPlan.steps.forEach((step, index) => report += `${index + 1}. ${step}\n`);
    
    report += `\n**监控指标**:\n`;
    decision.implementationPlan.monitoringMetrics.forEach(metric => report += `- ${metric}\n`);
    
    report += `\n**回退策略**:\n`;
    decision.implementationPlan.rollbackPlan.forEach(plan => report += `- ${plan}\n`);

    if (decision.requiresHumanReview) {
      report += `\n## ⚠️ 需要人工审核\n\n`;
      report += `此决策需要人工审核确认后方可实施。\n`;
    }

    return report;
  }

  /**
   * 获取统计信息
   */
  public getStatistics(): {
    totalDecisions: number;
    byType: Record<DecisionType, number>;
    byPriority: Record<DecisionPriority, number>;
    avgConfidence: number;
    humanReviewRate: number;
  } {
    const decisions = Array.from(this.decisionHistory.values());
    
    const byType = Object.values(DecisionType).reduce((acc, type) => {
      acc[type] = decisions.filter(d => d.input.type === type).length;
      return acc;
    }, {} as Record<DecisionType, number>);

    const byPriority = Object.values(DecisionPriority).reduce((acc, priority) => {
      acc[priority] = decisions.filter(d => d.input.priority === priority).length;
      return acc;
    }, {} as Record<DecisionPriority, number>);

    const confidences = decisions.map(d => d.result.confidence);
    const avgConfidence = confidences.length > 0 ? 
      confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length : 0;

    const humanReviewCount = decisions.filter(d => d.result.requiresHumanReview).length;
    const humanReviewRate = decisions.length > 0 ? humanReviewCount / decisions.length * 100 : 0;

    return {
      totalDecisions: decisions.length,
      byType,
      byPriority,
      avgConfidence,
      humanReviewRate
    };
  }
}

/**
 * 快捷函数：创建决策议会实例
 */
export function createDecisionCouncil(): DecisionCouncil {
  return new DecisionCouncil();
}

/**
 * 快捷函数：快速决策分析
 */
export async function quickDecisionAnalysis(
  title: string,
  description: string,
  options: Omit<DecisionOption, 'risks'>[]
): Promise<CouncilDecision> {
  const input: DecisionInput = {
    id: `decision-${Date.now()}`,
    title,
    description,
    type: DecisionType.TECHNOLOGY, // 默认类型
    priority: DecisionPriority.MEDIUM,
    context: {},
    options: options.map(opt => ({
      ...opt,
      risks: [] // 空风险数组，由Agent分析生成
    }))
  };

  const council = new DecisionCouncil();
  return await council.analyzeDecision(input);
}