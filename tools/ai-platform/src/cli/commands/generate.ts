/**
 * AI Generate Command
 *
 * LinchKit Vibe Coding Engine CLI 接口
 * 基于上下文感知生成代码
 */

import { createLogger } from '@linch-kit/core/server'

import type { CommandContext, CommandResult, CLICommand } from '../plugin.js'
import { VibeCodingEngine } from '../../generation/vibe-coding-engine.js'
import { IntelligentQueryEngine } from '../../query/intelligent-query-engine.js'
import { GenerationContextType, TechStack, QualityLevel } from '../../generation/types.js'

const logger = createLogger({ name: 'ai:generate-command' })

/**
 * 生成命令选项
 */
interface GenerateOptions {
  prompt: string
  type?: GenerationContextType
  techStack?: TechStack[]
  quality?: QualityLevel
  outputFile?: string
  dryRun?: boolean
}

/**
 * 执行代码生成
 */
async function executeGenerate(options: GenerateOptions): Promise<CommandResult> {
  const startTime = Date.now()

  try {
    logger.info('开始代码生成', { options })

    // 1. 初始化引擎
    const queryEngine = new IntelligentQueryEngine()
    const codeEngine = new VibeCodingEngine()

    await codeEngine.initialize()

    // 2. 查询相关上下文
    const queryResult = await queryEngine.query(options.prompt)

    if (!queryResult.results.nodes.length) {
      return {
        success: false,
        error: '无法获取相关上下文数据',
        duration: Date.now() - startTime,
      }
    }

    // 3. 生成代码
    const generationContext = {
      prompt: options.prompt,
      type: options.type || ('function' as GenerationContextType),
      tech_stack: options.techStack || ['typescript' as TechStack],
      quality_level: options.quality || ('production' as QualityLevel),
      target_package: '@linch-kit/generated', // 默认目标包
      metadata: {
        cli_generated: true,
        timestamp: new Date().toISOString(),
      },
    }

    const result = await codeEngine.generateCode(options.prompt, generationContext)

    // 4. 输出结果
    if (options.dryRun) {
      return {
        success: true,
        message: '代码生成预览（dry-run模式）',
        data: {
          code: result.code,
          imports: result.imports,
          exports: result.exports,
          metadata: result.metadata,
        },
        duration: Date.now() - startTime,
      }
    }

    // 5. 保存到文件（如果指定）
    if (options.outputFile) {
      const fs = await import('fs/promises')

      // 构建完整的代码内容
      const fullCode = [
        ...result.imports.map(imp => `import ${imp}`),
        '',
        result.code,
        '',
        ...result.exports.map(exp => `export ${exp}`),
      ].join('\n')

      await fs.writeFile(options.outputFile, fullCode, 'utf-8')

      return {
        success: true,
        message: `代码已生成并保存到 ${options.outputFile}`,
        data: {
          file: options.outputFile,
          linesGenerated: fullCode.split('\n').length,
          importsCount: result.imports.length,
          exportsCount: result.exports.length,
          confidence: result.metadata.confidence,
        },
        duration: Date.now() - startTime,
      }
    }

    return {
      success: true,
      message: '代码生成成功',
      data: {
        code: result.code,
        imports: result.imports,
        exports: result.exports,
        metadata: result.metadata,
      },
      duration: Date.now() - startTime,
    }
  } catch (error) {
    logger.error('代码生成失败', error instanceof Error ? error : undefined, { options })
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      duration: Date.now() - startTime,
    }
  }
}

/**
 * 解析命令参数
 */
function parseGenerateOptions(context: CommandContext): GenerateOptions {
  const { args, options } = context

  // 从参数中获取提示语
  const prompt = args[0] || (options.prompt as string)

  if (!prompt) {
    throw new Error('请提供代码生成提示语：linch ai:generate "创建用户认证函数"')
  }

  // 解析类型
  let type: GenerationContextType | undefined
  if (options.type) {
    const typeStr = options.type as string
    if (Object.values(GenerationContextType).includes(typeStr as GenerationContextType)) {
      type = typeStr as GenerationContextType
    }
  }

  // 解析技术栈
  let techStack: TechStack[] | undefined
  if (options.techStack || options['tech-stack']) {
    const stackStr = (options.techStack || options['tech-stack']) as string
    techStack = stackStr.split(',').map(s => s.trim() as TechStack)
  }

  // 解析质量级别
  let quality: QualityLevel | undefined
  if (options.quality) {
    const qualityStr = options.quality as string
    if (['prototype', 'development', 'production'].includes(qualityStr)) {
      quality = qualityStr as QualityLevel
    }
  }

  return {
    prompt,
    type,
    techStack,
    quality,
    outputFile: (options.output as string) || (options.o as string),
    dryRun: Boolean(options.dryRun || options['dry-run']),
  }
}

/**
 * Generate 命令实现
 */
export const generateCommand: CLICommand = {
  name: 'ai:generate',
  description: 'LinchKit Vibe Coding Engine - 基于上下文感知生成代码',
  category: 'AI Code Generation',

  options: [
    {
      name: 'type',
      description: '生成代码类型 (function|class|component|api_route|etc)',
      type: 'string',
      defaultValue: 'function',
    },
    {
      name: 'tech-stack',
      description: '技术栈 (typescript,react,nextjs)',
      type: 'string',
      defaultValue: 'typescript',
    },
    {
      name: 'quality',
      description: '质量级别 (prototype|development|production)',
      type: 'string',
      defaultValue: 'production',
    },
    {
      name: 'output',
      description: '输出文件路径',
      type: 'string',
    },
    {
      name: 'dry-run',
      description: '预览模式，不保存文件',
      type: 'boolean',
      defaultValue: false,
    },
  ],

  examples: [
    'linch ai:generate "创建用户认证函数"',
    'linch ai:generate "创建用户管理API" --type api_route --output ./api/users.ts',
    'linch ai:generate "创建登录组件" --type component --tech-stack typescript,react',
    'linch ai:generate "创建用户Schema" --type schema --dry-run',
  ],

  async handler(context: CommandContext): Promise<CommandResult> {
    try {
      const options = parseGenerateOptions(context)
      return await executeGenerate(options)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '参数解析失败',
      }
    }
  },
}
