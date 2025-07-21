/**
 * Claude Code强制性命令系统
 * 脚本可以强制Claude Code执行特定操作，包括用户确认
 * 
 * @version 1.0.0 - 强制控制机制
 */

export interface ClaudeCodeCommand {
  type: 'USER_CONFIRMATION' | 'EXECUTE_TOOL' | 'READ_FILE' | 'STOP_EXECUTION' | 'CREATE_TODO'
  priority: 'BLOCKING' | 'HIGH' | 'MEDIUM' | 'LOW'
  payload: unknown
  reason: string
}

export interface UserConfirmationCommand extends ClaudeCodeCommand {
  type: 'USER_CONFIRMATION'
  payload: {
    message: string
    options: Array<{
      label: string
      value: string
      action?: ClaudeCodeCommand
    }>
    defaultOption?: string
    timeout?: number // 秒
  }
}

export interface ExecuteToolCommand extends ClaudeCodeCommand {
  type: 'EXECUTE_TOOL'
  payload: {
    tool: 'Bash' | 'Read' | 'Edit' | 'MultiEdit' | 'Write' | 'TodoWrite'
    parameters: Record<string, unknown>
    description: string
  }
}

export interface StopExecutionCommand extends ClaudeCodeCommand {
  type: 'STOP_EXECUTION'
  payload: {
    reason: string
    suggestedActions: string[]
  }
}

/**
 * 生成强制性Claude Code命令
 */
export class ClaudeCodeCommandGenerator {
  
  /**
   * 生成用户确认命令
   */
  static generateUserConfirmation(
    message: string, 
    options: Array<{label: string, value: string, action?: ClaudeCodeCommand}>,
    reason: string,
    priority: 'BLOCKING' | 'HIGH' | 'MEDIUM' = 'BLOCKING'
  ): UserConfirmationCommand {
    return {
      type: 'USER_CONFIRMATION',
      priority,
      reason,
      payload: {
        message,
        options,
        timeout: 30
      }
    }
  }

  /**
   * 生成强制工具执行命令
   */
  static generateToolExecution(
    tool: string,
    parameters: Record<string, unknown>,
    description: string,
    reason: string,
    priority: 'BLOCKING' | 'HIGH' | 'MEDIUM' = 'HIGH'
  ): ExecuteToolCommand {
    return {
      type: 'EXECUTE_TOOL',
      priority,
      reason,
      payload: {
        tool: tool as any,
        parameters,
        description
      }
    }
  }

  /**
   * 生成停止执行命令
   */
  static generateStopExecution(
    reason: string,
    suggestedActions: string[],
    priority: 'BLOCKING' = 'BLOCKING'
  ): StopExecutionCommand {
    return {
      type: 'STOP_EXECUTION',
      priority,
      reason,
      payload: {
        reason,
        suggestedActions
      }
    }
  }

  /**
   * 将命令转换为Claude Code可读的格式
   */
  static formatForClaudeCode(commands: ClaudeCodeCommand[]): string {
    const output = [
      '🤖 CLAUDE CODE 强制执行指令',
      '=' .repeat(50),
      ''
    ]

    commands.forEach((cmd, index) => {
      output.push(`## 指令 ${index + 1}: ${cmd.type}`)
      output.push(`**优先级**: ${cmd.priority}`)
      output.push(`**原因**: ${cmd.reason}`)
      output.push('')

      switch (cmd.type) {
        case 'USER_CONFIRMATION':
          const confirmCmd = cmd as UserConfirmationCommand
          output.push('🔴 **要求用户确认**')
          output.push(`**提示**: ${confirmCmd.payload.message}`)
          output.push('**选项**:')
          confirmCmd.payload.options.forEach((option, i) => {
            output.push(`  ${i + 1}. ${option.label} (值: ${option.value})`)
            if (option.action) {
              output.push(`     → 后续动作: ${option.action.type}`)
            }
          })
          break

        case 'EXECUTE_TOOL':
          const execCmd = cmd as ExecuteToolCommand
          output.push('🔴 **强制执行工具**')
          output.push(`**工具**: ${execCmd.payload.tool}`)
          output.push(`**描述**: ${execCmd.payload.description}`)
          output.push('**参数**:')
          output.push('```json')
          output.push(JSON.stringify(execCmd.payload.parameters, null, 2))
          output.push('```')
          break

        case 'STOP_EXECUTION':
          const stopCmd = cmd as StopExecutionCommand
          output.push('🔴 **停止执行**')
          output.push(`**原因**: ${stopCmd.payload.reason}`)
          output.push('**建议操作**:')
          stopCmd.payload.suggestedActions.forEach((action, i) => {
            output.push(`  ${i + 1}. ${action}`)
          })
          break
      }

      output.push('')
      output.push('---')
      output.push('')
    })

    output.push('🚨 **重要**: Claude Code必须按照以上指令执行，不得跳过或修改。')

    return output.join('\n')
  }
}

/**
 * 常用的强制性命令模板
 */
export class CommonClaudeCodeCommands {
  
  /**
   * 要求用户确认继续危险操作
   */
  static confirmDangerousOperation(operation: string, risks: string[]): UserConfirmationCommand {
    return ClaudeCodeCommandGenerator.generateUserConfirmation(
      `检测到危险操作: ${operation}\n风险:\n${risks.map(r => `- ${r}`).join('\n')}\n\n是否继续?`,
      [
        { label: '继续执行', value: 'continue' },
        { label: '中止操作', value: 'abort', action: ClaudeCodeCommandGenerator.generateStopExecution(
          '用户选择中止危险操作',
          ['检查操作风险', '修改实现方案', '寻求更安全的替代方案']
        )}
      ],
      '检测到可能的危险操作',
      'BLOCKING'
    )
  }

  /**
   * 要求用户确认包复用选择
   */
  static confirmPackageChoice(existingPackages: string[], newImplementation: string): UserConfirmationCommand {
    return ClaudeCodeCommandGenerator.generateUserConfirmation(
      `发现现有包实现:\n${existingPackages.map(p => `- ${p}`).join('\n')}\n\n建议的新实现: ${newImplementation}\n\n选择方案:`,
      [
        { label: '使用现有包', value: 'existing' },
        { label: '创建新实现', value: 'new' },
        { label: '混合方案', value: 'hybrid' }
      ],
      '包复用决策需要用户确认',
      'HIGH'
    )
  }

  /**
   * 强制修复Neo4j连接
   */
  static forceFixNeo4j(): ExecuteToolCommand {
    return ClaudeCodeCommandGenerator.generateToolExecution(
      'Bash',
      {
        command: 'bun tools/ai-platform/scripts/neo4j-stats.ts',
        description: '验证Neo4j连接状态'
      },
      '验证并修复Neo4j连接',
      'Graph RAG查询失败，必须修复连接',
      'BLOCKING'
    )
  }

  /**
   * 强制创建功能分支
   */
  static forceCreateBranch(taskDescription: string): UserConfirmationCommand {
    const branchName = `feature/${taskDescription.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}`
    
    return ClaudeCodeCommandGenerator.generateUserConfirmation(
      `检测到在保护分支工作。必须创建功能分支。\n建议分支名: ${branchName}`,
      [
        { 
          label: '创建建议的分支', 
          value: 'create-suggested',
          action: ClaudeCodeCommandGenerator.generateToolExecution(
            'Bash',
            { command: `git checkout -b ${branchName}`, description: '创建功能分支' },
            '创建功能分支',
            '遵循分支管理规范'
          )
        },
        { label: '手动指定分支名', value: 'manual' },
        { 
          label: '中止操作', 
          value: 'abort',
          action: ClaudeCodeCommandGenerator.generateStopExecution(
            '用户选择在保护分支工作被拒绝',
            ['切换到功能分支', '创建新的功能分支']
          )
        }
      ],
      '禁止在保护分支工作',
      'BLOCKING'
    )
  }
}