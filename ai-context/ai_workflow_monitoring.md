# LinchKit AI 工作流 - 监督执行与故障排查指南

**版本**: v1.0  
**适用角色**: 技术主管、DevOps、项目经理  
**目标**: 确保AI工作流稳定执行和快速故障恢复

## 🎯 监督策略概览

### 三层监督体系

1. **🔍 实时监控**: 执行过程中的状态跟踪
2. **📊 质量检查**: 输出结果的质量验证  
3. **🛡️ 风险控制**: 异常情况的预警和处理

### 监督哲学

- **信任但验证**: AI 自动化能力强，但关键节点需要人工确认
- **快速反馈**: 发现问题立即干预，避免错误累积
- **持续改进**: 从每次执行中学习，优化监督策略

## 📊 实时状态监控

### 监控仪表板

#### 快速状态查看
```bash
# 工作流概览
echo "=== 活跃工作流 ==="
ls -la state/*.state.json 2>/dev/null | wc -l
echo "个工作流正在执行或已完成"

# 详细状态
for state_file in state/*.state.json; do
    if [ -f "$state_file" ]; then
        workflow_id=$(basename "$state_file" .state.json)
        status=$(jq -r '.status' "$state_file")
        echo "📋 $workflow_id: $status"
    fi
done
```

#### 深度状态分析
```bash
# 创建监控脚本
cat > monitor_workflows.sh << 'EOF'
#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== LinchKit AI 工作流监控面板 ===${NC}"
echo "时间: $(date)"
echo ""

# 统计信息
total_workflows=$(ls state/*.state.json 2>/dev/null | wc -l)
running_workflows=$(grep -l '"status":"running"' state/*.state.json 2>/dev/null | wc -l)
completed_workflows=$(grep -l '"status":"completed"' state/*.state.json 2>/dev/null | wc -l)
failed_workflows=$(grep -l '"status":"failed"' state/*.state.json 2>/dev/null | wc -l)

echo -e "${BLUE}📊 概览统计${NC}"
echo "总工作流: $total_workflows"
echo -e "运行中: ${YELLOW}$running_workflows${NC}"
echo -e "已完成: ${GREEN}$completed_workflows${NC}"
echo -e "已失败: ${RED}$failed_workflows${NC}"
echo ""

# 详细状态
echo -e "${BLUE}📋 详细状态${NC}"
for state_file in state/*.state.json; do
    if [ -f "$state_file" ]; then
        workflow_id=$(basename "$state_file" .state.json)
        status=$(jq -r '.status' "$state_file")
        current_task=$(jq -r '.current_task // "N/A"' "$state_file")
        
        case $status in
            "running")
                echo -e "🔄 ${YELLOW}$workflow_id${NC} - 正在执行: $current_task"
                ;;
            "completed")
                echo -e "✅ ${GREEN}$workflow_id${NC} - 执行完成"
                ;;
            "failed")
                echo -e "❌ ${RED}$workflow_id${NC} - 执行失败"
                ;;
            *)
                echo -e "🔍 $workflow_id - 状态: $status"
                ;;
        esac
    fi
done

# 最近的错误
echo ""
echo -e "${RED}🚨 最近失败的任务${NC}"
for state_file in state/*.state.json; do
    if [ -f "$state_file" ]; then
        failed_tasks=$(jq -r '.tasks | to_entries[] | select(.value.status == "failed") | .key' "$state_file" 2>/dev/null)
        if [ -n "$failed_tasks" ]; then
            workflow_id=$(basename "$state_file" .state.json)
            echo "📋 $workflow_id:"
            echo "$failed_tasks" | sed 's/^/  ❌ /'
        fi
    fi
done
EOF

chmod +x monitor_workflows.sh
```

### 实时日志监控

#### 日志聚合查看
```bash
# 实时查看所有AI工作流日志
tail -f /tmp/ai-workflow-*.log 2>/dev/null || echo "暂无活跃日志"

# 过滤错误信息
grep -i "error\|failed\|exception" /tmp/ai-workflow-*.log 2>/dev/null | tail -20
```

#### 关键指标监控
```bash
# 创建性能监控脚本
cat > performance_monitor.sh << 'EOF'
#!/bin/bash

echo "=== AI 工作流性能监控 ==="

# 平均执行时间
for state_file in state/*.state.json; do
    if [ -f "$state_file" ]; then
        workflow_id=$(basename "$state_file" .state.json)
        start_time=$(jq -r '.start_time // empty' "$state_file")
        end_time=$(jq -r '.end_time // empty' "$state_file")
        
        if [ -n "$start_time" ] && [ -n "$end_time" ]; then
            duration=$(($(date -d "$end_time" +%s) - $(date -d "$start_time" +%s)))
            echo "⏱️ $workflow_id: ${duration}秒"
        fi
    fi
done

# 任务成功率
total_tasks=0
completed_tasks=0
failed_tasks=0

for state_file in state/*.state.json; do
    if [ -f "$state_file" ]; then
        tasks=$(jq '.tasks | length' "$state_file")
        completed=$(jq '[.tasks[] | select(.status == "completed")] | length' "$state_file")
        failed=$(jq '[.tasks[] | select(.status == "failed")] | length' "$state_file")
        
        total_tasks=$((total_tasks + tasks))
        completed_tasks=$((completed_tasks + completed))
        failed_tasks=$((failed_tasks + failed))
    fi
done

if [ $total_tasks -gt 0 ]; then
    success_rate=$((completed_tasks * 100 / total_tasks))
    echo "📈 任务成功率: ${success_rate}% ($completed_tasks/$total_tasks)"
    echo "📉 任务失败率: $(((failed_tasks * 100) / total_tasks))% ($failed_tasks/$total_tasks)"
fi
EOF

chmod +x performance_monitor.sh
```

## 🔍 质量检查体系

### 自动质量检查

#### 代码质量验证
```bash
# 创建质量检查脚本
cat > quality_check.sh << 'EOF'
#!/bin/bash

workflow_id=$1
if [ -z "$workflow_id" ]; then
    echo "用法: $0 <workflow_id>"
    exit 1
fi

echo "=== $workflow_id 质量检查报告 ==="

# 检查是否有相关的 worktree
worktree_dir=$(find worktrees/ -name "*$workflow_id*" -type d 2>/dev/null | head -1)
if [ -z "$worktree_dir" ]; then
    worktree_dir="../../"  # 回退到主项目目录
fi

cd "$worktree_dir"

echo "📂 检查目录: $(pwd)"

# TypeScript 类型检查
echo ""
echo "🔧 TypeScript 类型检查:"
if bun run check-types 2>&1 | tail -5; then
    echo "✅ 类型检查通过"
else
    echo "❌ 类型检查失败"
fi

# ESLint 代码质量
echo ""
echo "🎨 ESLint 代码质量:"
if bun run lint 2>&1 | tail -5; then
    echo "✅ 代码质量检查通过"
else
    echo "❌ 代码质量检查失败"
fi

# 测试执行
echo ""
echo "🧪 测试执行:"
if bun test 2>&1 | tail -10; then
    echo "✅ 测试执行通过"
else
    echo "❌ 测试执行失败"
fi

# 构建验证
echo ""
echo "🏗️ 构建验证:"
if bun run build 2>&1 | tail -5; then
    echo "✅ 构建成功"
else
    echo "❌ 构建失败"
fi
EOF

chmod +x quality_check.sh
```

#### LinchKit 约束验证
```bash
# 创建约束检查脚本
cat > constraint_check.sh << 'EOF'
#!/bin/bash

echo "=== LinchKit 约束合规性检查 ==="

# 1. TypeScript 严格模式检查
echo "🔒 TypeScript 严格模式检查:"
strict_configs=$(find . -name "tsconfig.json" -exec grep -l '"strict": true' {} \;)
if [ -n "$strict_configs" ]; then
    echo "✅ 发现严格模式配置"
    echo "$strict_configs" | sed 's/^/  📄 /'
else
    echo "❌ 未发现严格模式配置"
fi

# 2. 禁止 any 类型检查
echo ""
echo "🚫 any 类型使用检查:"
any_usage=$(grep -r ": any\|<any>" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
if [ "$any_usage" -eq 0 ]; then
    echo "✅ 未发现 any 类型使用"
else
    echo "❌ 发现 $any_usage 处 any 类型使用"
    grep -r ": any\|<any>" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -5
fi

# 3. bun 包管理器检查
echo ""
echo "📦 包管理器检查:"
if [ -f "bun.lockb" ]; then
    echo "✅ 使用 bun 包管理器"
else
    echo "❌ 未发现 bun.lockb，可能未使用 bun"
fi

# 4. 架构依赖检查
echo ""
echo "🏗️ 架构依赖检查:"
package_json_files=$(find packages/ -name "package.json" 2>/dev/null)
if [ -n "$package_json_files" ]; then
    echo "✅ 发现包结构:"
    echo "$package_json_files" | sed 's/^/  📦 /'
else
    echo "❌ 未发现标准包结构"
fi

# 5. 测试覆盖率检查
echo ""
echo "📊 测试覆盖率检查:"
if [ -f "coverage/coverage-summary.json" ]; then
    total_coverage=$(jq -r '.total.functions.pct' coverage/coverage-summary.json 2>/dev/null)
    if [ -n "$total_coverage" ]; then
        echo "📈 函数覆盖率: ${total_coverage}%"
        if (( $(echo "$total_coverage >= 80" | bc -l) )); then
            echo "✅ 覆盖率达标 (≥80%)"
        else
            echo "❌ 覆盖率不达标 (<80%)"
        fi
    fi
else
    echo "❌ 未发现覆盖率报告"
fi
EOF

chmod +x constraint_check.sh
```

### 人工检查节点

#### 关键决策点
在以下情况需要人工确认：

1. **高风险操作**
   - 数据库模式变更
   - API 破坏性更改
   - 安全相关功能

2. **业务逻辑复杂**
   - 复杂的业务规则实现
   - 多系统集成
   - 性能要求严格的场景

3. **错误频发**
   - 连续多次任务失败
   - 测试覆盖率下降
   - 构建时间异常增长

#### 检查清单模板

```markdown
# AI 工作流人工检查清单

## 基础信息
- [ ] 工作流ID: ___________
- [ ] 需求描述: ___________
- [ ] 执行时间: ___________

## 技术实现检查
- [ ] 代码结构合理
- [ ] 符合 LinchKit 架构约束
- [ ] TypeScript 类型安全
- [ ] 错误处理完善

## 业务逻辑验证
- [ ] 功能符合需求
- [ ] 边界情况处理
- [ ] 用户体验良好
- [ ] 性能指标达标

## 质量保证
- [ ] 测试覆盖率 ≥ 80%
- [ ] 所有测试通过
- [ ] 代码质量检查通过
- [ ] 文档更新完整

## 风险评估
- [ ] 无安全隐患
- [ ] 无破坏性更改
- [ ] 向后兼容性
- [ ] 部署风险可控

## 最终决定
- [ ] 批准合并
- [ ] 需要修改
- [ ] 拒绝实现

签名: _________ 日期: _________
```

## 🚨 故障排查手册

### 故障分级

#### P0 - 系统性故障 (立即处理)
- AI 工作流生成器无法启动
- 核心执行引擎异常
- 数据损坏或丢失

#### P1 - 功能性故障 (2小时内处理)
- 特定任务类型识别失败
- 工作流执行中断
- 质量检查失败

#### P2 - 性能性故障 (24小时内处理)  
- 执行速度明显下降
- 资源使用异常
- 输出质量下降

#### P3 - 一般性问题 (72小时内处理)
- 用户体验优化
- 功能增强建议
- 文档更新需求

### 故障诊断流程

#### 1. 快速诊断 (5分钟)

```bash
# 快速健康检查
./scripts/health_check.sh

# 检查脚本内容
cat > scripts/health_check.sh << 'EOF'
#!/bin/bash

echo "=== LinchKit AI 工作流健康检查 ==="

# 检查必要工具
echo "🔧 工具检查:"
for tool in bun jq git; do
    if command -v $tool &> /dev/null; then
        echo "✅ $tool: 可用"
    else
        echo "❌ $tool: 缺失"
    fi
done

# 检查核心脚本
echo ""
echo "📜 脚本检查:"
core_scripts=("scripts/ai-workflow-generator.sh" "engine.sh")
for script in "${core_scripts[@]}"; do
    if [ -f "$script" ] && [ -x "$script" ]; then
        echo "✅ $script: 可执行"
    else
        echo "❌ $script: 问题"
    fi
done

# 检查目录结构
echo ""
echo "📁 目录检查:"
dirs=("tasks" "state" "worktrees" "ai-templates")
for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/: 存在"
    else
        echo "❌ $dir/: 缺失"
        mkdir -p "$dir"
        echo "  🔧 已自动创建"
    fi
done

# 检查权限
echo ""
echo "🔐 权限检查:"
if [ -w "." ]; then
    echo "✅ 目录写权限: 正常"
else
    echo "❌ 目录写权限: 缺失"
fi

echo ""
echo "🏁 健康检查完成"
EOF

chmod +x scripts/health_check.sh
```

#### 2. 详细诊断 (15分钟)

```bash
# 创建详细诊断脚本
cat > scripts/deep_diagnosis.sh << 'EOF'
#!/bin/bash

workflow_id=$1
echo "=== 详细故障诊断: $workflow_id ==="

# 1. 状态文件分析
if [ -f "state/$workflow_id.state.json" ]; then
    echo "📋 状态文件分析:"
    jq . "state/$workflow_id.state.json"
    
    echo ""
    echo "❌ 失败任务详情:"
    jq -r '.tasks | to_entries[] | select(.value.status == "failed") | "\(.key): \(.value.error // "无错误信息")"' "state/$workflow_id.state.json"
else
    echo "❌ 状态文件不存在: state/$workflow_id.state.json"
fi

# 2. 配置文件分析
config_file=$(find tasks/ -name "*$workflow_id*" | head -1)
if [ -f "$config_file" ]; then
    echo ""
    echo "⚙️ 配置文件分析:"
    echo "📄 文件: $config_file"
    
    # 验证JSON格式
    if jq . "$config_file" > /dev/null 2>&1; then
        echo "✅ JSON 格式正确"
        
        # 检查必要字段
        workflow_id_in_config=$(jq -r '.workflow.id' "$config_file")
        task_count=$(jq '.workflow.tasks | length' "$config_file")
        automation_level=$(jq -r '.workflow.automation_level' "$config_file")
        
        echo "🆔 工作流ID: $workflow_id_in_config"
        echo "📊 任务数量: $task_count"
        echo "🤖 自动化级别: $automation_level"
    else
        echo "❌ JSON 格式错误"
    fi
else
    echo "❌ 配置文件不存在"
fi

# 3. 环境检查
echo ""
echo "🌍 环境检查:"
echo "📂 当前目录: $(pwd)"
echo "👤 用户: $(whoami)"
echo "🕒 时间: $(date)"

# 4. 资源使用
echo ""
echo "💻 资源使用:"
echo "💾 磁盘空间:"
df -h . | tail -1

echo "🧠 内存使用:"
free -h | head -2

# 5. 最近的系统日志
echo ""
echo "📝 最近的错误日志:"
journalctl --since "1 hour ago" | grep -i "error\|failed" | tail -5 || echo "无系统错误日志"

echo ""
echo "🏁 详细诊断完成"
EOF

chmod +x scripts/deep_diagnosis.sh
```

#### 3. 自动修复 (自动执行)

```bash
# 创建自动修复脚本
cat > scripts/auto_repair.sh << 'EOF'
#!/bin/bash

echo "=== 自动修复程序 ==="

# 1. 清理损坏的状态文件
echo "🧹 清理损坏文件:"
for state_file in state/*.state.json; do
    if [ -f "$state_file" ]; then
        if ! jq . "$state_file" > /dev/null 2>&1; then
            echo "❌ 损坏的状态文件: $state_file"
            mv "$state_file" "$state_file.backup"
            echo "  🔧 已备份为 $state_file.backup"
        fi
    fi
done

# 2. 重新创建必要目录
echo ""
echo "📁 重建目录结构:"
dirs=("tasks" "state" "worktrees" "ai-templates")
for dir in "${dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo "  🔧 已创建 $dir/"
    fi
done

# 3. 修复脚本权限
echo ""
echo "🔐 修复权限:"
scripts=("scripts/ai-workflow-generator.sh" "engine.sh" "scripts/create-task.sh" "scripts/run-workflow.sh")
for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
        chmod +x "$script"
        echo "  🔧 已修复 $script 权限"
    fi
done

# 4. 清理临时文件
echo ""
echo "🗑️ 清理临时文件:"
find . -name "*.tmp" -delete 2>/dev/null && echo "  🔧 已清理 *.tmp 文件"
find . -name "*.log" -mtime +7 -delete 2>/dev/null && echo "  🔧 已清理 7天前的日志"

# 5. 验证修复结果
echo ""
echo "✅ 修复验证:"
./scripts/health_check.sh

echo ""
echo "🏁 自动修复完成"
EOF

chmod +x scripts/auto_repair.sh
```

### 故障恢复策略

#### 工作流中断恢复

```bash
# 恢复中断的工作流
recover_workflow() {
    local workflow_id=$1
    
    echo "🔄 恢复工作流: $workflow_id"
    
    # 1. 检查状态文件
    state_file="state/$workflow_id.state.json"
    if [ ! -f "$state_file" ]; then
        echo "❌ 状态文件丢失，无法恢复"
        return 1
    fi
    
    # 2. 重置运行中的任务
    jq '.tasks |= with_entries(if .value.status == "running" then .value.status = "pending" else . end)' \
       "$state_file" > "$state_file.tmp" && mv "$state_file.tmp" "$state_file"
    
    # 3. 重新执行
    config_file=$(find tasks/ -name "*$workflow_id*" | head -1)
    if [ -f "$config_file" ]; then
        ./scripts/run-workflow.sh "$config_file"
    else
        echo "❌ 配置文件丢失，无法恢复"
        return 1
    fi
}
```

#### 数据备份和恢复

```bash
# 创建备份策略
cat > scripts/backup_system.sh << 'EOF'
#!/bin/bash

backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"

echo "💾 创建系统备份: $backup_dir"

# 备份配置和状态
cp -r tasks/ "$backup_dir/"
cp -r state/ "$backup_dir/"

# 备份核心脚本
cp scripts/ai-workflow-generator.sh "$backup_dir/"
cp engine.sh "$backup_dir/"

# 创建清单
cat > "$backup_dir/manifest.txt" << EOL
备份时间: $(date)
备份内容:
- tasks/: 工作流配置文件
- state/: 执行状态文件  
- ai-workflow-generator.sh: 核心生成器
- engine.sh: 执行引擎

恢复命令:
cp -r $backup_dir/tasks/* tasks/
cp -r $backup_dir/state/* state/
cp $backup_dir/ai-workflow-generator.sh scripts/
cp $backup_dir/engine.sh .
EOL

echo "✅ 备份完成: $backup_dir"
echo "📋 查看清单: cat $backup_dir/manifest.txt"
EOF

chmod +x scripts/backup_system.sh
```

## 📈 持续改进

### 性能优化监控

```bash
# 性能监控和优化建议
cat > scripts/performance_optimization.sh << 'EOF'
#!/bin/bash

echo "=== 性能优化分析 ==="

# 1. 执行时间分析
echo "⏱️ 执行时间分析:"
for state_file in state/*.state.json; do
    if [ -f "$state_file" ]; then
        workflow_id=$(basename "$state_file" .state.json)
        
        # 计算总执行时间
        start_time=$(jq -r '.start_time // empty' "$state_file")
        end_time=$(jq -r '.end_time // empty' "$state_file")
        
        if [ -n "$start_time" ] && [ -n "$end_time" ]; then
            duration=$(($(date -d "$end_time" +%s) - $(date -d "$start_time" +%s)))
            echo "  📊 $workflow_id: ${duration}秒"
            
            # 性能建议
            if [ $duration -gt 300 ]; then
                echo "  ⚠️ 执行时间过长，建议优化"
            fi
        fi
    fi
done

# 2. 任务类型性能分析
echo ""
echo "📊 任务类型性能:"
declare -A task_stats
declare -A task_times

for state_file in state/*.state.json; do
    if [ -f "$state_file" ]; then
        # 统计任务类型执行情况
        task_types=$(jq -r '.tasks | to_entries[] | .value.type // "unknown"' "$state_file")
        for task_type in $task_types; do
            task_stats[$task_type]=$((${task_stats[$task_type]} + 1))
        done
    fi
done

for task_type in "${!task_stats[@]}"; do
    echo "  🔧 $task_type: ${task_stats[$task_type]} 次执行"
done

# 3. 优化建议
echo ""
echo "💡 优化建议:"
echo "  1. 并行执行: 增加可并行的任务依赖设计"
echo "  2. 缓存机制: 为重复的构建步骤添加缓存"
echo "  3. 增量处理: 只处理变更的部分"
echo "  4. 资源限制: 避免同时执行过多重型任务"

echo ""
echo "🏁 性能分析完成"
EOF

chmod +x scripts/performance_optimization.sh
```

### 质量改进追踪

```bash
# 质量改进追踪系统
cat > scripts/quality_tracking.sh << 'EOF'
#!/bin/bash

metrics_file="quality_metrics.json"

# 初始化指标文件
if [ ! -f "$metrics_file" ]; then
    cat > "$metrics_file" << 'EOL'
{
  "daily_metrics": {},
  "trend_analysis": {
    "success_rate": [],
    "avg_execution_time": [],
    "test_coverage": [],
    "code_quality_score": []
  }
}
EOL
fi

# 今日指标收集
today=$(date +%Y-%m-%d)
echo "📊 收集 $today 的质量指标"

# 计算今日成功率
total_workflows=$(ls state/*.state.json 2>/dev/null | wc -l)
completed_workflows=$(grep -l '"status":"completed"' state/*.state.json 2>/dev/null | wc -l)

if [ $total_workflows -gt 0 ]; then
    success_rate=$((completed_workflows * 100 / total_workflows))
else
    success_rate=0
fi

# 平均执行时间
total_time=0
workflow_count=0
for state_file in state/*.state.json; do
    if [ -f "$state_file" ]; then
        start_time=$(jq -r '.start_time // empty' "$state_file")
        end_time=$(jq -r '.end_time // empty' "$state_file")
        
        if [ -n "$start_time" ] && [ -n "$end_time" ]; then
            duration=$(($(date -d "$end_time" +%s) - $(date -d "$start_time" +%s)))
            total_time=$((total_time + duration))
            workflow_count=$((workflow_count + 1))
        fi
    fi
done

if [ $workflow_count -gt 0 ]; then
    avg_time=$((total_time / workflow_count))
else
    avg_time=0
fi

# 更新指标文件
jq --arg date "$today" \
   --arg success_rate "$success_rate" \
   --arg avg_time "$avg_time" \
   '.daily_metrics[$date] = {
     "success_rate": ($success_rate | tonumber),
     "avg_execution_time": ($avg_time | tonumber),
     "total_workflows": '"$total_workflows"',
     "completed_workflows": '"$completed_workflows"'
   }' "$metrics_file" > "$metrics_file.tmp" && mv "$metrics_file.tmp" "$metrics_file"

echo "✅ 质量指标已更新"
echo "📈 成功率: ${success_rate}%"
echo "⏱️ 平均执行时间: ${avg_time}秒"
EOF

chmod +x scripts/quality_tracking.sh
```

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "\u6e05\u7406\u6d4b\u8bd5\u751f\u6210\u7684\u5de5\u4f5c\u6d41\u6587\u4ef6\u548c\u4e34\u65f6\u6570\u636e", "status": "completed", "priority": "high"}, {"id": "2", "content": "\u5c06\u67b6\u6784\u6587\u6863\u6574\u7406\u5230 ai-context \u76ee\u5f55", "status": "completed", "priority": "high"}, {"id": "3", "content": "\u521b\u5efaAI\u5de5\u4f5c\u6d41\u4f7f\u7528\u6307\u5357\u6587\u6863", "status": "completed", "priority": "high"}, {"id": "4", "content": "\u521b\u5efa\u76d1\u7763\u6267\u884c\u548c\u6545\u969c\u6392\u67e5\u6307\u5357", "status": "completed", "priority": "medium"}]