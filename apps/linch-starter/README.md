# Linch Starter

AI-First application built with Linch Kit framework.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📚 Documentation

- [Linch Kit Documentation](https://github.com/laofahai/linch-kit)
- [AI-First Development Guide](https://github.com/laofahai/linch-kit/blob/main/docs/ai-first.md)

## 🧩 Features

This starter application demonstrates:

### ✅ Core Features
- **AI-First Design**: All code optimized for AI understanding
- **Type Safety**: Full TypeScript with Zod validation
- **Schema-Driven**: Entity definitions with automatic generation
- **Authentication**: NextAuth.js integration ready
- **Database**: Prisma with PostgreSQL support

### 🛠️ Tech Stack
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma
- **Authentication**: NextAuth.js
- **Validation**: Zod schemas
- **Type Safety**: TypeScript throughout

### 📦 Linch Kit Packages Used
- `@linch-kit/core` - CLI and configuration
- `@linch-kit/schema` - Entity definitions
- `@linch-kit/auth-core` - Authentication system
- `@linch-kit/crud` - CRUD operations
- `@linch-kit/trpc` - Type-safe APIs
- `@linch-kit/types` - Common types

## 📁 Project Structure

```
linch-starter/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   └── globals.css      # Global styles
│   ├── entities/            # Linch Kit entities
│   │   ├── User.ts          # User entity
│   │   └── Product.ts       # Product entity
│   ├── components/          # React components
│   └── lib/                 # Utility functions
├── prisma/                  # Database schema
├── linch.config.ts          # Linch Kit configuration
└── package.json
```

## 🔧 Development

### Entity Management

Entities are defined using Linch Kit's schema system:

```typescript
import { defineEntity, defineField } from '@linch-kit/schema'
import { z } from 'zod'

export const User = defineEntity('User', {
  id: defineField(z.string().uuid(), { primary: true }),
  email: defineField(z.string().email(), { unique: true }),
  name: z.string().min(1),
  // ... more fields
})
```

### Schema Generation

Generate Prisma schema from entities:

```bash
npm run schema:generate
```

### Database Setup

1. Set your database URL in `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/database"
```

2. Generate and run migrations:
```bash
npx prisma migrate dev
```

## 🎯 AI-First Development

This project follows AI-First principles:

- **Descriptive Naming**: Clear, self-documenting code
- **Type Annotations**: Comprehensive TypeScript types
- **Schema Validation**: Zod schemas for runtime safety
- **Documentation**: Inline comments and README files
- **Consistent Structure**: Predictable file organization

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

### Docker

```bash
# Build image
docker build -t linch-starter .

# Run container
docker run -p 3000:3000 linch-starter
```

## 📄 License

MIT
