/**
 * @ai-context 配置管理命令集合
 * @ai-purpose 提供配置查看、设置和验证功能
 * @ai-user-experience 友好的配置管理界面
 */

import type { CommandMetadata, CLIContext } from '../../types/cli'
import { ConfigManager } from '../core/config-manager'

/**
 * @ai-function 显示配置命令处理器
 * @ai-purpose 显示当前的配置信息
 * @ai-parameter context: CLIContext - CLI 上下文
 */
async function handleConfigShow(context: CLIContext): Promise<void> {
  const configManager = ConfigManager.getInstance()
  
  try {
    const config = await configManager.loadConfig()
    
    console.log('📋 Current Configuration:')
    console.log('========================\n')
    
    // AI: 格式化显示配置
    console.log(JSON.stringify(config, null, 2))
    
    console.log('\n📊 Configuration Sources:')
    const providers = configManager.getRegisteredProviders()
    providers.forEach(provider => {
      console.log(`   - ${provider.name} (priority: ${provider.priority})`)
    })
    
    console.log('\n🔧 Registered Schemas:')
    const schemas = configManager.getRegisteredSchemas()
    schemas.forEach(schema => {
      console.log(`   - ${schema.name}: ${schema.description || 'No description'}`)
    })
    
  } catch (error) {
    console.error('❌ Failed to load configuration:', error)
    process.exit(1)
  }
}

/**
 * @ai-function 设置配置命令处理器
 * @ai-purpose 设置配置值
 * @ai-parameter context: CLIContext - CLI 上下文
 */
async function handleConfigSet(context: CLIContext): Promise<void> {
  const { args } = context
  const key = args?.[0] as string
  const value = args?.[1] as string
  
  if (!key || !value) {
    console.error('❌ Usage: linch config:set <key> <value>')
    process.exit(1)
  }
  
  console.log(`🔧 Setting configuration: ${key} = ${value}`)
  console.log('💡 Note: This is a placeholder implementation')
  console.log('   In a full implementation, this would update the config file')
}

/**
 * @ai-function 获取配置命令处理器
 * @ai-purpose 获取特定配置值
 * @ai-parameter context: CLIContext - CLI 上下文
 */
async function handleConfigGet(context: CLIContext): Promise<void> {
  const { args } = context
  const key = args?.[0] as string
  
  if (!key) {
    console.error('❌ Usage: linch config:get <key>')
    process.exit(1)
  }
  
  const configManager = ConfigManager.getInstance()
  
  try {
    const config = await configManager.loadConfig()
    
    // AI: 支持点号分隔的路径
    const value = getNestedValue(config, key)
    
    if (value !== undefined) {
      console.log(`📋 ${key}:`)
      if (typeof value === 'object') {
        console.log(JSON.stringify(value, null, 2))
      } else {
        console.log(value)
      }
    } else {
      console.log(`❌ Configuration key '${key}' not found`)
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Failed to get configuration:', error)
    process.exit(1)
  }
}

/**
 * @ai-function 验证配置命令处理器
 * @ai-purpose 验证当前配置的有效性
 * @ai-parameter context: CLIContext - CLI 上下文
 */
async function handleConfigValidate(context: CLIContext): Promise<void> {
  const configManager = ConfigManager.getInstance()
  
  try {
    console.log('🔍 Validating configuration...')
    
    const config = await configManager.loadConfig()
    
    console.log('✅ Configuration is valid!')
    
    // AI: 显示验证统计
    const schemas = configManager.getRegisteredSchemas()
    console.log(`\n📊 Validation Summary:`)
    console.log(`   - ${schemas.length} schemas registered`)
    console.log(`   - ${Object.keys(config).length} configuration sections`)
    
  } catch (error) {
    console.error('❌ Configuration validation failed:', error)
    process.exit(1)
  }
}

/**
 * @ai-function 获取嵌套对象值
 * @ai-purpose 通过点号分隔的路径获取嵌套对象的值
 * @ai-parameter obj: any - 目标对象
 * @ai-parameter path: string - 点号分隔的路径
 * @ai-return any - 找到的值或 undefined
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

/**
 * @ai-export 配置管理命令集合
 * @ai-purpose 导出所有配置相关命令
 */
export const configCommands = {
  show: {
    description: 'Show current configuration',
    handler: handleConfigShow,
    examples: [
      'linch config:show'
    ],
    category: 'config',
    aiTags: ['configuration', 'display', 'debug']
  } as CommandMetadata,

  set: {
    description: 'Set a configuration value',
    handler: handleConfigSet,
    arguments: [
      {
        name: 'key',
        description: 'Configuration key (supports dot notation)',
        required: true
      },
      {
        name: 'value',
        description: 'Configuration value',
        required: true
      }
    ],
    examples: [
      'linch config:set database.provider postgresql',
      'linch config:set project.name my-app'
    ],
    category: 'config',
    aiTags: ['configuration', 'modify', 'settings']
  } as CommandMetadata,

  get: {
    description: 'Get a configuration value',
    handler: handleConfigGet,
    arguments: [
      {
        name: 'key',
        description: 'Configuration key (supports dot notation)',
        required: true
      }
    ],
    examples: [
      'linch config:get database.provider',
      'linch config:get project'
    ],
    category: 'config',
    aiTags: ['configuration', 'query', 'display']
  } as CommandMetadata,

  validate: {
    description: 'Validate current configuration',
    handler: handleConfigValidate,
    examples: [
      'linch config:validate'
    ],
    category: 'config',
    aiTags: ['configuration', 'validation', 'check']
  } as CommandMetadata
}
