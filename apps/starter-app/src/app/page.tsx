import Link from 'next/link'

const demoModules = [
  {
    id: 'schema',
    title: '🏗️ Schema驱动开发',
    description: '声明式Schema定义，自动生成类型安全代码，支持多种输出格式',
    features: ['实体定义验证', 'TypeScript生成', 'Prisma模型', 'tRPC API'],
    href: '/schema',
    color: 'blue',
    testable: true
  },
  {
    id: 'auth',
    title: '🔐 认证权限系统',
    description: '企业级认证和权限管理，支持JWT、OAuth2等多种认证方式',
    features: ['用户登录/注销', '会话管理', '权限控制', '安全机制'],
    href: '/auth',
    color: 'green',
    testable: true
  },
  {
    id: 'config',
    title: '⚙️ 配置管理',
    description: '灵活的配置系统，支持多环境、多租户和运行时热重载',
    features: ['环境配置', '多租户支持', '热重载', '类型安全'],
    href: '/config',
    color: 'purple',
    testable: true
  },
  {
    id: 'plugins',
    title: '🧩 插件系统',
    description: '运行时插件管理，支持动态加载、生命周期和依赖管理',
    features: ['动态加载', '生命周期', '依赖管理', '安全沙箱'],
    href: '/plugins',
    color: 'orange',
    testable: true
  },
  {
    id: 'i18n',
    title: '🌍 国际化',
    description: '完整的多语言支持，包含本地化格式和AI辅助翻译',
    features: ['多语言切换', '本地化格式', 'AI翻译', '动态加载'],
    href: '/i18n',
    color: 'indigo',
    testable: true
  }
]

const getColorClasses = (color: string) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      button: 'bg-blue-600 hover:bg-blue-700',
      text: 'text-blue-800',
      feature: 'bg-blue-100 text-blue-800'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      button: 'bg-green-600 hover:bg-green-700',
      text: 'text-green-800',
      feature: 'bg-green-100 text-green-800'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      button: 'bg-purple-600 hover:bg-purple-700',
      text: 'text-purple-800',
      feature: 'bg-purple-100 text-purple-800'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      button: 'bg-orange-600 hover:bg-orange-700',
      text: 'text-orange-800',
      feature: 'bg-orange-100 text-orange-800'
    },
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      button: 'bg-indigo-600 hover:bg-indigo-700',
      text: 'text-indigo-800',
      feature: 'bg-indigo-100 text-indigo-800'
    }
  }
  return colorMap[color as keyof typeof colorMap] || colorMap.blue
}

export default function HomePage() {
  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span>🚀</span>
            <span>AI-First 全栈开发框架</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            LinchKit
            <span className="block text-3xl md:text-4xl text-blue-600 mt-2">功能验证演示平台</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            体验Schema驱动的AI-First全栈开发框架，包含认证、配置、插件、国际化等企业级功能的完整演示和验证
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-700">所有功能可验证</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="text-sm text-gray-700">交互式演示</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
              <span className="text-sm text-gray-700">实时代码预览</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Modules Grid */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {demoModules.map((module) => {
            const colors = getColorClasses(module.color)
            return (
              <div
                key={module.id}
                className={`${colors.bg} ${colors.border} border rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className={`text-xl font-bold ${colors.text}`}>
                    {module.title}
                  </h3>
                  {module.testable && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                      可验证
                    </span>
                  )}
                </div>
                
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {module.description}
                </p>

                <div className="space-y-3 mb-6">
                  <h4 className="text-sm font-semibold text-gray-800">核心功能:</h4>
                  <div className="flex flex-wrap gap-2">
                    {module.features.map((feature, index) => (
                      <span
                        key={index}
                        className={`${colors.feature} text-xs px-2 py-1 rounded-md font-medium`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href={module.href}
                  className={`${colors.button} text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 inline-flex items-center space-x-2 w-full justify-center`}
                >
                  <span>体验演示</span>
                  <span>→</span>
                </Link>
              </div>
            )
          })}
        </div>

        {/* Architecture Overview */}
        <div className="mt-20 bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
            <h2 className="text-3xl font-bold mb-4">🏗️ 技术架构特色</h2>
            <p className="text-blue-100 text-lg">
              企业级AI-First全栈开发框架，为现代化应用开发而设计
            </p>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">AI-First设计</h4>
                <p className="text-gray-600 text-sm">为AI理解和处理优化的架构设计</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">端到端类型安全</h4>
                <p className="text-gray-600 text-sm">TypeScript严格模式，完整的类型推导</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏢</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">企业级特性</h4>
                <p className="text-gray-600 text-sm">多租户、可观测性、性能监控</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔌</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">插件化生态</h4>
                <p className="text-gray-600 text-sm">灵活的插件系统和企业级管理</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">🚀 快速开始</h3>
          <div className="bg-gray-900 text-white p-6 rounded-lg text-left max-w-2xl mx-auto">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-gray-400 text-sm">terminal</span>
            </div>
            <pre className="text-green-400 font-mono text-sm">
{`# 克隆项目
git clone https://github.com/linch-kit/starter-app

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}