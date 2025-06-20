# Linch Kit 验证策略提示词

## 目的
指导AI助手进行Linch Kit项目的全面验证，确保系统的正确性、稳定性和性能。

## 验证层次

### 1. 类型验证
- TypeScript编译时检查
- 运行时类型验证
- Schema验证
- API接口验证

### 2. 功能验证
- 单元测试
- 集成测试
- 端到端测试
- 用户验收测试

### 3. 性能验证
- 响应时间测试
- 并发测试
- 内存使用测试
- 数据库性能测试

### 4. 安全验证
- 输入验证测试
- 权限控制测试
- SQL注入测试
- XSS防护测试

## CLI命令验证

### 验证checklist
```bash
# 1. 基础命令测试
linch --help
linch --version
linch init --help

# 2. 项目初始化测试
linch init test-project
cd test-project
npm install

# 3. Schema系统测试
linch schema:list
linch schema:generate:prisma
linch schema:validate

# 4. 开发工具测试
linch dev --help
linch build --help
linch test --help

# 5. 插件系统测试
linch plugin:list
linch plugin:info @linch-kit/schema
```

### 预期结果验证
```typescript
interface ValidationResult {
  command: string
  status: 'success' | 'error'
  output: string
  expectedPatterns: string[]
  actualMatches: boolean[]
  issues: string[]
}
```

## 实体系统验证

### 1. 实体定义验证
```typescript
// 验证实体装饰器
const entityMetadata = getEntityMetadata(Product)
expect(entityMetadata.name).toBe('Product')
expect(entityMetadata.tableName).toBe('products')
expect(entityMetadata.softDelete).toBe(true)

// 验证字段定义
const fieldMetadata = getFieldMetadata(Product, 'name')
expect(fieldMetadata.type).toBe('string')
expect(fieldMetadata.required).toBe(true)
expect(fieldMetadata.validation.maxLength).toBe(255)
```

### 2. Schema生成验证
```typescript
// 验证Prisma schema生成
const schema = await generatePrismaSchema()
expect(schema).toContain('model Product')
expect(schema).toContain('name String')
expect(schema).toContain('deletedAt DateTime?')
expect(schema).toContain('@@index([name])')
```

### 3. 数据库迁移验证
```sql
-- 验证生成的表结构
DESCRIBE products;

-- 验证索引创建
SHOW INDEX FROM products;

-- 验证约束条件
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'products';
```

## 插件系统验证

### 1. 插件发现验证
```typescript
const discoveryResult = await pluginLoader.discoverPlugins()
expect(discoveryResult.plugins.length).toBeGreaterThan(0)
expect(discoveryResult.errors.length).toBe(0)

// 验证核心插件
const schemaPlugin = discoveryResult.plugins.find(p => p.name === '@linch-kit/schema')
expect(schemaPlugin).toBeDefined()
expect(schemaPlugin.version).toMatch(/^\d+\.\d+\.\d+$/)
```

### 2. 插件加载验证
```typescript
const loadResult = await pluginLoader.loadAndRegisterPlugins()
expect(loadResult.loaded.length).toBeGreaterThan(0)
expect(loadResult.failed.length).toBe(0)

// 验证命令注册
const commands = registry.getRegisteredCommands()
const schemaCommands = commands.filter(cmd => cmd.category === 'schema')
expect(schemaCommands.length).toBeGreaterThan(0)
```

## 配置系统验证

### 1. 配置文件验证
```typescript
// 验证配置加载
const config = await configManager.loadConfig()
expect(config.project.name).toBeDefined()
expect(config.database.type).toMatch(/^(postgresql|mysql|sqlite)$/)
expect(config.schema.entities).toBeInstanceOf(Array)

// 验证配置合并
const mergedConfig = configManager.mergeConfigs(defaultConfig, userConfig)
expect(mergedConfig.plugins).toContain('@linch-kit/schema')
```

### 2. 环境变量验证
```typescript
// 验证环境变量处理
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
const config = await configManager.loadConfig()
expect(config.database.url).toBe(process.env.DATABASE_URL)
```

## 错误处理验证

### 1. 命令错误处理
```bash
# 测试无效命令
linch invalid-command
# 预期: 显示错误信息和帮助

# 测试无效参数
linch init --invalid-option
# 预期: 显示参数错误和正确用法

# 测试权限错误
linch init /root/test-project
# 预期: 显示权限错误信息
```

### 2. 配置错误处理
```typescript
// 测试无效配置
const invalidConfig = { database: { type: 'invalid' } }
expect(() => validateConfig(invalidConfig)).toThrow()

// 测试缺失配置
const incompleteConfig = { project: {} }
expect(() => validateConfig(incompleteConfig)).toThrow()
```

## 性能验证

### 1. 启动时间验证
```typescript
const startTime = Date.now()
await createCLI()
const initTime = Date.now() - startTime
expect(initTime).toBeLessThan(2000) // 2秒内启动
```

### 2. 内存使用验证
```typescript
const initialMemory = process.memoryUsage()
await runLargeOperation()
const finalMemory = process.memoryUsage()
const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024) // 100MB限制
```

## 集成验证

### 1. 端到端工作流
```bash
# 完整的项目创建和开发流程
linch init e2e-test-project
cd e2e-test-project
npm install
linch schema:list
linch schema:generate:prisma
npm run build
npm test
```

### 2. 数据库集成验证
```typescript
// 验证数据库连接
const client = new PrismaClient()
await client.$connect()
expect(client).toBeDefined()

// 验证CRUD操作
const product = await client.product.create({
  data: { name: 'Test Product', price: 1000 }
})
expect(product.id).toBeDefined()
expect(product.name).toBe('Test Product')
```

## 验证报告

### 验证结果格式
```typescript
interface ValidationReport {
  timestamp: Date
  version: string
  environment: string
  results: {
    cli: ValidationResult[]
    entities: ValidationResult[]
    plugins: ValidationResult[]
    config: ValidationResult[]
    performance: ValidationResult[]
    integration: ValidationResult[]
  }
  summary: {
    total: number
    passed: number
    failed: number
    warnings: number
  }
  issues: Issue[]
  recommendations: string[]
}
```

## 最佳实践

1. **自动化验证**: 集成到CI/CD流程
2. **全面覆盖**: 覆盖所有关键功能
3. **性能监控**: 持续监控性能指标
4. **错误追踪**: 详细记录错误信息
5. **回归测试**: 防止功能退化
6. **文档同步**: 保持验证文档更新
