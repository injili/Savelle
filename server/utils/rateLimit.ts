/**
 * Fixed-window rate limiter.
 * - Upstash Redis (REST) when UPSTASH_REDIS_REST_URL/TOKEN are set: shared across
 *   Vercel function instances.
 * - Otherwise an in-memory Map (per instance; fine for dev, best-effort on Vercel).
 */
const memory = new Map<string, { count: number, resetAt: number }>()

export async function rateLimit(key: string, limit: number, windowSec: number): Promise<{ ok: boolean, remaining: number }> {
  const config = useRuntimeConfig()
  const url = config.upstashRedisRestUrl
  const token = config.upstashRedisRestToken

  if (url && token) {
    try {
      const res = await $fetch<{ result: number }[]>(`${url.replace(/\/$/, '')}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: [
          ['INCR', `rl:${key}`],
          ['EXPIRE', `rl:${key}`, String(windowSec), 'NX'],
        ],
      })
      const count = Number(res?.[0]?.result ?? 0)
      return { ok: count <= limit, remaining: Math.max(0, limit - count) }
    }
    catch (err) {
      console.warn('[rateLimit] Upstash unavailable, falling back to memory', err)
    }
  }

  const now = Date.now()
  const entry = memory.get(key)
  if (!entry || entry.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + windowSec * 1000 })
    if (memory.size > 5000) {
      for (const [k, v] of memory) if (v.resetAt < now) memory.delete(k)
    }
    return { ok: true, remaining: limit - 1 }
  }
  entry.count++
  return { ok: entry.count <= limit, remaining: Math.max(0, limit - entry.count) }
}
