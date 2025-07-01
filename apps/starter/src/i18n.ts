import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => {
  // 如果没有传入 locale 或无效，使用默认的 'zh'
  const resolvedLocale = locale || 'zh'
  
  console.log('i18n config - input locale:', locale, 'resolved locale:', resolvedLocale)
  
  return {
    locale: resolvedLocale,  // 明确返回 locale
    messages: (await import(`../messages/zh.json`)).default,
    timeZone: 'Asia/Shanghai'
  }
})