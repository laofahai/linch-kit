/**
 * 计数器服务
 * 管理计数器的状态和业务逻辑
 */

import { EventEmitter } from 'events'

export interface CounterConfig {
  initialValue?: number
  step?: number
  allowNegative?: boolean
}

export interface CounterState {
  value: number
  history: Array<{ value: number; timestamp: Date; action: string }>
}

export class CounterService extends EventEmitter {
  private state: CounterState
  private config: CounterConfig
  
  constructor(config: CounterConfig = {}) {
    super()
    this.config = {
      initialValue: 0,
      step: 1,
      allowNegative: true,
      ...config,
    }
    
    this.state = {
      value: this.config.initialValue || 0,
      history: [],
    }
  }
  
  /**
   * 获取当前值
   */
  getValue(): number {
    return this.state.value
  }
  
  /**
   * 获取历史记录
   */
  getHistory(): CounterState['history'] {
    return [...this.state.history]
  }
  
  /**
   * 增加计数
   */
  increment(): void {
    const newValue = this.state.value + (this.config.step || 1)
    this.updateValue(newValue, 'increment')
  }
  
  /**
   * 减少计数
   */
  decrement(): void {
    const newValue = this.state.value - (this.config.step || 1)
    
    if (!this.config.allowNegative && newValue < 0) {
      return
    }
    
    this.updateValue(newValue, 'decrement')
  }
  
  /**
   * 重置计数
   */
  reset(): void {
    this.updateValue(this.config.initialValue || 0, 'reset')
  }
  
  /**
   * 设置特定值
   */
  setValue(value: number): void {
    if (!this.config.allowNegative && value < 0) {
      throw new Error('Negative values are not allowed')
    }
    
    this.updateValue(value, 'set')
  }
  
  /**
   * 更新配置
   */
  updateConfig(config: Partial<CounterConfig>): void {
    this.config = { ...this.config, ...config }
    this.emit('configChanged', this.config)
  }
  
  /**
   * 更新值并记录历史
   */
  private updateValue(value: number, action: string): void {
    const oldValue = this.state.value
    this.state.value = value
    
    // 记录历史
    this.state.history.push({
      value,
      timestamp: new Date(),
      action,
    })
    
    // 限制历史记录长度
    if (this.state.history.length > 100) {
      this.state.history.shift()
    }
    
    // 触发事件
    this.emit('valueChanged', {
      oldValue,
      newValue: value,
      action,
    })
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    this.removeAllListeners()
    this.state.history = []
  }
}