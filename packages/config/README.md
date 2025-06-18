# @linch-kit/config

🔧 **Unified configuration management for Linch Kit** - File-based and database-backed configuration with type safety.

## ✨ Features

- 🎯 **Unified Configuration**: Single `linch.config.ts` for all packages
- 🗄️ **Database Support**: Store app config in database for runtime updates
- 🔧 **Type Safe**: Complete TypeScript support with Zod validation
- 🌍 **Multi-Environment**: Development, staging, production config isolation
- 🔄 **Hot Reload**: Watch for configuration changes
- 📦 **Multiple Providers**: File, database, memory configuration sources

## 🚀 Quick Start

### Installation

```bash
npm install @linch-kit/config
```

### Basic Usage

```typescript
import { loadLinchConfig } from '@linch-kit/config'

// Load configuration
const config = await loadLinchConfig({
  configPath: './linch.config.ts',
  loadAppFromDatabase: true
})

console.log(config.database.type) // 'postgresql'
console.log(config.auth.userEntity) // 'enterprise'
```

### Configuration File

Create `linch.config.ts`:

```typescript
import type { LinchConfig } from '@linch-kit/config'

const config: LinchConfig = {
  database: {
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD
  },
  
  auth: {
    userEntity: 'enterprise',
    providers: [
      {
        type: 'shared-token',
        id: 'sso',
        config: {
          token: process.env.SHARED_TOKEN,
          apiUrl: process.env.API_URL
        }
      }
    ],
    permissions: {
      strategy: 'rbac',
      hierarchical: true
    }
  },
  
  app: {
    name: 'My App',
    features: {
      userRegistration: true,
      departmentHierarchy: true
    }
  }
}

export default config
```

## 🗄️ Database Configuration

Store application settings in database for runtime updates:

```typescript
import { createDatabaseConfigProvider } from '@linch-kit/config'

const dbProvider = createDatabaseConfigProvider({
  type: 'postgresql',
  host: 'localhost',
  database: 'myapp'
})

// Get app config from database
const appConfig = await dbProvider.getAppConfig()

// Update feature flag
await dbProvider.updateFeatureFlag('billing', true)
```

## 🔧 Configuration Manager

Use ConfigManager for advanced configuration handling:

```typescript
import { 
  ConfigManager, 
  FileConfigProvider,
  createDatabaseConfigProvider 
} from '@linch-kit/config'

const manager = new ConfigManager([
  new FileConfigProvider({ configPath: './linch.config.ts' }),
  createDatabaseConfigProvider(databaseConfig)
])

// Load merged configuration
const config = await manager.load()

// Watch for changes
manager.watch((newConfig) => {
  console.log('Config updated:', newConfig)
})
```

## 📋 Configuration Schema

### Database Config
```typescript
{
  type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb'
  host?: string
  port?: number
  database: string
  username?: string
  password?: string
  url?: string  // Connection string
}
```

### Auth Config
```typescript
{
  userEntity: 'minimal' | 'basic' | 'enterprise' | 'multi-tenant' | 'custom'
  providers: Array<{
    type: 'oauth' | 'credentials' | 'shared-token' | 'custom'
    id: string
    config: Record<string, any>
  }>
  permissions?: {
    strategy: 'rbac' | 'abac' | 'custom'
    hierarchical?: boolean
    multiTenant?: boolean
  }
}
```

### App Config (Database-backed)
```typescript
{
  name: string
  environment: 'development' | 'staging' | 'production'
  features: Record<string, boolean>  // Feature flags
  theme: {
    primaryColor?: string
    logo?: string
  }
  email?: {
    provider: 'smtp' | 'sendgrid' | 'mailgun'
    config: Record<string, any>
  }
}
```

## 🎨 Templates and Presets

Use built-in presets for common scenarios:

```typescript
import { configPresets } from '@linch-kit/config'

// Blog preset
const blogConfig = configPresets.blog

// Enterprise preset  
const enterpriseConfig = configPresets.enterprise

// SaaS preset
const saasConfig = configPresets.saas
```

## 🔄 Migration Guide

### From Individual Package Configs

1. **Install config package**:
```bash
npm install @linch-kit/config
```

2. **Create unified config**:
```bash
npx @linch-kit/cli config init --preset=enterprise
```

3. **Migrate existing configs**:
- Move `auth.config.ts` content to `linch.config.ts` auth section
- Move schema settings to schema section

## 📚 API Reference

### Functions
- `loadLinchConfig(options)` - Load configuration from file/database
- `findConfigFile(options)` - Find configuration file
- `generateConfigTemplate(type)` - Generate config template

### Classes
- `ConfigManager` - Manage multiple config providers
- `FileConfigProvider` - File-based configuration
- `DatabaseConfigProvider` - Database-backed configuration

### Types
- `LinchConfig` - Main configuration interface
- `DatabaseConfig` - Database configuration
- `AuthConfig` - Authentication configuration
- `AppConfig` - Application configuration

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md).

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.
