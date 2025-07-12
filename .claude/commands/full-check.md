✅ 运行完整验证 - 全方位质量检查

!echo "✅ [$(date '+%H:%M:%S')] 开始完整验证流程..."
!echo "🔍 检查项目状态..."
!if [[ ! -f "package.json" ]]; then
echo "❌ 错误：未找到 package.json 文件"
exit 1
fi

!echo "📦 确保依赖已安装..."
!bun install --no-cache || {
echo "❌ 依赖安装失败"
exit 1
}

!echo "🎯 执行完整验证..."
!echo " 📋 包含：格式检查、代码质量、类型检查、测试、构建验证"
!bun run validate || {
echo "❌ 验证失败"
echo "💡 建议：运行 /fix 修复常见问题"
exit 1
}

!echo "✅ 所有验证通过！项目质量符合标准"
