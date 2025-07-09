🧪 运行测试 - 使用 bun:test 框架

!echo "🧪 [$(date '+%H:%M:%S')] 开始运行测试..."
!echo "🔍 检查测试环境..."
!if [[! -f "package.json"]]; then
echo "❌ 错误：未找到 package.json 文件"
exit 1
fi

!echo "📦 确保依赖已安装..."
!bun install --no-cache || {
echo "❌ 依赖安装失败"
exit 1
}

!echo "🎯 执行测试套件..."
!bun test || {
echo "❌ 测试失败"
echo "💡 建议：检查测试文件和相关依赖"
exit 1
}

!echo "✅ 所有测试通过！"
