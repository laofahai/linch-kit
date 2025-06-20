---
"@linch-kit/types": major
"@linch-kit/core": major
"@linch-kit/schema": major
"@linch-kit/auth-core": major
"@linch-kit/crud": major
"@linch-kit/trpc": major
---

🚀 Initial release of Linch Kit packages

This is the initial release of the Linch Kit ecosystem - an AI-First rapid development framework.

## Core Packages Released

### @linch-kit/types (1.0.0)
- Base entity types and interfaces
- Common utility types
- Environment type definitions

### @linch-kit/core (0.1.0)
- CLI system with `linch` command
- Project initialization (`linch init`)
- Configuration management
- Plugin system foundation

### @linch-kit/schema (0.2.1)
- Type-safe schema definition with `defineEntity` and `defineField`
- Prisma schema generation
- Zod validation integration
- i18n support for field labels

### @linch-kit/auth-core (0.1.0)
- Modular authentication system
- Permission management (RBAC/ABAC)
- NextAuth.js integration
- User entity management

### @linch-kit/crud (0.1.0)
- Complete CRUD operations interface
- Data source abstraction
- Permission-based field filtering
- Bulk operations support

### @linch-kit/trpc (0.1.0)
- Type-safe tRPC utilities
- React Query integration
- Next.js API route helpers
- Superjson serialization

## Features

✅ **AI-First Design**: All packages optimized for AI understanding and code generation
✅ **Type Safety**: Full TypeScript support with comprehensive type definitions
✅ **Modular Architecture**: Use only what you need, packages work independently
✅ **Developer Experience**: Rich CLI tools and interactive project setup
✅ **Production Ready**: Comprehensive error handling and validation

## Getting Started

```bash
# Install the CLI
npm install -g @linch-kit/core

# Create a new project
linch init my-app

# Or install individual packages
npm install @linch-kit/schema @linch-kit/auth-core
```

## Documentation

- [Getting Started Guide](https://github.com/laofahai/linch-kit#readme)
- [API Documentation](https://github.com/laofahai/linch-kit/tree/main/docs)
- [Examples](https://github.com/laofahai/linch-kit/tree/main/packages/*/examples)

This release establishes the foundation for rapid AI-First application development with Linch Kit.
