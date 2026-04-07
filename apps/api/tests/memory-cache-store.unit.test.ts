import { describe, expect, it, vi } from 'vitest';

import { MemoryCacheStore } from '../src/core/cache/memory-cache-store.js';

describe('MemoryCacheStore', () => {
  it('returns values before ttl expiration', () => {
    vi.useFakeTimers();
    const cache = new MemoryCacheStore();

    cache.set('roles', ['SUPER_ADMIN'], 10);

    expect(cache.get<string[]>('roles')).toEqual(['SUPER_ADMIN']);
  });

  it('expires values after ttl', () => {
    vi.useFakeTimers();
    const cache = new MemoryCacheStore();

    cache.set('summary', { total: 3 }, 1);
    vi.advanceTimersByTime(1_100);

    expect(cache.get('summary')).toBeUndefined();
  });
});

