import { describe, it, expect } from 'bun:test'
import { StarterConfigSchema, ExtensionIntegrationSchema } from '../types'

describe('StarterConfigSchema', () => {
  it('should validate a basic starter config', () => {
    const config = {
      appName: 'Test App',
      version: '1.0.0'
    }

    const result = StarterConfigSchema.parse(config)
    
    expect(result.appName).toBe('Test App')
    expect(result.version).toBe('1.0.0')
    expect(result.extensions).toEqual([])
    expect(result.auth.enabled).toBe(true)
    expect(result.auth.provider).toBe('supabase')
  })

  it('should validate a complete starter config', () => {
    const config = {
      appName: 'Complete App',
      version: '2.0.0',
      extensions: ['console', 'platform'],
      auth: {
        enabled: true,
        provider: 'nextauth' as const
      },
      database: {
        enabled: true,
        provider: 'drizzle' as const
      },
      trpc: {
        enabled: true
      },
      ui: {
        theme: 'dark' as const,
        components: ['button', 'form']
      }
    }

    const result = StarterConfigSchema.parse(config)
    
    expect(result.appName).toBe('Complete App')
    expect(result.extensions).toEqual(['console', 'platform'])
    expect(result.auth.provider).toBe('nextauth')
    expect(result.database.provider).toBe('drizzle')
    expect(result.ui.theme).toBe('dark')
    expect(result.ui.components).toEqual(['button', 'form'])
  })

  it('should reject invalid config', () => {
    const invalidConfig = {
      // Missing required appName
      version: '1.0.0'
    }

    expect(() => StarterConfigSchema.parse(invalidConfig)).toThrow()
  })

  it('should set default values', () => {
    const minimalConfig = {
      appName: 'Minimal App'
    }

    const result = StarterConfigSchema.parse(minimalConfig)
    
    expect(result.version).toBe('1.0.0')
    expect(result.extensions).toEqual([])
    expect(result.auth.enabled).toBe(true)
    expect(result.database.enabled).toBe(true)
    expect(result.trpc.enabled).toBe(true)
    expect(result.ui.theme).toBe('system')
  })
})

describe('ExtensionIntegrationSchema', () => {
  it('should validate a basic extension integration', () => {
    const extension = {
      name: 'test-extension',
      version: '1.0.0'
    }

    const result = ExtensionIntegrationSchema.parse(extension)
    
    expect(result.name).toBe('test-extension')
    expect(result.version).toBe('1.0.0')
    expect(result.enabled).toBe(true)
    expect(result.config).toEqual({})
  })

  it('should validate a complete extension integration', () => {
    const extension = {
      name: 'complex-extension',
      version: '2.1.0',
      enabled: false,
      config: {
        apiKey: 'test-key',
        settings: {
          theme: 'dark',
          features: ['feature1', 'feature2']
        }
      }
    }

    const result = ExtensionIntegrationSchema.parse(extension)
    
    expect(result.name).toBe('complex-extension')
    expect(result.version).toBe('2.1.0')
    expect(result.enabled).toBe(false)
    expect(result.config).toEqual({
      apiKey: 'test-key',
      settings: {
        theme: 'dark',
        features: ['feature1', 'feature2']
      }
    })
  })

  it('should reject invalid extension', () => {
    const invalidExtension = {
      // Missing required name and version
      enabled: true
    }

    expect(() => ExtensionIntegrationSchema.parse(invalidExtension)).toThrow()
  })
})