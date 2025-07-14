#!/bin/bash
# LinchKit AI Guardian 强制执行钩子
# 确保所有AI Session都必须遵守核心约束

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查是否在功能分支
check_branch() {
    local current_branch=$(git branch --show-current)
    local protected_branches=("main" "master" "develop" "release")
    
    for branch in "${protected_branches[@]}"; do
        if [[ "$current_branch" == "$branch"* ]]; then
            echo -e "${RED}🚨 FATAL: 禁止在保护分支 '$current_branch' 上工作${NC}"
            echo -e "${YELLOW}💡 必须创建功能分支: git checkout -b feature/[task-name]${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✓ 分支检查通过: $current_branch${NC}"
}

# 强制Graph RAG查询
enforce_graph_rag() {
    local task_keywords="$1"
    
    echo -e "${YELLOW}🔍 执行强制Graph RAG查询...${NC}"
    
    # 基础查询
    if ! bun run ai:session query "$task_keywords" --debug 2>/dev/null; then
        echo -e "${RED}❌ Graph RAG查询失败 - 这是零容忍违规${NC}"
        exit 1
    fi
    
    # 符号查询
    local symbols=("DashboardLayout" "LinchKitUser" "AuthProvider" "ExtensionManager")
    for symbol in "${symbols[@]}"; do
        if echo "$task_keywords" | grep -qi "$symbol"; then
            bun run ai:session symbol "$symbol" 2>/dev/null || true
        fi
    done
    
    echo -e "${GREEN}✓ Graph RAG查询完成${NC}"
}

# AI质量预检查
ai_pre_check() {
    local task_desc="$1"
    
    echo -e "${YELLOW}🤖 执行AI质量预检查...${NC}"
    
    # 创建预检查报告
    cat > .claude/pre-check-report.md << EOF
# AI质量预检查报告
生成时间: $(date '+%Y-%m-%d %H:%M:%S')
任务描述: $task_desc

## 检查项目
- [ ] 当前在功能分支
- [ ] Graph RAG查询已完成
- [ ] 现有实现已分析
- [ ] 包复用已检查
- [ ] 设计文档已审阅
- [ ] 测试策略已制定

## 强制约束提醒
1. 禁止使用 any 类型
2. 禁止使用 console.log
3. 必须同步更新测试
4. 必须使用 LinchKit 内部功能
EOF
    
    echo -e "${GREEN}✓ 预检查报告已生成${NC}"
}

# 创建Guardian监督文件
create_guardian_supervision() {
    mkdir -p .claude/guardians
    
    # 代码质量守护者
    cat > .claude/guardians/code-quality-guardian.md << 'EOF'
# 代码质量守护者激活

## 监督清单
- [ ] TypeScript严格模式检查
- [ ] ESLint零违规验证
- [ ] 无any类型使用
- [ ] 无console.log使用
- [ ] 正确的错误处理

## 自动执行命令
```bash
bun run type-check
bun run lint --max-warnings=0
```
EOF

    # 测试覆盖守护者
    cat > .claude/guardians/test-coverage-guardian.md << 'EOF'
# 测试覆盖守护者激活

## 覆盖率要求
- 核心包: 98%+
- 关键包: 95%+
- UI组件: 90%+
- 应用层: 85%+

## 强制规则
- 功能代码与测试必须同步提交
- 新功能必须有对应测试
- Bug修复必须有防回归测试
EOF

    echo -e "${GREEN}✓ AI Guardian监督文件已创建${NC}"
}

# 主执行流程
main() {
    echo -e "${YELLOW}🚨 LinchKit AI Guardian 强制执行系统启动${NC}"
    echo "=================================="
    
    # 1. 分支检查
    check_branch
    
    # 2. 获取任务关键词
    local task_keywords="${1:-default}"
    
    # 3. Graph RAG查询
    enforce_graph_rag "$task_keywords"
    
    # 4. AI预检查
    ai_pre_check "$task_keywords"
    
    # 5. 创建Guardian监督
    create_guardian_supervision
    
    # 6. 生成会话约束文件
    cat > .claude/session-constraints.md << EOF
# 本次会话强制约束 ($(date '+%Y-%m-%d %H:%M:%S'))

## 🚨 零容忍违规项
1. ❌ 在保护分支工作
2. ❌ 跳过Graph RAG查询
3. ❌ 使用any类型
4. ❌ 使用console.log
5. ❌ 不同步更新测试

## ✅ 已完成检查
- [x] 分支状态: $(git branch --show-current)
- [x] Graph RAG: 已执行
- [x] AI预检查: 已完成
- [x] Guardian: 已激活

## 🔴 违规处理
发现任何违规必须：
1. 立即停止
2. 修复违规
3. 重新执行检查
EOF
    
    echo -e "${GREEN}✅ 所有强制检查已完成！${NC}"
    echo -e "${YELLOW}📋 查看约束: cat .claude/session-constraints.md${NC}"
}

# 执行主流程
main "$@"