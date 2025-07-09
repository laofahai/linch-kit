🌿 创建新功能分支 - 遵循分支管理规范

!echo "🌿 [$(date '+%H:%M:%S')] 创建新功能分支..."
!if [[-z "$ARGUMENTS"]]; then
echo "❌ 错误：请提供分支名称"
echo "💡 用法：/new-branch [功能名称]"
exit 1
fi

!echo "🔍 检查分支状态..."
!BRANCH_NAME="feature/$ARGUMENTS"
!if git show-ref --verify --quiet refs/heads/$BRANCH_NAME; then
echo "❌ 错误：分支 $BRANCH_NAME 已存在"
echo "💡 建议：使用不同的分支名称或切换到现有分支"
exit 1
fi

!echo "📥 更新主分支..."
!git fetch origin main || {
echo "❌ 获取远程分支失败"
exit 1
}

!echo "🔄 确保从最新的 main 分支创建..."
!git checkout main && git pull origin main || {
echo "❌ 更新 main 分支失败"
exit 1
}

!echo "✨ 创建并切换到新分支 $BRANCH_NAME..."
!git checkout -b $BRANCH_NAME || {
echo "❌ 创建分支失败"
exit 1
}

!echo "✅ 成功创建并切换到分支 $BRANCH_NAME"
!echo "💡 现在可以开始开发了！"
