'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { supabase } from '@/lib/supabaseClient'
import { resolveAllSocials, normalizeWebsite } from '@/lib/socials'
import {
  Loader2,
  AlertCircle,
  Package,
  Star,
  Store,
  ArrowLeft,
  Globe,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Calendar,
  Share2,
  Megaphone,
  Plane,
  Truck,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/app/hooks/useCart'
import { useWishlist } from '@/app/hooks/useWishlist'

type Seller = {
  id: string
  shop_name: string | null
  shop_slug: string | null
  shop_bio: string | null
  shop_banner_url: string | null
  avatar_url: string | null
  username: string | null
  website: string | null
  contact_email: string | null
  contact_phone: string | null
  shop_location: string | null
  socials: Record<string, string> | null
  created_at: string | null
  shop_announcement: string | null
  vacation_mode: boolean
  vacation_message: string | null
  shipping_policy: string | null
  return_policy: string | null
}

export default function PublicShopPage() {
  const params = useParams<{ slug: string }>()
  const { cartCount, addToCart } = useCart()
  const { wishlistIds, toggleWishlist } = useWishlist()
  const [seller, setSeller] = useState<Seller | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ products: 0, avgRating: 0, sold: 0 })
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('shop_slug', params.slug)
        .maybeSingle()

      if (!profile) {
        setLoading(false)
        return
      }

      const { data: u } = await supabase
        .from('users')
        .select('username, created_at')
        .eq('id', profile.id)
        .maybeSingle()

      const sellerData: Seller = {
        ...profile,
        username: u?.username ?? null,
        created_at: u?.created_at ?? null,
        socials: (profile.socials as Record<string, string>) ?? null,
        vacation_mode: !!profile.vacation_mode,
      }
      if (cancelled) return
      setSeller(sellerData)

      const [{ data: ps }, { data: revs }, { data: oi }] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('seller_id', profile.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        supabase
          .from('reviews')
          .select('rating, product_id, products!inner(seller_id)')
          .eq('products.seller_id', profile.id),
        supabase
          .from('order_items')
          .select('quantity')
          .eq('seller_id', profile.id),
      ])

      const reviewMap = new Map<string, { total: number; count: number }>()
      ;(revs ?? []).forEach((r: any) => {
        const cur = reviewMap.get(r.product_id) ?? { total: 0, count: 0 }
        cur.total += r.rating
        cur.count += 1
        reviewMap.set(r.product_id, cur)
      })

      const enriched = (ps ?? []).map((p: any) => {
        const s = reviewMap.get(p.id)
        return {
          ...p,
          image: p.image_url ?? '',
          rating: s ? Number((s.total / s.count).toFixed(1)) : 0,
          review_count: s?.count ?? 0,
          seller: {
            id: profile.id,
            shop_name: profile.shop_name,
            shop_slug: profile.shop_slug,
            username: u?.username ?? null,
          },
        }
      })

      const ratings = (revs ?? []) as any[]
      const avgRating = ratings.length
        ? Number(
            (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1),
          )
        : 0
      const sold = (oi ?? []).reduce((s: number, r: any) => s + (r.quantity ?? 0), 0)

      if (cancelled) return
      setProducts(enriched)
      setStats({ products: enriched.length, avgRating, sold })
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [params.slug])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar cartCount={cartCount} />
        <div className="flex-1 grid place-items-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    )
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar cartCount={cartCount} />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-24 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h1 className="text-2xl font-semibold">Shop not found</h1>
          <p className="text-sm text-muted-foreground mt-1">
            We couldn&apos;t find a shop at this address.
          </p>
          <Link href="/products" className="inline-flex items-center mt-6 text-sm hover:text-brand">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to marketplace
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const website = normalizeWebsite(seller.website)
  const socials = resolveAllSocials(seller.socials)
  const joined = seller.created_at
    ? new Date(seller.created_at).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })
    : null

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean) as string[]),
  )
  const visibleProducts = products.filter((p) => {
    if (activeCategory !== 'all' && p.category !== activeCategory) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar cartCount={cartCount} />

      <main className="flex-1">
        {/* HERO / BANNER */}
        <section className="relative border-b border-border bg-card">
          <div className="h-56 w-full overflow-hidden bg-secondary relative">
            {seller.shop_banner_url ? (
              <img
                src={seller.shop_banner_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-grid opacity-40" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          </div>
          <div className="max-w-7xl mx-auto px-4">
            <div className="-mt-16 flex flex-col sm:flex-row sm:items-end gap-4 pb-8">
              <div className="w-28 h-28 rounded-2xl bg-card overflow-hidden border-4 border-card shadow-elevated-lg flex items-center justify-center text-3xl font-semibold text-muted-foreground">
                {seller.avatar_url ? (
                  <img
                    src={seller.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (seller.shop_name || seller.username || 'S').charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1 inline-flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  Independent shop
                  {joined && (
                    <>
                      <span className="text-border">·</span>
                      <Calendar className="w-3 h-3" />
                      <span>Since {joined}</span>
                    </>
                  )}
                </p>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  {seller.shop_name || seller.username || 'Independent seller'}
                </h1>
                {seller.shop_location && (
                  <p className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {seller.shop_location}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: seller.shop_name ?? 'Shop',
                        url: window.location.href,
                      })
                    } else {
                      navigator.clipboard?.writeText(window.location.href)
                    }
                  }}
                >
                  <Share2 className="w-3.5 h-3.5 mr-1.5" />
                  Share shop
                </Button>
                {seller.contact_email && (
                  <a href={`mailto:${seller.contact_email}`}>
                    <Button size="sm">
                      <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                      Contact
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-4 pb-6">
              <ShopStat icon={Package} label="Products" value={stats.products} />
              <ShopStat
                icon={Star}
                label="Avg rating"
                value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
              />
              <ShopStat icon={Package} label="Items sold" value={stats.sold} />
            </div>
          </div>
        </section>

        {/* Announcement + vacation banners */}
        {(seller.shop_announcement || seller.vacation_mode) && (
          <section className="max-w-7xl mx-auto px-4 pt-6 space-y-3">
            {seller.vacation_mode && (
              <div className="rounded-xl border border-warning/40 bg-warning/10 text-warning-foreground p-4 flex items-start gap-3">
                <Plane className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    This shop is on vacation
                  </p>
                  <p className="text-sm text-foreground/80 mt-0.5">
                    {seller.vacation_message ||
                      'The seller is currently away. New orders are paused — please check back soon.'}
                  </p>
                </div>
              </div>
            )}
            {seller.shop_announcement && (
              <div className="rounded-xl border border-brand/30 bg-brand-soft text-foreground p-4 flex items-start gap-3">
                <Megaphone className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {seller.shop_announcement}
                </p>
              </div>
            )}
          </section>
        )}

        <section className="max-w-7xl mx-auto px-4 py-10 grid lg:grid-cols-[300px_1fr] gap-8">
          {/* SIDEBAR — About / Contacts / Socials */}
          <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
            {seller.shop_bio && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  About
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {seller.shop_bio}
                </p>
              </div>
            )}

            {(website ||
              seller.contact_email ||
              seller.contact_phone ||
              seller.shop_location) && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                  Contact
                </h3>
                <ul className="space-y-2.5 text-sm">
                  {website && (
                    <ContactRow icon={Globe}>
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-brand truncate"
                      >
                        {website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                      </a>
                    </ContactRow>
                  )}
                  {seller.contact_email && (
                    <ContactRow icon={Mail}>
                      <a
                        href={`mailto:${seller.contact_email}`}
                        className="hover:text-brand truncate"
                      >
                        {seller.contact_email}
                      </a>
                    </ContactRow>
                  )}
                  {seller.contact_phone && (
                    <ContactRow icon={Phone}>
                      <a
                        href={`tel:${seller.contact_phone}`}
                        className="hover:text-brand"
                      >
                        {seller.contact_phone}
                      </a>
                    </ContactRow>
                  )}
                  {seller.shop_location && (
                    <ContactRow icon={MapPin}>
                      <span>{seller.shop_location}</span>
                    </ContactRow>
                  )}
                </ul>
              </div>
            )}

            {socials.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                  Follow on social
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {socials.map((s) => (
                    <a
                      key={s.platform}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={s.label}
                      className="aspect-square rounded-lg border border-border bg-secondary/40 hover:bg-secondary hover:border-foreground/30 flex items-center justify-center text-foreground/80 hover:text-foreground transition-colors"
                    >
                      <s.icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {seller.shipping_policy && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 inline-flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  Shipping
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {seller.shipping_policy}
                </p>
              </div>
            )}
            {seller.return_policy && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 inline-flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Returns
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {seller.return_policy}
                </p>
              </div>
            )}
          </aside>

          {/* PRODUCTS */}
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-5 gap-3">
              <h2 className="text-xl font-semibold tracking-tight">
                Products{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  ({visibleProducts.length})
                </span>
              </h2>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search this shop"
                className="h-9 px-3 rounded-md border border-input bg-background text-sm w-40 sm:w-56"
              />
            </div>

            {categories.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                <CategoryPill
                  active={activeCategory === 'all'}
                  onClick={() => setActiveCategory('all')}
                >
                  All
                </CategoryPill>
                {categories.map((c) => (
                  <CategoryPill
                    key={c}
                    active={activeCategory === c}
                    onClick={() => setActiveCategory(c)}
                  >
                    <span className="capitalize">{c}</span>
                  </CategoryPill>
                ))}
              </div>
            )}

            {visibleProducts.length === 0 ? (
              <div className="text-center py-20 rounded-xl border border-dashed border-border bg-card">
                <Package className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg">
                  {products.length === 0 ? 'No products yet' : 'Nothing matches'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {products.length === 0
                    ? "This shop hasn't listed anything just yet."
                    : 'Try a different category or search term.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {visibleProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={() => addToCart(p.id)}
                    onToggleWishlist={() => toggleWishlist(p.id)}
                    wishlisted={wishlistIds.has(p.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function ShopStat({
  icon: Icon,
  label,
  value,
}: {
  icon: any
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold inline-flex items-center gap-1 mb-0.5">
        <Icon className="w-3 h-3" />
        {label}
      </p>
      <p className="text-xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}

function ContactRow({
  icon: Icon,
  children,
}: {
  icon: any
  children: React.ReactNode
}) {
  return (
    <li className="flex items-center gap-2 min-w-0">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="min-w-0 truncate">{children}</div>
    </li>
  )
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active
          ? 'bg-foreground text-background'
          : 'bg-secondary text-foreground/80 hover:bg-secondary/80'
      }`}
    >
      {children}
    </button>
  )
}
