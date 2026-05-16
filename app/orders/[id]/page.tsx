'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/format'
import {
  Loader2,
  ShoppingBag,
  Truck,
  CheckCircle2,
  XCircle,
  PackageCheck,
  ArrowLeft,
  Store,
  MapPin,
  Phone,
  User,
  Wallet,
  Receipt,
  Copy,
  Clock,
} from 'lucide-react'
import { useCart } from '@/app/hooks/useCart'

type FulfillmentStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

type OrderItem = {
  id: string
  order_id: string
  product_id: string | null
  seller_id: string | null
  quantity: number
  price: number
  fulfillment_status: FulfillmentStatus
  tracking_number: string | null
  shipped_at: string | null
  product: {
    id: string
    name: string
    image_url: string | null
    category: string | null
  } | null
  seller_name: string
  seller_slug: string | null
}

type Order = {
  id: string
  user_id: string | null
  total_price: number | null
  subtotal: number | null
  shipping_fee: number | null
  tax: number | null
  status: string | null
  payment_method: string | null
  shipping_address: any
  notes: string | null
  created_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  items: OrderItem[]
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { cartCount } = useCart()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) {
        router.replace(`/login?next=/orders/${params.id}`)
        return
      }

      const { data: orderRow } = await supabase
        .from('orders')
        .select('*')
        .eq('id', params.id)
        .maybeSingle()

      if (!orderRow) {
        if (!cancelled) {
          setNotFound(true)
          setLoading(false)
        }
        return
      }

      const { data: items } = await supabase
        .from('order_items')
        .select(
          `id, order_id, product_id, seller_id, quantity, price,
           fulfillment_status, tracking_number, shipped_at,
           product:products ( id, name, image_url, category )`,
        )
        .eq('order_id', orderRow.id)

      const sellerIds = Array.from(
        new Set((items ?? []).map((i: any) => i.seller_id).filter(Boolean) as string[]),
      )
      const sellerMap = new Map<string, { name: string; slug: string | null }>()
      if (sellerIds.length) {
        const [{ data: us }, { data: ps }] = await Promise.all([
          supabase.from('users').select('id, username').in('id', sellerIds),
          supabase.from('profiles').select('id, shop_name, shop_slug').in('id', sellerIds),
        ])
        ;(us ?? []).forEach((u: any) =>
          sellerMap.set(u.id, { name: u.username ?? 'Seller', slug: null }),
        )
        ;(ps ?? []).forEach((p: any) => {
          const cur = sellerMap.get(p.id) ?? { name: 'Seller', slug: null }
          if (p.shop_name) cur.name = p.shop_name
          cur.slug = p.shop_slug ?? null
          sellerMap.set(p.id, cur)
        })
      }

      const enriched: OrderItem[] = ((items ?? []) as any[]).map((i) => {
        const meta = i.seller_id ? sellerMap.get(i.seller_id) : null
        return {
          ...i,
          seller_name: meta?.name ?? (i.seller_id ? 'Seller' : 'Souqly'),
          seller_slug: meta?.slug ?? null,
        }
      })

      if (cancelled) return
      setOrder({ ...orderRow, items: enriched } as Order)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [params.id, router])

  const copyOrderId = () => {
    if (!order) return
    navigator.clipboard?.writeText(order.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
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

  if (notFound || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar cartCount={cartCount} />
        <main className="flex-1 max-w-md mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-semibold">Order not found</h1>
          <p className="text-sm text-muted-foreground mt-1">
            We couldn&apos;t find an order with that ID.
          </p>
          <Link href="/orders" className="inline-flex items-center mt-6 text-sm hover:text-brand">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to orders
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const address = order.shipping_address ?? {}
  const placedAt = order.created_at ? new Date(order.created_at) : null
  const placedAtStr = placedAt
    ? placedAt.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'
  const itemCount = order.items.reduce((s, i) => s + (i.quantity ?? 0), 0)

  // Group items by seller for clear display
  const groups = order.items.reduce<Record<string, OrderItem[]>>((acc, i) => {
    const key = i.seller_id ?? 'platform'
    acc[key] = acc[key] ?? []
    acc[key].push(i)
    return acc
  }, {})

  // Derive the overall order step from the items
  const orderStep = deriveOrderStep(order)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar cartCount={cartCount} />

      <main className="flex-1">
        {/* HEADER */}
        <section className="border-b border-border bg-card">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <Link
              href="/orders"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center mb-3"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              All orders
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  Order
                </p>
                <h1 className="text-3xl font-semibold tracking-tight inline-flex items-center gap-2">
                  #{order.id.slice(0, 8)}
                  <button
                    onClick={copyOrderId}
                    title="Copy full order ID"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {copied && <span className="text-xs text-success">Copied</span>}
                </h1>
                <p className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Placed {placedAtStr} · {itemCount} item{itemCount === 1 ? '' : 's'} ·{' '}
                  {Object.keys(groups).length} seller
                  {Object.keys(groups).length === 1 ? '' : 's'}
                </p>
              </div>
              <OrderStatusPill step={orderStep} />
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-6 min-w-0">
            {/* TIMELINE */}
            <OrderTimeline step={orderStep} />

            {/* PER-SELLER ITEM GROUPS */}
            {Object.entries(groups).map(([sellerKey, items]) => {
              const first = items[0]
              const sellerHref = first.seller_slug
                ? `/shop/${first.seller_slug}`
                : first.seller_id
                  ? `/u/${first.seller_id}`
                  : null
              return (
                <div
                  key={sellerKey}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <div className="px-5 py-3 border-b border-border bg-secondary/40 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Store className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{first.seller_name}</span>
                      {sellerKey === 'platform' && (
                        <span className="text-[10px] uppercase tracking-wider bg-brand/10 text-brand px-1.5 py-0.5 rounded font-semibold">
                          Souqly
                        </span>
                      )}
                    </div>
                    {sellerHref && (
                      <Link
                        href={sellerHref}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Visit shop →
                      </Link>
                    )}
                  </div>
                  <ul className="divide-y divide-border">
                    {items.map((i) => (
                      <li
                        key={i.id}
                        className="p-4 grid grid-cols-[72px_1fr_auto] gap-4 items-start"
                      >
                        <div className="w-[72px] h-[72px] rounded-md bg-secondary overflow-hidden border border-border flex items-center justify-center text-[10px] text-muted-foreground">
                          {i.product?.image_url ? (
                            <img
                              src={i.product.image_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            'No image'
                          )}
                        </div>
                        <div className="min-w-0">
                          {i.product ? (
                            <Link
                              href={`/product/${i.product.id}`}
                              className="font-medium hover:text-brand truncate inline-block max-w-full"
                            >
                              {i.product.name}
                            </Link>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Deleted product
                            </p>
                          )}
                          {i.product?.category && (
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
                              {i.product.category}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            qty {i.quantity} · {formatPrice(i.price)} each
                          </p>
                          {i.tracking_number && (
                            <p className="mt-2 text-xs flex items-center gap-1.5">
                              <Truck className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Tracking</span>
                              <span className="font-mono font-medium">
                                {i.tracking_number}
                              </span>
                            </p>
                          )}
                          {i.shipped_at && (
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Shipped {new Date(i.shipped_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatPrice(i.price * i.quantity)}
                          </p>
                          <div className="mt-2">
                            <FulfillmentBadge status={i.fulfillment_status} />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
            {/* Cost breakdown */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 inline-flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" />
                Cost breakdown
              </h3>
              <div className="space-y-2 text-sm">
                <Row label="Subtotal" value={formatPrice(order.subtotal ?? 0)} />
                <Row
                  label="Shipping"
                  value={
                    Number(order.shipping_fee) === 0
                      ? 'Free'
                      : formatPrice(order.shipping_fee ?? 0)
                  }
                />
                <Row label="Tax" value={formatPrice(order.tax ?? 0)} />
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="text-lg font-semibold">
                  {formatPrice(order.total_price ?? 0)}
                </span>
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 inline-flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                Payment
              </h3>
              <p className="text-sm">
                {paymentMethodLabel(order.payment_method)}
              </p>
              {order.payment_method === 'cod' && (
                <p className="text-xs text-muted-foreground mt-1">
                  You&apos;ll pay the courier in cash when your order arrives.
                </p>
              )}
            </div>

            {/* Shipping address */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Shipping address
              </h3>
              {address.first_name || address.last_name ? (
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  {[address.first_name, address.last_name].filter(Boolean).join(' ')}
                </p>
              ) : null}
              <p className="text-sm mt-1.5 leading-relaxed">
                {address.street_address}
                {address.street_address && <br />}
                {[address.city, address.postal_code].filter(Boolean).join(', ')}
                {address.city || address.postal_code ? <br /> : null}
                {address.country}
              </p>
              {address.phone && (
                <p className="text-sm mt-2 inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  {address.phone}
                </p>
              )}
            </div>

            {/* Notes / Help */}
            <div className="rounded-xl border border-border bg-card p-5 text-sm">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Need help?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Reach out to each seller directly from their shop page if
                you have questions about a specific item.
              </p>
            </div>
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  )
}

type Step = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

function deriveOrderStep(order: Order): Step {
  if (order.status === 'cancelled' || order.cancelled_at) return 'cancelled'
  const fulfillment = order.items.map((i) => i.fulfillment_status)
  if (fulfillment.length === 0) return 'pending'
  if (fulfillment.every((s) => s === 'delivered')) return 'delivered'
  if (fulfillment.some((s) => s === 'shipped' || s === 'delivered'))
    return 'shipped'
  if (fulfillment.some((s) => s === 'processing')) return 'confirmed'
  return 'pending'
}

function paymentMethodLabel(m: string | null): string {
  if (m === 'cod') return 'Cash on delivery'
  if (m === 'card') return 'Card'
  if (m === 'bank_transfer') return 'Bank transfer'
  return '—'
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function OrderStatusPill({ step }: { step: Step }) {
  const cfg: Record<Step, { label: string; cls: string }> = {
    pending: {
      label: 'Awaiting confirmation',
      cls: 'bg-warning/10 text-warning',
    },
    confirmed: {
      label: 'Being prepared',
      cls: 'bg-brand/10 text-brand',
    },
    shipped: { label: 'On its way', cls: 'bg-brand/10 text-brand' },
    delivered: {
      label: 'Delivered',
      cls: 'bg-success/10 text-success',
    },
    cancelled: {
      label: 'Cancelled',
      cls: 'bg-destructive/10 text-destructive',
    },
  }
  const c = cfg[step]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${c.cls}`}
    >
      <span className="relative flex w-1.5 h-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 animate-ping" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
      </span>
      {c.label}
    </span>
  )
}

function OrderTimeline({ step }: { step: Step }) {
  if (step === 'cancelled') {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
        <p className="font-medium text-destructive inline-flex items-center gap-1.5">
          <XCircle className="w-4 h-4" />
          Order cancelled
        </p>
        <p className="text-muted-foreground mt-1">
          This order was cancelled. If you have questions, contact the seller
          from the items below.
        </p>
      </div>
    )
  }
  const steps: { key: Exclude<Step, 'cancelled'>; label: string; icon: any }[] = [
    { key: 'pending', label: 'Placed', icon: ShoppingBag },
    { key: 'confirmed', label: 'Confirmed', icon: PackageCheck },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ]
  const idx = steps.findIndex((s) => s.key === step)
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        {steps.map((s, i) => {
          const reached = i <= idx
          const isCurrent = i === idx
          return (
            <div key={s.key} className="flex-1 flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    reached
                      ? 'bg-foreground text-background'
                      : 'bg-secondary text-muted-foreground'
                  } ${isCurrent ? 'ring-2 ring-brand ring-offset-2 ring-offset-card' : ''}`}
                >
                  <s.icon className="w-4 h-4" />
                </div>
                <p
                  className={`text-[11px] mt-1.5 font-medium ${
                    reached ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {s.label}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-px mx-1 ${
                    i < idx ? 'bg-foreground' : 'bg-border'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FulfillmentBadge({ status }: { status: FulfillmentStatus }) {
  const cfg: Record<FulfillmentStatus, { label: string; icon: any; cls: string }> = {
    pending: { label: 'Pending', icon: ShoppingBag, cls: 'bg-warning/10 text-warning' },
    processing: { label: 'Processing', icon: PackageCheck, cls: 'bg-brand/10 text-brand' },
    shipped: { label: 'Shipped', icon: Truck, cls: 'bg-brand/10 text-brand' },
    delivered: {
      label: 'Delivered',
      icon: CheckCircle2,
      cls: 'bg-success/10 text-success',
    },
    cancelled: {
      label: 'Cancelled',
      icon: XCircle,
      cls: 'bg-destructive/10 text-destructive',
    },
  }
  const c = cfg[status]
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ${c.cls}`}
    >
      <c.icon className="w-3 h-3" />
      {c.label}
    </span>
  )
}
