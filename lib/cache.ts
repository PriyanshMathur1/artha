/**
 * Lightweight in-memory cache with TTL — persists per serverless function invocation.
 * For cross-invocation caching (NAVs, fundamentals), use the Prisma-backed caches.
 */

type CacheEntry<T> = { value: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): T {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return hit;
  const value = await loader();
  return cacheSet(key, value, ttlMs);
}

export const TTL = {
  STOCK_QUOTE: 60_000,         // 1 min
  STOCK_FUNDAMENTALS: 24 * 60 * 60_000, // 1 day
  MF_NAV: 6 * 60 * 60_000,     // 6 hr
  MF_HISTORY: 24 * 60 * 60_000, // 1 day
  AGENT_SCAN: 6 * 60 * 60_000, // 6 hr
} as const;
