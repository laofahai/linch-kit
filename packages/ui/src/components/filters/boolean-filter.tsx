/**
 * 布尔筛选器组件
 */

import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"

import type { FilterComponentProps } from "./types"
import type { FilterOperator } from "../../schema/filter-generator"

/**
 * 布尔筛选器组件
 */
export function BooleanFilter({
  field,
  label,
  operator,
  value,
  operators,
  disabled = false,
  required = false,
  onChange,
  onOperatorChange
}: FilterComponentProps) {
  const [booleanValue, setBooleanValue] = React.useState<boolean | null>(
    typeof value === 'boolean' ? value : null
  )

  // 操作符标签映射
  const operatorLabels: Record<FilterOperator, string> = {
    eq: '等于',
    ne: '不等于',
    isNull: '为空',
    isNotNull: '不为空',
    gt: '大于',
    gte: '大于等于',
    lt: '小于',
    lte: '小于等于',
    contains: '包含',
    startsWith: '开始于',
    endsWith: '结束于',
    in: '在列表中',
    notIn: '不在列表中',
    between: '在范围内'
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
    } else if (booleanValue !== null) {
      // 如果有值，使用新操作符触发变更
      onChange({
        field,
        operator: newOperator,
        value: booleanValue
      })
    }
  }

  // 处理布尔值变更
  const handleBooleanChange = (newValue: boolean) => {
    setBooleanValue(newValue)
    
    // 如果是空值检查操作符，不需要输入值
    if (operator === 'isNull' || operator === 'isNotNull') {
      return
    }

    onChange({
      field,
      operator,
      value: newValue
    })
  }

  // 处理选择变更（用于下拉选择模式）
  const handleSelectChange = (newValue: string) => {
    if (newValue === 'clear') {
      setBooleanValue(null)
      onChange(null)
    } else {
      const boolValue = newValue === 'true'
      setBooleanValue(boolValue)
      onChange({
        field,
        operator,
        value: boolValue
      })
    }
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
                {operatorLabels[op]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 布尔值选择 */}
        {needsInput && (
          <div className="flex-1">
            {/* 下拉选择模式 */}
            <Select
              value={
                booleanValue === null 
                  ? 'clear' 
                  : booleanValue.toString()
              }
              onValueChange={handleSelectChange}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={`请选择${label}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">是</SelectItem>
                <SelectItem value="false">否</SelectItem>
                <SelectItem value="clear">
                  <span className="text-muted-foreground">清除选择</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 空值检查时显示状态 */}
        {!needsInput && (
          <div className="flex-1 px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md">
            {operator === 'isNull' ? '检查空值' : '检查非空值'}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 开关模式的布尔筛选器
 */
export function SwitchBooleanFilter({
  field,
  label,
  operator,
  value,
  operators,
  disabled = false,
  required = false,
  onChange,
  onOperatorChange
}: FilterComponentProps) {
  const [booleanValue, setBooleanValue] = React.useState<boolean>(
    typeof value === 'boolean' ? value : false
  )

  // 处理开关变更
  const handleSwitchChange = (checked: boolean) => {
    setBooleanValue(checked)
    onChange({
      field,
      operator: 'eq',
      value: checked
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Switch
          checked={booleanValue}
          onCheckedChange={handleSwitchChange}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

/**
 * 单选按钮模式的布尔筛选器
 */
export function RadioBooleanFilter({
  field,
  label,
  operator,
  value,
  operators,
  disabled = false,
  required = false,
  onChange,
  onOperatorChange
}: FilterComponentProps) {
  const [selectedValue, setSelectedValue] = React.useState<string>(
    value === null || value === undefined 
      ? 'all' 
      : value.toString()
  )

  // 处理单选变更
  const handleRadioChange = (newValue: string) => {
    setSelectedValue(newValue)
    
    if (newValue === 'all') {
      onChange(null)
    } else {
      onChange({
        field,
        operator: 'eq',
        value: newValue === 'true'
      })
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      
      <RadioGroup
        value={selectedValue}
        onValueChange={handleRadioChange}
        disabled={disabled}
        className="flex items-center space-x-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="all" id={`${field}-all`} />
          <Label htmlFor={`${field}-all`} className="text-sm">全部</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="true" id={`${field}-true`} />
          <Label htmlFor={`${field}-true`} className="text-sm">是</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="false" id={`${field}-false`} />
          <Label htmlFor={`${field}-false`} className="text-sm">否</Label>
        </div>
      </RadioGroup>
    </div>
  )
}
