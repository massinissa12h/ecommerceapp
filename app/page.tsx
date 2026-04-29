'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  Star,
  ShieldCheck,
  Truck,
  Heart,
  ArrowRight,
  PackageSearch,
  Wand2,
  TrendingUp,
} from 'lucide-react'
import { useCart } from './hooks/useCart'

export interface Product {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number | null
  image_url: string | null
  rating: number
  created_at: string | null
  image?: string
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { cartCount, addToCart } = useCart()

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (productsError) throw productsError

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('product_id, rating')

      if (reviewsError) throw reviewsError

      const reviewsByProduct: Record<string, { total: number; count: number }> =
        {}

      reviewsData?.forEach(({ product_id, rating }: any) => {
        if (!reviewsByProduct[product_id]) {
          reviewsByProduct[product_id] = { total: 0, count: 0 }
        }

        reviewsByProduct[product_id].total += rating
        reviewsByProduct[product_id].count += 1
      })

      const productsWithRatings: Product[] = (productsData ?? []).map((p: any) => {
        const reviewStats = reviewsByProduct[p.id]

        const avgRating = reviewStats
              ? Number((reviewStats.total / reviewStats.count).toFixed(1))
              : 0
        return {
          ...p,
          rating: avgRating,
          image: p.image_url ?? '',
        }
      })

      const topRatedProducts = productsWithRatings
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 20)

      setProducts(topRatedProducts)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load products.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const heroPreview = products.slice(0, 3)

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      <Navbar cartCount={cartCount} />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 left-10 h-64 w-64 rounded-full bg-white/60 blur-3xl" />
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="relative max-w-7xl mx-auto px-4 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center"
          >
            <div>
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-2 text-sm mb-6 backdrop-blur"
              >
                <Sparkles className="w-4 h-4" />
                Premium picks, modern experience
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
              >
                Discover products that actually feel special.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-xl leading-relaxed"
              >
                Explore electronics, fashion, shoes, accessories, and top-rated
                items selected by real user reviews.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/products">
                  <Button size="lg" variant="secondary" className="rounded-xl">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Shop Now
                  </Button>
                </Link>

                <a href="#featured">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-xl text-primary-foreground border-primary-foreground/70 bg-white/10 hover:bg-primary-foreground hover:text-primary"
                  >
                    Explore Products
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="grid grid-cols-3 gap-3 mt-10 max-w-lg"
              >
                {[
                  ['Top Rated', `${products.length}+`],
                  ['Secure', 'Checkout'],
                  ['Fast', 'Browsing'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-4"
                  >
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-primary-foreground/75 mt-1">
                      {label}
                    </p>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              variants={fadeUp}
              className="relative hidden lg:block min-h-[480px]"
            >
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute right-0 top-8 w-72 rounded-3xl bg-white/95 text-foreground shadow-2xl border border-white/30 overflow-hidden"
              >
                <div className="h-44 bg-secondary overflow-hidden">
                  {heroPreview[0]?.image_url ? (
                    <img
                      src={heroPreview[0].image_url}
                      alt={heroPreview[0].name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-1 text-amber-500 mb-2">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <span className="text-sm font-semibold">
                      {heroPreview[0]?.rating?.toFixed(1) || 'New'}
                    </span>
                  </div>

                  <p className="font-bold truncate">
                    {heroPreview[0]?.name || 'Featured Product'}
                  </p>

                  <p className="text-sm text-muted-foreground mt-1">
                    Premium product pick
                  </p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 14, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-4 top-28 w-64 rounded-3xl bg-white/90 text-foreground shadow-xl border border-white/30 p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>

                  <div>
                    <p className="font-bold">Top rated first</p>
                    <p className="text-sm text-muted-foreground">
                      Sorted by real reviews
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-16 bottom-8 w-72 rounded-3xl bg-white/95 text-foreground shadow-2xl border border-white/30 p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold">Shopping benefits</p>
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    Secure account actions
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    Fast product discovery
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        <section className="border-b border-border bg-white">
          <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              [Truck, 'Fast Experience', 'Smooth shopping from browse to cart'],
              [ShieldCheck, 'Secure Auth', 'Supabase powered user accounts'],
              [Star, 'Rated Products', 'Products ranked by customer reviews'],
            ].map(([Icon, title, text]: any) => (
              <motion.div
                key={title}
                whileHover={{ y: -4 }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>

                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="featured" className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-5"
          >
            <div>
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-2 text-sm font-medium mb-4"
              >
                <Star className="w-4 h-4 fill-primary" />
                Customer favorites
              </motion.div>

              <motion.h2
                variants={fadeUp}
                className="text-3xl md:text-5xl font-bold text-foreground mb-3"
              >
                Top Rated Products
              </motion.h2>

              <motion.p variants={fadeUp} className="text-muted-foreground">
                Handpicked based on highest user ratings.
              </motion.p>
            </div>

            <motion.div variants={fadeUp}>
              <Link href="/products">
                <Button variant="outline" className="rounded-xl">
                  View All Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 gap-4"
              >
                <Loader2 className="w-11 h-11 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Finding the best products...
                </p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 gap-5"
              >
                <div className="flex items-start gap-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-2xl px-6 py-5 max-w-md w-full shadow-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />

                  <div>
                    <p className="font-semibold">Failed to load products</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>

                <Button onClick={fetchProducts} variant="outline">
                  Try Again
                </Button>
              </motion.div>
            ) : products.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 rounded-3xl border border-dashed border-border bg-white"
              >
                <PackageSearch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No products found.</p>
              </motion.div>
            ) : (
              <motion.div
                key="products"
                initial="hidden"
                animate="visible"
                variants={stagger}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {products.map((product) => (
                    <motion.div
                      key={product.id}
                      variants={fadeUp}
                      whileHover={{ y: -6 }}
                      transition={{ duration: 0.25 }}
                    >
                      <ProductCard
                        product={product as any}
                        onAddToCart={() => addToCart(product.id)}
                      />
                    </motion.div>
                  ))}
                </div>

                <div className="text-center">
                  <Link href="/products">
                    <Button size="lg" variant="outline" className="rounded-xl">
                      View All Products
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="relative overflow-hidden bg-secondary">
          <div className="absolute inset-0 opacity-60">
            <div className="absolute top-10 left-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-0 right-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 text-center"
          >
            <motion.div
              variants={fadeUp}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lg"
            >
              <Wand2 className="w-8 h-8" />
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-5xl font-bold mb-4"
            >
              Recommended For You
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="text-muted-foreground mb-10 max-w-2xl mx-auto"
            >
              Soon, this section can become your smart recommendation engine,
              powered by likes, saves, views, cart actions, and reviews.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto"
            >
              {[
                ['Views', 'Learn from products users open most'],
                ['Likes & Saves', 'Understand favorite styles and interests'],
                ['Cart Actions', 'Recommend products people actually want'],
              ].map(([title, text]) => (
                <motion.div
                  key={title}
                  whileHover={{ y: -6 }}
                  className="bg-white rounded-3xl border border-border p-7 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-5 h-5" />
                  </div>

                  <h3 className="font-bold text-lg mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
