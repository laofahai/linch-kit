/**
 * 日期筛选器组件
 */

import React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"
import { Button } from "../ui/button"
import { Calendar } from "../ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { cn } from "../../lib/utils"

import type { DateFilterProps } from "./types"
import type { FilterOperator } from "../../schema/filter-generator"

/**
 * 日期筛选器组件
 */
export function DateFilter({
  field,
  label,
  operator,
  value,
  operators,
  disabled = false,
  required = false,
  onChange,
  onOperatorChange,
  format: dateFormat = "yyyy-MM-dd",
  showTime = false,
  minDate,
  maxDate,
  presets = []
}: DateFilterProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    value instanceof Date ? value : value ? new Date(value) : undefined
  )
  const [dateRange, setDateRange] = React.useState<[Date | undefined, Date | undefined]>(
    Array.isArray(value) && value.length === 2
      ? [value[0] instanceof Date ? value[0] : new Date(value[0]), 
         value[1] instanceof Date ? value[1] : new Date(value[1])]
      : [undefined, undefined]
  )
  const [open, setOpen] = React.useState(false)

  // 操作符标签映射
  const operatorLabels: Record<FilterOperator, string> = {
    eq: '等于',
    ne: '不等于',
    gt: '晚于',
    gte: '不早于',
    lt: '早于',
    lte: '不晚于',
    between: '在范围内',
    isNull: '为空',
    isNotNull: '不为空',
    in: '在列表中',
    notIn: '不在列表中',
    contains: '包含',
    startsWith: '开始于',
    endsWith: '结束于'
  }

  // 默认预设
  const defaultPresets = [
    {
      label: '今天',
      value: new Date()
    },
    {
      label: '昨天',
      value: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
      label: '本周',
      value: [
        new Date(Date.now() - new Date().getDay() * 24 * 60 * 60 * 1000),
        new Date()
      ] as [Date, Date]
    },
    {
      label: '上周',
      value: [
        new Date(Date.now() - (new Date().getDay() + 7) * 24 * 60 * 60 * 1000),
        new Date(Date.now() - new Date().getDay() * 24 * 60 * 60 * 1000)
      ] as [Date, Date]
    },
    {
      label: '本月',
      value: [
        new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        new Date()
      ] as [Date, Date]
    },
    {
      label: '上月',
      value: [
        new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        new Date(new Date().getFullYear(), new Date().getMonth(), 0)
      ] as [Date, Date]
    }
  ]

  const allPresets = [...defaultPresets, ...presets]

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
      if (dateRange[0] && dateRange[1]) {
        onChange({
          field,
          operator: newOperator,
          value: dateRange
        })
      }
    } else if (selectedDate) {
      // 单值操作符，使用选中日期
      onChange({
        field,
        operator: newOperator,
        value: selectedDate
      })
    }
  }

  // 处理单日期选择
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setOpen(false)

    if (date) {
      onChange({
        field,
        operator,
        value: date
      })
    } else {
      onChange(null)
    }
  }

  // 处理日期范围选择
  const handleDateRangeSelect = (range: [Date | undefined, Date | undefined]) => {
    setDateRange(range)

    if (range[0] && range[1]) {
      onChange({
        field,
        operator,
        value: range
      })
    } else if (!range[0] && !range[1]) {
      onChange(null)
    }
  }

  // 处理预设选择
  const handlePresetSelect = (preset: typeof allPresets[0]) => {
    if (Array.isArray(preset.value)) {
      setDateRange(preset.value)
      if (operator === 'between') {
        onChange({
          field,
          operator,
          value: preset.value
        })
      }
    } else {
      setSelectedDate(preset.value)
      if (operator !== 'between') {
        onChange({
          field,
          operator,
          value: preset.value
        })
      }
    }
    setOpen(false)
  }

  // 处理清除
  const handleClear = () => {
    setSelectedDate(undefined)
    setDateRange([undefined, undefined])
    onChange(null)
  }

  // 是否需要输入值
  const needsInput = operator !== 'isNull' && operator !== 'isNotNull'
  const isRangeOperator = operator === 'between'

  // 格式化显示文本
  const getDisplayText = () => {
    if (isRangeOperator) {
      if (dateRange[0] && dateRange[1]) {
        return `${format(dateRange[0], dateFormat)} - ${format(dateRange[1], dateFormat)}`
      }
      return '选择日期范围'
    } else {
      if (selectedDate) {
        return format(selectedDate, dateFormat)
      }
      return '选择日期'
    }
  }

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

        {/* 日期选择器 */}
        {needsInput && (
          <div className="flex-1 relative">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    (!selectedDate && !dateRange[0] && !dateRange[1]) && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {getDisplayText()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                  {/* 预设选项 */}
                  {allPresets.length > 0 && (
                    <div className="border-r p-3 space-y-1">
                      <div className="text-sm font-medium mb-2">快速选择</div>
                      {allPresets.map((preset, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-sm"
                          onClick={() => handlePresetSelect(preset)}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  {/* 日历 */}
                  <div className="p-3">
                    {isRangeOperator ? (
                      <Calendar
                        mode="range"
                        selected={{
                          from: dateRange[0],
                          to: dateRange[1]
                        }}
                        onSelect={(range) => {
                          if (range) {
                            handleDateRangeSelect([range.from, range.to])
                          } else {
                            handleDateRangeSelect([undefined, undefined])
                          }
                        }}
                        disabled={(date) =>
                          (minDate && date < minDate) ||
                          (maxDate && date > maxDate)
                        }
                        numberOfMonths={2}
                      />
                    ) : (
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) =>
                          (minDate && date < minDate) ||
                          (maxDate && date > maxDate)
                        }
                      />
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            {/* 清除按钮 */}
            {(selectedDate || dateRange[0] || dateRange[1]) && (
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
            {operator === 'isNull' ? '检查空值' : '检查非空值'}
          </div>
        )}
      </div>
    </div>
  )
}
