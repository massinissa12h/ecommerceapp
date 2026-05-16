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
  Calendar,
  Store,
} from 'lucide-react'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '@/lib/format'

type Order = {
  id: string
  total_price: number | null
  status: string | null
  created_at: string | null
  items: Array<{
    id: string
    quantity: number
    price: number
    fulfillment_status: string
    tracking_number: string | null
    product: { id: string; name: string; image_url: string | null } | null
    seller_name: string
  }>
}

export default function BuyerOrdersPage() {
  const router = useRouter()
  const { cartCount } = useCart()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

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
        .select('id, total_price, status, created_at')
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

      // Seller names
      const sellerIds = Array.from(
        new Set(items.map((i) => i.seller_id).filter(Boolean) as string[]),
      )
      const nameMap = new Map<string, string>()
      if (sellerIds.length) {
        const [{ data: us }, { data: ps }] = await Promise.all([
          supabase.from('users').select('id, username').in('id', sellerIds),
          supabase.from('profiles').select('id, shop_name').in('id', sellerIds),
        ])
        ;(us ?? []).forEach((u: any) => nameMap.set(u.id, u.username ?? 'Seller'))
        ;(ps ?? []).forEach((p: any) => {
          if (p.shop_name) nameMap.set(p.id, p.shop_name)
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar cartCount={cartCount} />

      <main className="flex-1">
        <section className="border-b border-border bg-card">
          <div className="max-w-5xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-semibold tracking-tight">Your orders</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track everything you&apos;ve purchased on Souqly.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 rounded-xl border border-dashed border-border bg-card">
              <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <h2 className="font-semibold text-lg">No orders yet</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Once you buy something, your order history shows up here.
              </p>
              <Link href="/products">
                <Button className="mt-5">Start shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {orders.map((o) => (
                <article
                  key={o.id}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <header className="px-5 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Order
                        </p>
                        <p className="text-sm font-medium">#{o.id.slice(0, 8)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Placed
                        </p>
                        <p className="text-sm font-medium">
                          {o.created_at?.slice(0, 10)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Total
                        </p>
                        <p className="text-sm font-medium">
                          {formatPrice(o.total_price ?? 0)}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-success/10 text-success capitalize">
                      {o.status ?? 'paid'}
                    </span>
                  </header>
                  <ul className="divide-y divide-border">
                    {o.items.map((i) => (
                      <li key={i.id} className="grid grid-cols-[56px_1fr_auto] gap-3 p-4">
                        <div className="w-14 h-14 rounded-md bg-secondary border border-border overflow-hidden flex items-center justify-center text-[10px] text-muted-foreground">
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
                        <div className="min-w-0">
                          {i.product ? (
                            <Link
                              href={`/product/${i.product.id}`}
                              className="text-sm font-medium hover:text-brand truncate inline-block max-w-full"
                            >
                              {i.product.name}
                            </Link>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Deleted product
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1.5">
                            <Store className="w-3 h-3" />
                            {i.seller_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            qty {i.quantity} · {formatPrice(i.price)}
                          </p>
                          {i.tracking_number && (
                            <p className="mt-1 text-xs">
                              <span className="text-muted-foreground">Tracking: </span>
                              <span className="font-mono font-medium">{i.tracking_number}</span>
                            </p>
                          )}
                        </div>
                        <div className="self-start">
                          <FulfillmentBadge status={i.fulfillment_status as any} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}

function FulfillmentBadge({
  status,
}: {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
}) {
  const cfg = {
    pending: { label: 'Pending', icon: ShoppingBag, cls: 'bg-warning/10 text-warning' },
    processing: { label: 'Processing', icon: PackageCheck, cls: 'bg-brand/10 text-brand' },
    shipped: { label: 'Shipped', icon: Truck, cls: 'bg-brand/10 text-brand' },
    delivered: { label: 'Delivered', icon: CheckCircle2, cls: 'bg-success/10 text-success' },
    cancelled: { label: 'Cancelled', icon: XCircle, cls: 'bg-destructive/10 text-destructive' },
  }[status] ?? { label: status, icon: ShoppingBag, cls: 'bg-secondary' }
  const C = cfg.icon
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ${cfg.cls}`}
    >
      <C className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}
