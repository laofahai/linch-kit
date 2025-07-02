import { describe, it, expect, vi } from 'vitest';
import { createMinimalCrudManager } from './factory';
import { CrudManager } from './core/crud-manager';

describe('createMinimalCrudManager', () => {
  it('should create a CrudManager instance with minimal options', () => {
    const mockPrisma = {} as any; // Mock PrismaClient
    const mockSchemaRegistry = {} as any; // Mock SchemaRegistry
    const mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as any; // Mock Logger

    const crudManager = createMinimalCrudManager(mockPrisma, mockSchemaRegistry, mockLogger);

    expect(crudManager).toBeInstanceOf(CrudManager);
    // 验证最小化配置
    // @ts-ignore - 访问私有属性进行测试
    expect(crudManager.options.enablePermissions).toBe(false);
    // @ts-ignore
    expect(crudManager.options.enableValidation).toBe(false);
    // @ts-ignore
    expect(crudManager.options.enableCache).toBe(false);
    // @ts-ignore
    expect(crudManager.options.enableAudit).toBe(false);
    // @ts-ignore
    expect(crudManager.options.enableMetrics).toBe(false);
  });
});
