'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  ShoppingBag,
  Truck,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Store,
  ArrowRight,
  Wallet,
  Receipt,
} from 'lucide-react'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '@/lib/format'

type FulfillmentStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

type OrderItem = {
  id: string
  quantity: number
  price: number
  fulfillment_status: FulfillmentStatus
  tracking_number: string | null
  product: { id: string; name: string; image_url: string | null } | null
  seller_name: string
}

type Order = {
  id: string
  total_price: number | null
  subtotal: number | null
  shipping_fee: number | null
  status: string | null
  payment_method: string | null
  created_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  items: OrderItem[]
}

type FilterTab = 'all' | 'active' | 'delivered' | 'cancelled'

export default function BuyerOrdersPage() {
  const router = useRouter()
  const { cartCount } = useCart()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) {
        router.replace('/login?next=/orders')
        return
      }

      const { data: orderRows } = await supabase
        .from('orders')
        .select(
          'id, total_price, subtotal, shipping_fee, status, payment_method, created_at, delivered_at, cancelled_at',
        )
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      const orderIds = (orderRows ?? []).map((o: any) => o.id)
      let items: any[] = []
      if (orderIds.length) {
        const { data: itemRows } = await supabase
          .from('order_items')
          .select(
            `id, order_id, quantity, price, fulfillment_status, seller_id, tracking_number,
             product:products ( id, name, image_url )`,
          )
          .in('order_id', orderIds)
        items = itemRows ?? []
      }

      const sellerIds = Array.from(
        new Set(items.map((i) => i.seller_id).filter(Boolean) as string[]),
      )
      const nameMap = new Map<string, string>()
      if (sellerIds.length) {
        const [{ data: us }, { data: ps }] = await Promise.all([
          supabase.from('users').select('id, username').in('id', sellerIds),
          supabase.from('shops').select('id, name').in('id', sellerIds),
        ])
        ;(us ?? []).forEach((u: any) => nameMap.set(u.id, u.username ?? 'Seller'))
        ;(ps ?? []).forEach((p: any) => {
          if (p.name) nameMap.set(p.id, p.name)
        })
      }

      const grouped: Order[] = (orderRows ?? []).map((o: any) => ({
        ...o,
        items: items
          .filter((i) => i.order_id === o.id)
          .map((i) => ({
            ...i,
            seller_name: i.seller_id ? nameMap.get(i.seller_id) ?? 'Seller' : 'Souqly',
          })),
      }))

      if (!cancelled) {
        setOrders(grouped)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  const filtered = orders.filter((o) => {
    const step = deriveStep(o)
    if (filter === 'all') return true
    if (filter === 'cancelled') return step === 'cancelled'
    if (filter === 'delivered') return step === 'delivered'
    if (filter === 'active') return step !== 'delivered' && step !== 'cancelled'
    return true
  })

  const counts = {
    all: orders.length,
    active: orders.filter((o) => {
      const s = deriveStep(o)
      return s !== 'delivered' && s !== 'cancelled'
    }).length,
    delivered: orders.filter((o) => deriveStep(o) === 'delivered').length,
    cancelled: orders.filter((o) => deriveStep(o) === 'cancelled').length,
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar cartCount={cartCount} />

      <main className="flex-1">
        <section className="border-b border-border bg-card">
          <div className="max-w-5xl mx-auto px-4 py-10">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Account
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Your orders</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track everything you&apos;ve purchased on Souqly.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-6 rounded-xl border border-border bg-card p-2 flex flex-wrap gap-1 w-fit">
            <TabBtn active={filter === 'all'} onClick={() => setFilter('all')}>
              All ({counts.all})
            </TabBtn>
            <TabBtn active={filter === 'active'} onClick={() => setFilter('active')}>
              In progress ({counts.active})
            </TabBtn>
            <TabBtn
              active={filter === 'delivered'}
              onClick={() => setFilter('delivered')}
            >
              Delivered ({counts.delivered})
            </TabBtn>
            <TabBtn
              active={filter === 'cancelled'}
              onClick={() => setFilter('cancelled')}
            >
              Cancelled ({counts.cancelled})
            </TabBtn>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 rounded-xl border border-dashed border-border bg-card">
              <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <h2 className="font-semibold text-lg">
                {orders.length === 0 ? 'No orders yet' : 'Nothing here'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {orders.length === 0
                  ? 'Once you buy something, your order history shows up here.'
                  : 'No orders match this filter.'}
              </p>
              {orders.length === 0 && (
                <Link href="/products">
                  <Button className="mt-5">Start shopping</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}

type Step = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

function deriveStep(order: Order): Step {
  if (order.status === 'cancelled' || order.cancelled_at) return 'cancelled'
  const fulfillment = order.items.map((i) => i.fulfillment_status)
  if (fulfillment.length === 0) return 'pending'
  if (fulfillment.every((s) => s === 'delivered')) return 'delivered'
  if (fulfillment.some((s) => s === 'shipped' || s === 'delivered'))
    return 'shipped'
  if (fulfillment.some((s) => s === 'processing')) return 'confirmed'
  return 'pending'
}

function OrderCard({ order }: { order: Order }) {
  const step = deriveStep(order)
  const itemCount = order.items.reduce((s, i) => s + (i.quantity ?? 0), 0)
  const sellerCount = new Set(order.items.map((i) => i.seller_name)).size
  const placed = order.created_at ? new Date(order.created_at) : null
  const placedStr = placed
    ? placed.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—'

  // Preview up to 4 images on the card
  const previews = order.items.slice(0, 4)

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block rounded-xl border border-border bg-card hover:border-foreground/20 hover:shadow-elevated transition-all overflow-hidden"
    >
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Image stack */}
        <div className="flex -space-x-2">
          {previews.map((i) => (
            <div
              key={i.id}
              className="w-14 h-14 rounded-md bg-secondary border-2 border-card overflow-hidden flex items-center justify-center text-[10px] text-muted-foreground"
            >
              {i.product?.image_url ? (
                <img
                  src={i.product.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                'No img'
              )}
            </div>
          ))}
          {order.items.length > 4 && (
            <div className="w-14 h-14 rounded-md bg-secondary border-2 border-card flex items-center justify-center text-xs font-medium text-muted-foreground">
              +{order.items.length - 4}
            </div>
          )}
        </div>

        {/* Middle: summary */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Order
            </span>
            <span className="font-mono text-sm">
              #{order.id.slice(0, 8)}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{placedStr}</span>
          </div>
          <p className="text-sm font-medium truncate">
            {order.items
              .slice(0, 2)
              .map((i) => i.product?.name ?? 'Item')
              .join(', ')}
            {order.items.length > 2 && (
              <span className="text-muted-foreground"> +{order.items.length - 2} more</span>
            )}
          </p>
          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1">
              <PackageCheck className="w-3 h-3" />
              {itemCount} item{itemCount === 1 ? '' : 's'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Store className="w-3 h-3" />
              {sellerCount} seller{sellerCount === 1 ? '' : 's'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Wallet className="w-3 h-3" />
              {paymentLabelShort(order.payment_method)}
            </span>
          </div>
        </div>

        {/* Right: total + arrow */}
        <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 sm:gap-1 shrink-0">
          <p className="text-lg font-semibold tracking-tight">
            {formatPrice(order.total_price ?? 0)}
          </p>
          <StepPill step={step} />
        </div>
      </div>

      <div className="border-t border-border bg-secondary/30 px-5 py-2.5 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Receipt className="w-3 h-3" />
          {order.subtotal != null && (
            <>
              {formatPrice(order.subtotal)} + {formatPrice(order.shipping_fee ?? 0)}{' '}
              shipping
            </>
          )}
        </span>
        <span className="inline-flex items-center gap-1 font-medium text-foreground/80 hover:text-foreground">
          View details
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  )
}

function paymentLabelShort(m: string | null): string {
  if (m === 'cod') return 'Cash on delivery'
  if (m === 'card') return 'Card'
  if (m === 'bank_transfer') return 'Bank transfer'
  return 'Payment'
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
      }`}
    >
      {children}
    </button>
  )
}

function StepPill({ step }: { step: Step }) {
  const cfg: Record<Step, { label: string; icon: any; cls: string }> = {
    pending: {
      label: 'Awaiting',
      icon: ShoppingBag,
      cls: 'bg-warning/10 text-warning',
    },
    confirmed: {
      label: 'Preparing',
      icon: PackageCheck,
      cls: 'bg-brand/10 text-brand',
    },
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
  const c = cfg[step]
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ${c.cls}`}
    >
      <c.icon className="w-3 h-3" />
      {c.label}
    </span>
  )
}
