import { uiTailwindConfig } from '@linch-kit/ui/tailwind.config'
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    // 扫描 LinchKit UI 包的组件
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  ...uiTailwindConfig,
  // 可以在这里覆盖或扩展UI包的配置
}

export default config
