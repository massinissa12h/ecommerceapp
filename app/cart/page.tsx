'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  PackageCheck,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    description: string | null
    price: number | null
    image_url: string | null
    category: string | null
  }
}

const SHIPPING_THRESHOLD = 100
const SHIPPING_COST = 9.99
const TAX_RATE = 0.08

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

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user.id ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const fetchCart = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('cart')
        .select(`
          id,
          quantity,
          product:products (
            id,
            name,
            description,
            price,
            image_url,
            category
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCartItems((data ?? []) as unknown as CartItem[])
    } catch (err: any) {
      setError(err.message ?? 'Failed to load cart.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const removeItem = async (cartId: string) => {
    setUpdatingId(cartId)

    const { error } = await supabase.from('cart').delete().eq('id', cartId)

    if (!error) {
      setCartItems((prev) => prev.filter((item) => item.id !== cartId))
    }

    setUpdatingId(null)
  }

  const updateQuantity = async (
    cartId: string,
    delta: number,
    currentQty: number
  ) => {
    const newQty = currentQty + delta

    setUpdatingId(cartId)

    if (newQty <= 0) {
      await removeItem(cartId)
      setUpdatingId(null)
      return
    }

    const { error } = await supabase
      .from('cart')
      .update({ quantity: newQty })
      .eq('id', cartId)

    if (!error) {
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === cartId ? { ...item, quantity: newQty } : item
        )
      )
    }

    setUpdatingId(null)
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.product.price ?? 0) * item.quantity,
    0
  )

  const shipping =
    subtotal === 0 ? 0 : subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST

  const tax = subtotal * TAX_RATE
  const total = subtotal + shipping + tax
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const freeShippingProgress =
    subtotal >= SHIPPING_THRESHOLD
      ? 100
      : Math.min((subtotal / SHIPPING_THRESHOLD) * 100, 100)

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      <Navbar cartCount={totalItems} />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 left-10 h-52 w-52 rounded-full bg-white/60 blur-3xl" />
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="relative max-w-7xl mx-auto px-4 py-16"
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-2 text-sm mb-5 backdrop-blur"
            >
              <Sparkles className="w-4 h-4" />
              Almost there
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-6xl font-bold tracking-tight mb-4"
            >
              Shopping Cart
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-primary-foreground/90 text-lg max-w-2xl"
            >
              {totalItems === 0
                ? 'Your cart is empty. Start adding products you love.'
                : `${totalItems} item${totalItems !== 1 ? 's' : ''} waiting for checkout.`}
            </motion.p>
          </motion.div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-12">
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
                  Loading your cart...
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
                    <p className="font-semibold">Failed to load cart</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>

                <Button onClick={fetchCart} variant="outline">
                  Try Again
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial="hidden"
                animate="visible"
                variants={stagger}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                <div className="lg:col-span-2">
                  <motion.div
                    variants={fadeUp}
                    className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">
                        Your Items
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Review your products before checkout.
                      </p>
                    </div>

                    <Link href="/products">
                      <Button
                        variant="outline"
                        className="inline-flex items-center gap-2 rounded-xl"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Continue Shopping
                      </Button>
                    </Link>
                  </motion.div>

                  {cartItems.length === 0 ? (
                    <motion.div
                      variants={fadeUp}
                      className="bg-white rounded-3xl border border-dashed border-border p-12 text-center shadow-sm"
                    >
                      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <ShoppingCart className="w-10 h-10" />
                      </div>

                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        Your cart is empty
                      </h3>

                      <p className="text-muted-foreground mb-7">
                        Add some products and come back when you are ready.
                      </p>

                      <Link href="/products">
                        <Button size="lg" className="rounded-xl">
                          Browse Products
                        </Button>
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.div variants={stagger} className="space-y-4">
                      <AnimatePresence>
                        {cartItems.map((item) => (
                          <motion.div
                            layout
                            key={item.id}
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, x: -40, scale: 0.96 }}
                            whileHover={{ y: -3 }}
                            className="group bg-white rounded-3xl border border-border p-4 md:p-5 flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow"
                          >
                            <Link
                              href={`/product/${item.product.id}`}
                              className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-secondary shrink-0 border border-border"
                            >
                              {item.product.image_url ? (
                                <img
                                  src={item.product.image_url}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                  No image
                                </div>
                              )}
                            </Link>

                            <div className="flex-1 min-w-0">
                              {item.product.category && (
                                <p className="text-xs text-primary font-medium capitalize mb-1">
                                  {item.product.category}
                                </p>
                              )}

                              <Link href={`/product/${item.product.id}`}>
                                <p className="font-bold text-foreground truncate hover:text-primary transition-colors">
                                  {item.product.name}
                                </p>
                              </Link>

                              {item.product.description && (
                                <p className="hidden sm:block text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {item.product.description}
                                </p>
                              )}

                              <div className="mt-4">
                                <p className="text-primary font-bold text-xl">
                                  ${((item.product.price ?? 0) * item.quantity).toFixed(2)}
                                </p>

                                {item.quantity > 1 && (
                                  <p className="text-xs text-muted-foreground">
                                    ${(item.product.price ?? 0).toFixed(2)} each
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-4 shrink-0">
                              <button
                                onClick={() => removeItem(item.id)}
                                disabled={updatingId === item.id}
                                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                              <div className="flex items-center gap-1 border border-border rounded-full bg-background p-1">
                                <button
                                  onClick={() =>
                                    updateQuantity(item.id, -1, item.quantity)
                                  }
                                  disabled={updatingId === item.id}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors rounded-full disabled:opacity-50"
                                >
                                  {updatingId === item.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Minus className="w-3 h-3" />
                                  )}
                                </button>

                                <span className="w-8 text-center text-sm font-semibold">
                                  {item.quantity}
                                </span>

                                <button
                                  onClick={() =>
                                    updateQuantity(item.id, +1, item.quantity)
                                  }
                                  disabled={updatingId === item.id}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors rounded-full disabled:opacity-50"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>

                <motion.div variants={fadeUp} className="lg:col-span-1">
                  <div className="bg-white/90 backdrop-blur rounded-3xl border border-border p-6 h-fit sticky top-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-foreground">
                        Order Summary
                      </h2>

                      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <PackageCheck className="w-5 h-5" />
                      </div>
                    </div>

                    {subtotal > 0 && (
                      <div className="mb-6 rounded-2xl bg-secondary p-4">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-medium text-foreground">
                            Free shipping progress
                          </span>
                          <span className="text-muted-foreground">
                            {subtotal >= SHIPPING_THRESHOLD
                              ? 'Unlocked'
                              : `$${(SHIPPING_THRESHOLD - subtotal).toFixed(2)} left`}
                          </span>
                        </div>

                        <div className="h-2 rounded-full bg-background overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${freeShippingProgress}%` }}
                            transition={{ duration: 0.6 }}
                            className="h-full rounded-full bg-primary"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 mb-6 pb-6 border-b border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})
                        </span>
                        <span className="font-medium">${subtotal.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="font-medium">
                          {shipping === 0 && subtotal > 0 ? (
                            <span className="text-green-600">Free</span>
                          ) : (
                            `$${shipping.toFixed(2)}`
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax (8%)</span>
                        <span className="font-medium">${tax.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between text-2xl font-bold text-foreground mb-6">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>

                    {cartItems.length === 0 && (
                      <p className="text-xs text-muted-foreground mb-4">
                        Add items to your cart to proceed.
                      </p>
                    )}

                    <Button
                      className="w-full mb-3 rounded-xl"
                      size="lg"
                      disabled={cartItems.length === 0}
                    >
                      Proceed to Checkout
                    </Button>

                    <Link href="/products">
                      <Button
                        variant="outline"
                        className="w-full rounded-xl"
                        size="lg"
                      >
                        Continue Shopping
                      </Button>
                    </Link>

                    <div className="mt-6 pt-6 border-t border-border grid gap-3 text-xs text-muted-foreground">
                      {[
                        [ShieldCheck, 'Secure checkout'],
                        [RotateCcw, '30-day returns'],
                        [Truck, 'Fast shipping options'],
                      ].map(([Icon, text]: any) => (
                        <div key={text} className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary" />
                          <span>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <Footer />
    </div>
  )
}