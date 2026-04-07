import { env } from '../../config/env.js';
import { MemoryCacheStore } from './memory-cache-store.js';

export const cacheStore = new MemoryCacheStore();
export const defaultCacheTtlSeconds = env.CACHE_DEFAULT_TTL_SECONDS;

