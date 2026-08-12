#!/usr/bin/env node
/**
 * verify-portal.mjs — POR-4364 的實機驗證 harness（L2 整合測試）
 *
 * 這支直接打 portaly-vibe 的 portal-session 端點，不需要 clipwise 跑起來。
 * 它驗的是 POR-4364 那次修的守門有沒有真的接上 HTTP 層：
 *   1. scoped session（帶 subscriptionId）只看得到那一筆
 *   2. 跨訂閱的 cancel 被擋（does not belong）
 *   3. test key 開的 portal 看不到 live 訂閱（mode 隔離）
 *
 * 關鍵：portal 內部端點吃的是 portalUrl 裡的 portalToken，不是 API key。
 * 所以建完 session 從回傳值摳 token，之後直打，全程不碰付款商。
 *
 * 用法（env 帶入，勿寫進檔案）：
 *   PORTALY_API_HOST=https://... \
 *   PORTALY_TEST_KEY=pcs_test_... \
 *   PORTALY_LIVE_KEY=pcs_live_...   (mode 隔離那項才需要，沒有就跳過) \
 *   TEST_SUB_A=<test 訂閱 id> TEST_SUB_B=<同 email 另一筆> \
 *   LIVE_SUB=<live 訂閱 id>  (選用) \
 *   node scripts/verify-portal.mjs
 */

const HOST = must('PORTALY_API_HOST')
const TEST_KEY = must('PORTALY_TEST_KEY')
const LIVE_KEY = process.env.PORTALY_LIVE_KEY
const SUB_A = must('TEST_SUB_A')
const SUB_B = process.env.TEST_SUB_B
const LIVE_SUB = process.env.LIVE_SUB

const results = []
function must(name) {
  const v = process.env[name]
  if (!v) {
    console.error(`缺 env: ${name}`)
    process.exit(2)
  }
  return v
}
function record(name, pass, detail) {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

async function api(path, { key, token, method = 'GET', body } = {}) {
  const url = new URL(path, HOST)
  if (token) url.searchParams.set('token', token)
  const headers = { 'content-type': 'application/json' }
  if (key) headers.authorization = `Bearer ${key}`
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  let json = null
  try {
    json = await res.json()
  } catch {
    // 空 body 或非 JSON，維持 null
  }
  return { status: res.status, json }
}

/** 建 portal session、從 portalUrl 摳出 token */
async function openPortal(key, subscriptionId) {
  const { status, json } = await api(
    '/api/creator-subscription/portal-sessions',
    {
      key,
      method: 'POST',
      body: { subscriptionId, returnUrl: 'https://example.com/return' },
    }
  )
  if (status !== 201 || !json?.portalUrl) {
    throw new Error(`建 session 失敗 status=${status} body=${JSON.stringify(json)}`)
  }
  const sessionId = json.portalSessionId ?? json.sessionId
  const token = new URL(json.portalUrl).searchParams.get('token')
  if (!sessionId || !token) throw new Error(`portalUrl 摳不到 sessionId/token: ${json.portalUrl}`)
  return { sessionId, token }
}

async function main() {
  // ── preflight：key 前綴要對得上宣告的 mode，不然可能「綠得不對」──
  if (!TEST_KEY.startsWith('pcs_test_')) {
    record('preflight-test-key-prefix', false, `TEST_KEY 前綴不是 pcs_test_，拒跑`)
    process.exit(2)
  }
  if (LIVE_KEY && !LIVE_KEY.startsWith('pcs_live_')) {
    record('preflight-live-key-prefix', false, `LIVE_KEY 前綴不是 pcs_live_，拒跑`)
    process.exit(2)
  }

  // ── 1. scoped session 只回一筆 ──
  const { sessionId, token } = await openPortal(TEST_KEY, SUB_A)

  // token canary：先打一支必過的讀取，401 直接判 token 問題、中止，不往下污染報表
  const canary = await api(
    `/api/creator-subscription/portal-sessions/${sessionId}/subscriptions`,
    { token }
  )
  if (canary.status === 401) {
    record('token-canary', false, 'portalToken 被拒（401）——token 過期或摳錯，中止')
    process.exit(1)
  }
  const rows = canary.json?.data ?? canary.json ?? []
  record(
    'scoped-list-single',
    Array.isArray(rows) && rows.length === 1 && rows[0]?.id === SUB_A,
    `回 ${Array.isArray(rows) ? rows.length : '?'} 筆`
  )

  // ── 2. 跨訂閱 cancel 被擋 ──
  if (SUB_B) {
    const cancel = await api(
      `/api/creator-subscription/portal-sessions/${sessionId}/subscriptions/${SUB_B}/cancel`,
      { method: 'POST', body: { portalToken: token } }
    )
    record(
      'cross-sub-cancel-blocked',
      cancel.status === 404 || cancel.status === 403,
      `status=${cancel.status}（預期 404/403 does not belong）`
    )
  } else {
    console.log('SKIP cross-sub-cancel-blocked（沒給 TEST_SUB_B）')
  }

  // ── 3. mode 隔離：test session 看不到 live 訂閱 ──
  if (LIVE_SUB) {
    // 3a. 用 test key 想對 live 訂閱開 scoped session → 應該建不起來或空
    let isolated = false
    let detail = ''
    try {
      const { sessionId: sid, token: tk } = await openPortal(TEST_KEY, LIVE_SUB)
      const r = await api(
        `/api/creator-subscription/portal-sessions/${sid}/subscriptions`,
        { token: tk }
      )
      const rr = r.json?.data ?? r.json ?? []
      isolated = Array.isArray(rr) && rr.length === 0
      detail = `列表回 ${Array.isArray(rr) ? rr.length : '?'} 筆（預期 0）`
    } catch (e) {
      // 建 session 直接被擋也算隔離成功
      isolated = true
      detail = `建 session 被擋：${e.message}`
    }
    record('test-session-cannot-see-live', isolated, detail)
  } else {
    console.log('SKIP test-session-cannot-see-live（沒給 LIVE_SUB / LIVE_KEY）')
  }

  const failed = results.filter((r) => !r.pass)
  console.log(`\n${results.length - failed.length}/${results.length} PASS`)
  process.exit(failed.length ? 1 : 0)
}

main().catch((e) => {
  console.error('harness 爆了:', e.message)
  process.exit(3)
})
