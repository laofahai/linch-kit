import { AuthStrategy, AuthStrategyType, SessionUser } from './types'

export class AuthManager {
  private static instance: AuthManager
  private strategy: AuthStrategy
  private currentUser: SessionUser | null = null

  private constructor(strategy: AuthStrategy) {
    this.strategy = strategy
  }

  static async init(strategyName: AuthStrategyType): Promise<AuthManager> {
    if (!strategyName) throw new Error('AUTH_STRATEGY must be defined')

    if (!AuthManager.instance) {
      const strategy = await AuthManager.loadStrategy(strategyName)
      AuthManager.instance = new AuthManager(strategy)
    }

    return AuthManager.instance
  }

  static async loadStrategy(name: AuthStrategyType): Promise<AuthStrategy> {
    switch (name) {
      case 'clerk': {
        const mod = await import('./strategies/clerk')
        return new mod.ClerkStrategy()
      }
      case 'sso': {
        const mod = await import('./strategies/sso')
        return new mod.SSOStrategy()
      }
      default:
        throw new Error(`Unsupported auth strategy: ${name}`)
    }
  }

  static getInstance() {
    if (!AuthManager.instance) {
      throw new Error('AuthManager not initialized')
    }
    return AuthManager.instance
  }

  getStrategy(): AuthStrategy {
    return this.strategy
  }

  async getSession(token?: string | null): Promise<SessionUser | null> {
    this.currentUser = await this.strategy.getSession(token)
    return this.currentUser
  }

  hasPermission(resource: string): boolean {
    if (!this.currentUser) return false
    return this.strategy.hasPermission(this.currentUser, resource)
  }

  setStrategy(strategy: AuthStrategy) {
    this.strategy = strategy
    this.currentUser = null
  }

  getCurrentUser(): SessionUser | null {
    return this.currentUser
  }
}
