'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { ProductFilters, FilterState } from '@/components/product-filters'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  AlertCircle,
  PackageSearch,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
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

const PAGE_SIZE = 50

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
}

export default function ProductsPage() {
  const { cartCount, addToCart } = useCart()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 5000],
    minRating: 0,
  })

  const [searchTerm, setSearchTerm] = useState('')

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const fetchProducts = useCallback(
    async (targetPage = page) => {
      if (products.length === 0) {
        setLoading(true)
      } else {
        setPageLoading(true)
      }

      setError(null)

      try {
        const from = (targetPage - 1) * PAGE_SIZE
        const to = from + PAGE_SIZE - 1

        let query = supabase
          .from('products')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to)

        if (filters.categories.length > 0) {
          query = query.in('category', filters.categories)
        }

        if (filters.priceRange[0] > 0) {
          query = query.gte('price', filters.priceRange[0])
        }

        if (filters.priceRange[1] < 5000) {
          query = query.lte('price', filters.priceRange[1])
        }

        if (searchTerm.trim()) {
          const q = searchTerm.trim().replace(/[%_]/g, '')
          query = query.or(
            `name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`
          )
        }

        const { data: productsData, error: productsError, count } = await query

        if (productsError) throw productsError

        const productIds = (productsData ?? []).map((p: any) => p.id)

        let tagsByProduct: Record<string, string[]> = {}
        let reviewsByProduct: Record<string, { total: number; count: number }> =
          {}

        if (productIds.length > 0) {
          const [{ data: tagsData }, { data: reviewsData, error: reviewsError }] =
            await Promise.all([
              supabase
                .from('product_tags')
                .select('product_id, tag')
                .in('product_id', productIds),

              supabase
                .from('reviews')
                .select('product_id, rating')
                .in('product_id', productIds),
            ])

          if (reviewsError) throw reviewsError

          tagsData?.forEach(({ product_id, tag }: any) => {
            if (!tagsByProduct[product_id]) tagsByProduct[product_id] = []
            tagsByProduct[product_id].push(tag)
          })

          reviewsData?.forEach(({ product_id, rating }: any) => {
            if (!reviewsByProduct[product_id]) {
              reviewsByProduct[product_id] = { total: 0, count: 0 }
            }

            reviewsByProduct[product_id].total += rating
            reviewsByProduct[product_id].count += 1
          })
        }

        const mappedProducts: Product[] = (productsData ?? []).map((p: any) => {
          const reviewStats = reviewsByProduct[p.id]

          const avgRating = reviewStats
                ? Number((reviewStats.total / reviewStats.count).toFixed(1))
                : 0

          return {
            ...p,
            rating: avgRating,
            image_url: p.image_url ?? null,
            image: p.image_url ?? null,
            tags: tagsByProduct[p.id] ?? [],
          }
        })

        setProducts(mappedProducts)
        setTotalCount(count ?? 0)
      } catch (err: any) {
        setError(err.message ?? 'Failed to load products.')
      } finally {
        setLoading(false)
        setPageLoading(false)
      }
    },
    [page, filters, searchTerm, products.length]
  )

  useEffect(() => {
    fetchProducts(page)
  }, [page, fetchProducts])

  useEffect(() => {
    setPage(1)
  }, [filters, searchTerm])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if ((product.rating ?? 0) < filters.minRating) {
        return false
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        const productCategory = (product.category ?? '').toLowerCase()

        return (
          product.name.toLowerCase().includes(q) ||
          (product.description ?? '').toLowerCase().includes(q) ||
          productCategory.includes(q) ||
          product.tags.some((tag) => tag.toLowerCase().includes(q))
        )
      }

      return true
    })
  }, [products, filters.minRating, searchTerm])

  const goToPreviousPage = () => {
    if (page > 1) {
      setPage((current) => current - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToNextPage = () => {
    if (page < totalPages) {
      setPage((current) => current + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar cartCount={cartCount} />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
            <div className="absolute top-1/2 right-1/4 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="relative max-w-7xl mx-auto px-4 py-20 md:py-28"
          >
            <motion.div
              variants={scaleIn}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-4 py-2 text-sm mb-6 backdrop-blur-xl"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-100">Discover quality products</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-balance"
            >
              Curated for You
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-slate-300 max-w-2xl text-lg leading-relaxed"
            >
              Explore our premium collection of carefully selected items. Filter by category, price, and rating to find exactly what you&apos;re looking for.
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
                  Loading first 50 products...
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

                <Button onClick={() => fetchProducts(page)} variant="outline">
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
                <motion.aside variants={fadeUp} className="lg:w-72 shrink-0">
                  <div className="sticky top-24 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md p-6 shadow-lg">
                    <h3 className="text-lg font-semibold text-slate-900 mb-5">Refine your search</h3>
                    <ProductFilters
                      onFilterChange={setFilters}
                      onSearchChange={setSearchTerm}
                    />
                  </div>
                </motion.aside>

                <div className="flex-1 min-w-0">
                  <motion.div
                    variants={fadeUp}
                    className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
                  >
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900">
                        {filteredProducts.length > 0 ? 'Results' : 'No results'}
                      </h2>

                      <p className="text-sm text-slate-600 mt-2">
                        {filteredProducts.length > 0 ? (
                          <>Page {page} of {totalPages} · <span className="font-medium">{filteredProducts.length}</span> products</>
                        ) : (
                          'Try adjusting your filters'
                        )}
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
                          setPage(1)
                        }}
                        className="w-full sm:w-auto"
                      >
                        Clear all filters
                      </Button>
                    )}
                  </motion.div>

                  {pageLoading && (
                    <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      Loading page {page}...
                    </div>
                  )}

                  {filteredProducts.length > 0 ? (
                    <>
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
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            className="h-full"
                          >
                            <ProductCard
                              product={product as any}
                              onAddToCart={() => addToCart(product.id)}
                            />
                          </motion.div>
                        ))}
                      </motion.div>

                      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-8">
                        <p className="text-sm text-slate-600 font-medium">
                          {totalCount.toLocaleString()} total products · Page {page} of {totalPages}
                        </p>

                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            onClick={goToPreviousPage}
                            disabled={page === 1 || pageLoading}
                            className="gap-2 text-slate-700"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Previous</span>
                          </Button>

                          <div className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg">
                            {page}
                          </div>

                          <Button
                            onClick={goToNextPage}
                            disabled={page >= totalPages || pageLoading}
                            className="gap-2"
                          >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="text-center py-24 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100"
                    >
                      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200">
                        <PackageSearch className="w-8 h-8 text-slate-500" />
                      </div>

                      <h3 className="text-2xl font-bold text-slate-900 mb-2">
                        No products found
                      </h3>

                      <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                        We couldn&apos;t find any products matching your criteria. Try adjusting your filters or search term.
                      </p>

                      <Button
                        onClick={() => {
                          setFilters({
                            categories: [],
                            priceRange: [0, 5000],
                            minRating: 0,
                          })
                          setSearchTerm('')
                          setPage(1)
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white"
                      >
                        Reset all filters
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
