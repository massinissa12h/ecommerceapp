'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { ProductFilters, FilterState } from '@/components/product-filters'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, PackageSearch, Sparkles } from 'lucide-react'
import { useCart } from '../hooks/useCart'

export interface Product {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number | null
  image_url: string | null
  image: string | null
  rating: number
  created_at: string | null
  tags: string[]
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
}

export default function ProductsPage() {
  const { cartCount, addToCart } = useCart()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 5000],
    minRating: 0,
  })

  const [searchTerm, setSearchTerm] = useState('')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (productsError) throw productsError

      const { data: tagsData } = await supabase
        .from('product_tags')
        .select('product_id, tag')

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('product_id, rating')

      if (reviewsError) throw reviewsError

      const tagsByProduct: Record<string, string[]> = {}

      tagsData?.forEach(({ product_id, tag }: any) => {
        if (!tagsByProduct[product_id]) tagsByProduct[product_id] = []
        tagsByProduct[product_id].push(tag)
      })

      const reviewsByProduct: Record<string, { total: number; count: number }> =
        {}

      reviewsData?.forEach(({ product_id, rating }: any) => {
        if (!reviewsByProduct[product_id]) {
          reviewsByProduct[product_id] = { total: 0, count: 0 }
        }

        reviewsByProduct[product_id].total += rating
        reviewsByProduct[product_id].count += 1
      })

      setProducts(
        (productsData ?? []).map((p: any) => {
          const reviewStats = reviewsByProduct[p.id]

          const avgRating = reviewStats
            ? reviewStats.total / reviewStats.count
            : 0

          return {
            ...p,
            rating: avgRating,
            image_url: p.image_url ?? null,
            image: p.image_url ?? null,
            tags: tagsByProduct[p.id] ?? [],
          }
        })
      )
    } catch (err: any) {
      setError(err.message ?? 'Failed to load products.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const productCategory = (product.category ?? '').trim().toLowerCase()
      const price = product.price ?? 0

      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(productCategory)
      ) {
        return false
      }

      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false
      }

      if ((product.rating ?? 0) < filters.minRating) {
        return false
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase()

        return (
          product.name.toLowerCase().includes(q) ||
          (product.description ?? '').toLowerCase().includes(q) ||
          productCategory.includes(q) ||
          product.tags.some((tag) => tag.toLowerCase().includes(q))
        )
      }

      return true
    })
  }, [filters, searchTerm, products])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar cartCount={cartCount} />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 left-10 h-52 w-52 rounded-full bg-white/60 blur-3xl" />
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="relative max-w-7xl mx-auto px-4 py-16 md:py-20"
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-2 text-sm mb-5 backdrop-blur"
            >
              <Sparkles className="w-4 h-4" />
              Discover quality products
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-6xl font-bold tracking-tight mb-4"
            >
              Our Products
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-primary-foreground/90 max-w-2xl text-lg"
            >
              Browse our complete collection of quality items, filter by your
              needs, and find your next favorite product.
            </motion.p>
          </motion.div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-10 md:py-14">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-28 gap-4"
              >
                <Loader2 className="w-11 h-11 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading products...
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
                <div className="flex items-start gap-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-xl px-6 py-5 max-w-md w-full shadow-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />

                  <div>
                    <p className="font-semibold">Failed to load products</p>
                    <p className="text-sm mt-1 opacity-90">{error}</p>
                  </div>
                </div>

                <Button onClick={fetchProducts} variant="outline">
                  Try Again
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="products"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="flex flex-col lg:flex-row gap-8"
              >
                <motion.aside
                  variants={fadeUp}
                  className="lg:w-72 shrink-0"
                >
                  <div className="sticky top-24 rounded-2xl border border-border bg-white/80 backdrop-blur p-4 shadow-sm">
                    <ProductFilters
                      onFilterChange={setFilters}
                      onSearchChange={setSearchTerm}
                    />
                  </div>
                </motion.aside>

                <div className="flex-1 min-w-0">
                  <motion.div
                    variants={fadeUp}
                    className="mb-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">
                        Product Collection
                      </h2>

                      <p className="text-sm text-muted-foreground mt-1">
                        Showing {filteredProducts.length} of {products.length}{' '}
                        products
                      </p>
                    </div>

                    {(searchTerm ||
                      filters.categories.length > 0 ||
                      filters.minRating > 0 ||
                      filters.priceRange[0] !== 0 ||
                      filters.priceRange[1] !== 5000) && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFilters({
                            categories: [],
                            priceRange: [0, 5000],
                            minRating: 0,
                          })
                          setSearchTerm('')
                        }}
                      >
                        Reset Filters
                      </Button>
                    )}
                  </motion.div>

                  {filteredProducts.length > 0 ? (
                    <motion.div
                      layout
                      variants={staggerContainer}
                      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    >
                      {filteredProducts.map((product) => (
                        <motion.div
                          layout
                          key={product.id}
                          variants={fadeUp}
                          whileHover={{ y: -6 }}
                          transition={{ duration: 0.25 }}
                          className="h-full"
                        >
                          <ProductCard
                            product={product as any}
                            onAddToCart={() => addToCart(product.id)}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-20 rounded-2xl border border-dashed border-border bg-white"
                    >
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                        <PackageSearch className="w-8 h-8 text-muted-foreground" />
                      </div>

                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        No products found
                      </h3>

                      <p className="text-muted-foreground mb-6">
                        Try adjusting your filters or search term.
                      </p>

                      <Button
                        onClick={() => {
                          setFilters({
                            categories: [],
                            priceRange: [0, 5000],
                            minRating: 0,
                          })
                          setSearchTerm('')
                        }}
                      >
                        Reset Filters
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <Footer />
    </div>
  )
}