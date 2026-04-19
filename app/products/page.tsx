'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { ProductFilters, FilterState } from '@/components/product-filters'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Product {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number | null
  image_url: string | null
  rating: number | null
  created_at: string | null
  tags: string[]
  // Aliases to satisfy ProductCard / ProductFilters that may use these keys
  image?: string
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [cartCount, setCartCount] = useState(0)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 500],
    minRating: 0,
  })
  const [searchTerm, setSearchTerm] = useState('')

  // ── Fetch products + tags ──────────────────────────────────────────────────
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

      const tagsByProduct: Record<string, string[]> = {}
      tagsData?.forEach(({ product_id, tag }: { product_id: string; tag: string }) => {
        if (!tagsByProduct[product_id]) tagsByProduct[product_id] = []
        tagsByProduct[product_id].push(tag)
      })

      setProducts(
        (productsData ?? []).map((p: any) => ({
          ...p,
          tags: tagsByProduct[p.id] ?? [],
          // Provide `image` alias for components that reference it
          image: p.image_url ?? '',
        }))
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

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(product.category ?? '')
      ) {
        return false
      }

      const price = product.price ?? 0
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
          product.tags.some((tag) => tag.toLowerCase().includes(q))
        )
      }

      return true
    })
  }, [filters, searchTerm, products])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar cartCount={cartCount} />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-primary text-primary-foreground py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-2">Our Products</h1>
            <p className="text-primary-foreground/90">
              Browse our complete collection of quality items
            </p>
          </div>
        </section>

        {/* Products Section */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="flex items-center gap-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-lg px-6 py-4 max-w-md w-full">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-medium">Failed to load products</p>
                  <p className="text-sm mt-0.5">{error}</p>
                </div>
              </div>
              <Button onClick={fetchProducts} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filters Sidebar */}
              <ProductFilters
                onFilterChange={setFilters}
                onSearchChange={setSearchTerm}
              />

              {/* Products Grid */}
              <div className="flex-1">
                {filteredProducts.length > 0 ? (
                  <>
                    <div className="mb-6">
                      <p className="text-sm text-muted-foreground">
                        Showing {filteredProducts.length} of {products.length} products
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product as any}
                          onAddToCart={() => setCartCount((c) => c + 1)}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No products found
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Try adjusting your filters or search terms
                    </p>
                    <Button
                      onClick={() => {
                        setFilters({
                          categories: [],
                          priceRange: [0, 500],
                          minRating: 0,
                        })
                        setSearchTerm('')
                      }}
                    >
                      Reset Filters
                    </Button>
                  </div>
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