/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';

import { useConsoleContext } from '../providers/ConsoleProvider';

describe('useConsoleContext', () => {
  it('should throw error when used outside ConsoleProvider', () => {
    // 模拟 React Context 环境
    const mockUseContext = () => null;
    const originalUseContext = require('react').useContext;
    require('react').useContext = mockUseContext;
    
    try {
      expect(() => useConsoleContext()).toThrow('useConsoleContext must be used within a ConsoleProvider');
    } finally {
      require('react').useContext = originalUseContext;
    }
  });

  // 简化测试 - 仅测试核心逻辑
  it('should define context hook correctly', () => {
    expect(typeof useConsoleContext).toBe('function');
  });
});