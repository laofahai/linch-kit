import { renderHook } from '@testing-library/react';
import { ConsoleProvider, useConsoleContext } from '../providers/ConsoleProvider';
import React from 'react';

describe('useConsoleContext', () => {
  it('should throw error when used outside ConsoleProvider', () => {
    expect(() => renderHook(() => useConsoleContext())).toThrow('useConsoleContext must be used within a ConsoleProvider');
  });

  it('should return context value when used inside ConsoleProvider', () => {
    const initialConfig = {
      basePath: '/test-admin',
      features: ['dashboard'],
      permissions: { access: ['test:access'] },
      theme: { primary: '#000000', darkMode: true },
      customRoutes: [],
      disabledRoutes: [],
    };
    const initialTenantId = 'test-tenant';
    const initialPermissions = ['test:permission'];
    const initialLanguage = 'en-US';

    const { result } = renderHook(() => useConsoleContext(), {
      wrapper: ({ children }) => (
        <ConsoleProvider
          config={initialConfig}
          tenantId={initialTenantId}
          permissions={initialPermissions}
          language={initialLanguage}
        >
          {children}
        </ConsoleProvider>
      ),
    });

    expect(result.current.config.basePath).toBe('/test-admin');
    expect(result.current.tenantId).toBe('test-tenant');
    expect(result.current.permissions).toEqual(['test:permission']);
    expect(result.current.language).toBe('en-US');
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isSystemAdmin).toBe(false);
  });
});