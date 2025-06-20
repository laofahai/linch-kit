export const metadata = {
  title: 'Core Concepts - Linch Kit',
  description: 'Understand the fundamental concepts behind Linch Kit framework'
}

export default function CoreConceptsPage() {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <h1>Core Concepts</h1>
      
      <p>
        Understanding these core concepts will help you build better applications with Linch Kit. 
        This guide covers the fundamental principles and patterns that make Linch Kit powerful and easy to use.
      </p>

      <h2>Schema-Driven Development</h2>
      
      <p>
        At the heart of Linch Kit is the concept of schema-driven development. Instead of writing repetitive 
        code for data models, APIs, and forms, you define your data structure once using Zod schemas, 
        and Linch Kit generates everything else automatically.
      </p>

      <h3>Benefits of Schema-Driven Approach</h3>
      
      <ul>
        <li><strong>Type Safety</strong> - End-to-end type safety from database to UI</li>
        <li><strong>DRY Principle</strong> - Define once, use everywhere</li>
        <li><strong>Consistency</strong> - Consistent validation across all layers</li>
        <li><strong>Maintainability</strong> - Single source of truth for data structure</li>
      </ul>

      <pre><code>{`import { defineEntity, primary, unique } from '@linch-kit/schema'
import { z } from 'zod'

// Define once
export const User = defineEntity('User', {
  id: primary(z.string().uuid()),
  email: unique(z.string().email()),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'user']).default('user')
})

// Get automatically:
// - Database schema
// - API endpoints
// - Form validation
// - TypeScript types`}</code></pre>

      <h2>Entity System</h2>
      
      <p>
        Entities are the building blocks of your application. They represent your business objects 
        and define their structure, relationships, and behavior.
      </p>

      <h3>Entity Definition</h3>
      
      <p>Entities are defined using the <code>defineEntity</code> function:</p>
      
      <pre><code>{`export const Product = defineEntity('Product', {
  id: primary(z.string().uuid()),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().positive(),
  category: relation('Category'),
  tags: relationMany('Tag'),
  createdAt: createdAt(z.date()),
  updatedAt: updatedAt(z.date())
})`}</code></pre>

      <h3>Field Types</h3>
      
      <p>Linch Kit provides several field types for common use cases:</p>
      
      <ul>
        <li><code>primary()</code> - Primary key field</li>
        <li><code>unique()</code> - Unique constraint field</li>
        <li><code>relation()</code> - One-to-one or many-to-one relationship</li>
        <li><code>relationMany()</code> - One-to-many or many-to-many relationship</li>
        <li><code>createdAt()</code> - Automatically set creation timestamp</li>
        <li><code>updatedAt()</code> - Automatically updated timestamp</li>
      </ul>

      <h2>Plugin Architecture</h2>
      
      <p>
        Linch Kit uses a plugin architecture that allows you to extend functionality 
        without modifying the core framework. Plugins can add new entities, API endpoints, 
        UI components, and business logic.
      </p>

      <h3>Using Plugins</h3>
      
      <pre><code>{`import { defineConfig } from '@linch-kit/core'

export default defineConfig({
  plugins: [
    '@linch-kit/plugin-auth',      // Authentication
    '@linch-kit/plugin-admin',     // Admin interface
    '@linch-kit/plugin-workflow',  // Workflow engine
    '@linch-kit/plugin-wms',       // Warehouse management
    './plugins/custom-plugin'      // Custom plugin
  ]
})`}</code></pre>

      <h3>Creating Custom Plugins</h3>
      
      <pre><code>{`import { definePlugin } from '@linch-kit/core'

export default definePlugin({
  name: 'my-custom-plugin',
  entities: [MyEntity],
  routes: [
    {
      path: '/api/custom',
      handler: customHandler
    }
  ],
  ui: {
    components: [CustomComponent],
    pages: [CustomPage]
  }
})`}</code></pre>

      <h2>CRUD Operations</h2>
      
      <p>
        Linch Kit automatically generates type-safe CRUD operations for your entities. 
        These operations handle validation, permissions, and database interactions.
      </p>

      <h3>Basic Operations</h3>
      
      <pre><code>{`import { createCRUD } from '@linch-kit/crud'
import { User } from './entities/user'

const userCRUD = createCRUD(User)

// Create
const newUser = await userCRUD.create({
  email: 'user@example.com',
  name: 'John Doe'
})

// Read
const user = await userCRUD.findById('user-id')
const users = await userCRUD.findMany({
  where: { role: 'admin' },
  orderBy: { createdAt: 'desc' }
})

// Update
const updatedUser = await userCRUD.update('user-id', {
  name: 'Jane Doe'
})

// Delete
await userCRUD.delete('user-id')`}</code></pre>

      <h2>AI-First Development</h2>
      
      <p>
        Linch Kit is designed with AI assistance in mind. The framework provides 
        clear patterns and conventions that make it easy for AI tools to understand 
        and generate code.
      </p>

      <h3>AI-Friendly Features</h3>
      
      <ul>
        <li><strong>Declarative Configuration</strong> - Clear, readable configuration files</li>
        <li><strong>Consistent Patterns</strong> - Predictable code structure</li>
        <li><strong>Rich Type Information</strong> - Comprehensive TypeScript types</li>
        <li><strong>Self-Documenting Code</strong> - Code that explains itself</li>
      </ul>

      <h2>Configuration System</h2>
      
      <p>
        Linch Kit uses a hierarchical configuration system that allows you to 
        configure your application at multiple levels.
      </p>

      <h3>Configuration Hierarchy</h3>
      
      <ol>
        <li><strong>Framework Defaults</strong> - Built-in sensible defaults</li>
        <li><strong>Plugin Configuration</strong> - Plugin-specific settings</li>
        <li><strong>Project Configuration</strong> - Your <code>linch.config.ts</code></li>
        <li><strong>Environment Variables</strong> - Runtime configuration</li>
      </ol>

      <pre><code>{`// linch.config.ts
export default defineConfig({
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL
  },
  auth: {
    providers: ['email', 'google', 'github'],
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    }
  },
  ui: {
    theme: 'modern',
    primaryColor: 'blue',
    components: 'shadcn'
  }
})`}</code></pre>

      <h2>Type Safety</h2>
      
      <p>
        Type safety is a core principle in Linch Kit. From your schema definition 
        to your UI components, everything is fully typed.
      </p>

      <h3>End-to-End Types</h3>
      
      <pre><code>{`// Schema definition generates types
export const User = defineEntity('User', {
  id: primary(z.string().uuid()),
  email: unique(z.string().email()),
  name: z.string()
})

// Inferred types
type UserType = typeof User.schema._type
type CreateUserInput = typeof User.createSchema._type
type UpdateUserInput = typeof User.updateSchema._type

// Type-safe API calls
const user: UserType = await userCRUD.findById('id')
const newUser: UserType = await userCRUD.create({
  email: 'test@example.com', // ✓ Type-safe
  name: 'Test User'          // ✓ Type-safe
  // invalid: 'field'        // ✗ TypeScript error
})`}</code></pre>

      <h2>Next Steps</h2>
      
      <p>Now that you understand the core concepts, you can:</p>
      
      <ul>
        <li><a href="/docs/schema">Learn more about Schema Definition</a></li>
        <li><a href="/docs/crud">Explore CRUD Operations</a></li>
        <li><a href="/docs/plugins">Discover Available Plugins</a></li>
        <li><a href="/docs/examples">See Real-World Examples</a></li>
      </ul>
    </div>
  )
}
