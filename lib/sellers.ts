import { supabase } from './supabaseClient'

/**
 * Source-of-truth helpers around the `shops` table. Every part of the app
 * that needs to know "who is the seller of this product" or "what is this
 * shop's name / link" should go through these helpers — never query shops
 * directly from pages unless you really need extra columns.
 */

export interface ShopSummary {
  /** Same as users.id — one shop per user. */
  id: string
  name: string | null
  slug: string | null
  logo_url: string | null
  banner_url: string | null
  vacation_mode: boolean
  /** Convenience for display — falls back to username/email when name is unset */
  display_name: string
  /** Convenience for linking — /shop/[slug] if set, else /u/[id] */
  href: string
}

export interface ShopFull extends ShopSummary {
  tagline: string | null
  bio: string | null
  website: string | null
  contact_email: string | null
  contact_phone: string | null
  location: string | null
  socials: Record<string, string>
  announcement: string | null
  vacation_message: string | null
  shipping_policy: string | null
  return_policy: string | null
  low_stock_threshold: number
  is_active: boolean
  created_at: string | null
  /** Optional username pulled from users — useful for fallback display */
  username: string | null
}

const PLATFORM_SHOP: ShopSummary = {
  id: 'souqly',
  name: 'Souqly',
  slug: null,
  logo_url: null,
  banner_url: null,
  vacation_mode: false,
  display_name: 'Souqly',
  href: '/products',
}

/**
 * Every "Visit shop" link in the app should land on /shop/...
 * - If the shop has a custom slug, use it (pretty URL).
 * - Otherwise fall back to the user id — /shop/[slug] resolves either.
 */
function buildHref(slug: string | null, id: string): string {
  return `/shop/${slug || id}`
}

/** Internal: convert a raw shops row + username to a ShopSummary. */
function toSummary(row: any, username?: string | null): ShopSummary {
  const display = row.name || username || 'Independent seller'
  return {
    id: row.id,
    name: row.name ?? null,
    slug: row.slug ?? null,
    logo_url: row.logo_url ?? null,
    banner_url: row.banner_url ?? null,
    vacation_mode: !!row.vacation_mode,
    display_name: display,
    href: buildHref(row.slug ?? null, row.id),
  }
}

/**
 * Fetch compact shop info for a set of user ids. Products without a seller
 * (Souqly-owned) are represented by the platform shop.
 */
export async function fetchSellers(
  sellerIds: Array<string | null | undefined>,
): Promise<Record<string, ShopSummary>> {
  const ids = Array.from(
    new Set(sellerIds.filter((s): s is string => Boolean(s))),
  )
  if (ids.length === 0) return {}

  const [{ data: shops }, { data: users }] = await Promise.all([
    supabase
      .from('shops')
      .select('id, name, slug, logo_url, banner_url, vacation_mode')
      .in('id', ids),
    supabase.from('users').select('id, username').in('id', ids),
  ])

  const usernames = new Map<string, string | null>()
  ;(users ?? []).forEach((u: any) => usernames.set(u.id, u.username))

  const map: Record<string, ShopSummary> = {}
  ;(shops ?? []).forEach((s: any) => {
    map[s.id] = toSummary(s, usernames.get(s.id) ?? null)
  })
  // Fill in any users that have no shop row yet (shouldn't happen because
  // the trigger creates one — but be defensive).
  ids.forEach((id) => {
    if (!map[id]) {
      map[id] = {
        id,
        name: null,
        slug: null,
        logo_url: null,
        banner_url: null,
        vacation_mode: false,
        display_name: usernames.get(id) ?? 'Independent seller',
        href: `/shop/${id}`,
      }
    }
  })
  return map
}

/** Set of seller IDs currently in vacation mode. */
export async function fetchVacationingSellerIds(): Promise<Set<string>> {
  const { data } = await supabase
    .from('shops')
    .select('id')
    .eq('vacation_mode', true)
  return new Set((data ?? []).map((r: any) => r.id))
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Fetch a single shop by its URL segment. We accept either a custom slug or
 * the user id — that way every "Visit shop" link can use /shop/... even for
 * sellers who haven't picked a slug yet.
 */
export async function fetchShopBySlug(
  slugOrId: string,
): Promise<ShopFull | null> {
  // Try by slug first
  let { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('slug', slugOrId)
    .maybeSingle()

  // If not found and the segment looks like a uuid, try by id
  if (!shop && UUID_RE.test(slugOrId)) {
    const fallback = await supabase
      .from('shops')
      .select('*')
      .eq('id', slugOrId)
      .maybeSingle()
    shop = fallback.data ?? null
  }

  if (!shop) return null
  const { data: u } = await supabase
    .from('users')
    .select('username, created_at')
    .eq('id', shop.id)
    .maybeSingle()
  return toFull(shop, u?.username ?? null, u?.created_at ?? null)
}

/** Fetch a single shop by user id (for the current logged-in user). */
export async function fetchShopById(id: string): Promise<ShopFull | null> {
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!shop) return null
  const { data: u } = await supabase
    .from('users')
    .select('username, created_at')
    .eq('id', id)
    .maybeSingle()
  return toFull(shop, u?.username ?? null, u?.created_at ?? null)
}

function toFull(row: any, username: string | null, createdAt: string | null): ShopFull {
  return {
    ...toSummary(row, username),
    tagline: row.tagline ?? null,
    bio: row.bio ?? null,
    website: row.website ?? null,
    contact_email: row.contact_email ?? null,
    contact_phone: row.contact_phone ?? null,
    location: row.location ?? null,
    socials: (row.socials as Record<string, string>) ?? {},
    announcement: row.announcement ?? null,
    vacation_message: row.vacation_message ?? null,
    shipping_policy: row.shipping_policy ?? null,
    return_policy: row.return_policy ?? null,
    low_stock_threshold: row.low_stock_threshold ?? 5,
    is_active: row.is_active ?? true,
    created_at: createdAt,
    username,
  }
}

export { PLATFORM_SHOP }
