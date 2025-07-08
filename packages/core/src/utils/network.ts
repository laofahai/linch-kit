/**
 * 网络工具函数
 * @module utils/network
 */

import { createServer } from 'http'
import { networkInterfaces } from 'os'

/**
 * 检查端口是否可用
 */
export async function isPortAvailable(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise(resolve => {
    const server = createServer()

    server.listen(port, host, () => {
      server.close(() => resolve(true))
    })

    server.on('error', () => resolve(false))
  })
}

/**
 * 查找可用端口
 */
export async function findAvailablePort(
  startPort: number,
  endPort = startPort + 100,
  host = '127.0.0.1'
): Promise<number | null> {
  for (let port = startPort; port <= endPort; port++) {
    if (await isPortAvailable(port, host)) {
      return port
    }
  }
  return null
}

/**
 * 检查URL是否可访问
 */
export async function isUrlAccessible(url: string, timeout = 5000): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      signal: controller.signal,
      method: 'HEAD',
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch {
    return false
  }
}

/**
 * 获取本机IP地址
 */
export function getLocalIpAddress(): string {
  const nets = networkInterfaces()

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      // IPv4 && 非内部地址 && 非loopback
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }

  return '127.0.0.1'
}

/**
 * HTTP请求工具
 */
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: string | Buffer | Uint8Array
  timeout?: number
  retries?: number
  retryDelay?: number
}

/**
 * 发送HTTP请求
 */
export async function request(url: string, options: RequestOptions = {}): Promise<Response> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 10000,
    retries = 0,
    retryDelay = 1000,
  } = options

  let lastError: Error

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        method,
        headers: {
          'User-Agent': '@linch-kit/core',
          ...headers,
        },
        body,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }
  }

  throw lastError!
}

/**
 * 下载文件
 */
export async function downloadFile(url: string, options?: RequestOptions): Promise<ArrayBuffer> {
  const response = await request(url, options)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.arrayBuffer()
}

/**
 * 获取JSON响应
 */
export async function fetchJson<T = unknown>(url: string, options?: RequestOptions): Promise<T> {
  const response = await request(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

/**
 * 发送JSON数据
 */
export async function postJson<T = unknown>(
  url: string,
  data: unknown,
  options?: Omit<RequestOptions, 'method' | 'body'>
): Promise<T> {
  const response = await request(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options?.headers,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json() as Promise<T>
}
