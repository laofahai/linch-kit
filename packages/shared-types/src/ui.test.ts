/**
 * UI 类型测试
 */

import { describe, it, expect } from 'bun:test'
import type { ComponentDefinition, ThemeConfig, FormFieldConfig } from './ui'

describe('UI types', () => {
  it('should have correct ComponentDefinition structure', () => {
    const component: ComponentDefinition = {
      name: 'TestComponent',
      component: () => null,
      props: { test: 'value' },
      category: 'test',
      description: 'Test component',
    }

    expect(component.name).toBe('TestComponent')
    expect(component.category).toBe('test')
    expect(component.description).toBe('Test component')
    expect(component.props).toEqual({ test: 'value' })
  })

  it('should have correct ThemeConfig structure', () => {
    const theme: ThemeConfig = {
      colors: { primary: '#000' },
      fonts: { body: 'Arial' },
      spacing: { sm: '8px' },
      breakpoints: { md: '768px' },
    }

    expect(theme.colors).toEqual({ primary: '#000' })
    expect(theme.fonts).toEqual({ body: 'Arial' })
    expect(theme.spacing).toEqual({ sm: '8px' })
    expect(theme.breakpoints).toEqual({ md: '768px' })
  })

  it('should have correct FormFieldConfig structure', () => {
    const field: FormFieldConfig = {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'Enter your email',
      description: 'Your email address',
      validation: { min: 1 },
      options: [{ label: 'Option 1', value: 'value1' }],
    }

    expect(field.name).toBe('email')
    expect(field.type).toBe('email')
    expect(field.required).toBe(true)
    expect(field.validation).toEqual({ min: 1 })
    expect(field.options).toEqual([{ label: 'Option 1', value: 'value1' }])
  })
})