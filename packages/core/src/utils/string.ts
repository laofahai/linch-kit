/**
 * @ai-context 字符串工具函数
 * @ai-purpose 提供常用的字符串处理工具函数
 * @ai-usage 用于文本处理、格式化、转换等场景
 */

/**
 * @ai-function 转换为驼峰命名
 * @ai-purpose 将字符串转换为驼峰命名格式
 * @ai-parameter str: string - 输入字符串
 * @ai-return string - 驼峰命名格式的字符串
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase()
    })
    .replace(/\s+/g, '')
    .replace(/[-_]/g, '')
}

/**
 * @ai-function 转换为帕斯卡命名
 * @ai-purpose 将字符串转换为帕斯卡命名格式（首字母大写的驼峰）
 * @ai-parameter str: string - 输入字符串
 * @ai-return string - 帕斯卡命名格式的字符串
 */
export function toPascalCase(str: string): string {
  const camelCase = toCamelCase(str)
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1)
}

/**
 * @ai-function 转换为短横线命名
 * @ai-purpose 将字符串转换为短横线命名格式（kebab-case）
 * @ai-parameter str: string - 输入字符串
 * @ai-return string - 短横线命名格式的字符串
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * @ai-function 转换为下划线命名
 * @ai-purpose 将字符串转换为下划线命名格式（snake_case）
 * @ai-parameter str: string - 输入字符串
 * @ai-return string - 下划线命名格式的字符串
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

/**
 * @ai-function 转换为常量命名
 * @ai-purpose 将字符串转换为常量命名格式（CONSTANT_CASE）
 * @ai-parameter str: string - 输入字符串
 * @ai-return string - 常量命名格式的字符串
 */
export function toConstantCase(str: string): string {
  return toSnakeCase(str).toUpperCase()
}

/**
 * @ai-function 首字母大写
 * @ai-purpose 将字符串首字母转换为大写
 * @ai-parameter str: string - 输入字符串
 * @ai-return string - 首字母大写的字符串
 */
export function capitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * @ai-function 首字母小写
 * @ai-purpose 将字符串首字母转换为小写
 * @ai-parameter str: string - 输入字符串
 * @ai-return string - 首字母小写的字符串
 */
export function uncapitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toLowerCase() + str.slice(1)
}

/**
 * @ai-function 截断字符串
 * @ai-purpose 截断字符串并添加省略号
 * @ai-parameter str: string - 输入字符串
 * @ai-parameter maxLength: number - 最大长度
 * @ai-parameter suffix?: string - 后缀，默认为 '...'
 * @ai-return string - 截断后的字符串
 */
export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - suffix.length) + suffix
}

/**
 * @ai-function 移除HTML标签
 * @ai-purpose 从字符串中移除所有HTML标签
 * @ai-parameter html: string - 包含HTML的字符串
 * @ai-return string - 移除HTML标签后的纯文本
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/**
 * @ai-function 转义HTML字符
 * @ai-purpose 转义HTML特殊字符
 * @ai-parameter str: string - 输入字符串
 * @ai-return string - 转义后的字符串
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  
  return str.replace(/[&<>"']/g, (match) => htmlEscapes[match])
}

/**
 * @ai-function 反转义HTML字符
 * @ai-purpose 反转义HTML特殊字符
 * @ai-parameter str: string - 输入字符串
 * @ai-return string - 反转义后的字符串
 */
export function unescapeHtml(str: string): string {
  const htmlUnescapes: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'"
  }
  
  return str.replace(/&(?:amp|lt|gt|quot|#39);/g, (match) => htmlUnescapes[match])
}

/**
 * @ai-function 生成随机字符串
 * @ai-purpose 生成指定长度的随机字符串
 * @ai-parameter length: number - 字符串长度
 * @ai-parameter charset?: string - 字符集，默认为字母数字
 * @ai-return string - 随机字符串
 */
export function randomString(length: number, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}

/**
 * @ai-function 生成UUID
 * @ai-purpose 生成简单的UUID（v4格式）
 * @ai-return string - UUID字符串
 */
export function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * @ai-function 格式化字节大小
 * @ai-purpose 将字节数格式化为人类可读的大小
 * @ai-parameter bytes: number - 字节数
 * @ai-parameter decimals?: number - 小数位数，默认为2
 * @ai-return string - 格式化后的大小字符串
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * @ai-function 格式化数字
 * @ai-purpose 格式化数字，添加千分位分隔符
 * @ai-parameter num: number - 数字
 * @ai-parameter separator?: string - 分隔符，默认为逗号
 * @ai-return string - 格式化后的数字字符串
 */
export function formatNumber(num: number, separator: string = ','): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator)
}

/**
 * @ai-function 模糊匹配
 * @ai-purpose 检查字符串是否模糊匹配查询
 * @ai-parameter str: string - 目标字符串
 * @ai-parameter query: string - 查询字符串
 * @ai-parameter caseSensitive?: boolean - 是否区分大小写，默认为false
 * @ai-return boolean - 是否匹配
 */
export function fuzzyMatch(str: string, query: string, caseSensitive: boolean = false): boolean {
  if (!query) return true
  
  const targetStr = caseSensitive ? str : str.toLowerCase()
  const queryStr = caseSensitive ? query : query.toLowerCase()
  
  let queryIndex = 0
  
  for (let i = 0; i < targetStr.length && queryIndex < queryStr.length; i++) {
    if (targetStr[i] === queryStr[queryIndex]) {
      queryIndex++
    }
  }
  
  return queryIndex === queryStr.length
}

/**
 * @ai-function 计算字符串相似度
 * @ai-purpose 使用编辑距离算法计算两个字符串的相似度
 * @ai-parameter str1: string - 字符串1
 * @ai-parameter str2: string - 字符串2
 * @ai-return number - 相似度（0-1之间）
 */
export function similarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * @ai-function 计算编辑距离
 * @ai-purpose 计算两个字符串之间的编辑距离（Levenshtein距离）
 * @ai-parameter str1: string - 字符串1
 * @ai-parameter str2: string - 字符串2
 * @ai-return number - 编辑距离
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}
