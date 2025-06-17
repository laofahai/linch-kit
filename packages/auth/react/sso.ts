import { AuthSource } from './types'

/**
 * 重定向到 SSO 登录 URL，自动附加回调 URL 参数
 * @param loginUrl - SSO 登录端点
 * @param callbackUrl - 登录成功后返回的完整 URL
 * @param options - 其他配置选项
 */
export interface RedirectToSSOOptions {
  /**
   * 用于回调 URL 的参数名称（默认: callbackUrl）
   */
  callbackParamName?: string

  /**
   * 是否确保 callbackUrl 是完整 URL（如果传入的是相对路径，则自动转为完整 URL）
   */
  ensureAbsoluteUrl?: boolean

  /**
   * query
   */
  query?: Record<string, string | number | boolean>
}

/**
 * 重定向到 SSO 登录，可以传入 loginUrl 字符串或 AuthSource 对象
 */
export function redirectToSSO(
  source: string | AuthSource,
  callbackUrl: string,
  options: RedirectToSSOOptions = {}
) {
  // 确定登录 URL 和可能的 providerId
  let loginUrl: string
  let providerId: string | undefined

  if (typeof source === 'string') {
    loginUrl = source
  } else {
    // 如果传入的是 AuthSource 对象
    loginUrl = source.loginUrl
    providerId = source.id
  }

  const { callbackParamName = 'callbackUrl', ensureAbsoluteUrl = true } = options

  // 确保回调 URL 是完整 URL
  let finalCallbackUrl = callbackUrl
  if (ensureAbsoluteUrl && typeof window !== 'undefined' && !callbackUrl.match(/^https?:\/\//)) {
    // 如果是相对路径，转为绝对路径
    const origin = window.location.origin
    finalCallbackUrl = `${origin}${callbackUrl.startsWith('/') ? '' : '/'}${callbackUrl}`
  }

  // 如果有 providerId，将其附加到回调 URL
  if (providerId) {
    // 检查 URL 中是否已经有参数
    const separator = finalCallbackUrl.includes('?') ? '&' : '?'
    finalCallbackUrl += `${separator}providerId=${encodeURIComponent(providerId)}`
  }

  // 合并查询参数
  const query = { ...(options.query || {}) }

  try {
    const url = new URL(loginUrl)
    url.searchParams.set(callbackParamName, finalCallbackUrl)
    // 添加其他查询参数
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, String(value))
    })
    window.location.href = url.toString()
  } catch {
    // 拼接基本 URL 参数
    let finalUrl = `${loginUrl}?${callbackParamName}=${encodeURIComponent(finalCallbackUrl)}`

    // 添加其他查询参数
    Object.entries(query).forEach(([key, value]) => {
      finalUrl += `&${key}=${encodeURIComponent(String(value))}`
    })

    window.location.href = finalUrl
  }
}
