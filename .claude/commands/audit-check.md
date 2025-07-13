# 🛡️ AI原生实时合规性检查 - Claude Code Commands

**目标**: 实时检查AI开发过程中的合规性，确保遵循所有约束

**参数**: 无需参数，自动检查当前状态

!echo "🛡️ [$(date '+%H:%M:%S')] 开始AI原生实时合规性检查..."
!echo ""

# 步骤1: 基础合规检查
!echo "📊 步骤1: 基础合规性检查..."

!echo "🔍 检查当前分支状态..."
!CURRENT_BRANCH=$(git branch --show-current)
!echo "当前分支: $CURRENT_BRANCH"
!if [[ "$CURRENT_BRANCH" == "main" ]] || [[ "$CURRENT_BRANCH" == "master" ]] || [[ "$CURRENT_BRANCH" == "develop" ]]; then
echo "❌ 违规: 在保护分支上工作"
echo "📋 建议: 创建功能分支进行开发"
else
echo "✅ 分支管理合规"
fi

!echo ""
!echo "🔍 检查工作目录状态..."
!CHANGES=$(git status --porcelain | wc -l)
!echo "未提交的变更: $CHANGES 个文件"

!echo ""
!echo "🔍 检查包管理器使用..."
!if command -v bun >/dev/null 2>&1; then
echo "✅ Bun 包管理器可用"
else
echo "⚠️ 警告: Bun 包管理器未安装"
fi

!echo ""
!echo "📊 步骤2: Graph RAG查询合规检查..."

!echo "🔍 验证Graph RAG系统可用性..."
Bash
command: bun run ai:session query "test" --debug
description: 测试Graph RAG系统是否正常工作

!echo ""
!echo "📊 步骤3: 代码质量合规检查..."

!echo "🔍 检查TypeScript类型..."
Bash
command: bun run check-types
description: 检查TypeScript类型错误

!echo ""
!echo "🔍 检查代码规范..."
Bash
command: bun run lint
description: 检查代码规范问题

!echo ""
!echo "📊 步骤4: 项目约束合规检查..."

!echo "🔍 验证核心约束文档可访问..."
Read ai-context/00_Getting_Started/03_Essential_Rules.md

!echo ""
!echo "🔍 检查CLAUDE.md约束..."
Read CLAUDE.md

!echo ""
!echo "📊 步骤5: AI自我监督检查..."

!echo "🤖 AI自我监督提示："
!echo "请AI检查当前会话是否遵循以下原则："
!echo "1. ✅ 是否在每个代码任务前执行了Graph RAG查询？"
!echo "2. ✅ 是否检查了包复用避免重复实现？"
!echo "3. ✅ 是否遵循了TypeScript严格模式？"
!echo "4. ✅ 是否在适当的功能分支上工作？"
!echo "5. ✅ 是否保持了代码质量标准？"

!echo ""
!echo "✅ AI原生实时合规性检查完成"
!echo "📋 请AI基于上述检查结果评估合规状态并提供改进建议"