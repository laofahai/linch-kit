import { I18nDemo } from '@/components/i18n/I18nDemo'

export default function I18nPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">LinchKit 国际化演示</h1>

      <div className="bg-indigo-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">🌍 企业级国际化解决方案</h2>
        <p className="text-gray-700 mb-4">
          LinchKit 提供完整的国际化支持，满足全球化应用的多语言需求：
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-4 rounded">
            <strong className="text-indigo-600">多语言支持</strong>
            <p className="text-gray-600 mt-1">支持100+语言和地区</p>
          </div>
          <div className="bg-white p-4 rounded">
            <strong className="text-blue-600">动态切换</strong>
            <p className="text-gray-600 mt-1">运行时语言无刷新切换</p>
          </div>
          <div className="bg-white p-4 rounded">
            <strong className="text-green-600">智能翻译</strong>
            <p className="text-gray-600 mt-1">AI辅助翻译和校对</p>
          </div>
          <div className="bg-white p-4 rounded">
            <strong className="text-purple-600">本地化</strong>
            <p className="text-gray-600 mt-1">日期、数字、货币格式化</p>
          </div>
        </div>
      </div>

      <I18nDemo />
    </div>
  )
}
