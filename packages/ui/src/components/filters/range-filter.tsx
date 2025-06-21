/**
 * 范围筛选器组件
 */

import React from "react"
import { Slider } from "../ui/slider"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Button } from "../ui/button"
import { X } from "lucide-react"

import type { RangeFilterProps } from "./types"

/**
 * 范围筛选器组件
 */
export function RangeFilter({
  field,
  label,
  operator,
  value,
  operators,
  disabled = false,
  required = false,
  onChange,
  onOperatorChange,
  min = 0,
  max = 100,
  step = 1,
  valueType = 'number'
}: RangeFilterProps) {
  const [rangeValues, setRangeValues] = React.useState<[number, number]>(
    Array.isArray(value) && value.length === 2
      ? [Number(value[0]), Number(value[1])]
      : [min, max]
  )
  const [inputValues, setInputValues] = React.useState<[string, string]>(
    Array.isArray(value) && value.length === 2
      ? [value[0].toString(), value[1].toString()]
      : [min.toString(), max.toString()]
  )

  // 处理滑块变更
  const handleSliderChange = (newValues: number[]) => {
    if (newValues.length === 2) {
      const sortedValues: [number, number] = [
        Math.min(newValues[0], newValues[1]),
        Math.max(newValues[0], newValues[1])
      ]
      setRangeValues(sortedValues)
      setInputValues([sortedValues[0].toString(), sortedValues[1].toString()])
      
      onChange({
        field,
        operator: 'between',
        value: valueType === 'date' 
          ? [new Date(sortedValues[0]), new Date(sortedValues[1])]
          : sortedValues
      })
    }
  }

  // 处理输入框变更
  const handleInputChange = (index: 0 | 1, newValue: string) => {
    const newInputValues: [string, string] = [...inputValues]
    newInputValues[index] = newValue
    setInputValues(newInputValues)

    // 验证并更新范围值
    const numValue = parseFloat(newValue)
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      const newRangeValues: [number, number] = [...rangeValues]
      newRangeValues[index] = numValue
      
      // 确保第一个值不大于第二个值
      if (index === 0 && numValue > newRangeValues[1]) {
        newRangeValues[1] = numValue
        setInputValues([newValue, newValue])
      } else if (index === 1 && numValue < newRangeValues[0]) {
        newRangeValues[0] = numValue
        setInputValues([newValue, newValue])
      }
      
      setRangeValues(newRangeValues)
      
      onChange({
        field,
        operator: 'between',
        value: valueType === 'date'
          ? [new Date(newRangeValues[0]), new Date(newRangeValues[1])]
          : newRangeValues
      })
    }
  }

  // 处理清除
  const handleClear = () => {
    const defaultRange: [number, number] = [min, max]
    setRangeValues(defaultRange)
    setInputValues([min.toString(), max.toString()])
    onChange(null)
  }

  // 检查是否为默认值
  const isDefaultValue = rangeValues[0] === min && rangeValues[1] === max

  // 格式化显示值
  const formatValue = (val: number): string => {
    if (valueType === 'date') {
      return new Date(val).toLocaleDateString()
    }
    return val.toString()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {!isDefaultValue && (
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
      
      {/* 滑块 */}
      <div className="px-2">
        <Slider
          value={rangeValues}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-full"
        />
      </div>

      {/* 数值显示和输入 */}
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">最小值</Label>
          <Input
            type="number"
            value={inputValues[0]}
            onChange={(e) => handleInputChange(0, e.target.value)}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="h-8"
          />
        </div>
        
        <div className="flex items-center justify-center w-8 h-8">
          <span className="text-muted-foreground">-</span>
        </div>
        
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">最大值</Label>
          <Input
            type="number"
            value={inputValues[1]}
            onChange={(e) => handleInputChange(1, e.target.value)}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="h-8"
          />
        </div>
      </div>

      {/* 当前范围显示 */}
      <div className="text-center text-sm text-muted-foreground">
        {formatValue(rangeValues[0])} - {formatValue(rangeValues[1])}
      </div>
    </div>
  )
}

/**
 * 简化的范围筛选器（仅输入框）
 */
export function SimpleRangeFilter({
  field,
  label,
  operator,
  value,
  operators,
  disabled = false,
  required = false,
  onChange,
  onOperatorChange,
  min,
  max,
  step = 1,
  valueType = 'number'
}: RangeFilterProps) {
  const [inputValues, setInputValues] = React.useState<[string, string]>(
    Array.isArray(value) && value.length === 2
      ? [value[0].toString(), value[1].toString()]
      : ['', '']
  )

  // 处理输入框变更
  const handleInputChange = (index: 0 | 1, newValue: string) => {
    const newInputValues: [string, string] = [...inputValues]
    newInputValues[index] = newValue
    setInputValues(newInputValues)

    // 如果两个值都有效，触发变更
    if (newInputValues[0].trim() && newInputValues[1].trim()) {
      const numValues = [
        parseFloat(newInputValues[0]),
        parseFloat(newInputValues[1])
      ]
      
      if (!isNaN(numValues[0]) && !isNaN(numValues[1])) {
        // 确保第一个值小于等于第二个值
        const sortedValues = numValues.sort((a, b) => a - b)
        onChange({
          field,
          operator: 'between',
          value: valueType === 'date'
            ? [new Date(sortedValues[0]), new Date(sortedValues[1])]
            : sortedValues
        })
      }
    } else if (!newInputValues[0].trim() && !newInputValues[1].trim()) {
      onChange(null) // 清除筛选条件
    }
  }

  // 处理清除
  const handleClear = () => {
    setInputValues(['', ''])
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <Input
            type="number"
            value={inputValues[0]}
            onChange={(e) => handleInputChange(0, e.target.value)}
            placeholder="最小值"
            min={min}
            max={max}
            step={step}
            disabled={disabled}
          />
        </div>
        
        <span className="text-muted-foreground">至</span>
        
        <div className="flex-1">
          <Input
            type="number"
            value={inputValues[1]}
            onChange={(e) => handleInputChange(1, e.target.value)}
            placeholder="最大值"
            min={min}
            max={max}
            step={step}
            disabled={disabled}
          />
        </div>

        {(inputValues[0] || inputValues[1]) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
