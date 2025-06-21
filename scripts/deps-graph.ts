#!/usr/bin/env node

import { readFileSync } from 'fs'
import { join } from 'path'
import { glob } from 'glob'

interface PackageInfo {
  name: string
  path: string
  packageJson: any
  dependencies: string[]
}

interface DependencyAnalysis {
  packages: PackageInfo[]
  cycles: string[][]
  buildOrder: string[]
  levels: Map<number, string[]>
  mermaidGraph: string
}

/**
 * 依赖图分析工具
 * 
 * 功能：
 * 1. 分析包之间的依赖关系
 * 2. 检测循环依赖
 * 3. 生成构建顺序
 * 4. 可视化依赖图
 */

class DependencyGraph {
  constructor() {
    this.packages = new Map()
    this.dependencies = new Map()
    this.reverseDependencies = new Map()
  }

  /**
   * 加载所有包的信息
   */
  async loadPackages() {
    const packagePaths = await glob('packages/*/package.json')
    
    for (const path of packagePaths) {
      const packageJson = JSON.parse(readFileSync(path, 'utf-8'))
      const packageName = packageJson.name
      
      this.packages.set(packageName, {
        name: packageName,
        version: packageJson.version,
        path: path.replace('/package.json', ''),
        packageJson
      })

      // 收集依赖关系
      const deps = new Set()
      
      // 添加 dependencies
      if (packageJson.dependencies) {
        Object.keys(packageJson.dependencies).forEach(dep => {
          if (dep.startsWith('@linch-kit/')) {
            deps.add(dep)
          }
        })
      }

      // 添加 devDependencies 中的内部依赖
      if (packageJson.devDependencies) {
        Object.keys(packageJson.devDependencies).forEach(dep => {
          if (dep.startsWith('@linch-kit/')) {
            deps.add(dep)
          }
        })
      }

      this.dependencies.set(packageName, deps)
    }

    // 构建反向依赖图
    this.buildReverseDependencies()
  }

  /**
   * 构建反向依赖图
   */
  buildReverseDependencies() {
    for (const [packageName, deps] of this.dependencies) {
      deps.forEach(dep => {
        if (!this.reverseDependencies.has(dep)) {
          this.reverseDependencies.set(dep, new Set())
        }
        this.reverseDependencies.get(dep).add(packageName)
      })
    }
  }

  /**
   * 检测循环依赖
   */
  detectCycles() {
    const visited = new Set()
    const recursionStack = new Set()
    const cycles = []

    const dfs = (node, path = []) => {
      if (recursionStack.has(node)) {
        // 找到循环
        const cycleStart = path.indexOf(node)
        const cycle = path.slice(cycleStart).concat([node])
        cycles.push(cycle)
        return
      }

      if (visited.has(node)) {
        return
      }

      visited.add(node)
      recursionStack.add(node)
      path.push(node)

      const deps = this.dependencies.get(node) || new Set()
      for (const dep of deps) {
        if (this.packages.has(dep)) {
          dfs(dep, [...path])
        }
      }

      recursionStack.delete(node)
      path.pop()
    }

    for (const packageName of this.packages.keys()) {
      if (!visited.has(packageName)) {
        dfs(packageName)
      }
    }

    return cycles
  }

  /**
   * 拓扑排序 - 生成构建顺序
   */
  topologicalSort() {
    const inDegree = new Map()
    const queue = []
    const result = []

    // 初始化入度
    for (const packageName of this.packages.keys()) {
      inDegree.set(packageName, 0)
    }

    // 计算入度
    for (const [packageName, deps] of this.dependencies) {
      deps.forEach(dep => {
        if (this.packages.has(dep)) {
          inDegree.set(dep, (inDegree.get(dep) || 0) + 1)
        }
      })
    }

    // 找到入度为0的节点
    for (const [packageName, degree] of inDegree) {
      if (degree === 0) {
        queue.push(packageName)
      }
    }

    // 拓扑排序
    while (queue.length > 0) {
      const current = queue.shift()
      result.push(current)

      const deps = this.dependencies.get(current) || new Set()
      deps.forEach(dep => {
        if (this.packages.has(dep)) {
          const newDegree = inDegree.get(dep) - 1
          inDegree.set(dep, newDegree)
          if (newDegree === 0) {
            queue.push(dep)
          }
        }
      })
    }

    return result
  }

  /**
   * 获取包的依赖层级
   */
  getDependencyLevels() {
    const levels = new Map()
    const visited = new Set()

    const calculateLevel = (packageName) => {
      if (visited.has(packageName)) {
        return levels.get(packageName) || 0
      }

      visited.add(packageName)
      const deps = this.dependencies.get(packageName) || new Set()
      
      let maxLevel = 0
      for (const dep of deps) {
        if (this.packages.has(dep)) {
          maxLevel = Math.max(maxLevel, calculateLevel(dep) + 1)
        }
      }

      levels.set(packageName, maxLevel)
      return maxLevel
    }

    for (const packageName of this.packages.keys()) {
      calculateLevel(packageName)
    }

    return levels
  }

  /**
   * 生成 Mermaid 图表
   */
  generateMermaidGraph() {
    let mermaid = 'graph TD\n'
    
    // 添加节点
    for (const packageName of this.packages.keys()) {
      const shortName = packageName.replace('@linch-kit/', '')
      mermaid += `  ${shortName}[${shortName}]\n`
    }

    // 添加边
    for (const [packageName, deps] of this.dependencies) {
      const shortName = packageName.replace('@linch-kit/', '')
      deps.forEach(dep => {
        if (this.packages.has(dep)) {
          const depShortName = dep.replace('@linch-kit/', '')
          mermaid += `  ${shortName} --> ${depShortName}\n`
        }
      })
    }

    return mermaid
  }

  /**
   * 分析并输出报告
   */
  async analyze() {
    await this.loadPackages()

    console.log('📊 依赖图分析报告')
    console.log('='.repeat(50))

    // 基本信息
    console.log(`\n📦 包总数: ${this.packages.size}`)
    console.log('包列表:')
    for (const [name, info] of this.packages) {
      console.log(`  - ${name}@${info.version}`)
    }

    // 检测循环依赖
    console.log('\n🔄 循环依赖检测:')
    const cycles = this.detectCycles()
    if (cycles.length === 0) {
      console.log('  ✅ 未发现循环依赖')
    } else {
      console.log('  ❌ 发现循环依赖:')
      cycles.forEach((cycle, index) => {
        console.log(`    ${index + 1}. ${cycle.join(' -> ')}`)
      })
    }

    // 构建顺序
    console.log('\n🏗️ 推荐构建顺序:')
    const buildOrder = this.topologicalSort()
    buildOrder.forEach((packageName, index) => {
      console.log(`  ${index + 1}. ${packageName}`)
    })

    // 依赖层级
    console.log('\n📊 依赖层级:')
    const levels = this.getDependencyLevels()
    const levelGroups = new Map()
    
    for (const [packageName, level] of levels) {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, [])
      }
      levelGroups.get(level).push(packageName)
    }

    for (const [level, packages] of [...levelGroups.entries()].sort(([a], [b]) => a - b)) {
      console.log(`  Level ${level}: ${packages.join(', ')}`)
    }

    // Mermaid 图表
    console.log('\n🎨 Mermaid 依赖图:')
    console.log(this.generateMermaidGraph())

    return {
      packages: this.packages,
      cycles,
      buildOrder,
      levels: levelGroups,
      mermaidGraph: this.generateMermaidGraph()
    }
  }
}

// 运行分析
if (import.meta.url === `file://${process.argv[1]}`) {
  const graph = new DependencyGraph()
  graph.analyze().catch(console.error)
}

export { DependencyGraph }
