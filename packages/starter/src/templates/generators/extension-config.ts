import type { ExtensionIntegration } from '../../types'

/**
 * Generate extension configuration based on installed extensions
 */
export function generateExtensionConfig(extensions: ExtensionIntegration[]): string {
  if (extensions.length === 0) {
    return `/**
 * LinchKit Starter 扩展配置
 * 当前无扩展启用
 */
export const extensionConfig = {
  extensions: [],
  registry: {},
}

export default extensionConfig`
  }

  return `/**
 * LinchKit Starter 扩展配置
 * 自动生成的扩展集成配置
 */

export const extensionConfig = {
  // 已启用的扩展
  extensions: [
${extensions.map(ext => `    {
      name: '${ext.name}',
      version: '${ext.version}',
      enabled: ${ext.enabled},
      config: ${JSON.stringify(ext.config, null, 6)},
    },`).join('\n')}
  ],
  
  // 扩展注册表
  registry: {
${extensions.map(ext => `    '${ext.name}': () => import('@linch-kit/${ext.name}'),`).join('\n')}
  },
  
  // 扩展加载配置
  loading: {
    eager: ['console', 'auth'], // 预加载的扩展
    lazy: [${extensions.filter(ext => !['console', 'auth'].includes(ext.name)).map(ext => `'${ext.name}'`).join(', ')}], // 按需加载的扩展
  },
}

export default extensionConfig`
}