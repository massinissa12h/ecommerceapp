'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { supabase } from '@/lib/supabaseClient'
import { fetchSellers, fetchVacationingSellerIds } from '@/lib/sellers'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  ArrowRight,
  ShieldCheck,
  Truck,
  RefreshCw,
  Sparkles,
  Store,
  Headphones,
  Shirt,
  Watch,
  Footprints,
  Package,
  TrendingUp,
} from 'lucide-react'
import { useCart } from './hooks/useCart'
import type { Product, SellerSummary } from '@/types/product'

const CATEGORIES: Array<{ slug: string; label: string; icon: any }> = [
  { slug: 'electronics', label: 'Electronics', icon: Headphones },
  { slug: 'fashion', label: 'Fashion', icon: Shirt },
  { slug: 'shoes', label: 'Shoes', icon: Footprints },
  { slug: 'accessories', label: 'Accessories', icon: Watch },
]

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [topSellers, setTopSellers] = useState<
    Array<SellerSummary & { product_count: number }>
  >([])
  const [loading, setLoading] = useState(true)
  const { cartCount, addToCart } = useCart()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const vacationIds = await fetchVacationingSellerIds()
      let q = supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(60)
      if (vacationIds.size > 0) {
        q = q.or(
          `seller_id.is.null,seller_id.not.in.(${Array.from(vacationIds).join(',')})`,
        )
      }
      const { data: productsData } = await q

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('product_id, rating')

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

      const sorted = [...enriched].sort((a, b) => b.rating - a.rating).slice(0, 8)
      setProducts(sorted)

      // Build a tiny "top sellers" list out of who has the most products in
      // the recent slice. Good enough as a homepage signal.
      const counts = new Map<string, number>()
      enriched.forEach((p) => {
        if (!p.seller_id) return
        counts.set(p.seller_id, (counts.get(p.seller_id) ?? 0) + 1)
      })
      const sellers = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([id, count]) => ({
          ...sellersMap[id],
          product_count: count,
        }))
        .filter((s) => s.id)
      setTopSellers(sellers)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const heroImages = products.slice(0, 4).map((p) => p.image_url).filter(Boolean) as string[]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar cartCount={cartCount} />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative border-b border-border overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
          <div className="relative max-w-7xl mx-auto px-4 pt-14 pb-20 md:pt-20 md:pb-28 grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                Now: 2,000+ products from independent sellers
              </div>

              <h1 className="text-balance text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] mb-6">
                The marketplace where{' '}
                <span className="text-brand">good taste</span> lives.
              </h1>

              <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
                Discover thoughtfully curated products from independent sellers
                and beloved brands. Or open your own shop in minutes — no fees
                to get started.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/products">
                  <Button size="lg" className="rounded-lg">
                    Start shopping
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="rounded-lg">
                    <Store className="w-4 h-4 mr-2" />
                    Sell on Souqly
                  </Button>
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
                <Stat label="Sellers" value="120+" />
                <div className="h-8 w-px bg-border" />
                <Stat label="Products" value="2k+" />
                <div className="h-8 w-px bg-border" />
                <Stat label="Reviews" value="9.6k" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative hidden lg:block"
            >
              <div className="relative h-[520px]">
                <HeroTile
                  className="absolute top-0 left-0 w-56 h-72 rotate-[-6deg]"
                  image={heroImages[0]}
                />
                <HeroTile
                  className="absolute top-10 right-0 w-64 h-80 rotate-[5deg]"
                  image={heroImages[1]}
                />
                <HeroTile
                  className="absolute bottom-0 left-16 w-60 h-72 rotate-[2deg]"
                  image={heroImages[2]}
                />
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-2 right-4 w-60 rounded-xl border border-border bg-card p-4 shadow-elevated-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand text-brand-foreground flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">For you, curated</p>
                      <p className="text-xs text-muted-foreground">
                        Personalized picks every visit
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* TRUST BAND */}
        <section className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            <Trust icon={Truck} label="Fast shipping" />
            <Trust icon={ShieldCheck} label="Secure checkout" />
            <Trust icon={RefreshCw} label="30-day returns" />
            <Trust icon={Headphones} label="Real human support" />
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                Browse
              </p>
              <h2 className="text-2xl md:text-4xl font-semibold tracking-tight">
                Shop by category
              </h2>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center text-sm font-medium hover:text-brand transition-colors"
            >
              View all
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 hover:border-foreground/20 hover:shadow-elevated transition-all"
              >
                <cat.icon className="w-7 h-7 text-foreground/70 group-hover:text-brand transition-colors mb-8" />
                <p className="font-medium">{cat.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Shop {cat.label.toLowerCase()}
                </p>
                <ArrowRight className="absolute top-6 right-6 w-4 h-4 text-muted-foreground group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </section>

        {/* FEATURED PRODUCTS */}
        <section className="border-y border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Highest rated
                </p>
                <h2 className="text-2xl md:text-4xl font-semibold tracking-tight">
                  Featured products
                </h2>
              </div>
              <Link
                href="/products"
                className="hidden sm:inline-flex items-center text-sm font-medium hover:text-brand transition-colors"
              >
                Browse all
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p as any}
                    onAddToCart={() => addToCart(p.id)}
                  />
                ))}
              </div>
            )}

            <div className="mt-10 text-center sm:hidden">
              <Link href="/products">
                <Button variant="outline">
                  Browse all products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* TOP SELLERS */}
        {topSellers.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Community
                </p>
                <h2 className="text-2xl md:text-4xl font-semibold tracking-tight">
                  Discover top sellers
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topSellers.map((s) => (
                <Link
                  key={s.id}
                  href={s.href}
                  className="group rounded-xl border border-border bg-card p-5 hover:border-foreground/20 hover:shadow-elevated transition-all flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary border border-border flex items-center justify-center text-sm font-semibold text-muted-foreground">
                    {s.logo_url ? (
                      <img src={s.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      s.display_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate group-hover:text-brand transition-colors">
                      {s.display_name}
                    </p>
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {s.product_count} products
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SELL CTA */}
        <section className="border-t border-border bg-foreground text-background">
          <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/5 px-3 py-1.5 text-xs font-medium mb-5">
                <Store className="w-3.5 h-3.5" />
                Open your shop
              </div>
              <h2 className="text-balance text-3xl md:text-5xl font-semibold tracking-tight leading-tight mb-5">
                Sell what you love. We&apos;ll handle the rest.
              </h2>
              <p className="text-background/70 mb-7 max-w-lg leading-relaxed">
                List your first product in minutes. Sellers get a real
                dashboard, order management, payouts insights, and a public
                shop page that grows with you.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/dashboard">
                  <Button size="lg" variant="secondary" className="rounded-lg">
                    Start selling — it&apos;s free
                  </Button>
                </Link>
                <Link href="/products">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-lg border-background/30 bg-transparent text-background hover:bg-background hover:text-foreground"
                  >
                    See what people sell
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <BenefitTile
                icon={Package}
                title="List in 60s"
                text="Upload images, set a price, and you're live."
              />
              <BenefitTile
                icon={TrendingUp}
                title="Built-in analytics"
                text="See views, conversions, and revenue trends."
              />
              <BenefitTile
                icon={ShieldCheck}
                title="Trust by default"
                text="Verified buyers and a transparent review system."
              />
              <BenefitTile
                icon={Sparkles}
                title="Featured for free"
                text="Quality items surface in featured spots."
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function Trust({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-secondary text-foreground flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

function HeroTile({ className, image }: { className: string; image?: string }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-card shadow-elevated ${className}`}>
      {image ? (
        <Image
          src={image}
          alt=""
          unoptimized
          width={400}
          height={500}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-secondary" />
      )}
    </div>
  )
}

function BenefitTile({
  icon: Icon,
  title,
  text,
}: {
  icon: any
  title: string
  text: string
}) {
  return (
    <div className="rounded-xl border border-background/15 bg-background/5 p-5">
      <Icon className="w-5 h-5 text-brand mb-4" />
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-background/70 mt-1">{text}</p>
    </div>
  )
}
