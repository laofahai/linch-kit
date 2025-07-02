import { describe, it, expect } from 'vitest';

import { healthRouter } from './server';

describe('healthRouter', () => {
  it('should return pong message and uptime for ping query', async () => {
    const caller = healthRouter.createCaller({});
    const result = await caller.ping();

    expect(result.message).toBe('pong');
    expect(result.uptime).toBeTypeOf('number');
    expect(result.timestamp).toBeTypeOf('string');
  });
});
