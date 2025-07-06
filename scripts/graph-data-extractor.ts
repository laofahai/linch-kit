#!/usr/bin/env bun

/**
 * LinchKit Graph RAG Data Extractor
 * 
 * 扩展现有 deps-graph.js 功能，输出 Graph RAG 格式的数据
 * 使用 TypeScript + bun 生态，符合 LinchKit 技术约束
 */

import { readdir, readFile, writeFile, mkdir, stat, access } from 'fs/promises';
import { join, relative, extname, dirname } from 'path';

// 类型定义
interface PackageInfo {
  name: string;
  path: string;
  packageJson: {
    name: string;
    version?: string;
    description?: string;
    main?: string;
    types?: string;
    keywords?: string[];
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };
}

interface GraphNode {
  id: string;
  type: 'Package' | 'File' | 'Document' | 'API';
  name: string;
  properties: Record<string, unknown>;
  metadata: {
    created_at: string;
    source_file?: string;
    package?: string;
  };
}

interface GraphRelationship {
  id: string;
  type: 'DEPENDS_ON' | 'CONTAINS' | 'DOCUMENTS' | 'DEFINES';
  source: string;
  target: string;
  properties: Record<string, unknown>;
  metadata: {
    created_at: string;
    confidence?: number;
  };
}

interface AnalysisResult {
  packages: PackageInfo[];
  buildOrder: string[];
  dependencies: Array<[string, Set<string>]>;
}

/**
 * LinchKit 依赖分析器 (复用现有逻辑)
 */
class DependencyAnalyzer {
  private packages = new Map<string, PackageInfo>();
  private dependencies = new Map<string, Set<string>>();

  async analyze(): Promise<AnalysisResult> {
    try {
      const workspacePackages = await this.getWorkspacePackages();
      
      for (const pkg of workspacePackages) {
        await this.analyzeDependencies(pkg);
      }

      const buildOrder = this.calculateBuildOrder();

      return {
        packages: Array.from(this.packages.values()),
        buildOrder,
        dependencies: Array.from(this.dependencies.entries())
      };
    } catch (error) {
      console.error('依赖分析失败:', error instanceof Error ? error.message : error);
      return {
        packages: [],
        buildOrder: [],
        dependencies: []
      };
    }
  }

  private async getWorkspacePackages(): Promise<PackageInfo[]> {
    const packages: PackageInfo[] = [];
    
    // 扫描 packages 目录
    const packagesDir = join(process.cwd(), 'packages');
    try {
      const packageNames = await readdir(packagesDir);
      for (const name of packageNames) {
        const packagePath = join(packagesDir, name);
        const packageJsonPath = join(packagePath, 'package.json');
        
        try {
          await access(packageJsonPath);
          const packageJsonContent = await readFile(packageJsonPath, 'utf8');
          const packageJson = JSON.parse(packageJsonContent);
          packages.push({
            name: packageJson.name,
            path: packagePath,
            packageJson
          });
        } catch {
          // package.json 不存在或无法解析，跳过
        }
      }
    } catch {
      // packages 目录不存在
    }

    // 扫描 modules 目录
    const modulesDir = join(process.cwd(), 'modules');
    try {
      const moduleNames = await readdir(modulesDir);
      for (const name of moduleNames) {
        const modulePath = join(modulesDir, name);
        const packageJsonPath = join(modulePath, 'package.json');
        
        try {
          await access(packageJsonPath);
          const packageJsonContent = await readFile(packageJsonPath, 'utf8');
          const packageJson = JSON.parse(packageJsonContent);
          packages.push({
            name: packageJson.name,
            path: modulePath,
            packageJson
          });
        } catch {
          // package.json 不存在或无法解析，跳过
        }
      }
    } catch {
      // modules 目录不存在
    }

    return packages;
  }

  private async analyzeDependencies(pkg: PackageInfo): Promise<void> {
    this.packages.set(pkg.name, pkg);
    
    const deps = new Set<string>();
    
    // 收集所有依赖
    const { dependencies = {}, devDependencies = {}, peerDependencies = {} } = pkg.packageJson;
    
    // 只关心内部包依赖
    for (const dep of Object.keys({ ...dependencies, ...devDependencies, ...peerDependencies })) {
      if (dep.startsWith('@linch-kit/')) {
        deps.add(dep);
      }
    }
    
    this.dependencies.set(pkg.name, deps);
  }

  private calculateBuildOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const buildOrder: string[] = [];
    
    const visit = (packageName: string): void => {
      if (visited.has(packageName)) return;
      if (visiting.has(packageName)) {
        throw new Error(`循环依赖检测到: ${packageName}`);
      }
      
      visiting.add(packageName);
      
      const deps = this.dependencies.get(packageName) || new Set();
      for (const dep of deps) {
        if (this.packages.has(dep)) {
          visit(dep);
        }
      }
      
      visiting.delete(packageName);
      visited.add(packageName);
      buildOrder.push(packageName);
    };
    
    // 访问所有包
    for (const packageName of this.packages.keys()) {
      visit(packageName);
    }
    
    return buildOrder;
  }
}

/**
 * Graph RAG 数据提取器
 * 扩展依赖分析器，添加 Neo4j 格式输出
 */
class GraphDataExtractor extends DependencyAnalyzer {
  private graphNodes: GraphNode[] = [];
  private graphRelationships: GraphRelationship[] = [];

  /**
   * 生成 Graph RAG 格式数据
   */
  async extractGraphData(): Promise<{ nodes: GraphNode[]; relationships: GraphRelationship[] }> {
    try {
      console.log('🔍 开始提取 LinchKit Graph RAG 数据...');
      
      // 使用父类的分析功能
      const analysisResult = await this.analyze();
      
      // 转换为 Graph 格式
      await this.convertToGraphFormat(analysisResult);
      
      // 输出数据文件
      await this.writeGraphData();
      
      console.log('✅ Graph RAG 数据提取完成!');
      console.log(`节点数量: ${this.graphNodes.length}`);
      console.log(`关系数量: ${this.graphRelationships.length}`);
      
      return {
        nodes: this.graphNodes,
        relationships: this.graphRelationships
      };
    } catch (error) {
      console.error('❌ Graph RAG 数据提取失败:', error instanceof Error ? error.message : error);
      throw error;
    }
  }

  /**
   * 将依赖分析结果转换为 Graph 格式
   */
  private async convertToGraphFormat(analysisResult: AnalysisResult): Promise<void> {
    console.log('🔄 转换数据为 Graph 格式...');
    
    // 转换包节点
    for (const pkg of analysisResult.packages) {
      const packageNode = this.createPackageNode(pkg);
      this.graphNodes.push(packageNode);
      
      // 添加文件节点 (如果存在关键文件)
      await this.addFileNodes(pkg);
    }
    
    // 转换依赖关系
    for (const [packageName, dependencies] of analysisResult.dependencies) {
      for (const dep of dependencies) {
        const relationship = this.createDependencyRelationship(packageName, dep);
        this.graphRelationships.push(relationship);
      }
    }
  }

  /**
   * 创建包节点
   */
  private createPackageNode(pkg: PackageInfo): GraphNode {
    return {
      id: this.generateNodeId('package', pkg.name),
      type: 'Package',
      name: pkg.name,
      properties: {
        version: pkg.packageJson.version || '1.0.0',
        description: pkg.packageJson.description || '',
        path: relative(process.cwd(), pkg.path),
        main: pkg.packageJson.main || '',
        types: pkg.packageJson.types || '',
        keywords: pkg.packageJson.keywords || []
      },
      metadata: {
        created_at: new Date().toISOString(),
        source_file: join(pkg.path, 'package.json'),
        package: pkg.name
      }
    };
  }

  /**
   * 添加文件节点 (README, index.ts 等关键文件)
   */
  private async addFileNodes(pkg: PackageInfo): Promise<void> {
    const keyFiles = [
      'README.md',
      'CHANGELOG.md', 
      'src/index.ts',
      'src/index.js'
    ];
    
    for (const fileName of keyFiles) {
      const filePath = join(pkg.path, fileName);
      try {
        await access(filePath);
        const fileStats = await stat(filePath);
        
        const fileNode: GraphNode = {
          id: this.generateNodeId('file', `${pkg.name}/${fileName}`),
          type: 'File',
          name: fileName,
          properties: {
            file_type: extname(fileName).slice(1) || 'unknown',
            file_path: relative(process.cwd(), filePath),
            size: fileStats.size
          },
          metadata: {
            created_at: new Date().toISOString(),
            source_file: filePath,
            package: pkg.name
          }
        };
        
        this.graphNodes.push(fileNode);
        
        // 创建包包含文件的关系
        const containsRelationship: GraphRelationship = {
          id: this.generateRelationshipId('contains', pkg.name, fileName),
          type: 'CONTAINS',
          source: this.generateNodeId('package', pkg.name),
          target: this.generateNodeId('file', `${pkg.name}/${fileName}`),
          properties: {},
          metadata: {
            created_at: new Date().toISOString()
          }
        };
        
        this.graphRelationships.push(containsRelationship);
      } catch {
        // 文件不存在，跳过
      }
    }
  }

  /**
   * 创建依赖关系
   */
  private createDependencyRelationship(sourcePackage: string, targetPackage: string): GraphRelationship {
    return {
      id: this.generateRelationshipId('depends_on', sourcePackage, targetPackage),
      type: 'DEPENDS_ON',
      source: this.generateNodeId('package', sourcePackage),
      target: this.generateNodeId('package', targetPackage),
      properties: {
        dependency_type: 'package'
      },
      metadata: {
        created_at: new Date().toISOString(),
        confidence: 1.0
      }
    };
  }

  /**
   * 生成节点ID
   */
  private generateNodeId(type: string, name: string): string {
    return `${type}:${name.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
  }

  /**
   * 生成关系ID  
   */
  private generateRelationshipId(type: string, source: string, target: string): string {
    return `${type}:${source.replace(/[^a-zA-Z0-9-_]/g, '_')}_${target.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
  }

  /**
   * 写入 Graph 数据文件
   */
  private async writeGraphData(): Promise<void> {
    const outputDir = join(process.cwd(), 'graph-data');
    
    // 确保输出目录存在
    try {
      await mkdir(outputDir, { recursive: true });
    } catch {
      // 目录可能已存在
    }
    
    // 写入节点数据
    const nodesFile = join(outputDir, 'nodes.json');
    await writeFile(nodesFile, JSON.stringify(this.graphNodes, null, 2));
    console.log(`📝 节点数据已写入: ${nodesFile}`);
    
    // 写入关系数据
    const relationshipsFile = join(outputDir, 'relationships.json');
    await writeFile(relationshipsFile, JSON.stringify(this.graphRelationships, null, 2));
    console.log(`📝 关系数据已写入: ${relationshipsFile}`);
    
    // 写入 Neo4j 导入格式 (CSV)
    await this.writeNeo4jCSV(outputDir);
  }

  /**
   * 写入 Neo4j CSV 格式文件
   */
  private async writeNeo4jCSV(outputDir: string): Promise<void> {
    // 节点 CSV
    const nodesCsvHeader = 'id:ID,type:LABEL,name,properties:JSON,metadata:JSON\n';
    const nodesCsvRows = this.graphNodes.map(node => 
      `"${node.id}","${node.type}","${node.name}","${JSON.stringify(node.properties || {}).replace(/"/g, '""')}","${JSON.stringify(node.metadata || {}).replace(/"/g, '""')}"`
    ).join('\n');
    
    const nodesCsvFile = join(outputDir, 'nodes.csv');
    await writeFile(nodesCsvFile, nodesCsvHeader + nodesCsvRows);
    console.log(`📝 Neo4j 节点 CSV 已写入: ${nodesCsvFile}`);
    
    // 关系 CSV
    const relsCsvHeader = 'id:ID,:START_ID,:END_ID,:TYPE,properties:JSON,metadata:JSON\n';
    const relsCsvRows = this.graphRelationships.map(rel => 
      `"${rel.id}","${rel.source}","${rel.target}","${rel.type}","${JSON.stringify(rel.properties || {}).replace(/"/g, '""')}","${JSON.stringify(rel.metadata || {}).replace(/"/g, '""')}"`
    ).join('\n');
    
    const relsCsvFile = join(outputDir, 'relationships.csv');
    await writeFile(relsCsvFile, relsCsvHeader + relsCsvRows);
    console.log(`📝 Neo4j 关系 CSV 已写入: ${relsCsvFile}`);
  }
}

// 如果作为脚本直接运行
if (import.meta.main) {
  const extractor = new GraphDataExtractor();
  extractor.extractGraphData().catch(error => {
    console.error('提取失败:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

export { GraphDataExtractor, type GraphNode, type GraphRelationship };