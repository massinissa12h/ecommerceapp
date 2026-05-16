'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Store,
} from 'lucide-react'
import { useCart } from '@/app/hooks/useCart'
import { formatPrice } from '@/lib/format'

type CartLine = {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number | null
    image_url: string | null
    stock: number
    seller_id: string | null
  }
  seller_name?: string
}

// All amounts in DZD. Free domestic shipping over 5,000 DA, otherwise 500 DA.
const SHIPPING_THRESHOLD = 5000
const SHIPPING_COST = 500
const TAX_RATE = 0.08

export default function CheckoutPage() {
  const router = useRouter()
  const { cartCount } = useCart()
  const [uid, setUid] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lines, setLines] = useState<CartLine[]>([])

  const [address, setAddress] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    street_address: '',
    city: '',
    postal_code: '',
    country: '',
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: session } = await supabase.auth.getSession()
      const user = session.session?.user
      if (!user) {
        router.replace('/login?next=/checkout')
        return
      }
      setUid(user.id)

      const [{ data: cartData }, { data: profile }] = await Promise.all([
        supabase
          .from('cart')
          .select(
            `id, quantity,
             product:products ( id, name, price, image_url, stock, seller_id )`,
          )
          .eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      ])

      if (cancelled) return

      const items = (cartData ?? []) as unknown as CartLine[]
      // Hydrate seller display names
      const sellerIds = Array.from(
        new Set(items.map((l) => l.product.seller_id).filter(Boolean) as string[]),
      )
      if (sellerIds.length) {
        const [{ data: us }, { data: ps }] = await Promise.all([
          supabase.from('users').select('id, username').in('id', sellerIds),
          supabase.from('profiles').select('id, shop_name').in('id', sellerIds),
        ])
        const nameMap = new Map<string, string>()
        ;(us ?? []).forEach((u: any) => nameMap.set(u.id, u.username ?? 'Seller'))
        ;(ps ?? []).forEach((p: any) => {
          if (p.shop_name) nameMap.set(p.id, p.shop_name)
        })
        items.forEach((l) => {
          if (l.product.seller_id) {
            l.seller_name = nameMap.get(l.product.seller_id) || 'Seller'
          } else {
            l.seller_name = 'Souqly'
          }
        })
      } else {
        items.forEach((l) => (l.seller_name = 'Souqly'))
      }
      setLines(items)

      if (profile) {
        setAddress({
          first_name: profile.first_name ?? '',
          last_name: profile.last_name ?? '',
          phone: profile.phone ?? '',
          street_address: profile.street_address ?? '',
          city: profile.city ?? '',
          postal_code: profile.postal_code ?? '',
          country: profile.country ?? '',
        })
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  const subtotal = lines.reduce(
    (s, l) => s + (Number(l.product.price) || 0) * l.quantity,
    0,
  )
  const shipping =
    subtotal === 0 ? 0 : subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const tax = subtotal * TAX_RATE
  const total = subtotal + shipping + tax

  // Group lines by seller for display
  const groups = lines.reduce<Record<string, CartLine[]>>((acc, l) => {
    const key = l.product.seller_id ?? 'platform'
    acc[key] = acc[key] ?? []
    acc[key].push(l)
    return acc
  }, {})

  const placeOrder = async () => {
    if (!uid) return
    if (lines.length === 0) {
      setError('Your cart is empty.')
      return
    }
    if (
      !address.first_name ||
      !address.street_address ||
      !address.city ||
      !address.country
    ) {
      setError('Please fill in your shipping address.')
      return
    }
    setPlacing(true)
    setError(null)

    try {
      // Save profile address (best-effort) so it pre-fills next time
      await supabase.from('profiles').upsert({ id: uid, ...address }, { onConflict: 'id' })

      // Create the order with a frozen snapshot of address + cost breakdown.
      // Status starts as "pending" — for COD that means the seller still has
      // to confirm and ship before the courier collects payment.
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: uid,
          total_price: total,
          subtotal,
          shipping_fee: shipping,
          tax,
          status: 'pending',
          payment_method: 'cod',
          shipping_address: address,
        })
        .select()
        .single()
      if (orderErr || !order) throw orderErr

      // Build order_items with seller snapshot
      const itemsPayload = lines.map((l) => ({
        order_id: order.id,
        product_id: l.product.id,
        seller_id: l.product.seller_id,
        quantity: l.quantity,
        price: l.product.price ?? 0,
        fulfillment_status: 'pending' as const,
      }))
      const { error: itemsErr } = await supabase.from('order_items').insert(itemsPayload)
      if (itemsErr) throw itemsErr

      // Stock decrement is handled by a server-side trigger on order_items
      // insert (decrement_stock_on_order_item), so we don't need the client
      // to touch other sellers' products.

      // Clear cart
      await supabase.from('cart').delete().eq('user_id', uid)

      setSuccess(order.id)
    } catch (e: any) {
      setError(e.message ?? 'Checkout failed.')
    } finally {
      setPlacing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar cartCount={cartCount} />
        <div className="flex-1 grid place-items-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar cartCount={0} />
        <main className="flex-1 max-w-xl mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Order confirmed
          </h1>
          <p className="text-muted-foreground mb-2">
            Thanks for your order. We&apos;ve notified the sellers.
          </p>
          <p className="text-xs text-muted-foreground">
            Reference #{success.slice(0, 8)}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link href={`/orders/${success}`}>
              <Button>View order details</Button>
            </Link>
            <Link href="/products">
              <Button variant="outline">Keep shopping</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar cartCount={cartCount} />

      <main className="flex-1">
        <section className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <Link href="/cart" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center mb-2">
              <ArrowLeft className="w-3 h-3 mr-1" />
              Back to cart
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Confirm your shipping address and place your order.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-10 grid lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold mb-4">Shipping address</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="First name" required>
                  <Input
                    value={address.first_name}
                    onChange={(e) =>
                      setAddress({ ...address, first_name: e.target.value })
                    }
                  />
                </Field>
                <Field label="Last name">
                  <Input
                    value={address.last_name}
                    onChange={(e) =>
                      setAddress({ ...address, last_name: e.target.value })
                    }
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={address.phone}
                    onChange={(e) =>
                      setAddress({ ...address, phone: e.target.value })
                    }
                  />
                </Field>
                <Field label="Country" required>
                  <Input
                    value={address.country}
                    onChange={(e) =>
                      setAddress({ ...address, country: e.target.value })
                    }
                  />
                </Field>
                <Field label="Street address" required className="sm:col-span-2">
                  <Input
                    value={address.street_address}
                    onChange={(e) =>
                      setAddress({ ...address, street_address: e.target.value })
                    }
                  />
                </Field>
                <Field label="City" required>
                  <Input
                    value={address.city}
                    onChange={(e) =>
                      setAddress({ ...address, city: e.target.value })
                    }
                  />
                </Field>
                <Field label="Postal code">
                  <Input
                    value={address.postal_code}
                    onChange={(e) =>
                      setAddress({ ...address, postal_code: e.target.value })
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold">Review your order</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Shipped separately by each seller.
                </p>
              </div>
              {Object.entries(groups).map(([sellerId, items]) => (
                <div key={sellerId} className="border-b last:border-b-0 border-border">
                  <div className="px-5 py-3 bg-secondary/40 flex items-center gap-2 text-xs text-muted-foreground">
                    <Store className="w-3.5 h-3.5" />
                    {items[0].seller_name ?? 'Seller'}
                  </div>
                  <ul className="divide-y divide-border">
                    {items.map((l) => (
                      <li key={l.id} className="flex gap-3 p-4">
                        <div className="w-14 h-14 rounded-md bg-secondary overflow-hidden border border-border flex items-center justify-center text-[10px] text-muted-foreground">
                          {l.product.image_url ? (
                            <img src={l.product.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            'No img'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {l.product.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            qty {l.quantity} · {formatPrice(l.product.price ?? 0)}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          {formatPrice(Number(l.product.price ?? 0) * l.quantity)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold mb-4">Order summary</h2>
              <div className="space-y-2 text-sm">
                <Row label="Subtotal" value={formatPrice(subtotal)} />
                <Row
                  label="Shipping"
                  value={
                    shipping === 0 && subtotal > 0
                      ? 'Free'
                      : formatPrice(shipping)
                  }
                />
                <Row label="Tax (8%)" value={formatPrice(tax)} />
              </div>
              <div className="border-t border-border mt-4 pt-4 flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="text-xl font-semibold">{formatPrice(total)}</span>
              </div>
              {error && (
                <div className="mt-4 rounded-md bg-destructive/10 text-destructive text-xs px-3 py-2">
                  {error}
                </div>
              )}
              <Button
                size="lg"
                className="w-full mt-5"
                onClick={placeOrder}
                disabled={placing || lines.length === 0}
              >
                {placing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Placing order...
                  </>
                ) : (
                  <>
                    Place order
                    <span className="ml-2 font-medium">{formatPrice(total)}</span>
                  </>
                )}
              </Button>
              <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5 mt-3 justify-center w-full">
                <ShieldCheck className="w-3 h-3" />
                Cash on delivery — pay the courier when your order arrives
              </p>
            </div>
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <label className="text-xs font-medium text-foreground/80 flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  )
}
