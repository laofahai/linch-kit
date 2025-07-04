import nextra from 'nextra';

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  mdxOptions: {
    remarkPlugins: [],
    rehypePlugins: []
  },
  search: {
    codeblocks: true
  },
  codeHighlight: true
});

export default withNextra({
  output: 'export',
  images: {
    unoptimized: true,
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    formats: ['image/avif', 'image/webp']
  },
  trailingSlash: true,
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'en'
  },
  experimental: {
    optimizeCss: true,
    webpackBuildWorker: true
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 代码分割优化
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true
        },
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        }
      }
    };

    // 性能优化
    if (!dev) {
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    return config;
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  httpAgentOptions: {
    keepAlive: true
  }
});