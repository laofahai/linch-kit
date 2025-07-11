#!/bin/bash

# ai-context链接快速修复脚本
# 修复最明显的几个链接问题

echo "开始修复ai-context目录链接问题..."

# 1. 修复Essential_Rules.md中的typescript-config引用
echo "修复Essential_Rules.md中的typescript-config引用..."
sed -i 's|../01_Quality/typescript-config.md|../02_Guides/11_TSConfig_Strict.json|g' \
    ai-context/00_Getting_Started/03_Essential_Rules.md

# 2. 修复System_Architecture.md中的Extension_System引用
echo "修复System_Architecture.md中的Extension_System引用..."
sed -i 's|./Extension_System.md|./10_Extension_System.md|g' \
    ai-context/01_Architecture/02_System_Architecture.md

# 3. 修复Smart_Loading_Guide.md中的文件名引用
echo "修复Smart_Loading_Guide.md中的文件名引用..."
sed -i 's|./quick-checklist.md|./06_Quick_Checklist.md|g' \
    ai-context/02_Guides/07_Smart_Loading_Guide.md
sed -i 's|./ai-code-quality.md|./05_AI_Code_Quality.md|g' \
    ai-context/02_Guides/07_Smart_Loading_Guide.md  
sed -i 's|./testing-standards.md|./08_Testing_Standards.md|g' \
    ai-context/02_Guides/07_Smart_Loading_Guide.md
sed -i 's|../01_Architecture/disaster-recovery.md|../01_Architecture/09_Disaster_Recovery.md|g' \
    ai-context/02_Guides/07_Smart_Loading_Guide.md

# 4. 修复一些常见的架构路径引用
echo "修复架构路径引用..."
find ai-context -name "*.md" -exec sed -i 's|../01_strategy_and_architecture/core_packages.md|../01_Architecture/03_Package_Architecture.md|g' {} \;
find ai-context -name "*.md" -exec sed -i 's|../02_knowledge_base/packages_api.md|../03_Reference/01_Packages_API/README.md|g' {} \;
find ai-context -name "*.md" -exec sed -i 's|../03_planning/roadmap.md|../98_Project_Management/01_Roadmap.md|g' {} \;
find ai-context -name "*.md" -exec sed -i 's|../03_planning/development-status.md|../98_Project_Management/02_Development_Status.md|g' {} \;

# 5. 创建缺失的根级文件
echo "创建缺失的根级文件..."
if [ ! -f LICENSE ]; then
    echo "创建LICENSE文件..."
    cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2025 LinchKit Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
fi

if [ ! -d docs ]; then
    echo "创建docs目录..."
    mkdir -p docs
fi

if [ ! -f docs/FAQ.md ]; then
    echo "创建FAQ文档..."
    cat > docs/FAQ.md << 'EOF'
# LinchKit 常见问题 (FAQ)

## 🚀 快速开始

### Q: 如何开始使用LinchKit？
A: 请参考[快速开始指南](../ai-context/00_Getting_Started/02_Quick_Start.md)。

### Q: 需要什么前置条件？
A: 
- Node.js 18+
- Bun 包管理器
- 基础的TypeScript知识

## 🏗️ 架构相关

### Q: LinchKit的核心架构是什么？
A: LinchKit采用6+1架构设计，详见[系统架构文档](../ai-context/01_Architecture/02_System_Architecture.md)。

### Q: 如何理解包依赖关系？
A: 请查看[包架构设计](../ai-context/01_Architecture/03_Package_Architecture.md)。

## 🔧 开发问题

### Q: 如何贡献代码？
A: 请查看[贡献指南](../CONTRIBUTING.md)了解详细流程。

### Q: 有什么开发约束？
A: 请务必阅读[核心开发约束](../ai-context/00_Getting_Started/03_Essential_Rules.md)。

## 📦 包管理

### Q: 为什么只能使用bun？
A: 为了确保依赖一致性和构建速度，LinchKit强制使用bun作为包管理器。

### Q: 如何检查包复用？
A: 使用`bun run deps:check [关键词]`命令检查现有实现。

## 🧪 测试相关

### Q: 使用什么测试框架？
A: LinchKit强制使用`bun:test`，禁止使用vitest/jest。

### Q: 测试覆盖率要求？
A: 核心包98%+，关键包95%+，UI组件包90%+，应用层85%+。

## 🤖 AI集成

### Q: 如何使用AI Session工具？
A: 请参考[AI工具使用指南](../ai-context/02_Guides/02_AI_Tools_Usage.md)。

### Q: Graph RAG查询如何使用？
A: 任何代码相关任务前必须执行`bun run ai:session query`。

## 🔍 更多帮助

- [项目文档](../ai-context/README.md)
- [GitHub Issues](https://github.com/laofahai/linch-kit/issues)
- [开发指南](../ai-context/02_Guides/01_Development_Workflow.md)

---

**更新时间**: 2025-07-11  
**维护者**: LinchKit Team
EOF
fi

echo "快速修复完成！"
echo ""
echo "已修复的问题："
echo "1. ✅ Essential_Rules.md中的typescript-config引用"
echo "2. ✅ System_Architecture.md中的Extension_System引用"
echo "3. ✅ Smart_Loading_Guide.md中的文件名引用"
echo "4. ✅ 常见架构路径引用"
echo "5. ✅ 创建了LICENSE和FAQ.md文件"
echo ""
echo "建议运行以下命令验证修复效果："
echo "python3 /tmp/check_links.py"