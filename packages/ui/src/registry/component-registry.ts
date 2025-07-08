/**
 * 组件注册器 - UI组件动态注册和覆盖机制
 * @module registry/component-registry
 */

import { EventEmitter } from 'eventemitter3'
import type { ComponentType } from 'react'

/**
 * 组件定义
 */
export interface ComponentDefinition {
  name: string
  component: ComponentType<unknown>
  props?: Record<string, unknown>
  displayName?: string
  description?: string
  category?: string
  tags?: string[]
}

/**
 * 组件覆盖信息
 */
export interface ComponentOverride {
  originalName: string
  newComponent: ComponentType<unknown>
  overrideReason?: string
  priority?: number
}

/**
 * 组件注册信息
 */
export interface ComponentRegistration {
  definition: ComponentDefinition
  overrides: ComponentOverride[]
  registeredBy: string
  registeredAt: number
  lastUsedAt?: number
  usageCount: number
}

/**
 * 组件注册器 - 支持动态组件注册和覆盖
 *
 * 核心功能：
 * - 组件注册和发现
 * - 组件覆盖机制（支持多层覆盖）
 * - 组件使用统计
 * - 类型安全的组件获取
 */
export class ComponentRegistry extends EventEmitter {
  private components = new Map<string, ComponentRegistration>()
  private aliases = new Map<string, string>()

  /**
   * 注册组件
   */
  register(definition: ComponentDefinition, registeredBy = 'unknown'): void {
    if (this.components.has(definition.name)) {
      throw new Error(`Component ${definition.name} is already registered`)
    }

    const registration: ComponentRegistration = {
      definition,
      overrides: [],
      registeredBy,
      registeredAt: Date.now(),
      usageCount: 0,
    }

    this.components.set(definition.name, registration)
    this.emit('componentRegistered', { name: definition.name, definition, registeredBy })
  }

  /**
   * 覆盖现有组件
   */
  override(
    originalName: string,
    newComponent: ComponentType<unknown>,
    options: {
      reason?: string
      priority?: number
      registeredBy?: string
    } = {}
  ): void {
    const registration = this.components.get(originalName)
    if (!registration) {
      throw new Error(`Component ${originalName} not found`)
    }

    const override: ComponentOverride = {
      originalName,
      newComponent,
      overrideReason: options.reason,
      priority: options.priority || 0,
    }

    registration.overrides.push(override)
    registration.overrides.sort((a, b) => (b.priority || 0) - (a.priority || 0))

    this.emit('componentOverridden', {
      originalName,
      newComponent,
      override,
      registeredBy: options.registeredBy,
    })
  }

  /**
   * 获取组件（返回最高优先级的覆盖组件）
   */
  get<T = unknown>(name: string): ComponentType<T> | undefined {
    const realName = this.aliases.get(name) || name
    const registration = this.components.get(realName)

    if (!registration) {
      return undefined
    }

    // 更新使用统计
    registration.usageCount++
    registration.lastUsedAt = Date.now()

    // 返回最高优先级的覆盖组件，或原始组件
    if (registration.overrides.length > 0) {
      return registration.overrides[0].newComponent as ComponentType<T>
    }

    return registration.definition.component as ComponentType<T>
  }

  /**
   * 获取原始组件（忽略覆盖）
   */
  getOriginal<T = unknown>(name: string): ComponentType<T> | undefined {
    const realName = this.aliases.get(name) || name
    const registration = this.components.get(realName)
    return registration?.definition.component as ComponentType<T> | undefined
  }

  /**
   * 获取所有覆盖组件
   */
  getOverrides(name: string): ComponentOverride[] {
    const realName = this.aliases.get(name) || name
    const registration = this.components.get(realName)
    return registration?.overrides || []
  }

  /**
   * 检查组件是否存在
   */
  has(name: string): boolean {
    const realName = this.aliases.get(name) || name
    return this.components.has(realName)
  }

  /**
   * 获取所有组件名称
   */
  getComponentNames(): string[] {
    return Array.from(this.components.keys())
  }

  /**
   * 获取组件定义
   */
  getDefinition(name: string): ComponentDefinition | undefined {
    const realName = this.aliases.get(name) || name
    return this.components.get(realName)?.definition
  }

  /**
   * 获取组件注册信息
   */
  getRegistration(name: string): ComponentRegistration | undefined {
    const realName = this.aliases.get(name) || name
    return this.components.get(realName)
  }

  /**
   * 创建组件别名
   */
  createAlias(alias: string, targetName: string): void {
    if (!this.components.has(targetName)) {
      throw new Error(`Target component ${targetName} not found`)
    }

    if (this.aliases.has(alias) || this.components.has(alias)) {
      throw new Error(`Alias ${alias} already exists`)
    }

    this.aliases.set(alias, targetName)
    this.emit('aliasCreated', { alias, targetName })
  }

  /**
   * 移除组件别名
   */
  removeAlias(alias: string): void {
    if (this.aliases.delete(alias)) {
      this.emit('aliasRemoved', { alias })
    }
  }

  /**
   * 按分类获取组件
   */
  getByCategory(category: string): ComponentDefinition[] {
    return Array.from(this.components.values())
      .map(reg => reg.definition)
      .filter(def => def.category === category)
  }

  /**
   * 按标签搜索组件
   */
  searchByTags(tags: string[]): ComponentDefinition[] {
    return Array.from(this.components.values())
      .map(reg => reg.definition)
      .filter(def => def.tags?.some(tag => tags.includes(tag)))
  }

  /**
   * 获取使用统计
   */
  getUsageStats(): Array<{
    name: string
    usageCount: number
    lastUsedAt?: number
    registeredAt: number
  }> {
    return Array.from(this.components.entries()).map(([name, reg]) => ({
      name,
      usageCount: reg.usageCount,
      lastUsedAt: reg.lastUsedAt,
      registeredAt: reg.registeredAt,
    }))
  }

  /**
   * 清除所有注册信息
   */
  clear(): void {
    this.components.clear()
    this.aliases.clear()
    this.emit('registryCleared')
  }

  /**
   * 移除指定组件
   */
  unregister(name: string): void {
    const registration = this.components.get(name)
    if (!registration) {
      return
    }

    // 移除相关别名
    for (const [alias, targetName] of this.aliases.entries()) {
      if (targetName === name) {
        this.aliases.delete(alias)
      }
    }

    this.components.delete(name)
    this.emit('componentUnregistered', { name, definition: registration.definition })
  }
}

/**
 * 默认组件注册器实例
 */
export const componentRegistry = new ComponentRegistry()

/**
 * React Hook - 获取注册的组件
 */
export function useRegisteredComponent<T = unknown>(name: string): ComponentType<T> | undefined {
  return componentRegistry.get<T>(name)
}

/**
 * React Hook - 检查组件是否存在
 */
export function useHasComponent(name: string): boolean {
  return componentRegistry.has(name)
}
