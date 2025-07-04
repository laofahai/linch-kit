#!/usr/bin/env node

/**
 * Website 配置验证脚本
 * 验证 Next.js 配置、依赖项和关键文件
 */

const fs = require('fs')
const path = require('path')

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`)
}

// 验证项
const validations = [
  {
    name: 'package.json 存在',
    check: () => fs.existsSync('package.json'),
    fix: () => '请确保 package.json 文件存在'
  },
  {
    name: 'Next.js 配置文件',
    check: () => fs.existsSync('next.config.ts') || fs.existsSync('next.config.js'),
    fix: () => '创建 next.config.ts 或 next.config.js'
  },
  {
    name: 'TypeScript 配置',
    check: () => fs.existsSync('tsconfig.json'),
    fix: () => '创建 tsconfig.json 文件'
  },
  {
    name: 'Tailwind CSS 配置',
    check: () => fs.existsSync('tailwind.config.ts') || fs.existsSync('tailwind.config.js'),
    fix: () => '创建 Tailwind CSS 配置文件'
  },
  {
    name: 'app 目录结构',
    check: () => fs.existsSync('app') && fs.lstatSync('app').isDirectory(),
    fix: () => '创建 app 目录'
  },
  {
    name: 'layout.tsx 存在',
    check: () => fs.existsSync('app/layout.tsx'),
    fix: () => '在 app/ 目录下创建 layout.tsx'
  },
  {
    name: 'global CSS 文件',
    check: () => fs.existsSync('app/globals.css'),
    fix: () => '在 app/ 目录下创建 globals.css'
  },
  {
    name: 'theme.config.tsx 存在',
    check: () => fs.existsSync('theme.config.tsx'),
    fix: () => '创建 Nextra 主题配置文件'
  },
  {
    name: 'docs 目录结构',
    check: () => fs.existsSync('app/docs') && fs.lstatSync('app/docs').isDirectory(),
    fix: () => '创建 docs 目录结构'
  },
  {
    name: 'public 目录',
    check: () => fs.existsSync('public') && fs.lstatSync('public').isDirectory(),
    fix: () => '创建 public 目录'
  }
]

// 验证依赖项
const validateDependencies = () => {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
    
    const requiredDeps = [
      'next',
      'react',
      'react-dom',
      'nextra',
      'nextra-theme-docs',
      'typescript',
      'tailwindcss'
    ]
    
    let missing = []
    
    for (const dep of requiredDeps) {
      if (!deps[dep]) {
        missing.push(dep)
      }
    }
    
    if (missing.length === 0) {
      log.success('所有必需依赖项已安装')
      return true
    } else {
      log.error(`缺少依赖项: ${missing.join(', ')}`)
      return false
    }
  } catch (error) {
    log.error('无法读取 package.json')
    return false
  }
}

// 验证 Next.js 配置
const validateNextConfig = () => {
  try {
    const configPath = fs.existsSync('next.config.ts') ? 'next.config.ts' : 'next.config.js'
    if (!fs.existsSync(configPath)) {
      log.error('Next.js 配置文件不存在')
      return false
    }
    
    const config = fs.readFileSync(configPath, 'utf8')
    
    // 检查关键配置
    const checks = [
      { pattern: /nextra/i, name: 'Nextra 集成' },
      { pattern: /output.*export/i, name: '静态导出配置' },
      { pattern: /i18n/i, name: '国际化配置' }
    ]
    
    let passed = 0
    for (const check of checks) {
      if (check.pattern.test(config)) {
        log.success(`${check.name} ✓`)
        passed++
      } else {
        log.warning(`${check.name} 未配置`)
      }
    }
    
    return passed > 0
  } catch (error) {
    log.error('验证 Next.js 配置时出错')
    return false
  }
}

// 验证文档结构
const validateDocsStructure = () => {
  const docsPath = 'app/docs'
  if (!fs.existsSync(docsPath)) {
    log.error('docs 目录不存在')
    return false
  }
  
  const requiredFiles = [
    '_meta.json',
    'index.mdx',
    'getting-started.mdx'
  ]
  
  let missing = []
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(docsPath, file))) {
      missing.push(file)
    }
  }
  
  if (missing.length === 0) {
    log.success('文档结构验证通过')
    return true
  } else {
    log.warning(`缺少文档文件: ${missing.join(', ')}`)
    return true // 非关键错误
  }
}

// 主验证函数
const runValidation = () => {
  log.info('开始验证 Website 配置...\n')
  
  let passedCount = 0
  let totalCount = validations.length
  
  // 运行基础验证
  for (const validation of validations) {
    if (validation.check()) {
      log.success(validation.name)
      passedCount++
    } else {
      log.error(`${validation.name} - ${validation.fix()}`)
    }
  }
  
  console.log('')
  
  // 运行高级验证
  const advancedChecks = [
    { name: '依赖项验证', check: validateDependencies },
    { name: 'Next.js 配置验证', check: validateNextConfig },
    { name: '文档结构验证', check: validateDocsStructure }
  ]
  
  let advancedPassed = 0
  for (const check of advancedChecks) {
    log.info(`运行 ${check.name}...`)
    if (check.check()) {
      advancedPassed++
    }
    console.log('')
  }
  
  // 总结
  const totalScore = passedCount + advancedPassed
  const maxScore = totalCount + advancedChecks.length
  
  console.log('验证完成!')
  console.log(`基础验证: ${passedCount}/${totalCount}`)
  console.log(`高级验证: ${advancedPassed}/${advancedChecks.length}`)
  console.log(`总分: ${totalScore}/${maxScore}`)
  
  if (totalScore === maxScore) {
    log.success('🎉 所有验证通过！网站配置完整。')
    return true
  } else if (totalScore >= maxScore * 0.8) {
    log.warning('⚠️  大部分验证通过，但还有一些可以改进的地方。')
    return true
  } else {
    log.error('❌ 配置存在重要问题，需要修复后才能正常运行。')
    return false
  }
}

// 运行验证
const isValid = runValidation()
process.exit(isValid ? 0 : 1)