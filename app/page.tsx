'use client'

import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { mockProducts, Product } from '@/lib/mockProducts'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  const [cartCount, setCartCount] = useState(0)
  const [cartItems, setCartItems] = useState<Product[]>([])

  const handleAddToCart = (product: Product) => {
    setCartItems([...cartItems, product])
    setCartCount(cartCount + 1)
  }

  // Featured products (first 6)
  const featuredProducts = mockProducts.slice(0, 6)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar cartCount={cartCount} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-primary to-primary/80 text-primary-foreground overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-white rounded-full mix-blend-screen" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full mix-blend-screen" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-32">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Discover Premium Products
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/90 mb-8">
                Explore our curated collection of electronics, fashion, shoes, and accessories. Quality you can trust, prices you'll love.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Shop Now
                  </Button>
                </Link>
                <a href="#featured">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
                    Explore Products
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section id="featured" className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Featured Products
            </h2>
            <p className="text-muted-foreground">
              Handpicked items we think you'll love
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          <div className="text-center">
            <Link href="/products">
              <Button size="lg" variant="outline">
                View All Products
              </Button>
            </Link>
          </div>
        </section>

        {/* Recommended Products Section (Placeholder) */}
        <section className="bg-secondary">
          <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Recommended For You
              </h2>
              <p className="text-muted-foreground mb-8">
                Coming soon: Personalized product recommendations based on your preferences and browsing history.
              </p>
              <div className="bg-white rounded-lg border border-border p-12">
                <p className="text-muted-foreground mb-4">
                  This feature will display personalized recommendations once we integrate our recommendation engine.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
