/**
 * 数字筛选器组件
 */

import React from "react"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"
import { X } from "lucide-react"
import { Button } from "../ui/button"
import { useTranslation } from "../../locales"

import type { FilterComponentProps } from "./types"
import type { FilterOperator } from "../../schema/filter-generator"

/**
 * 数字筛选器属性
 */
export interface NumberFilterProps extends FilterComponentProps {
  /** 最小值 */
  min?: number
  /** 最大值 */
  max?: number
  /** 步长 */
  step?: number
  /** 小数位数 */
  precision?: number
}

/**
 * 数字筛选器组件
 */
export function NumberFilter({
  field,
  label,
  operator,
  value,
  operators,
  placeholder,
  disabled = false,
  required = false,
  onChange,
  onOperatorChange,
  min,
  max,
  step = 1,
  precision = 0
}: NumberFilterProps) {
  const { t } = useTranslation('components')
  const [inputValue, setInputValue] = React.useState<string>(
    value?.toString() || ''
  )
  const [rangeValues, setRangeValues] = React.useState<[string, string]>(
    Array.isArray(value) && value.length === 2
      ? [value[0]?.toString() || '', value[1]?.toString() || '']
      : ['', '']
  )

  // 获取操作符标签
  const getOperatorLabel = (op: FilterOperator): string => {
    return t(`filters.operators.${op}`)
  }

  // 处理操作符变更
  const handleOperatorChange = (newOperator: FilterOperator) => {
    onOperatorChange?.(newOperator)
    
    // 如果是空值检查操作符，直接触发变更
    if (newOperator === 'isNull' || newOperator === 'isNotNull') {
      onChange({
        field,
        operator: newOperator,
        value: null
      })
    } else if (newOperator === 'between') {
      // 范围操作符，使用范围值
      if (rangeValues[0] && rangeValues[1]) {
        const numValues = [
          parseNumber(rangeValues[0]),
          parseNumber(rangeValues[1])
        ].filter(v => v !== null) as number[]
        
        if (numValues.length === 2) {
          onChange({
            field,
            operator: newOperator,
            value: numValues
          })
        }
      }
    } else if (inputValue) {
      // 单值操作符，使用输入值
      const numValue = parseNumber(inputValue)
      if (numValue !== null) {
        onChange({
          field,
          operator: newOperator,
          value: numValue
        })
      }
    }
  }

  // 解析数字
  const parseNumber = (str: string): number | null => {
    if (!str.trim()) return null
    const num = precision > 0 ? parseFloat(str) : parseInt(str, 10)
    return isNaN(num) ? null : num
  }

  // 格式化数字
  const formatNumber = (num: number): string => {
    return precision > 0 ? num.toFixed(precision) : num.toString()
  }

  // 处理单值输入变更
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    
    // 如果是空值检查操作符，不需要输入值
    if (operator === 'isNull' || operator === 'isNotNull') {
      return
    }

    // 验证数字格式
    if (newValue.trim()) {
      const numValue = parseNumber(newValue)
      if (numValue !== null) {
        // 检查范围
        if ((min !== undefined && numValue < min) || 
            (max !== undefined && numValue > max)) {
          return // 不触发变更，但保持输入值
        }
        
        onChange({
          field,
          operator,
          value: numValue
        })
      }
    } else {
      onChange(null) // 清除筛选条件
    }
  }

  // 处理范围输入变更
  const handleRangeChange = (index: 0 | 1, newValue: string) => {
    const newRangeValues: [string, string] = [...rangeValues]
    newRangeValues[index] = newValue
    setRangeValues(newRangeValues)

    // 如果两个值都有效，触发变更
    if (newRangeValues[0].trim() && newRangeValues[1].trim()) {
      const numValues = [
        parseNumber(newRangeValues[0]),
        parseNumber(newRangeValues[1])
      ]
      
      if (numValues[0] !== null && numValues[1] !== null) {
        // 确保第一个值小于等于第二个值
        const sortedValues = numValues.sort((a, b) => a! - b!)
        onChange({
          field,
          operator,
          value: sortedValues
        })
      }
    } else if (!newRangeValues[0].trim() && !newRangeValues[1].trim()) {
      onChange(null) // 清除筛选条件
    }
  }

  // 处理清除
  const handleClear = () => {
    setInputValue('')
    setRangeValues(['', ''])
    onChange(null)
  }

  // 是否需要输入值
  const needsInput = operator !== 'isNull' && operator !== 'isNotNull'
  const isRangeOperator = operator === 'between'

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      
      <div className="flex items-center space-x-2">
        {/* 操作符选择 */}
        <Select
          value={operator}
          onValueChange={handleOperatorChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operators.map((op) => (
              <SelectItem key={op} value={op}>
                {operatorLabels[op]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 单值输入框 */}
        {needsInput && !isRangeOperator && (
          <div className="flex-1 relative">
            <Input
              type="number"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={placeholder || `请输入${label}`}
              disabled={disabled}
              required={required}
              min={min}
              max={max}
              step={step}
              className="pr-8"
            />
            {inputValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={handleClear}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {/* 范围输入框 */}
        {needsInput && isRangeOperator && (
          <div className="flex-1 flex items-center space-x-2">
            <Input
              type="number"
              value={rangeValues[0]}
              onChange={(e) => handleRangeChange(0, e.target.value)}
              placeholder="最小值"
              disabled={disabled}
              min={min}
              max={max}
              step={step}
              className="flex-1"
            />
            <span className="text-muted-foreground">至</span>
            <Input
              type="number"
              value={rangeValues[1]}
              onChange={(e) => handleRangeChange(1, e.target.value)}
              placeholder="最大值"
              disabled={disabled}
              min={min}
              max={max}
              step={step}
              className="flex-1"
            />
            {(rangeValues[0] || rangeValues[1]) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleClear}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {/* 空值检查时显示状态 */}
        {!needsInput && (
          <div className="flex-1 px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md">
            {operator === 'isNull' ? '检查空值' : '检查非空值'}
          </div>
        )}
      </div>

      {/* 范围提示 */}
      {(min !== undefined || max !== undefined) && (
        <div className="text-xs text-muted-foreground">
          {min !== undefined && max !== undefined
            ? `范围: ${formatNumber(min)} - ${formatNumber(max)}`
            : min !== undefined
            ? `最小值: ${formatNumber(min)}`
            : `最大值: ${formatNumber(max!)}`
          }
        </div>
      )}
    </div>
  )
}
