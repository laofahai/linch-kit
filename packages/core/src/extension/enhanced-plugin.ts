/**
 * 增强的Plugin系统 - 扩展为Extension能力
 * @module extension/enhanced-plugin
 */

import type { Plugin, PluginConfig, PluginRegistration } from '../types/plugin'

import type {
  ExtensionCapabilities,
  ExtensionPermission,
  ExtensionMetadata,
  ExtensionConfig,
  Extension,
} from './types'

/**
 * 检查Plugin是否为Extension
 */
export function isExtension(plugin: Plugin): plugin is Extension {
  const metadata = plugin.metadata as ExtensionMetadata
  return !!(metadata.displayName && metadata.capabilities && metadata.permissions)
}

/**
 * 将Plugin转换为Extension（如果可能）
 */
export function pluginToExtension(plugin: Plugin): Extension | null {
  if (isExtension(plugin)) {
    return plugin
  }

  // 尝试将普通Plugin转换为Extension
  const extensionMetadata: ExtensionMetadata = {
    ...plugin.metadata,
    displayName: plugin.metadata.name,
    capabilities: {
      hasHooks: !!(plugin.init || plugin.start || plugin.stop),
      hasAPI: false,
      hasSchema: false,
      hasUI: false,
      standalone: false,
    },
    permissions: [],
    configuration: {},
  }

  return {
    ...plugin,
    metadata: extensionMetadata,
  }
}

/**
 * Extension兼容的Plugin注册信息
 */
export interface ExtensionCompatibleRegistration extends PluginRegistration {
  plugin: Extension
  config: ExtensionConfig
  isExtension: boolean
}

/**
 * 增强的Plugin注册表，支持Extension
 */
export class EnhancedPluginRegistry {
  private registrations = new Map<string, ExtensionCompatibleRegistration>()

  /**
   * 注册Plugin或Extension
   */
  register(plugin: Plugin | Extension, config: PluginConfig | ExtensionConfig = {}): void {
    let extension: Extension

    if (isExtension(plugin)) {
      extension = plugin
    } else {
      const converted = pluginToExtension(plugin)
      if (!converted) {
        throw new Error(`Cannot convert plugin ${plugin.metadata.id} to extension`)
      }
      extension = converted
    }

    // 验证Extension权限
    if (extension.metadata.permissions?.length > 0) {
      this.validatePermissions(extension.metadata.permissions)
    }

    const registration: ExtensionCompatibleRegistration = {
      plugin: extension,
      config: { ...extension.defaultConfig, ...config, enabled: config.enabled ?? true },
      status: 'registered',
      registeredAt: Date.now(),
      isExtension: isExtension(plugin),
    }

    this.registrations.set(extension.metadata.id, registration)
  }

  /**
   * 获取Extension
   */
  getExtension(id: string): Extension | undefined {
    return this.registrations.get(id)?.plugin
  }

  /**
   * 获取所有Extension
   */
  getAllExtensions(): Extension[] {
    return Array.from(this.registrations.values())
      .filter(reg => reg.isExtension)
      .map(reg => reg.plugin)
  }

  /**
   * 获取Extension能力
   */
  getExtensionCapabilities(id: string): ExtensionCapabilities | undefined {
    const extension = this.getExtension(id)
    return extension?.metadata.capabilities
  }

  /**
   * 检查Extension权限
   */
  hasExtensionPermission(id: string, permission: ExtensionPermission): boolean {
    const extension = this.getExtension(id)
    return extension?.metadata.permissions.includes(permission) ?? false
  }

  /**
   * 按能力筛选Extension
   */
  getExtensionsByCapability(capability: keyof ExtensionCapabilities): Extension[] {
    return this.getAllExtensions().filter(ext => ext.metadata.capabilities[capability] === true)
  }

  /**
   * 按分类筛选Extension
   */
  getExtensionsByCategory(category: string): Extension[] {
    return this.getAllExtensions().filter(ext => ext.metadata.category === category)
  }

  /**
   * 验证Extension权限
   */
  private validatePermissions(permissions: ExtensionPermission[]): void {
    const validPermissions = new Set<ExtensionPermission>([
      'database:read',
      'database:write',
      'api:read',
      'api:write',
      'ui:render',
      'system:hooks',
    ])

    for (const permission of permissions) {
      if (!validPermissions.has(permission) && !permission.includes(':')) {
        throw new Error(`Invalid permission: ${permission}`)
      }
    }
  }

  /**
   * 清理所有注册
   */
  clear(): void {
    this.registrations.clear()
  }

  /**
   * 获取注册统计
   */
  getStats() {
    const all = Array.from(this.registrations.values())
    const extensions = all.filter(reg => reg.isExtension)
    const plugins = all.filter(reg => !reg.isExtension)

    return {
      total: all.length,
      extensions: extensions.length,
      plugins: plugins.length,
      byCapability: {
        hasUI: extensions.filter(ext => ext.plugin.metadata.capabilities.hasUI).length,
        hasAPI: extensions.filter(ext => ext.plugin.metadata.capabilities.hasAPI).length,
        hasSchema: extensions.filter(ext => ext.plugin.metadata.capabilities.hasSchema).length,
        hasHooks: extensions.filter(ext => ext.plugin.metadata.capabilities.hasHooks).length,
      },
    }
  }
}

/**
 * 默认增强Plugin注册表实例
 */
export const enhancedPluginRegistry = new EnhancedPluginRegistry()
