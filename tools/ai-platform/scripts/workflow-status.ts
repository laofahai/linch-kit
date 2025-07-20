#!/usr/bin/env bun
/**
 * AI工作流状态查看工具
 */

import { FileBasedPersistence } from '../src/workflow/workflow-state-machine'

async function showWorkflowStatus() {
  console.log('📊 AI工作流状态概览\n')
  
  const persistence = new FileBasedPersistence()
  
  try {
    const contexts = await persistence.list()
    
    if (contexts.length === 0) {
      console.log('📭 当前没有活跃的工作流')
      return
    }
    
    console.log(`🔄 活跃工作流: ${contexts.length}个\n`)
    
    // 按状态分组
    const stateGroups = contexts.reduce((groups, context) => {
      const state = context.currentState
      if (!groups[state]) {
        groups[state] = []
      }
      groups[state].push(context)
      return groups
    }, {} as Record<string, typeof contexts>)
    
    // 显示各状态的工作流
    Object.entries(stateGroups).forEach(([state, workflows]) => {
      console.log(`📋 ${getStateDisplayName(state)}: ${workflows.length}个`)
      
      workflows.forEach(workflow => {
        const duration = Date.now() - new Date(workflow.metadata.startTime).getTime()
        const durationStr = formatDuration(duration)
        
        console.log(`  🆔 ${workflow.sessionId}`)
        console.log(`     📝 ${workflow.taskDescription.substring(0, 60)}${workflow.taskDescription.length > 60 ? '...' : ''}`)
        console.log(`     ⏱️ 运行时间: ${durationStr}`)
        
        if (workflow.analysis) {
          console.log(`     📊 复杂度: ${workflow.analysis.complexity}/5, 预估: ${workflow.analysis.estimatedHours}h`)
        }
        
        if (workflow.approvalRequest) {
          const urgency = workflow.approvalRequest.urgency
          const urgencyIcon = urgency === 'high' ? '🔴' : urgency === 'medium' ? '🟡' : '🟢'
          console.log(`     ${urgencyIcon} 审批紧急度: ${urgency}`)
        }
        
        if (workflow.implementation) {
          console.log(`     🚧 实施进度: ${workflow.implementation.progress}% - ${workflow.implementation.currentStep}`)
        }
        
        console.log('')
      })
    })
    
    // 显示统计信息
    console.log('📈 统计信息:')
    console.log(`  - 总工作流: ${contexts.length}`)
    console.log(`  - 待审批: ${stateGroups['PENDING_APPROVAL']?.length || 0}`)
    console.log(`  - 进行中: ${stateGroups['IMPLEMENTING']?.length || 0}`)
    console.log(`  - 已完成: ${stateGroups['COMPLETED']?.length || 0}`)
    console.log(`  - 失败: ${stateGroups['FAILED']?.length || 0}`)
    
    // 显示需要关注的项目
    const needsAttention = []
    
    // 检查长时间待审批的项目
    const pendingApproval = stateGroups['PENDING_APPROVAL'] || []
    const longPending = pendingApproval.filter(workflow => {
      const pendingTime = Date.now() - new Date(workflow.approvalRequest!.requestedAt).getTime()
      return pendingTime > 4 * 60 * 60 * 1000 // 超过4小时
    })
    
    if (longPending.length > 0) {
      needsAttention.push(`${longPending.length}个工作流待审批超过4小时`)
    }
    
    // 检查失败的项目
    const failed = stateGroups['FAILED'] || []
    if (failed.length > 0) {
      needsAttention.push(`${failed.length}个工作流执行失败`)
    }
    
    if (needsAttention.length > 0) {
      console.log('\n⚠️ 需要关注:')
      needsAttention.forEach(item => {
        console.log(`  - ${item}`)
      })
    }
    
  } catch (error) {
    console.error('❌ 获取工作流状态失败:', error)
  }
}

function getStateDisplayName(state: string): string {
  const stateNames: Record<string, string> = {
    'INITIALIZED': '已初始化',
    'ANALYZING': '分析中',
    'PENDING_APPROVAL': '待审批',
    'APPROVED': '已审批',
    'REJECTED': '已拒绝',
    'IMPLEMENTING': '实施中',
    'TESTING': '测试中',
    'COMPLETED': '已完成',
    'FAILED': '失败',
    'CANCELLED': '已取消'
  }
  
  return stateNames[state] || state
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days}天${hours % 24}小时`
  } else if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟`
  } else {
    return `${seconds}秒`
  }
}

if (import.meta.main) {
  showWorkflowStatus().catch(console.error)
}