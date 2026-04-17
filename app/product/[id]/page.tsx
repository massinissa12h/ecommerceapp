'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { mockProducts, Product } from '@/lib/mockProducts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, ArrowLeft } from 'lucide-react'

export default function ProductDetailsPage() {
  const params = useParams()
  const productId = params.id as string
  
  const product = mockProducts.find(p => p.id === productId)
  const [quantity, setQuantity] = useState(1)
  const [cartCount, setCartCount] = useState(0)
  const [isAdded, setIsAdded] = useState(false)

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar cartCount={cartCount} />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The product you're looking for doesn't exist.
            </p>
            <Link href="/products">
              <Button>Back to Products</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Get similar products from same category
  const similarProducts = mockProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 3)

  const handleAddToCart = () => {
    setCartCount(cartCount + quantity)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  const handleQuantityChange = (value: number) => {
    if (value >= 1 && value <= 10) {
      setQuantity(value)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar cartCount={cartCount} />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
        </div>

        {/* Product Details */}
        <section className="max-w-7xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="flex items-start">
              <div className="relative w-full aspect-square bg-secondary rounded-lg overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              {/* Category Badge */}
              <Badge className="w-fit mb-4 capitalize">
                {product.category}
              </Badge>

              {/* Title */}
              <h1 className="text-4xl font-bold text-foreground mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? 'fill-primary text-primary'
                          : 'text-border'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold text-foreground">
                  {product.rating}
                </span>
              </div>

              {/* Price */}
              <p className="text-4xl font-bold text-foreground mb-6">
                ${product.price.toFixed(2)}
              </p>

              {/* Description */}
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {product.description}
              </p>

              {/* Tags */}
              <div className="mb-8">
                <p className="text-sm font-semibold text-foreground mb-3">
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="capitalize">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-8">
                <p className="text-sm font-semibold text-foreground mb-3">
                  Quantity
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="w-10 h-10 rounded border border-border hover:bg-secondary transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="w-20 h-10 border border-border rounded text-center"
                    min="1"
                    max="10"
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="w-10 h-10 rounded border border-border hover:bg-secondary transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                size="lg"
                className="w-full mb-4"
              >
                {isAdded ? 'Added to Cart!' : 'Add to Cart'}
              </Button>

              {/* Additional Info */}
              <div className="bg-secondary rounded-lg p-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Free Shipping</span>
                  <span className="font-semibold">On orders over $50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">30-Day Returns</span>
                  <span className="font-semibold">Easy returns</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Warranty</span>
                  <span className="font-semibold">1 year</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <section className="bg-secondary">
            <div className="max-w-7xl mx-auto px-4 py-16">
              <h2 className="text-3xl font-bold text-foreground mb-8">
                Similar Products
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {similarProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={() => setCartCount(cartCount + 1)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
