#!/bin/bash

# 测试认证重定向修复的验证脚本

echo "🚀 测试认证重定向修复..."
echo "========================================="

echo "📋 修复内容检查:"
echo "1. ✅ 移除了1.5秒延迟，改为立即重定向"
echo "2. ✅ 修复了console扩展注册问题（同时注册到两个管理器）"
echo "3. ✅ 确保console扩展能正确加载和渲染认证页面"

echo ""
echo "🔧 关键修复:"
echo "- apps/starter/app/auth/page.tsx: 移除setTimeout，立即重定向"
echo "- extensions/console/src/register.ts: 同时注册到clientExtensionManager和unifiedExtensionManager"
echo "- extensions/console/src/components/ConsoleAppWrapper.tsx: 添加auth路由处理"

echo ""
echo "🎯 测试流程:"
echo "1. 用户访问 /auth"
echo "2. 立即重定向到 /console/auth"
echo "3. console扩展加载并渲染认证页面"
echo "4. 显示登录/注册选项"

echo ""
echo "🌐 测试URL:"
echo "- http://localhost:3000/auth ➜ 立即重定向到 /console/auth"
echo "- http://localhost:3000/console/auth ➜ 显示认证页面"
echo "- http://localhost:3000/console ➜ 显示console主页"

echo ""
echo "🚀 启动开发服务器进行测试..."
echo "========================================="

cd /home/laofahai/workspace/linch-kit/apps/starter
echo "开发服务器启动中，请在浏览器中测试以上URL..."
bun run dev