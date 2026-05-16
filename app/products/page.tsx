'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { ProductFilters, FilterState } from '@/components/product-filters'
import { supabase } from '@/lib/supabaseClient'
import { fetchSellers } from '@/lib/sellers'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  AlertCircle,
  PackageSearch,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Store,
  X,
} from 'lucide-react'
import { useCart } from '../hooks/useCart'
import { useWishlist } from '../hooks/useWishlist'
import type { Product, SellerSummary } from '@/types/product'

const PAGE_SIZE = 24

export default function ProductsPage() {
  const sp = useSearchParams()
  const sellerId = sp.get('seller')
  const queryParam = sp.get('q') ?? ''
  const categoryParam = sp.get('category') ?? ''

  const { cartCount, addToCart } = useCart()
  const { wishlistIds, toggleWishlist } = useWishlist()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const [sellerPreview, setSellerPreview] = useState<SellerSummary | null>(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [sort, setSort] = useState<'newest' | 'rated' | 'priceLow' | 'priceHigh'>(
    'newest',
  )

  const [filters, setFilters] = useState<FilterState>({
    categories: categoryParam ? [categoryParam] : [],
    priceRange: [0, 5000],
    minRating: 0,
  })
  const [searchTerm, setSearchTerm] = useState(queryParam)

  // Keep search/category in sync with URL params (e.g. when nav search updates)
  useEffect(() => {
    setSearchTerm(queryParam)
  }, [queryParam])
  useEffect(() => {
    setFilters((f) =>
      categoryParam ? { ...f, categories: [categoryParam] } : { ...f, categories: [] },
    )
  }, [categoryParam])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const fetchProducts = useCallback(
    async (targetPage = page) => {
      if (products.length === 0) setLoading(true)
      else setPageLoading(true)
      setError(null)

      try {
        const from = (targetPage - 1) * PAGE_SIZE
        const to = from + PAGE_SIZE - 1

        let query = supabase
          .from('products')
          .select('*', { count: 'exact' })
          .eq('status', 'active')
          .range(from, to)

        if (sort === 'newest') {
          query = query.order('created_at', { ascending: false })
        } else if (sort === 'priceLow') {
          query = query.order('price', { ascending: true })
        } else if (sort === 'priceHigh') {
          query = query.order('price', { ascending: false })
        } else if (sort === 'rated') {
          query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false })
        }

        if (filters.categories.length > 0) {
          query = query.in('category', filters.categories)
        }
        if (filters.priceRange[0] > 0) {
          query = query.gte('price', filters.priceRange[0])
        }
        if (filters.priceRange[1] < 5000) {
          query = query.lte('price', filters.priceRange[1])
        }
        if (sellerId) query = query.eq('seller_id', sellerId)

        if (searchTerm.trim()) {
          const q = searchTerm.trim().replace(/[%_]/g, '')
          query = query.or(
            `name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`,
          )
        }

        const { data, error, count } = await query
        if (error) throw error

        const productIds = (data ?? []).map((p: any) => p.id)
        let reviewsByProduct: Record<string, { total: number; count: number }> = {}
        if (productIds.length) {
          const { data: reviewRows } = await supabase
            .from('reviews')
            .select('product_id, rating')
            .in('product_id', productIds)
          reviewRows?.forEach(({ product_id, rating }: any) => {
            if (!reviewsByProduct[product_id])
              reviewsByProduct[product_id] = { total: 0, count: 0 }
            reviewsByProduct[product_id].total += rating
            reviewsByProduct[product_id].count += 1
          })
        }

        const sellerMap = await fetchSellers((data ?? []).map((p: any) => p.seller_id))

        const mapped: Product[] = (data ?? []).map((p: any) => {
          const stats = reviewsByProduct[p.id]
          return {
            ...p,
            rating: stats ? Number((stats.total / stats.count).toFixed(1)) : 0,
            review_count: stats?.count ?? 0,
            image: p.image_url ?? '',
            seller: p.seller_id ? sellerMap[p.seller_id] : null,
          }
        })

        setProducts(mapped)
        setTotalCount(count ?? 0)

        if (sellerId && !sellerPreview) {
          const list = Object.values(sellerMap)
          if (list[0]) setSellerPreview(list[0])
        }
      } catch (e: any) {
        setError(e.message ?? 'Failed to load products.')
      } finally {
        setLoading(false)
        setPageLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, filters, searchTerm, sellerId, sort],
  )

  useEffect(() => {
    fetchProducts(page)
  }, [page, fetchProducts])

  useEffect(() => {
    setPage(1)
  }, [filters, searchTerm, sort, sellerId])

  const filteredProducts = useMemo(() => {
    if (filters.minRating === 0) return products
    return products.filter((p) => (p.rating ?? 0) >= filters.minRating)
  }, [products, filters.minRating])

  const hasActive =
    searchTerm ||
    filters.categories.length > 0 ||
    filters.minRating > 0 ||
    filters.priceRange[0] !== 0 ||
    filters.priceRange[1] !== 5000

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar cartCount={cartCount} />

      <main className="flex-1">
        {/* Header */}
        <section className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-10">
            {sellerPreview ? (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-secondary overflow-hidden border border-border flex items-center justify-center text-base font-semibold text-muted-foreground">
                  {sellerPreview.avatar_url ? (
                    <img
                      src={sellerPreview.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (sellerPreview.shop_name || sellerPreview.username || 'S').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1 inline-flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5" /> Shop
                  </p>
                  <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                    {sellerPreview.shop_name || sellerPreview.username || 'Independent seller'}
                  </h1>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  Marketplace
                </p>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  {categoryParam ? `Shop ${categoryParam}` : 'All products'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalCount.toLocaleString()} products from independent sellers and curated brands.
                </p>
              </>
            )}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-8">
          {error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="flex items-start gap-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-xl px-6 py-4 max-w-md">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Failed to load products</p>
                  <p className="text-sm mt-1 opacity-90">{error}</p>
                </div>
              </div>
              <Button onClick={() => fetchProducts(page)} variant="outline">
                Try again
              </Button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              <aside
                className={`${showFilters ? 'block' : 'hidden'} lg:block lg:w-64 shrink-0`}
              >
                <ProductFilters
                  onFilterChange={(f) => setFilters(f)}
                  onSearchChange={(s) => setSearchTerm(s)}
                />
              </aside>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <button
                    onClick={() => setShowFilters((s) => !s)}
                    className="lg:hidden inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-card text-sm"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                  </button>
                  <p className="text-sm text-muted-foreground hidden lg:block">
                    {loading
                      ? 'Loading…'
                      : `Showing ${filteredProducts.length} of ${totalCount.toLocaleString()}`}
                  </p>
                  <div className="flex items-center gap-2 ml-auto">
                    <label className="text-xs text-muted-foreground hidden sm:inline">
                      Sort
                    </label>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as any)}
                      className="h-9 rounded-md border border-input bg-background px-2.5 text-sm"
                    >
                      <option value="newest">Newest</option>
                      <option value="rated">Featured</option>
                      <option value="priceLow">Price: low to high</option>
                      <option value="priceHigh">Price: high to low</option>
                    </select>
                  </div>
                </div>

                {hasActive && (
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    {searchTerm && (
                      <Chip onClear={() => setSearchTerm('')}>“{searchTerm}”</Chip>
                    )}
                    {filters.categories.map((c) => (
                      <Chip
                        key={c}
                        onClear={() =>
                          setFilters((f) => ({
                            ...f,
                            categories: f.categories.filter((x) => x !== c),
                          }))
                        }
                      >
                        {c}
                      </Chip>
                    ))}
                    {filters.minRating > 0 && (
                      <Chip onClear={() => setFilters((f) => ({ ...f, minRating: 0 }))}>
                        {filters.minRating}+ stars
                      </Chip>
                    )}
                  </div>
                )}

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading products...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-20 rounded-xl border border-dashed border-border bg-card">
                    <PackageSearch className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-semibold text-lg">No products found</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                      Try adjusting your filters or browse all products.
                    </p>
                    <Link href="/products">
                      <Button variant="outline" className="mt-4">Reset</Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    {pageLoading && (
                      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Updating…
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                      {filteredProducts.map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p as any}
                          onAddToCart={() => addToCart(p.id)}
                          onToggleWishlist={() => toggleWishlist(p.id)}
                          wishlisted={wishlistIds.has(p.id)}
                        />
                      ))}
                    </div>

                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6">
                      <p className="text-xs text-muted-foreground">
                        Page {page} of {totalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === 1 || pageLoading}
                          onClick={() => {
                            setPage((p) => Math.max(1, p - 1))
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                        </Button>
                        <Button
                          size="sm"
                          disabled={page >= totalPages || pageLoading}
                          onClick={() => {
                            setPage((p) => Math.min(totalPages, p + 1))
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                        >
                          Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}

function Chip({
  children,
  onClear,
}: {
  children: React.ReactNode
  onClear: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary text-foreground text-xs px-2.5 py-1">
      <span className="capitalize">{children}</span>
      <button onClick={onClear} className="text-muted-foreground hover:text-foreground">
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}
