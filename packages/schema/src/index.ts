// Core exports
export * from './core/types'
export * from './core/decorators'
export * from './core/entity'

// Generator exports
export * from './generators/prisma'
export * from './generators/validators'
export * from './generators/mock'
export * from './generators/openapi'

// Re-export zod for convenience
export { z } from 'zod'

// Version
export const version = '0.1.0'
