/**
 * Server-side proxy for the FastAPI recommender.
 *
 * Why a proxy?
 *  - Keeps RECOMMENDER_API_KEY out of the browser bundle.
 *  - Hides the upstream URL (can be swapped per environment).
 *  - Centralizes error handling so the UI gets a predictable shape.
 *
 * Supported modes (passed as ?mode=...):
 *   homepage   -> GET {RECOMMENDER_URL}/homepage?n=&user_id=
 *   recommend  -> GET {RECOMMENDER_URL}/recommend?user_id=&item_id=&n=
 */

import { NextRequest, NextResponse } from 'next/server'

const RECOMMENDER_URL =
  process.env.RECOMMENDER_URL ?? 'http://127.0.0.1:8000'
const RECOMMENDER_API_KEY =
  process.env.RECOMMENDER_API_KEY ?? 'dev-key-change-me'

const UPSTREAM_TIMEOUT_MS = 8000

type Mode = 'homepage' | 'recommend'

function buildUpstreamUrl(mode: Mode, params: URLSearchParams): string {
  const url = new URL(`/${mode}`, RECOMMENDER_URL)
  const allowed: Record<Mode, string[]> = {
    homepage: ['user_id', 'n'],
    recommend: ['user_id', 'item_id', 'n', 'refresh'],
  }
  for (const key of allowed[mode]) {
    const value = params.get(key)
    if (value) url.searchParams.set(key, value)
  }
  return url.toString()
}

// undici (Node 18+ fetch) wraps the real network error inside `cause`. Pull it
// out so the browser response and Next.js terminal both surface the actual
// reason (ECONNREFUSED, ENOTFOUND, EAI_AGAIN, etc.) instead of just
// "fetch failed".
function describeFetchError(err: unknown): string {
  if (!(err instanceof Error)) return 'Unknown upstream error'
  const cause = (err as Error & { cause?: unknown }).cause
  if (cause && typeof cause === 'object') {
    const c = cause as { code?: string; errno?: number; syscall?: string; address?: string; port?: number; message?: string }
    const parts = [c.code, c.syscall, c.address && `${c.address}:${c.port ?? ''}`, c.message]
      .filter(Boolean)
    if (parts.length) return `${err.message} (${parts.join(' ')})`
  }
  return err.message
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode') as Mode | null

  if (mode !== 'homepage' && mode !== 'recommend') {
    return NextResponse.json(
      { error: 'Invalid mode. Use ?mode=homepage or ?mode=recommend' },
      { status: 400 },
    )
  }

  if (mode === 'recommend') {
    if (!searchParams.get('user_id') || !searchParams.get('item_id')) {
      return NextResponse.json(
        { error: 'recommend mode requires user_id and item_id' },
        { status: 400 },
      )
    }
  }

  const upstream = buildUpstreamUrl(mode, searchParams)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    // Log every proxy attempt so the dev terminal shows the exact upstream URL.
    // eslint-disable-next-line no-console
    console.log(`[recommender-proxy] -> ${upstream}`)
    const res = await fetch(upstream, {
      method: 'GET',
      headers: { 'X-API-Key': RECOMMENDER_API_KEY },
      cache: 'no-store',
      signal: controller.signal,
    })

    const body = await res.text()
    // eslint-disable-next-line no-console
    console.log(`[recommender-proxy] <- ${res.status} (${body.length} bytes)`)
    return new NextResponse(body, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'application/json',
      },
    })
  } catch (err) {
    const detail = describeFetchError(err)
    // eslint-disable-next-line no-console
    console.error(`[recommender-proxy] FAILED ${upstream}: ${detail}`, err)
    return NextResponse.json(
      {
        error: 'Recommender unavailable',
        detail,
        upstream,
        hint:
          'Check that the FastAPI service is reachable at this URL from Node. ' +
          'Try `curl -v ' + upstream + '` from the same machine. ' +
          'On Windows, prefer http://127.0.0.1:8000 over http://localhost:8000 to avoid IPv6 resolution.',
      },
      { status: 503 },
    )
  } finally {
    clearTimeout(timer)
  }
}
