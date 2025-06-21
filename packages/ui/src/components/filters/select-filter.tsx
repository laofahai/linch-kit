/**
 * 选择筛选器组件
 */

import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"
import { X, Check } from "lucide-react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "../ui/command"

import type { SelectFilterProps } from "./types"
import type { FilterOperator } from "../../schema/filter-generator"

/**
 * 选择筛选器组件
 */
export function SelectFilter({
  field,
  label,
  operator,
  value,
  operators,
  options,
  multiple = false,
  searchable = false,
  disabled = false,
  required = false,
  onChange,
  onOperatorChange,
  asyncOptions
}: SelectFilterProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [selectedValues, setSelectedValues] = React.useState<any[]>(
    Array.isArray(value) ? value : value !== undefined && value !== null ? [value] : []
  )

  // 操作符标签映射
  const operatorLabels: Record<FilterOperator, string> = {
    eq: '等于',
    ne: '不等于',
    in: '在列表中',
    notIn: '不在列表中',
    isNull: '为空',
    isNotNull: '不为空',
    gt: '大于',
    gte: '大于等于',
    lt: '小于',
    lte: '小于等于',
    contains: '包含',
    startsWith: '开始于',
    endsWith: '结束于',
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
    } else if (selectedValues.length > 0) {
      // 根据操作符类型决定值的格式
      const isMultiOperator = newOperator === 'in' || newOperator === 'notIn'
      onChange({
        field,
        operator: newOperator,
        value: isMultiOperator ? selectedValues : selectedValues[0]
      })
    }
  }

  // 处理选择变更
  const handleSelectionChange = (newValue: any) => {
    let newSelectedValues: any[]

    if (multiple || operator === 'in' || operator === 'notIn') {
      // 多选模式
      if (selectedValues.includes(newValue)) {
        newSelectedValues = selectedValues.filter(v => v !== newValue)
      } else {
        newSelectedValues = [...selectedValues, newValue]
      }
    } else {
      // 单选模式
      newSelectedValues = [newValue]
      setOpen(false)
    }

    setSelectedValues(newSelectedValues)

    // 触发筛选条件变更
    if (newSelectedValues.length > 0) {
      const isMultiOperator = operator === 'in' || operator === 'notIn'
      onChange({
        field,
        operator,
        value: isMultiOperator ? newSelectedValues : newSelectedValues[0]
      })
    } else {
      onChange(null) // 清除筛选条件
    }
  }

  // 处理清除
  const handleClear = () => {
    setSelectedValues([])
    onChange(null)
  }

  // 移除单个选中值
  const handleRemoveValue = (valueToRemove: any) => {
    const newSelectedValues = selectedValues.filter(v => v !== valueToRemove)
    setSelectedValues(newSelectedValues)

    if (newSelectedValues.length > 0) {
      const isMultiOperator = operator === 'in' || operator === 'notIn'
      onChange({
        field,
        operator,
        value: isMultiOperator ? newSelectedValues : newSelectedValues[0]
      })
    } else {
      onChange(null)
    }
  }

  // 获取选项标签
  const getOptionLabel = (optionValue: any): string => {
    const option = options.find(opt => opt.value === optionValue)
    return option?.label || optionValue?.toString() || ''
  }

  // 过滤选项
  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchValue) return options
    return options.filter(option =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [options, searchValue, searchable])

  // 是否需要输入值
  const needsInput = operator !== 'isNull' && operator !== 'isNotNull'
  const isMultiMode = multiple || operator === 'in' || operator === 'notIn'

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

        {/* 选择器 */}
        {needsInput && (
          <div className="flex-1">
            {searchable ? (
              // 可搜索的选择器
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                  >
                    {selectedValues.length === 0 ? (
                      <span className="text-muted-foreground">
                        请选择{label}
                      </span>
                    ) : isMultiMode ? (
                      <span>
                        已选择 {selectedValues.length} 项
                      </span>
                    ) : (
                      getOptionLabel(selectedValues[0])
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput
                      placeholder={`搜索${label}...`}
                      value={searchValue}
                      onValueChange={setSearchValue}
                    />
                    <CommandEmpty>未找到选项</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {filteredOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={() => handleSelectionChange(option.value)}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedValues.includes(option.value)
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              // 普通选择器
              <Select
                value={selectedValues[0]?.toString() || ""}
                onValueChange={handleSelectionChange}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`请选择${label}`} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* 清除按钮 */}
        {needsInput && selectedValues.length > 0 && (
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

        {/* 空值检查时显示状态 */}
        {!needsInput && (
          <div className="flex-1 px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md">
            {operator === 'isNull' ? '检查空值' : '检查非空值'}
          </div>
        )}
      </div>

      {/* 多选时显示已选择的值 */}
      {needsInput && isMultiMode && selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedValues.map((val, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1"
            >
              <span>{getOptionLabel(val)}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemoveValue(val)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
