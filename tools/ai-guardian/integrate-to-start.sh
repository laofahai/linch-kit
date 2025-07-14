#!/bin/bash
# 将AI Guardian集成到/start命令的脚本

set -euo pipefail

echo "🔧 正在集成AI Guardian到/start命令..."

# 查找/start命令文件
START_COMMANDS=(
    ".claude/start"
    "scripts/start.sh" 
    "tools/start-command.sh"
    ".vscode/start.sh"
)

START_FILE=""
for file in "${START_COMMANDS[@]}"; do
    if [[ -f "$file" ]]; then
        START_FILE="$file"
        break
    fi
done

if [[ -z "$START_FILE" ]]; then
    echo "❌ 未找到/start命令文件"
    echo "💡 请手动将以下代码添加到您的/start命令开头："
    echo ""
    echo "# AI Guardian强制验证"
    echo "if ! bun run ai:guardian:validate \"\$ARGUMENTS\" 2>/dev/null; then"
    echo "    echo \"🚨 AI Guardian验证失败，会话无法继续\""
    echo "    echo \"📋 请修复违规后重新执行/start\""
    echo "    exit 1"
    echo "fi"
    echo ""
    exit 1
fi

echo "✅ 找到/start命令文件: $START_FILE"

# 备份原文件
cp "$START_FILE" "${START_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "📋 已备份原文件到: ${START_FILE}.backup.*"

# 检查是否已集成
if grep -q "ai:guardian:validate" "$START_FILE"; then
    echo "⚠️ AI Guardian已经集成，跳过"
    exit 0
fi

# 创建临时文件进行集成
cat > temp_start_integration.sh << 'EOF'
#!/bin/bash

# 在原有内容前添加AI Guardian验证
echo "🚨 智能开发 Session - AI 驱动的上下文优化启动"
echo ""
echo "**强制要求:**"
echo "- 阅读并遵守 @CLAUDE.md 中的所有约束"
echo "- 遵守 @ai-context/02_Guides/01_Development_Workflow.md 中的开发流程"
echo "- 完成 Graph RAG 强制查询（零容忍违规）"
echo "- 使用 AI 智能加载系统优化上下文"
echo ""
echo "任务: $ARGUMENTS"
echo ""

# AI Guardian强制验证
echo "🛡️ 启动AI Guardian强制验证..."
if ! bun run ai:guardian:validate "$ARGUMENTS" 2>/dev/null; then
    echo ""
    echo "🚨 FATAL: AI Guardian验证失败，会话无法继续"
    echo "📋 必须修复所有违规后才能重新执行/start"
    echo "💡 查看详细信息: cat .claude/session-constraints.md"
    exit 1
fi

echo "✅ AI Guardian验证通过，继续执行原始/start流程..."
echo ""

EOF

# 将Guardian集成代码插入到原文件开头
{
    head -n 1 "$START_FILE"  # 保留shebang
    cat temp_start_integration.sh
    tail -n +2 "$START_FILE"  # 原有内容（跳过shebang）
} > "${START_FILE}.integrated"

# 替换原文件
mv "${START_FILE}.integrated" "$START_FILE"
chmod +x "$START_FILE"

# 清理临时文件
rm temp_start_integration.sh

echo ""
echo "✅ AI Guardian已成功集成到/start命令！"
echo ""
echo "📋 集成内容:"
echo "  - AI Guardian强制验证"
echo "  - 零容忍违规检查"
echo "  - 自动生成约束文件"
echo ""
echo "🚨 重要: 现在每次执行/start都会强制执行所有约束检查"
echo "💡 如需回滚，请使用备份文件: ${START_FILE}.backup.*"