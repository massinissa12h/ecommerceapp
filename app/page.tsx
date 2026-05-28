'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { supabase } from '@/lib/supabaseClient'
import { fetchSellers, fetchVacationingSellerIds } from '@/lib/sellers'
import {
  Loader2,
  ChevronRight,
  Truck,
  ShieldCheck,
  RefreshCw,
  Headphones as HeadphonesIcon,
  Shirt,
  Watch,
  Footprints,
  Package,
  Zap,
  Store,
  Star,
  Tag,
  Flame,
  Leaf,
  ArrowRight,
} from 'lucide-react'
import { useCart } from './hooks/useCart'
import type { Product, SellerSummary } from '@/types/product'

const GREEN = '#133215'
const LIME = '#92B775'
const BEIGE = '#F3E8D3'

const CATEGORIES = [
  { slug: 'electronics', label: 'Electronics', icon: HeadphonesIcon },
  { slug: 'fashion', label: 'Fashion', icon: Shirt },
  { slug: 'shoes', label: 'Shoes', icon: Footprints },
  { slug: 'accessories', label: 'Accessories', icon: Watch },
  { slug: '', label: "Today's Deals", icon: Zap },
  { slug: '', label: 'New Arrivals', icon: Tag },
  { slug: '', label: 'Best Sellers', icon: Flame },
  { slug: '', label: 'All Products', icon: Package },
]

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [topSellers, setTopSellers] = useState<Array<SellerSummary & { product_count: number }>>([])
  const [loading, setLoading] = useState(true)
  const { cartCount, addToCart } = useCart()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const vacationIds = await fetchVacationingSellerIds()
      let q = supabase.from('products').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(60)
      if (vacationIds.size > 0)
        q = q.or(`seller_id.is.null,seller_id.not.in.(${Array.from(vacationIds).join(',')})`)
      const { data: productsData } = await q

      const { data: reviewsData } = await supabase.from('reviews').select('product_id, rating')
      const reviewStats: Record<string, { total: number; count: number }> = {}
      reviewsData?.forEach(({ product_id, rating }: any) => {
        if (!reviewStats[product_id]) reviewStats[product_id] = { total: 0, count: 0 }
        reviewStats[product_id].total += rating
        reviewStats[product_id].count += 1
      })

      const sellerIds = (productsData ?? []).map((p: any) => p.seller_id)
      const sellersMap = await fetchSellers(sellerIds)

      const enriched: Product[] = (productsData ?? []).map((p: any) => {
        const stats = reviewStats[p.id]
        return {
          ...p,
          rating: stats ? Number((stats.total / stats.count).toFixed(1)) : 0,
          review_count: stats?.count ?? 0,
          image: p.image_url ?? '',
          seller: p.seller_id ? sellersMap[p.seller_id] : null,
        }
      })

      setProducts([...enriched].sort((a, b) => b.rating - a.rating).slice(0, 20))

      const counts = new Map<string, number>()
      enriched.forEach((p) => { if (p.seller_id) counts.set(p.seller_id, (counts.get(p.seller_id) ?? 0) + 1) })
      setTopSellers(
        [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
          .map(([id, count]) => ({ ...sellersMap[id], product_count: count }))
          .filter((s) => s.id)
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const flashDeals = products.slice(0, 6)
  const featured = products.slice(6, 20)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BEIGE }}>
      <Navbar cartCount={cartCount} />

      <main className="flex-1">

        {/* ── HERO ── */}
        <section style={{ backgroundColor: GREEN }} className="text-white">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 flex flex-col md:flex-row items-center gap-10">
            {/* Copy */}
            <div className="flex-1 max-w-xl">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold mb-5"
                style={{ backgroundColor: LIME, color: GREEN }}
              >
                <Leaf className="w-3.5 h-3.5" /> Thoughtfully curated marketplace
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 tracking-tight">
                Shop smarter.<br />
                <span style={{ color: LIME }}>Live better.</span>
              </h1>
              <p className="text-white/70 text-base md:text-lg mb-8 leading-relaxed">
                Discover thousands of products from independent sellers and trusted brands — all in one place.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-colors"
                  style={{ backgroundColor: LIME, color: GREEN }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#7fa362')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = LIME)}
                >
                  Shop Now <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm border-2 transition-colors"
                  style={{ borderColor: LIME, color: LIME }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = `${LIME}20` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                >
                  <Store className="w-4 h-4" /> Start Selling
                </Link>
              </div>
              {/* Stats */}
              <div className="mt-10 flex items-center gap-8">
                {[['2k+', 'Products'], ['120+', 'Sellers'], ['9.6k', 'Reviews']].map(([val, label]) => (
                  <div key={label}>
                    <p className="text-2xl font-bold" style={{ color: LIME }}>{val}</p>
                    <p className="text-xs text-white/60 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Product mosaic */}
            <div className="hidden md:grid grid-cols-3 gap-2.5 w-72 shrink-0">
              {products.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: `${LIME}30` }}
                >
                  {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRUST BAR ── */}
        <section className="bg-white border-y border-border">
          <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Truck, label: 'Free Shipping', sub: 'On orders $25+' },
              { icon: ShieldCheck, label: 'Secure Payment', sub: '100% protected' },
              { icon: RefreshCw, label: 'Easy Returns', sub: '30-day policy' },
              { icon: HeadphonesIcon, label: '24/7 Support', sub: 'Real human help' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${LIME}25` }}
                >
                  <Icon className="w-4 h-4" style={{ color: GREEN }} />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: GREEN }}>{label}</p>
                  <p className="text-[11px] text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CATEGORIES ── */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <SectionHeader title="Shop by Category" href="/products" />
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href={cat.slug ? `/products?category=${cat.slug}` : '/products'}
                className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-white border border-border hover:border-[#92B775] hover:shadow-elevated transition-all"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: `${LIME}20` }}
                >
                  <cat.icon className="w-5 h-5 transition-colors" style={{ color: GREEN }} />
                </div>
                <span className="text-[11px] font-medium text-center leading-tight" style={{ color: GREEN }}>{cat.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── FLASH DEALS ── */}
        <section className="border-y border-border" style={{ backgroundColor: '#fff' }}>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" style={{ color: GREEN }} fill={GREEN} />
                  <h2 className="text-xl font-bold" style={{ color: GREEN }}>Flash Deals</h2>
                </div>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: GREEN, color: BEIGE }}
                >
                  Limited Time
                </span>
              </div>
              <Link href="/products" className="text-sm font-medium flex items-center gap-0.5 hover:underline" style={{ color: GREEN }}>
                See all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-14">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: GREEN }} />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {flashDeals.map((p) => (
                  <ProductCard key={p.id} product={p as any} onAddToCart={() => addToCart(p.id)} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── PROMO BANNERS ── */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Electronics */}
            <div className="rounded-xl p-6 flex flex-col justify-between min-h-[160px] text-white overflow-hidden relative"
              style={{ backgroundColor: GREEN }}>
              <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-10" style={{ backgroundColor: LIME, transform: 'translate(30%, -30%)' }} />
              <HeadphonesIcon className="w-8 h-8 opacity-70" />
              <div>
                <p className="font-bold text-xl">Electronics</p>
                <p className="text-sm opacity-70 mt-0.5">Top picks, great prices</p>
                <Link href="/products?category=electronics"
                  className="inline-block mt-3 text-xs font-bold px-4 py-1.5 rounded-full transition-colors"
                  style={{ backgroundColor: LIME, color: GREEN }}>
                  Shop Now →
                </Link>
              </div>
            </div>

            {/* Fashion */}
            <div className="rounded-xl p-6 flex flex-col justify-between min-h-[160px] overflow-hidden relative"
              style={{ backgroundColor: BEIGE, border: `2px solid ${LIME}` }}>
              <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-20" style={{ backgroundColor: GREEN, transform: 'translate(30%, -30%)' }} />
              <Shirt className="w-8 h-8 opacity-60" style={{ color: GREEN }} />
              <div>
                <p className="font-bold text-xl" style={{ color: GREEN }}>Fashion</p>
                <p className="text-sm text-muted-foreground mt-0.5">Fresh styles every week</p>
                <Link href="/products?category=fashion"
                  className="inline-block mt-3 text-xs font-bold px-4 py-1.5 rounded-full text-white transition-colors"
                  style={{ backgroundColor: GREEN }}>
                  Shop Now →
                </Link>
              </div>
            </div>

            {/* Sell CTA */}
            <div className="rounded-xl p-6 flex flex-col justify-between min-h-[160px] text-white overflow-hidden relative"
              style={{ backgroundColor: '#1e4a20' }}>
              <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-10" style={{ backgroundColor: BEIGE, transform: 'translate(30%, -30%)' }} />
              <Store className="w-8 h-8 opacity-70" />
              <div>
                <p className="font-bold text-xl">Sell on Souqly</p>
                <p className="text-sm opacity-70 mt-0.5">Open your shop in minutes</p>
                <Link href="/dashboard"
                  className="inline-block mt-3 text-xs font-bold px-4 py-1.5 rounded-full transition-colors"
                  style={{ backgroundColor: LIME, color: GREEN }}>
                  Start Free →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── TOP RATED ── */}
        <section className="border-y border-border bg-white">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5" style={{ fill: LIME, color: LIME }} />
                <h2 className="text-xl font-bold" style={{ color: GREEN }}>Top Rated</h2>
              </div>
              <Link href="/products" className="text-sm font-medium flex items-center gap-0.5 hover:underline" style={{ color: GREEN }}>
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-14">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: GREEN }} />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {featured.map((p) => (
                  <ProductCard key={p.id} product={p as any} onAddToCart={() => addToCart(p.id)} />
                ))}
              </div>
            )}

            <div className="mt-8 text-center">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-sm transition-colors"
                style={{ backgroundColor: GREEN, color: BEIGE }}
              >
                Browse all products <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── TOP SELLERS ── */}
        {topSellers.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-8">
            <SectionHeader title="Top Sellers" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {topSellers.map((s) => (
                <Link key={s.id} href={s.href}
                  className="bg-white rounded-xl border border-border p-4 hover:border-[#92B775] hover:shadow-elevated transition-all flex items-center gap-3"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-border"
                    style={{ backgroundColor: `${LIME}20` }}
                  >
                    {s.logo_url ? (
                      <img src={s.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold" style={{ color: GREEN }}>{s.display_name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: GREEN }}>{s.display_name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Package className="w-3 h-3" /> {s.product_count} products
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── SELL CTA BAND ── */}
        <section style={{ backgroundColor: GREEN }} className="text-white">
          <div className="max-w-7xl mx-auto px-4 py-14 md:py-20 text-center">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold mb-5"
              style={{ backgroundColor: `${LIME}20`, color: LIME }}
            >
              <Store className="w-3.5 h-3.5" /> Join 120+ sellers
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              Sell what you love.<br />
              <span style={{ color: LIME }}>We'll handle the rest.</span>
            </h2>
            <p className="text-white/60 max-w-lg mx-auto mb-8 text-base leading-relaxed">
              List your first product in minutes. Get a real dashboard, order management, and a public shop page — all free to start.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-lg font-semibold text-sm transition-colors"
                style={{ backgroundColor: LIME, color: GREEN }}
              >
                Start selling — it's free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-lg font-semibold text-sm border-2 transition-colors"
                style={{ borderColor: `${LIME}50`, color: LIME }}
              >
                Browse the marketplace
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-xl font-bold" style={{ color: '#133215' }}>{title}</h2>
      {href && (
        <Link href={href} className="text-sm font-medium flex items-center gap-0.5 hover:underline" style={{ color: '#133215' }}>
          See all <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}
