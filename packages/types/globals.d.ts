declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      AUTH_STRATEGY: 'clerk' | 'sso'
    }
  }
}

export {}
