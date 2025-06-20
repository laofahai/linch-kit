export const metadata = {
  title: 'API Reference - Linch Kit',
  description: 'Complete API reference for Linch Kit framework'
}

export default function APIReferencePage() {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <h1>API Reference</h1>
      
      <p>
        Complete API reference for all Linch Kit packages and modules.
      </p>

      <h2>Core Packages</h2>

      <h3>@linch-kit/core</h3>
      
      <h4>defineApp(config)</h4>
      <p>Creates a new Linch Kit application with the specified configuration.</p>
      
      <pre><code>{`import { defineApp } from '@linch-kit/core'

export default defineApp({
  entities: [User, Product, Order],
  plugins: ['@linch-kit/auth', '@linch-kit/wms'],
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL
  },
  ui: {
    theme: 'modern',
    components: 'shadcn'
  }
})`}</code></pre>

      <h4>Parameters</h4>
      <ul>
        <li><strong>entities</strong> - Array of entity definitions</li>
        <li><strong>plugins</strong> - Array of plugin names to load</li>
        <li><strong>database</strong> - Database configuration</li>
        <li><strong>ui</strong> - UI configuration options</li>
      </ul>

      <h3>@linch-kit/schema</h3>
      
      <h4>defineEntity(name, schema)</h4>
      <p>Defines a new entity with the given name and Zod schema.</p>
      
      <pre><code>{`import { defineEntity, primary, unique, createdAt, updatedAt } from '@linch-kit/schema'
import { z } from 'zod'

export const User = defineEntity('User', {
  id: primary(z.string().uuid()),
  email: unique(z.string().email()),
  name: z.string(),
  role: z.enum(['admin', 'user']).default('user'),
  createdAt: createdAt(z.date()),
  updatedAt: updatedAt(z.date()),
})`}</code></pre>

      <h4>Schema Decorators</h4>
      <ul>
        <li><strong>primary(schema)</strong> - Marks field as primary key</li>
        <li><strong>unique(schema)</strong> - Adds unique constraint</li>
        <li><strong>index(schema)</strong> - Adds database index</li>
        <li><strong>createdAt(schema)</strong> - Auto-managed creation timestamp</li>
        <li><strong>updatedAt(schema)</strong> - Auto-managed update timestamp</li>
      </ul>

      <h3>@linch-kit/auth</h3>
      
      <h4>useAuth()</h4>
      <p>React hook for accessing authentication state and methods.</p>
      
      <pre><code>{`import { useAuth } from '@linch-kit/auth'

function MyComponent() {
  const { user, login, logout, isLoading } = useAuth()
  
  if (isLoading) return <div>Loading...</div>
  if (!user) return <LoginForm onLogin={login} />
  
  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}`}</code></pre>

      <h4>Authentication Methods</h4>
      <ul>
        <li><strong>login(credentials)</strong> - Authenticate user</li>
        <li><strong>logout()</strong> - Sign out current user</li>
        <li><strong>register(userData)</strong> - Create new user account</li>
        <li><strong>resetPassword(email)</strong> - Send password reset email</li>
      </ul>

      <h2>Plugin System</h2>

      <h3>Creating Custom Plugins</h3>
      
      <pre><code>{`import { definePlugin } from '@linch-kit/core'

export const myPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  
  setup(app) {
    // Plugin initialization logic
    app.addRoute('/my-route', MyRouteHandler)
    app.addMiddleware(myMiddleware)
  },
  
  entities: [MyEntity],
  
  ui: {
    components: {
      MyComponent: () => import('./MyComponent')
    }
  }
})`}</code></pre>

      <h2>CLI Commands</h2>

      <h3>Development</h3>
      <ul>
        <li><code>linch dev</code> - Start development server</li>
        <li><code>linch build</code> - Build for production</li>
        <li><code>linch start</code> - Start production server</li>
      </ul>

      <h3>Database</h3>
      <ul>
        <li><code>linch db:generate</code> - Generate database schema</li>
        <li><code>linch db:migrate</code> - Run database migrations</li>
        <li><code>linch db:seed</code> - Seed database with test data</li>
      </ul>

      <h3>Code Generation</h3>
      <ul>
        <li><code>linch generate:entity</code> - Generate new entity</li>
        <li><code>linch generate:plugin</code> - Generate plugin boilerplate</li>
        <li><code>linch generate:page</code> - Generate new page</li>
      </ul>

      <h2>Configuration</h2>

      <h3>Environment Variables</h3>
      <ul>
        <li><code>DATABASE_URL</code> - Database connection string</li>
        <li><code>JWT_SECRET</code> - Secret for JWT token signing</li>
        <li><code>REDIS_URL</code> - Redis connection for caching</li>
        <li><code>NODE_ENV</code> - Environment (development/production)</li>
      </ul>

      <h2>TypeScript Support</h2>

      <p>Linch Kit provides full TypeScript support with automatic type generation from your schemas.</p>

      <pre><code>{`// Auto-generated types from your entities
type User = {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  createdAt: Date
  updatedAt: Date
}

// Type-safe API calls
const users: User[] = await api.users.findMany()
const user: User = await api.users.findById('123')`}</code></pre>
    </div>
  )
}
