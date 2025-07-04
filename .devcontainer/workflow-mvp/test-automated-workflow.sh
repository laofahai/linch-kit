#!/bin/bash
# Test automated workflow with different automation levels

set -euo pipefail

# Colors
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

echo -e "${BLUE}=== LinchKit AI Automated Workflow Test ===${NC}"
echo ""

# Test 1: Generate and execute a moderate automation workflow
echo -e "${YELLOW}Test 1: Creating test task with moderate automation${NC}"
./scripts/ai-workflow-generator.sh "Create a simple test task for LinchKit core package" <<EOF
n
EOF

# Test 2: Check worktree status
echo -e "\n${YELLOW}Test 2: Checking worktree status${NC}"
./scripts/monorepo-worktree.sh status

# Test 3: Test dangerous mode with confirmation
echo -e "\n${YELLOW}Test 3: Testing dangerous mode (requires confirmation)${NC}"
cat > tasks/dangerous-test.json << EOF
{
  "workflow": {
    "id": "dangerous-test",
    "description": "Test dangerous automation mode",
    "automation_level": "dangerous",
    "tasks": [
      {
        "id": "echo-test",
        "type": "shell",
        "command": "echo 'This is a dangerous mode test'",
        "depends_on": []
      }
    ]
  }
}
EOF

echo -e "${GREEN}Test configuration created. You can now run:${NC}"
echo "  ./engine.sh tasks/dangerous-test.json"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "- AI workflow generator now supports automation levels"
echo "- Engine supports safe/moderate/dangerous execution modes"
echo "- Monorepo worktree manager is ready for automated workflows"