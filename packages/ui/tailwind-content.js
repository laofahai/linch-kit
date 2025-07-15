/**
 * LinchKit UI - Tailwind Content 配置
 * 提供给消费者应用的内容扫描路径
 */

module.exports = {
  /**
   * 获取LinchKit UI包的内容扫描路径
   * 支持both monorepo和独立发布环境
   */
  getContentPaths: () => {
    const fs = require('fs');
    const path = require('path');
    
    // 尝试不同的路径，支持多种环境
    const possiblePaths = [
      // 1. 生产环境 - 从 node_modules 安装
      './node_modules/@linch-kit/ui/dist/**/*.{js,ts,jsx,tsx}',
      // 2. 开发环境 - monorepo 相对路径
      '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
      // 3. 包内构建产物
      './node_modules/@linch-kit/ui/src/**/*.{js,ts,jsx,tsx}',
    ];
    
    return possiblePaths;
  },
  
  /**
   * 预定义的类名清单 - 确保重要的类名始终被包含
   * 即使在静态分析中未检测到
   */
  safelist: [
    'bg-primary',
    'text-primary-foreground',
    'bg-secondary', 
    'text-secondary-foreground',
    'bg-accent',
    'text-accent-foreground',
    'bg-muted',
    'text-muted-foreground',
    'bg-card',
    'text-card-foreground',
    'bg-destructive',
    'text-destructive-foreground',
    'border-border',
    'border-input',
    'text-foreground',
    'bg-background',
    'ring-ring',
    // Hover states
    'hover:bg-primary/90',
    'hover:bg-secondary/90', 
    'hover:bg-destructive/90',
  ]
};