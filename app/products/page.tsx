'use client'

import { useState, useMemo } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { ProductFilters, FilterState } from '@/components/product-filters'
import { mockProducts, Product } from '@/lib/mockProducts'
import { Button } from '@/components/ui/button'

export default function ProductsPage() {
  const [cartCount, setCartCount] = useState(0)
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 500],
    minRating: 0,
  })
  const [searchTerm, setSearchTerm] = useState('')

  const handleAddToCart = (product: Product) => {
    setCartCount(cartCount + 1)
  }

  // Filter products based on criteria
  const filteredProducts = useMemo(() => {
    return mockProducts.filter((product) => {
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
        return false
      }

      // Price range filter
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false
      }

      // Rating filter
      if (product.rating < filters.minRating) {
        return false
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.tags.some(tag => tag.toLowerCase().includes(searchLower))
        )
      }

      return true
    })
  }, [filters, searchTerm])

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
                      Showing {filteredProducts.length} of {mockProducts.length} products
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
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
        </section>
      </main>

      <Footer />
    </div>
  )
}
