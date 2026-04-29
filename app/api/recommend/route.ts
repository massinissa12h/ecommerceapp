import { NextRequest, NextResponse } from 'next/server'

const RECOMMENDER_URL = process.env.RECOMMENDER_URL ?? 'http://127.0.0.1:8000'
const RECOMMENDER_API_KEY = process.env.RECOMMENDER_API_KEY ?? 'dev-key-change-me'

const TIMEOUT_MS = 8000

type Mode = 'homepage' | 'recommend'

function buildUpstreamUrl(mode: Mode, params: URLSearchParams): string {
  const url = new URL(`/${mode}`, RECOMMENDER_URL)
  const allowed: Record<Mode, string[]> = {
    homepage: ['user_id', 'n'],
    recommend: ['user_id', 'item_id', 'n', 'refresh'],
  }
  for (const k of allowed[mode]) {
    const v = params.get(k)
    if (v) url.searchParams.set(k, v)
  }
  return url.toString()
}

function describeFetchError(err: unknown): string {
  if (!(err instanceof Error)) return 'Unknown upstream error'
  const cause = (err as Error & { cause?: unknown }).cause
  if (cause && typeof cause === 'object') {
    const c = cause as {
      code?: string; errno?: number; syscall?: string
      address?: string; port?: number; message?: string
    }
    const parts = [c.code, c.syscall, c.address && `${c.address}:${c.port ?? ''}`, c.message].filter(Boolean)
    if (parts.length) return `${err.message} (${parts.join(' ')})`
  }
  return err.message
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode') as Mode | null

  if (mode !== 'homepage' && mode !== 'recommend') {
    return NextResponse.json({ error: 'Invalid mode. Use ?mode=homepage or ?mode=recommend' }, { status: 400 })
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
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)

  try {
    console.log(`[rec-proxy] -> ${upstream}`)
    const res = await fetch(upstream, {
      method: 'GET',
      headers: { 'X-API-Key': RECOMMENDER_API_KEY },
      cache: 'no-store',
      signal: ctrl.signal,
    })
    const body = await res.text()
    console.log(`[rec-proxy] <- ${res.status} (${body.length} bytes)`)
    return new NextResponse(body, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
    })
  } catch (err) {
    const detail = describeFetchError(err)
    console.error(`[rec-proxy] FAILED ${upstream}: ${detail}`, err)
    return NextResponse.json(
      {
        error: 'Recommender unavailable',
        detail,
        upstream,
        hint: 'On Windows prefer http://127.0.0.1:8000 over http://localhost:8000.',
      },
      { status: 503 },
    )
  } finally {
    clearTimeout(timer)
  }
}
