# @linch-kit/trpc

Type-safe tRPC utilities and integrations for Linch Kit framework.

## 🚀 Features

- **Type-safe API**: End-to-end type safety with TypeScript
- **Authentication Integration**: Built-in auth middleware with @linch-kit/auth-core
- **Permission System**: Granular permission control
- **Multi-tenant Support**: Built-in tenant isolation
- **React Integration**: Seamless React Query integration
- **Middleware Ecosystem**: Rich set of middleware for common use cases
- **Error Handling**: Standardized error responses
- **Development Experience**: Zero-config setup with hot reload

## 📦 Installation

```bash
# Using pnpm (recommended)
pnpm add @linch-kit/trpc

# Using npm
npm install @linch-kit/trpc

# Using yarn
yarn add @linch-kit/trpc
```

### Peer Dependencies

```bash
pnpm add @trpc/server @trpc/client @trpc/react-query @tanstack/react-query
```

## 🏗️ Quick Start

### 1. Server Setup

```typescript
import { z } from 'zod'
import {
  createTRPCRouter,
  router,
  procedure,
  protectedProcedure,
  createContext
} from '@linch-kit/trpc'

// Create your router
const appRouter = router({
  // Public endpoint
  hello: procedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => `Hello ${input.name}!`),

  // Protected endpoint
  me: protectedProcedure
    .query(({ ctx }) => ({
      id: ctx.user!.id,
      name: ctx.user!.name
    }))
})

export type AppRouter = typeof appRouter
```

### 2. Client Setup (React)

```typescript
import { createTrpcClient, trpc } from '@linch-kit/trpc'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create clients
const trpcClient = createTrpcClient({
  url: '/api/trpc'
})

const queryClient = new QueryClient()

// App component
function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <MyComponent />
      </QueryClientProvider>
    </trpc.Provider>
  )
}

// Use in components
function MyComponent() {
  const { data } = trpc.hello.useQuery({ name: 'World' })
  return <div>{data}</div>
}
```

## 🔐 Authentication & Permissions

### Basic Authentication

```typescript
import { protectedProcedure, createPermissionProcedure } from '@linch-kit/trpc'

const userRouter = router({
  // Requires authentication
  profile: protectedProcedure
    .query(({ ctx }) => ctx.user),

  // Requires specific permission
  create: createPermissionProcedure('user', 'create')
    .input(userCreateSchema)
    .mutation(({ input }) => createUser(input)),

  // Admin only
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => deleteUser(input.id))
})
```

### Custom Middleware

```typescript
import { middleware } from '@linch-kit/trpc'

const rateLimitMiddleware = middleware(async ({ ctx, next }) => {
  // Rate limiting logic
  await checkRateLimit(ctx.user?.id)
  return next()
})

const customProcedure = procedure.use(rateLimitMiddleware)
```

## 🏢 Multi-tenant Support

```typescript
import { tenantProcedure } from '@linch-kit/trpc'

const tenantRouter = router({
  data: tenantProcedure
    .query(({ ctx }) => {
      // ctx.tenant is guaranteed to exist
      return getTenantData(ctx.tenant)
    })
})
```

## 🛠️ Available Middleware

### Authentication Middleware
- `authMiddleware` - Basic authentication check
- `optionalAuthMiddleware` - Optional authentication
- `sessionMiddleware` - Session validation
- `adminAuthMiddleware` - Admin role required

### Permission Middleware
- `permissionMiddleware(resource, action)` - Permission check
- `roleMiddleware(roles)` - Role-based access
- `ownershipMiddleware(getOwnerId)` - Resource ownership
- `tenantPermissionMiddleware` - Tenant-scoped permissions

### Utility Middleware
- `rateLimitMiddleware` - Rate limiting
- `validationMiddleware(schema)` - Input validation
- `loggingMiddleware` - Request logging
- `inputSizeMiddleware(maxSize)` - Input size validation

## 📝 Error Handling

```typescript
import { TRPCError } from '@trpc/server'

const userRouter = router({
  get: procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await findUser(input.id)
      
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        })
      }
      
      return user
    })
})
```

## 🔧 Configuration

### Context Configuration

```typescript
import { createContext } from '@linch-kit/trpc'

// Customize context creation
export async function createCustomContext(opts: CreateContextOptions) {
  const baseContext = await createContext(opts)
  
  return {
    ...baseContext,
    db: prisma, // Add database
    redis: redisClient // Add cache
  }
}
```

### Client Configuration

```typescript
const trpcClient = createTrpcClient({
  url: process.env.NEXT_PUBLIC_TRPC_URL,
  headers: async () => {
    const token = await getAuthToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  },
  fetch: customFetch
})
```

## 📚 Examples

See the [examples](./examples) directory for complete usage examples:

- [Basic Usage](./examples/basic-usage.ts) - Server setup and basic procedures
- [React Client](./examples/react-client.tsx) - React integration examples

## 🔗 Integration with Other Packages

### With @linch-kit/auth-core

```typescript
import { createAuthIntegration } from '@linch-kit/trpc'
import { authConfig } from './auth-config'

const auth = createAuthIntegration(authConfig)
// Automatic permission checking and session management
```

### With @linch-kit/schema

```typescript
import { createSchemaRouter } from '@linch-kit/trpc'
import { UserEntity } from './schema'

const userRouter = createSchemaRouter(UserEntity, {
  permissions: {
    create: 'user:create',
    read: 'user:read'
  }
})
```

## 📖 API Reference

### Core Functions

- `createTRPCRouter()` - Create router factory
- `createContext(opts)` - Create tRPC context
- `createTrpcClient(options)` - Create tRPC client

### Procedures

- `procedure` - Basic procedure
- `protectedProcedure` - Authenticated procedure
- `adminProcedure` - Admin-only procedure
- `tenantProcedure` - Multi-tenant procedure

### Types

- `RouterInputs<T>` - Infer router input types
- `RouterOutputs<T>` - Infer router output types
- `BaseContext` - Base context interface

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guide](../../CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
