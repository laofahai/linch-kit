import { renderHook } from '@testing-library/react';
import { useConsoleContext } from '../providers/ConsoleProvider';

describe('useConsoleContext', () => {
  it('should throw error when used outside ConsoleProvider', () => {
    const { result } = renderHook(() => useConsoleContext());
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('useConsoleContext must be used within a ConsoleProvider');
  });
});
