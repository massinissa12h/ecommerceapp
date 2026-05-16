'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import {
  Loader2,
  ShoppingBag,
  Truck,
  CheckCircle2,
  XCircle,
  PackageCheck,
} from 'lucide-react'

type Item = {
  id: string
  order_id: string
  product_id: string | null
  quantity: number | null
  price: number | null
  fulfillment_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  tracking_number: string | null
  products: { id: string; name: string; image_url: string | null } | null
  orders: {
    id: string
    created_at: string | null
    status: string | null
    user_id: string | null
  } | null
  buyer?: { username: string | null; email: string | null } | null
}

const STATUSES: Item['fulfillment_status'][] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

export default function OrdersPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | Item['fulfillment_status']>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) return

      const { data } = await supabase
        .from('order_items')
        .select(
          `id, order_id, product_id, quantity, price, fulfillment_status, tracking_number,
           products ( id, name, image_url ),
           orders ( id, created_at, status, user_id )`,
        )
        .eq('seller_id', uid)
        .order('id', { ascending: false })

      // hydrate buyer info
      const buyerIds = Array.from(
        new Set(
          (data ?? [])
            .map((r: any) => r.orders?.user_id)
            .filter(Boolean) as string[],
        ),
      )
      let buyersMap: Record<string, { username: string | null; email: string | null }> = {}
      if (buyerIds.length) {
        const { data: us } = await supabase
          .from('users')
          .select('id, username, email')
          .in('id', buyerIds)
        ;(us ?? []).forEach((u: any) => {
          buyersMap[u.id] = { username: u.username, email: u.email }
        })
      }

      if (!cancelled) {
        setItems(
          ((data ?? []) as any[]).map((r) => ({
            ...r,
            buyer: r.orders?.user_id ? buyersMap[r.orders.user_id] : null,
          })),
        )
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.fulfillment_status === filter)),
    [items, filter],
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length }
    STATUSES.forEach((s) => (c[s] = items.filter((i) => i.fulfillment_status === s).length))
    return c
  }, [items])

  const setStatus = async (item: Item, next: Item['fulfillment_status']) => {
    setBusyId(item.id)
    const { error } = await supabase
      .from('order_items')
      .update({ fulfillment_status: next })
      .eq('id', item.id)
    if (!error) {
      setItems((arr) =>
        arr.map((r) =>
          r.id === item.id ? { ...r, fulfillment_status: next } : r,
        ),
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
        arr.map((r) => (r.id === item.id ? { ...r, tracking_number: value } : r)),
      )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage order items that include your products.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-2 flex flex-wrap gap-1">
        <TabBtn active={filter === 'all'} onClick={() => setFilter('all')}>
          All ({counts.all})
        </TabBtn>
        {STATUSES.map((s) => (
          <TabBtn key={s} active={filter === s} onClick={() => setFilter(s)}>
            <span className="capitalize">{s}</span>
            <span className="ml-1.5 text-[10px] text-muted-foreground">({counts[s] ?? 0})</span>
          </TabBtn>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground mb-2 opacity-60" />
          <p className="text-sm text-muted-foreground">
            {items.length === 0
              ? 'No orders yet. Once buyers checkout your products, they show up here.'
              : 'No orders match this filter.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <ul className="divide-y divide-border">
            {filtered.map((r) => (
              <li
                key={r.id}
                className="p-4 grid sm:grid-cols-[64px_1fr_auto] gap-4 items-center"
              >
                <div className="w-16 h-16 rounded-md overflow-hidden bg-secondary border border-border flex items-center justify-center text-[10px] text-muted-foreground">
                  {r.products?.image_url ? (
                    <img
                      src={r.products.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    'No image'
                  )}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/product/${r.products?.id}`}
                    className="font-medium hover:text-brand truncate inline-block max-w-full"
                  >
                    {r.products?.name ?? 'Deleted product'}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1">
                    Order #{String(r.order_id).slice(0, 8)} · {r.quantity} ×
                    ${Number(r.price ?? 0).toFixed(2)} ={' '}
                    <span className="text-foreground font-medium">
                      ${(Number(r.price ?? 0) * Number(r.quantity ?? 0)).toFixed(2)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Buyer: {r.buyer?.username || r.buyer?.email || 'Anonymous'} ·{' '}
                    {r.orders?.created_at?.slice(0, 10)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.fulfillment_status} />
                    <select
                      value={r.fulfillment_status}
                      disabled={busyId === r.id}
                      onChange={(e) => setStatus(r, e.target.value as any)}
                      className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s[0].toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {(r.fulfillment_status === 'shipped' ||
                    r.fulfillment_status === 'processing' ||
                    r.tracking_number) && (
                    <input
                      defaultValue={r.tracking_number ?? ''}
                      onBlur={(e) => {
                        if (e.target.value !== (r.tracking_number ?? '')) {
                          setTracking(r, e.target.value)
                        }
                      }}
                      placeholder="Tracking #"
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs w-44"
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
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

function StatusBadge({ status }: { status: Item['fulfillment_status'] }) {
  const cfg: Record<
    Item['fulfillment_status'],
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
