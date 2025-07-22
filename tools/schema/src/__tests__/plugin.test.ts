/**
 * @linch-kit/schema Plugin 测试套件
 */

import { describe, it, expect, mock } from 'bun:test'
import { schemaPlugin, type SchemaPluginConfig } from '../plugin'

describe('schemaPlugin', () => {
  describe('基础功能', () => {
    it('应该创建默认插件', () => {
      const plugin = schemaPlugin()

      expect(plugin.name).toBe('schema')
      expect(plugin.version).toBe('0.1.0')
      expect(plugin.description).toBe('LinchKit Schema 插件')
    })

    it('应该有必要的属性', () => {
      const plugin = schemaPlugin()

      expect(plugin).toHaveProperty('name')
      expect(plugin).toHaveProperty('version')
      expect(plugin).toHaveProperty('description')
      expect(plugin).toHaveProperty('initialize')
      expect(plugin).toHaveProperty('config')
      expect(plugin).toHaveProperty('services')
      expect(plugin).toHaveProperty('hooks')
    })

    it('应该有初始化函数', () => {
      const plugin = schemaPlugin()

      expect(typeof plugin.initialize).toBe('function')
    })
  })

  describe('默认配置', () => {
    it('应该使用默认配置', () => {
      const plugin = schemaPlugin()

      expect(plugin.config.autoMigration).toBe(false)
      expect(plugin.config.enableValidation).toBe(true)
      expect(plugin.config.generators).toEqual(['prisma', 'typescript'])
    })

    it('应该处理空配置对象', () => {
      const plugin = schemaPlugin({})

      expect(plugin.config.autoMigration).toBe(false)
      expect(plugin.config.enableValidation).toBe(true)
      expect(plugin.config.generators).toEqual(['prisma', 'typescript'])
    })
  })

  describe('自定义配置', () => {
    it('应该接受自定义autoMigration配置', () => {
      const config: SchemaPluginConfig = {
        autoMigration: true,
      }
      const plugin = schemaPlugin(config)

      expect(plugin.config.autoMigration).toBe(true)
      expect(plugin.config.enableValidation).toBe(true) // 默认值
      expect(plugin.config.generators).toEqual(['prisma', 'typescript']) // 默认值
    })

    it('应该接受自定义enableValidation配置', () => {
      const config: SchemaPluginConfig = {
        enableValidation: false,
      }
      const plugin = schemaPlugin(config)

      expect(plugin.config.autoMigration).toBe(false) // 默认值
      expect(plugin.config.enableValidation).toBe(false)
      expect(plugin.config.generators).toEqual(['prisma', 'typescript']) // 默认值
    })

    it('应该接受自定义generators配置', () => {
      const config: SchemaPluginConfig = {
        generators: ['prisma'],
      }
      const plugin = schemaPlugin(config)

      expect(plugin.config.autoMigration).toBe(false) // 默认值
      expect(plugin.config.enableValidation).toBe(true) // 默认值
      expect(plugin.config.generators).toEqual(['prisma'])
    })

    it('应该接受完整自定义配置', () => {
      const config: SchemaPluginConfig = {
        autoMigration: true,
        enableValidation: false,
        generators: ['typescript', 'zod', 'prisma'],
      }
      const plugin = schemaPlugin(config)

      expect(plugin.config.autoMigration).toBe(true)
      expect(plugin.config.enableValidation).toBe(false)
      expect(plugin.config.generators).toEqual(['typescript', 'zod', 'prisma'])
    })

    it('应该处理空generators数组', () => {
      const config: SchemaPluginConfig = {
        generators: [],
      }
      const plugin = schemaPlugin(config)

      expect(plugin.config.generators).toEqual([])
    })
  })

  describe('初始化功能', () => {
    it('应该执行初始化并打印消息', async () => {
      const plugin = schemaPlugin()

      // Mock console.log
      const originalLog = console.log
      const logMock = mock()
      console.log = logMock

      await plugin.initialize()

      expect(logMock).toHaveBeenCalledWith('Schema 插件已初始化')

      // 恢复原始 console.log
      console.log = originalLog
    })

    it('初始化应该是异步函数', () => {
      const plugin = schemaPlugin()
      const result = plugin.initialize()

      expect(result).toBeInstanceOf(Promise)
    })

    it('初始化应该可以多次调用', async () => {
      const plugin = schemaPlugin()

      // Mock console.log
      const originalLog = console.log
      const logMock = mock()
      console.log = logMock

      await plugin.initialize()
      await plugin.initialize()
      await plugin.initialize()

      expect(logMock).toHaveBeenCalledTimes(3)
      expect(logMock).toHaveBeenCalledWith('Schema 插件已初始化')

      // 恢复原始 console.log
      console.log = originalLog
    })
  })

  describe('插件结构', () => {
    it('应该有services对象', () => {
      const plugin = schemaPlugin()

      expect(plugin.services).toEqual({})
      expect(typeof plugin.services).toBe('object')
    })

    it('应该有hooks对象', () => {
      const plugin = schemaPlugin()

      expect(plugin.hooks).toEqual({})
      expect(typeof plugin.hooks).toBe('object')
    })
  })

  describe('类型安全性', () => {
    it('应该接受有效的配置类型', () => {
      // 这些应该能正常编译
      schemaPlugin()
      schemaPlugin({})
      schemaPlugin({ autoMigration: true })
      schemaPlugin({ enableValidation: false })
      schemaPlugin({ generators: [] })
      schemaPlugin({
        autoMigration: true,
        enableValidation: false,
        generators: ['prisma', 'typescript'],
      })
    })
  })

  describe('边缘情况', () => {
    it('应该处理undefined配置值', () => {
      const config: SchemaPluginConfig = {
        autoMigration: undefined,
        enableValidation: undefined,
        generators: undefined,
      }
      const plugin = schemaPlugin(config)

      // undefined应该使用默认值
      expect(plugin.config.autoMigration).toBe(false)
      expect(plugin.config.enableValidation).toBe(true)
      expect(plugin.config.generators).toEqual(['prisma', 'typescript'])
    })

    it('应该保持插件元数据不变', () => {
      const plugin1 = schemaPlugin({ autoMigration: true })
      const plugin2 = schemaPlugin({ enableValidation: false })

      // 插件元数据应该相同
      expect(plugin1.name).toBe(plugin2.name)
      expect(plugin1.version).toBe(plugin2.version)
      expect(plugin1.description).toBe(plugin2.description)
    })
  })
})