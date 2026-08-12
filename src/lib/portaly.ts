/**
 * Portaly Payment API client（testbed）
 *
 * 只包 POR-4364 驗證需要的幾支。契約以 portaly-vibe 的 route 原始碼為準
 * （skill 文件部分過時）：
 *   - checkout-sessions：Bearer key + body{planId,...}，server 從 plan 反查 profileId
 *   - subscriptions cancel/resume：Bearer key
 *   - plans：需要 ?profileId=（key 對該 profileId 驗證）
 *
 * key/secret 一律走 env，勿寫進 code。
 */

const HOST = process.env.PORTALY_API_HOST ?? 'https://portaly.ai'
const KEY = process.env.PORTALY_API_KEY
const PROFILE_ID = process.env.PORTALY_PROFILE_ID // merchant 自己的 profileId

function authHeaders(): HeadersInit {
  if (!KEY) throw new Error('缺 PORTALY_API_KEY（設在 .env.local，勿 commit）')
  return { authorization: `Bearer ${KEY}`, 'content-type': 'application/json' }
}

async function call<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(new URL(path, HOST), init)
  const text = await res.text()
  const json = text ? JSON.parse(text) : null
  if (!res.ok) {
    const msg = json?.error || `Portaly API ${res.status}`
    throw new Error(msg)
  }
  return json as T
}

export interface PortalyPlan {
  id: string
  name: string
  amount: number
  currency: string
  billingPeriod: string
  status: string
}

/** 列出方案（需要 profileId）。testbed 用來挑 planId。 */
export function listActivePlans(): Promise<{ data: PortalyPlan[] }> {
  if (!PROFILE_ID) throw new Error('缺 PORTALY_PROFILE_ID')
  const url = `/api/creator-subscription/plans?status=active&profileId=${encodeURIComponent(PROFILE_ID)}`
  return call(url, { headers: authHeaders() })
}

/** 建 checkout session。回傳 checkoutUrl 給前端導轉、sessionId 存本地當訂閱 id。 */
export function createCheckoutSession(input: {
  planId: string
  customerEmail: string
  returnUrl: string
}): Promise<{ sessionId: string; checkoutUrl: string }> {
  return call('/api/creator-subscription/checkout-sessions', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  })
}

export function cancelSubscription(subscriptionId: string) {
  return call(`/api/creator-subscription/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: authHeaders(),
  })
}

export function resumeSubscription(subscriptionId: string) {
  return call(`/api/creator-subscription/subscriptions/${subscriptionId}/resume`, {
    method: 'POST',
    headers: authHeaders(),
  })
}
