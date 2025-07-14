# Security Sentinel - AI代码和Extension安全检查

AI代码和Extension安全防护系统，确保AI生成代码和Extension动态加载安全性。

## 功能

- **静态安全分析**: Extension代码安全威胁检测
- **AI代码审计**: AI生成代码安全模式检查
- **沙箱隔离**: 高风险代码自动隔离
- **威胁检测**: 实时安全威胁识别和防护
- **权限控制**: 与CASL权限系统集成

## 使用方法

```bash
# 扫描整个目录的安全威胁
bun run security:scan --target="extensions/blog-extension"

# 审计AI生成的代码
bun run security:audit --ai-code="[代码内容]"

# 评估特定Extension的安全性
bun run security:assess --extension="console"

# 隔离高风险文件
bun run security:quarantine --target="suspicious-file.js"
```

## Claude Code 接口

当需要进行安全检查时，调用以下脚本：

```typescript
import { SecuritySentinel } from '../tools/ai-platform/src/guardian/security-sentinel.js'

const sentinel = new SecuritySentinel()

// 安全扫描
const result = await sentinel.claudeSecurityCheck({
  action: 'scan',
  target: process.env.TARGET_PATH,
  verbose: process.env.VERBOSE === 'true',
  format: 'text'
})

console.log(result.output)
process.exit(result.success ? 0 : 1)
```

## 输出格式

### 安全扫描报告
- 整体风险分数 (0-100)
- 发现的安全威胁列表
- 威胁严重程度分类
- 沙箱隔离状态
- 修复建议

### AI代码审计
- AI代码风险评估
- 安全模式违规统计
- 威胁类型分析
- 自动隔离状态

## 威胁类型

- **code_injection**: 代码注入漏洞
- **command_injection**: 命令注入漏洞
- **path_traversal**: 路径遍历攻击
- **prototype_pollution**: 原型污染
- **eval_usage**: 不安全的eval使用
- **unsafe_import**: 动态模块导入
- **permission_bypass**: 权限绕过
- **data_exposure**: 敏感数据暴露
- **resource_exhaustion**: 资源耗尽攻击

## 严重程度

- **critical**: 严重威胁，需要立即处理
- **high**: 高风险，优先修复
- **medium**: 中等风险，计划修复
- **low**: 低风险，监控即可

## 集成说明

Security Sentinel是LinchKit AI Guardian智能体集群的Phase 2组件，与以下系统集成：

- **Context Verifier**: 理解一致性验证
- **Arch-Warden**: 架构合规检查
- **Meta-Learner**: 安全模式学习
- **CASL权限系统**: 权限控制集成

## 配置选项

- `threatThreshold`: 威胁分数阈值 (默认25)
- `autoBlockThreshold`: 自动阻止阈值 (默认75)
- `extensionSandboxing`: 启用Extension沙箱 (默认true)
- `strictPermissionMode`: 严格权限模式 (默认true)

## 错误处理

如果安全检查失败，检查：
1. 目标路径是否存在
2. 文件读取权限是否正确
3. 沙箱环境是否正常
4. 威胁检测规则是否更新