/**
 * LinchKit AI工作流实施引擎
 * 负责将工作流决策转换为实际的代码生成和文件操作
 * 
 * @version 1.0.0 - Phase 2 实施引擎核心框架
 */

import { createLogger } from '@linch-kit/core'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, access, mkdir, unlink } from 'fs/promises'
import { constants } from 'fs'
import { join, dirname } from 'path'

const execAsync = promisify(exec)

const logger = createLogger('implementation-engine')

export interface ImplementationTask {
  id: string
  type: 'file_create' | 'file_modify' | 'file_delete' | 'command_execute' | 'package_install'
  priority: 'critical' | 'high' | 'medium' | 'low'
  description: string
  targetPath?: string
  content?: string
  command?: string
  dependencies?: string[]
  estimatedTime?: number // 预估时间（秒）
  rollbackData?: {
    type: 'restore_content' | 'delete_file' | 'restore_package'
    originalContent?: string
    originalExists?: boolean
  }
}

export interface ImplementationPlan {
  sessionId: string
  taskDescription: string
  tasks: ImplementationTask[]
  estimatedTotalTime: number
  dependencies: string[]
  rollbackSupported: boolean
  metadata: {
    generatedAt: string
    generatedBy: string
    workflowComplexity: number
    riskLevel: 'low' | 'medium' | 'high'
  }
}

export interface ImplementationProgress {
  sessionId: string
  totalTasks: number
  completedTasks: number
  currentTask?: ImplementationTask
  progress: number // 0-100
  status: 'preparing' | 'executing' | 'paused' | 'completed' | 'failed' | 'rolled_back'
  errors: Array<{
    taskId: string
    error: string
    timestamp: string
    severity: 'warning' | 'error' | 'fatal'
  }>
  startTime: string
  endTime?: string
  completedTaskIds: string[]
}

export interface ImplementationOptions {
  dryRun?: boolean
  continueOnError?: boolean
  enableRollback?: boolean
  maxConcurrentTasks?: number
  timeoutPerTask?: number // 秒
  backupFiles?: boolean
}

/**
 * 实施引擎核心类
 * 负责执行工作流实施计划
 */
export class ImplementationEngine {
  private projectRoot: string
  private progress: Map<string, ImplementationProgress> = new Map()
  private rollbackStacks: Map<string, ImplementationTask[]> = new Map()

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
    logger.info(`Implementation engine initialized for project: ${projectRoot}`)
  }

  /**
   * 生成实施计划
   */
  async generateImplementationPlan(
    sessionId: string,
    taskDescription: string,
    workflowDecision: any
  ): Promise<ImplementationPlan> {
    logger.info(`Generating implementation plan for session: ${sessionId}`)

    try {
      // 基于工作流决策生成具体的实施任务
      const tasks = await this.analyzeAndGenerateTasks(taskDescription, workflowDecision)
      
      const plan: ImplementationPlan = {
        sessionId,
        taskDescription,
        tasks,
        estimatedTotalTime: tasks.reduce((total, task) => total + (task.estimatedTime || 30), 0),
        dependencies: this.extractDependencies(tasks),
        rollbackSupported: tasks.every(task => this.canRollback(task)),
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: 'ai-implementation-engine',
          workflowComplexity: workflowDecision.estimatedEffort?.complexity || 3,
          riskLevel: this.assessRiskLevel(tasks, workflowDecision)
        }
      }

      logger.info(`Generated implementation plan with ${tasks.length} tasks`)
      return plan

    } catch (error) {
      logger.error(`Failed to generate implementation plan: ${error}`)
      throw new Error(`Implementation plan generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 执行实施计划
   */
  async executeImplementationPlan(
    plan: ImplementationPlan,
    options: ImplementationOptions = {}
  ): Promise<ImplementationProgress> {
    const sessionId = plan.sessionId
    logger.info(`Starting implementation execution for session: ${sessionId}`)

    // 初始化进度跟踪
    const progress: ImplementationProgress = {
      sessionId,
      totalTasks: plan.tasks.length,
      completedTasks: 0,
      progress: 0,
      status: 'preparing',
      errors: [],
      startTime: new Date().toISOString(),
      completedTaskIds: []
    }

    this.progress.set(sessionId, progress)
    this.rollbackStacks.set(sessionId, [])

    try {
      // 前置检查
      await this.preImplementationChecks(plan, options)
      
      progress.status = 'executing'
      this.updateProgress(sessionId, progress)

      // 执行任务
      for (let i = 0; i < plan.tasks.length; i++) {
        const task = plan.tasks[i]
        progress.currentTask = task
        
        logger.info(`Executing task ${i + 1}/${plan.tasks.length}: ${task.description}`)

        try {
          if (options.dryRun) {
            await this.simulateTaskExecution(task)
          } else {
            await this.executeTask(task, options)
            
            // 记录成功的任务到回滚栈
            if (options.enableRollback && this.canRollback(task)) {
              this.rollbackStacks.get(sessionId)!.push(task)
            }
          }

          // 更新进度
          progress.completedTasks++
          progress.completedTaskIds.push(task.id)
          progress.progress = Math.round((progress.completedTasks / progress.totalTasks) * 100)
          this.updateProgress(sessionId, progress)

          logger.info(`Task completed: ${task.id}`)

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          const taskError = {
            taskId: task.id,
            error: errorMessage,
            timestamp: new Date().toISOString(),
            severity: this.determineSeverity(error, task)
          }

          progress.errors.push(taskError)
          logger.error(`Task failed: ${task.id} - ${errorMessage}`)

          if (!options.continueOnError || taskError.severity === 'fatal') {
            progress.status = 'failed'
            progress.endTime = new Date().toISOString()
            this.updateProgress(sessionId, progress)
            
            throw new Error(`Implementation failed at task: ${task.id} - ${errorMessage}`)
          }
        }
      }

      // 实施完成
      progress.status = 'completed'
      progress.endTime = new Date().toISOString()
      progress.currentTask = undefined
      this.updateProgress(sessionId, progress)

      logger.info(`Implementation completed successfully for session: ${sessionId}`)
      return progress

    } catch (error) {
      progress.status = 'failed'
      progress.endTime = new Date().toISOString()
      this.updateProgress(sessionId, progress)
      
      logger.error(`Implementation execution failed: ${error}`)
      throw error
    }
  }

  /**
   * 回滚实施
   */
  async rollbackImplementation(sessionId: string): Promise<boolean> {
    logger.info(`Starting rollback for session: ${sessionId}`)

    const progress = this.progress.get(sessionId)
    const rollbackStack = this.rollbackStacks.get(sessionId)

    if (!progress || !rollbackStack) {
      throw new Error(`No implementation found for session: ${sessionId}`)
    }

    try {
      progress.status = 'rolling_back'
      this.updateProgress(sessionId, progress)

      // 反向执行回滚操作
      for (let i = rollbackStack.length - 1; i >= 0; i--) {
        const task = rollbackStack[i]
        logger.info(`Rolling back task: ${task.id}`)
        
        await this.rollbackTask(task)
      }

      progress.status = 'rolled_back'
      progress.endTime = new Date().toISOString()
      this.updateProgress(sessionId, progress)

      logger.info(`Rollback completed for session: ${sessionId}`)
      return true

    } catch (error) {
      logger.error(`Rollback failed: ${error}`)
      return false
    }
  }

  /**
   * 获取实施进度
   */
  getImplementationProgress(sessionId: string): ImplementationProgress | null {
    return this.progress.get(sessionId) || null
  }

  /**
   * 暂停实施
   */
  pauseImplementation(sessionId: string): boolean {
    const progress = this.progress.get(sessionId)
    if (progress && progress.status === 'executing') {
      progress.status = 'paused'
      this.updateProgress(sessionId, progress)
      return true
    }
    return false
  }

  /**
   * 恢复实施
   */
  resumeImplementation(sessionId: string): boolean {
    const progress = this.progress.get(sessionId)
    if (progress && progress.status === 'paused') {
      progress.status = 'executing'
      this.updateProgress(sessionId, progress)
      return true
    }
    return false
  }

  /**
   * 分析任务描述并生成具体任务
   */
  private async analyzeAndGenerateTasks(
    taskDescription: string,
    workflowDecision: any
  ): Promise<ImplementationTask[]> {
    const tasks: ImplementationTask[] = []

    // 基于任务描述和工作流决策生成具体任务
    // 这里可以集成AI或规则引擎来智能生成任务

    // 示例：简单的任务生成逻辑
    if (taskDescription.includes('添加') || taskDescription.includes('新增')) {
      tasks.push({
        id: `create-${Date.now()}`,
        type: 'file_create',
        priority: 'high',
        description: '创建新文件或组件',
        targetPath: this.generateTargetPath(taskDescription),
        content: await this.generateFileContent(taskDescription),
        estimatedTime: 60
      })
    }

    if (taskDescription.includes('修复') || taskDescription.includes('fix')) {
      tasks.push({
        id: `fix-${Date.now()}`,
        type: 'file_modify',
        priority: 'high',
        description: '修复现有文件',
        targetPath: this.findTargetFile(taskDescription),
        estimatedTime: 30
      })
    }

    // 如果没有生成任何任务，创建一个通用任务
    if (tasks.length === 0) {
      tasks.push({
        id: `generic-${Date.now()}`,
        type: 'file_create',
        priority: 'medium',
        description: `实施任务: ${taskDescription}`,
        estimatedTime: 120
      })
    }

    return tasks
  }

  /**
   * 执行单个任务
   */
  private async executeTask(task: ImplementationTask, options: ImplementationOptions): Promise<void> {
    switch (task.type) {
      case 'file_create':
        await this.executeFileCreate(task)
        break
      case 'file_modify':
        await this.executeFileModify(task)
        break
      case 'file_delete':
        await this.executeFileDelete(task)
        break
      case 'command_execute':
        await this.executeCommand(task)
        break
      case 'package_install':
        await this.executePackageInstall(task)
        break
      default:
        throw new Error(`Unknown task type: ${task.type}`)
    }
  }

  /**
   * 执行文件创建任务
   */
  private async executeFileCreate(task: ImplementationTask): Promise<void> {
    if (!task.targetPath || !task.content) {
      throw new Error('File create task missing targetPath or content')
    }

    const fullPath = join(this.projectRoot, task.targetPath)
    const directory = dirname(fullPath)

    try {
      // 确保目录存在
      await mkdir(directory, { recursive: true })
      
      // 检查文件是否已存在
      let originalExists = false
      try {
        await access(fullPath, constants.F_OK)
        originalExists = true
      } catch {
        // 文件不存在，这是预期的
      }

      // 保存回滚信息
      task.rollbackData = {
        type: 'delete_file',
        originalExists
      }

      // 创建文件
      await writeFile(fullPath, task.content, 'utf8')
      logger.info(`Created file: ${fullPath}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to create file ${fullPath}: ${errorMessage}`)
    }
  }

  /**
   * 执行文件修改任务
   */
  private async executeFileModify(task: ImplementationTask): Promise<void> {
    if (!task.targetPath) {
      throw new Error('File modify task missing targetPath')
    }

    const fullPath = join(this.projectRoot, task.targetPath)

    try {
      // 检查文件是否存在
      await access(fullPath, constants.F_OK)
      
      // 保存原始内容用于回滚
      const originalContent = await readFile(fullPath, 'utf8')
      task.rollbackData = {
        type: 'restore_content',
        originalContent,
        originalExists: true
      }

      // 修改文件（这里需要具体的修改逻辑）
      if (task.content) {
        await writeFile(fullPath, task.content, 'utf8')
        logger.info(`Modified file: ${fullPath}`)
      }
    } catch (error) {
      if (error instanceof Error && error.code === 'ENOENT') {
        throw new Error(`Target file does not exist: ${fullPath}`)
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to modify file ${fullPath}: ${errorMessage}`)
    }
  }

  /**
   * 执行文件删除任务
   */
  private async executeFileDelete(task: ImplementationTask): Promise<void> {
    if (!task.targetPath) {
      throw new Error('File delete task missing targetPath')
    }

    const fullPath = join(this.projectRoot, task.targetPath)

    try {
      // 检查文件是否存在并保存原始内容用于回滚
      const originalContent = await readFile(fullPath, 'utf8')
      task.rollbackData = {
        type: 'restore_content',
        originalContent,
        originalExists: true
      }

      // 删除文件
      await unlink(fullPath)
      logger.info(`Deleted file: ${fullPath}`)
    } catch (error) {
      if (error instanceof Error && error.code === 'ENOENT') {
        logger.warn(`File to delete does not exist: ${fullPath}`)
        task.rollbackData = {
          type: 'restore_content',
          originalExists: false
        }
        return
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to delete file ${fullPath}: ${errorMessage}`)
    }
  }

  /**
   * 执行命令任务
   */
  private async executeCommand(task: ImplementationTask): Promise<void> {
    if (!task.command) {
      throw new Error('Command task missing command')
    }

    try {
      // 安全的命令执行，避免命令注入
      const sanitizedCommand = this.sanitizeCommand(task.command)
      
      const { stdout, stderr } = await execAsync(sanitizedCommand, { 
        cwd: this.projectRoot,
        timeout: 30000,
        maxBuffer: 1024 * 1024 // 1MB buffer
      })
      
      logger.info(`Command executed: ${sanitizedCommand}`)
      if (stdout) logger.debug(`Command output: ${stdout}`)
      if (stderr) logger.warn(`Command stderr: ${stderr}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Command execution failed: ${task.command} - ${errorMessage}`)
    }
  }

  /**
   * 安全化命令，防止命令注入
   */
  private sanitizeCommand(command: string): string {
    // 基本的命令注入防护
    const dangerous = [';', '&&', '||', '|', '>', '<', '`', '$', '(', ')']
    const containsDangerous = dangerous.some(char => command.includes(char))
    
    if (containsDangerous) {
      // 只允许已知安全的命令模式
      const safePatterns = [
        /^bun\s+(add|install|run|build|test)\s+[\w\-@/\s\.\:]+$/,
        /^git\s+(status|add|commit|push|pull|checkout)\s*[\w\-\s]*$/,
        /^npm\s+(run|test)\s+[\w\-]+$/
      ]
      
      const isSafe = safePatterns.some(pattern => pattern.test(command))
      if (!isSafe) {
        throw new Error(`Potentially unsafe command blocked: ${command}`)
      }
    }
    
    return command
  }

  /**
   * 执行包安装任务
   */
  private async executePackageInstall(task: ImplementationTask): Promise<void> {
    if (!task.dependencies || task.dependencies.length === 0) {
      throw new Error('Package install task missing dependencies')
    }

    const packages = task.dependencies.join(' ')
    const command = `bun add ${packages} --no-cache`

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.projectRoot,
        timeout: 120000, // 2分钟超时
        maxBuffer: 5 * 1024 * 1024 // 5MB buffer for package installation
      })
      
      logger.info(`Packages installed: ${packages}`)
      if (stdout) logger.debug(`Installation output: ${stdout}`)
      if (stderr) logger.warn(`Installation warnings: ${stderr}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Package installation failed: ${packages} - ${errorMessage}`)
    }
  }

  /**
   * 回滚单个任务
   */
  private async rollbackTask(task: ImplementationTask): Promise<void> {
    if (!task.rollbackData) {
      logger.warn(`No rollback data for task: ${task.id}`)
      return
    }

    const { type, originalContent, originalExists } = task.rollbackData

    switch (type) {
      case 'restore_content':
        if (task.targetPath && originalContent && originalExists) {
          const fullPath = join(this.projectRoot, task.targetPath)
          writeFileSync(fullPath, originalContent, 'utf8')
          logger.info(`Restored file: ${fullPath}`)
        }
        break
      case 'delete_file':
        if (task.targetPath && !originalExists) {
          const fullPath = join(this.projectRoot, task.targetPath)
          if (existsSync(fullPath)) {
            require('fs').unlinkSync(fullPath)
            logger.info(`Removed created file: ${fullPath}`)
          }
        }
        break
    }
  }

  /**
   * 更新进度
   */
  private updateProgress(sessionId: string, progress: ImplementationProgress): void {
    this.progress.set(sessionId, { ...progress })
    logger.debug(`Progress updated for ${sessionId}: ${progress.progress}%`)
  }

  /**
   * 辅助方法
   */
  private generateTargetPath(taskDescription: string): string {
    // 简单的路径生成逻辑
    const timestamp = Date.now()
    return `src/generated/task-${timestamp}.ts`
  }

  private async generateFileContent(taskDescription: string): Promise<string> {
    // 这里可以集成AI来生成文件内容
    return `// Generated file for: ${taskDescription}\n// Generated at: ${new Date().toISOString()}\n\nexport const generated = true;\n`
  }

  private findTargetFile(taskDescription: string): string {
    // 简单的文件查找逻辑
    return 'src/existing-file.ts'
  }

  private extractDependencies(tasks: ImplementationTask[]): string[] {
    const deps = new Set<string>()
    tasks.forEach(task => {
      if (task.dependencies) {
        task.dependencies.forEach(dep => deps.add(dep))
      }
    })
    return Array.from(deps)
  }

  private canRollback(task: ImplementationTask): boolean {
    return task.type === 'file_create' || task.type === 'file_modify' || task.type === 'file_delete'
  }

  private assessRiskLevel(tasks: ImplementationTask[], workflowDecision: any): 'low' | 'medium' | 'high' {
    const hasCriticalTasks = tasks.some(task => task.priority === 'critical')
    const hasCommandTasks = tasks.some(task => task.type === 'command_execute')
    const complexity = workflowDecision.estimatedEffort?.complexity || 3

    if (hasCriticalTasks || hasCommandTasks || complexity >= 4) {
      return 'high'
    } else if (complexity >= 3) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  private async simulateTaskExecution(task: ImplementationTask): Promise<void> {
    // 模拟任务执行时间
    const delay = Math.min(task.estimatedTime || 30, 5) * 10 // 缩短模拟时间
    await new Promise(resolve => setTimeout(resolve, delay))
    logger.info(`Simulated task: ${task.id}`)
  }

  private async preImplementationChecks(plan: ImplementationPlan, options: ImplementationOptions): Promise<void> {
    // 检查项目环境
    if (!existsSync(this.projectRoot)) {
      throw new Error(`Project root does not exist: ${this.projectRoot}`)
    }

    // 检查必要的依赖
    for (const dep of plan.dependencies) {
      // 这里可以检查依赖是否可用
    }

    logger.info(`Pre-implementation checks passed for plan: ${plan.sessionId}`)
  }

  private determineSeverity(error: unknown, task: ImplementationTask): 'warning' | 'error' | 'fatal' {
    if (task.priority === 'critical') {
      return 'fatal'
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('permission') || errorMessage.includes('access')) {
      return 'fatal'
    }
    
    return 'error'
  }
}

/**
 * 工厂函数
 */
export function createImplementationEngine(projectRoot?: string): ImplementationEngine {
  return new ImplementationEngine(projectRoot)
}