/**
 * @ai-context 网络工具函数
 * @ai-purpose 提供网络相关的工具函数，如端口检查、URL验证等
 * @ai-usage 用于开发服务器、API调用、网络检查等场景
 */

import { logger } from './logger'

/**
 * @ai-function 检查端口是否可用
 * @ai-purpose 检查指定端口是否被占用
 * @ai-parameter port: number - 要检查的端口号
 * @ai-parameter host?: string - 主机地址，默认为 localhost
 * @ai-return Promise<boolean> - 端口是否可用
 */
export async function isPortAvailable(port: number, host: string = 'localhost'): Promise<boolean> {
  return new Promise((resolve) => {
    const { createServer } = require('net')
    const server = createServer()
    
    server.listen(port, host, () => {
      server.once('close', () => {
        resolve(true)
      })
      server.close()
    })
    
    server.on('error', () => {
      resolve(false)
    })
  })
}

/**
 * @ai-function 查找可用端口
 * @ai-purpose 从指定端口开始查找第一个可用的端口
 * @ai-parameter startPort: number - 起始端口号
 * @ai-parameter maxPort?: number - 最大端口号，默认为 65535
 * @ai-parameter host?: string - 主机地址，默认为 localhost
 * @ai-return Promise<number | null> - 可用的端口号，如果没有找到则返回 null
 */
export async function findAvailablePort(
  startPort: number, 
  maxPort: number = 65535, 
  host: string = 'localhost'
): Promise<number | null> {
  for (let port = startPort; port <= maxPort; port++) {
    if (await isPortAvailable(port, host)) {
      return port
    }
  }
  return null
}

/**
 * @ai-function 验证URL格式
 * @ai-purpose 验证字符串是否为有效的URL
 * @ai-parameter url: string - 要验证的URL字符串
 * @ai-return boolean - 是否为有效URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * @ai-function 等待端口开放
 * @ai-purpose 等待指定端口变为可用状态
 * @ai-parameter port: number - 端口号
 * @ai-parameter host?: string - 主机地址
 * @ai-parameter timeout?: number - 超时时间（毫秒），默认30秒
 * @ai-parameter interval?: number - 检查间隔（毫秒），默认500毫秒
 * @ai-return Promise<boolean> - 是否在超时前端口变为可用
 */
export async function waitForPort(
  port: number,
  host: string = 'localhost',
  timeout: number = 30000,
  interval: number = 500
): Promise<boolean> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    try {
      const { createConnection } = require('net')
      
      await new Promise<void>((resolve, reject) => {
        const socket = createConnection(port, host)
        
        socket.on('connect', () => {
          socket.destroy()
          resolve()
        })
        
        socket.on('error', () => {
          reject(new Error('Connection failed'))
        })
        
        socket.setTimeout(1000, () => {
          socket.destroy()
          reject(new Error('Connection timeout'))
        })
      })
      
      return true
    } catch {
      await new Promise(resolve => setTimeout(resolve, interval))
    }
  }
  
  return false
}

/**
 * @ai-function 获取本机IP地址
 * @ai-purpose 获取本机的网络接口IP地址
 * @ai-return string[] - IP地址列表
 */
export function getLocalIpAddresses(): string[] {
  const { networkInterfaces } = require('os')
  const interfaces = networkInterfaces()
  const addresses: string[] = []
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address)
      }
    }
  }
  
  return addresses
}

/**
 * @ai-function 简单的HTTP请求
 * @ai-purpose 发送简单的HTTP请求
 * @ai-parameter url: string - 请求URL
 * @ai-parameter options?: RequestOptions - 请求选项
 * @ai-return Promise<HttpResponse> - 响应结果
 */
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: string | Buffer
  timeout?: number
}

export interface HttpResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
}

export async function httpRequest(url: string, options: RequestOptions = {}): Promise<HttpResponse> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 10000
  } = options
  
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const httpModule = isHttps ? require('https') : require('http')
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'User-Agent': 'Linch-Kit/1.0',
        ...headers
      },
      timeout
    }
    
    const req = httpModule.request(requestOptions, (res: any) => {
      let responseBody = ''
      
      res.on('data', (chunk: Buffer) => {
        responseBody += chunk.toString()
      })
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          body: responseBody
        })
      })
    })
    
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error(`Request timeout after ${timeout}ms`))
    })
    
    if (body) {
      req.write(body)
    }
    
    req.end()
  })
}

/**
 * @ai-function 下载文件
 * @ai-purpose 从URL下载文件到本地
 * @ai-parameter url: string - 文件URL
 * @ai-parameter filePath: string - 本地文件路径
 * @ai-parameter onProgress?: (downloaded: number, total: number) => void - 进度回调
 * @ai-return Promise<void>
 */
export async function downloadFile(
  url: string,
  filePath: string,
  onProgress?: (downloaded: number, total: number) => void
): Promise<void> {
  const { createWriteStream } = require('fs')
  const { pipeline } = require('stream')
  const { promisify } = require('util')
  const pipelineAsync = promisify(pipeline)
  
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const httpModule = isHttps ? require('https') : require('http')
    
    const req = httpModule.get(url, (res: any) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
        return
      }
      
      const totalSize = parseInt(res.headers['content-length'] || '0', 10)
      let downloadedSize = 0
      
      const fileStream = createWriteStream(filePath)
      
      res.on('data', (chunk: Buffer) => {
        downloadedSize += chunk.length
        if (onProgress && totalSize > 0) {
          onProgress(downloadedSize, totalSize)
        }
      })
      
      pipelineAsync(res, fileStream)
        .then(() => {
          logger.info(`File downloaded successfully: ${filePath}`)
          resolve()
        })
        .catch(reject)
    })
    
    req.on('error', reject)
  })
}
