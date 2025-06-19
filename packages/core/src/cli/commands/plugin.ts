/**
 * @ai-context 插件管理命令集合
 * @ai-purpose 提供插件发现、安装、卸载和信息查看功能
 * @ai-user-experience 友好的插件管理界面
 */

import type { CommandMetadata, CLIContext } from '../../types/cli'
import { PluginLoader } from '../core/plugin-loader'

/**
 * @ai-function 列出插件命令处理器
 * @ai-purpose 显示所有已发现和已加载的插件
 * @ai-parameter context: CLIContext - CLI 上下文
 */
async function handlePluginList(context: CLIContext): Promise<void> {
  const pluginLoader = PluginLoader.getInstance()
  const { args = [] } = context
  const options = args[args.length - 1] || {}
  const verbose = options.verbose || context.verbose || false
  const loadedOnly = options.loadedOnly || false
  const discoveredOnly = options.discoveredOnly || false

  try {
    console.log('🔍 Discovering plugins...')

    // AI: 发现所有插件
    const discoveryResult = await pluginLoader.discoverPlugins()

    if (!loadedOnly) {
      console.log('\n📦 Discovered Plugins:')
      console.log('=====================\n')

      if (discoveryResult.plugins.length === 0) {
        console.log('   No plugins found')
      } else {
        discoveryResult.plugins.forEach(plugin => {
          console.log(`📋 ${plugin.name}@${plugin.version}`)
          if (plugin.description) {
            console.log(`   ${plugin.description}`)
          }
          if (verbose) {
            if (plugin.dependencies && plugin.dependencies.length > 0) {
              console.log(`   Dependencies: ${plugin.dependencies.join(', ')}`)
            }
            if (plugin.cliVersionRange) {
              console.log(`   CLI Version Range: ${plugin.cliVersionRange}`)
            }
          }
          if (plugin.aiTags && plugin.aiTags.length > 0) {
            console.log(`   AI Tags: ${plugin.aiTags.join(', ')}`)
          }
          console.log()
        })
      }
    }

    if (!discoveredOnly) {
      // AI: 显示已加载的插件
      const loadedPlugins = pluginLoader.getLoadedPlugins()
      console.log('🚀 Loaded Plugins:')
      console.log('==================\n')

      if (loadedPlugins.length === 0) {
        console.log('   No plugins loaded')
      } else {
        loadedPlugins.forEach(plugin => {
          console.log(`✅ ${plugin.name}@${plugin.version}`)
          if (verbose && plugin.description) {
            console.log(`   ${plugin.description}`)
          }
        })
      }
    }

    // AI: 显示发现统计
    console.log('\n📊 Discovery Statistics:')
    console.log(`   - ${discoveryResult.plugins.length} plugins discovered`)
    console.log(`   - ${pluginLoader.getLoadedPlugins().length} plugins loaded`)
    console.log(`   - ${discoveryResult.errors.length} errors encountered`)
    console.log(`   - ${discoveryResult.discoveryTime}ms discovery time`)
    console.log(`   - ${discoveryResult.scannedPaths.length} paths scanned`)

    // AI: 显示详细信息（仅在 verbose 模式下）
    if (verbose) {
      console.log('\n🔍 Scanned Paths:')
      discoveryResult.scannedPaths.forEach(path => {
        console.log(`   - ${path}`)
      })
    }

    // AI: 显示错误信息
    if (discoveryResult.errors.length > 0) {
      console.log('\n❌ Discovery Errors:')
      discoveryResult.errors.forEach(error => {
        console.log(`   - ${error.pluginPath}: ${error.error}`)
      })
    }

  } catch (error) {
    console.error('❌ Failed to list plugins:', error)
    process.exit(1)
  }
}

/**
 * @ai-function 安装插件命令处理器
 * @ai-purpose 安装指定的插件
 * @ai-parameter context: CLIContext - CLI 上下文
 */
async function handlePluginInstall(context: CLIContext): Promise<void> {
  const { args } = context
  const pluginName = args?.[0] as string
  
  if (!pluginName) {
    console.error('❌ Usage: linch plugin:install <plugin-name>')
    process.exit(1)
  }
  
  console.log(`📦 Installing plugin: ${pluginName}`)
  console.log('💡 Note: This is a placeholder implementation')
  console.log('   In a full implementation, this would:')
  console.log('   1. Download the plugin from npm')
  console.log('   2. Install dependencies')
  console.log('   3. Register the plugin')
  console.log('   4. Update configuration')
}

/**
 * @ai-function 卸载插件命令处理器
 * @ai-purpose 卸载指定的插件
 * @ai-parameter context: CLIContext - CLI 上下文
 */
async function handlePluginUninstall(context: CLIContext): Promise<void> {
  const { args } = context
  const pluginName = args?.[0] as string
  
  if (!pluginName) {
    console.error('❌ Usage: linch plugin:uninstall <plugin-name>')
    process.exit(1)
  }
  
  console.log(`🗑️  Uninstalling plugin: ${pluginName}`)
  console.log('💡 Note: This is a placeholder implementation')
  console.log('   In a full implementation, this would:')
  console.log('   1. Unregister the plugin')
  console.log('   2. Remove plugin files')
  console.log('   3. Clean up dependencies')
  console.log('   4. Update configuration')
}

/**
 * @ai-function 插件信息命令处理器
 * @ai-purpose 显示指定插件的详细信息
 * @ai-parameter context: CLIContext - CLI 上下文
 */
async function handlePluginInfo(context: CLIContext): Promise<void> {
  const { args } = context
  const pluginName = args?.[0] as string
  
  if (!pluginName) {
    console.error('❌ Usage: linch plugin:info <plugin-name>')
    process.exit(1)
  }
  
  const pluginLoader = PluginLoader.getInstance()
  
  try {
    // AI: 发现插件
    const discoveryResult = await pluginLoader.discoverPlugins()
    const plugin = discoveryResult.plugins.find(p => p.name === pluginName)
    
    if (!plugin) {
      console.error(`❌ Plugin '${pluginName}' not found`)
      process.exit(1)
    }
    
    console.log(`📋 Plugin Information: ${plugin.name}`)
    console.log('=====================================\n')
    
    console.log(`Name: ${plugin.name}`)
    console.log(`Version: ${plugin.version}`)
    
    if (plugin.description) {
      console.log(`Description: ${plugin.description}`)
    }
    
    if (plugin.dependencies && plugin.dependencies.length > 0) {
      console.log(`Dependencies: ${plugin.dependencies.join(', ')}`)
    }
    
    if (plugin.cliVersionRange) {
      console.log(`CLI Version Range: ${plugin.cliVersionRange}`)
    }
    
    if (plugin.aiTags && plugin.aiTags.length > 0) {
      console.log(`AI Tags: ${plugin.aiTags.join(', ')}`)
    }
    
    // AI: 检查是否已加载
    const loadedPlugins = pluginLoader.getLoadedPlugins()
    const isLoaded = loadedPlugins.some(p => p.name === plugin.name)
    console.log(`Status: ${isLoaded ? '✅ Loaded' : '⏸️  Not Loaded'}`)
    
    // AI: 显示插件提供的功能
    console.log('\n🔧 Plugin Capabilities:')
    console.log('   - Command registration: ✅')
    if (plugin.init) {
      console.log('   - Initialization hook: ✅')
    }
    if (plugin.cleanup) {
      console.log('   - Cleanup hook: ✅')
    }
    
  } catch (error) {
    console.error('❌ Failed to get plugin info:', error)
    process.exit(1)
  }
}

/**
 * @ai-export 插件管理命令集合
 * @ai-purpose 导出所有插件相关命令
 */
export const pluginCommands = {
  'plugin:list': {
    description: 'List all discovered and loaded plugins',
    handler: handlePluginList,
    options: [
      {
        flags: '-v, --verbose',
        description: 'Show detailed plugin information'
      },
      {
        flags: '--loaded-only',
        description: 'Show only loaded plugins'
      },
      {
        flags: '--discovered-only',
        description: 'Show only discovered plugins'
      }
    ],
    examples: [
      'linch plugin:list',
      'linch plugin:list --verbose',
      'linch plugin:list --loaded-only'
    ],
    category: 'plugin',
    aiTags: ['plugin', 'list', 'discovery', 'management']
  } as CommandMetadata,

  'plugin:install': {
    description: 'Install a plugin',
    handler: handlePluginInstall,
    arguments: [
      {
        name: 'plugin-name',
        description: 'Name of the plugin to install',
        required: true
      }
    ],
    options: [
      {
        flags: '--version <version>',
        description: 'Specific version to install'
      },
      {
        flags: '--dev',
        description: 'Install as development dependency'
      }
    ],
    examples: [
      'linch plugin:install @linch-kit/plugin-auth',
      'linch plugin:install my-custom-plugin --version 1.2.0'
    ],
    category: 'plugin',
    aiTags: ['plugin', 'install', 'package-management']
  } as CommandMetadata,

  'plugin:uninstall': {
    description: 'Uninstall a plugin',
    handler: handlePluginUninstall,
    arguments: [
      {
        name: 'plugin-name',
        description: 'Name of the plugin to uninstall',
        required: true
      }
    ],
    examples: [
      'linch plugin:uninstall @linch-kit/plugin-auth',
      'linch plugin:uninstall my-custom-plugin'
    ],
    category: 'plugin',
    aiTags: ['plugin', 'uninstall', 'package-management']
  } as CommandMetadata,

  'plugin:info': {
    description: 'Show detailed information about a plugin',
    handler: handlePluginInfo,
    arguments: [
      {
        name: 'plugin-name',
        description: 'Name of the plugin to inspect',
        required: true
      }
    ],
    examples: [
      'linch plugin:info @linch-kit/plugin-auth',
      'linch plugin:info my-custom-plugin'
    ],
    category: 'plugin',
    aiTags: ['plugin', 'info', 'inspection', 'details']
  } as CommandMetadata
}
