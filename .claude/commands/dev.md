🚀 启动开发环境 - 遵循项目标准

使用 @CLAUDE.md 配置的 bun 开发环境

!echo "🚀 [$(date '+%H:%M:%S')] 启动 LinchKit 开发环境..."
!echo "🔍 检查依赖状态..."
!if [[! -f "package.json"]]; then
echo "❌ 错误：未找到 package.json 文件"
exit 1
fi

!echo "📦 确保依赖已安装..."
!bun install --no-cache || {
echo "❌ 依赖安装失败"
exit 1
}

!echo "🌟 启动开发服务器..."
!bun dev
