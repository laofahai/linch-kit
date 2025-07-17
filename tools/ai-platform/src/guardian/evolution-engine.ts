/**
 * Evolution Engine (进化引擎) - LinchKit AI Guardian Phase 4
 * 
 * 系统自我进化适应机制，使整个风险防控体系适应LinchKit持续演进
 * 
 * @version 1.0.0
 * @author Claude AI Guardian
 * @created 2025-07-14
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

import { createLogger } from '@linch-kit/core';

const logger = createLogger({ name: 'evolution-engine' });

const log = {
  info: (msg: string, meta?: unknown) => logger.info(`[Evolution-Engine] ${msg}`, meta || ''),
  warn: (msg: string, meta?: unknown) => logger.warn(`[Evolution-Engine] ${msg}`, meta || ''),
  error: (msg: string, meta?: unknown) => logger.error(`[Evolution-Engine] ${msg}`, meta || ''),
  debug: (msg: string, meta?: unknown) => process.env.DEBUG && logger.info(`[DEBUG] ${msg}`, meta || '')
};

/**
 * 进化周期
 */
export enum EvolutionCycle {
  WEEKLY = 'weekly',           // 周度评估
  MONTHLY = 'monthly',         // 月度策略调整
  QUARTERLY = 'quarterly',     // 季度架构升级
  YEARLY = 'yearly'            // 年度架构升级
}

/**
 * 进化类型
 */
export enum EvolutionType {
  ARCHITECTURE = 'architecture',     // 架构变化
  FEATURE = 'feature',               // 功能模式
  TOOLING = 'tooling',               // 工具升级
  PERFORMANCE = 'performance',       // 性能优化
  SECURITY = 'security'              // 安全策略
}

/**
 * 变化检测结果
 */
export interface ChangeDetection {
  /** 变化类型 */
  type: EvolutionType;
  /** 变化描述 */
  description: string;
  /** 影响程度 (1-10) */
  impact: number;
  /** 检测到的文件 */
  files: string[];
  /** 变化详情 */
  details: {
    /** 新增内容 */
    added: string[];
    /** 修改内容 */
    modified: string[];
    /** 删除内容 */
    removed: string[];
  };
  /** 检测时间 */
  detectedAt: string;
}

/**
 * 功能模式
 */
export interface FeaturePattern {
  /** 模式ID */
  id: string;
  /** 模式名称 */
  name: string;
  /** 模式描述 */
  description: string;
  /** 使用频率 */
  frequency: number;
  /** 示例代码 */
  examples: string[];
  /** 相关文件 */
  relatedFiles: string[];
  /** 最佳实践 */
  bestPractices: string[];
  /** 推荐规则 */
  recommendedRules: string[];
}

/**
 * 工具进化建议
 */
export interface ToolEvolution {
  /** 工具名称 */
  toolName: string;
  /** 当前版本 */
  currentVersion: string;
  /** 建议版本 */
  suggestedVersion?: string;
  /** 进化类型 */
  evolutionType: 'upgrade' | 'replace' | 'configure' | 'add';
  /** 建议描述 */
  suggestion: string;
  /** 优先级 */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** 预期收益 */
  expectedBenefits: string[];
  /** 风险评估 */
  risks: string[];
  /** 实施建议 */
  implementation: string[];
}

/**
 * 系统健康评估
 */
export interface SystemHealthAssessment {
  /** 评估时间 */
  assessmentTime: string;
  /** 整体健康评分 (0-100) */
  overallHealth: number;
  /** 各维度评分 */
  dimensions: {
    /** 架构健康度 */
    architecture: number;
    /** 代码质量 */
    codeQuality: number;
    /** 性能表现 */
    performance: number;
    /** 安全状况 */
    security: number;
    /** 工具链成熟度 */
    toolchain: number;
  };
  /** 检测到的问题 */
  issues: {
    /** 问题级别 */
    level: 'info' | 'warning' | 'error' | 'critical';
    /** 问题描述 */
    description: string;
    /** 影响范围 */
    impact: string;
    /** 建议措施 */
    recommendation: string;
  }[];
  /** 改进建议 */
  recommendations: string[];
  /** 趋势分析 */
  trends: {
    /** 趋势描述 */
    description: string;
    /** 趋势方向 */
    direction: 'improving' | 'stable' | 'declining';
    /** 相关指标 */
    metrics: string[];
  }[];
}

/**
 * 进化计划
 */
export interface EvolutionPlan {
  /** 计划ID */
  id: string;
  /** 计划标题 */
  title: string;
  /** 计划描述 */
  description: string;
  /** 执行周期 */
  cycle: EvolutionCycle;
  /** 目标日期 */
  targetDate: string;
  /** 执行步骤 */
  steps: {
    /** 步骤名称 */
    name: string;
    /** 步骤描述 */
    description: string;
    /** 预计时间 */
    estimatedTime: string;
    /** 执行状态 */
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    /** 相关文件 */
    files?: string[];
  }[];
  /** 成功指标 */
  successMetrics: string[];
  /** 回退计划 */
  rollbackPlan: string[];
  /** 创建时间 */
  createdAt: string;
  /** 执行状态 */
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'cancelled';
}

/**
 * Evolution Engine 进化引擎主类
 */
export class EvolutionEngine {
  private dataDir: string;
  private projectRoot: string;
  private lastSnapshot: Map<string, any> = new Map();
  private featurePatterns: Map<string, FeaturePattern> = new Map();
  private evolutionHistory: EvolutionPlan[] = [];

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.dataDir = join(this.projectRoot, '.claude', 'evolution-engine');
    this.ensureDataDir();
    this.loadSnapshot();
    this.loadFeaturePatterns();
    this.loadEvolutionHistory();
  }

  /**
   * 确保数据目录存在
   */
  private ensureDataDir(): void {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
      logger.info('创建Evolution Engine数据目录', { path: this.dataDir });
    }

    // 创建子目录
    const subdirs = ['snapshots', 'patterns', 'assessments', 'plans'];
    subdirs.forEach(subdir => {
      const dir = join(this.dataDir, subdir);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 加载系统快照
   */
  private loadSnapshot(): void {
    const snapshotFile = join(this.dataDir, 'snapshots', 'latest.json');
    if (existsSync(snapshotFile)) {
      try {
        const content = readFileSync(snapshotFile, 'utf-8');
        const snapshot = JSON.parse(content);
        this.lastSnapshot = new Map(Object.entries(snapshot));
        logger.info('系统快照加载完成', { entries: this.lastSnapshot.size });
      } catch (error) {
        logger.error('系统快照加载失败', { error: (error as Error).message });
      }
    }
  }

  /**
   * 保存系统快照
   */
  private saveSnapshot(): void {
    const snapshotFile = join(this.dataDir, 'snapshots', 'latest.json');
    const snapshot = Object.fromEntries(this.lastSnapshot);
    writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2));
    
    // 保存带时间戳的备份
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = join(this.dataDir, 'snapshots', `snapshot-${timestamp}.json`);
    writeFileSync(backupFile, JSON.stringify(snapshot, null, 2));
  }

  /**
   * 加载功能模式
   */
  private loadFeaturePatterns(): void {
    const patternsFile = join(this.dataDir, 'patterns', 'feature-patterns.json');
    if (existsSync(patternsFile)) {
      try {
        const content = readFileSync(patternsFile, 'utf-8');
        const patterns = JSON.parse(content);
        this.featurePatterns = new Map(Object.entries(patterns));
        logger.info('功能模式加载完成', { patterns: this.featurePatterns.size });
      } catch (error) {
        logger.error('功能模式加载失败', { error: (error as Error).message });
      }
    }
  }

  /**
   * 保存功能模式
   */
  private saveFeaturePatterns(): void {
    const patternsFile = join(this.dataDir, 'patterns', 'feature-patterns.json');
    const patterns = Object.fromEntries(this.featurePatterns);
    writeFileSync(patternsFile, JSON.stringify(patterns, null, 2));
  }

  /**
   * 加载进化历史
   */
  private loadEvolutionHistory(): void {
    const historyFile = join(this.dataDir, 'plans', 'evolution-history.json');
    if (existsSync(historyFile)) {
      try {
        const content = readFileSync(historyFile, 'utf-8');
        this.evolutionHistory = JSON.parse(content);
        logger.info('进化历史加载完成', { plans: this.evolutionHistory.length });
      } catch (error) {
        logger.error('进化历史加载失败', { error: (error as Error).message });
      }
    }
  }

  /**
   * 保存进化历史
   */
  private saveEvolutionHistory(): void {
    const historyFile = join(this.dataDir, 'plans', 'evolution-history.json');
    writeFileSync(historyFile, JSON.stringify(this.evolutionHistory, null, 2));
  }

  /**
   * 检测架构变化
   */
  public async detectArchitectureChanges(): Promise<ChangeDetection[]> {
    logger.info('开始检测架构变化');

    const changes: ChangeDetection[] = [];

    try {
      // 分析包结构变化
      const packageChanges = await this.analyzePackageStructure();
      if (packageChanges) changes.push(packageChanges);

      // 分析依赖关系变化
      const dependencyChanges = await this.analyzeDependencyChanges();
      if (dependencyChanges) changes.push(dependencyChanges);

      // 分析配置文件变化
      const configChanges = await this.analyzeConfigurationChanges();
      if (configChanges) changes.push(configChanges);

      logger.info('架构变化检测完成', { changes: changes.length });
      return changes;

    } catch (error) {
      logger.error('架构变化检测失败', { error: (error as Error).message });
      return [];
    }
  }

  /**
   * 分析包结构变化
   */
  private async analyzePackageStructure(): Promise<ChangeDetection | null> {
    const packagesDir = join(this.projectRoot, 'packages');
    if (!existsSync(packagesDir)) return null;

    const currentPackages = readdirSync(packagesDir).filter(name => {
      const pkgPath = join(packagesDir, name);
      return statSync(pkgPath).isDirectory() && existsSync(join(pkgPath, 'package.json'));
    });

    const lastPackages = this.lastSnapshot.get('packages') || [];
    
    if (JSON.stringify(currentPackages.sort()) === JSON.stringify(lastPackages.sort())) {
      return null; // 无变化
    }

    const added = currentPackages.filter(pkg => !lastPackages.includes(pkg));
    const removed = lastPackages.filter(pkg => !currentPackages.includes(pkg));

    this.lastSnapshot.set('packages', currentPackages);

    return {
      type: EvolutionType.ARCHITECTURE,
      description: '包结构发生变化',
      impact: Math.max(added.length, removed.length) * 3,
      files: currentPackages.map(pkg => `packages/${pkg}/package.json`),
      details: {
        added: added.map(pkg => `新增包: ${pkg}`),
        modified: [],
        removed: removed.map(pkg => `删除包: ${pkg}`)
      },
      detectedAt: new Date().toISOString()
    };
  }

  /**
   * 分析依赖关系变化
   */
  private async analyzeDependencyChanges(): Promise<ChangeDetection | null> {
    const packageJsonPath = join(this.projectRoot, 'package.json');
    if (!existsSync(packageJsonPath)) return null;

    try {
      const content = readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);
      
      const currentDeps = {
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {}
      };

      const lastDeps = this.lastSnapshot.get('dependencies');
      if (!lastDeps) {
        this.lastSnapshot.set('dependencies', currentDeps);
        return null;
      }

      if (JSON.stringify(currentDeps) === JSON.stringify(lastDeps)) {
        return null; // 无变化
      }

      const changes = this.analyzeDependencyDiff(lastDeps, currentDeps);
      this.lastSnapshot.set('dependencies', currentDeps);

      return {
        type: EvolutionType.TOOLING,
        description: '项目依赖发生变化',
        impact: changes.added.length + changes.modified.length + changes.removed.length,
        files: [packageJsonPath],
        details: changes,
        detectedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('依赖分析失败', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * 分析依赖差异
   */
  private analyzeDependencyDiff(oldDeps: any, newDeps: any): ChangeDetection['details'] {
    const changes = { added: [], modified: [], removed: [] };

    // 合并所有依赖类型
    const allOldDeps = { ...oldDeps.dependencies, ...oldDeps.devDependencies };
    const allNewDeps = { ...newDeps.dependencies, ...newDeps.devDependencies };

    // 检测新增
    Object.keys(allNewDeps).forEach(dep => {
      if (!allOldDeps[dep]) {
        changes.added.push(`新增依赖: ${dep}@${allNewDeps[dep]}`);
      } else if (allOldDeps[dep] !== allNewDeps[dep]) {
        changes.modified.push(`更新依赖: ${dep} ${allOldDeps[dep]} → ${allNewDeps[dep]}`);
      }
    });

    // 检测删除
    Object.keys(allOldDeps).forEach(dep => {
      if (!allNewDeps[dep]) {
        changes.removed.push(`删除依赖: ${dep}@${allOldDeps[dep]}`);
      }
    });

    return changes;
  }

  /**
   * 分析配置文件变化
   */
  private async analyzeConfigurationChanges(): Promise<ChangeDetection | null> {
    const configFiles = [
      'tsconfig.json',
      'eslint.config.js',
      'prettier.config.js',
      'turbo.json',
      'bun.lockb'
    ];

    const changes = { added: [], modified: [], removed: [] };
    let hasChanges = false;

    for (const configFile of configFiles) {
      const filePath = join(this.projectRoot, configFile);
      const exists = existsSync(filePath);
      const lastExists = this.lastSnapshot.get(`config_${configFile}_exists`) || false;

      if (exists && !lastExists) {
        changes.added.push(`新增配置文件: ${configFile}`);
        hasChanges = true;
      } else if (!exists && lastExists) {
        changes.removed.push(`删除配置文件: ${configFile}`);
        hasChanges = true;
      } else if (exists) {
        // 检查文件内容变化（简化版本，只检查文件修改时间）
        const stat = statSync(filePath);
        const lastModified = this.lastSnapshot.get(`config_${configFile}_modified`);
        
        if (!lastModified || stat.mtime.getTime() !== lastModified) {
          changes.modified.push(`配置文件已修改: ${configFile}`);
          hasChanges = true;
        }
        
        this.lastSnapshot.set(`config_${configFile}_modified`, stat.mtime.getTime());
      }

      this.lastSnapshot.set(`config_${configFile}_exists`, exists);
    }

    if (!hasChanges) return null;

    return {
      type: EvolutionType.TOOLING,
      description: '配置文件发生变化',
      impact: changes.added.length * 2 + changes.modified.length + changes.removed.length * 3,
      files: configFiles.filter(file => existsSync(join(this.projectRoot, file))),
      details: changes,
      detectedAt: new Date().toISOString()
    };
  }

  /**
   * 学习新功能模式
   */
  public async learnNewFeaturePatterns(): Promise<FeaturePattern[]> {
    logger.info('开始学习新功能模式');

    const newPatterns: FeaturePattern[] = [];

    try {
      // 分析代码库，寻找新的模式
      const codePatterns = await this.analyzeCodePatterns();
      newPatterns.push(...codePatterns);

      // 分析最近的代码变化
      const recentPatterns = await this.analyzeRecentChanges();
      newPatterns.push(...recentPatterns);

      // 更新功能模式库
      newPatterns.forEach(pattern => {
        this.featurePatterns.set(pattern.id, pattern);
      });

      if (newPatterns.length > 0) {
        this.saveFeaturePatterns();
      }

      logger.info('功能模式学习完成', { newPatterns: newPatterns.length });
      return newPatterns;

    } catch (error) {
      logger.error('功能模式学习失败', { error: (error as Error).message });
      return [];
    }
  }

  /**
   * 分析代码模式
   */
  private async analyzeCodePatterns(): Promise<FeaturePattern[]> {
    const patterns: FeaturePattern[] = [];

    // 分析常见的代码模式
    const commonPatterns = [
      {
        id: 'tRPC-router-pattern',
        name: 'tRPC路由模式',
        regex: /export\s+const\s+\w+Router\s*=.*\.createRouter\(/g,
        description: 'tRPC路由定义模式'
      },
      {
        id: 'schema-entity-pattern',
        name: 'Schema实体模式',
        regex: /export\s+const\s+\w+Entity\s*=.*defineEntity\(/g,
        description: 'Schema实体定义模式'
      },
      {
        id: 'crud-manager-pattern',
        name: 'CRUD管理器模式',
        regex: /export\s+const\s+\w+CRUD\s*=.*createCRUD\(/g,
        description: 'CRUD管理器创建模式'
      }
    ];

    // 扫描代码文件
    await this.scanDirectory(this.projectRoot, commonPatterns, patterns);

    return patterns;
  }

  /**
   * 扫描目录查找模式
   */
  private async scanDirectory(
    dir: string, 
    regexPatterns: any[], 
    foundPatterns: FeaturePattern[]
  ): Promise<void> {
    if (!existsSync(dir)) return;

    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // 跳过某些目录
        if (['node_modules', '.git', 'dist', '.next'].includes(entry)) continue;
        await this.scanDirectory(fullPath, regexPatterns, foundPatterns);
      } else if (stat.isFile()) {
        // 只处理TypeScript文件
        if (!['.ts', '.tsx'].includes(extname(entry))) continue;
        
        try {
          const content = readFileSync(fullPath, 'utf-8');
          
          for (const pattern of regexPatterns) {
            const matches = content.match(pattern.regex);
            if (matches && matches.length > 0) {
              const existingPattern = foundPatterns.find(p => p.id === pattern.id);
              
              if (existingPattern) {
                existingPattern.frequency++;
                existingPattern.relatedFiles.push(fullPath);
                existingPattern.examples.push(...matches.slice(0, 2)); // 限制示例数量
              } else {
                foundPatterns.push({
                  id: pattern.id,
                  name: pattern.name,
                  description: pattern.description,
                  frequency: 1,
                  examples: matches.slice(0, 2),
                  relatedFiles: [fullPath],
                  bestPractices: this.generateBestPractices(pattern.id),
                  recommendedRules: this.generateRecommendedRules(pattern.id)
                });
              }
            }
          }
        } catch {
          // 忽略文件读取错误
        }
      }
    }
  }

  /**
   * 生成最佳实践建议
   */
  private generateBestPractices(patternId: string): string[] {
    const practices: Record<string, string[]> = {
      'tRPC-router-pattern': [
        '使用明确的路由命名规范',
        '为每个procedure添加输入验证',
        '实现适当的错误处理',
        '添加权限检查中间件'
      ],
      'schema-entity-pattern': [
        '使用描述性的实体名称',
        '定义完整的字段验证规则',
        '考虑数据关系和外键',
        '添加适当的索引提示'
      ],
      'crud-manager-pattern': [
        '实现完整的CRUD操作',
        '添加数据验证和权限检查',
        '考虑软删除和审计日志',
        '优化数据库查询性能'
      ]
    };

    return practices[patternId] || ['遵循项目编码规范', '添加适当的测试用例'];
  }

  /**
   * 生成推荐规则
   */
  private generateRecommendedRules(patternId: string): string[] {
    const rules: Record<string, string[]> = {
      'tRPC-router-pattern': [
        '所有路由都应该有输入验证',
        '异步操作必须有错误处理',
        '使用TypeScript严格模式'
      ],
      'schema-entity-pattern': [
        '实体名称使用PascalCase',
        '字段必须有类型定义',
        '避免使用any类型'
      ],
      'crud-manager-pattern': [
        'CRUD操作必须有权限检查',
        '删除操作应该是软删除',
        '批量操作需要事务支持'
      ]
    };

    return rules[patternId] || ['遵循ESLint规则', '保持代码一致性'];
  }

  /**
   * 分析最近变化
   */
  private async analyzeRecentChanges(): Promise<FeaturePattern[]> {
    // 这里可以集成Git历史分析，识别最近引入的新模式
    // 简化实现，返回空数组
    return [];
  }

  /**
   * 生成工具进化建议
   */
  public async generateToolEvolutionSuggestions(): Promise<ToolEvolution[]> {
    logger.info('开始生成工具进化建议');

    const suggestions: ToolEvolution[] = [];

    try {
      // 分析依赖更新建议
      const dependencyUpdates = await this.analyzeDependencyUpdates();
      suggestions.push(...dependencyUpdates);

      // 分析配置优化建议
      const configOptimizations = await this.analyzeConfigurationOptimizations();
      suggestions.push(...configOptimizations);

      // 分析工具链改进建议
      const toolchainImprovements = await this.analyzeToolchainImprovements();
      suggestions.push(...toolchainImprovements);

      logger.info('工具进化建议生成完成', { suggestions: suggestions.length });
      return suggestions;

    } catch (error) {
      logger.error('工具进化建议生成失败', { error: (error as Error).message });
      return [];
    }
  }

  /**
   * 分析依赖更新建议
   */
  private async analyzeDependencyUpdates(): Promise<ToolEvolution[]> {
    const suggestions: ToolEvolution[] = [];

    // 示例：检查主要依赖是否有更新
    const majorDependencies = [
      { name: 'next', current: '15.3.4', latest: '15.4.0' },
      { name: 'react', current: '19.0.0', latest: '19.0.1' },
      { name: 'typescript', current: '5.8.3', latest: '5.9.0' }
    ];

    majorDependencies.forEach(dep => {
      if (dep.current !== dep.latest) {
        suggestions.push({
          toolName: dep.name,
          currentVersion: dep.current,
          suggestedVersion: dep.latest,
          evolutionType: 'upgrade',
          suggestion: `建议升级${dep.name}到最新版本以获得性能改进和安全修复`,
          priority: this.calculateUpgradePriority(dep.name),
          expectedBenefits: this.getUpgradeBenefits(dep.name),
          risks: this.getUpgradeRisks(dep.name),
          implementation: this.getUpgradeSteps(dep.name, dep.latest)
        });
      }
    });

    return suggestions;
  }

  /**
   * 计算升级优先级
   */
  private calculateUpgradePriority(packageName: string): ToolEvolution['priority'] {
    const criticalPackages = ['next', 'react', 'typescript'];
    const highPackages = ['eslint', 'prettier', 'tailwindcss'];
    
    if (criticalPackages.includes(packageName)) return 'high';
    if (highPackages.includes(packageName)) return 'medium';
    return 'low';
  }

  /**
   * 获取升级收益
   */
  private getUpgradeBenefits(packageName: string): string[] {
    const benefits: Record<string, string[]> = {
      'next': ['性能改进', '新特性支持', '安全漏洞修复', 'Bundle尺寸优化'],
      'react': ['渲染性能提升', 'Hooks改进', '开发体验优化'],
      'typescript': ['类型检查增强', '新语法支持', '编译性能提升'],
      'eslint': ['新规则支持', '性能优化', '配置简化'],
      'prettier': ['格式化改进', '新语言支持', '性能提升']
    };

    return benefits[packageName] || ['性能改进', '错误修复', '新特性支持'];
  }

  /**
   * 获取升级风险
   */
  private getUpgradeRisks(packageName: string): string[] {
    const risks: Record<string, string[]> = {
      'next': ['可能的破坏性变更', '路由行为变化', '构建配置需要调整'],
      'react': ['组件行为变化', 'Hooks API变更', '第三方库兼容性'],
      'typescript': ['类型检查更严格', '编译错误增加', '配置文件需要更新'],
      'eslint': ['新规则可能导致大量警告', '配置格式变化'],
      'prettier': ['代码格式可能发生变化', '配置选项变更']
    };

    return risks[packageName] || ['可能的不兼容问题', '需要测试验证'];
  }

  /**
   * 获取升级步骤
   */
  private getUpgradeSteps(packageName: string, version: string): string[] {
    const baseSteps = [
      `更新package.json中的${packageName}版本到${version}`,
      '运行bun install更新依赖',
      '运行bun run build验证构建',
      '运行bun test确保测试通过',
      '检查功能是否正常运行'
    ];

    const specificSteps: Record<string, string[]> = {
      'next': [
        ...baseSteps,
        '检查next.config.js配置',
        '验证路由功能',
        '测试API路由'
      ],
      'typescript': [
        ...baseSteps,
        '检查tsconfig.json配置',
        '修复新的类型错误',
        '验证类型检查通过'
      ]
    };

    return specificSteps[packageName] || baseSteps;
  }

  /**
   * 分析配置优化建议
   */
  private async analyzeConfigurationOptimizations(): Promise<ToolEvolution[]> {
    const suggestions: ToolEvolution[] = [];

    // 检查ESLint配置优化
    const eslintConfig = join(this.projectRoot, 'eslint.config.js');
    if (existsSync(eslintConfig)) {
      suggestions.push({
        toolName: 'ESLint',
        currentVersion: '当前配置',
        evolutionType: 'configure',
        suggestion: '建议启用更多严格规则以提高代码质量',
        priority: 'medium',
        expectedBenefits: [
          '提高代码质量',
          '统一编码风格',
          '减少潜在错误'
        ],
        risks: [
          '可能产生大量警告',
          '需要修复现有代码'
        ],
        implementation: [
          '逐步启用新规则',
          '修复现有违规代码',
          '团队培训新规范'
        ]
      });
    }

    return suggestions;
  }

  /**
   * 分析工具链改进建议
   */
  private async analyzeToolchainImprovements(): Promise<ToolEvolution[]> {
    const suggestions: ToolEvolution[] = [];

    // 检查是否可以添加新工具
    const potentialTools = [
      {
        name: 'Husky',
        description: 'Git钩子管理工具',
        benefits: ['提交前自动检查', '保证代码质量', '团队协作规范']
      },
      {
        name: 'Lint-staged',
        description: '暂存文件检查工具',
        benefits: ['只检查变更文件', '提高检查效率', '减少CI负担']
      }
    ];

    potentialTools.forEach(tool => {
      suggestions.push({
        toolName: tool.name,
        currentVersion: '未安装',
        evolutionType: 'add',
        suggestion: `建议添加${tool.name}: ${tool.description}`,
        priority: 'low',
        expectedBenefits: tool.benefits,
        risks: ['增加工具复杂性', '需要学习成本'],
        implementation: [
          `安装${tool.name}`,
          '配置相关设置',
          '团队培训使用方法'
        ]
      });
    });

    return suggestions;
  }

  /**
   * 进行系统健康评估
   */
  public async performHealthAssessment(): Promise<SystemHealthAssessment> {
    logger.info('开始系统健康评估');

    try {
      const assessment: SystemHealthAssessment = {
        assessmentTime: new Date().toISOString(),
        overallHealth: 0,
        dimensions: {
          architecture: await this.assessArchitectureHealth(),
          codeQuality: await this.assessCodeQuality(),
          performance: await this.assessPerformance(),
          security: await this.assessSecurity(),
          toolchain: await this.assessToolchain()
        },
        issues: [],
        recommendations: [],
        trends: []
      };

      // 计算整体健康评分
      const scores = Object.values(assessment.dimensions);
      assessment.overallHealth = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

      // 生成问题和建议
      assessment.issues = await this.identifyHealthIssues(assessment);
      assessment.recommendations = await this.generateHealthRecommendations(assessment);
      assessment.trends = await this.analyzeHealthTrends(assessment);

      // 保存评估结果
      const assessmentFile = join(this.dataDir, 'assessments', `health-${Date.now()}.json`);
      writeFileSync(assessmentFile, JSON.stringify(assessment, null, 2));

      logger.info('系统健康评估完成', { 
        overallHealth: assessment.overallHealth,
        issues: assessment.issues.length,
        recommendations: assessment.recommendations.length
      });

      return assessment;

    } catch (error) {
      logger.error('系统健康评估失败', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * 评估架构健康度
   */
  private async assessArchitectureHealth(): Promise<number> {
    let score = 100;

    // 检查包依赖关系
    const changes = await this.detectArchitectureChanges();
    if (changes.length > 0) {
      const impact = changes.reduce((sum, change) => sum + change.impact, 0);
      score -= Math.min(impact * 2, 30); // 最多扣30分
    }

    // 检查包数量是否合理
    const packagesDir = join(this.projectRoot, 'packages');
    if (existsSync(packagesDir)) {
      const packages = readdirSync(packagesDir).filter(name => {
        const pkgPath = join(packagesDir, name);
        return statSync(pkgPath).isDirectory() && existsSync(join(pkgPath, 'package.json'));
      });

      if (packages.length > 10) {
        score -= (packages.length - 10) * 5; // 包太多扣分
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 评估代码质量
   */
  private async assessCodeQuality(): Promise<number> {
    let score = 100;

    // 检查TypeScript配置
    const tsconfigPath = join(this.projectRoot, 'tsconfig.json');
    if (!existsSync(tsconfigPath)) {
      score -= 20;
    }

    // 检查ESLint配置
    const eslintPath = join(this.projectRoot, 'eslint.config.js');
    if (!existsSync(eslintPath)) {
      score -= 15;
    }

    // 检查Prettier配置
    const prettierPath = join(this.projectRoot, 'prettier.config.js');
    if (!existsSync(prettierPath)) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 评估性能
   */
  private async assessPerformance(): Promise<number> {
    let score = 85; // 基础分数

    // 检查构建配置
    const turboPath = join(this.projectRoot, 'turbo.json');
    if (existsSync(turboPath)) {
      score += 5; // 有turbo配置加分
    }

    // 检查包大小（简化检查）
    const lockfilePath = join(this.projectRoot, 'bun.lockb');
    if (existsSync(lockfilePath)) {
      const stat = statSync(lockfilePath);
      if (stat.size > 1024 * 1024) { // 超过1MB
        score -= 10; // 依赖包太大扣分
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 评估安全性
   */
  private async assessSecurity(): Promise<number> {
    let score = 90; // 基础分数

    // 检查是否有安全相关配置
    const packageJsonPath = join(this.projectRoot, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const content = readFileSync(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(content);
        
        // 检查是否有audit脚本
        if (packageJson.scripts && packageJson.scripts.audit) {
          score += 5;
        }

        // 检查是否有husky钩子
        if (packageJson.devDependencies && packageJson.devDependencies.husky) {
          score += 5;
        }
      } catch {
        score -= 10;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 评估工具链
   */
  private async assessToolchain(): Promise<number> {
    let score = 80; // 基础分数

    const essentialFiles = [
      'package.json',
      'tsconfig.json',
      'eslint.config.js',
      'prettier.config.js'
    ];

    essentialFiles.forEach(file => {
      if (existsSync(join(this.projectRoot, file))) {
        score += 5;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 识别健康问题
   */
  private async identifyHealthIssues(assessment: SystemHealthAssessment): Promise<SystemHealthAssessment['issues']> {
    const issues: SystemHealthAssessment['issues'] = [];

    // 检查各维度评分
    Object.entries(assessment.dimensions).forEach(([dimension, score]) => {
      if (score < 60) {
        issues.push({
          level: 'error',
          description: `${dimension}健康度过低 (${score}/100)`,
          impact: `影响系统${dimension}稳定性`,
          recommendation: `需要立即改进${dimension}相关配置和实践`
        });
      } else if (score < 80) {
        issues.push({
          level: 'warning',
          description: `${dimension}健康度偏低 (${score}/100)`,
          impact: `可能影响${dimension}效果`,
          recommendation: `建议优化${dimension}相关设置`
        });
      }
    });

    return issues;
  }

  /**
   * 生成健康建议
   */
  private async generateHealthRecommendations(assessment: SystemHealthAssessment): Promise<string[]> {
    const recommendations: string[] = [];

    if (assessment.overallHealth < 70) {
      recommendations.push('系统整体健康度偏低，建议进行全面改进');
    }

    if (assessment.dimensions.architecture < 80) {
      recommendations.push('考虑重构架构，简化包依赖关系');
    }

    if (assessment.dimensions.codeQuality < 80) {
      recommendations.push('加强代码质量控制，完善ESLint和TypeScript配置');
    }

    if (assessment.dimensions.performance < 80) {
      recommendations.push('优化构建配置，减少依赖包大小');
    }

    if (assessment.dimensions.security < 80) {
      recommendations.push('加强安全措施，添加audit脚本和pre-commit钩子');
    }

    if (assessment.dimensions.toolchain < 80) {
      recommendations.push('完善开发工具链配置');
    }

    return recommendations;
  }

  /**
   * 分析健康趋势
   */
  private async analyzeHealthTrends(assessment: SystemHealthAssessment): Promise<SystemHealthAssessment['trends']> {
    const trends: SystemHealthAssessment['trends'] = [];

    // 简化的趋势分析
    if (assessment.overallHealth >= 85) {
      trends.push({
        description: '系统健康度保持良好状态',
        direction: 'stable',
        metrics: ['整体评分', '各维度平衡']
      });
    } else if (assessment.overallHealth >= 70) {
      trends.push({
        description: '系统健康度处于可接受范围，有改进空间',
        direction: 'stable',
        metrics: ['整体评分', '部分维度待改进']
      });
    } else {
      trends.push({
        description: '系统健康度需要关注，建议制定改进计划',
        direction: 'declining',
        metrics: ['整体评分偏低', '多个维度需要改进']
      });
    }

    return trends;
  }

  /**
   * 创建进化计划
   */
  public async createEvolutionPlan(
    title: string,
    description: string,
    cycle: EvolutionCycle,
    targetDate: string
  ): Promise<EvolutionPlan> {
    logger.info('创建进化计划', { title, cycle });

    const plan: EvolutionPlan = {
      id: `evolution-${Date.now()}`,
      title,
      description,
      cycle,
      targetDate,
      steps: await this.generateEvolutionSteps(cycle),
      successMetrics: this.generateSuccessMetrics(cycle),
      rollbackPlan: this.generateRollbackPlan(),
      createdAt: new Date().toISOString(),
      status: 'draft'
    };

    this.evolutionHistory.push(plan);
    this.saveEvolutionHistory();

    logger.info('进化计划创建完成', { planId: plan.id });
    return plan;
  }

  /**
   * 生成进化步骤
   */
  private async generateEvolutionSteps(cycle: EvolutionCycle): Promise<EvolutionPlan['steps']> {
    const steps: EvolutionPlan['steps'] = [];

    switch (cycle) {
      case EvolutionCycle.WEEKLY:
        steps.push(
          {
            name: '检测架构变化',
            description: '分析本周的架构变化和影响',
            estimatedTime: '30分钟',
            status: 'pending'
          },
          {
            name: '更新功能模式',
            description: '学习新的代码模式和最佳实践',
            estimatedTime: '1小时',
            status: 'pending'
          },
          {
            name: '生成改进建议',
            description: '基于分析结果生成改进建议',
            estimatedTime: '30分钟',
            status: 'pending'
          }
        );
        break;

      case EvolutionCycle.MONTHLY:
        steps.push(
          {
            name: '全面健康评估',
            description: '对系统进行全面的健康度评估',
            estimatedTime: '2小时',
            status: 'pending'
          },
          {
            name: '工具链优化',
            description: '分析和优化开发工具链',
            estimatedTime: '4小时',
            status: 'pending'
          },
          {
            name: '依赖更新规划',
            description: '制定依赖更新和升级计划',
            estimatedTime: '2小时',
            status: 'pending'
          },
          {
            name: '实施改进措施',
            description: '执行高优先级的改进措施',
            estimatedTime: '1天',
            status: 'pending'
          }
        );
        break;

      case EvolutionCycle.QUARTERLY:
        steps.push(
          {
            name: '架构深度分析',
            description: '对系统架构进行深度分析和评估',
            estimatedTime: '1天',
            status: 'pending'
          },
          {
            name: '技术栈评估',
            description: '评估当前技术栈的适用性和先进性',
            estimatedTime: '2天',
            status: 'pending'
          },
          {
            name: '重大升级规划',
            description: '制定重大版本升级和迁移计划',
            estimatedTime: '3天',
            status: 'pending'
          },
          {
            name: '架构重构执行',
            description: '执行必要的架构重构和优化',
            estimatedTime: '1-2周',
            status: 'pending'
          }
        );
        break;

      case EvolutionCycle.YEARLY:
        steps.push(
          {
            name: '战略技术评估',
            description: '评估行业技术趋势和战略方向',
            estimatedTime: '1周',
            status: 'pending'
          },
          {
            name: '架构演进规划',
            description: '制定长期架构演进路线图',
            estimatedTime: '2周',
            status: 'pending'
          },
          {
            name: '技术栈现代化',
            description: '实施技术栈现代化升级',
            estimatedTime: '1-2月',
            status: 'pending'
          },
          {
            name: '生态系统建设',
            description: '建设和完善技术生态系统',
            estimatedTime: '3-6月',
            status: 'pending'
          }
        );
        break;
    }

    return steps;
  }

  /**
   * 生成成功指标
   */
  private generateSuccessMetrics(cycle: EvolutionCycle): string[] {
    const baseMetrics = [
      '构建成功率保持100%',
      '测试覆盖率不低于当前水平',
      '代码质量评分提升'
    ];

    switch (cycle) {
      case EvolutionCycle.WEEKLY:
        return [
          ...baseMetrics,
          '新发现模式数量 > 0',
          '改进建议实施率 > 80%'
        ];

      case EvolutionCycle.MONTHLY:
        return [
          ...baseMetrics,
          '系统健康评分提升5分以上',
          '工具链优化完成率 > 90%',
          '依赖安全漏洞数量为0'
        ];

      case EvolutionCycle.QUARTERLY:
        return [
          ...baseMetrics,
          '架构健康度提升10分以上',
          '性能指标改善10%以上',
          '开发效率提升15%以上'
        ];

      case EvolutionCycle.YEARLY:
        return [
          ...baseMetrics,
          '技术栈现代化程度达到行业领先',
          '整体系统健康度达到90分以上',
          '开发效率提升50%以上',
          '团队技术满意度提升'
        ];

      default:
        return baseMetrics;
    }
  }

  /**
   * 生成回退计划
   */
  private generateRollbackPlan(): string[] {
    return [
      '创建完整的系统备份',
      '记录所有配置变更',
      '准备回退脚本和流程',
      '设置监控和告警机制',
      '制定快速回退决策标准',
      '验证回退流程的有效性'
    ];
  }

  /**
   * 执行进化计划
   */
  public async executeEvolutionPlan(planId: string): Promise<boolean> {
    logger.info('开始执行进化计划', { planId });

    const plan = this.evolutionHistory.find(p => p.id === planId);
    if (!plan) {
      throw new Error(`未找到进化计划: ${planId}`);
    }

    try {
      plan.status = 'executing';
      this.saveEvolutionHistory();

      for (const step of plan.steps) {
        if (step.status === 'completed') continue;

        logger.info('执行进化步骤', { step: step.name });
        step.status = 'in_progress';
        this.saveEvolutionHistory();

        // 模拟步骤执行
        await this.executeEvolutionStep(step);

        step.status = 'completed';
        this.saveEvolutionHistory();
        logger.info('进化步骤完成', { step: step.name });
      }

      plan.status = 'completed';
      this.saveEvolutionHistory();

      logger.info('进化计划执行完成', { planId });
      return true;

    } catch (error) {
      plan.status = 'cancelled';
      this.saveEvolutionHistory();
      logger.error('进化计划执行失败', { planId, error: (error as Error).message });
      return false;
    }
  }

  /**
   * 执行单个进化步骤
   */
  private async executeEvolutionStep(step: EvolutionPlan['steps'][0]): Promise<void> {
    // 根据步骤名称执行相应的操作
    switch (step.name) {
      case '检测架构变化':
        await this.detectArchitectureChanges();
        break;
      
      case '更新功能模式':
        await this.learnNewFeaturePatterns();
        break;
      
      case '生成改进建议':
        await this.generateToolEvolutionSuggestions();
        break;
      
      case '全面健康评估':
        await this.performHealthAssessment();
        break;
      
      default:
        // 模拟执行时间
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
    }
  }

  /**
   * 保存系统状态快照
   */
  public saveSystemSnapshot(): void {
    this.saveSnapshot();
    logger.info('系统状态快照已保存');
  }

  /**
   * 获取系统统计信息
   */
  public getSystemStatistics(): {
    totalPatterns: number;
    totalPlans: number;
    completedPlans: number;
    systemHealth: number | null;
    lastAssessment: string | null;
  } {
    const completedPlans = this.evolutionHistory.filter(p => p.status === 'completed').length;
    
    // 获取最新的健康评估
    const assessmentsDir = join(this.dataDir, 'assessments');
    let systemHealth: number | null = null;
    let lastAssessment: string | null = null;

    if (existsSync(assessmentsDir)) {
      const assessmentFiles = readdirSync(assessmentsDir)
        .filter(file => file.startsWith('health-') && file.endsWith('.json'))
        .sort()
        .reverse();

      if (assessmentFiles.length > 0) {
        try {
          const latestFile = join(assessmentsDir, assessmentFiles[0]);
          const content = readFileSync(latestFile, 'utf-8');
          const assessment = JSON.parse(content);
          systemHealth = assessment.overallHealth;
          lastAssessment = assessment.assessmentTime;
        } catch {
          // 忽略读取错误
        }
      }
    }

    return {
      totalPatterns: this.featurePatterns.size,
      totalPlans: this.evolutionHistory.length,
      completedPlans,
      systemHealth,
      lastAssessment
    };
  }
}

/**
 * 快捷函数：创建进化引擎实例
 */
export function createEvolutionEngine(projectRoot?: string): EvolutionEngine {
  return new EvolutionEngine(projectRoot);
}

/**
 * 快捷函数：快速健康评估
 */
export async function quickHealthAssessment(): Promise<SystemHealthAssessment> {
  const engine = new EvolutionEngine();
  return await engine.performHealthAssessment();
}

/**
 * 快捷函数：快速变化检测
 */
export async function quickChangeDetection(): Promise<ChangeDetection[]> {
  const engine = new EvolutionEngine();
  return await engine.detectArchitectureChanges();
}