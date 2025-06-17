declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      [key: `SHARED_TOKEN_SOURCE_${number}_ID`]: string
      [key: `SHARED_TOKEN_SOURCE_${number}_NAME`]: string
      [key: `SHARED_TOKEN_SOURCE_${number}_LOGIN_URL`]: string
      [key: `SHARED_TOKEN_SOURCE_${number}_USER_INFO_URL`]: string
    }
  }
}

export {}
