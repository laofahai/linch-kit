# Architecture Compliance Check

架构合规性检查命令 - 基于AI Platform的智能架构守卫

## 使用方法

```bash
/arch-check [optional-package-name]
```

## 功能说明

使用LinchKit AI Platform中的Arch-Warden智能体进行架构合规性检查：

**正确的依赖顺序**：
```
@linch-kit/core → @linch-kit/auth → @linch-kit/ui → @linch-kit/platform
```

**智能检查内容**：
1. 循环依赖检测
2. 逆向依赖验证  
3. 包层级约束检查
4. 架构违规智能分析
5. 自动修复建议生成

## 脚本实现

```bash
#!/bin/bash

echo "🛡️ [$(date '+%H:%M:%S')] 启动 Arch-Warden 架构守卫..."

# 参数处理
TARGET_PACKAGE="$1"
VERBOSE_MODE=""
if [[ "$2" == "--verbose" || "$1" == "--verbose" ]]; then
    VERBOSE_MODE="--verbose"
fi

# 检查 ai-platform 是否可用
if [[ ! -f "tools/ai-platform/dist/index.js" ]]; then
    echo "⚠️ AI Platform 未构建，正在构建..."
    cd tools/ai-platform
    bun run build
    cd ../..
    
    if [[ ! -f "tools/ai-platform/dist/index.js" ]]; then
        echo "❌ 错误: AI Platform 构建失败"
        exit 1
    fi
fi

# 创建临时的检查脚本
cat > /tmp/arch-check-runner.mjs << 'EOF'
import { ArchWarden } from './tools/ai-platform/dist/index.js'

async function runArchCheck() {
  const warden = new ArchWarden()
  
  const options = {
    targetPackage: process.argv[2] || undefined,
    verbose: process.argv.includes('--verbose'),
    format: 'text'
  }
  
  try {
    const result = await warden.claudeCheck(options)
    
    console.log(result.output)
    
    if (!result.success) {
      process.exit(1)
    }
    
    console.log('\n✅ 架构合规性检查通过！')
    
  } catch (error) {
    console.error('💥 Arch-Warden 执行失败:', error.message)
    process.exit(1)
  }
}

runArchCheck()
EOF

# 执行架构检查
echo "🔍 执行智能架构分析..."
bun /tmp/arch-check-runner.mjs "$TARGET_PACKAGE" $VERBOSE_MODE

ARCH_CHECK_EXIT_CODE=$?

# 清理临时文件
rm -f /tmp/arch-check-runner.mjs

# 检查结果
if [[ $ARCH_CHECK_EXIT_CODE -eq 0 ]]; then
    echo ""
    echo "🎯 [$(date '+%H:%M:%S')] Arch-Warden 检查完成 - 架构合规 ✅"
else
    echo ""
    echo "🚨 [$(date '+%H:%M:%S')] Arch-Warden 检查失败 - 发现架构违规 ❌"
    exit 1
fi

# 显示后续操作建议
echo ""
echo "💡 后续操作建议:"
echo "  • 集成到 CI/CD: bun run arch:check"  
echo "  • 详细报告: /arch-check --verbose"
echo "  • 特定包检查: /arch-check @linch-kit/ui"
echo ""
echo "📚 架构文档: ai-context/01_Architecture/"
```

## 集成脚本

添加到 package.json：

```json
{
  "scripts": {
    "arch:check": "bun tools/ai-platform/scripts/arch-check.js",
    "arch:enforce": "bun tools/ai-platform/scripts/arch-check.js --strict"
  }
}
```

## 执行示例

```bash
# 智能架构检查
/arch-check

# 详细模式检查
/arch-check --verbose

# 检查特定包
/arch-check @linch-kit/ui

# CI/CD 集成
bun run arch:check
```

## AI增强功能

相比传统脚本，AI Platform版本具备：

- 🧠 **智能分析**: 基于Graph RAG知识图谱分析
- 🔍 **深度检测**: 多层级架构违规检测
- 💡 **智能建议**: AI生成的修复建议
- 📊 **合规评分**: 0-100分的架构健康度评分
- 🚀 **持续学习**: 基于项目演进自动优化检查规则