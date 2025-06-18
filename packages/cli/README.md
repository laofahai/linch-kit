# @linch-kit/cli

🛠️ **Unified CLI tools for Linch Kit** - One command to rule them all.

## ✨ Features

- 🎯 **Unified Interface**: Single `linch` command for all operations
- 🚀 **Project Templates**: Blog, enterprise, SaaS starter templates
- 🔧 **Code Generation**: Auth, schema, permissions, and more
- 🗄️ **Database Management**: Migrations, seeding, and management
- 🎨 **Interactive Setup**: Guided project initialization
- 🔄 **Hot Reload**: Development server with live updates
- 📦 **Plugin System**: Extensible with third-party plugins

## 🚀 Quick Start

### Installation

```bash
npm install -g @linch-kit/cli
# or use npx
npx @linch-kit/cli --help
```

### Initialize New Project

```bash
# Interactive setup
linch init

# With template
linch init --template=enterprise --name=my-app

# Available templates: blog, enterprise, saas
```

### Configuration Management

```bash
# Initialize config file
linch config init --preset=saas

# Validate configuration
linch config validate

# Manage settings
linch config set app.features.billing true --db
linch config get app.name
```

## 🛠️ Commands

### Project Management

```bash
# Initialize project
linch init [options]
  --template <type>    Project template (blog|enterprise|saas)
  --name <name>        Project name
  --skip-install       Skip package installation
  --skip-git          Skip git initialization

# Development server
linch dev [options]
  --port <port>        Port number (default: 3000)
  --host <host>        Host address
  --open              Open browser automatically

# Build for production
linch build [options]
  --analyze           Analyze bundle size
  --clean             Clean output directory

# Deploy
linch deploy [options]
  --env <env>         Environment (default: production)
  --dry-run           Show what would be deployed
```

### Configuration

```bash
# Configuration management
linch config <command>

  init                 Initialize configuration file
    --type <type>      Config type (ts|js|json|mjs)
    --preset <preset>  Use preset (blog|enterprise|saas)
    --force           Overwrite existing file

  validate            Validate configuration
  info                Show configuration info
  set <key> <value>   Set configuration value
    --db              Save to database
  get <key>           Get configuration value
```

### Schema Generation

```bash
# Schema operations
linch schema <command>

  generate            Generate schema files
    --prisma          Generate Prisma schema
    --mock            Generate mock data
    --openapi         Generate OpenAPI spec
    --all             Generate all

  validate            Validate schema definitions
```

### Authentication

```bash
# Auth management
linch auth <command>

  generate            Generate auth entities
    --kit <type>      Auth kit (basic|standard|enterprise|multi-tenant)
    --preset <preset> Use preset configuration
    --roles           Include roles and permissions
    --departments     Include department hierarchy
    --tenants         Include multi-tenant support
    --output <dir>    Output directory

  permissions         Generate permission system
    --strategy <type> Permission strategy (rbac|abac|hybrid)
    --hierarchical    Include hierarchical permissions
    --multi-tenant    Include multi-tenant permissions
```

### Database

```bash
# Database management
linch db <command>

  migrate             Run database migrations
    --reset           Reset database before migration

  seed                Seed database with initial data
    --env <env>       Environment (default: development)
```

### Plugins

```bash
# Plugin management
linch plugin <command>

  list                List installed plugins
  install <name>      Install a plugin
  uninstall <name>    Uninstall a plugin
```

## 🎨 Project Templates

### Blog Template
Perfect for content websites and personal blogs:
- SQLite database
- Basic user authentication
- Comment system
- Content management

```bash
linch init --template=blog --name=my-blog
```

### Enterprise Template
For internal business applications:
- PostgreSQL database
- SSO integration
- Department hierarchy
- Advanced permissions

```bash
linch init --template=enterprise --name=company-app
```

### SaaS Template
For multi-tenant SaaS platforms:
- PostgreSQL database
- Multi-tenant architecture
- Billing integration
- Analytics dashboard

```bash
linch init --template=saas --name=saas-platform
```

## 🔧 Configuration

The CLI uses `linch.config.ts` for unified configuration:

```typescript
// linch.config.ts
import type { LinchConfig } from '@linch-kit/config'

const config: LinchConfig = {
  database: {
    type: 'postgresql',
    host: 'localhost',
    database: 'myapp'
  },
  
  auth: {
    userEntity: 'enterprise',
    permissions: {
      strategy: 'rbac',
      hierarchical: true
    }
  },
  
  app: {
    name: 'My Application',
    features: {
      userRegistration: true,
      departmentHierarchy: true
    }
  }
}

export default config
```

## 🔌 Plugin Development

Create custom plugins to extend CLI functionality:

```typescript
// my-plugin.ts
import type { LinchPlugin } from '@linch-kit/cli'

const plugin: LinchPlugin = {
  name: 'my-custom-plugin',
  commands: [
    {
      name: 'custom',
      description: 'My custom command',
      action: async () => {
        console.log('Custom command executed!')
      }
    }
  ],
  hooks: {
    beforeBuild: () => {
      console.log('Before build hook')
    }
  }
}

export default plugin
```

## 🎯 Examples

### Full Project Setup

```bash
# 1. Initialize project
linch init --template=enterprise --name=my-company-app

# 2. Configure authentication
linch auth generate --kit=enterprise --departments --roles

# 3. Generate database schema
linch schema generate --prisma --openapi

# 4. Run migrations
linch db migrate

# 5. Seed initial data
linch db seed

# 6. Start development
linch dev --port=3000 --open
```

### Configuration Management

```bash
# Set up database config
linch config set database.type postgresql
linch config set database.host localhost
linch config set database.port 5432

# Enable features
linch config set app.features.billing true --db
linch config set app.features.analytics true --db

# Check configuration
linch config validate
linch config info
```

## 🔄 Migration from Individual CLIs

### Before (Multiple CLIs)
```bash
npx @linch-kit/schema generate:prisma
npx @linch-kit/auth-core generate:auth --kit=enterprise
```

### After (Unified CLI)
```bash
linch schema generate --prisma
linch auth generate --kit=enterprise
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md).

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.
