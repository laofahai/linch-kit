import type { 
  DatabaseConfigProvider, 
  LinchConfig, 
  AppConfig, 
  DatabaseConfig 
} from './types'

/**
 * 数据库配置表结构
 */
export interface ConfigRecord {
  id: string
  key: string
  value: any
  type: 'app' | 'feature' | 'custom'
  environment?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * 抽象数据库配置提供者
 */
export abstract class AbstractDatabaseConfigProvider implements DatabaseConfigProvider {
  constructor(protected databaseConfig: DatabaseConfig) {}

  abstract connect(): Promise<void>
  abstract disconnect(): Promise<void>
  abstract query(sql: string, params?: any[]): Promise<any[]>
  abstract execute(sql: string, params?: any[]): Promise<void>

  async load(): Promise<Partial<LinchConfig>> {
    await this.connect()
    
    try {
      const appConfig = await this.getAppConfig()
      return appConfig ? { app: appConfig } : {}
    } finally {
      await this.disconnect()
    }
  }

  async save(config: Partial<LinchConfig>): Promise<void> {
    if (!config.app) return

    await this.connect()
    
    try {
      await this.updateAppConfig(config.app)
    } finally {
      await this.disconnect()
    }
  }

  async getAppConfig(): Promise<AppConfig | null> {
    const records = await this.query(
      'SELECT key, value FROM config WHERE type = ? AND (environment IS NULL OR environment = ?)',
      ['app', process.env.NODE_ENV || 'development']
    )

    if (records.length === 0) return null

    const config: any = {}
    records.forEach(record => {
      this.setNestedValue(config, record.key, record.value)
    })

    return config
  }

  async updateAppConfig(config: Partial<AppConfig>): Promise<void> {
    const flatConfig = this.flattenObject(config, 'app')
    const environment = process.env.NODE_ENV || 'development'

    for (const [key, value] of Object.entries(flatConfig)) {
      await this.execute(
        `INSERT INTO config (id, key, value, type, environment, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?) 
         ON CONFLICT(key, environment) DO UPDATE SET 
         value = excluded.value, updatedAt = excluded.updatedAt`,
        [
          this.generateId(),
          key,
          JSON.stringify(value),
          'app',
          environment,
          new Date(),
          new Date()
        ]
      )
    }
  }

  async getFeatureFlags(): Promise<Record<string, boolean>> {
    const records = await this.query(
      'SELECT key, value FROM config WHERE type = ? AND (environment IS NULL OR environment = ?)',
      ['feature', process.env.NODE_ENV || 'development']
    )

    const features: Record<string, boolean> = {}
    records.forEach(record => {
      const key = record.key.replace('features.', '')
      features[key] = JSON.parse(record.value)
    })

    return features
  }

  async updateFeatureFlag(key: string, enabled: boolean): Promise<void> {
    const fullKey = `features.${key}`
    const environment = process.env.NODE_ENV || 'development'

    await this.execute(
      `INSERT INTO config (id, key, value, type, environment, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?) 
       ON CONFLICT(key, environment) DO UPDATE SET 
       value = excluded.value, updatedAt = excluded.updatedAt`,
      [
        this.generateId(),
        fullKey,
        JSON.stringify(enabled),
        'feature',
        environment,
        new Date(),
        new Date()
      ]
    )
  }

  /**
   * 扁平化对象
   */
  private flattenObject(obj: any, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {}

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey))
      } else {
        flattened[newKey] = value
      }
    }

    return flattened
  }

  /**
   * 设置嵌套值
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    let current = obj

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {}
      }
      current = current[key]
    }

    const lastKey = keys[keys.length - 1]
    current[lastKey] = JSON.parse(value)
  }

  /**
   * 生成 ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
}

/**
 * PostgreSQL 配置提供者
 */
export class PostgreSQLConfigProvider extends AbstractDatabaseConfigProvider {
  private client: any = null

  async connect(): Promise<void> {
    if (this.client) return

    const { Client } = await import('pg')
    this.client = new Client({
      host: this.databaseConfig.host,
      port: this.databaseConfig.port,
      database: this.databaseConfig.database,
      user: this.databaseConfig.username,
      password: this.databaseConfig.password,
      connectionString: this.databaseConfig.url,
      ssl: this.databaseConfig.ssl
    })

    await this.client.connect()
    await this.ensureConfigTable()
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end()
      this.client = null
    }
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    const result = await this.client.query(sql, params)
    return result.rows
  }

  async execute(sql: string, params: any[] = []): Promise<void> {
    await this.client.query(sql, params)
  }

  private async ensureConfigTable(): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS config (
        id VARCHAR(255) PRIMARY KEY,
        key VARCHAR(255) NOT NULL,
        value TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        environment VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(key, environment)
      )
    `)

    await this.execute(`
      CREATE INDEX IF NOT EXISTS idx_config_type_env 
      ON config(type, environment)
    `)
  }
}

/**
 * MySQL 配置提供者
 */
export class MySQLConfigProvider extends AbstractDatabaseConfigProvider {
  private connection: any = null

  async connect(): Promise<void> {
    if (this.connection) return

    const mysql = await import('mysql2/promise')
    this.connection = await mysql.createConnection({
      host: this.databaseConfig.host,
      port: this.databaseConfig.port,
      database: this.databaseConfig.database,
      user: this.databaseConfig.username,
      password: this.databaseConfig.password,
      ssl: this.databaseConfig.ssl
    })

    await this.ensureConfigTable()
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end()
      this.connection = null
    }
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    const [rows] = await this.connection.execute(sql, params)
    return rows as any[]
  }

  async execute(sql: string, params: any[] = []): Promise<void> {
    await this.connection.execute(sql, params)
  }

  private async ensureConfigTable(): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS config (
        id VARCHAR(255) PRIMARY KEY,
        \`key\` VARCHAR(255) NOT NULL,
        value TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        environment VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_key_env (\`key\`, environment)
      )
    `)

    await this.execute(`
      CREATE INDEX idx_config_type_env 
      ON config(type, environment)
    `)
  }
}

/**
 * SQLite 配置提供者
 */
export class SQLiteConfigProvider extends AbstractDatabaseConfigProvider {
  private db: any = null

  async connect(): Promise<void> {
    if (this.db) return

    const sqlite3 = await import('sqlite3')
    const { open } = await import('sqlite')

    this.db = await open({
      filename: this.databaseConfig.database,
      driver: sqlite3.Database
    })

    await this.ensureConfigTable()
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      await this.db.close()
      this.db = null
    }
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    return await this.db.all(sql, params)
  }

  async execute(sql: string, params: any[] = []): Promise<void> {
    await this.db.run(sql, params)
  }

  private async ensureConfigTable(): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS config (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        type TEXT NOT NULL,
        environment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(key, environment)
      )
    `)

    await this.execute(`
      CREATE INDEX IF NOT EXISTS idx_config_type_env 
      ON config(type, environment)
    `)
  }
}

/**
 * 创建数据库配置提供者
 */
export function createDatabaseConfigProvider(
  databaseConfig: DatabaseConfig
): DatabaseConfigProvider {
  switch (databaseConfig.type) {
    case 'postgresql':
      return new PostgreSQLConfigProvider(databaseConfig)
    case 'mysql':
      return new MySQLConfigProvider(databaseConfig)
    case 'sqlite':
      return new SQLiteConfigProvider(databaseConfig)
    default:
      throw new Error(`Unsupported database type: ${databaseConfig.type}`)
  }
}
