/**
 * Lightweight, zero-dependency in-memory cache with TTL.
 * Greatly reduces database load for read-heavy, low-churn collections like
 * categories, static banners, top-strip, and currency rates.
 */

const cacheStore = new Map();

/**
 * Retrieve cached item if not expired
 */
function get(key) {
  const item = cacheStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return item.value;
}

/**
 * Store item with TTL in seconds (default: 300s / 5 minutes)
 */
function set(key, value, ttlSeconds = 300) {
  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Invalidate cache key or keys matching prefix/pattern
 */
function invalidate(pattern) {
  if (!pattern) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.includes(pattern)) {
      cacheStore.delete(key);
    }
  }
}

module.exports = {
  get,
  set,
  invalidate,
};
