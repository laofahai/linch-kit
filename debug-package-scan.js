#!/usr/bin/env node

/**
 * 调试包扫描问题
 */

import { readdir, readFile, access } from 'fs/promises'
import { join } from 'path'

async function debugPackageScan() {
  console.log('🔍 调试包扫描...')
  console.log('当前工作目录:', process.cwd())
  
  // 检查packages目录
  const packagesDir = join(process.cwd(), 'packages')
  console.log('包目录:', packagesDir)
  
  try {
    const items = await readdir(packagesDir)
    console.log('packages目录内容:', items)
    
    for (const item of items) {
      const itemPath = join(packagesDir, item)
      const packageJsonPath = join(itemPath, 'package.json')
      
      try {
        await access(packageJsonPath)
        const content = await readFile(packageJsonPath, 'utf8')
        const packageJson = JSON.parse(content)
        console.log(`  ✅ ${item}: ${packageJson.name}`)
      } catch (error) {
        console.log(`  ❌ ${item}: package.json错误`, error.message)
      }
    }
  } catch (error) {
    console.error('❌ 无法读取packages目录:', error.message)
  }
  
  // 检查modules目录
  const modulesDir = join(process.cwd(), 'modules')
  console.log('\nmodules目录:', modulesDir)
  
  try {
    const items = await readdir(modulesDir)
    console.log('modules目录内容:', items)
    
    for (const item of items) {
      const itemPath = join(modulesDir, item)
      const packageJsonPath = join(itemPath, 'package.json')
      
      try {
        await access(packageJsonPath)
        const content = await readFile(packageJsonPath, 'utf8')
        const packageJson = JSON.parse(content)
        console.log(`  ✅ ${item}: ${packageJson.name}`)
      } catch (error) {
        console.log(`  ❌ ${item}: package.json错误`, error.message)
      }
    }
  } catch (error) {
    console.error('❌ 无法读取modules目录:', error.message)
  }
}

debugPackageScan()