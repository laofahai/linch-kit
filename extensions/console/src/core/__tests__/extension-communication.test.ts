/**
 * Extension通信系统测试
 */
import { describe, it, expect, mock } from 'bun:test'

import { ExtensionCommunicationHub } from '../extension-communication'

describe('ExtensionCommunication', () => {
  it('should create instance with valid extension', () => {
    const mockExtension = {
      name: 'test-extension',
      version: '1.0.0',
      metadata: {},
    }

    const comm = new ExtensionCommunicationHub()
    expect(comm).toBeDefined()
  })

  it('should handle message sending', async () => {
    const comm = new ExtensionCommunicationHub()
    const mockHandler = mock()

    comm.on('test-event', mockHandler)

    comm.emit('test-event', { data: 'test' })

    expect(mockHandler).toHaveBeenCalledWith({ data: 'test' })
  })

  it('should handle lifecycle events', () => {
    const comm = new ExtensionCommunicationHub()
    const mockHandler = mock()

    comm.on('beforeMount', mockHandler)

    // 触发生命周期事件
    comm.emit('beforeMount', { extension: 'test-extension' })

    expect(mockHandler).toHaveBeenCalledWith({ extension: 'test-extension' })
  })
})
