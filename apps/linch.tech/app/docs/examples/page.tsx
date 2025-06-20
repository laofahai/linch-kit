export const metadata = {
  title: 'Examples - Linch Kit',
  description: 'Real-world examples and use cases for Linch Kit'
}

export default function ExamplesPage() {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <h1>Examples</h1>
      
      <p>
        Explore real-world examples and use cases to learn how to build applications with Linch Kit.
      </p>

      <h2>Basic Examples</h2>

      <h3>Simple Blog Application</h3>
      <p>A basic blog with posts, comments, and user authentication.</p>
      
      <pre><code>{`// entities/Post.ts
import { defineEntity, primary, createdAt, updatedAt } from '@linch-kit/schema'
import { z } from 'zod'

export const Post = defineEntity('Post', {
  id: primary(z.string().uuid()),
  title: z.string(),
  content: z.string(),
  published: z.boolean().default(false),
  authorId: z.string().uuid(),
  createdAt: createdAt(z.date()),
  updatedAt: updatedAt(z.date()),
})

// entities/Comment.ts
export const Comment = defineEntity('Comment', {
  id: primary(z.string().uuid()),
  content: z.string(),
  postId: z.string().uuid(),
  authorId: z.string().uuid(),
  createdAt: createdAt(z.date()),
})

// app.ts
export default defineApp({
  entities: [User, Post, Comment],
  plugins: ['@linch-kit/auth'],
  ui: {
    theme: 'blog',
    pages: {
      '/': 'PostList',
      '/post/[id]': 'PostDetail',
      '/admin': 'AdminDashboard'
    }
  }
})`}</code></pre>

      <h3>E-commerce Store</h3>
      <p>A complete e-commerce solution with products, orders, and inventory management.</p>
      
      <pre><code>{`// entities/Product.ts
export const Product = defineEntity('Product', {
  id: primary(z.string().uuid()),
  name: z.string(),
  description: z.string(),
  price: z.number().positive(),
  sku: unique(z.string()),
  inventory: z.number().int().min(0),
  categoryId: z.string().uuid(),
  images: z.array(z.string().url()),
  createdAt: createdAt(z.date()),
  updatedAt: updatedAt(z.date()),
})

// entities/Order.ts
export const Order = defineEntity('Order', {
  id: primary(z.string().uuid()),
  customerId: z.string().uuid(),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered']),
  total: z.number().positive(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().positive()
  })),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string()
  }),
  createdAt: createdAt(z.date()),
  updatedAt: updatedAt(z.date()),
})

// app.ts
export default defineApp({
  entities: [User, Product, Category, Order],
  plugins: [
    '@linch-kit/auth',
    '@linch-kit/payments',
    '@linch-kit/inventory'
  ]
})`}</code></pre>

      <h2>Advanced Examples</h2>

      <h3>Multi-tenant SaaS Application</h3>
      <p>A SaaS application with tenant isolation and role-based access control.</p>
      
      <pre><code>{`// entities/Tenant.ts
export const Tenant = defineEntity('Tenant', {
  id: primary(z.string().uuid()),
  name: z.string(),
  domain: unique(z.string()),
  plan: z.enum(['free', 'pro', 'enterprise']),
  settings: z.object({
    maxUsers: z.number().int().positive(),
    features: z.array(z.string())
  }),
  createdAt: createdAt(z.date()),
  updatedAt: updatedAt(z.date()),
})

// entities/User.ts (with tenant support)
export const User = defineEntity('User', {
  id: primary(z.string().uuid()),
  email: unique(z.string().email()),
  name: z.string(),
  tenantId: z.string().uuid(),
  role: z.enum(['admin', 'manager', 'user']),
  permissions: z.array(z.string()),
  createdAt: createdAt(z.date()),
  updatedAt: updatedAt(z.date()),
})

// app.ts
export default defineApp({
  entities: [Tenant, User, Project, Task],
  plugins: [
    '@linch-kit/auth',
    '@linch-kit/multi-tenant',
    '@linch-kit/rbac'
  ],
  multiTenant: {
    strategy: 'subdomain', // or 'path' or 'header'
    isolation: 'database' // or 'schema' or 'row'
  }
})`}</code></pre>

      <h3>Real-time Collaboration App</h3>
      <p>A collaborative application with real-time updates and conflict resolution.</p>
      
      <pre><code>{`// entities/Document.ts
export const Document = defineEntity('Document', {
  id: primary(z.string().uuid()),
  title: z.string(),
  content: z.string(),
  version: z.number().int().positive(),
  collaborators: z.array(z.string().uuid()),
  lastEditedBy: z.string().uuid(),
  createdAt: createdAt(z.date()),
  updatedAt: updatedAt(z.date()),
})

// entities/Edit.ts
export const Edit = defineEntity('Edit', {
  id: primary(z.string().uuid()),
  documentId: z.string().uuid(),
  userId: z.string().uuid(),
  operation: z.object({
    type: z.enum(['insert', 'delete', 'retain']),
    position: z.number().int().min(0),
    content: z.string().optional(),
    length: z.number().int().positive().optional()
  }),
  timestamp: z.date(),
})

// app.ts
export default defineApp({
  entities: [User, Document, Edit],
  plugins: [
    '@linch-kit/auth',
    '@linch-kit/realtime',
    '@linch-kit/collaboration'
  ],
  realtime: {
    provider: 'websocket',
    conflictResolution: 'operational-transform'
  }
})`}</code></pre>

      <h2>Integration Examples</h2>

      <h3>Third-party API Integration</h3>
      <p>Integrating with external services like Stripe, SendGrid, and AWS.</p>
      
      <pre><code>{`// plugins/stripe-integration.ts
export const stripePlugin = definePlugin({
  name: 'stripe-integration',
  
  setup(app) {
    app.addService('payments', {
      async createPaymentIntent(amount: number, currency = 'usd') {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
        return await stripe.paymentIntents.create({
          amount: amount * 100, // Convert to cents
          currency,
        })
      },
      
      async handleWebhook(event: Stripe.Event) {
        switch (event.type) {
          case 'payment_intent.succeeded':
            await app.services.orders.markAsPaid(event.data.object.metadata.orderId)
            break
          // Handle other events...
        }
      }
    })
  }
})

// app.ts
export default defineApp({
  entities: [User, Product, Order],
  plugins: [stripePlugin, '@linch-kit/auth'],
  
  webhooks: {
    '/webhooks/stripe': {
      handler: 'payments.handleWebhook',
      secret: process.env.STRIPE_WEBHOOK_SECRET
    }
  }
})`}</code></pre>

      <h3>Custom UI Components</h3>
      <p>Creating custom UI components that integrate with Linch Kit's data layer.</p>
      
      <pre><code>{`// components/ProductCard.tsx
import { useEntity } from '@linch-kit/ui'
import { Product } from '../entities/Product'
import { useCart } from '../hooks/useCart'

export function ProductCard({ productId }: { productId: string }) {
  const { data: product, loading, error } = useEntity(Product, productId)
  const { addToCart } = useCart()

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!product) return <div>Product not found</div>

  return (
    <div className="product-card">
      <img src={product.images?.[0]} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <span className="price">\${product.price}</span>
      <button onClick={() => addToCart(product.id)}>
        Add to Cart
      </button>
    </div>
  )
}

// Register component with Linch Kit
app.registerComponent('ProductCard', ProductCard)`}</code></pre>

      <h2>Deployment Examples</h2>

      <h3>Docker Deployment</h3>
      
      <pre><code>{`# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]

# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine

volumes:
  postgres_data:`}</code></pre>

      <h3>Vercel Deployment</h3>
      
      <pre><code>{`// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "DATABASE_URL": "@database-url",
    "JWT_SECRET": "@jwt-secret"
  }
}`}</code></pre>

      <h2>Testing Examples</h2>

      <h3>Unit Testing</h3>
      
      <pre><code>{`// tests/entities/User.test.ts
import { User } from '../entities/User'
import { createTestApp } from '@linch-kit/testing'

describe('User Entity', () => {
  let app: TestApp
  
  beforeEach(async () => {
    app = await createTestApp({
      entities: [User],
      database: { provider: 'sqlite', url: ':memory:' }
    })
  })
  
  afterEach(async () => {
    await app.cleanup()
  })
  
  it('should create a user', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const
    }
    
    const user = await app.entities.User.create(userData)
    
    expect(user.email).toBe(userData.email)
    expect(user.name).toBe(userData.name)
    expect(user.id).toBeDefined()
  })
  
  it('should enforce unique email constraint', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const
    }
    
    await app.entities.User.create(userData)
    
    await expect(
      app.entities.User.create(userData)
    ).rejects.toThrow('Email already exists')
  })
})`}</code></pre>

      <h2>Performance Optimization</h2>

      <h3>Database Optimization</h3>
      
      <pre><code>{`// Optimized entity with proper indexing
export const Product = defineEntity('Product', {
  id: primary(z.string().uuid()),
  name: index(z.string()), // Add index for search
  sku: unique(z.string()),
  categoryId: index(z.string().uuid()), // Index foreign keys
  price: index(z.number().positive()), // Index for range queries
  createdAt: index(createdAt(z.date())), // Index for sorting
  updatedAt: updatedAt(z.date()),
})

// Use database views for complex queries
app.addView('ProductSummary', {
  query: \`
    SELECT 
      p.id,
      p.name,
      p.price,
      c.name as category_name,
      COUNT(r.id) as review_count,
      AVG(r.rating) as avg_rating
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN reviews r ON p.id = r.product_id
    GROUP BY p.id, p.name, p.price, c.name
  \`,
  refresh: 'hourly'
})`}</code></pre>

      <p>
        These examples demonstrate the flexibility and power of Linch Kit. 
        You can mix and match these patterns to build applications that fit your specific needs.
      </p>

      <h2>Next Steps</h2>
      <ul>
        <li><a href="/docs/getting-started">Getting Started Guide</a></li>
        <li><a href="/docs/api">API Reference</a></li>
        <li><a href="https://github.com/laofahai/linch-kit/tree/main/examples">More Examples on GitHub</a></li>
      </ul>
    </div>
  )
}
