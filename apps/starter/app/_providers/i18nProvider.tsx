'use client'

import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/_lib/i18n'
import { setI18nConfig } from '@linch-kit/auth-core'
import { setTranslateFunction } from '@linch-kit/schema'

interface I18nProviderProps {
  children: React.ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    // 设置 auth-core 的翻译函数
    setI18nConfig({
      t: (key: string, params?: Record<string, any>) => {
        return i18n.t(key, params)
      },
      locale: i18n.language,
      defaultLocale: 'zh-CN'
    })

    // 设置 schema 的翻译函数
    setTranslateFunction((key: string, params?: Record<string, any>) => {
      return i18n.t(key, params)
    })

    // 监听语言变化
    const handleLanguageChange = (lng: string) => {
      setI18nConfig({
        t: (key: string, params?: Record<string, any>) => {
          return i18n.t(key, params)
        },
        locale: lng
      })
    }

    i18n.on('languageChanged', handleLanguageChange)

    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [])

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  )
}
