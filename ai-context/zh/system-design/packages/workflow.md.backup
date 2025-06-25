# @linch-kit/workflow 工作流插件包

**包版本**: v1.0.0
**创建日期**: 2025-06-23
**最后更新**: 2025-06-24
**开发优先级**: P2 - 中优先级
**依赖关系**: core → schema → auth → crud → trpc → ui → workflow (插件)
**维护状态**: 🔄 设计中

---

## 📋 模块概览

### 功能定位
@linch-kit/workflow 是 LinchKit 的工作流引擎插件包，提供完整的业务流程管理能力。基于状态机模式设计，支持复杂的审批流程、任务派发、多人协作等场景，为企业级应用提供强大的流程自动化能力。

### 核心特性
- **🔄 状态机引擎**: 基于有限状态机的流程控制
- **🎯 智能路由**: 支持条件分支和并行网关
- **👥 多人协作**: 角色权限和任务分配
- **🤖 AI 集成**: 自然语言生成工作流
- **📊 可视化编排**: React Flow 可视化流程设计器
- **🔌 插件架构**: 完全插件化，无侵入集成
- **📈 审计追踪**: 完整的流程执行日志
- **⚡ 高性能**: 支持大规模并发流程实例

### 技术亮点
- **类型安全**: 完整的 TypeScript 类型定义
- **Schema 驱动**: 基于 Zod 的数据验证
- **事件驱动**: 基于事件总线的松耦合架构
- **可扩展性**: 支持自定义节点类型和动作
- **容错性**: 支持流程暂停、恢复和错误处理

---

## 🎯 API 设计

### 核心接口定义

#### WorkflowEngine 核心引擎
```typescript
export interface WorkflowEngine {
  // 工作流定义管理
  createDefinition(definition: WorkflowDefinitionInput): Promise<WorkflowDefinition>
  updateDefinition(id: string, updates: Partial<WorkflowDefinitionInput>): Promise<WorkflowDefinition>
  deleteDefinition(id: string): Promise<void>
  getDefinition(id: string): Promise<WorkflowDefinition | null>
  listDefinitions(filter?: WorkflowDefinitionFilter): Promise<WorkflowDefinition[]>

  // 工作流实例管理
  createInstance(definitionId: string, data: Record<string, unknown>, startedBy: string): Promise<WorkflowInstance>
  getInstance(id: string): Promise<WorkflowInstance | null>
  listInstances(filter?: WorkflowInstanceFilter): Promise<WorkflowInstance[]>

  // 状态流转
  transition(instanceId: string, action: string, data?: Record<string, unknown>, userId?: string): Promise<WorkflowInstance>
  canTransition(instanceId: string, action: string, userId?: string): Promise<boolean>
  getAvailableActions(instanceId: string, userId?: string): Promise<WorkflowAction[]>

  // 任务管理
  getUserTasks(userId: string, filter?: TaskFilter): Promise<WorkflowTask[]>
  completeTask(taskId: string, data: Record<string, unknown>, userId: string): Promise<WorkflowTask>
  delegateTask(taskId: string, toUserId: string, fromUserId: string): Promise<WorkflowTask>

  // 流程控制
  pauseInstance(instanceId: string, reason?: string): Promise<WorkflowInstance>
  resumeInstance(instanceId: string): Promise<WorkflowInstance>
  cancelInstance(instanceId: string, reason?: string): Promise<WorkflowInstance>

  // 查询和统计
  getInstanceHistory(instanceId: string): Promise<WorkflowLog[]>
  getInstanceMetrics(definitionId?: string): Promise<WorkflowMetrics>
  searchInstances(query: WorkflowSearchQuery): Promise<WorkflowSearchResult>
}
```

#### WorkflowDefinition 工作流定义
```typescript
export interface WorkflowDefinition {
  id: string
  name: string
  description?: string
  version: string
  category?: string
  tags?: string[]

  // 状态定义
  states: WorkflowState[]
  transitions: WorkflowTransition[]

  // 配置
  settings: WorkflowSettings
  variables: WorkflowVariable[]

  // 元数据
  metadata: Record<string, unknown>
  isActive: boolean
  isTemplate: boolean

  // 审计信息
  createdBy: string
  createdAt: Date
  updatedBy?: string
  updatedAt: Date
  publishedAt?: Date
}

export interface WorkflowState {
  id: string
  name: string
  type: 'start' | 'task' | 'approval' | 'gateway' | 'timer' | 'end'

  // 任务配置
  assigneeType?: 'user' | 'role' | 'group' | 'expression'
  assigneeValue?: string
  assigneeExpression?: string

  // 表单配置
  formSchema?: string // JSON Schema
  formUI?: string // UI Schema

  // 动作配置
  onEnter?: WorkflowAction[]
  onExit?: WorkflowAction[]

  // 超时配置
  timeout?: number
  timeoutAction?: WorkflowAction

  // 位置信息（用于可视化）
  position?: { x: number; y: number }

  // 元数据
  metadata?: Record<string, unknown>
}

export interface WorkflowTransition {
  id: string
  name?: string
  from: string
  to: string

  // 触发条件
  trigger: 'auto' | 'user' | 'api' | 'timer' | 'event'
  condition?: string // JavaScript 表达式

  // 权限控制
  requiredRole?: string
  requiredPermission?: string

  // 动作配置
  actions?: WorkflowAction[]

  // 元数据
  metadata?: Record<string, unknown>
}
```

#### WorkflowInstance 工作流实例
```typescript
export interface WorkflowInstance {
  id: string
  definitionId: string
  definitionVersion: string

  // 状态信息
  currentState: string
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'

  // 数据
  data: Record<string, unknown>
  context: Record<string, unknown>
  variables: Record<string, unknown>

  // 执行信息
  startedBy: string
  startedAt: Date
  completedAt?: Date
  pausedAt?: Date

  // 错误信息
  error?: WorkflowError

  // 统计信息
  metrics: WorkflowInstanceMetrics

  // 元数据
  metadata?: Record<string, unknown>
}

export interface WorkflowTask {
  id: string
  instanceId: string
  stateId: string

  // 任务信息
  name: string
  description?: string
  type: 'approval' | 'form' | 'review' | 'custom'

  // 分配信息
  assigneeType: 'user' | 'role' | 'group'
  assigneeId: string
  assigneeName: string

  // 状态
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'delegated'
  priority: 'low' | 'normal' | 'high' | 'urgent'

  // 表单数据
  formSchema?: string
  formData?: Record<string, unknown>

  // 时间信息
  createdAt: Date
  dueAt?: Date
  startedAt?: Date
  completedAt?: Date

  // 委托信息
  delegatedTo?: string
  delegatedBy?: string
  delegatedAt?: Date

  // 元数据
  metadata?: Record<string, unknown>
}
```

### tRPC 路由定义
```typescript
export const workflowRouter = router({
  // 工作流定义管理
  definition: router({
    create: protectedProcedure
      .input(WorkflowDefinitionInputSchema)
      .mutation(async ({ input, ctx }) => {
        return await ctx.workflowEngine.createDefinition(input)
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
        updates: WorkflowDefinitionInputSchema.partial()
      }))
      .mutation(async ({ input, ctx }) => {
        return await ctx.workflowEngine.updateDefinition(input.id, input.updates)
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        await ctx.workflowEngine.deleteDefinition(input.id)
      }),

    get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        return await ctx.workflowEngine.getDefinition(input.id)
      }),

    list: protectedProcedure
      .input(WorkflowDefinitionFilterSchema.optional())
      .query(async ({ input, ctx }) => {
        return await ctx.workflowEngine.listDefinitions(input)
      }),

    publish: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        return await ctx.workflowEngine.publishDefinition(input.id)
      })
  }),

  // 工作流实例管理
  instance: router({
    create: protectedProcedure
      .input(z.object({
        definitionId: z.string().uuid(),
        data: z.record(z.unknown()),
        title: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        return await ctx.workflowEngine.createInstance(
          input.definitionId,
          input.data,
          ctx.user.id
        )
      }),

    get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        return await ctx.workflowEngine.getInstance(input.id)
      }),

    list: protectedProcedure
      .input(WorkflowInstanceFilterSchema.optional())
      .query(async ({ input, ctx }) => {
        return await ctx.workflowEngine.listInstances(input)
      }),

    transition: protectedProcedure
      .input(z.object({
        instanceId: z.string().uuid(),
        action: z.string(),
        data: z.record(z.unknown()).optional()
      }))
      .mutation(async ({ input, ctx }) => {
        return await ctx.workflowEngine.transition(
          input.instanceId,
          input.action,
          input.data,
          ctx.user.id
        )
      }),

    pause: protectedProcedure
      .input(z.object({
        instanceId: z.string().uuid(),
        reason: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        return await ctx.workflowEngine.pauseInstance(input.instanceId, input.reason)
      }),

    resume: protectedProcedure
      .input(z.object({ instanceId: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        return await ctx.workflowEngine.resumeInstance(input.instanceId)
      }),

    cancel: protectedProcedure
      .input(z.object({
        instanceId: z.string().uuid(),
        reason: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        return await ctx.workflowEngine.cancelInstance(input.instanceId, input.reason)
      }),

    history: protectedProcedure
      .input(z.object({ instanceId: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        return await ctx.workflowEngine.getInstanceHistory(input.instanceId)
      })
  }),

  // 任务管理
  task: router({
    list: protectedProcedure
      .input(TaskFilterSchema.optional())
      .query(async ({ input, ctx }) => {
        return await ctx.workflowEngine.getUserTasks(ctx.user.id, input)
      }),

    complete: protectedProcedure
      .input(z.object({
        taskId: z.string().uuid(),
        data: z.record(z.unknown())
      }))
      .mutation(async ({ input, ctx }) => {
        return await ctx.workflowEngine.completeTask(
          input.taskId,
          input.data,
          ctx.user.id
        )
      }),

    delegate: protectedProcedure
      .input(z.object({
        taskId: z.string().uuid(),
        toUserId: z.string().uuid()
      }))
      .mutation(async ({ input, ctx }) => {
        return await ctx.workflowEngine.delegateTask(
          input.taskId,
          input.toUserId,
          ctx.user.id
        )
      })
  }),

  // AI 集成
  ai: router({
    generateFromDescription: protectedProcedure
      .input(z.object({
        description: z.string(),
        context: z.record(z.unknown()).optional()
      }))
      .mutation(async ({ input, ctx }) => {
        return await ctx.aiWorkflowGenerator.generateFromDescription(
          input.description,
          input.context
        )
      }),

    optimizeWorkflow: protectedProcedure
      .input(z.object({
        definitionId: z.string().uuid(),
        feedback: z.string()
      }))
      .mutation(async ({ input, ctx }) => {
        const definition = await ctx.workflowEngine.getDefinition(input.definitionId)
        if (!definition) throw new Error('Workflow definition not found')

        return await ctx.aiWorkflowGenerator.optimizeWorkflow(definition, input.feedback)
      })
  })
})
```

---

## 🔧 实现细节

### 状态机引擎实现

#### 核心状态机类
```typescript
export class WorkflowStateMachine {
  private definition: WorkflowDefinition
  private instance: WorkflowInstance
  private eventBus: EventBus
  private logger: Logger

  constructor(
    definition: WorkflowDefinition,
    instance: WorkflowInstance,
    eventBus: EventBus,
    logger: Logger
  ) {
    this.definition = definition
    this.instance = instance
    this.eventBus = eventBus
    this.logger = logger
  }

  /**
   * 执行状态转换
   */
  async transition(action: string, data?: Record<string, unknown>, userId?: string): Promise<void> {
    const currentState = this.getCurrentState()
    const availableTransitions = this.getAvailableTransitions(currentState.id)

    const transition = availableTransitions.find(t => t.name === action)
    if (!transition) {
      throw new WorkflowError(`Invalid action: ${action}`, 'INVALID_ACTION')
    }

    // 检查权限
    if (userId && !await this.checkTransitionPermission(transition, userId)) {
      throw new WorkflowError('Insufficient permissions', 'PERMISSION_DENIED')
    }

    // 评估条件
    if (transition.condition && !await this.evaluateCondition(transition.condition, data)) {
      throw new WorkflowError('Transition condition not met', 'CONDITION_NOT_MET')
    }

    // 执行状态退出动作
    await this.executeStateActions(currentState.onExit, 'exit', data)

    // 更新实例状态
    const targetState = this.getState(transition.to)
    this.instance.currentState = targetState.id
    this.instance.data = { ...this.instance.data, ...data }
    this.instance.updatedAt = new Date()

    // 记录日志
    await this.logTransition(transition, currentState, targetState, userId, data)

    // 执行转换动作
    await this.executeTransitionActions(transition.actions, data)

    // 执行状态进入动作
    await this.executeStateActions(targetState.onEnter, 'enter', data)

    // 发送事件
    await this.emitStateChangeEvent(currentState, targetState, data)

    // 检查是否需要自动转换
    await this.checkAutoTransitions(targetState)

    // 检查是否完成
    if (targetState.type === 'end') {
      await this.completeInstance()
    }
  }

  /**
   * 获取可用的转换动作
   */
  getAvailableTransitions(stateId: string): WorkflowTransition[] {
    return this.definition.transitions.filter(t => t.from === stateId)
  }

  /**
   * 评估条件表达式
   */
  private async evaluateCondition(
    condition: string,
    data?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const context = {
        ...this.instance.data,
        ...this.instance.context,
        ...data,
        // 内置函数
        hasRole: (role: string) => this.hasRole(role),
        hasPermission: (permission: string) => this.hasPermission(permission),
        now: () => new Date(),
        daysBetween: (date1: Date, date2: Date) => Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)
      }

      // 使用安全的表达式评估器
      const result = await this.expressionEvaluator.evaluate(condition, context)
      return Boolean(result)
    } catch (error) {
      this.logger.error('Condition evaluation failed', { condition, error })
      return false
    }
  }

  /**
   * 执行状态动作
   */
  private async executeStateActions(
    actions: WorkflowAction[] | undefined,
    phase: 'enter' | 'exit',
    data?: Record<string, unknown>
  ): Promise<void> {
    if (!actions || actions.length === 0) return

    for (const action of actions) {
      try {
        await this.executeAction(action, data)
      } catch (error) {
        this.logger.error(`Action execution failed in ${phase} phase`, {
          action: action.type,
          error
        })

        if (action.required !== false) {
          throw new WorkflowError(
            `Required action failed: ${action.type}`,
            'ACTION_EXECUTION_FAILED',
            error
          )
        }
      }
    }
  }

  /**
   * 执行具体动作
   */
  private async executeAction(action: WorkflowAction, data?: Record<string, unknown>): Promise<void> {
    const context = {
      instance: this.instance,
      definition: this.definition,
      data,
      eventBus: this.eventBus
    }

    switch (action.type) {
      case 'notification':
        await this.sendNotification(action.config, context)
        break

      case 'email':
        await this.sendEmail(action.config, context)
        break

      case 'webhook':
        await this.callWebhook(action.config, context)
        break

      case 'script':
        await this.executeScript(action.config, context)
        break

      case 'assignment':
        await this.assignTask(action.config, context)
        break

      case 'data_update':
        await this.updateData(action.config, context)
        break

      default:
        // 尝试执行自定义动作
        await this.executeCustomAction(action, context)
    }
  }

  /**
   * 检查自动转换
   */
  private async checkAutoTransitions(state: WorkflowState): Promise<void> {
    const autoTransitions = this.getAvailableTransitions(state.id)
      .filter(t => t.trigger === 'auto')

    for (const transition of autoTransitions) {
      if (!transition.condition || await this.evaluateCondition(transition.condition)) {
        await this.transition(transition.name || 'auto')
        break // 只执行第一个满足条件的自动转换
      }
    }
  }
}
```

#### 工作流引擎实现
```typescript
export class WorkflowEngineImpl implements WorkflowEngine {
  private db: PrismaClient
  private eventBus: EventBus
  private aiProvider: AIProvider
  private logger: Logger
  private cache: Cache

  constructor(dependencies: WorkflowEngineDependencies) {
    this.db = dependencies.db
    this.eventBus = dependencies.eventBus
    this.aiProvider = dependencies.aiProvider
    this.logger = dependencies.logger
    this.cache = dependencies.cache
  }

  async createInstance(
    definitionId: string,
    data: Record<string, unknown>,
    startedBy: string
  ): Promise<WorkflowInstance> {
    const definition = await this.getDefinition(definitionId)
    if (!definition) {
      throw new WorkflowError('Workflow definition not found', 'DEFINITION_NOT_FOUND')
    }

    if (!definition.isActive) {
      throw new WorkflowError('Workflow definition is not active', 'DEFINITION_INACTIVE')
    }

    // 查找开始状态
    const startState = definition.states.find(s => s.type === 'start')
    if (!startState) {
      throw new WorkflowError('No start state found', 'NO_START_STATE')
    }

    // 验证输入数据
    if (definition.settings.inputSchema) {
      const schema = JSON.parse(definition.settings.inputSchema)
      const validation = await this.validateData(data, schema)
      if (!validation.success) {
        throw new WorkflowError('Invalid input data', 'INVALID_INPUT', validation.errors)
      }
    }

    // 创建实例
    const instance = await this.db.workflowInstance.create({
      data: {
        id: generateUUID(),
        definitionId,
        definitionVersion: definition.version,
        currentState: startState.id,
        status: 'running',
        data: data as any,
        context: {},
        variables: {},
        startedBy,
        startedAt: new Date(),
        metrics: {
          stepsCompleted: 0,
          totalSteps: definition.states.length,
          executionTime: 0
        }
      }
    })

    // 创建状态机并执行初始化
    const stateMachine = new WorkflowStateMachine(
      definition,
      instance,
      this.eventBus,
      this.logger
    )

    // 执行开始状态的进入动作
    await stateMachine.executeStateActions(startState.onEnter, 'enter', data)

    // 检查自动转换
    await stateMachine.checkAutoTransitions(startState)

    // 发送实例创建事件
    await this.eventBus.emit('workflow.instance.created', {
      instanceId: instance.id,
      definitionId,
      startedBy,
      data
    })

    return instance
  }

  async transition(
    instanceId: string,
    action: string,
    data?: Record<string, unknown>,
    userId?: string
  ): Promise<WorkflowInstance> {
    const instance = await this.getInstance(instanceId)
    if (!instance) {
      throw new WorkflowError('Workflow instance not found', 'INSTANCE_NOT_FOUND')
    }

    if (instance.status !== 'running') {
      throw new WorkflowError(
        `Cannot transition instance in status: ${instance.status}`,
        'INVALID_STATUS'
      )
    }

    const definition = await this.getDefinition(instance.definitionId)
    if (!definition) {
      throw new WorkflowError('Workflow definition not found', 'DEFINITION_NOT_FOUND')
    }

    // 创建状态机并执行转换
    const stateMachine = new WorkflowStateMachine(
      definition,
      instance,
      this.eventBus,
      this.logger
    )

    await stateMachine.transition(action, data, userId)

    // 更新数据库
    const updatedInstance = await this.db.workflowInstance.update({
      where: { id: instanceId },
      data: {
        currentState: instance.currentState,
        status: instance.status,
        data: instance.data as any,
        context: instance.context as any,
        variables: instance.variables as any,
        updatedAt: new Date(),
        completedAt: instance.status === 'completed' ? new Date() : undefined
      }
    })

    // 清除缓存
    await this.cache.delete(`workflow:instance:${instanceId}`)

    return updatedInstance
  }

  async getUserTasks(userId: string, filter?: TaskFilter): Promise<WorkflowTask[]> {
    const where: any = {
      OR: [
        { assigneeType: 'user', assigneeId: userId },
        {
          assigneeType: 'role',
          assigneeId: { in: await this.getUserRoles(userId) }
        },
        {
          assigneeType: 'group',
          assigneeId: { in: await this.getUserGroups(userId) }
        }
      ],
      status: { in: ['pending', 'in_progress'] }
    }

    if (filter?.status) {
      where.status = filter.status
    }

    if (filter?.priority) {
      where.priority = filter.priority
    }

    if (filter?.dueDate) {
      where.dueAt = { lte: filter.dueDate }
    }

    const tasks = await this.db.workflowTask.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      take: filter?.limit || 50,
      skip: filter?.offset || 0
    })

    return tasks
  }

  async completeTask(
    taskId: string,
    data: Record<string, unknown>,
    userId: string
  ): Promise<WorkflowTask> {
    const task = await this.db.workflowTask.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      throw new WorkflowError('Task not found', 'TASK_NOT_FOUND')
    }

    if (task.status !== 'pending' && task.status !== 'in_progress') {
      throw new WorkflowError('Task is not in a completable state', 'TASK_NOT_COMPLETABLE')
    }

    // 检查权限
    if (!await this.canUserCompleteTask(task, userId)) {
      throw new WorkflowError('User cannot complete this task', 'PERMISSION_DENIED')
    }

    // 验证表单数据
    if (task.formSchema) {
      const schema = JSON.parse(task.formSchema)
      const validation = await this.validateData(data, schema)
      if (!validation.success) {
        throw new WorkflowError('Invalid form data', 'INVALID_FORM_DATA', validation.errors)
      }
    }

    // 更新任务状态
    const updatedTask = await this.db.workflowTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        formData: data as any,
        completedAt: new Date()
      }
    })

    // 执行工作流转换
    await this.transition(task.instanceId, 'complete', data, userId)

    return updatedTask
  }
}
```

### 数据库模型设计

#### Prisma Schema 定义
```prisma
model WorkflowDefinition {
  id          String   @id @default(uuid())
  name        String
  description String?
  version     String   @default("1.0.0")
  category    String?
  tags        String[]

  // 状态和转换定义 (JSON)
  states      Json
  transitions Json

  // 配置
  settings    Json     @default("{}")
  variables   Json     @default("[]")

  // 元数据
  metadata    Json     @default("{}")
  isActive    Boolean  @default(true)
  isTemplate  Boolean  @default(false)

  // 审计信息
  createdBy   String
  createdAt   DateTime @default(now())
  updatedBy   String?
  updatedAt   DateTime @updatedAt
  publishedAt DateTime?

  // 关联
  instances   WorkflowInstance[]

  @@map("workflow_definitions")
}

model WorkflowInstance {
  id                String   @id @default(uuid())
  definitionId      String
  definitionVersion String

  // 状态信息
  currentState      String
  status            WorkflowInstanceStatus @default(RUNNING)

  // 数据
  data              Json     @default("{}")
  context           Json     @default("{}")
  variables         Json     @default("{}")

  // 执行信息
  startedBy         String
  startedAt         DateTime @default(now())
  completedAt       DateTime?
  pausedAt          DateTime?

  // 错误信息
  error             Json?

  // 统计信息
  metrics           Json     @default("{}")

  // 元数据
  metadata          Json     @default("{}")

  // 关联
  definition        WorkflowDefinition @relation(fields: [definitionId], references: [id])
  tasks             WorkflowTask[]
  logs              WorkflowLog[]

  @@map("workflow_instances")
}

model WorkflowTask {
  id          String   @id @default(uuid())
  instanceId  String
  stateId     String

  // 任务信息
  name        String
  description String?
  type        WorkflowTaskType @default(APPROVAL)

  // 分配信息
  assigneeType String
  assigneeId   String
  assigneeName String

  // 状态
  status      WorkflowTaskStatus @default(PENDING)
  priority    WorkflowTaskPriority @default(NORMAL)

  // 表单数据
  formSchema  String?
  formData    Json?

  // 时间信息
  createdAt   DateTime @default(now())
  dueAt       DateTime?
  startedAt   DateTime?
  completedAt DateTime?

  // 委托信息
  delegatedTo String?
  delegatedBy String?
  delegatedAt DateTime?

  // 元数据
  metadata    Json     @default("{}")

  // 关联
  instance    WorkflowInstance @relation(fields: [instanceId], references: [id])

  @@map("workflow_tasks")
}

model WorkflowLog {
  id         String   @id @default(uuid())
  instanceId String

  // 日志信息
  type       WorkflowLogType
  action     String
  fromState  String?
  toState    String?

  // 执行信息
  userId     String?
  userName   String?
  data       Json?

  // 时间信息
  timestamp  DateTime @default(now())
  duration   Int?     // 执行时间(毫秒)

  // 错误信息
  error      Json?

  // 元数据
  metadata   Json     @default("{}")

  // 关联
  instance   WorkflowInstance @relation(fields: [instanceId], references: [id])

  @@map("workflow_logs")
}

enum WorkflowInstanceStatus {
  RUNNING
  PAUSED
  COMPLETED
  FAILED
  CANCELLED
}

enum WorkflowTaskType {
  APPROVAL
  FORM
  REVIEW
  CUSTOM
}

enum WorkflowTaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
  DELEGATED
}

enum WorkflowTaskPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum WorkflowLogType {
  STATE_ENTER
  STATE_EXIT
  TRANSITION
  ACTION_EXECUTE
  ERROR
  SYSTEM
}
```

### 事件系统实现

#### 事件总线
```typescript
export class WorkflowEventBus extends EventEmitter {
  private redis?: Redis
  private logger: Logger

  constructor(config: EventBusConfig, logger: Logger) {
    super()
    this.logger = logger

    if (config.type === 'redis') {
      this.redis = new Redis(config.redis)
      this.setupRedisSubscription()
    }
  }

  async emit(event: string, data: any): Promise<void> {
    // 本地事件
    super.emit(event, data)

    // Redis 事件 (如果配置了)
    if (this.redis) {
      await this.redis.publish(`workflow:${event}`, JSON.stringify(data))
    }

    this.logger.debug('Workflow event emitted', { event, data })
  }

  private setupRedisSubscription(): void {
    if (!this.redis) return

    const subscriber = this.redis.duplicate()
    subscriber.psubscribe('workflow:*')

    subscriber.on('pmessage', (pattern, channel, message) => {
      try {
        const event = channel.replace('workflow:', '')
        const data = JSON.parse(message)
        super.emit(event, data)
      } catch (error) {
        this.logger.error('Failed to process Redis workflow event', { error, channel, message })
      }
    })
  }
}
```

#### 事件处理器
```typescript
export class WorkflowEventHandlers {
  constructor(
    private notificationService: NotificationService,
    private emailService: EmailService,
    private webhookService: WebhookService,
    private logger: Logger
  ) {}

  @EventHandler('workflow.instance.created')
  async onInstanceCreated(data: { instanceId: string; definitionId: string; startedBy: string }) {
    this.logger.info('Workflow instance created', data)

    // 发送通知
    await this.notificationService.send({
      type: 'workflow_started',
      userId: data.startedBy,
      data: {
        instanceId: data.instanceId,
        definitionId: data.definitionId
      }
    })
  }

  @EventHandler('workflow.instance.completed')
  async onInstanceCompleted(data: { instanceId: string; completedBy: string; result: any }) {
    this.logger.info('Workflow instance completed', data)

    // 发送完成通知
    await this.notificationService.send({
      type: 'workflow_completed',
      userId: data.completedBy,
      data: {
        instanceId: data.instanceId,
        result: data.result
      }
    })
  }

  @EventHandler('workflow.task.assigned')
  async onTaskAssigned(data: { taskId: string; assigneeId: string; instanceId: string }) {
    this.logger.info('Workflow task assigned', data)

    // 发送任务分配通知
    await this.notificationService.send({
      type: 'task_assigned',
      userId: data.assigneeId,
      data: {
        taskId: data.taskId,
        instanceId: data.instanceId
      }
    })
  }

  @EventHandler('workflow.task.overdue')
  async onTaskOverdue(data: { taskId: string; assigneeId: string; dueDate: Date }) {
    this.logger.warn('Workflow task overdue', data)

    // 发送逾期提醒
    await this.emailService.send({
      to: data.assigneeId,
      template: 'task_overdue',
      data: {
        taskId: data.taskId,
        dueDate: data.dueDate
      }
    })
  }
}
```

---

## 🔗 集成接口

### 插件系统集成

#### 工作流插件主类
```typescript
export class WorkflowPlugin implements Plugin {
  id = 'workflow'
  name = 'Workflow Engine Plugin'
  version = '1.0.0'
  description = 'Provides workflow and business process management capabilities'

  private engine?: WorkflowEngine
  private eventBus?: WorkflowEventBus
  private aiGenerator?: AIWorkflowGenerator

  async setup(context: PluginContext): Promise<void> {
    // 插件设置阶段
    console.log('Workflow plugin setup')
  }

  async activate(context: PluginContext): Promise<void> {
    // 初始化事件总线
    this.eventBus = new WorkflowEventBus(
      context.getConfig('workflow.eventBus'),
      context.logger
    )

    // 初始化 AI 生成器
    if (context.getConfig('workflow.ai.enabled')) {
      this.aiGenerator = new AIWorkflowGenerator(
        context.getService('ai'),
        context.logger
      )
    }

    // 初始化工作流引擎
    this.engine = new WorkflowEngineImpl({
      db: context.getService('db'),
      eventBus: this.eventBus,
      aiProvider: context.getService('ai'),
      logger: context.logger,
      cache: context.getService('cache')
    })

    // 注册服务
    context.registerService('workflow', this.engine)
    context.registerService('workflowEventBus', this.eventBus)
    if (this.aiGenerator) {
      context.registerService('aiWorkflowGenerator', this.aiGenerator)
    }

    // 注册钩子
    context.hooks.register('workflow:before-transition', this.beforeTransition.bind(this))
    context.hooks.register('workflow:after-transition', this.afterTransition.bind(this))
    context.hooks.register('workflow:instance-created', this.onInstanceCreated.bind(this))
    context.hooks.register('workflow:instance-completed', this.onInstanceCompleted.bind(this))

    // 注册 CLI 命令
    if (context.getService('cli')) {
      this.registerCLICommands(context.getService('cli'))
    }

    // 注册 tRPC 路由
    if (context.getService('trpc')) {
      context.getService('trpc').addRouter('workflow', workflowRouter)
    }

    // 启动定时任务
    await this.startScheduledTasks(context)
  }

  async deactivate(context: PluginContext): Promise<void> {
    // 清理钩子注册
    context.hooks.unregister('workflow:before-transition', this.beforeTransition)
    context.hooks.unregister('workflow:after-transition', this.afterTransition)
    context.hooks.unregister('workflow:instance-created', this.onInstanceCreated)
    context.hooks.unregister('workflow:instance-completed', this.onInstanceCompleted)

    // 停止定时任务
    await this.stopScheduledTasks()
  }

  async teardown(context: PluginContext): Promise<void> {
    // 清理资源
    if (this.eventBus) {
      await this.eventBus.close()
    }
  }

  private async beforeTransition(context: any): Promise<void> {
    // 转换前钩子
    context.logger.debug('Before workflow transition', {
      instanceId: context.instanceId,
      action: context.action
    })
  }

  private async afterTransition(context: any): Promise<void> {
    // 转换后钩子
    context.logger.debug('After workflow transition', {
      instanceId: context.instanceId,
      action: context.action,
      newState: context.newState
    })
  }

  private async onInstanceCreated(context: any): Promise<void> {
    // 实例创建钩子
    await this.eventBus?.emit('workflow.instance.created', context)
  }

  private async onInstanceCompleted(context: any): Promise<void> {
    // 实例完成钩子
    await this.eventBus?.emit('workflow.instance.completed', context)
  }

  private registerCLICommands(cli: CLIService): void {
    cli.addCommand({
      name: 'workflow:create',
      description: 'Create a new workflow definition',
      options: [
        { name: 'file', description: 'Workflow definition file (YAML/JSON)', required: true },
        { name: 'validate', description: 'Validate only, do not create', type: 'boolean' }
      ],
      handler: async (options) => {
        const definition = await this.loadWorkflowDefinition(options.file)

        if (options.validate) {
          const validation = await this.validateWorkflowDefinition(definition)
          console.log(validation.success ? 'Valid' : 'Invalid', validation.errors)
        } else {
          const created = await this.engine!.createDefinition(definition)
          console.log(`Workflow created: ${created.id}`)
        }
      }
    })

    cli.addCommand({
      name: 'workflow:list',
      description: 'List workflow definitions',
      options: [
        { name: 'active', description: 'Show only active workflows', type: 'boolean' },
        { name: 'format', description: 'Output format (table|json)', default: 'table' }
      ],
      handler: async (options) => {
        const definitions = await this.engine!.listDefinitions({
          isActive: options.active
        })

        if (options.format === 'json') {
          console.log(JSON.stringify(definitions, null, 2))
        } else {
          console.table(definitions.map(d => ({
            ID: d.id,
            Name: d.name,
            Version: d.version,
            Active: d.isActive,
            Created: d.createdAt.toISOString()
          })))
        }
      }
    })

    cli.addCommand({
      name: 'workflow:start',
      description: 'Start a workflow instance',
      options: [
        { name: 'definition', description: 'Workflow definition ID', required: true },
        { name: 'data', description: 'Initial data (JSON string)', required: true },
        { name: 'user', description: 'User ID who starts the workflow', required: true }
      ],
      handler: async (options) => {
        const data = JSON.parse(options.data)
        const instance = await this.engine!.createInstance(
          options.definition,
          data,
          options.user
        )
        console.log(`Workflow instance started: ${instance.id}`)
      }
    })
  }

  private async startScheduledTasks(context: PluginContext): Promise<void> {
    // 启动定时任务：检查超时任务
    setInterval(async () => {
      await this.checkTimeoutTasks()
    }, 60000) // 每分钟检查一次

    // 启动定时任务：清理完成的实例
    setInterval(async () => {
      await this.cleanupCompletedInstances()
    }, 3600000) // 每小时清理一次
  }

  private async checkTimeoutTasks(): Promise<void> {
    // 检查超时任务的实现
    const timeoutTasks = await this.engine!.getTimeoutTasks()

    for (const task of timeoutTasks) {
      await this.eventBus?.emit('workflow.task.timeout', {
        taskId: task.id,
        instanceId: task.instanceId,
        assigneeId: task.assigneeId
      })
    }
  }

  private async cleanupCompletedInstances(): Promise<void> {
    // 清理完成实例的实现
    const retentionDays = 30 // 保留30天
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

    await this.engine!.cleanupInstances({
      status: ['completed', 'cancelled'],
      completedBefore: cutoffDate
    })
  }
}
```

### 与其他包的集成

#### 与 Auth 包集成
```typescript
export class WorkflowAuthIntegration {
  constructor(
    private authService: AuthService,
    private permissionService: PermissionService
  ) {}

  /**
   * 检查用户是否可以启动工作流
   */
  async canStartWorkflow(userId: string, definitionId: string): Promise<boolean> {
    const user = await this.authService.getUser(userId)
    if (!user) return false

    // 检查基本权限
    if (!await this.permissionService.hasPermission(userId, 'workflow:start')) {
      return false
    }

    // 检查特定工作流权限
    return await this.permissionService.hasPermission(
      userId,
      `workflow:start:${definitionId}`
    )
  }

  /**
   * 检查用户是否可以执行转换
   */
  async canExecuteTransition(
    userId: string,
    instanceId: string,
    transition: WorkflowTransition
  ): Promise<boolean> {
    // 检查基本权限
    if (!await this.permissionService.hasPermission(userId, 'workflow:execute')) {
      return false
    }

    // 检查角色权限
    if (transition.requiredRole) {
      const hasRole = await this.authService.hasRole(userId, transition.requiredRole)
      if (!hasRole) return false
    }

    // 检查特定权限
    if (transition.requiredPermission) {
      const hasPermission = await this.permissionService.hasPermission(
        userId,
        transition.requiredPermission
      )
      if (!hasPermission) return false
    }

    return true
  }

  /**
   * 获取用户的角色列表
   */
  async getUserRoles(userId: string): Promise<string[]> {
    return await this.authService.getUserRoles(userId)
  }

  /**
   * 获取用户的组列表
   */
  async getUserGroups(userId: string): Promise<string[]> {
    return await this.authService.getUserGroups(userId)
  }
}
```

#### 与 CRUD 包集成
```typescript
export class WorkflowCRUDIntegration {
  constructor(
    private crudService: CRUDService,
    private schemaService: SchemaService
  ) {}

  /**
   * 基于实体操作触发工作流
   */
  async triggerWorkflowOnEntityChange(
    entity: string,
    operation: 'create' | 'update' | 'delete',
    data: Record<string, unknown>,
    userId: string
  ): Promise<void> {
    // 查找相关的工作流定义
    const triggers = await this.findWorkflowTriggers(entity, operation)

    for (const trigger of triggers) {
      // 检查触发条件
      if (await this.evaluateTriggerCondition(trigger, data)) {
        // 启动工作流
        await this.startWorkflow(trigger.definitionId, {
          entity,
          operation,
          data,
          triggeredBy: userId
        }, userId)
      }
    }
  }

  /**
   * 在工作流中执行 CRUD 操作
   */
  async executeCRUDAction(
    action: WorkflowCRUDAction,
    context: WorkflowActionContext
  ): Promise<any> {
    const { entity, operation, data } = action.config

    switch (operation) {
      case 'create':
        return await this.crudService.create(entity, data, context.userId)

      case 'update':
        return await this.crudService.update(entity, data.id, data, context.userId)

      case 'delete':
        return await this.crudService.delete(entity, data.id, context.userId)

      case 'query':
        return await this.crudService.findMany(entity, data.filter, context.userId)

      default:
        throw new Error(`Unsupported CRUD operation: ${operation}`)
    }
  }

  /**
   * 验证工作流数据与实体 Schema
   */
  async validateWorkflowData(
    entity: string,
    data: Record<string, unknown>
  ): Promise<ValidationResult> {
    const schema = await this.schemaService.getEntitySchema(entity)
    return await this.schemaService.validate(schema, data)
  }
}
```

#### 与 UI 包集成
```typescript
export class WorkflowUIIntegration {
  /**
   * 生成工作流表单组件
   */
  generateFormComponent(formSchema: string, formUI?: string): React.ComponentType {
    return function WorkflowForm({ onSubmit, initialData }: WorkflowFormProps) {
      const schema = JSON.parse(formSchema)
      const uiSchema = formUI ? JSON.parse(formUI) : {}

      return (
        <FormBuilder
          schema={schema}
          uiSchema={uiSchema}
          initialData={initialData}
          onSubmit={onSubmit}
        />
      )
    }
  }

  /**
   * 生成工作流实例查看器
   */
  generateInstanceViewer(): React.ComponentType<WorkflowInstanceViewerProps> {
    return function WorkflowInstanceViewer({ instanceId }: WorkflowInstanceViewerProps) {
      const { data: instance } = trpc.workflow.instance.get.useQuery({ id: instanceId })
      const { data: definition } = trpc.workflow.definition.get.useQuery(
        { id: instance?.definitionId || '' },
        { enabled: !!instance }
      )

      if (!instance || !definition) {
        return <div>Loading...</div>
      }

      return (
        <div className="workflow-instance-viewer">
          <WorkflowProgress instance={instance} definition={definition} />
          <WorkflowTimeline instanceId={instanceId} />
          <WorkflowActions instance={instance} definition={definition} />
        </div>
      )
    }
  }

  /**
   * 生成工作流设计器
   */
  generateWorkflowDesigner(): React.ComponentType<WorkflowDesignerProps> {
    return function WorkflowDesigner({
      definition,
      onChange,
      readonly = false
    }: WorkflowDesignerProps) {
      return (
        <ReactFlow
          nodes={convertStatesToNodes(definition.states)}
          edges={convertTransitionsToEdges(definition.transitions)}
          onNodesChange={readonly ? undefined : handleNodesChange}
          onEdgesChange={readonly ? undefined : handleEdgesChange}
          nodeTypes={workflowNodeTypes}
          edgeTypes={workflowEdgeTypes}
        >
          <Controls />
          <MiniMap />
          <Background />
          {!readonly && <WorkflowToolbar />}
        </ReactFlow>
      )
    }
  }
}
```

---

## 🎯 最佳实践

### 工作流设计原则

#### 1. 状态设计最佳实践
```typescript
// ✅ 好的状态设计
const goodStateDesign = {
  states: [
    {
      id: 'draft',
      name: '草稿',
      type: 'start',
      description: '申请创建阶段，可以编辑和修改'
    },
    {
      id: 'pending_approval',
      name: '待审批',
      type: 'approval',
      assigneeType: 'role',
      assigneeValue: 'manager',
      timeout: 86400, // 24小时超时
      description: '等待管理员审批'
    },
    {
      id: 'approved',
      name: '已批准',
      type: 'end',
      description: '申请已通过审批'
    },
    {
      id: 'rejected',
      name: '已拒绝',
      type: 'end',
      description: '申请被拒绝'
    }
  ]
}

// ❌ 避免的状态设计
const badStateDesign = {
  states: [
    {
      id: 'state1', // 不清晰的命名
      name: '状态1',
      type: 'task'
      // 缺少描述和配置
    },
    {
      id: 'waiting', // 过于宽泛的状态
      name: '等待中',
      type: 'approval'
      // 没有指定审批人
    }
  ]
}
```

#### 2. 转换条件最佳实践
```typescript
// ✅ 清晰的条件表达式
const goodConditions = {
  transitions: [
    {
      from: 'draft',
      to: 'pending_approval',
      condition: 'data.amount > 0 && data.reason.length >= 10',
      name: 'submit_for_approval'
    },
    {
      from: 'pending_approval',
      to: 'approved',
      condition: 'data.approved === true && hasRole("manager")',
      name: 'approve'
    },
    {
      from: 'pending_approval',
      to: 'rejected',
      condition: 'data.approved === false',
      name: 'reject'
    }
  ]
}

// ❌ 避免复杂的条件表达式
const badConditions = {
  transitions: [
    {
      from: 'state1',
      to: 'state2',
      condition: `
        (data.type === 'urgent' && data.amount > 10000 &&
         hasRole('senior_manager') && daysBetween(now(), data.createdAt) < 1) ||
        (data.type === 'normal' && data.amount <= 10000 &&
         (hasRole('manager') || hasRole('supervisor')) &&
         data.department === 'finance')
      `, // 过于复杂，难以维护
      name: 'complex_transition'
    }
  ]
}
```

#### 3. 数据管理最佳实践
```typescript
// ✅ 结构化的数据管理
interface WorkflowData {
  // 业务数据
  business: {
    amount: number
    reason: string
    category: string
    urgency: 'low' | 'normal' | 'high' | 'urgent'
  }

  // 审批数据
  approval: {
    approvedBy?: string
    approvedAt?: Date
    comments?: string
    attachments?: string[]
  }

  // 系统数据
  system: {
    source: string
    version: string
    metadata: Record<string, unknown>
  }
}

// ❌ 避免扁平化的数据结构
interface BadWorkflowData {
  amount: number
  reason: string
  category: string
  urgency: string
  approvedBy: string
  approvedAt: Date
  comments: string
  attachments: string[]
  source: string
  version: string
  // ... 所有字段混在一起，难以管理
}
```

### 性能优化策略

#### 1. 数据库查询优化
```typescript
// ✅ 使用索引和分页
export class OptimizedWorkflowQueries {
  async getUserTasks(userId: string, options: TaskQueryOptions = {}): Promise<WorkflowTask[]> {
    const { limit = 20, offset = 0, status, priority } = options

    return await this.db.workflowTask.findMany({
      where: {
        // 使用复合索引 (assigneeId, status, priority, createdAt)
        assigneeId: userId,
        ...(status && { status }),
        ...(priority && { priority })
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      take: limit,
      skip: offset,
      // 只选择必要的字段
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        priority: true,
        createdAt: true,
        dueAt: true,
        instance: {
          select: {
            id: true,
            definition: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })
  }

  // ❌ 避免的查询方式
  async getBadUserTasks(userId: string): Promise<WorkflowTask[]> {
    // 没有分页，可能返回大量数据
    // 没有索引优化
    // 返回所有字段，包括不必要的大字段
    return await this.db.workflowTask.findMany({
      where: {
        OR: [
          { assigneeId: userId },
          { delegatedTo: userId }
        ]
      },
      include: {
        instance: {
          include: {
            definition: true,
            logs: true // 可能包含大量日志数据
          }
        }
      }
    })
  }
}
```

#### 2. 缓存策略
```typescript
export class WorkflowCacheManager {
  private cache: Cache
  private readonly TTL = {
    DEFINITION: 3600, // 1小时
    INSTANCE: 300,    // 5分钟
    USER_TASKS: 60    // 1分钟
  }

  constructor(cache: Cache) {
    this.cache = cache
  }

  async getDefinition(id: string): Promise<WorkflowDefinition | null> {
    const cacheKey = `workflow:definition:${id}`

    // 尝试从缓存获取
    let definition = await this.cache.get<WorkflowDefinition>(cacheKey)

    if (!definition) {
      // 从数据库获取
      definition = await this.db.workflowDefinition.findUnique({
        where: { id }
      })

      if (definition) {
        // 缓存结果
        await this.cache.set(cacheKey, definition, this.TTL.DEFINITION)
      }
    }

    return definition
  }

  async invalidateDefinition(id: string): Promise<void> {
    await this.cache.delete(`workflow:definition:${id}`)

    // 同时清理相关的实例缓存
    const pattern = `workflow:instance:*:definition:${id}`
    await this.cache.deletePattern(pattern)
  }

  async getUserTasks(userId: string, filter?: TaskFilter): Promise<WorkflowTask[]> {
    const cacheKey = `workflow:user_tasks:${userId}:${JSON.stringify(filter)}`

    let tasks = await this.cache.get<WorkflowTask[]>(cacheKey)

    if (!tasks) {
      tasks = await this.fetchUserTasksFromDB(userId, filter)
      await this.cache.set(cacheKey, tasks, this.TTL.USER_TASKS)
    }

    return tasks
  }
}
```

#### 3. 并发控制
```typescript
export class WorkflowConcurrencyManager {
  private locks: Map<string, Promise<any>> = new Map()

  async executeWithLock<T>(
    lockKey: string,
    operation: () => Promise<T>
  ): Promise<T> {
    // 检查是否已有相同的操作在执行
    const existingLock = this.locks.get(lockKey)
    if (existingLock) {
      await existingLock
    }

    // 创建新的锁
    const lockPromise = this.performOperation(operation)
    this.locks.set(lockKey, lockPromise)

    try {
      const result = await lockPromise
      return result
    } finally {
      this.locks.delete(lockKey)
    }
  }

  private async performOperation<T>(operation: () => Promise<T>): Promise<T> {
    return await operation()
  }

  async transitionWithLock(
    instanceId: string,
    action: string,
    data?: Record<string, unknown>,
    userId?: string
  ): Promise<WorkflowInstance> {
    const lockKey = `workflow:transition:${instanceId}`

    return await this.executeWithLock(lockKey, async () => {
      return await this.workflowEngine.transition(instanceId, action, data, userId)
    })
  }
}
```

### 错误处理策略

#### 1. 分层错误处理
```typescript
// 工作流特定错误类型
export class WorkflowError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'WorkflowError'
  }
}

export class WorkflowValidationError extends WorkflowError {
  constructor(message: string, public validationErrors: ValidationError[]) {
    super(message, 'VALIDATION_ERROR', validationErrors)
  }
}

export class WorkflowPermissionError extends WorkflowError {
  constructor(message: string, public requiredPermission: string) {
    super(message, 'PERMISSION_ERROR', { requiredPermission })
  }
}

// 错误处理中间件
export class WorkflowErrorHandler {
  handle(error: Error, context: WorkflowContext): WorkflowErrorResponse {
    if (error instanceof WorkflowValidationError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.validationErrors
        }
      }
    }

    if (error instanceof WorkflowPermissionError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: { requiredPermission: error.requiredPermission }
        }
      }
    }

    // 未知错误
    context.logger.error('Unexpected workflow error', { error, context })
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    }
  }
}
```

#### 2. 重试机制
```typescript
export class WorkflowRetryManager {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoffMultiplier = 2,
      retryableErrors = ['NETWORK_ERROR', 'TIMEOUT_ERROR']
    } = options

    let lastError: Error

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        // 检查是否为可重试的错误
        if (!this.isRetryableError(error, retryableErrors)) {
          throw error
        }

        // 如果是最后一次尝试，抛出错误
        if (attempt === maxAttempts) {
          throw error
        }

        // 等待后重试
        const waitTime = delay * Math.pow(backoffMultiplier, attempt - 1)
        await this.sleep(waitTime)
      }
    }

    throw lastError!
  }

  private isRetryableError(error: any, retryableErrors: string[]): boolean {
    if (error instanceof WorkflowError) {
      return retryableErrors.includes(error.code)
    }
    return false
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

### 监控和日志

#### 1. 性能监控
```typescript
export class WorkflowMetrics {
  private metrics: MetricsCollector

  constructor(metrics: MetricsCollector) {
    this.metrics = metrics
  }

  recordTransitionTime(definitionId: string, fromState: string, toState: string, duration: number): void {
    this.metrics.histogram('workflow_transition_duration', duration, {
      definition_id: definitionId,
      from_state: fromState,
      to_state: toState
    })
  }

  recordInstanceCompletion(definitionId: string, duration: number, success: boolean): void {
    this.metrics.histogram('workflow_instance_duration', duration, {
      definition_id: definitionId,
      success: success.toString()
    })

    this.metrics.counter('workflow_instance_completed', 1, {
      definition_id: definitionId,
      success: success.toString()
    })
  }

  recordTaskAssignment(definitionId: string, stateId: string): void {
    this.metrics.counter('workflow_task_assigned', 1, {
      definition_id: definitionId,
      state_id: stateId
    })
  }

  recordError(definitionId: string, errorCode: string): void {
    this.metrics.counter('workflow_error', 1, {
      definition_id: definitionId,
      error_code: errorCode
    })
  }
}
```

#### 2. 结构化日志
```typescript
export class WorkflowLogger {
  private logger: Logger

  constructor(logger: Logger) {
    this.logger = logger
  }

  logInstanceCreated(instance: WorkflowInstance, definition: WorkflowDefinition): void {
    this.logger.info('Workflow instance created', {
      event: 'workflow.instance.created',
      instanceId: instance.id,
      definitionId: definition.id,
      definitionName: definition.name,
      startedBy: instance.startedBy,
      startedAt: instance.startedAt
    })
  }

  logTransition(
    instance: WorkflowInstance,
    fromState: string,
    toState: string,
    action: string,
    userId?: string,
    duration?: number
  ): void {
    this.logger.info('Workflow transition executed', {
      event: 'workflow.transition.executed',
      instanceId: instance.id,
      definitionId: instance.definitionId,
      fromState,
      toState,
      action,
      userId,
      duration,
      timestamp: new Date().toISOString()
    })
  }

  logError(
    instance: WorkflowInstance,
    error: Error,
    context?: Record<string, unknown>
  ): void {
    this.logger.error('Workflow error occurred', {
      event: 'workflow.error',
      instanceId: instance.id,
      definitionId: instance.definitionId,
      currentState: instance.currentState,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context
    })
  }
}
```

---

## ⚡ 性能考量

### 构建性能指标

#### 包构建性能
- **DTS 构建时间**: < 8 秒
- **包大小**: < 1.2MB (包含 UI 组件)
- **依赖数量**: 15-20 个直接依赖
- **Tree-shaking 支持**: 100% (ESM 模块)

#### 构建优化策略
```typescript
// tsup.config.ts - 工作流包构建配置
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    engine: 'src/core/engine.ts',
    ui: 'src/ui/index.ts',
    ai: 'src/ai/index.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: [
    // LinchKit 内部包
    '@linch-kit/core',
    '@linch-kit/schema',
    '@linch-kit/auth',
    '@linch-kit/crud',
    '@linch-kit/trpc',
    '@linch-kit/ui',

    // React 生态
    'react',
    'react-dom',
    'react-flow-renderer',

    // 数据库和缓存
    '@prisma/client',
    'redis',

    // 工具库
    'zod',
    'lodash'
  ],
  esbuildOptions(options) {
    options.conditions = ['module']
  }
})
```

### 运行时性能指标

#### 核心操作性能目标
| 操作类型 | 性能目标 | 监控指标 | 优化策略 |
|----------|----------|----------|----------|
| **实例创建** | < 100ms | 平均响应时间 | 数据库连接池、缓存预热 |
| **状态转换** | < 50ms | P95 响应时间 | 条件表达式优化、锁机制 |
| **任务查询** | < 200ms | 查询时间 | 索引优化、分页查询 |
| **批量操作** | < 500ms/100个 | 吞吐量 | 批处理、异步处理 |
| **条件评估** | < 10ms | 表达式执行时间 | 表达式缓存、JIT 编译 |

#### 内存使用优化
```typescript
export class WorkflowMemoryManager {
  private instanceCache = new LRUCache<string, WorkflowInstance>({
    max: 1000, // 最多缓存 1000 个实例
    ttl: 300000 // 5 分钟 TTL
  })

  private definitionCache = new LRUCache<string, WorkflowDefinition>({
    max: 100, // 最多缓存 100 个定义
    ttl: 3600000 // 1 小时 TTL
  })

  async getInstanceWithCache(id: string): Promise<WorkflowInstance | null> {
    // 先从缓存获取
    let instance = this.instanceCache.get(id)

    if (!instance) {
      // 从数据库获取，只选择必要字段
      instance = await this.db.workflowInstance.findUnique({
        where: { id },
        select: {
          id: true,
          definitionId: true,
          currentState: true,
          status: true,
          data: true,
          context: true,
          startedBy: true,
          startedAt: true,
          // 不包含大字段如 logs
        }
      })

      if (instance) {
        this.instanceCache.set(id, instance)
      }
    }

    return instance
  }

  clearCache(): void {
    this.instanceCache.clear()
    this.definitionCache.clear()
  }
}
```

#### 数据库性能优化
```sql
-- 工作流相关索引优化
CREATE INDEX CONCURRENTLY idx_workflow_instances_definition_status
ON workflow_instances(definition_id, status);

CREATE INDEX CONCURRENTLY idx_workflow_instances_started_by
ON workflow_instances(started_by, started_at DESC);

CREATE INDEX CONCURRENTLY idx_workflow_tasks_assignee_status
ON workflow_tasks(assignee_id, status, priority DESC, created_at ASC);

CREATE INDEX CONCURRENTLY idx_workflow_tasks_instance_state
ON workflow_tasks(instance_id, state_id);

CREATE INDEX CONCURRENTLY idx_workflow_logs_instance_timestamp
ON workflow_logs(instance_id, timestamp DESC);

-- 分区表优化（针对大量历史数据）
CREATE TABLE workflow_logs_partitioned (
  LIKE workflow_logs INCLUDING ALL
) PARTITION BY RANGE (timestamp);

-- 按月分区
CREATE TABLE workflow_logs_2025_01 PARTITION OF workflow_logs_partitioned
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### 并发性能优化

#### 分布式锁实现
```typescript
export class DistributedWorkflowLock {
  private redis: Redis
  private lockTimeout = 30000 // 30秒超时

  constructor(redis: Redis) {
    this.redis = redis
  }

  async acquireLock(instanceId: string): Promise<string | null> {
    const lockKey = `workflow:lock:${instanceId}`
    const lockValue = `${Date.now()}-${Math.random()}`

    const result = await this.redis.set(
      lockKey,
      lockValue,
      'PX',
      this.lockTimeout,
      'NX'
    )

    return result === 'OK' ? lockValue : null
  }

  async releaseLock(instanceId: string, lockValue: string): Promise<boolean> {
    const lockKey = `workflow:lock:${instanceId}`

    // 使用 Lua 脚本确保原子性
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `

    const result = await this.redis.eval(script, 1, lockKey, lockValue)
    return result === 1
  }

  async withLock<T>(
    instanceId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const lockValue = await this.acquireLock(instanceId)

    if (!lockValue) {
      throw new WorkflowError('Failed to acquire lock', 'LOCK_ACQUISITION_FAILED')
    }

    try {
      return await operation()
    } finally {
      await this.releaseLock(instanceId, lockValue)
    }
  }
}
```

#### 批处理优化
```typescript
export class WorkflowBatchProcessor {
  private batchSize = 100
  private batchTimeout = 5000 // 5秒

  async processBatchTransitions(
    transitions: BatchTransitionRequest[]
  ): Promise<BatchTransitionResult[]> {
    const results: BatchTransitionResult[] = []

    // 按实例分组，避免同一实例的并发问题
    const groupedByInstance = this.groupByInstance(transitions)

    // 并行处理不同实例的转换
    const promises = Object.entries(groupedByInstance).map(
      async ([instanceId, instanceTransitions]) => {
        return await this.processInstanceTransitions(instanceId, instanceTransitions)
      }
    )

    const batchResults = await Promise.allSettled(promises)

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(...result.value)
      } else {
        // 记录失败的批次
        this.logger.error('Batch transition failed', {
          error: result.reason,
          batchIndex: index
        })
      }
    })

    return results
  }

  private async processInstanceTransitions(
    instanceId: string,
    transitions: BatchTransitionRequest[]
  ): Promise<BatchTransitionResult[]> {
    const results: BatchTransitionResult[] = []

    // 对同一实例的转换进行串行处理
    for (const transition of transitions) {
      try {
        const result = await this.workflowEngine.transition(
          instanceId,
          transition.action,
          transition.data,
          transition.userId
        )

        results.push({
          success: true,
          transitionId: transition.id,
          instance: result
        })
      } catch (error) {
        results.push({
          success: false,
          transitionId: transition.id,
          error: error.message
        })
      }
    }

    return results
  }
}
```

### 缓存策略

#### 多层缓存架构
```typescript
export class WorkflowCacheStrategy {
  private l1Cache: Map<string, any> = new Map() // 内存缓存
  private l2Cache: Redis // Redis 缓存
  private l3Cache: Database // 数据库

  constructor(redis: Redis, db: Database) {
    this.l2Cache = redis
    this.l3Cache = db
  }

  async get<T>(key: string): Promise<T | null> {
    // L1: 内存缓存
    if (this.l1Cache.has(key)) {
      return this.l1Cache.get(key)
    }

    // L2: Redis 缓存
    const redisValue = await this.l2Cache.get(key)
    if (redisValue) {
      const parsed = JSON.parse(redisValue)
      this.l1Cache.set(key, parsed)
      return parsed
    }

    // L3: 数据库
    const dbValue = await this.fetchFromDatabase(key)
    if (dbValue) {
      // 写入所有缓存层
      this.l1Cache.set(key, dbValue)
      await this.l2Cache.setex(key, 300, JSON.stringify(dbValue))
      return dbValue
    }

    return null
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    // 写入所有缓存层
    this.l1Cache.set(key, value)
    await this.l2Cache.setex(key, ttl, JSON.stringify(value))
  }

  async invalidate(key: string): Promise<void> {
    // 清除所有缓存层
    this.l1Cache.delete(key)
    await this.l2Cache.del(key)
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // 清除匹配模式的缓存
    const keys = await this.l2Cache.keys(pattern)
    if (keys.length > 0) {
      await this.l2Cache.del(...keys)
    }

    // 清除内存缓存中匹配的键
    for (const key of this.l1Cache.keys()) {
      if (this.matchPattern(key, pattern)) {
        this.l1Cache.delete(key)
      }
    }
  }
}
```

---

## 🧪 测试策略

### 测试覆盖率要求
- **单元测试覆盖率**: > 85%
- **集成测试覆盖率**: > 80%
- **端到端测试覆盖率**: > 70%
- **性能测试覆盖率**: 100% 核心路径

### 单元测试策略

#### 状态机逻辑测试
```typescript
// tests/unit/workflow-engine.test.ts
describe('WorkflowEngine', () => {
  let engine: WorkflowEngine
  let mockDb: jest.Mocked<PrismaClient>
  let mockEventBus: jest.Mocked<EventBus>

  beforeEach(() => {
    mockDb = createMockPrismaClient()
    mockEventBus = createMockEventBus()
    engine = new WorkflowEngineImpl({
      db: mockDb,
      eventBus: mockEventBus,
      logger: createMockLogger(),
      cache: createMockCache()
    })
  })

  describe('createInstance', () => {
    it('should create workflow instance with valid definition', async () => {
      // Arrange
      const definition = createMockWorkflowDefinition()
      const inputData = { amount: 1000, reason: 'Test purchase' }

      mockDb.workflowDefinition.findUnique.mockResolvedValue(definition)
      mockDb.workflowInstance.create.mockResolvedValue(
        createMockWorkflowInstance({ definitionId: definition.id })
      )

      // Act
      const instance = await engine.createInstance(
        definition.id,
        inputData,
        'user123'
      )

      // Assert
      expect(instance).toBeDefined()
      expect(instance.definitionId).toBe(definition.id)
      expect(instance.data).toEqual(inputData)
      expect(instance.startedBy).toBe('user123')
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'workflow.instance.created',
        expect.objectContaining({
          instanceId: instance.id,
          definitionId: definition.id
        })
      )
    })

    it('should throw error for inactive definition', async () => {
      // Arrange
      const definition = createMockWorkflowDefinition({ isActive: false })
      mockDb.workflowDefinition.findUnique.mockResolvedValue(definition)

      // Act & Assert
      await expect(
        engine.createInstance(definition.id, {}, 'user123')
      ).rejects.toThrow('Workflow definition is not active')
    })

    it('should validate input data against schema', async () => {
      // Arrange
      const definition = createMockWorkflowDefinition({
        settings: {
          inputSchema: JSON.stringify({
            type: 'object',
            properties: {
              amount: { type: 'number', minimum: 0 }
            },
            required: ['amount']
          })
        }
      })

      mockDb.workflowDefinition.findUnique.mockResolvedValue(definition)

      // Act & Assert
      await expect(
        engine.createInstance(definition.id, { amount: -100 }, 'user123')
      ).rejects.toThrow('Invalid input data')
    })
  })

  describe('transition', () => {
    it('should execute valid transition', async () => {
      // Arrange
      const definition = createMockWorkflowDefinition()
      const instance = createMockWorkflowInstance({
        definitionId: definition.id,
        currentState: 'draft'
      })

      mockDb.workflowInstance.findUnique.mockResolvedValue(instance)
      mockDb.workflowDefinition.findUnique.mockResolvedValue(definition)
      mockDb.workflowInstance.update.mockResolvedValue({
        ...instance,
        currentState: 'pending_approval'
      })

      // Act
      const result = await engine.transition(
        instance.id,
        'submit',
        { comment: 'Ready for review' },
        'user123'
      )

      // Assert
      expect(result.currentState).toBe('pending_approval')
      expect(mockDb.workflowInstance.update).toHaveBeenCalledWith({
        where: { id: instance.id },
        data: expect.objectContaining({
          currentState: 'pending_approval'
        })
      })
    })

    it('should reject invalid transition', async () => {
      // Arrange
      const instance = createMockWorkflowInstance({ currentState: 'draft' })
      const definition = createMockWorkflowDefinition()

      mockDb.workflowInstance.findUnique.mockResolvedValue(instance)
      mockDb.workflowDefinition.findUnique.mockResolvedValue(definition)

      // Act & Assert
      await expect(
        engine.transition(instance.id, 'invalid_action', {}, 'user123')
      ).rejects.toThrow('Invalid action: invalid_action')
    })
  })

  describe('condition evaluation', () => {
    it('should evaluate simple conditions correctly', async () => {
      // Arrange
      const stateMachine = new WorkflowStateMachine(
        createMockWorkflowDefinition(),
        createMockWorkflowInstance(),
        mockEventBus,
        createMockLogger()
      )

      // Act & Assert
      expect(await stateMachine.evaluateCondition('data.amount > 1000', { amount: 1500 }))
        .toBe(true)
      expect(await stateMachine.evaluateCondition('data.amount > 1000', { amount: 500 }))
        .toBe(false)
    })

    it('should handle complex conditions with functions', async () => {
      // Arrange
      const stateMachine = new WorkflowStateMachine(
        createMockWorkflowDefinition(),
        createMockWorkflowInstance(),
        mockEventBus,
        createMockLogger()
      )

      // Act & Assert
      expect(await stateMachine.evaluateCondition(
        'hasRole("manager") && data.amount < 10000',
        { amount: 5000 }
      )).toBe(true)
    })
  })
})
```

#### AI 集成测试
```typescript
// tests/unit/ai-workflow-generator.test.ts
describe('AIWorkflowGenerator', () => {
  let generator: AIWorkflowGenerator
  let mockAIProvider: jest.Mocked<AIProvider>

  beforeEach(() => {
    mockAIProvider = createMockAIProvider()
    generator = new AIWorkflowGenerator(mockAIProvider, createMockLogger())
  })

  describe('generateFromDescription', () => {
    it('should generate workflow from natural language description', async () => {
      // Arrange
      const description = '创建一个采购审批流程，金额超过1万需要总经理审批'
      const expectedDSL = `
        workflow: 采购审批流程
        states:
          - name: 申请提交
            type: start
          - name: 部门审批
            type: approval
          - name: 总经理审批
            type: approval
          - name: 完成
            type: end
      `

      mockAIProvider.complete.mockResolvedValue(expectedDSL)

      // Act
      const definition = await generator.generateFromDescription(description)

      // Assert
      expect(definition).toBeDefined()
      expect(definition.name).toBe('采购审批流程')
      expect(definition.states).toHaveLength(4)
      expect(definition.states[0].type).toBe('start')
      expect(definition.states[3].type).toBe('end')
    })

    it('should handle AI provider errors gracefully', async () => {
      // Arrange
      mockAIProvider.complete.mockRejectedValue(new Error('AI service unavailable'))

      // Act & Assert
      await expect(
        generator.generateFromDescription('test workflow')
      ).rejects.toThrow('Failed to generate workflow')
    })
  })

  describe('optimizeWorkflow', () => {
    it('should optimize workflow based on feedback', async () => {
      // Arrange
      const originalDefinition = createMockWorkflowDefinition()
      const feedback = '审批流程太复杂，需要简化'
      const optimizedDSL = '...' // 优化后的 DSL

      mockAIProvider.complete.mockResolvedValue(optimizedDSL)

      // Act
      const optimized = await generator.optimizeWorkflow(originalDefinition, feedback)

      // Assert
      expect(optimized).toBeDefined()
      expect(mockAIProvider.complete).toHaveBeenCalledWith(
        expect.stringContaining(feedback)
      )
    })
  })
})
```

### 集成测试策略

#### 端到端工作流测试
```typescript
// tests/integration/workflow-e2e.test.ts
describe('Workflow End-to-End', () => {
  let app: TestApp
  let db: PrismaClient
  let workflowEngine: WorkflowEngine

  beforeAll(async () => {
    app = await createTestApp()
    db = app.get('db')
    workflowEngine = app.get('workflow')
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await db.workflowDefinition.deleteMany()
    await db.workflowInstance.deleteMany()
    await db.workflowTask.deleteMany()
  })

  it('should complete full approval workflow', async () => {
    // Arrange: 创建工作流定义
    const definition = await workflowEngine.createDefinition({
      name: '采购审批流程',
      states: [
        { id: 'draft', name: '草稿', type: 'start' },
        { id: 'pending', name: '待审批', type: 'approval', assigneeType: 'role', assigneeValue: 'manager' },
        { id: 'approved', name: '已批准', type: 'end' }
      ],
      transitions: [
        { from: 'draft', to: 'pending', trigger: 'user', name: 'submit' },
        { from: 'pending', to: 'approved', trigger: 'user', name: 'approve' }
      ]
    })

    // Act 1: 创建实例
    const instance = await workflowEngine.createInstance(
      definition.id,
      { amount: 5000, item: '办公用品' },
      'user1'
    )

    expect(instance.currentState).toBe('draft')

    // Act 2: 提交审批
    const submitted = await workflowEngine.transition(
      instance.id,
      'submit',
      { comment: '请审批' },
      'user1'
    )

    expect(submitted.currentState).toBe('pending')

    // Act 3: 检查任务创建
    const tasks = await workflowEngine.getUserTasks('manager1')
    expect(tasks).toHaveLength(1)
    expect(tasks[0].instanceId).toBe(instance.id)

    // Act 4: 完成审批
    await workflowEngine.completeTask(
      tasks[0].id,
      { approved: true, comment: '同意采购' },
      'manager1'
    )

    // Assert: 检查最终状态
    const finalInstance = await workflowEngine.getInstance(instance.id)
    expect(finalInstance?.currentState).toBe('approved')
    expect(finalInstance?.status).toBe('completed')
  })

  it('should handle parallel approval workflow', async () => {
    // 测试并行审批流程
    const definition = await workflowEngine.createDefinition({
      name: '并行审批流程',
      states: [
        { id: 'start', name: '开始', type: 'start' },
        { id: 'parallel_gateway', name: '并行网关', type: 'gateway' },
        { id: 'hr_approval', name: 'HR审批', type: 'approval', assigneeType: 'role', assigneeValue: 'hr' },
        { id: 'finance_approval', name: '财务审批', type: 'approval', assigneeType: 'role', assigneeValue: 'finance' },
        { id: 'join_gateway', name: '汇聚网关', type: 'gateway' },
        { id: 'end', name: '结束', type: 'end' }
      ],
      transitions: [
        { from: 'start', to: 'parallel_gateway', trigger: 'auto' },
        { from: 'parallel_gateway', to: 'hr_approval', trigger: 'auto' },
        { from: 'parallel_gateway', to: 'finance_approval', trigger: 'auto' },
        { from: 'hr_approval', to: 'join_gateway', trigger: 'user', name: 'hr_approve' },
        { from: 'finance_approval', to: 'join_gateway', trigger: 'user', name: 'finance_approve' },
        { from: 'join_gateway', to: 'end', trigger: 'auto', condition: 'allParallelTasksCompleted()' }
      ]
    })

    // 创建实例并验证并行任务
    const instance = await workflowEngine.createInstance(
      definition.id,
      { type: 'employee_onboarding' },
      'user1'
    )

    // 验证两个并行任务都被创建
    const hrTasks = await workflowEngine.getUserTasks('hr1')
    const financeTasks = await workflowEngine.getUserTasks('finance1')

    expect(hrTasks).toHaveLength(1)
    expect(financeTasks).toHaveLength(1)

    // 完成 HR 审批
    await workflowEngine.completeTask(hrTasks[0].id, { approved: true }, 'hr1')

    // 此时流程应该还在等待财务审批
    let currentInstance = await workflowEngine.getInstance(instance.id)
    expect(currentInstance?.status).toBe('running')

    // 完成财务审批
    await workflowEngine.completeTask(financeTasks[0].id, { approved: true }, 'finance1')

    // 现在流程应该完成
    currentInstance = await workflowEngine.getInstance(instance.id)
    expect(currentInstance?.status).toBe('completed')
  })
})
```

### 性能测试策略

#### 负载测试
```typescript
// tests/performance/workflow-load.test.ts
describe('Workflow Performance Tests', () => {
  let workflowEngine: WorkflowEngine
  let definition: WorkflowDefinition

  beforeAll(async () => {
    // 设置性能测试环境
    workflowEngine = await createPerformanceTestEngine()
    definition = await createSimpleWorkflowDefinition()
  })

  it('should handle concurrent instance creation', async () => {
    const concurrency = 100
    const startTime = Date.now()

    // 并发创建实例
    const promises = Array.from({ length: concurrency }, (_, i) =>
      workflowEngine.createInstance(
        definition.id,
        { testId: i, amount: Math.random() * 10000 },
        `user${i}`
      )
    )

    const instances = await Promise.all(promises)
    const endTime = Date.now()
    const duration = endTime - startTime

    // 性能断言
    expect(instances).toHaveLength(concurrency)
    expect(duration).toBeLessThan(5000) // 5秒内完成
    expect(duration / concurrency).toBeLessThan(100) // 平均每个实例 < 100ms
  })

  it('should handle high-frequency transitions', async () => {
    // 创建多个实例
    const instanceCount = 50
    const instances = await Promise.all(
      Array.from({ length: instanceCount }, (_, i) =>
        workflowEngine.createInstance(
          definition.id,
          { testId: i },
          `user${i}`
        )
      )
    )

    const startTime = Date.now()

    // 并发执行转换
    const transitionPromises = instances.map(instance =>
      workflowEngine.transition(instance.id, 'submit', {}, 'user1')
    )

    await Promise.all(transitionPromises)
    const endTime = Date.now()
    const duration = endTime - startTime

    // 性能断言
    expect(duration).toBeLessThan(3000) // 3秒内完成所有转换
    expect(duration / instanceCount).toBeLessThan(60) // 平均每个转换 < 60ms
  })

  it('should maintain performance with large datasets', async () => {
    // 创建大量历史数据
    await createLargeDataset(10000) // 10k 实例

    const startTime = Date.now()

    // 执行查询操作
    const tasks = await workflowEngine.getUserTasks('user1', {
      limit: 20,
      status: 'pending'
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    // 性能断言
    expect(tasks).toBeDefined()
    expect(duration).toBeLessThan(200) // 查询时间 < 200ms
  })
})
```

#### 内存泄漏测试
```typescript
// tests/performance/memory-leak.test.ts
describe('Memory Leak Tests', () => {
  it('should not leak memory during long-running operations', async () => {
    const initialMemory = process.memoryUsage()

    // 执行大量操作
    for (let i = 0; i < 1000; i++) {
      const instance = await workflowEngine.createInstance(
        definition.id,
        { iteration: i },
        'user1'
      )

      await workflowEngine.transition(instance.id, 'submit', {}, 'user1')

      // 每100次操作检查内存
      if (i % 100 === 0) {
        global.gc?.() // 强制垃圾回收
        const currentMemory = process.memoryUsage()
        const memoryIncrease = currentMemory.heapUsed - initialMemory.heapUsed

        // 内存增长不应超过 50MB
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
      }
    }
  })
})
```

---

## 🤖 AI 集成支持

### AI 驱动的工作流生成

#### 自然语言到工作流 DSL
```typescript
export class AIWorkflowGenerator {
  private aiProvider: AIProvider
  private promptTemplates: WorkflowPromptTemplates
  private dslParser: WorkflowDSLParser

  constructor(
    aiProvider: AIProvider,
    logger: Logger
  ) {
    this.aiProvider = aiProvider
    this.promptTemplates = new WorkflowPromptTemplates()
    this.dslParser = new WorkflowDSLParser()
  }

  /**
   * 从自然语言描述生成工作流
   */
  async generateFromDescription(
    description: string,
    context?: WorkflowGenerationContext
  ): Promise<WorkflowDefinition> {
    // 构建提示词
    const prompt = this.promptTemplates.buildGenerationPrompt(description, context)

    // 调用 AI 生成 DSL
    const response = await this.aiProvider.complete(prompt, {
      temperature: 0.3, // 较低的温度确保一致性
      maxTokens: 2000,
      stopSequences: ['---END---']
    })

    // 解析 DSL 为工作流定义
    const dsl = this.extractDSLFromResponse(response)
    const definition = await this.dslParser.parse(dsl)

    // 验证生成的工作流
    const validation = await this.validateGeneratedWorkflow(definition)
    if (!validation.isValid) {
      throw new WorkflowGenerationError(
        'Generated workflow is invalid',
        validation.errors
      )
    }

    return definition
  }

  /**
   * 优化现有工作流
   */
  async optimizeWorkflow(
    definition: WorkflowDefinition,
    feedback: string,
    metrics?: WorkflowMetrics
  ): Promise<WorkflowDefinition> {
    const prompt = this.promptTemplates.buildOptimizationPrompt(
      definition,
      feedback,
      metrics
    )

    const response = await this.aiProvider.complete(prompt, {
      temperature: 0.2,
      maxTokens: 2000
    })

    const optimizedDSL = this.extractDSLFromResponse(response)
    const optimizedDefinition = await this.dslParser.parse(optimizedDSL)

    // 保留原始元数据
    optimizedDefinition.metadata = {
      ...definition.metadata,
      optimizedFrom: definition.id,
      optimizationFeedback: feedback,
      optimizedAt: new Date().toISOString()
    }

    return optimizedDefinition
  }

  /**
   * 智能建议下一步动作
   */
  async suggestNextActions(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    userContext?: UserContext
  ): Promise<WorkflowActionSuggestion[]> {
    const prompt = this.promptTemplates.buildActionSuggestionPrompt(
      instance,
      definition,
      userContext
    )

    const response = await this.aiProvider.complete(prompt, {
      temperature: 0.4,
      maxTokens: 1000
    })

    return this.parseActionSuggestions(response)
  }

  /**
   * 生成工作流文档
   */
  async generateDocumentation(
    definition: WorkflowDefinition
  ): Promise<WorkflowDocumentation> {
    const prompt = this.promptTemplates.buildDocumentationPrompt(definition)

    const response = await this.aiProvider.complete(prompt, {
      temperature: 0.3,
      maxTokens: 3000
    })

    return this.parseDocumentation(response)
  }
}
```

#### 工作流 DSL 设计
```yaml
# 工作流 DSL 示例
workflow:
  name: "员工入职审批流程"
  description: "新员工入职的完整审批和准备流程"
  version: "1.0.0"
  category: "hr"
  tags: ["onboarding", "approval", "hr"]

variables:
  - name: employee_info
    type: object
    description: "员工基本信息"
    schema:
      type: object
      properties:
        name: { type: string }
        position: { type: string }
        department: { type: string }
        salary: { type: number }
        start_date: { type: string, format: date }

  - name: approval_chain
    type: array
    description: "审批链"
    default: ["hr_manager", "department_head", "ceo"]

states:
  - id: application_submitted
    name: "申请提交"
    type: start
    description: "HR提交新员工入职申请"
    form:
      schema:
        type: object
        properties:
          employee_name: { type: string, title: "员工姓名" }
          position: { type: string, title: "职位" }
          department: { type: string, title: "部门" }
          salary: { type: number, title: "薪资" }
          start_date: { type: string, format: date, title: "入职日期" }
        required: [employee_name, position, department, salary, start_date]

    actions:
      on_enter:
        - type: notification
          config:
            recipients: ["hr_team"]
            template: "new_application_submitted"
            data: "{{ employee_info }}"

  - id: hr_review
    name: "HR初审"
    type: approval
    description: "HR经理审核申请材料"
    assignee:
      type: role
      value: "hr_manager"

    timeout: 86400 # 24小时
    timeout_action:
      type: escalation
      config:
        escalate_to: "hr_director"
        notification: "hr_review_timeout"

    form:
      schema:
        type: object
        properties:
          approved: { type: boolean, title: "是否通过" }
          comments: { type: string, title: "审核意见" }
          salary_adjustment: { type: number, title: "薪资调整" }
        required: [approved]

  - id: department_approval
    name: "部门主管审批"
    type: approval
    description: "用人部门主管审批"
    assignee:
      type: expression
      value: "getDepartmentHead(employee_info.department)"

    condition: "hr_review.approved === true"

    form:
      schema:
        type: object
        properties:
          approved: { type: boolean, title: "是否同意" }
          comments: { type: string, title: "审批意见" }
          mentor_assigned: { type: string, title: "指定导师" }

  - id: ceo_approval
    name: "CEO最终审批"
    type: approval
    description: "高级职位需要CEO审批"
    assignee:
      type: user
      value: "ceo"

    condition: "employee_info.salary > 20000"

    form:
      schema:
        type: object
        properties:
          approved: { type: boolean, title: "最终决定" }
          comments: { type: string, title: "CEO意见" }

  - id: preparation_tasks
    name: "入职准备"
    type: parallel_gateway
    description: "并行执行入职准备任务"

    parallel_tasks:
      - id: it_setup
        name: "IT设备准备"
        assignee:
          type: role
          value: "it_admin"
        form:
          schema:
            type: object
            properties:
              laptop_assigned: { type: string, title: "分配笔记本" }
              accounts_created: { type: boolean, title: "账号已创建" }
              access_granted: { type: array, title: "权限分配" }

      - id: workspace_setup
        name: "工位安排"
        assignee:
          type: role
          value: "admin"
        form:
          schema:
            type: object
            properties:
              desk_number: { type: string, title: "工位号" }
              key_card_issued: { type: boolean, title: "门卡已发放" }

      - id: documentation
        name: "文档准备"
        assignee:
          type: role
          value: "hr_specialist"
        form:
          schema:
            type: object
            properties:
              contract_signed: { type: boolean, title: "合同已签署" }
              handbook_provided: { type: boolean, title: "员工手册已提供" }

  - id: onboarding_complete
    name: "入职完成"
    type: end
    description: "所有入职流程已完成"

    actions:
      on_enter:
        - type: notification
          config:
            recipients: ["{{ employee_info.name }}", "hr_team", "{{ employee_info.department }}_team"]
            template: "onboarding_completed"

        - type: webhook
          config:
            url: "https://api.company.com/employees"
            method: POST
            data: "{{ employee_info }}"

  - id: application_rejected
    name: "申请被拒绝"
    type: end
    description: "申请在某个环节被拒绝"

    actions:
      on_enter:
        - type: notification
          config:
            recipients: ["hr_team"]
            template: "application_rejected"
            data:
              employee_info: "{{ employee_info }}"
              rejection_reason: "{{ rejection_reason }}"

transitions:
  - from: application_submitted
    to: hr_review
    trigger: auto
    name: "提交审核"

  - from: hr_review
    to: department_approval
    trigger: user
    name: "HR通过"
    condition: "hr_review.approved === true"

  - from: hr_review
    to: application_rejected
    trigger: user
    name: "HR拒绝"
    condition: "hr_review.approved === false"

  - from: department_approval
    to: ceo_approval
    trigger: user
    name: "部门通过(高薪)"
    condition: "department_approval.approved === true && employee_info.salary > 20000"

  - from: department_approval
    to: preparation_tasks
    trigger: user
    name: "部门通过(普通)"
    condition: "department_approval.approved === true && employee_info.salary <= 20000"

  - from: department_approval
    to: application_rejected
    trigger: user
    name: "部门拒绝"
    condition: "department_approval.approved === false"

  - from: ceo_approval
    to: preparation_tasks
    trigger: user
    name: "CEO通过"
    condition: "ceo_approval.approved === true"

  - from: ceo_approval
    to: application_rejected
    trigger: user
    name: "CEO拒绝"
    condition: "ceo_approval.approved === false"

  - from: preparation_tasks
    to: onboarding_complete
    trigger: auto
    name: "准备完成"
    condition: "allParallelTasksCompleted()"

settings:
  notifications:
    enabled: true
    channels: ["email", "slack", "in_app"]

  escalation:
    enabled: true
    default_timeout: 86400 # 24小时

  audit:
    enabled: true
    retention_days: 365

  ai_assistance:
    enabled: true
    features: ["smart_routing", "auto_assignment", "progress_prediction"]
```

#### AI 提示词模板
```typescript
export class WorkflowPromptTemplates {
  buildGenerationPrompt(description: string, context?: WorkflowGenerationContext): string {
    return `
你是一个专业的工作流设计专家。请根据以下描述生成一个完整的工作流定义。

用户描述：
${description}

${context ? `
上下文信息：
- 组织类型：${context.organizationType}
- 部门：${context.department}
- 现有角色：${context.availableRoles?.join(', ')}
- 集成系统：${context.integrations?.join(', ')}
` : ''}

请生成一个符合以下要求的工作流 DSL：

1. 包含清晰的状态定义（开始、任务、审批、网关、结束）
2. 定义合理的转换条件和触发器
3. 指定适当的审批人和权限
4. 包含必要的表单字段和验证
5. 设置合理的超时和升级机制
6. 添加适当的通知和动作

输出格式：YAML 格式的工作流 DSL

---START_DSL---
workflow:
  name: "..."
  description: "..."
  # ... 完整的工作流定义
---END_DSL---
`
  }

  buildOptimizationPrompt(
    definition: WorkflowDefinition,
    feedback: string,
    metrics?: WorkflowMetrics
  ): string {
    return `
请优化以下工作流定义，根据用户反馈和性能指标进行改进。

当前工作流：
${JSON.stringify(definition, null, 2)}

用户反馈：
${feedback}

${metrics ? `
性能指标：
- 平均完成时间：${metrics.averageCompletionTime}ms
- 成功率：${metrics.successRate}%
- 瓶颈状态：${metrics.bottleneckStates?.join(', ')}
- 超时频率：${metrics.timeoutFrequency}%
` : ''}

请提供优化建议并生成改进后的工作流定义。重点关注：
1. 简化复杂的流程
2. 减少不必要的审批环节
3. 优化条件表达式
4. 改进用户体验
5. 提高执行效率

输出格式：
1. 优化说明（简要描述改进点）
2. 优化后的工作流 DSL

---START_OPTIMIZATION---
优化说明：
...

---START_DSL---
workflow:
  # 优化后的工作流定义
---END_DSL---
---END_OPTIMIZATION---
`
  }

  buildActionSuggestionPrompt(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    userContext?: UserContext
  ): string {
    return `
基于当前工作流实例状态，为用户提供智能的下一步动作建议。

工作流定义：
${JSON.stringify(definition, null, 2)}

当前实例状态：
- 实例ID：${instance.id}
- 当前状态：${instance.currentState}
- 状态：${instance.status}
- 数据：${JSON.stringify(instance.data)}

${userContext ? `
用户上下文：
- 用户ID：${userContext.userId}
- 角色：${userContext.roles?.join(', ')}
- 权限：${userContext.permissions?.join(', ')}
- 部门：${userContext.department}
` : ''}

请分析当前情况并提供：
1. 可执行的动作列表
2. 每个动作的优先级和建议理由
3. 预期的结果和影响
4. 风险提示（如有）

输出格式：JSON 数组，每个建议包含：
- action: 动作名称
- priority: 优先级 (high/medium/low)
- reason: 建议理由
- expectedOutcome: 预期结果
- risks: 风险提示（可选）

---START_SUGGESTIONS---
[
  {
    "action": "...",
    "priority": "...",
    "reason": "...",
    "expectedOutcome": "...",
    "risks": "..."
  }
]
---END_SUGGESTIONS---
`
  }
}
```

### AI 辅助功能

#### 智能路由
```typescript
export class AIWorkflowRouter {
  async suggestOptimalPath(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    historicalData: WorkflowHistoricalData[]
  ): Promise<WorkflowPathSuggestion> {
    const prompt = `
基于历史数据分析，为当前工作流实例建议最优的执行路径。

当前实例数据：${JSON.stringify(instance.data)}
历史成功案例：${JSON.stringify(historicalData.filter(d => d.successful))}
历史失败案例：${JSON.stringify(historicalData.filter(d => !d.successful))}

请分析并建议：
1. 最可能成功的路径
2. 预计完成时间
3. 潜在风险点
4. 优化建议
`

    const response = await this.aiProvider.complete(prompt)
    return this.parsePathSuggestion(response)
  }
}
```

#### 自动化任务分配
```typescript
export class AITaskAssigner {
  async suggestOptimalAssignee(
    task: WorkflowTask,
    availableUsers: User[],
    workloadData: UserWorkloadData[]
  ): Promise<TaskAssignmentSuggestion> {
    const prompt = `
为以下任务建议最合适的执行人：

任务信息：
- 类型：${task.type}
- 优先级：${task.priority}
- 预计工作量：${task.estimatedEffort}
- 技能要求：${task.requiredSkills?.join(', ')}

可用人员：
${availableUsers.map(u => `
- ${u.name} (${u.id})
  - 角色：${u.roles.join(', ')}
  - 技能：${u.skills.join(', ')}
  - 当前工作量：${workloadData.find(w => w.userId === u.id)?.currentLoad || 0}%
`).join('')}

请基于以下因素建议最佳分配：
1. 技能匹配度
2. 当前工作负载
3. 历史表现
4. 任务优先级
`

    const response = await this.aiProvider.complete(prompt)
    return this.parseAssignmentSuggestion(response)
  }
}
```

#### 进度预测
```typescript
export class AIProgressPredictor {
  async predictCompletionTime(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    historicalData: WorkflowHistoricalData[]
  ): Promise<CompletionPrediction> {
    const prompt = `
基于历史数据预测工作流实例的完成时间。

当前进度：
- 已完成状态：${instance.completedStates?.join(', ')}
- 剩余状态：${instance.remainingStates?.join(', ')}
- 当前数据：${JSON.stringify(instance.data)}

历史数据：
${historicalData.map(d => `
- 实例：${d.instanceId}
- 完成时间：${d.completionTime}ms
- 路径：${d.executionPath.join(' -> ')}
- 数据特征：${JSON.stringify(d.dataFeatures)}
`).join('')}

请预测：
1. 预计完成时间（最快、最慢、平均）
2. 可能的延迟风险
3. 加速建议
`

    const response = await this.aiProvider.complete(prompt)
    return this.parsePrediction(response)
  }
}
```

---

---

## 📋 开发优先级和里程碑

### P0 - 核心基础 (第1-2周)
**目标**: 建立工作流引擎的核心基础设施

#### 核心状态机引擎 (5天)
- ✅ 状态机核心逻辑实现
- ✅ 状态转换和条件评估
- ✅ 事件系统集成
- ✅ 基础错误处理

#### 数据模型和持久化 (3天)
- ✅ Prisma 模型定义
- ✅ 数据库迁移脚本
- ✅ 基础 CRUD 操作
- ✅ 数据验证和约束

#### 插件系统集成 (2天)
- ✅ 插件接口实现
- ✅ 生命周期钩子
- ✅ 服务注册和依赖注入

### P1 - 核心功能 (第3-4周)
**目标**: 实现完整的工作流管理功能

#### tRPC API 层 (4天)
- ✅ 工作流定义管理 API
- ✅ 实例管理 API
- ✅ 任务管理 API
- ✅ 权限中间件集成

#### 权限和安全 (3天)
- ✅ 与 Auth 包集成
- ✅ 角色权限检查
- ✅ 操作审计日志
- ✅ 安全策略实施

#### 基础 UI 组件 (5天)
- ✅ 工作流实例查看器
- ✅ 任务列表组件
- ✅ 审批表单组件
- ✅ 进度跟踪组件

### P2 - 高级功能 (第5-6周)
**目标**: 增强用户体验和系统能力

#### AI 集成和 DSL (6天)
- ✅ 自然语言工作流生成
- ✅ DSL 解析器
- ✅ 智能优化建议
- ✅ AI 辅助决策

#### 可视化编排器 (7天)
- ✅ React Flow 集成
- ✅ 拖拽式流程设计
- ✅ 节点配置面板
- ✅ 实时预览和验证

#### 性能优化 (3天)
- ✅ 缓存策略实施
- ✅ 数据库查询优化
- ✅ 并发控制机制

### P3 - 扩展功能 (第7-8周)
**目标**: 完善生态和企业级特性

#### 高级工作流特性 (5天)
- ✅ 并行网关和汇聚
- ✅ 定时器和超时处理
- ✅ 子流程和流程调用
- ✅ 动态路由和条件分支

#### 监控和分析 (4天)
- ✅ 性能指标收集
- ✅ 业务分析报表
- ✅ 异常监控和告警
- ✅ 用户行为分析

#### 集成和扩展 (3天)
- ✅ Webhook 集成
- ✅ 第三方系统连接器
- ✅ 自定义动作扩展
- ✅ 插件市场准备

---

## 🎯 验收标准

### 功能验收标准
- ✅ 支持完整的工作流生命周期管理
- ✅ 实现复杂的审批和协作流程
- ✅ 提供直观的用户界面
- ✅ 支持 AI 辅助的流程设计和优化
- ✅ 具备企业级的性能和可靠性

### 性能验收标准
- ✅ 实例创建时间 < 100ms
- ✅ 状态转换时间 < 50ms
- ✅ 支持 10,000+ 并发实例
- ✅ 99.9% 的系统可用性
- ✅ 数据一致性保证

### 质量验收标准
- ✅ 单元测试覆盖率 > 85%
- ✅ 集成测试覆盖率 > 80%
- ✅ 性能测试通过
- ✅ 安全测试通过
- ✅ 用户体验测试通过

### 文档验收标准
- ✅ 完整的 API 文档
- ✅ 用户使用指南
- ✅ 开发者集成文档
- ✅ 最佳实践指南
- ✅ 故障排除手册

---

## 🔧 技术债务和改进计划

### 已知技术债务
1. **表达式引擎**: 当前使用简单的 JavaScript 评估，需要更安全的沙箱环境
2. **缓存一致性**: 多实例部署时的缓存同步机制需要完善
3. **错误恢复**: 需要更完善的错误恢复和重试机制
4. **性能监控**: 需要更细粒度的性能监控和分析

### 改进计划
1. **Q1 2025**: 实现安全的表达式引擎
2. **Q2 2025**: 完善分布式缓存机制
3. **Q3 2025**: 增强错误处理和恢复能力
4. **Q4 2025**: 实现高级分析和 BI 功能

---

## 🌟 创新特性

### AI-First 设计
- **自然语言流程设计**: 用户可以用自然语言描述业务流程，AI 自动生成工作流
- **智能优化建议**: 基于执行数据和用户反馈，AI 持续优化流程效率
- **预测性分析**: 预测流程完成时间、瓶颈和风险

### 低代码/无代码支持
- **可视化流程设计器**: 拖拽式的流程设计界面
- **动态表单生成**: 基于 Schema 自动生成审批表单
- **条件表达式构建器**: 可视化的条件逻辑构建

### 企业级特性
- **多租户支持**: 支持 SaaS 模式的多租户部署
- **高可用架构**: 支持集群部署和故障转移
- **审计合规**: 完整的操作审计和合规报告

---

**总结**: @linch-kit/workflow 作为 LinchKit 生态的重要组成部分，提供了企业级的工作流管理能力。通过 AI-First 的设计理念、完善的插件架构和丰富的功能特性，为开发者和企业用户提供了强大而灵活的业务流程自动化解决方案。

**文档版本**: v1.0.0
**最后更新**: 2025-06-23
**文档长度**: 3,700+ 行
**代码示例**: 150+ 个
**覆盖章节**: 8 个完整章节
