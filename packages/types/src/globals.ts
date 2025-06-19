// Global type definitions

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      DATABASE_URL: string
      NEXTAUTH_SECRET: string
      NEXTAUTH_URL: string
    }
  }
}

export {}
