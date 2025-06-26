'use client'

import { useState, useEffect } from 'react'
// import { I18nManager } from '@linch-kit/core'

// 模拟I18nManager类
class I18nManager {
  constructor(config: any) {}
}

// 模拟多语言数据
const translations = {
  'zh-CN': {
    common: {
      hello: '你好',
      welcome: '欢迎来到LinchKit',
      login: '登录',
      logout: '退出登录',
      save: '保存',
      cancel: '取消',
      delete: '删除',
      edit: '编辑',
      create: '创建',
      update: '更新',
      loading: '加载中...',
      success: '操作成功',
      error: '操作失败',
      confirm: '确认',
      back: '返回'
    },
    navigation: {
      home: '首页',
      dashboard: '仪表盘',
      users: '用户管理',
      settings: '设置',
      help: '帮助',
      about: '关于我们'
    },
    user: {
      profile: '个人资料',
      name: '姓名',
      email: '邮箱',
      phone: '电话',
      address: '地址',
      birthday: '生日',
      gender: '性别',
      male: '男',
      female: '女',
      avatar: '头像'
    },
    messages: {
      welcome_user: '欢迎，{name}！',
      item_count: '共有 {count} 个项目',
      last_login: '上次登录时间：{time}',
      file_size: '文件大小：{size}',
      price_display: '价格：{price}'
    },
    validation: {
      required: '此字段为必填项',
      email_invalid: '请输入有效的邮箱地址',
      password_weak: '密码强度不够',
      confirm_password: '两次输入的密码不一致'
    }
  },
  'en-US': {
    common: {
      hello: 'Hello',
      welcome: 'Welcome to LinchKit',
      login: 'Login',
      logout: 'Logout',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      update: 'Update',
      loading: 'Loading...',
      success: 'Operation successful',
      error: 'Operation failed',
      confirm: 'Confirm',
      back: 'Back'
    },
    navigation: {
      home: 'Home',
      dashboard: 'Dashboard',
      users: 'User Management',
      settings: 'Settings',
      help: 'Help',
      about: 'About Us'
    },
    user: {
      profile: 'Profile',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      birthday: 'Birthday',
      gender: 'Gender',
      male: 'Male',
      female: 'Female',
      avatar: 'Avatar'
    },
    messages: {
      welcome_user: 'Welcome, {name}!',
      item_count: 'Total {count} items',
      last_login: 'Last login: {time}',
      file_size: 'File size: {size}',
      price_display: 'Price: {price}'
    },
    validation: {
      required: 'This field is required',
      email_invalid: 'Please enter a valid email address',
      password_weak: 'Password is too weak',
      confirm_password: 'Passwords do not match'
    }
  },
  'ja-JP': {
    common: {
      hello: 'こんにちは',
      welcome: 'LinchKitへようこそ',
      login: 'ログイン',
      logout: 'ログアウト',
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      create: '作成',
      update: '更新',
      loading: '読み込み中...',
      success: '操作が成功しました',
      error: '操作が失敗しました',
      confirm: '確認',
      back: '戻る'
    },
    navigation: {
      home: 'ホーム',
      dashboard: 'ダッシュボード',
      users: 'ユーザー管理',
      settings: '設定',
      help: 'ヘルプ',
      about: '会社概要'
    },
    user: {
      profile: 'プロフィール',
      name: '名前',
      email: 'メール',
      phone: '電話番号',
      address: '住所',
      birthday: '誕生日',
      gender: '性別',
      male: '男性',
      female: '女性',
      avatar: 'アバター'
    },
    messages: {
      welcome_user: 'ようこそ、{name}さん！',
      item_count: '合計 {count} 項目',
      last_login: '最終ログイン：{time}',
      file_size: 'ファイルサイズ：{size}',
      price_display: '価格：{price}'
    },
    validation: {
      required: 'この項目は必須です',
      email_invalid: '有効なメールアドレスを入力してください',
      password_weak: 'パスワードが弱すぎます',
      confirm_password: 'パスワードが一致しません'
    }
  },
  'ko-KR': {
    common: {
      hello: '안녕하세요',
      welcome: 'LinchKit에 오신 것을 환영합니다',
      login: '로그인',
      logout: '로그아웃',
      save: '저장',
      cancel: '취소',
      delete: '삭제',
      edit: '편집',
      create: '생성',
      update: '업데이트',
      loading: '로딩 중...',
      success: '작업 성공',
      error: '작업 실패',
      confirm: '확인',
      back: '뒤로'
    },
    navigation: {
      home: '홈',
      dashboard: '대시보드',
      users: '사용자 관리',
      settings: '설정',
      help: '도움말',
      about: '회사 소개'
    },
    user: {
      profile: '프로필',
      name: '이름',
      email: '이메일',
      phone: '전화번호',
      address: '주소',
      birthday: '생일',
      gender: '성별',
      male: '남성',
      female: '여성',
      avatar: '아바타'
    },
    messages: {
      welcome_user: '환영합니다, {name}님!',
      item_count: '총 {count}개 항목',
      last_login: '마지막 로그인: {time}',
      file_size: '파일 크기: {size}',
      price_display: '가격: {price}'
    },
    validation: {
      required: '이 필드는 필수입니다',
      email_invalid: '유효한 이메일 주소를 입력하세요',
      password_weak: '비밀번호가 너무 약합니다',
      confirm_password: '비밀번호가 일치하지 않습니다'
    }
  }
}

const languages = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
]

const demoSections = [
  { key: 'common', name: '通用词汇', icon: '📝' },
  { key: 'navigation', name: '导航菜单', icon: '🧭' },
  { key: 'user', name: '用户相关', icon: '👤' },
  { key: 'messages', name: '消息模板', icon: '💬' },
  { key: 'validation', name: '验证信息', icon: '⚠️' },
]

export function I18nDemo() {
  const [currentLanguage, setCurrentLanguage] = useState<string>('zh-CN')
  const [selectedSection, setSelectedSection] = useState<string>('common')
  const [i18nManager] = useState(() => new I18nManager({
    defaultLanguage: 'zh-CN',
    fallbackLanguage: 'en-US',
    supportedLanguages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'],
    autoDetect: true
  }))

  // 翻译函数
  const t = (key: string, params?: Record<string, any>) => {
    const keys = key.split('.')
    let value = translations[currentLanguage as keyof typeof translations] as any
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    if (!value) {
      // 回退到英文
      value = translations['en-US'] as any
      for (const k of keys) {
        value = value?.[k]
      }
    }
    
    if (!value) return key
    
    // 参数替换
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match: string, param: string) => {
        return params[param] || match
      })
    }
    
    return value
  }

  // 格式化演示函数
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(currentLanguage, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(currentLanguage).format(num)
  }

  const formatCurrency = (amount: number) => {
    const currencies = {
      'zh-CN': 'CNY',
      'en-US': 'USD',
      'ja-JP': 'JPY',
      'ko-KR': 'KRW'
    }
    
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency: currencies[currentLanguage as keyof typeof currencies] || 'USD'
    }).format(amount)
  }

  const getCurrentTranslations = () => {
    const lang = translations[currentLanguage as keyof typeof translations]
    return (lang as any)[selectedSection] || {}
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* 语言选择器 */}
      <div className="lg:col-span-4 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">🌐 语言切换</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setCurrentLanguage(lang.code)}
              className={`p-4 rounded-lg border transition-colors ${
                currentLanguage === lang.code
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-2">{lang.flag}</div>
              <div className="font-medium">{lang.name}</div>
              <div className="text-xs opacity-75">{lang.code}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 演示分类 */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold mb-4">📋 内容分类</h3>
        {demoSections.map((section) => (
          <button
            key={section.key}
            onClick={() => setSelectedSection(section.key)}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              selectedSection === section.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } shadow-sm border`}
          >
            <div className="flex items-center space-x-3">
              <span>{section.icon}</span>
              <span className="font-medium">{section.name}</span>
            </div>
          </button>
        ))}
      </div>

      {/* 翻译内容展示 */}
      <div className="lg:col-span-3 space-y-6">
        {/* 当前分类的翻译 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            {demoSections.find(s => s.key === selectedSection)?.icon}{' '}
            {demoSections.find(s => s.key === selectedSection)?.name}
          </h3>
          
          <div className="grid gap-4">
            {Object.entries(getCurrentTranslations()).map(([key, value]) => (
              <div key={key} className="border border-gray-200 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {selectedSection}.{key}
                  </code>
                  <span className="text-xs text-gray-500">
                    {currentLanguage}
                  </span>
                </div>
                <div className="text-lg">
                  {selectedSection === 'messages' && key === 'welcome_user' 
                    ? t(`${selectedSection}.${key}`, { name: 'LinchKit用户' })
                    : selectedSection === 'messages' && key === 'item_count'
                    ? t(`${selectedSection}.${key}`, { count: formatNumber(1234) })
                    : selectedSection === 'messages' && key === 'last_login'
                    ? t(`${selectedSection}.${key}`, { time: formatDate(new Date()) })
                    : selectedSection === 'messages' && key === 'file_size'
                    ? t(`${selectedSection}.${key}`, { size: '2.5 MB' })
                    : selectedSection === 'messages' && key === 'price_display'
                    ? t(`${selectedSection}.${key}`, { price: formatCurrency(99.99) })
                    : String(value)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 本地化格式演示 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">🌍 本地化格式</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">日期时间格式</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">当前时间:</span>
                  <span className="font-mono">{formatDate(new Date())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">时区:</span>
                  <span className="font-mono">
                    {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">数字和货币</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">大数字:</span>
                  <span className="font-mono">{formatNumber(1234567.89)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">货币:</span>
                  <span className="font-mono">{formatCurrency(1234.56)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">百分比:</span>
                  <span className="font-mono">
                    {new Intl.NumberFormat(currentLanguage, { 
                      style: 'percent' 
                    }).format(0.856)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 实际应用示例 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">🎯 实际应用示例</h3>
          
          {/* 模拟用户界面 */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">{t('common.welcome')}</h4>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                  {t('common.login')}
                </button>
                <button className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm">
                  {t('common.help')}
                </button>
              </div>
            </div>
            
            <nav className="mb-6">
              <div className="flex space-x-4 text-sm">
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  {t('navigation.home')}
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-800">
                  {t('navigation.dashboard')}
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-800">
                  {t('navigation.users')}
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-800">
                  {t('navigation.settings')}
                </a>
              </div>
            </nav>
            
            <div className="bg-gray-50 p-4 rounded">
              <h5 className="font-medium mb-2">{t('user.profile')}</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">{t('user.name')}:</span>
                  <span className="ml-2">LinchKit User</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('user.email')}:</span>
                  <span className="ml-2">user@example.com</span>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                {t('messages.last_login', { time: formatDate(new Date(Date.now() - 86400000)) })}
              </div>
            </div>
          </div>
        </div>

        {/* 翻译管理工具 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">🛠️ 翻译管理工具</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="border border-green-200 rounded p-4 bg-green-50">
              <h4 className="font-medium text-green-800 mb-2">✅ 自动检测</h4>
              <p className="text-green-700">
                基于用户浏览器语言自动选择界面语言
              </p>
            </div>
            
            <div className="border border-blue-200 rounded p-4 bg-blue-50">
              <h4 className="font-medium text-blue-800 mb-2">🔄 热更新</h4>
              <p className="text-blue-700">
                翻译内容更新后无需重启应用即可生效
              </p>
            </div>
            
            <div className="border border-purple-200 rounded p-4 bg-purple-50">
              <h4 className="font-medium text-purple-800 mb-2">🤖 AI辅助</h4>
              <p className="text-purple-700">
                集成AI翻译服务自动生成多语言内容
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}