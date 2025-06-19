# Linch.tech 官网架构设计

## 🚀 技术选型 (2024最新版本)

### 核心框架
- **Next.js 15** - 最新版本，支持 React 19
- **React 19** - 最新版本，支持 Server Components
- **TypeScript 5.8** - 最新稳定版本
- **Tailwind CSS 4.0** - 最新版本，性能优化

### 文档系统
- **Nextra 3.0** - 基于 Next.js 15 的文档框架
- **Shiki 1.0** - 最新代码高亮引擎
- **Algolia DocSearch 3.0** - 文档搜索

### UI 组件
- **shadcn/ui** - 基于 Radix UI 的组件系统
- **Radix UI 1.1** - 无障碍组件库
- **Framer Motion 11** - 动画库
- **Lucide React 0.400+** - 图标库

### 内容管理
- **MDX 3.0** - 支持 React 组件的 Markdown
- **Gray-matter 4.0** - Front matter 解析
- **Reading-time 1.5** - 阅读时间估算
- **Rehype/Remark** - Markdown 处理插件

### 多语言支持
- **next-intl 3.0** - 国际化方案
- **支持语言**: 中文(zh-CN)、英文(en-US)、日文(ja-JP)

### 部署和性能
- **Vercel** - 部署平台
- **Vercel Analytics** - 性能监控
- **Vercel Speed Insights** - 性能洞察
- **Next.js Bundle Analyzer** - 包大小分析

### 开发工具
- **ESLint 9** - 代码检查
- **Prettier 3.0** - 代码格式化
- **Husky 9** - Git hooks
- **lint-staged 15** - 暂存文件检查

## 🏗️ 项目结构

```
linch.tech/
├── apps/
│   ├── web/                     # 主站 (Next.js 15)
│   │   ├── app/                 # App Router
│   │   │   ├── [locale]/        # 国际化路由
│   │   │   │   ├── page.tsx     # 首页
│   │   │   │   ├── products/    # 产品页面
│   │   │   │   ├── docs/        # 文档页面
│   │   │   │   ├── blog/        # 博客页面
│   │   │   │   ├── community/   # 社区页面
│   │   │   │   └── enterprise/  # 企业页面
│   │   │   ├── api/             # API 路由
│   │   │   ├── globals.css      # 全局样式
│   │   │   └── layout.tsx       # 根布局
│   │   ├── components/          # 组件
│   │   │   ├── ui/              # 基础 UI 组件
│   │   │   ├── layout/          # 布局组件
│   │   │   ├── sections/        # 页面区块
│   │   │   └── features/        # 功能组件
│   │   ├── content/             # 内容文件
│   │   │   ├── blog/            # 博客文章
│   │   │   ├── docs/            # 文档内容
│   │   │   └── pages/           # 静态页面
│   │   ├── lib/                 # 工具函数
│   │   ├── hooks/               # React Hooks
│   │   ├── types/               # 类型定义
│   │   └── config/              # 配置文件
│   └── docs/                    # 文档站点 (Nextra)
│       ├── pages/               # 文档页面
│       ├── components/          # 文档组件
│       ├── theme.config.tsx     # 主题配置
│       └── next.config.js       # Next.js 配置
├── packages/
│   ├── ui/                      # 共享 UI 组件
│   ├── config/                  # 共享配置
│   └── types/                   # 共享类型
├── ai-context/                  # AI 上下文文档
├── content/                     # 内容管理
│   ├── blog/                    # 博客内容
│   ├── docs/                    # 文档内容
│   └── i18n/                    # 国际化内容
└── tools/                       # 开发工具
    ├── content-generator/       # 内容生成工具
    └── build-scripts/           # 构建脚本
```

## 🎨 设计系统

### 色彩方案
```css
:root {
  /* 主色调 - 科技蓝 */
  --primary: 220 100% 50%;
  --primary-foreground: 0 0% 100%;
  
  /* 辅助色 - AI 紫 */
  --secondary: 270 100% 60%;
  --secondary-foreground: 0 0% 100%;
  
  /* 中性色 */
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  
  /* 边框和分割线 */
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 220 100% 50%;
}

[data-theme="dark"] {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  --muted: 0 0% 14.9%;
  --muted-foreground: 0 0% 63.9%;
  --border: 0 0% 14.9%;
  --input: 0 0% 14.9%;
}
```

### 字体系统
```css
/* 主字体 - 现代无衬线 */
--font-sans: 'Inter Variable', system-ui, sans-serif;

/* 代码字体 - 等宽 */
--font-mono: 'JetBrains Mono Variable', 'Fira Code', monospace;

/* 标题字体 - 品牌字体 */
--font-heading: 'Cal Sans', 'Inter Variable', sans-serif;
```

### 组件规范
- **按钮**: 4种变体 (default, destructive, outline, ghost)
- **卡片**: 统一的阴影和圆角系统
- **表单**: 一致的输入框和验证样式
- **导航**: 响应式导航和面包屑
- **代码块**: 语法高亮和复制功能

## 📱 响应式设计

### 断点系统
```css
/* Tailwind CSS 4.0 断点 */
sm: '640px',   /* 手机横屏 */
md: '768px',   /* 平板 */
lg: '1024px',  /* 笔记本 */
xl: '1280px',  /* 桌面 */
2xl: '1536px'  /* 大屏幕 */
```

### 布局策略
- **移动优先**: 从小屏幕开始设计
- **渐进增强**: 大屏幕添加更多功能
- **触摸友好**: 按钮和链接足够大
- **可访问性**: 支持键盘导航和屏幕阅读器

## 🔧 开发配置

### Next.js 15 配置
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    ppr: true,              // Partial Prerendering
    reactCompiler: true,    // React Compiler
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/github',
        destination: 'https://github.com/laofahai/linch-kit',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
```

### TypeScript 配置
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 🚀 性能优化策略

### 构建优化
- **Bundle Splitting**: 按路由和组件分割代码
- **Tree Shaking**: 移除未使用的代码
- **Image Optimization**: 自动图片优化和格式转换
- **Font Optimization**: 字体预加载和优化

### 运行时优化
- **Server Components**: 减少客户端 JavaScript
- **Streaming**: 流式渲染提升首屏速度
- **Caching**: 多层缓存策略
- **CDN**: 静态资源 CDN 分发

### 监控指标
- **Core Web Vitals**: LCP, FID, CLS
- **Performance Budget**: 包大小限制
- **Lighthouse Score**: 综合性能评分
- **Real User Monitoring**: 真实用户体验监控
