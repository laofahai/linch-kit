/**
 * Bun test setup file for UI tests
 */

import '@testing-library/jest-dom'
import { mock } from 'bun:test'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mock().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: mock(), // deprecated
    removeListener: mock(), // deprecated
    addEventListener: mock(),
    removeEventListener: mock(),
    dispatchEvent: mock(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = mock().mockImplementation(() => ({
  observe: mock(),
  unobserve: mock(),
  disconnect: mock(),
  root: null,
  rootMargin: '',
  thresholds: [],
}))

// Mock ResizeObserver
global.ResizeObserver = mock().mockImplementation(() => ({
  observe: mock(),
  unobserve: mock(),
  disconnect: mock()
}))

// Mock HTMLElement properties
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  writable: true,
  value: mock()
})

// Silence console errors during tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: ReactDOM.render')) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
