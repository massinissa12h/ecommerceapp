import { supabase } from '@/lib/supabaseClient'

export interface RecommendationItem {
  item_id: string
  name: string
  score: number
  sources: Record<string, number>
  explanation: string
}

export interface HomepageItem extends RecommendationItem {
  personalised: boolean
}

export interface HydratedProduct {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number | null
  image_url: string | null
}

export interface RecommendedProduct extends HydratedProduct {
  score: number
  explanation: string
  sources: Record<string, number>
  personalised?: boolean
}

async function readErrorDetail(res: Response): Promise<string> {
  try {
    const text = await res.text()
    if (!text) return ''
    try {
      const parsed = JSON.parse(text) as { error?: string; detail?: string }
      return parsed.detail || parsed.error || text
    } catch {
      return text
    }
  } catch {
    return ''
  }
}

export async function fetchHomepage(opts: {
  userId?: string | null
  n?: number
  signal?: AbortSignal
}): Promise<HomepageItem[]> {
  const params = new URLSearchParams({ mode: 'homepage', n: String(opts.n ?? 6) })
  if (opts.userId) params.set('user_id', opts.userId)

  const res = await fetch(`/api/recommend?${params.toString()}`, { signal: opts.signal, cache: 'no-store' })
  if (!res.ok) {
    const detail = await readErrorDetail(res)
    throw new Error(`homepage ${res.status}${detail ? ` - ${detail}` : ''}`)
  }
  return (await res.json()) as HomepageItem[]
}

export async function fetchRecommendForItem(opts: {
  userId: string
  itemId: string
  n?: number
  signal?: AbortSignal
}): Promise<RecommendationItem[]> {
  const params = new URLSearchParams({
    mode: 'recommend',
    user_id: opts.userId,
    item_id: opts.itemId,
    n: String(opts.n ?? 6),
  })

  const res = await fetch(`/api/recommend?${params.toString()}`, {
    signal: opts.signal,
    cache: 'no-store',
  })
  if (!res.ok) {
    const detail = await readErrorDetail(res)
    throw new Error(`recommend ${res.status}${detail ? ` - ${detail}` : ''}`)
  }
  return (await res.json()) as RecommendationItem[]
}

export async function hydrateRecommendations(
  recs: RecommendationItem[] | HomepageItem[],
): Promise<RecommendedProduct[]> {
  if (recs.length === 0) return []

  const ids = recs.map((r) => r.item_id)
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, category, price, image_url')
    .in('id', ids)

  if (error || !data) return []

  const byId = new Map<string, HydratedProduct>(
    (data as HydratedProduct[]).map((p) => [p.id, p]),
  )

  return recs.map((r) => {
    const product = byId.get(r.item_id)
    if (!product) return null
    return {
      ...product,
      score: r.score,
      explanation: r.explanation,
      sources: r.sources,
      personalised: 'personalised' in r ? r.personalised : undefined,
    } as RecommendedProduct
  }).filter(Boolean) as RecommendedProduct[]
}

export async function fetchFriendsLiked(
  userId: string,
  limit = 6,
): Promise<RecommendedProduct[]> {
  const { data: friendships } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id, status')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted')

  const friendIds = (friendships ?? [])
    .map((f) => (f.requester_id === userId ? f.addressee_id : f.requester_id))
    .filter((id): id is string => !!id)

  if (friendIds.length === 0) return []

  const { data: likes } = await supabase
    .from('interactions')
    .select('product_id, user_id, created_at')
    .in('user_id', friendIds)
    .eq('action', 'like')
    .order('created_at', { ascending: false })
    .limit(200)

  if (!likes || likes.length === 0) return []

  const { data: mine } = await supabase
    .from('interactions')
    .select('product_id')
    .eq('user_id', userId)

  const excluded = new Set((mine ?? []).map((m) => m.product_id))

  const counts = new Map<string, { count: number; latest: string; friends: Set<string> }>()
  for (const l of likes) {
    if (!l.product_id || excluded.has(l.product_id)) continue
    const entry = counts.get(l.product_id) ?? { count: 0, latest: l.created_at, friends: new Set() }
    entry.friends.add(l.user_id)
    entry.count = entry.friends.size
    if (l.created_at > entry.latest) entry.latest = l.created_at
    counts.set(l.product_id, entry)
  }

  const ranked = Array.from(counts.entries())
    .sort((a, b) => b[1].count - a[1].count || b[1].latest.localeCompare(a[1].latest))
    .slice(0, limit)

  if (ranked.length === 0) return []

  const ids = ranked.map(([id]) => id)
  const { data: products } = await supabase
    .from('products')
    .select('id, name, description, category, price, image_url')
    .in('id', ids)

  const byId = new Map<string, HydratedProduct>(
    ((products ?? []) as HydratedProduct[]).map((p) => [p.id, p]),
  )

  return ranked.map(([id, info]) => {
    const product = byId.get(id)
    if (!product) return null
    return {
      ...product,
      score: info.count,
      explanation: `Liked by ${info.count} of your friend${info.count === 1 ? '' : 's'}`,
      sources: { social: info.count },
    } as RecommendedProduct
  }).filter(Boolean) as RecommendedProduct[]
}

export async function fetchRecentViews(userId: string, limit = 3): Promise<HydratedProduct[]> {
  const { data } = await supabase
    .from('interactions')
    .select('product_id, created_at')
    .eq('user_id', userId)
    .eq('action', 'view')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!data || data.length === 0) return []

  const seen = new Set<string>()
  const distinctIds: string[] = []
  for (const row of data) {
    if (!row.product_id || seen.has(row.product_id)) continue
    seen.add(row.product_id)
    distinctIds.push(row.product_id)
    if (distinctIds.length >= limit) break
  }
  if (distinctIds.length === 0) return []

  const { data: products } = await supabase
    .from('products')
    .select('id, name, description, category, price, image_url')
    .in('id', distinctIds)

  const byId = new Map<string, HydratedProduct>(
    ((products ?? []) as HydratedProduct[]).map((p) => [p.id, p]),
  )

  return distinctIds.map((id) => byId.get(id)).filter(Boolean) as HydratedProduct[]
}
