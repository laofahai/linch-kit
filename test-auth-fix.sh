#!/bin/bash

# 测试认证修复的快速验证脚本

echo "🚀 测试 LinchKit 认证修复..."
echo "========================================="

echo "📦 构建状态检查..."
echo "1. 检查packages构建..."
if [ -f "extensions/console/dist/index.js" ]; then
    echo "✅ Console扩展构建完成"
else
    echo "❌ Console扩展未构建，正在构建..."
    cd extensions/console && bun run build && cd ../..
fi

echo ""
echo "2. 检查starter应用构建..."
if [ -f "apps/starter/.next/BUILD_ID" ]; then
    echo "✅ Starter应用构建完成"
else
    echo "❌ Starter应用未构建，正在构建..."
    cd apps/starter && bun run build && cd ../..
fi

echo ""
echo "🔧 关键文件检查..."
echo "3. 检查Console扩展路由修复..."
if grep -q "subPath.startsWith('auth')" "extensions/console/src/components/ConsoleAppWrapper.tsx"; then
    echo "✅ Console路由修复已应用"
else
    echo "❌ Console路由修复未找到"
fi

echo ""
echo "4. 检查认证页面重定向..."
if grep -q "/console/auth" "apps/starter/app/auth/page.tsx"; then
    echo "✅ 认证页面重定向配置正确"
else
    echo "❌ 认证页面重定向配置有误"
fi

echo ""
echo "🎯 测试路径..."
echo "测试以下URL路径："
echo "  - http://localhost:3000/auth (starter认证入口)"
echo "  - http://localhost:3000/console/auth (console认证页面)"
echo "  - http://localhost:3000/console (console主页)"
echo "  - http://localhost:3000/dashboard (dashboard重定向)"

echo ""
echo "🚀 启动开发服务器 (Ctrl+C 停止)..."
echo "========================================="

cd apps/starter
bun run dev