#!/bin/bash
# LinchKit 并行开发工作流 - 核心执行引擎
# 版本: Phase 1 MVP
# 特性: 配置文件驱动、幂等性执行、状态跟踪

set -euo pipefail

# 颜色定义
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# 全局变量
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly TASKS_DIR="$SCRIPT_DIR/tasks"
readonly STATE_DIR="$SCRIPT_DIR/state"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../" && pwd)"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    local missing_deps=()
    
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    if ! command -v bun &> /dev/null; then
        missing_deps+=("bun")
    fi
    
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "缺少必要依赖: ${missing_deps[*]}"
        exit 1
    fi
}

# 验证 JSON 配置文件
validate_workflow_config() {
    local config_file="$1"
    
    if [ ! -f "$config_file" ]; then
        log_error "配置文件不存在: $config_file"
        return 1
    fi
    
    if ! jq empty "$config_file" 2>/dev/null; then
        log_error "配置文件 JSON 格式错误: $config_file"
        return 1
    fi
    
    # 验证必需字段
    local workflow_id
    workflow_id=$(jq -r '.workflow.id // empty' "$config_file")
    if [ -z "$workflow_id" ]; then
        log_error "缺少必需字段: workflow.id"
        return 1
    fi
    
    local tasks_count
    tasks_count=$(jq '.workflow.tasks | length' "$config_file")
    if [ "$tasks_count" -eq 0 ]; then
        log_error "至少需要一个任务"
        return 1
    fi
    
    log_success "配置文件验证通过: $config_file"
    return 0
}

# 初始化或加载状态
init_state() {
    local workflow_id="$1"
    local state_file="$STATE_DIR/$workflow_id.state.json"
    
    if [ -f "$state_file" ]; then
        log_info "加载现有状态: $state_file"
        return 0
    fi
    
    # 创建初始状态
    local initial_state='{
        "workflow_id": "'$workflow_id'",
        "status": "pending",
        "created_at": "'$(date -Iseconds)'",
        "tasks": {}
    }'
    
    echo "$initial_state" > "$state_file"
    log_success "初始化状态文件: $state_file"
}

# 更新任务状态
update_task_status() {
    local workflow_id="$1"
    local task_id="$2"
    local status="$3"
    local state_file="$STATE_DIR/$workflow_id.state.json"
    
    local timestamp
    timestamp=$(date -Iseconds)
    
    case "$status" in
        "running")
            jq --arg task_id "$task_id" --arg timestamp "$timestamp" \
                '.tasks[$task_id] = {"status": "running", "started_at": $timestamp}' \
                "$state_file" > "$state_file.tmp" && mv "$state_file.tmp" "$state_file"
            ;;
        "completed")
            jq --arg task_id "$task_id" --arg timestamp "$timestamp" \
                '.tasks[$task_id].status = "completed" | .tasks[$task_id].completed_at = $timestamp' \
                "$state_file" > "$state_file.tmp" && mv "$state_file.tmp" "$state_file"
            ;;
        "failed")
            jq --arg task_id "$task_id" --arg timestamp "$timestamp" \
                '.tasks[$task_id].status = "failed" | .tasks[$task_id].failed_at = $timestamp' \
                "$state_file" > "$state_file.tmp" && mv "$state_file.tmp" "$state_file"
            ;;
    esac
}

# 检查任务状态
get_task_status() {
    local workflow_id="$1"
    local task_id="$2"
    local state_file="$STATE_DIR/$workflow_id.state.json"
    
    if [ ! -f "$state_file" ]; then
        echo "pending"
        return
    fi
    
    jq -r --arg task_id "$task_id" '.tasks[$task_id].status // "pending"' "$state_file"
}

# 检查任务依赖
check_dependencies_satisfied() {
    local workflow_id="$1"
    local task_config="$2"
    local state_file="$STATE_DIR/$workflow_id.state.json"
    
    local dependencies
    dependencies=$(echo "$task_config" | jq -r '.depends_on[]? // empty')
    
    for dep in $dependencies; do
        local dep_status
        dep_status=$(jq -r --arg dep "$dep" '.tasks[$dep].status // "pending"' "$state_file")
        
        if [ "$dep_status" != "completed" ]; then
            log_info "等待依赖任务完成: $dep (状态: $dep_status)"
            return 1
        fi
    done
    
    return 0
}

# 执行 Git 任务
execute_git_task() {
    local task_config="$1"
    local command
    command=$(echo "$task_config" | jq -r '.command')
    
    log_info "执行 Git 命令: $command"
    
    cd "$PROJECT_ROOT"
    if eval "git $command"; then
        log_success "Git 命令执行成功"
        return 0
    else
        log_error "Git 命令执行失败"
        return 1
    fi
}

# 执行 Shell 任务
execute_shell_task() {
    local task_config="$1"
    local command
    command=$(echo "$task_config" | jq -r '.command')
    
    log_info "执行 Shell 命令: $command"
    
    # 获取自动化级别
    local automation_level
    automation_level=$(jq -r '.workflow.automation_level // "safe"' "$CONFIG_FILE" 2>/dev/null || echo "safe")
    
    cd "$PROJECT_ROOT"
    
    # 根据自动化级别执行命令
    case "$automation_level" in
        "dangerous")
            log_warning "危险模式: 自动接受所有提示"
            if yes "y" | eval "$command" 2>&1; then
                log_success "Shell 命令执行成功 (危险模式)"
                return 0
            else
                local exit_code=$?
                [ $exit_code -eq 141 ] && return 0  # SIGPIPE is OK
                log_error "Shell 命令执行失败 (退出码: $exit_code)"
                return $exit_code
            fi
            ;;
        "moderate")
            log_info "适度模式: 使用安全默认响应"
            if yes "" | eval "$command" 2>&1; then
                log_success "Shell 命令执行成功 (适度模式)"
                return 0
            else
                local exit_code=$?
                [ $exit_code -eq 141 ] && return 0
                log_error "Shell 命令执行失败 (退出码: $exit_code)"
                return $exit_code
            fi
            ;;
        *)
            # 安全模式：正常执行
            if eval "$command"; then
                log_success "Shell 命令执行成功"
                return 0
            else
                log_error "Shell 命令执行失败"
                return 1
            fi
            ;;
    esac
}

# 执行单个任务
execute_task() {
    local workflow_id="$1"
    local task_config="$2"
    local task_id
    local task_type
    
    task_id=$(echo "$task_config" | jq -r '.id')
    task_type=$(echo "$task_config" | jq -r '.type')
    
    # 检查任务是否已完成
    local current_status
    current_status=$(get_task_status "$workflow_id" "$task_id")
    
    if [ "$current_status" = "completed" ]; then
        log_info "任务已完成，跳过: $task_id"
        return 0
    fi
    
    # 检查依赖
    if ! check_dependencies_satisfied "$workflow_id" "$task_config"; then
        log_warning "依赖未满足，跳过任务: $task_id"
        return 2 # 特殊返回码表示依赖未满足
    fi
    
    log_info "开始执行任务: $task_id (类型: $task_type)"
    update_task_status "$workflow_id" "$task_id" "running"
    
    # 根据任务类型执行
    case "$task_type" in
        "git")
            if execute_git_task "$task_config"; then
                update_task_status "$workflow_id" "$task_id" "completed"
                log_success "任务完成: $task_id"
                return 0
            else
                update_task_status "$workflow_id" "$task_id" "failed"
                log_error "任务失败: $task_id"
                return 1
            fi
            ;;
        "shell")
            if execute_shell_task "$task_config"; then
                update_task_status "$workflow_id" "$task_id" "completed"
                log_success "任务完成: $task_id"
                return 0
            else
                update_task_status "$workflow_id" "$task_id" "failed"
                log_error "任务失败: $task_id"
                return 1
            fi
            ;;
        *)
            log_error "不支持的任务类型: $task_type"
            update_task_status "$workflow_id" "$task_id" "failed"
            return 1
            ;;
    esac
}

# 执行工作流
execute_workflow() {
    local config_file="$1"
    local workflow_id
    local max_iterations=100
    local iteration=0
    
    # 验证配置
    if ! validate_workflow_config "$config_file"; then
        return 1
    fi
    
    workflow_id=$(jq -r '.workflow.id' "$config_file")
    log_info "开始执行工作流: $workflow_id"
    
    # 初始化状态
    init_state "$workflow_id"
    
    # 循环执行直到所有任务完成
    while [ $iteration -lt $max_iterations ]; do
        local tasks_executed=0
        local tasks_pending=0
        
        # 遍历所有任务
        while read -r task_config; do
            local task_id
            task_id=$(echo "$task_config" | jq -r '.id')
            
            local task_status
            task_status=$(get_task_status "$workflow_id" "$task_id")
            
            if [ "$task_status" = "completed" ]; then
                continue
            fi
            
            if [ "$task_status" = "failed" ]; then
                log_error "工作流失败，任务 $task_id 执行失败"
                return 1
            fi
            
            # 尝试执行任务
            if execute_task "$workflow_id" "$task_config"; then
                tasks_executed=$((tasks_executed + 1))
            else
                local exit_code=$?
                if [ $exit_code -eq 2 ]; then
                    # 依赖未满足
                    tasks_pending=$((tasks_pending + 1))
                else
                    # 任务失败
                    log_error "工作流失败，任务 $task_id 执行失败"
                    return 1
                fi
            fi
        done < <(jq -c '.workflow.tasks[]' "$config_file")
        
        # 检查是否所有任务都已完成
        if [ $tasks_pending -eq 0 ]; then
            log_success "工作流执行完成: $workflow_id"
            
            # 更新工作流状态
            local state_file="$STATE_DIR/$workflow_id.state.json"
            jq '.status = "completed" | .completed_at = "'$(date -Iseconds)'"' \
                "$state_file" > "$state_file.tmp" && mv "$state_file.tmp" "$state_file"
            
            return 0
        fi
        
        # 如果这轮没有任务被执行，但还有pending任务，说明可能有循环依赖
        if [ $tasks_executed -eq 0 ] && [ $tasks_pending -gt 0 ]; then
            log_error "检测到循环依赖或无法满足的依赖"
            return 1
        fi
        
        iteration=$((iteration + 1))
        
        if [ $tasks_pending -gt 0 ]; then
            log_info "等待依赖任务完成... (第 $iteration 轮)"
            sleep 1
        fi
    done
    
    log_error "工作流执行超时"
    return 1
}

# 主函数
main() {
    if [ $# -eq 0 ]; then
        echo "用法: $0 <workflow-config.json>"
        echo "示例: $0 tasks/auth-oidc.json"
        exit 1
    fi
    
    local config_file="$1"
    
    # 如果是相对路径，转换为绝对路径
    if [[ "$config_file" != /* ]]; then
        config_file="$TASKS_DIR/$config_file"
    fi
    
    log_info "LinchKit 并行开发工作流引擎 - Phase 1 MVP"
    log_info "配置文件: $config_file"
    
    # 检查依赖
    check_dependencies
    
    # 执行工作流
    if execute_workflow "$config_file"; then
        log_success "工作流执行成功"
        exit 0
    else
        log_error "工作流执行失败"
        exit 1
    fi
}

# 如果直接运行脚本
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi