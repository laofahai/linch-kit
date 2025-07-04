#!/bin/bash
# LinchKit Monorepo Worktree Manager with Automation Levels
# Implements Safe/Moderate/Dangerous automation modes

set -euo pipefail

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

# Paths
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../" && pwd)"
readonly WORKTREES_DIR="$PROJECT_ROOT/.worktrees"
readonly CONFIG_DIR="$SCRIPT_DIR/../configs"
readonly STATE_DIR="$SCRIPT_DIR/../state"

# Automation levels
readonly LEVEL_SAFE="safe"
readonly LEVEL_MODERATE="moderate"
readonly LEVEL_DANGEROUS="dangerous"

# Logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_auto() { echo -e "${PURPLE}[AUTO:${1^^}]${NC} ${2}"; }

# Ensure directories exist
mkdir -p "$WORKTREES_DIR" "$CONFIG_DIR" "$STATE_DIR"

# Create automation config
create_automation_config() {
    local name="$1"
    local level="$2"
    local target="${3:-}"
    
    cat > "$CONFIG_DIR/$name-automation.json" << EOF
{
  "name": "$name",
  "automation_level": "$level",
  "target": "$target",
  "auto_responses": {
    "continue": "$([ "$level" = "$LEVEL_DANGEROUS" ] && echo "y" || echo "")",
    "overwrite": "$([ "$level" = "$LEVEL_DANGEROUS" ] && echo "y" || echo "n")",
    "save": "y",
    "proceed": "$([ "$level" != "$LEVEL_SAFE" ] && echo "y" || echo "")"
  },
  "safety": {
    "allow_destructive": $([ "$level" = "$LEVEL_DANGEROUS" ] && echo "true" || echo "false"),
    "require_confirmation": $([ "$level" = "$LEVEL_SAFE" ] && echo "true" || echo "false"),
    "max_retries": $([ "$level" = "$LEVEL_DANGEROUS" ] && echo "3" || echo "1")
  },
  "created_at": "$(date -Iseconds)"
}
EOF
    
    log_info "Created automation config for $name with level: $level"
}

# Execute with automation
execute_automated() {
    local command="$1"
    local level="$2"
    local name="${3:-automated}"
    
    log_auto "$level" "Executing: $command"
    
    case "$level" in
        "$LEVEL_SAFE")
            # Safe mode: no automation, manual responses required
            log_warning "Safe mode: Manual interaction required"
            eval "$command"
            ;;
            
        "$LEVEL_MODERATE")
            # Moderate mode: some automation with safeguards
            log_info "Moderate mode: Using predefined safe responses"
            # Use yes with empty response for most prompts
            yes "" | eval "$command" 2>&1 || {
                local exit_code=$?
                if [ $exit_code -eq 141 ]; then
                    # SIGPIPE is expected when yes terminates
                    return 0
                fi
                return $exit_code
            }
            ;;
            
        "$LEVEL_DANGEROUS")
            # Dangerous mode: full automation
            log_warning "Dangerous mode: Automatically accepting all prompts"
            yes "y" | eval "$command" 2>&1 || {
                local exit_code=$?
                if [ $exit_code -eq 141 ]; then
                    return 0
                fi
                return $exit_code
            }
            ;;
    esac
}

# Start automated worktree
start_automated() {
    local name="$1"
    local target="${2:-}"
    local level="${3:-$LEVEL_SAFE}"
    
    log_info "Starting automated worktree: $name (level: $level)"
    
    # Safety check for dangerous mode
    if [ "$level" = "$LEVEL_DANGEROUS" ]; then
        log_warning "DANGEROUS MODE: This will automatically accept all prompts!"
        echo -n "Type 'CONFIRM' to proceed: "
        read -r confirmation
        if [ "$confirmation" != "CONFIRM" ]; then
            log_error "Confirmation failed. Aborting."
            return 1
        fi
    fi
    
    # Create automation config
    create_automation_config "$name" "$level" "$target"
    
    # Create worktree path
    local worktree_path="$WORKTREES_DIR/$name"
    
    # Check if worktree exists
    if [ -d "$worktree_path" ]; then
        log_warning "Worktree already exists: $worktree_path"
        if [ "$level" = "$LEVEL_DANGEROUS" ]; then
            log_warning "Dangerous mode: Removing existing worktree"
            git worktree remove --force "$worktree_path" 2>/dev/null || true
        else
            log_error "Use 'dangerous' mode to force recreation"
            return 1
        fi
    fi
    
    # Create new worktree
    local branch="feature/$name-$(date +%Y%m%d-%H%M%S)"
    execute_automated "git worktree add -b $branch $worktree_path main" "$level" "$name"
    
    # Install dependencies
    log_info "Installing dependencies..."
    execute_automated "cd $worktree_path && bun install" "$level" "$name"
    
    # Build if needed
    if [ -n "$target" ]; then
        log_info "Building target: $target"
        execute_automated "cd $worktree_path && bun run build --filter=$target" "$level" "$name"
    fi
    
    # Save state
    cat > "$STATE_DIR/$name.state.json" << EOF
{
  "name": "$name",
  "path": "$worktree_path",
  "branch": "$branch",
  "target": "$target",
  "automation_level": "$level",
  "status": "active",
  "created_at": "$(date -Iseconds)",
  "pid": $$
}
EOF
    
    log_success "Automated worktree created successfully"
    echo "Path: $worktree_path"
    echo "Branch: $branch"
    echo "Automation: $level"
}

# Run batch analysis
run_batch_analysis() {
    local level="${1:-$LEVEL_MODERATE}"
    shift
    local targets=("$@")
    
    log_info "Running batch analysis for ${#targets[@]} targets"
    
    for target in "${targets[@]}"; do
        log_info "Analyzing: $target"
        
        # Create analysis worktree
        local name="analysis-$target-$(date +%s)"
        start_automated "$name" "$target" "$level"
        
        # Run analysis tasks
        local worktree_path="$WORKTREES_DIR/$name"
        execute_automated "cd $worktree_path && bun run lint --filter=$target" "$level" "$name"
        execute_automated "cd $worktree_path && bun run test --filter=$target" "$level" "$name"
        
        # Generate report
        local report_file="$STATE_DIR/analysis-$target.json"
        cat > "$report_file" << EOF
{
  "target": "$target",
  "worktree": "$name",
  "timestamp": "$(date -Iseconds)",
  "automation_level": "$level",
  "status": "completed"
}
EOF
        
        log_success "Analysis completed for $target"
    done
}

# Monitor status
status() {
    log_info "Worktree Status Dashboard"
    echo "=========================="
    
    # List all worktrees
    if command -v git &>/dev/null; then
        echo -e "\n${CYAN}Git Worktrees:${NC}"
        git worktree list || echo "No worktrees found"
    fi
    
    # List automation states
    echo -e "\n${CYAN}Automation States:${NC}"
    if ls "$STATE_DIR"/*.state.json &>/dev/null 2>&1; then
        for state_file in "$STATE_DIR"/*.state.json; do
            local name=$(jq -r '.name' "$state_file")
            local level=$(jq -r '.automation_level' "$state_file")
            local status=$(jq -r '.status' "$state_file")
            local created=$(jq -r '.created_at' "$state_file")
            
            echo "- $name [$level] - $status (created: $created)"
        done
    else
        echo "No active automation states"
    fi
    
    # Show disk usage
    echo -e "\n${CYAN}Disk Usage:${NC}"
    if [ -d "$WORKTREES_DIR" ]; then
        du -sh "$WORKTREES_DIR"/* 2>/dev/null | sort -h || echo "No worktrees found"
    fi
}

# Clean up worktrees
cleanup() {
    local force="${1:-false}"
    
    log_info "Cleaning up worktrees..."
    
    if [ "$force" = "true" ]; then
        log_warning "Force cleanup: removing all worktrees"
        git worktree prune
        rm -rf "$WORKTREES_DIR"/*
        rm -f "$STATE_DIR"/*.state.json
        log_success "All worktrees removed"
    else
        # Clean only inactive worktrees
        for state_file in "$STATE_DIR"/*.state.json; do
            [ -f "$state_file" ] || continue
            
            local name=$(jq -r '.name' "$state_file")
            local path=$(jq -r '.path' "$state_file")
            
            if [ ! -d "$path" ]; then
                log_info "Removing orphaned state: $name"
                rm -f "$state_file"
            fi
        done
        
        git worktree prune
        log_success "Cleanup completed"
    fi
}

# Test automation levels
test_automation() {
    log_info "Testing automation levels..."
    
    # Test safe mode
    echo -e "\n${CYAN}Testing SAFE mode:${NC}"
    create_automation_config "test-safe" "$LEVEL_SAFE" ""
    cat "$CONFIG_DIR/test-safe-automation.json" | jq .
    
    # Test moderate mode
    echo -e "\n${CYAN}Testing MODERATE mode:${NC}"
    create_automation_config "test-moderate" "$LEVEL_MODERATE" "@linchkit/core"
    cat "$CONFIG_DIR/test-moderate-automation.json" | jq .
    
    # Test dangerous mode
    echo -e "\n${CYAN}Testing DANGEROUS mode:${NC}"
    create_automation_config "test-dangerous" "$LEVEL_DANGEROUS" "@linchkit/ui"
    cat "$CONFIG_DIR/test-dangerous-automation.json" | jq .
    
    log_success "Automation tests completed"
}

# Main command handler
main() {
    local command="${1:-help}"
    shift || true
    
    case "$command" in
        "start_automated")
            start_automated "$@"
            ;;
        "run_batch_analysis")
            run_batch_analysis "$@"
            ;;
        "status")
            status
            ;;
        "cleanup")
            cleanup "$@"
            ;;
        "test")
            test_automation
            ;;
        "help"|*)
            echo "LinchKit Monorepo Worktree Manager"
            echo "=================================="
            echo ""
            echo "Usage: $0 <command> [args...]"
            echo ""
            echo "Commands:"
            echo "  start_automated <name> [target] [level]  - Start automated worktree"
            echo "  run_batch_analysis [level] <targets...>  - Run batch analysis"
            echo "  status                                   - Show worktree status"
            echo "  cleanup [force]                          - Clean up worktrees"
            echo "  test                                     - Test automation levels"
            echo ""
            echo "Automation Levels:"
            echo "  safe       - Manual interaction required (default)"
            echo "  moderate   - Automated with safeguards"
            echo "  dangerous  - Fully automated (use with caution)"
            echo ""
            echo "Examples:"
            echo "  $0 start_automated docs \"\" dangerous"
            echo "  $0 start_automated web packages/web-app moderate"
            echo "  $0 run_batch_analysis moderate web-app api-server"
            echo "  $0 status"
            ;;
    esac
}

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi