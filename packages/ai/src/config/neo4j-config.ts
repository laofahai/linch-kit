/**
 * Neo4j 配置加载器
 * 
 * 从配置文件加载 Neo4j 连接信息
 */

import { readFile } from 'fs/promises'
import { join } from 'path'

import { createLogger } from '@linch-kit/core/server'

import type { Neo4jConfig } from '../types/index.js'

const logger = createLogger({ name: 'ai:neo4j-config' })

/**
 * 加载 Neo4j 配置 - 优先使用环境变量
 */
export async function loadNeo4jConfig(): Promise<Neo4jConfig> {
  // 优先使用环境变量
  const envConfig = loadFromEnv()
  if (envConfig) {
    logger.debug('Neo4j 配置从环境变量加载成功', {
      connectionUri: envConfig.connectionUri,
      username: envConfig.username,
      database: envConfig.database
    })
    return envConfig
  }

  // fallback 到配置文件
  try {
    const configPath = join(process.cwd(), 'graph_db_connection.json')
    const configContent = await readFile(configPath, 'utf8')
    const config = JSON.parse(configContent)
    
    const neo4jConfig: Neo4jConfig = {
      connectionUri: config.neo4j.connectionUri,
      username: config.neo4j.username,
      password: config.neo4j.password,
      database: config.neo4j.database || 'neo4j'
    }
    
    logger.debug('Neo4j 配置从文件加载成功', {
      connectionUri: neo4jConfig.connectionUri,
      username: neo4jConfig.username,
      database: neo4jConfig.database
    })
    
    return neo4jConfig
  } catch (error) {
    logger.error('无法加载 Neo4j 配置', error instanceof Error ? error : undefined, { 
      originalError: error,
      configPath: join(process.cwd(), 'graph_db_connection.json')
    })
    
    throw new Error(
      '请设置环境变量 NEO4J_CONNECTION_URI, NEO4J_USERNAME, NEO4J_PASSWORD，' +
      '或确保 graph_db_connection.json 文件存在并格式正确。'
    )
  }
}

/**
 * 从环境变量加载配置
 */
function loadFromEnv(): Neo4jConfig | null {
  const connectionUri = process.env.NEO4J_CONNECTION_URI
  const username = process.env.NEO4J_USERNAME
  const password = process.env.NEO4J_PASSWORD
  const database = process.env.NEO4J_DATABASE || 'neo4j'

  if (!connectionUri || !username || !password) {
    return null
  }

  return {
    connectionUri,
    username,
    password,
    database
  }
}

/**
 * 验证 Neo4j 配置
 */
export function validateNeo4jConfig(config: Neo4jConfig): boolean {
  const requiredFields = ['connectionUri', 'username', 'password']
  
  for (const field of requiredFields) {
    if (!config[field as keyof Neo4jConfig]) {
      logger.error(`Neo4j 配置缺少必要字段: ${field}`)
      return false
    }
  }
  
  // 验证连接 URI 格式
  if (!config.connectionUri.startsWith('neo4j://') && 
      !config.connectionUri.startsWith('neo4j+s://') &&
      !config.connectionUri.startsWith('bolt://') &&
      !config.connectionUri.startsWith('bolt+s://')) {
    logger.error('无效的 Neo4j 连接 URI 格式')
    return false
  }
  
  return true
}