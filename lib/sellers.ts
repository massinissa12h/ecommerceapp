import { supabase } from './supabaseClient'
import type { SellerSummary } from '@/types/product'

/**
 * Returns the set of seller ids that are currently in "vacation mode". Used
 * by marketplace listings (home, /products) to hide their items.
 */
export async function fetchVacationingSellerIds(): Promise<Set<string>> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('vacation_mode', true)
  return new Set((data ?? []).map((r: any) => r.id))
}

const PLATFORM_SELLER: SellerSummary = {
  id: 'souqly',
  username: 'souqly',
  shop_name: 'Souqly',
  shop_slug: null,
  avatar_url: null,
  is_seller: true,
}

/**
 * Fetch a compact seller summary for a set of user ids. Products without a
 * seller_id are displayed as sold by the platform itself.
 */
export async function fetchSellers(
  sellerIds: Array<string | null | undefined>,
): Promise<Record<string, SellerSummary>> {
  const ids = Array.from(
    new Set(sellerIds.filter((s): s is string => Boolean(s))),
  )
  if (ids.length === 0) return {}

  const [{ data: usersRows }, { data: profilesRows }] = await Promise.all([
    supabase.from('users').select('id, username').in('id', ids),
    supabase
      .from('profiles')
      .select('id, shop_name, shop_slug, avatar_url, is_seller')
      .in('id', ids),
  ])

  const map: Record<string, SellerSummary> = {}
  const usernames = new Map<string, string | null>()
  ;(usersRows ?? []).forEach((u: any) => usernames.set(u.id, u.username))
  ;(profilesRows ?? []).forEach((p: any) => {
    map[p.id] = {
      id: p.id,
      username: usernames.get(p.id) ?? null,
      shop_name: p.shop_name ?? null,
      shop_slug: p.shop_slug ?? null,
      avatar_url: p.avatar_url ?? null,
      is_seller: !!p.is_seller,
    }
  })
  // Fill in any users that exist but have no profile row yet
  ids.forEach((id) => {
    if (!map[id]) {
      map[id] = {
        id,
        username: usernames.get(id) ?? null,
        shop_name: null,
        shop_slug: null,
        avatar_url: null,
        is_seller: false,
      }
    }
  })
  return map
}

export function sellerDisplayName(seller: SellerSummary | null | undefined) {
  if (!seller) return PLATFORM_SELLER.shop_name
  return seller.shop_name || seller.username || 'Independent Seller'
}

export function sellerHref(seller: SellerSummary | null | undefined) {
  if (!seller) return '/products'
  if (seller.shop_slug) return `/shop/${seller.shop_slug}`
  return `/u/${seller.id}`
}

export { PLATFORM_SELLER }
