'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CartItem } from '@/components/cart-item'
import { mockProducts, Product } from '@/lib/mockProducts'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface CartItemData {
  product: Product
  quantity: number
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItemData[]>([
    { product: mockProducts[0], quantity: 1 },
    { product: mockProducts[2], quantity: 2 },
  ])

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId)
      return
    }
    setCartItems(
      cartItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }

  const handleRemoveItem = (productId: string) => {
    setCartItems(cartItems.filter(item => item.product.id !== productId))
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const shipping = subtotal > 50 ? 0 : 10
  const tax = subtotal * 0.1
  const total = subtotal + shipping + tax

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar cartCount={cartItems.length} />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-primary text-primary-foreground py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-2">Shopping Cart</h1>
            <p className="text-primary-foreground/90">
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
            </p>
          </div>
        </section>

        {/* Cart Content */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border border-border overflow-hidden">
                  {cartItems.map(({ product, quantity }) => (
                    <CartItem
                      key={product.id}
                      product={product}
                      quantity={quantity}
                      onQuantityChange={(newQty) =>
                        handleQuantityChange(product.id, newQty)
                      }
                      onRemove={() => handleRemoveItem(product.id)}
                    />
                  ))}
                </div>

                <div className="mt-6">
                  <Link href="/products">
                    <Button
                      variant="outline"
                      className="inline-flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-border p-6 h-fit">
                  <h2 className="text-xl font-bold text-foreground mb-6">
                    Order Summary
                  </h2>

                  <div className="space-y-3 mb-6 pb-6 border-b border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground font-medium">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-foreground font-medium">
                        {shipping === 0 ? (
                          <span className="text-primary">Free</span>
                        ) : (
                          `$${shipping.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="text-foreground font-medium">
                        ${tax.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-lg font-bold text-foreground mb-6">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>

                  {shipping === 0 ? (
                    <p className="text-xs text-primary font-semibold mb-4">
                      ✓ You qualified for free shipping!
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mb-4">
                      Add ${(50 - subtotal).toFixed(2)} more for free shipping
                    </p>
                  )}

                  <Button className="w-full mb-3" size="lg">
                    Proceed to Checkout
                  </Button>

                  <Button variant="outline" className="w-full" size="lg">
                    Continue Shopping
                  </Button>

                  {/* Trust Badges */}
                  <div className="mt-6 pt-6 border-t border-border space-y-2 text-xs text-muted-foreground">
                    <p>✓ Secure checkout</p>
                    <p>✓ 30-day returns</p>
                    <p>✓ Money-back guarantee</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Your cart is empty
              </h2>
              <p className="text-muted-foreground mb-8">
                Add some products to get started!
              </p>
              <Link href="/products">
                <Button size="lg">
                  Browse Products
                </Button>
              </Link>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
