#!/bin/bash
# 调试 JSON 生成问题

set -euo pipefail

# 测试基础 JSON 生成
echo "测试基础 JSON 模板..."

workflow_config=$(cat << 'EOF'
{
  "workflow": {
    "id": "test-id",
    "description": "AI 生成的自动化工作流",
    "ai_generated": true,
    "linchkit_constraints_enforced": true,
    "automation_level": "safe",
    "tasks": []
  },
  "metadata": {
    "task_type": "general",
    "complexity": "medium", 
    "generated_at": "2025-07-04T18:50:00Z",
    "ai_confidence": 0.8
  }
}
EOF
)

echo "生成的 JSON:"
echo "$workflow_config"

echo ""
echo "验证 JSON 有效性:"
if echo "$workflow_config" | jq . >/dev/null 2>&1; then
    echo "✅ JSON 有效"
    echo "$workflow_config" | jq .
else
    echo "❌ JSON 无效"
    echo "$workflow_config" | jq . 2>&1 || true
fi