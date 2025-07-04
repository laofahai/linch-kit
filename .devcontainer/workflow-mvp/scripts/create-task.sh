#!/bin/bash
# LinchKit 任务创建脚本

set -euo pipefail

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TASKS_DIR="$SCRIPT_DIR/../tasks"

# 颜色定义
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 交互式创建任务
interactive_create() {
    echo -e "${BLUE}LinchKit 任务创建助手${NC}"
    echo "=========================="
    echo ""
    
    # 读取基本信息
    read -p "任务 ID (例: auth-oidc): " task_id
    read -p "任务描述: " description
    read -p "分支名称 (例: feature/auth/oidc-support): " branch_name
    read -p "工作树目录名 (例: auth-oidc): " worktree_name
    
    if [ -z "$task_id" ] || [ -z "$description" ] || [ -z "$branch_name" ] || [ -z "$worktree_name" ]; then
        echo "错误: 所有字段都是必需的"
        exit 1
    fi
    
    # 生成配置文件
    local config_file="$TASKS_DIR/$task_id.json"
    
    if [ -f "$config_file" ]; then
        log_warning "配置文件已存在: $config_file"
        read -p "是否覆盖? (y/n): " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            echo "已取消"
            exit 0
        fi
    fi
    
    # 询问额外任务
    echo ""
    echo "请选择要包含的任务 (多选，用空格分隔):"
    echo "1) 安装依赖 (install-deps)"
    echo "2) 构建依赖 (build-deps)"
    echo "3) 运行测试 (run-tests)"
    echo "4) 运行 lint (run-lint)"
    echo "5) 类型检查 (type-check)"
    
    read -p "选择 (例: 1 2 3): " task_choices
    
    # 构建任务数组
    local tasks='[
      {
        "id": "setup-branch",
        "type": "git",
        "command": "worktree add -b '$branch_name' ./worktrees/'$worktree_name' main",
        "depends_on": []
      }'
    
    local last_task="setup-branch"
    
    for choice in $task_choices; do
        case $choice in
            1)
                tasks="$tasks,
      {
        \"id\": \"install-deps\",
        \"type\": \"shell\",
        \"command\": \"cd ./worktrees/$worktree_name && bun install\",
        \"depends_on\": [\"$last_task\"]
      }"
                last_task="install-deps"
                ;;
            2)
                tasks="$tasks,
      {
        \"id\": \"build-deps\",
        \"type\": \"shell\",
        \"command\": \"cd ./worktrees/$worktree_name && bun run build --filter=@linchkit/core --filter=@linchkit/schema\",
        \"depends_on\": [\"$last_task\"]
      }"
                last_task="build-deps"
                ;;
            3)
                tasks="$tasks,
      {
        \"id\": \"run-tests\",
        \"type\": \"shell\",
        \"command\": \"cd ./worktrees/$worktree_name && bun test\",
        \"depends_on\": [\"$last_task\"]
      }"
                last_task="run-tests"
                ;;
            4)
                tasks="$tasks,
      {
        \"id\": \"run-lint\",
        \"type\": \"shell\",
        \"command\": \"cd ./worktrees/$worktree_name && bun run lint\",
        \"depends_on\": [\"$last_task\"]
      }"
                last_task="run-lint"
                ;;
            5)
                tasks="$tasks,
      {
        \"id\": \"type-check\",
        \"type\": \"shell\",
        \"command\": \"cd ./worktrees/$worktree_name && bun run type-check\",
        \"depends_on\": [\"$last_task\"]
      }"
                last_task="type-check"
                ;;
        esac
    done
    
    tasks="$tasks
    ]"
    
    # 生成完整配置
    cat > "$config_file" << EOF
{
  "workflow": {
    "id": "$task_id",
    "description": "$description",
    "tasks": $tasks
  }
}
EOF
    
    # 验证 JSON 格式
    if jq empty "$config_file" 2>/dev/null; then
        log_success "任务配置已创建: $config_file"
        echo ""
        echo "运行工作流:"
        echo "  ./run-workflow.sh $task_id.json"
        echo ""
        echo "查看状态:"
        echo "  ./status.sh $task_id"
    else
        echo "错误: 生成的 JSON 格式不正确"
        exit 1
    fi
}

# 从模板创建
create_from_template() {
    local template="$1"
    local task_id="$2"
    
    case "$template" in
        "auth")
            local config_file="$TASKS_DIR/$task_id.json"
            cat > "$config_file" << 'EOF'
{
  "workflow": {
    "id": "TASK_ID",
    "description": "认证相关功能开发",
    "tasks": [
      {
        "id": "setup-branch",
        "type": "git",
        "command": "worktree add -b feature/auth/BRANCH_SUFFIX ./worktrees/WORKTREE_NAME main",
        "depends_on": []
      },
      {
        "id": "install-deps",
        "type": "shell",
        "command": "cd ./worktrees/WORKTREE_NAME && bun install",
        "depends_on": ["setup-branch"]
      },
      {
        "id": "run-tests",
        "type": "shell",
        "command": "cd ./worktrees/WORKTREE_NAME && bun test --filter=@linchkit/auth",
        "depends_on": ["install-deps"]
      }
    ]
  }
}
EOF
            # 替换占位符
            sed -i "s/TASK_ID/$task_id/g" "$config_file"
            log_success "已创建认证模板: $config_file"
            log_warning "请手动编辑文件中的 BRANCH_SUFFIX 和 WORKTREE_NAME"
            ;;
        "crud")
            local config_file="$TASKS_DIR/$task_id.json"
            cat > "$config_file" << 'EOF'
{
  "workflow": {
    "id": "TASK_ID",
    "description": "CRUD 相关功能开发",
    "tasks": [
      {
        "id": "setup-branch",
        "type": "git",
        "command": "worktree add -b feature/crud/BRANCH_SUFFIX ./worktrees/WORKTREE_NAME main",
        "depends_on": []
      },
      {
        "id": "install-deps",
        "type": "shell",
        "command": "cd ./worktrees/WORKTREE_NAME && bun install",
        "depends_on": ["setup-branch"]
      },
      {
        "id": "build-deps",
        "type": "shell",
        "command": "cd ./worktrees/WORKTREE_NAME && bun run build --filter=@linchkit/core --filter=@linchkit/schema",
        "depends_on": ["install-deps"]
      },
      {
        "id": "run-tests",
        "type": "shell",
        "command": "cd ./worktrees/WORKTREE_NAME && bun test --filter=@linchkit/crud",
        "depends_on": ["build-deps"]
      }
    ]
  }
}
EOF
            # 替换占位符
            sed -i "s/TASK_ID/$task_id/g" "$config_file"
            log_success "已创建 CRUD 模板: $config_file"
            log_warning "请手动编辑文件中的 BRANCH_SUFFIX 和 WORKTREE_NAME"
            ;;
        *)
            echo "错误: 不支持的模板类型: $template"
            echo "可用模板: auth, crud"
            exit 1
            ;;
    esac
}

main() {
    if [ $# -eq 0 ]; then
        interactive_create
        return
    fi
    
    case "$1" in
        "--template")
            if [ $# -lt 3 ]; then
                echo "用法: $0 --template <template-type> <task-id>"
                echo "模板类型: auth, crud"
                exit 1
            fi
            create_from_template "$2" "$3"
            ;;
        "--help"|"-h")
            echo "LinchKit 任务创建脚本"
            echo ""
            echo "用法:"
            echo "  $0                                 # 交互式创建"
            echo "  $0 --template <type> <task-id>    # 从模板创建"
            echo ""
            echo "模板类型:"
            echo "  auth    - 认证相关功能"
            echo "  crud    - CRUD 相关功能"
            ;;
        *)
            echo "错误: 未知参数 $1"
            echo "使用 $0 --help 查看帮助"
            exit 1
            ;;
    esac
}

main "$@"