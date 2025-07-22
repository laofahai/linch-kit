# AI Platform 测试内存泄露修复方案

## 🚨 问题诊断

### 当前内存泄露源头
1. **TestWorkflowManager实例累积** - 每个测试创建新实例但清理不彻底
2. **Mock对象引用循环** - beforeEach/afterEach中的mock清理不完整
3. **文件系统操作死循环** - 重复尝试读取不存在的文件
4. **日志事件监听器累积** - 大量错误日志没有被清理
5. **AI Provider连接泄露** - API调用和连接没有正确关闭
6. **Neo4j Mock连接池泄露** - 数据库mock连接没有释放

## 🔧 系统修复方案

### Phase 1: 立即修复 (Critical)

#### 1.1 修复Mock数据结构不完整问题
```typescript
// 所有测试文件需要提供完整的mock数据结构
const mockCoverageAnalyzer = {
  analyzeCoverage: mock(() => Promise.resolve({
    overall: {
      lines: { total: 100, covered: 70, uncovered: 30, percentage: 70 },
      functions: { total: 20, covered: 15, uncovered: 5, percentage: 75 },
      branches: { total: 50, covered: 35, uncovered: 15, percentage: 70 },
      statements: { total: 120, covered: 84, uncovered: 36, percentage: 70 }
    },
    files: [],
    gapAnalysis: {
      totalGaps: 5,
      criticalGaps: 2,
      highPriorityFiles: [],
      suggestedTests: [],
      coverageGoals: { currentOverall: 70, targetOverall: 85, improveBy: 15 }
    },
    recommendations: [],
    trends: { coverageChange: 5, qualityScore: 80, testHealthScore: 75 },
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }))
}
```

#### 1.2 改进资源清理机制
```typescript
afterEach(async () => {
  // 1. 强制清理所有mock实现
  Object.values(mockAIProvider).forEach(mockFn => {
    if (typeof mockFn === 'function' && 'mockRestore' in mockFn) {
      mockFn.mockRestore()
    }
  })
  
  // 2. 清理TestWorkflowManager实例
  if (workflowManager && typeof workflowManager === 'object') {
    // 断开所有连接
    if (workflowManager.disconnect) {
      await workflowManager.disconnect()
    }
    
    // 清理内部引用
    Object.keys(workflowManager).forEach(key => {
      ;(workflowManager as any)[key] = null
    })
  }
  workflowManager = null as any
  
  // 3. 强制垃圾回收
  if (global.gc) {
    global.gc()
  }
  
  // 4. 清理环境变量
  delete process.env.GEMINI_API_KEY
  delete process.env.GOOGLE_API_KEY
  
  // 5. 等待异步清理完成
  await new Promise(resolve => setTimeout(resolve, 100))
})
```

#### 1.3 添加文件存在性检查避免循环读取
```typescript
// 在测试context中使用真实存在的文件或mock文件系统
const context: TestWorkflowContext = {
  taskDescription: 'Test task',
  testType: 'unit',
  targetFiles: [] // 空数组避免文件读取
}

// 或者mock文件系统
beforeEach(() => {
  // Mock fs operations to avoid real file access
  const mockFs = mock()
  mockFs.mockImplementation(() => ({
    readFileSync: mock(() => 'mock content'),
    existsSync: mock(() => true),
    writeFileSync: mock(() => {})
  }))
})
```

### Phase 2: 结构优化 (High Priority)

#### 2.1 实现测试隔离机制
```typescript
// 创建测试工厂函数避免实例复用
function createTestWorkflowManager() {
  const manager = new TestWorkflowManager(mockAIProvider as any)
  // 立即替换内部组件为mock
  ;(manager as any).queryEngine = mockQueryEngine
  ;(manager as any).coverageAnalyzer = mockCoverageAnalyzer
  return manager
}

beforeEach(() => {
  workflowManager = createTestWorkflowManager()
})
```

#### 2.2 限制并发测试数量
```json
// package.json 或 bun.toml
{
  "scripts": {
    "test": "bun test --bail --timeout 30000 --max-workers 2"
  }
}
```

#### 2.3 添加内存监控
```typescript
// 在关键测试中添加内存检查
it('should not leak memory', async () => {
  const initialMemory = process.memoryUsage()
  
  // 执行测试操作
  await workflowManager.executeTestWorkflow(context)
  
  // 强制GC
  if (global.gc) global.gc()
  
  const finalMemory = process.memoryUsage()
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
  
  // 内存增长不应超过10MB
  expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
})
```

### Phase 3: 长期优化 (Medium Priority)

#### 3.1 重构测试架构
- **共享Mock工厂**: 创建可复用的mock工厂
- **测试数据池**: 预定义测试数据避免重复创建
- **资源池管理**: 实现测试资源池机制

#### 3.2 实现渐进式测试
```bash
# 分批运行测试避免内存累积
bun test src/__tests__/test-workflow-manager/setup.test.ts
bun test src/__tests__/test-workflow-manager/timing-control.test.ts
bun test src/__tests__/test-workflow-manager/strategy-analysis.test.ts
# ... 每个测试文件单独运行
```

## 📋 执行检查清单

### 立即执行 (Critical)
- [ ] 修复所有mock数据结构不完整问题
- [ ] 改进afterEach资源清理机制
- [ ] 添加文件存在性检查
- [ ] 移除API密钥初始化错误

### 短期执行 (High)
- [ ] 实现测试工厂函数
- [ ] 限制测试并发数
- [ ] 添加内存监控断言
- [ ] 优化测试执行顺序

### 长期优化 (Medium)
- [ ] 重构共享测试基础设施
- [ ] 实现测试资源池
- [ ] 建立内存基准测试

## 🔍 验证方法

### 内存验证命令
```bash
# 1. 单独运行每个测试文件检查内存
bun test src/__tests__/test-workflow-manager/setup.test.ts --verbose

# 2. 监控系统资源
htop # 或 top 监控内存使用

# 3. 使用内存分析工具
NODE_OPTIONS="--max-old-space-size=512" bun test

# 4. 检查测试执行时间
time bun test src/__tests__/test-workflow-manager/
```

### 成功标准
- ✅ 每个测试文件独立运行内存增长 < 50MB
- ✅ 所有测试通过率 100%
- ✅ 测试执行时间 < 30秒每文件
- ✅ 系统负载保持稳定

## 🚀 立即行动

**第一步**: 修复mock数据结构
**第二步**: 改进资源清理
**第三步**: 单独验证每个测试文件
**第四步**: 生成覆盖率报告

执行优先级: Critical → High → Medium