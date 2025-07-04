import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 实验性功能
  experimental: {
    // 启用 Turbopack 为默认开发服务器
    turbo: {
      rules: {
        // 自定义 Turbopack 规则
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
    // 启用 React 19 的并发特性
    serverComponentsExternalPackages: ["@prisma/client"],
    // 禁用自动安装依赖
    autoInstallPackages: false,
  },

  // 性能优化
  compress: true,
  poweredByHeader: false,
  
  // 图片优化
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // 编译优化
  swcMinify: true,
  
  // 环境变量
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // 重定向规则
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },

  // 头部配置
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Webpack 配置
  webpack: (config: any) => {
    // 优化 bundle 大小
    config.resolve.fallback = { fs: false, path: false };
    
    return config;
  },

  // 类型检查
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint 配置
  eslint: {
    ignoreDuringBuilds: false,
  },

  // 输出配置
  output: "standalone",
  
  // 静态导出优化
  trailingSlash: false,
  
  // 国际化支持
  i18n: {
    locales: ["zh-CN", "en"],
    defaultLocale: "zh-CN",
  },
};

export default nextConfig;
