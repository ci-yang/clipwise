/**
 * Portaly callback HMAC 驗簽。
 *
 * 契約（portaly-vibe / skill 一致）：HMAC-SHA256 over
 *   `${x-portaly-timestamp}.${stableJson(payload)}`
 * 三個雷，踩到就靜默 401：
 *   1. timestamp 是 ISO datetime，不是 Unix
 *   2. stable JSON 的 key 排序用 localeCompare（不是 JSON.stringify 預設，也不是 naive sort）
 *   3. 比對用 timingSafeEqual，別用 ===
 * 容差 ±5 分鐘對稱視窗。
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

const WINDOW_MS = 5 * 60 * 1000

/** 依 localeCompare 排 key 的穩定序列化（與 Portaly 端一致，勿改成 naive sort） */
export function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b))
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableJson(obj[k])}`).join(',')}}`
}

export interface VerifyResult {
  ok: boolean
  reason?: string
}

export function verifyCallback(input: {
  secret: string
  timestamp: string | null
  signature: string | null
  payload: unknown
  now?: number
}): VerifyResult {
  const { secret, timestamp, signature, payload } = input
  if (!timestamp || !signature) return { ok: false, reason: 'missing header' }

  const ts = Date.parse(timestamp) // ISO datetime
  if (Number.isNaN(ts)) return { ok: false, reason: 'timestamp not ISO' }
  const now = input.now ?? Date.now()
  if (Math.abs(now - ts) > WINDOW_MS) return { ok: false, reason: 'timestamp outside window' }

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${stableJson(payload)}`)
    .digest('hex')

  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return { ok: false, reason: 'signature mismatch' }
  return timingSafeEqual(a, b) ? { ok: true } : { ok: false, reason: 'signature mismatch' }
}
