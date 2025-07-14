import type { Config } from 'tailwindcss'
import { baseTailwindConfig } from '../../configs/tailwind.base'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  ...baseTailwindConfig,
  // 可以在这里覆盖或扩展基础配置
}

export default config