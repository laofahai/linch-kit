declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test'
  }
}

interface Window {
  __APP_VERSION__?: string
  // 浏览器环境全局变量可在此声明
}
