import '@testing-library/jest-dom';

// Mock DOM for React tests
if (typeof global !== 'undefined') {
  Object.defineProperty(global, 'document', {
    value: global.window?.document,
    writable: true,
  });
}
