#!/bin/bash
# LinchKit 工作流状态查看脚本

set -euo pipefail

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="$SCRIPT_DIR/../state"

# 颜色定义
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

show_workflow_status() {
    local state_file="$1"
    local workflow_id
    local status
    local created_at
    
    workflow_id=$(jq -r '.workflow_id' "$state_file")
    status=$(jq -r '.status' "$state_file")
    created_at=$(jq -r '.created_at' "$state_file")
    
    echo -e "${CYAN}工作流: $workflow_id${NC}"
    echo -e "  状态: $(get_status_color "$status")$status${NC}"
    echo -e "  创建时间: $created_at"
    
    # 显示任务状态
    echo -e "  任务状态:"
    jq -r '.tasks | to_entries[] | "    " + .key + ": " + .value.status' "$state_file" | while read -r line; do
        local task_name=$(echo "$line" | cut -d: -f1 | xargs)
        local task_status=$(echo "$line" | cut -d: -f2 | xargs)
        echo -e "    $task_name: $(get_status_color "$task_status")$task_status${NC}"
    done
    
    echo ""
}

get_status_color() {
    case "$1" in
        "completed") echo -e "${GREEN}" ;;
        "running") echo -e "${YELLOW}" ;;
        "failed") echo -e "${RED}" ;;
        "pending") echo -e "${BLUE}" ;;
        *) echo -e "${NC}" ;;
    esac
}

show_worktree_status() {
    local project_root
    project_root="$(cd "$SCRIPT_DIR/../../../" && pwd)"
    local worktrees_dir="$project_root/worktrees"
    
    if [ ! -d "$worktrees_dir" ]; then
        echo -e "${BLUE}未找到 worktrees 目录${NC}"
        return
    fi
    
    echo -e "${CYAN}工作树状态:${NC}"
    
    for worktree in "$worktrees_dir"/*/; do
        if [ -d "$worktree" ]; then
            local tree_name
            tree_name=$(basename "$worktree")
            
            cd "$worktree"
            local branch
            branch=$(git branch --show-current 2>/dev/null || echo "无分支")
            local commits
            commits=$(git rev-list --count HEAD ^main 2>/dev/null || echo "0")
            local status
            status=$(git status --porcelain 2>/dev/null | wc -l || echo "?")
            
            echo -e "  📁 $tree_name"
            echo -e "    分支: $branch"
            echo -e "    提交数: $commits"
            echo -e "    未提交更改: $status 个文件"
        fi
    done
    
    cd "$SCRIPT_DIR"
}

main() {
    echo -e "${BLUE}LinchKit 并行开发工作流 - 状态面板${NC}"
    echo "================================================="
    echo ""
    
    # 显示所有工作流状态
    if [ -d "$STATE_DIR" ] && [ "$(ls -A "$STATE_DIR"/*.state.json 2>/dev/null | wc -l)" -gt 0 ]; then
        echo -e "${CYAN}工作流状态:${NC}"
        for state_file in "$STATE_DIR"/*.state.json; do
            if [ -f "$state_file" ]; then
                show_workflow_status "$state_file"
            fi
        done
    else
        echo -e "${BLUE}未找到活跃的工作流${NC}"
        echo ""
    fi
    
    # 显示工作树状态
    show_worktree_status
    
    echo ""
    echo -e "${BLUE}使用方法:${NC}"
    echo "  查看特定工作流: $0 <workflow-id>"
    echo "  运行工作流: ./run-workflow.sh <config-file>"
    echo "  创建任务: ./create-task.sh"
}

# 如果提供了参数，显示特定工作流的详细状态
if [ $# -gt 0 ]; then
    workflow_id="$1"
    state_file="$STATE_DIR/$workflow_id.state.json"
    
    if [ -f "$state_file" ]; then
        show_workflow_status "$state_file"
    else
        echo "未找到工作流: $workflow_id"
        exit 1
    fi
else
    main
fi