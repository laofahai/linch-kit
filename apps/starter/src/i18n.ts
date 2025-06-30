import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

const locales = ['zh', 'en'] as const

export default getRequestConfig(async ({ locale }) => {
  // 验证 locale 是否在支持的语言列表中
  if (!locales.includes(locale as never)) notFound()

  return {
    messages: (await import(`../messages/${locale}.json`)).default
  }
})