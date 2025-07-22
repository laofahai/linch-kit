// Client exports
export { 
  StarterProvider, 
  useStarterContext 
} from './components/StarterProvider'
export { ExtensionInitializer } from './components/ExtensionInitializer'
export { useStarterConfig } from './hooks/useStarterConfig'

// Server exports
export { 
  StarterIntegrationManager,
  createStarterIntegrationManager 
} from './integration/StarterIntegrationManager'
export { 
  TemplateGenerator,
  createTemplateGenerator 
} from './templates/TemplateGenerator'
export { 
  StarterCLI,
  createStarterCLI 
} from './cli/StarterCLI'

// Template generators
export { generateNextConfig } from './templates/generators/next-config'
export { generateTrpcRouter } from './templates/generators/trpc-router'
export { generateAuthMiddleware } from './templates/generators/auth-middleware'
export { generateExtensionConfig } from './templates/generators/extension-config'

// Types
export * from './types'