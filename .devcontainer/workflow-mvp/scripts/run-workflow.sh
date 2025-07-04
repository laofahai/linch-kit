#!/bin/bash
# LinchKit 工作流执行脚本

set -euo pipefail

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE_PATH="$SCRIPT_DIR/../engine.sh"

# 颜色定义
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

main() {
    if [ $# -eq 0 ]; then
        echo "用法: $0 <workflow-config.json>"
        echo "示例:"
        echo "  $0 auth-oidc.json"
        echo "  $0 crud-batch.json"
        echo ""
        echo "可用的配置文件:"
        ls -1 "$SCRIPT_DIR/../tasks/"*.json 2>/dev/null | xargs -I {} basename {} || echo "  (未找到配置文件)"
        exit 1
    fi
    
    local config_file="$1"
    
    log_info "启动 LinchKit 并行开发工作流"
    log_info "配置文件: $config_file"
    
    # 执行工作流
    if "$ENGINE_PATH" "$config_file"; then
        log_success "工作流执行完成"
        exit 0
    else
        echo "工作流执行失败"
        exit 1
    fi
}

main "$@"