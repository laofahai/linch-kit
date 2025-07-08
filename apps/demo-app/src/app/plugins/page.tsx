import { PluginDemo } from '@/components/plugins/PluginDemo'

export default function PluginsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">LinchKit 插件系统演示</h1>

      <div className="bg-purple-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">🧩 企业级插件架构</h2>
        <p className="text-gray-700 mb-4">
          LinchKit 提供灵活的插件系统，支持运行时加载、热插拔和生命周期管理：
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-4 rounded">
            <strong className="text-purple-600">运行时加载</strong>
            <p className="text-gray-600 mt-1">动态插件加载和卸载</p>
          </div>
          <div className="bg-white p-4 rounded">
            <strong className="text-blue-600">生命周期</strong>
            <p className="text-gray-600 mt-1">完整的钩子函数系统</p>
          </div>
          <div className="bg-white p-4 rounded">
            <strong className="text-green-600">依赖管理</strong>
            <p className="text-gray-600 mt-1">插件间依赖和版本管理</p>
          </div>
          <div className="bg-white p-4 rounded">
            <strong className="text-orange-600">安全沙箱</strong>
            <p className="text-gray-600 mt-1">隔离执行环境</p>
          </div>
        </div>
      </div>

      <PluginDemo />
    </div>
  )
}
