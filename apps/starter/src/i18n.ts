import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ requestLocale }) => {
  // 根据文档，requestLocale 可能是 Promise，需要 await
  const locale = (await requestLocale) || 'zh'
  
  console.log('i18n config - resolved locale:', locale)
  
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Asia/Shanghai'
  }
})