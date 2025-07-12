📦 构建项目 - 生产环境构建

!echo "📦 [$(date '+%H:%M:%S')] 开始构建项目..."
!echo "🔍 检查构建环境..."
!if [[ ! -f "package.json" ]]; then
echo "❌ 错误：未找到 package.json 文件"
exit 1
fi

!echo "🧹 清理旧构建文件..."
!rm -rf dist/ build/ .next/ out/ || echo "⚠️ 清理构建文件失败或文件不存在"

!echo "📦 安装依赖..."
!bun install --no-cache || {
echo "❌ 依赖安装失败"
exit 1
}

!echo "🛠️ 执行构建..."
!bun run build || {
echo "❌ 构建失败"
exit 1
}

!echo "✅ 构建完成！"
