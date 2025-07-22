/**
 * @linch-kit/schema Migration Migrator 测试套件
 */

import { describe, it, expect, mock } from 'bun:test'
import { SchemaMigrator } from '../migration/migrator'

describe('SchemaMigrator', () => {
  describe('基础功能', () => {
    it('应该创建迁移器实例', () => {
      const migrator = new SchemaMigrator()
      expect(migrator).toBeInstanceOf(SchemaMigrator)
    })

    it('应该有migrate方法', () => {
      const migrator = new SchemaMigrator()
      expect(typeof migrator.migrate).toBe('function')
    })
  })

  describe('迁移功能', () => {
    it('应该执行迁移并打印版本', async () => {
      const migrator = new SchemaMigrator()

      // Mock console.log
      const originalLog = console.log
      const logMock = mock()
      console.log = logMock

      await migrator.migrate('1.0.0')

      expect(logMock).toHaveBeenCalledWith('迁移到版本: 1.0.0')

      // 恢复原始 console.log
      console.log = originalLog
    })

    it('应该处理不同版本号', async () => {
      const migrator = new SchemaMigrator()

      // Mock console.log
      const originalLog = console.log
      const logMock = mock()
      console.log = logMock

      await migrator.migrate('2.1.5-beta')

      expect(logMock).toHaveBeenCalledWith('迁移到版本: 2.1.5-beta')

      // 恢复原始 console.log
      console.log = originalLog
    })

    it('应该返回Promise<void>', async () => {
      const migrator = new SchemaMigrator()
      const result = migrator.migrate('1.0.0')

      expect(result).toBeInstanceOf(Promise)
      await expect(result).resolves.toBeUndefined()
    })

    it('应该处理空字符串版本', async () => {
      const migrator = new SchemaMigrator()

      // Mock console.log
      const originalLog = console.log
      const logMock = mock()
      console.log = logMock

      await migrator.migrate('')

      expect(logMock).toHaveBeenCalledWith('迁移到版本: ')

      // 恢复原始 console.log
      console.log = originalLog
    })
  })

  describe('错误处理', () => {
    it('应该处理null版本号', async () => {
      const migrator = new SchemaMigrator()

      // Mock console.log
      const originalLog = console.log
      const logMock = mock()
      console.log = logMock

      await migrator.migrate(null as any)

      expect(logMock).toHaveBeenCalledWith('迁移到版本: null')

      // 恢复原始 console.log
      console.log = originalLog
    })

    it('应该处理undefined版本号', async () => {
      const migrator = new SchemaMigrator()

      // Mock console.log
      const originalLog = console.log
      const logMock = mock()
      console.log = logMock

      await migrator.migrate(undefined as any)

      expect(logMock).toHaveBeenCalledWith('迁移到版本: undefined')

      // 恢复原始 console.log
      console.log = originalLog
    })
  })
})