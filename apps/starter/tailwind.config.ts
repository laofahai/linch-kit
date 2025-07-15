import uiTailwindConfig from '@linch-kit/ui/tailwind.config'
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    // 扫描 LinchKit UI 包的组件 (使用 node_modules 路径，支持独立发布)
    './node_modules/@linch-kit/ui/dist/**/*.{js,ts,jsx,tsx}',
    // 开发环境下的相对路径支持 (monorepo 环境)
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],

  ...uiTailwindConfig
}

export default config
