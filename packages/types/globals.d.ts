declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      NEXT_PUBLIC_AUTH_STRATEGY: 'clerk' | 'sso'
    }
  }
}

export {}
