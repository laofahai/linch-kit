#!/usr/bin/env node
/**
 * 包复用检查脚本 - 检查LinchKit包中是否已有相似功能
 * @description 避免重复实现，强制使用现有包功能
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT_DIR = join(__dirname, '..')

// 搜索关键词映射到包的功能
const PACKAGE_FEATURES = {
  // @linch-kit/core
  'logger': ['@linch-kit/core - Logger类', 'packages/core/src/utils/logger.ts'],
  'config': ['@linch-kit/core - ConfigManager', 'packages/core/src/config/manager.ts'],
  'plugin': ['@linch-kit/core - PluginRegistry', 'packages/core/src/plugin/registry.ts'],
  'event': ['@linch-kit/core - EventEmitter功能', 'packages/core/src/utils/'],
  'cache': ['@linch-kit/core - 缓存机制', 'packages/core/src/cache/'],
  
  // @linch-kit/schema
  'schema': ['@linch-kit/schema - defineEntity', 'packages/schema/src/core/entity.ts'],
  'entity': ['@linch-kit/schema - 实体定义', 'packages/schema/src/core/entity.ts'],
  'validation': ['@linch-kit/schema - Zod验证', 'packages/schema/src/validation/'],
  'field': ['@linch-kit/schema - defineField', 'packages/schema/src/core/field.ts'],
  
  // @linch-kit/auth
  'auth': ['@linch-kit/auth - 认证系统', 'packages/auth/src/'],
  'permission': ['@linch-kit/auth - PermissionChecker', 'packages/auth/src/permissions/'],
  'role': ['@linch-kit/auth - 角色管理', 'packages/auth/src/roles/'],
  'session': ['@linch-kit/auth - Session管理', 'packages/auth/src/session/'],
  
  // @linch-kit/crud
  'crud': ['@linch-kit/crud - createCRUD', 'packages/crud/src/core/crud-manager.ts'],
  'create': ['@linch-kit/crud - 创建操作', 'packages/crud/src/operations/create.ts'],
  'read': ['@linch-kit/crud - 读取操作', 'packages/crud/src/operations/read.ts'],
  'update': ['@linch-kit/crud - 更新操作', 'packages/crud/src/operations/update.ts'],
  'delete': ['@linch-kit/crud - 删除操作', 'packages/crud/src/operations/delete.ts'],
  'query': ['@linch-kit/crud - 查询构建器', 'packages/crud/src/query/'],
  
  // @linch-kit/trpc
  'api': ['@linch-kit/trpc - API路由', 'packages/trpc/src/'],
  'router': ['@linch-kit/trpc - tRPC路由器', 'packages/trpc/src/router/'],
  'procedure': ['@linch-kit/trpc - tRPC过程', 'packages/trpc/src/procedures/'],
  'middleware': ['@linch-kit/trpc - 中间件', 'packages/trpc/src/middleware/'],
  
  // @linch-kit/ui
  'component': ['@linch-kit/ui - UI组件', 'packages/ui/src/components/'],
  'button': ['@linch-kit/ui - Button组件', 'packages/ui/src/components/ui/button.tsx'],
  'form': ['@linch-kit/ui - Form组件', 'packages/ui/src/components/ui/form.tsx'],
  'table': ['@linch-kit/ui - Table组件', 'packages/ui/src/components/ui/table.tsx'],
  'dialog': ['@linch-kit/ui - Dialog组件', 'packages/ui/src/components/ui/dialog.tsx'],
  'sidebar': ['@linch-kit/ui - Sidebar组件', 'packages/ui/src/components/ui/sidebar.tsx'],
  'tabs': ['@linch-kit/ui - Tabs组件', 'packages/ui/src/components/ui/tabs.tsx'],
  
  // modules/console
  'console': ['modules/console - 管理控制台', 'modules/console/src/'],
  'dashboard': ['modules/console - Dashboard页面', 'modules/console/src/pages/Dashboard.tsx'],
  'tenant': ['modules/console - 租户管理', 'modules/console/src/entities/tenant.entity.ts'],
  'user': ['modules/console - 用户管理', 'modules/console/src/entities/user-extensions.entity.ts'],
  'monitoring': ['modules/console - 监控功能', 'modules/console/src/entities/monitoring.entity.ts'],
}

// 包的依赖层次
const PACKAGE_HIERARCHY = [
  '@linch-kit/core',
  '@linch-kit/schema', 
  '@linch-kit/auth',
  '@linch-kit/crud',
  '@linch-kit/trpc',
  '@linch-kit/ui',
  '@linch-kit/ai',
  'modules/console'
]

/**
 * 搜索文件内容
 */
function searchInFile(filePath, keywords) {
  try {
    const content = readFileSync(filePath, 'utf8').toLowerCase()
    const matches = []
    
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase()
      if (content.includes(lowerKeyword)) {
        // 找到关键词所在的行
        const lines = content.split('\n')
        lines.forEach((line, index) => {
          if (line.includes(lowerKeyword)) {
            matches.push({
              keyword,
              line: index + 1,
              content: line.trim(),
              file: filePath
            })
          }
        })
      }
    }
    
    return matches
  } catch (error) {
    return []
  }
}

/**
 * 递归搜索目录
 */
function searchInDirectory(dirPath, keywords, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const results = []
  
  try {
    const items = readdirSync(dirPath)
    
    for (const item of items) {
      const fullPath = join(dirPath, item)
      const stat = statSync(fullPath)
      
      if (stat.isDirectory()) {
        // 跳过node_modules等目录
        if (!item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
          results.push(...searchInDirectory(fullPath, keywords, extensions))
        }
      } else if (stat.isFile()) {
        const ext = item.substring(item.lastIndexOf('.'))
        if (extensions.includes(ext)) {
          const matches = searchInFile(fullPath, keywords)
          results.push(...matches)
        }
      }
    }
  } catch (error) {
    // 忽略权限错误等
  }
  
  return results
}

/**
 * 检查包复用
 */
function checkReuse(searchTerms) {
  const keywords = Array.isArray(searchTerms) ? searchTerms : [searchTerms]
  const results = {
    directMatches: [],
    fileMatches: [],
    recommendations: []
  }
  
  // 1. 检查直接功能映射
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase()
    for (const [feature, info] of Object.entries(PACKAGE_FEATURES)) {
      if (feature.includes(lowerKeyword) || lowerKeyword.includes(feature)) {
        results.directMatches.push({
          keyword,
          feature,
          package: info[0],
          path: info[1]
        })
      }
    }
  }
  
  // 2. 在包目录中搜索文件
  const packagesDir = join(ROOT_DIR, 'packages')
  const modulesDir = join(ROOT_DIR, 'modules')
  
  try {
    results.fileMatches.push(...searchInDirectory(packagesDir, keywords))
    results.fileMatches.push(...searchInDirectory(modulesDir, keywords))
  } catch (error) {
    console.warn('搜索目录时出错:', error.message)
  }
  
  // 3. 生成建议
  if (results.directMatches.length > 0) {
    results.recommendations.push('🔍 发现直接匹配的功能，建议使用现有实现')
  }
  
  if (results.fileMatches.length > 0) {
    results.recommendations.push('📁 发现相关文件，请检查是否可以复用')
  }
  
  if (results.directMatches.length === 0 && results.fileMatches.length === 0) {
    results.recommendations.push('✅ 未发现现有实现，可以创建新功能')
    results.recommendations.push('💡 建议在最合适的包中实现，遵循架构依赖顺序')
    results.recommendations.push(`📋 包依赖顺序: ${PACKAGE_HIERARCHY.join(' → ')}`)
  }
  
  return results
}

/**
 * 格式化输出结果
 */
function formatResults(results, searchTerms) {
  console.log(`\n🔎 LinchKit 包复用检查结果`)
  console.log(`🎯 搜索关键词: ${Array.isArray(searchTerms) ? searchTerms.join(', ') : searchTerms}`)
  console.log('=' .repeat(60))
  
  // 直接匹配
  if (results.directMatches.length > 0) {
    console.log('\n🎯 直接功能匹配:')
    results.directMatches.forEach(match => {
      console.log(`  ✅ ${match.keyword} → ${match.package}`)
      console.log(`     📍 位置: ${match.path}`)
    })
  }
  
  // 文件匹配
  if (results.fileMatches.length > 0) {
    console.log('\n📁 相关文件发现:')
    
    // 按文件分组
    const fileGroups = {}
    results.fileMatches.forEach(match => {
      if (!fileGroups[match.file]) {
        fileGroups[match.file] = []
      }
      fileGroups[match.file].push(match)
    })
    
    Object.entries(fileGroups).forEach(([file, matches]) => {
      const relativePath = file.replace(ROOT_DIR, '').replace(/^\//, '')
      console.log(`  📄 ${relativePath}`)
      matches.slice(0, 3).forEach(match => { // 最多显示3个匹配
        console.log(`     ${match.line}: ${match.content.substring(0, 80)}${match.content.length > 80 ? '...' : ''}`)
      })
      if (matches.length > 3) {
        console.log(`     ... 还有 ${matches.length - 3} 个匹配`)
      }
    })
  }
  
  // 建议
  console.log('\n💡 建议:')
  results.recommendations.forEach(rec => {
    console.log(`  ${rec}`)
  })
  
  console.log('\n' + '=' .repeat(60))
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log(`
🔍 LinchKit 包复用检查工具

用法:
  bun run scripts/check-reuse.mjs <关键词>
  bun run scripts/check-reuse.mjs <关键词1> <关键词2> ...

示例:
  bun run scripts/check-reuse.mjs sidebar
  bun run scripts/check-reuse.mjs user management
  bun run scripts/check-reuse.mjs crud operations

功能:
  - 检查LinchKit包中是否已有相似功能
  - 避免重复实现，强制使用现有包功能
  - 提供具体的文件位置和使用建议
`)
    process.exit(0)
  }
  
  const searchTerms = args
  console.log('🚀 开始检查包复用...')
  
  const results = checkReuse(searchTerms)
  formatResults(results, searchTerms)
  
  // 如果发现现有实现，返回非零退出码（用于CI检查）
  if (results.directMatches.length > 0 || results.fileMatches.length > 0) {
    console.log('\n⚠️  发现现有实现，请优先使用现有功能！')
    process.exit(1)
  } else {
    console.log('\n✅ 未发现现有实现，可以继续开发')
    process.exit(0)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}