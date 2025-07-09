'use client'

/**
 * @fileoverview Schema字段渲染器 - 基于字段类型渲染对应的表单控件
 */

import React from 'react'
import type { FieldDefinition } from '@linch-kit/schema'

import { Input } from '../server/input'
import { Label } from '../server/label'
import { cn } from '../utils'
import { Control, Controller } from '../forms/form-wrapper'

interface SchemaFieldRendererProps {
  name: string
  field: FieldDefinition
  control: Control<Record<string, unknown>>
  disabled?: boolean
  error?: string
  className?: string
}

/**
 * 根据Schema字段定义渲染对应的表单控件
 */
export function SchemaFieldRenderer({
  name,
  field,
  control,
  disabled = false,
  error,
  className,
}: SchemaFieldRendererProps) {
  const renderFieldControl = (value: unknown, onChange: (value: unknown) => void) => {
    const fieldType = field.type

    switch (fieldType) {
      case 'string':
      case 'email':
      case 'url':
        return (
          <Input
            type={fieldType === 'email' ? 'email' : fieldType === 'url' ? 'url' : 'text'}
            value={(value as string) || ''}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            placeholder={field.description || `请输入${name}`}
            className={cn(error && 'border-destructive')}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={(value as string) || ''}
            onChange={e => onChange(e.target.valueAsNumber || null)}
            disabled={disabled}
            placeholder={field.description || `请输入${name}`}
            min={(field as unknown as Record<string, unknown>).min as number | undefined}
            max={(field as unknown as Record<string, unknown>).max as number | undefined}
            className={cn(error && 'border-destructive')}
          />
        )

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={(value as boolean) || false}
              onChange={e => onChange(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 rounded border-input"
            />
            <Label className="text-sm font-normal">{field.description || name}</Label>
          </div>
        )

      case 'text':
        return (
          <textarea
            value={(value as string) || ''}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            placeholder={field.description || `请输入${name}`}
            rows={4}
            className={cn(
              'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive'
            )}
          />
        )

      case 'enum': {
        const options = ((field as unknown as Record<string, unknown>).values as string[]) || []
        return (
          <select
            value={(value as string) || ''}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive'
            )}
          >
            <option value="">请选择...</option>
            {options.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      }

      case 'date':
        return (
          <Input
            type="date"
            value={(value as string) || ''}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            className={cn(error && 'border-destructive')}
          />
        )

      default:
        // 对于复杂类型（array, object, json），显示JSON编辑器
        return (
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={e => {
              try {
                const parsed = JSON.parse(e.target.value)
                onChange(parsed)
              } catch {
                onChange(e.target.value)
              }
            }}
            disabled={disabled}
            placeholder={`请输入JSON格式的${name}`}
            rows={6}
            className={cn(
              'flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive'
            )}
          />
        )
    }
  }

  const isRequired = field.required || false
  const fieldLabel = name

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className="text-sm font-medium">
        {fieldLabel}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>

      <Controller
        name={name}
        control={control}
        render={({ field: { value, onChange } }) => renderFieldControl(value, onChange)}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      {field.description && !error && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
    </div>
  )
}
