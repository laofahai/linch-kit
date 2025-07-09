⚡ 强制修复 - 立即解决格式和 lint 问题

基于 @CLAUDE.md 配置的验证标准

!echo "🔧 [$(date '+%H:%M:%S')] 强制执行快速修复..."
!echo "🔍 检查项目状态..."
!if [[! -f "package.json"]]; then
echo "❌ 错误：未找到 package.json 文件"
exit 1
fi

!echo "📦 确保依赖已安装..."
!bun install --no-cache || {
echo "❌ 依赖安装失败"
exit 1
}

!echo "🛠️ 执行自动修复..."
!echo " 📋 包含：格式化、lint修复、简单类型问题"
!bun run validate:light || {
echo "❌ 快速修复失败"
echo "💡 建议：检查具体错误信息并手动修复"
exit 1
}

!echo "✅ 快速修复完成！"
