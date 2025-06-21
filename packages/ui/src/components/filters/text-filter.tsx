/**
 * 文本筛选器组件
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
 * 文本筛选器组件
 */
export function TextFilter({
  field,
  label,
  operator,
  value,
  operators,
  placeholder,
  disabled = false,
  required = false,
  onChange,
  onOperatorChange
}: FilterComponentProps) {
  const { t } = useTranslation('components')
  const [inputValue, setInputValue] = React.useState<string>(
    value?.toString() || ''
  )

  // 操作符标签映射
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
    } else if (inputValue) {
      // 如果有值，使用新操作符触发变更
      onChange({
        field,
        operator: newOperator,
        value: inputValue
      })
    }
  }

  // 处理输入值变更
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)

    // 如果是空值检查操作符，不需要输入值
    if (operator === 'isNull' || operator === 'isNotNull') {
      return
    }

    // 触发筛选条件变更
    if (newValue.trim()) {
      onChange({
        field,
        operator,
        value: newValue.trim()
      })
    } else {
      onChange(null) // 清除筛选条件
    }
  }

  // 处理清除
  const handleClear = () => {
    setInputValue('')
    onChange(null)
  }

  // 是否需要输入值
  const needsInput = operator !== 'isNull' && operator !== 'isNotNull'

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
                {getOperatorLabel(op)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 输入框 */}
        {needsInput && (
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={placeholder || t('filters.placeholders.text', { field: label })}
              disabled={disabled}
              required={required}
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

        {/* 空值检查时显示状态 */}
        {!needsInput && (
          <div className="flex-1 px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md">
            {operator === 'isNull' ? t('filters.messages.checkEmpty') : t('filters.messages.checkNotEmpty')}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 多值文本筛选器（用于 in/notIn 操作符）
 */
export function MultiTextFilter({
  field,
  label,
  operator,
  value,
  operators,
  placeholder,
  disabled = false,
  required = false,
  onChange,
  onOperatorChange
}: FilterComponentProps) {
  const { t } = useTranslation('components')
  const [inputValue, setInputValue] = React.useState<string>('')
  const [values, setValues] = React.useState<string[]>(
    Array.isArray(value) ? value : value ? [value.toString()] : []
  )

  // 获取操作符标签
  const getOperatorLabel = (op: FilterOperator): string => {
    return t(`filters.operators.${op}`)
  }

  // 处理操作符变更
  const handleOperatorChange = (newOperator: FilterOperator) => {
    onOperatorChange?.(newOperator)
    
    if (newOperator === 'isNull' || newOperator === 'isNotNull') {
      onChange({
        field,
        operator: newOperator,
        value: null
      })
    } else if (values.length > 0) {
      onChange({
        field,
        operator: newOperator,
        value: newOperator === 'in' || newOperator === 'notIn' ? values : values[0]
      })
    }
  }

  // 添加值
  const handleAddValue = () => {
    if (inputValue.trim() && !values.includes(inputValue.trim())) {
      const newValues = [...values, inputValue.trim()]
      setValues(newValues)
      setInputValue('')
      
      onChange({
        field,
        operator,
        value: operator === 'in' || operator === 'notIn' ? newValues : newValues[0]
      })
    }
  }

  // 移除值
  const handleRemoveValue = (valueToRemove: string) => {
    const newValues = values.filter(v => v !== valueToRemove)
    setValues(newValues)
    
    if (newValues.length > 0) {
      onChange({
        field,
        operator,
        value: operator === 'in' || operator === 'notIn' ? newValues : newValues[0]
      })
    } else {
      onChange(null)
    }
  }

  // 处理回车键
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddValue()
    }
  }

  const needsInput = operator !== 'isNull' && operator !== 'isNotNull'
  const isMultiValue = operator === 'in' || operator === 'notIn'

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      
      <div className="space-y-2">
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
                {getOperatorLabel(op)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 输入区域 */}
        {needsInput && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder || t('filters.placeholders.text', { field: label })}
                disabled={disabled}
                required={required && values.length === 0}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddValue}
                disabled={!inputValue.trim() || (!isMultiValue && values.length > 0)}
              >
{t('common.actions.add')}
              </Button>
            </div>

            {/* 已添加的值 */}
            {values.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {values.map((val, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                  >
                    <span>{val}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => handleRemoveValue(val)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 空值检查时显示状态 */}
        {!needsInput && (
          <div className="px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md">
            {operator === 'isNull' ? t('filters.messages.checkEmpty') : t('filters.messages.checkNotEmpty')}
          </div>
        )}
      </div>
    </div>
  )
}
