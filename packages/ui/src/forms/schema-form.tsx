'use client'

/**
 * @fileoverview Schema驱动的表单组件 - 基于react-hook-form和LinchKit Schema
 */

import React from 'react'
import { useForm } from './form-wrapper'
import { defineEntity } from '@linch-kit/schema'

// import type { UIEntityDefinition } from '../types' // 临时移除未使用导入
import { logger, useUITranslation } from '../infrastructure'
import type { SchemaFormProps } from '../types'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card'

import { SchemaFieldRenderer } from './schema-field-renderer'

/**
 * Schema驱动的表单组件
 * 基于Entity定义自动生成表单字段和验证规则
 */
export function SchemaForm({
  schema,
  onSubmit,
  onCancel,
  initialData = {},
  mode = 'create',
  validation = 'strict',
  className,
  children
}: SchemaFormProps) {
  const { t } = useUITranslation()
  
  // 创建Schema实体用于验证
  const entity = React.useMemo(() => {
    try {
      return defineEntity(schema.name, {
        fields: schema.fields,
        options: schema.options
      })
    } catch (error) {
      logger.error('创建Schema实体失败: ' + schema.name + ' error: ' + String(error))
      return null
    }
  }, [schema])

  const form = useForm<Record<string, unknown>>({
    defaultValues: initialData,
    mode: validation === 'strict' ? 'onChange' : 'onSubmit'
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      // 使用Schema实体进行验证
      if (entity) {
        if (mode === 'create') {
          entity.validateCreate(data)
        } else if (mode === 'edit') {
          entity.validateUpdate(data)
        } else {
          await entity.validate(data)
        }
      }
      
      logger.info('提交表单数据: ' + schema.name + ' mode: ' + mode)
      await onSubmit(data)
      
      if (mode === 'create') {
        form.reset()
      }
    } catch (error) {
      logger.error('表单提交失败: ' + schema.name + ' error: ' + String(error))
      // 这里可以设置表单错误
    }
  })

  const isReadonly = mode === 'view'
  const submitButtonText = mode === 'create' ? t('form.create') : 
                          mode === 'edit' ? t('form.update') : ''

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          {mode === 'create' && t('form.create_title', { entity: schema.displayName || schema.name })}
          {mode === 'edit' && t('form.edit_title', { entity: schema.displayName || schema.name })}
          {mode === 'view' && t('form.view_title', { entity: schema.displayName || schema.name })}
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* 渲染所有字段 */}
          {Object.entries(schema.fields).map(([fieldName, fieldDef]) => (
            <SchemaFieldRenderer
              key={fieldName}
              name={fieldName}
              field={fieldDef}
              control={form.control}
              disabled={isReadonly}
              error={form.formState.errors[fieldName]?.message as string}
            />
          ))}
          
          {/* 自定义子元素 */}
          {children}
        </CardContent>

        {!isReadonly && (
          <CardFooter className="flex justify-end space-x-2">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                {t('form.cancel')}
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? t('form.submitting') : submitButtonText}
            </Button>
          </CardFooter>
        )}
      </form>
    </Card>
  )
}