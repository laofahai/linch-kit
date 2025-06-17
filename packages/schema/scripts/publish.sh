#!/bin/bash

# 发布脚本
set -e

echo "🚀 准备发布 @linch-kit/schema"

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
  echo "❌ 请在 packages/schema 目录下运行此脚本"
  exit 1
fi

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ 有未提交的更改，请先提交所有更改"
  exit 1
fi

# 检查是否在主分支
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
  echo "⚠️  当前不在主分支 ($BRANCH)，确定要继续吗？(y/N)"
  read -r response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "❌ 发布已取消"
    exit 1
  fi
fi

# 清理并构建
echo "🧹 清理旧的构建文件..."
rm -rf dist

echo "🔨 构建项目..."
pnpm build

# 检查构建是否成功
if [ ! -d "dist" ]; then
  echo "❌ 构建失败，dist 目录不存在"
  exit 1
fi

# 运行类型检查
echo "🔍 运行类型检查..."
pnpm check-types

# 测试 CLI 工具
echo "🧪 测试 CLI 工具..."
node dist/cli/index.js --help > /dev/null

echo "✅ 所有检查通过！"

# 显示将要发布的文件
echo "📦 将要发布的文件："
npm pack --dry-run

echo ""
echo "🎯 准备发布到 npm..."
echo "版本: $(node -p "require('./package.json').version")"
echo ""

# 确认发布
echo "确定要发布吗？(y/N)"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
  echo "❌ 发布已取消"
  exit 1
fi

# 发布
echo "🚀 发布中..."
npm publish

echo "🎉 发布成功！"
echo ""
echo "📝 后续步骤："
echo "1. 创建 Git tag: git tag v$(node -p "require('./package.json').version")"
echo "2. 推送 tag: git push origin --tags"
echo "3. 在 GitHub 上创建 Release"
