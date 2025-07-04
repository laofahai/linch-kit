import { describe, it, expect, beforeEach, mock } from 'bun:test'
import type { Entity } from '@linch-kit/schema'
import type { LinchKitUser, IPermissionChecker as AuthPermissionChecker } from '@linch-kit/auth'
import type { PluginManager } from '@linch-kit/core'

import { PermissionChecker } from '../../permissions/permission-checker'
import { PermissionError } from '../../types'
import type { SchemaRegistry, Logger } from '../../types'


// Mock 依赖
const mockEntity: Entity = {
  name: 'TestEntity',
  fields: {
    id: { type: 'string', required: true },
    name: { type: 'string', required: true },
    email: { type: 'string', required: false },
    age: { type: 'number', required: false },
    secretField: { type: 'string', required: false },
    publicField: { type: 'string', required: false }
  },
  options: {
    softDelete: true
  },
  validate: async () => true,
  validateAndParse: (data: unknown) => data,
  validateCreate: (data: unknown) => data,
  validateUpdate: (data: unknown) => data,
  clone: () => mockEntity,
  extend: () => mockEntity,
  withOptions: () => mockEntity
}

const mockSchemaRegistry: SchemaRegistry = {
  getEntity: mock(() => mockEntity),
  register: mock(() => {}),
  getAll: mock(() => [mockEntity]),
  clear: mock(() => {}),
  createDynamicZodSchema: mock(() => ({})),
  createPrismaSchema: mock(() => ''),
  createGraphQLSchema: mock(() => ''),
  createJsonSchema: mock(() => ({})),
  createOpenapiSchema: mock(() => ({})),
  createTypescriptDefinition: mock(() => ''),
  createDtoSchema: mock(() => ({})),
  createUiSchema: mock(() => ({})),
  createFormSchema: mock(() => ({})),
  createTableSchema: mock(() => ({})),
  createValidationSchema: mock(() => ({})),
  createRulesSchema: mock(() => ({})),
  createSeederSchema: mock(() => ({}))
}

const mockLogger: Logger = {
  debug: mock(() => {}),
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
  trace: mock(() => {}),
  fatal: mock(() => {}),
  child: mock(() => mockLogger)
}

const mockUser: LinchKitUser = {
  id: 'user123',
  roles: ['user'],
  permissions: ['read:TestEntity', 'create:TestEntity']
}

const mockAdminUser: LinchKitUser = {
  id: 'admin123',
  roles: ['admin'],
  permissions: ['*']
}

const mockAuthPermissionChecker: AuthPermissionChecker = {
  check: mock(() => Promise.resolve(true)),
  getAccessibleResources: mock(() => Promise.resolve([{ id: '1' }, { id: '2' }])),
  canRead: mock(() => Promise.resolve(true)),
  canCreate: mock(() => Promise.resolve(true)),
  canUpdate: mock(() => Promise.resolve(true)),
  canDelete: mock(() => Promise.resolve(true))
}

const mockPlugin = {
  metadata: { id: 'test-plugin', version: '1.0.0' },
  'permission:checkCreate': mock(() => Promise.resolve(undefined)),
  'permission:checkRead': mock(() => Promise.resolve(undefined)),
  'permission:checkUpdate': mock(() => Promise.resolve(undefined)),
  'permission:checkDelete': mock(() => Promise.resolve(undefined)),
  'permission:checkField': mock(() => Promise.resolve(true)),
  'permission:buildRowFilter': mock(() => Promise.resolve({ customFilter: 'value' }))
}

const mockPluginManager: PluginManager = {
  register: mock(() => {}),
  unregister: mock(() => {}),
  get: mock(() => null),
  getAll: mock(() => [{ plugin: mockPlugin }]),
  clear: mock(() => {}),
  initialize: mock(() => Promise.resolve()),
  shutdown: mock(() => Promise.resolve())
}

describe('PermissionChecker', () => {
  let permissionChecker: PermissionChecker
  let schemaRegistry: SchemaRegistry
  let logger: Logger
  let authPermissionChecker: AuthPermissionChecker
  let pluginManager: PluginManager

  beforeEach(() => {
    schemaRegistry = mockSchemaRegistry
    logger = mockLogger
    authPermissionChecker = mockAuthPermissionChecker
    pluginManager = mockPluginManager
    permissionChecker = new PermissionChecker(
      schemaRegistry,
      logger,
      authPermissionChecker,
      pluginManager
    )
  })

  describe('Construction', () => {
    it('should create instance with all parameters', () => {
      expect(permissionChecker).toBeDefined()
    })

    it('should create instance without auth checker', () => {
      const checker = new PermissionChecker(schemaRegistry, logger)
      expect(checker).toBeDefined()
    })

    it('should create instance without plugin manager', () => {
      const checker = new PermissionChecker(schemaRegistry, logger, authPermissionChecker)
      expect(checker).toBeDefined()
    })
  })

  describe('Create Permission Checks', () => {
    it('should allow create when user has permission', async () => {
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(true))
      
      await expect(
        permissionChecker.checkCreate(mockEntity, mockUser, { name: 'Test', age: 25 })
      ).resolves.toBeUndefined()
      
      expect(mockAuthPermissionChecker.check).toHaveBeenCalledWith(
        mockUser,
        'create',
        'TestEntity'
      )
    })

    it('should deny create when user lacks permission', async () => {
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(false))
      
      await expect(
        permissionChecker.checkCreate(mockEntity, mockUser, { name: 'Test' })
      ).rejects.toThrow(PermissionError)
      
      await expect(
        permissionChecker.checkCreate(mockEntity, mockUser, { name: 'Test' })
      ).rejects.toThrow('No permission to create TestEntity')
    })

    it('should check field permissions during create', async () => {
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(true))
      
      await permissionChecker.checkCreate(mockEntity, mockUser, { 
        name: 'Test',
        email: 'test@example.com'
      })
      
      expect(mockPlugin['permission:checkField']).toHaveBeenCalled()
    })

    it('should run plugin hooks for create', async () => {
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(true))
      
      await permissionChecker.checkCreate(mockEntity, mockUser, { name: 'Test' })
      
      expect(mockPlugin['permission:checkCreate']).toHaveBeenCalledWith({
        entity: mockEntity,
        user: mockUser,
        data: { name: 'Test' }
      })
    })

    it('should handle auth checker errors gracefully', async () => {
      mockAuthPermissionChecker.check = mock(() => Promise.reject(new Error('Auth error')))
      
      await expect(
        permissionChecker.checkCreate(mockEntity, mockUser, { name: 'Test' })
      ).rejects.toThrow(PermissionError)
      
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('Read Permission Checks', () => {
    it('should allow read when user has permission', async () => {
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(true))
      
      await expect(
        permissionChecker.checkRead(mockEntity, mockUser)
      ).resolves.toBeUndefined()
    })

    it('should deny read when user lacks permission', async () => {
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(false))
      
      await expect(
        permissionChecker.checkRead(mockEntity, mockUser)
      ).rejects.toThrow('No permission to read TestEntity')
    })

    it('should check row-level permissions when resource provided', async () => {
      mockAuthPermissionChecker.check = mock()
        .mockResolvedValueOnce(true) // entity permission
        .mockResolvedValueOnce(true) // row permission
      
      const resource = { id: '1', name: 'Test' }
      await permissionChecker.checkRead(mockEntity, mockUser, resource)
      
      expect(mockAuthPermissionChecker.check).toHaveBeenCalledTimes(2)
      expect(mockAuthPermissionChecker.check).toHaveBeenNthCalledWith(
        2,
        mockUser,
        'read',
        resource
      )
    })

    it('should deny read when row permission fails', async () => {
      mockAuthPermissionChecker.check = mock()
        .mockResolvedValueOnce(true) // entity permission
        .mockResolvedValueOnce(false) // row permission
      
      const resource = { id: '1', name: 'Test' }
      await expect(
        permissionChecker.checkRead(mockEntity, mockUser, resource)
      ).rejects.toThrow('No permission to read this TestEntity record')
    })

    it('should run plugin hooks for read', async () => {
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(true))
      
      await permissionChecker.checkRead(mockEntity, mockUser)
      
      expect(mockPlugin['permission:checkRead']).toHaveBeenCalled()
    })
  })

  describe('Update Permission Checks', () => {
    const resource = { id: '1', name: 'Original' }
    const data = { name: 'Updated' }

    it('should allow update when user has permission', async () => {
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(true))
      
      await expect(
        permissionChecker.checkUpdate(mockEntity, mockUser, resource, data)
      ).resolves.toBeUndefined()
    })

    it('should deny update when user lacks entity permission', async () => {
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(false))
      
      await expect(
        permissionChecker.checkUpdate(mockEntity, mockUser, resource, data)
      ).rejects.toThrow('No permission to update TestEntity')
    })

    it('should deny update when user lacks row permission', async () => {
      mockAuthPermissionChecker.check = mock()
        .mockResolvedValueOnce(true) // entity permission
        .mockResolvedValueOnce(false) // row permission
      
      await expect(
        permissionChecker.checkUpdate(mockEntity, mockUser, resource, data)
      ).rejects.toThrow('No permission to update this TestEntity record')
    })

    it('should check field permissions during update', async () => {
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(true))
      
      await permissionChecker.checkUpdate(mockEntity, mockUser, resource, data)
      
      expect(mockPlugin['permission:checkField']).toHaveBeenCalled()
    })

    it('should run plugin hooks for update', async () => {
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(true))
      
      await permissionChecker.checkUpdate(mockEntity, mockUser, resource, data)
      
      expect(mockPlugin['permission:checkUpdate']).toHaveBeenCalled()
    })
  })

  describe('Delete Permission Checks', () => {
    const resource = { id: '1', name: 'ToDelete' }

    it('should allow delete when user has permission', async () => {
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(true))
      
      await expect(
        permissionChecker.checkDelete(mockEntity, mockUser, resource)
      ).resolves.toBeUndefined()
    })

    it('should deny delete when user lacks entity permission', async () => {
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(false))
      
      await expect(
        permissionChecker.checkDelete(mockEntity, mockUser, resource)
      ).rejects.toThrow('No permission to delete TestEntity')
    })

    it('should deny delete when user lacks row permission', async () => {
      mockAuthPermissionChecker.check = mock()
        .mockResolvedValueOnce(true) // entity permission
        .mockResolvedValueOnce(false) // row permission
      
      await expect(
        permissionChecker.checkDelete(mockEntity, mockUser, resource)
      ).rejects.toThrow('No permission to delete this TestEntity record')
    })

    it('should run plugin hooks for delete', async () => {
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(true))
      
      await permissionChecker.checkDelete(mockEntity, mockUser, resource)
      
      expect(mockPlugin['permission:checkDelete']).toHaveBeenCalled()
    })
  })

  describe('Field Filtering', () => {
    const testData = [
      { id: '1', name: 'Test1', email: 'test1@example.com', secretField: 'secret1', publicField: 'public1' },
      { id: '2', name: 'Test2', email: 'test2@example.com', secretField: 'secret2', publicField: 'public2' }
    ]

    it('should filter fields based on permissions', async () => {
      // Mock plugin to deny access to secretField
      mockPlugin['permission:checkField'] = mock((context) => {
        return Promise.resolve(context.fieldName !== 'secretField')
      })
      
      const filtered = await permissionChecker.filterFields(mockEntity, mockUser, testData, 'read')
      
      expect(filtered).toHaveLength(2)
      expect(filtered[0]).toHaveProperty('id')
      expect(filtered[0]).toHaveProperty('name')
      expect(filtered[0]).toHaveProperty('publicField')
      expect(filtered[0]).not.toHaveProperty('secretField')
    })

    it('should include all fields when user has full permissions', async () => {
      mockPlugin['permission:checkField'] = mock(() => Promise.resolve(true))
      
      const filtered = await permissionChecker.filterFields(mockEntity, mockUser, testData, 'read')
      
      expect(filtered).toHaveLength(2)
      expect(filtered[0]).toHaveProperty('secretField')
      expect(filtered[1]).toHaveProperty('secretField')
    })

    it('should log filtered fields', async () => {
      mockPlugin['permission:checkField'] = mock(() => Promise.resolve(false))
      
      await permissionChecker.filterFields(mockEntity, mockUser, testData, 'read')
      
      expect(mockLogger.debug).toHaveBeenCalled()
    })

    it('should handle empty data array', async () => {
      const filtered = await permissionChecker.filterFields(mockEntity, mockUser, [], 'read')
      expect(filtered).toEqual([])
    })
  })

  describe('Row Filter Building', () => {
    it('should build basic filters for soft delete', async () => {
      const filters = await permissionChecker.buildRowFilter(mockEntity, mockUser, 'read')
      
      expect(filters).toHaveProperty('deletedAt', null)
    })

    it('should integrate with auth permission checker', async () => {
      mockAuthPermissionChecker.getAccessibleResources = mock(() => 
        Promise.resolve([{ id: '1' }, { id: '2' }, { id: '3' }])
      )
      
      const filters = await permissionChecker.buildRowFilter(mockEntity, mockUser, 'read')
      
      expect(filters).toHaveProperty('id')
      expect(filters.id).toEqual({ in: ['1', '2', '3'] })
      expect(mockAuthPermissionChecker.getAccessibleResources).toHaveBeenCalledWith(
        mockUser,
        'read',
        'TestEntity'
      )
    })

    it('should handle auth errors gracefully', async () => {
      mockAuthPermissionChecker.getAccessibleResources = mock(() => 
        Promise.reject(new Error('Auth service unavailable'))
      )
      
      const filters = await permissionChecker.buildRowFilter(mockEntity, mockUser, 'read')
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to get accessible resources from auth',
        expect.objectContaining({
          error: 'Auth service unavailable',
          entityName: 'TestEntity',
          userId: 'user123'
        })
      )
    })

    it('should merge plugin filters', async () => {
      mockPlugin['permission:buildRowFilter'] = mock(() => 
        Promise.resolve({ customFilter: 'customValue', userType: 'premium' })
      )
      
      const filters = await permissionChecker.buildRowFilter(mockEntity, mockUser, 'read')
      
      expect(filters).toHaveProperty('customFilter', 'customValue')
      expect(filters).toHaveProperty('userType', 'premium')
    })

    it('should convert write operation to update for auth', async () => {
      await permissionChecker.buildRowFilter(mockEntity, mockUser, 'write')
      
      expect(mockAuthPermissionChecker.getAccessibleResources).toHaveBeenCalledWith(
        mockUser,
        'update',
        'TestEntity'
      )
    })
  })

  describe('Field Permission Validation', () => {
    it('should reject required fields with missing values', async () => {
      const data = { email: 'test@example.com' } // missing required 'name'
      
      await expect(
        permissionChecker.checkCreate(mockEntity, mockUser, data)
      ).rejects.toThrow(PermissionError)
    })

    it('should allow optional fields with missing values', async () => {
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(true))
      mockPlugin['permission:checkField'] = mock(() => Promise.resolve(true))
      
      const data = { name: 'Test' } // missing optional 'email'
      
      await expect(
        permissionChecker.checkCreate(mockEntity, mockUser, data)
      ).resolves.toBeUndefined()
    })

    it('should handle non-object data gracefully', async () => {
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(true))
      
      await expect(
        permissionChecker.checkCreate(mockEntity, mockUser, null)
      ).resolves.toBeUndefined()
      
      await expect(
        permissionChecker.checkCreate(mockEntity, mockUser, 'string')
      ).resolves.toBeUndefined()
    })
  })

  describe('Plugin System Integration', () => {
    it('should handle missing plugin manager gracefully', async () => {
      const checkerWithoutPlugins = new PermissionChecker(
        schemaRegistry,
        logger,
        authPermissionChecker
      )
      
      await expect(
        checkerWithoutPlugins.checkCreate(mockEntity, mockUser, { name: 'Test' })
      ).resolves.toBeUndefined()
    })

    it('should handle plugin errors gracefully', async () => {
      mockPlugin['permission:checkCreate'] = mock(() => 
        Promise.reject(new Error('Plugin error'))
      )
      mockPlugin['permission:checkField'] = mock(() => Promise.resolve(true))
      
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(true))
      
      await permissionChecker.checkCreate(mockEntity, mockUser, { name: 'Test' })
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Plugin test-plugin hook permission:checkCreate failed',
        expect.any(Error),
        { pluginId: 'test-plugin', hookName: 'permission:checkCreate' }
      )
    })

    it('should skip plugins without the required hook', async () => {
      const pluginWithoutHook = { metadata: { id: 'simple-plugin', version: '1.0.0' } }
      mockPluginManager.getAll = mock(() => [{ plugin: pluginWithoutHook }])
      
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(true))
      
      await expect(
        permissionChecker.checkCreate(mockEntity, mockUser, { name: 'Test' })
      ).resolves.toBeUndefined()
    })

    it('should return plugin hook results', async () => {
      // Create a fresh permission checker with updated plugin
      const pluginWithCustomFilter = {
        ...mockPlugin,
        'permission:buildRowFilter': mock(() => 
          Promise.resolve({ pluginSpecificFilter: 'value' })
        )
      }
      
      const customPluginManager: PluginManager = {
        ...mockPluginManager,
        getAll: mock(() => [{ plugin: pluginWithCustomFilter }])
      }
      
      const customChecker = new PermissionChecker(
        schemaRegistry,
        logger,
        authPermissionChecker,
        customPluginManager
      )
      
      const filters = await customChecker.buildRowFilter(mockEntity, mockUser, 'read')
      
      expect(filters).toHaveProperty('pluginSpecificFilter', 'value')
    })
  })

  describe('No Auth Checker Scenarios', () => {
    let noAuthChecker: PermissionChecker

    beforeEach(() => {
      noAuthChecker = new PermissionChecker(schemaRegistry, logger)
    })

    it('should allow all operations when no auth checker configured', async () => {
      await expect(
        noAuthChecker.checkCreate(mockEntity, mockUser, { name: 'Test' })
      ).resolves.toBeUndefined()
      
      await expect(
        noAuthChecker.checkRead(mockEntity, mockUser)
      ).resolves.toBeUndefined()
      
      await expect(
        noAuthChecker.checkUpdate(mockEntity, mockUser, { id: '1' }, { name: 'Updated' })
      ).resolves.toBeUndefined()
      
      await expect(
        noAuthChecker.checkDelete(mockEntity, mockUser, { id: '1' })
      ).resolves.toBeUndefined()
    })

    it('should log warnings when no auth checker configured', async () => {
      await noAuthChecker.checkCreate(mockEntity, mockUser, { name: 'Test' })
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No auth permission checker configured, allowing access',
        expect.objectContaining({
          userId: 'user123',
          entityName: 'TestEntity',
          operation: 'create'
        })
      )
    })

    it('should build basic filters without auth integration', async () => {
      const filters = await noAuthChecker.buildRowFilter(mockEntity, mockUser, 'read')
      
      expect(filters).toHaveProperty('deletedAt', null)
      expect(filters).not.toHaveProperty('id')
    })
  })

  describe('Error Handling', () => {
    it('should create PermissionError with correct properties', async () => {
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(false))
      
      try {
        await permissionChecker.checkCreate(mockEntity, mockUser, { name: 'Test' })
      } catch (error) {
        expect(error).toBeInstanceOf(PermissionError)
        expect(error.message).toBe('No permission to create TestEntity')
        expect(error.operation).toBe('create')
        expect(error.resource).toBe('TestEntity')
      }
    })

    it('should handle field permission errors', async () => {
      mockAuthPermissionChecker.check = mock(() => Promise.resolve(true))
      mockPlugin['permission:checkField'] = mock(() => Promise.resolve(false))
      
      try {
        await permissionChecker.checkCreate(mockEntity, mockUser, { name: 'Test' })
      } catch (error) {
        expect(error).toBeInstanceOf(PermissionError)
        expect(error.message).toContain('No permission to write field')
      }
    })
  })
})