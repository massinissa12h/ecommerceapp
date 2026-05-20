'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/format'
import {
  Loader2,
  ShoppingBag,
  Truck,
  CheckCircle2,
  XCircle,
  PackageCheck,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  User,
  Wallet,
  Receipt,
  Copy,
  Clock,
  ExternalLink,
} from 'lucide-react'

type FulfillmentStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

const STATUSES: FulfillmentStatus[] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

type Item = {
  id: string
  product_id: string | null
  quantity: number
  price: number
  fulfillment_status: FulfillmentStatus
  tracking_number: string | null
  shipped_at: string | null
  product: { id: string; name: string; image_url: string | null; stock: number } | null
}

type Order = {
  id: string
  user_id: string | null
  total_price: number | null
  subtotal: number | null
  shipping_fee: number | null
  shipping_method: 'center_pickup' | 'home_delivery' | null
  tax: number | null
  status: string | null
  payment_method: string | null
  shipping_address: any
  notes: string | null
  created_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
}

type Buyer = {
  id: string
  username: string | null
  email: string | null
}

export default function SellerOrderDetailPage() {
  const params = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [buyer, setBuyer] = useState<Buyer | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) return

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

      // Only the seller's items on this order
      const { data: lineItems } = await supabase
        .from('order_items')
        .select(
          `id, product_id, quantity, price, fulfillment_status, tracking_number, shipped_at,
           product:products ( id, name, image_url, stock )`,
        )
        .eq('order_id', orderRow.id)
        .eq('seller_id', uid)

      if (!lineItems || lineItems.length === 0) {
        // Either the order has no items for this seller, or RLS blocked it.
        if (!cancelled) {
          setNotFound(true)
          setLoading(false)
        }
        return
      }

      // Buyer profile (RLS lets us see public users/profiles)
      let buyerRow: Buyer | null = null
      if (orderRow.user_id) {
        const { data: u } = await supabase
          .from('users')
          .select('id, username, email')
          .eq('id', orderRow.user_id)
          .maybeSingle()
        if (u) buyerRow = u as Buyer
      }

      if (cancelled) return
      setOrder(orderRow as Order)
      setItems(lineItems as any as Item[])
      setBuyer(buyerRow)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [params.id])

  const setStatus = async (item: Item, next: FulfillmentStatus) => {
    setBusyId(item.id)
    const { error } = await supabase
      .from('order_items')
      .update({ fulfillment_status: next })
      .eq('id', item.id)
    if (!error) {
      setItems((arr) =>
        arr.map((r) => (r.id === item.id ? { ...r, fulfillment_status: next } : r)),
      )
    }
    setBusyId(null)
  }

  const setTracking = async (item: Item, value: string) => {
    const { error } = await supabase
      .from('order_items')
      .update({ tracking_number: value || null })
      .eq('id', item.id)
    if (!error) {
      setItems((arr) =>
        arr.map((r) =>
          r.id === item.id ? { ...r, tracking_number: value } : r,
        ),
      )
    }
  }

  const bulkSetStatus = async (next: FulfillmentStatus) => {
    setBusyId('bulk')
    const ids = items.map((i) => i.id)
    const { error } = await supabase
      .from('order_items')
      .update({ fulfillment_status: next })
      .in('id', ids)
    if (!error) {
      setItems((arr) => arr.map((r) => ({ ...r, fulfillment_status: next })))
    }
    setBusyId(null)
  }

  const copyOrderId = () => {
    if (!order) return
    navigator.clipboard?.writeText(order.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="max-w-md mx-auto py-24 text-center">
        <h1 className="text-2xl font-semibold">Order not found</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Either this order doesn&apos;t exist or none of its items are from
          your shop.
        </p>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center mt-6 text-sm hover:text-brand"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to orders
        </Link>
      </div>
    )
  }

  const address = order.shipping_address ?? {}
  const buyerName =
    [address.first_name, address.last_name].filter(Boolean).join(' ') ||
    buyer?.username ||
    buyer?.email ||
    'Anonymous buyer'
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
  const sellerSubtotal = items.reduce(
    (s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0),
    0,
  )
  const allShipped = items.every(
    (i) => i.fulfillment_status === 'shipped' || i.fulfillment_status === 'delivered',
  )
  const allPending = items.every((i) => i.fulfillment_status === 'pending')

  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        All orders
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
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
            Placed {placedAtStr}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {allPending && (
            <Button
              size="sm"
              variant="outline"
              disabled={busyId === 'bulk'}
              onClick={() => bulkSetStatus('processing')}
            >
              <PackageCheck className="w-3.5 h-3.5 mr-1.5" />
              Confirm & prepare
            </Button>
          )}
          {!allShipped && (
            <Button
              size="sm"
              disabled={busyId === 'bulk'}
              onClick={() => bulkSetStatus('shipped')}
            >
              <Truck className="w-3.5 h-3.5 mr-1.5" />
              Mark all shipped
            </Button>
          )}
        </div>
      </div>

      {/* Action banner for COD — call-to-confirm is the most useful action */}
      {address.phone && allPending && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">
                Call the buyer to confirm
              </p>
              <p className="text-sm text-muted-foreground">
                COD orders need a phone confirmation before you ship.
              </p>
            </div>
          </div>
          <a href={`tel:${address.phone}`}>
            <Button size="sm">
              <Phone className="w-3.5 h-3.5 mr-1.5" />
              Call {address.phone}
            </Button>
          </a>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* Buyer card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3 inline-flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Buyer
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Name
                </p>
                <p className="text-sm font-medium mt-0.5">{buyerName}</p>
                {buyer?.username && (
                  <Link
                    href={`/u/${buyer.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-0.5"
                  >
                    @{buyer.username}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
              {address.phone && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Phone
                  </p>
                  <a
                    href={`tel:${address.phone}`}
                    className="text-sm font-medium mt-0.5 inline-flex items-center gap-1.5 hover:text-brand"
                  >
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    {address.phone}
                  </a>
                </div>
              )}
              {buyer?.email && (
                <div className="sm:col-span-2">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Email
                  </p>
                  <a
                    href={`mailto:${buyer.email}`}
                    className="text-sm font-medium mt-0.5 inline-flex items-center gap-1.5 hover:text-brand"
                  >
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    {buyer.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Shipping / delivery card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3 inline-flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Delivery
            </h2>
            <div className="mb-3">
              {order.shipping_method === 'center_pickup' ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-brand/10 text-brand text-xs font-semibold px-2.5 py-1">
                  Pickup at delivery center
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary text-foreground text-xs font-semibold px-2.5 py-1">
                  Home delivery
                </span>
              )}
              {order.shipping_method === 'center_pickup' && (
                <p className="text-xs text-muted-foreground mt-2">
                  Hand the order to the courier — buyer will pick it up at the
                  office. No street address required.
                </p>
              )}
            </div>
            {address.first_name || address.street_address ? (
              <div className="text-sm leading-relaxed">
                {(address.first_name || address.last_name) && (
                  <p className="font-medium">
                    {[address.first_name, address.last_name].filter(Boolean).join(' ')}
                  </p>
                )}
                {order.shipping_method !== 'center_pickup' && address.street_address && (
                  <p>{address.street_address}</p>
                )}
                <p>
                  {[address.city, address.postal_code].filter(Boolean).join(', ')}
                </p>
                {address.country && <p>{address.country}</p>}
                <div className="mt-3 flex gap-2">
                  {address.phone && (
                    <a href={`tel:${address.phone}`}>
                      <Button size="sm" variant="outline">
                        <Phone className="w-3.5 h-3.5 mr-1.5" />
                        Call
                      </Button>
                    </a>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const lines = [
                        [address.first_name, address.last_name].filter(Boolean).join(' '),
                        address.street_address,
                        [address.city, address.postal_code].filter(Boolean).join(', '),
                        address.country,
                        address.phone,
                      ]
                        .filter(Boolean)
                        .join('\n')
                      navigator.clipboard?.writeText(lines)
                    }}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy address
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No address on file for this order.
              </p>
            )}
          </div>

          {/* Items the seller is responsible for */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h2 className="font-semibold">Your items in this order</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Update status and tracking per item.
              </p>
            </div>
            <ul className="divide-y divide-border">
              {items.map((i) => (
                <li
                  key={i.id}
                  className="p-4 grid sm:grid-cols-[64px_1fr_auto] gap-4 items-start"
                >
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-secondary border border-border flex items-center justify-center text-[10px] text-muted-foreground">
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
                      <span className="text-muted-foreground">Deleted product</span>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      qty {i.quantity} × {formatPrice(i.price)} ={' '}
                      <span className="text-foreground font-medium">
                        {formatPrice(i.price * i.quantity)}
                      </span>
                    </p>
                    {i.product && typeof i.product.stock === 'number' && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {i.product.stock} in stock now
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 min-w-[200px]">
                    <div className="flex items-center gap-2 w-full justify-end">
                      <StatusBadge status={i.fulfillment_status} />
                      <select
                        value={i.fulfillment_status}
                        disabled={busyId === i.id || busyId === 'bulk'}
                        onChange={(e) =>
                          setStatus(i, e.target.value as FulfillmentStatus)
                        }
                        className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s[0].toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    {(i.fulfillment_status === 'shipped' ||
                      i.fulfillment_status === 'processing' ||
                      i.tracking_number) && (
                      <Input
                        defaultValue={i.tracking_number ?? ''}
                        onBlur={(e) => {
                          if (e.target.value !== (i.tracking_number ?? '')) {
                            setTracking(i, e.target.value)
                          }
                        }}
                        placeholder="Tracking #"
                        className="h-8 text-xs w-full"
                      />
                    )}
                    {i.shipped_at && (
                      <p className="text-[11px] text-muted-foreground self-end">
                        Shipped {new Date(i.shipped_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar — your earnings + payment */}
        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 inline-flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              Your earnings (this order)
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {items.reduce((s, i) => s + (i.quantity ?? 0), 0)} items
              </span>
              <span className="text-lg font-semibold">
                {formatPrice(sellerSubtotal)}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Order total ({formatPrice(order.total_price ?? 0)}) may include
              items from other sellers.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 inline-flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              Payment
            </h3>
            <p className="text-sm">
              {paymentLabel(order.payment_method)}
            </p>
            {order.payment_method === 'cod' && (
              <p className="text-xs text-muted-foreground mt-1">
                The courier will collect cash from the buyer on delivery.
              </p>
            )}
          </div>

          {order.notes && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Buyer note
              </h3>
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {order.notes}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function paymentLabel(m: string | null): string {
  if (m === 'cod') return 'Cash on delivery'
  if (m === 'card') return 'Card'
  if (m === 'bank_transfer') return 'Bank transfer'
  return '—'
}

function StatusBadge({ status }: { status: FulfillmentStatus }) {
  const cfg: Record<
    FulfillmentStatus,
    { label: string; icon: any; cls: string }
  > = {
    pending: {
      label: 'Pending',
      icon: ShoppingBag,
      cls: 'bg-warning/10 text-warning',
    },
    processing: {
      label: 'Processing',
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
