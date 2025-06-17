# @linch-kit/schema

A powerful schema-first development package that uses Zod as the single source of truth for data structures and automatically generates Prisma schemas, validators, mock data, and API documentation.

English | [简体中文](./README.zh-CN.md)

## Features

- 🎯 **Zod-First**: Define your data structures once using Zod
- 🗄️ **Prisma Generation**: Automatically generate Prisma schema from Zod definitions
- ✅ **Validators**: Auto-generate create, update, and query validators
- 🎭 **Mock Data**: Generate realistic test data for development and testing
- 📚 **OpenAPI Docs**: Auto-generate API documentation
- 🔗 **Relations**: Support for database relationships
- 🗑️ **Soft Delete**: Built-in soft delete support
- 🏗️ **Type Safety**: End-to-end TypeScript type safety
- 🛠️ **CLI Tools**: Command-line tools for code generation

## Installation

```bash
pnpm add @linch-kit/schema
```

## Quick Start

### 1. Install and Initialize

```bash
npm install @linch-kit/schema

# Initialize configuration
npx linch-schema init
```

### 2. Define Your Entities

```typescript
// src/entities/user.ts
import { z } from 'zod'
import { defineEntity, primary, unique, createdAt, updatedAt, defaultValue } from '@linch-kit/schema'

export const User = defineEntity('User', {
  id: primary(z.string().uuid()),
  email: unique(z.string().email()),
  username: unique(z.string().min(3).max(20)),
  password: z.string().min(8),
  role: defaultValue(z.enum(['USER', 'ADMIN']), 'USER'),
  isActive: defaultValue(z.boolean(), true),
  createdAt: createdAt(z.date()),
  updatedAt: updatedAt(z.date()),
}, {
  tableName: 'users',
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['username'], unique: true },
  ]
})

// Export types and validators
export const CreateUserSchema = User.createSchema
export const UpdateUserSchema = User.updateSchema
export const UserResponseSchema = User.responseSchema.omit({ password: true })

export type CreateUser = z.infer<typeof CreateUserSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>
export type UserResponse = z.infer<typeof UserResponseSchema>
```

### 3. Generate Artifacts

```bash
# Generate all artifacts
npx linch-schema generate:all

# Or generate individually
npx linch-schema generate:prisma
npx linch-schema generate:validators
npx linch-schema generate:mocks
npx linch-schema generate:openapi
```

### 4. Use in Your Application

```typescript
// In your tRPC routes
import { CreateUserSchema, UpdateUserSchema, UserResponseSchema } from '../entities/user'

export const userRouter = router({
  create: publicProcedure
    .input(CreateUserSchema)
    .output(UserResponseSchema)
    .mutation(async ({ input }) => {
      // input is fully typed and validated
      return await createUser(input)
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid() }).merge(UpdateUserSchema))
    .output(UserResponseSchema)
    .mutation(async ({ input }) => {
      return await updateUser(input.id, input)
    })
})
```

### 5. Database Migration

```bash
# Development
npx prisma db push

# Production
npx prisma migrate dev --name init
npx prisma migrate deploy
```

## API Reference

### Decorators

#### Field Decorators

- `primary(schema)` - Mark field as primary key
- `unique(schema)` - Add unique constraint
- `defaultValue(schema, value)` - Set default value
- `createdAt(schema)` - Auto-managed creation timestamp
- `updatedAt(schema)` - Auto-managed update timestamp
- `softDelete(schema)` - Soft delete field
- `dbField(schema, name)` - Map to different database column name
- `dbType(schema, type, options)` - Specify database-specific type

#### Relationship Decorators

- `relation(schema, targetEntity, type, options)` - Define relationships

```typescript
// One-to-many relationship
author: relation(z.any(), 'User', 'many-to-one', {
  foreignKey: 'authorId',
  references: 'id',
  onDelete: 'CASCADE'
})

// Many-to-many relationship
tags: relation(z.array(z.any()), 'Tag', 'many-to-many')
```

### Entity Definition

```typescript
defineEntity(name, fields, config?)
```

- `name`: Entity name (used for table name and type generation)
- `fields`: Object with field definitions using Zod schemas and decorators
- `config`: Optional configuration
  - `tableName`: Custom table name
  - `indexes`: Index definitions
  - `compositePrimaryKey`: Composite primary key fields

### Generated Schemas

Each entity automatically provides:

- `entity.createSchema` - For create operations (excludes auto-generated fields)
- `entity.updateSchema` - For update operations (all fields optional, excludes auto-generated)
- `entity.responseSchema` - For API responses (can be customized with `.omit()`)
- `entity.querySchema` - For query parameters with filtering and pagination

## CLI Commands

```bash
# List all registered entities
linch-schema list

# Show entity details
linch-schema show User

# Generate Prisma schema
linch-schema generate:prisma [options]

# Generate Zod validators
linch-schema generate:validators [options]

# Generate mock data factories
linch-schema generate:mocks [options]

# Generate OpenAPI specification
linch-schema generate:openapi [options]

# Generate test data JSON files
linch-schema generate:test-data [options]

# Generate all artifacts
linch-schema generate:all [options]
```

## Configuration

### Database Providers

Supports PostgreSQL, MySQL, SQLite, and SQL Server:

```bash
linch-schema generate:prisma --provider postgresql
linch-schema generate:prisma --provider mysql
linch-schema generate:prisma --provider sqlite
```

### Custom Output Paths

```bash
linch-schema generate:prisma --output ./database/schema.prisma
linch-schema generate:validators --output ./src/schemas/validators.ts
linch-schema generate:openapi --output ./docs/api-spec.json
```

## Integration with Prisma

After generating the Prisma schema:

```bash
# Push schema to database (development)
npx prisma db push

# Or create and run migrations (production)
npx prisma migrate dev --name init
npx prisma migrate deploy
```

## Best Practices

1. **Single Source of Truth**: Define your data structure once in Zod
2. **Validation Everywhere**: Use generated validators in API routes
3. **Type Safety**: Leverage TypeScript types generated from schemas
4. **Testing**: Use generated mock data for consistent testing
5. **Documentation**: Keep API docs up-to-date with generated OpenAPI specs

## Examples

See the `examples/` directory for comprehensive examples:
- `basic-usage.ts` - User and Post entities with soft delete
- `advanced-features.ts` - Product and Order entities with complex validation
- Advanced validation patterns and custom schemas

## Contributing

This package is part of the Linch Kit framework. See the main repository for contribution guidelines.
