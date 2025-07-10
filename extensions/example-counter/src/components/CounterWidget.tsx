/**
 * 计数器组件
 * 展示计数器UI和交互
 */

import React, { useState, useEffect } from 'react'

import type { CounterService } from '../services/CounterService'

export interface CounterWidgetProps {
  counterService?: CounterService
  title?: string
  showHistory?: boolean
}

export const CounterWidget: React.FC<CounterWidgetProps> = ({
  counterService,
  title = '计数器',
  showHistory = false,
}) => {
  const [value, setValue] = useState(0)
  const [history, setHistory] = useState<Array<{ value: number; timestamp: Date; action: string }>>([])
  
  useEffect(() => {
    if (!counterService) {
      console.error('Counter service not provided')
      return
    }
    
    // 初始化值
    setValue(counterService.getValue())
    setHistory(counterService.getHistory())
    
    // 监听值变化
    const handleValueChange = ({ newValue }: { newValue: number }) => {
      setValue(newValue)
      setHistory(counterService.getHistory())
    }
    
    counterService.on('valueChanged', handleValueChange)
    
    // 清理
    return () => {
      counterService.off('valueChanged', handleValueChange)
    }
  }, [counterService])
  
  const handleIncrement = () => {
    counterService?.increment()
  }
  
  const handleDecrement = () => {
    counterService?.decrement()
  }
  
  const handleReset = () => {
    counterService?.reset()
  }
  
  return (
    <div className="counter-widget p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="flex items-center justify-center mb-4">
        <button
          onClick={handleDecrement}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-l-lg transition-colors"
        >
          -
        </button>
        
        <div className="px-8 py-2 bg-gray-100 text-2xl font-bold min-w-[100px] text-center">
          {value}
        </div>
        
        <button
          onClick={handleIncrement}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-r-lg transition-colors"
        >
          +
        </button>
      </div>
      
      <button
        onClick={handleReset}
        className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
      >
        重置
      </button>
      
      {showHistory && history.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2">历史记录</h4>
          <div className="max-h-32 overflow-y-auto">
            {history.slice(-5).reverse().map((item, index) => (
              <div key={index} className="text-xs text-gray-600 py-1">
                {item.action}: {item.value} - {new Date(item.timestamp).toLocaleTimeString()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 组件元数据
CounterWidget.displayName = 'CounterWidget'