'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import {
  Coins,
  Package,
  ShoppingBag,
  Star,
  Loader2,
  ArrowUpRight,
  PlusCircle,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { formatPrice, formatPriceCompact } from '@/lib/format'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

type Stats = {
  productCount: number
  activeCount: number
  draftCount: number
  totalRevenue: number
  ordersCount: number
  pendingFulfillment: number
  avgRating: number
  reviewCount: number
}

type Daily = { day: string; revenue: number; orders: number }

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [daily, setDaily] = useState<Daily[]>([])
  const [recent, setRecent] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [shopName, setShopName] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) return

      const [
        { data: profile },
        { data: products },
        { data: orderItems },
        { data: reviews },
      ] = await Promise.all([
        supabase.from('profiles').select('shop_name').eq('id', uid).maybeSingle(),
        supabase.from('products').select('id, name, status, image_url, price').eq('seller_id', uid),
        supabase
          .from('order_items')
          .select('id, order_id, product_id, quantity, price, fulfillment_status, seller_id, orders ( id, created_at, status, user_id )')
          .eq('seller_id', uid)
          .order('id', { ascending: false }),
        supabase
          .from('reviews')
          .select('rating, product_id, products!inner(seller_id)')
          .eq('products.seller_id', uid),
      ])

      if (cancelled) return

      const items = (orderItems ?? []) as any[]
      const revenueAll = items.reduce(
        (sum, r) => sum + (Number(r.price) || 0) * (Number(r.quantity) || 0),
        0,
      )
      const ordersSet = new Set(items.map((r) => r.order_id))
      const pending = items.filter((r) => r.fulfillment_status === 'pending').length
      const reviewArr = (reviews ?? []) as any[]
      const avgRating = reviewArr.length
        ? Number(
            (
              reviewArr.reduce((s, r) => s + (r.rating ?? 0), 0) / reviewArr.length
            ).toFixed(1),
          )
        : 0

      setShopName(profile?.shop_name ?? '')
      setStats({
        productCount: products?.length ?? 0,
        activeCount: (products ?? []).filter((p: any) => p.status === 'active').length,
        draftCount: (products ?? []).filter((p: any) => p.status === 'draft').length,
        totalRevenue: revenueAll,
        ordersCount: ordersSet.size,
        pendingFulfillment: pending,
        avgRating,
        reviewCount: reviewArr.length,
      })

      // Build a 14-day revenue series
      const days: Daily[] = []
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      for (let i = 13; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        days.push({
          day: d.toISOString().slice(5, 10), // MM-DD
          revenue: 0,
          orders: 0,
        })
      }
      const byDay = new Map(days.map((d) => [d.day, d]))
      const orderToDay = new Map<string, string>()
      items.forEach((r) => {
        const created = r.orders?.created_at as string | undefined
        if (!created) return
        const key = created.slice(5, 10)
        const target = byDay.get(key)
        if (!target) return
        target.revenue += (Number(r.price) || 0) * (Number(r.quantity) || 0)
        if (!orderToDay.has(r.order_id)) {
          target.orders += 1
          orderToDay.set(r.order_id, key)
        }
      })
      setDaily(days)

      // Top selling products by quantity
      const byProduct = new Map<string, { qty: number; revenue: number }>()
      items.forEach((r) => {
        if (!r.product_id) return
        const cur = byProduct.get(r.product_id) ?? { qty: 0, revenue: 0 }
        cur.qty += Number(r.quantity) || 0
        cur.revenue += (Number(r.price) || 0) * (Number(r.quantity) || 0)
        byProduct.set(r.product_id, cur)
      })
      const productLookup = new Map((products ?? []).map((p: any) => [p.id, p]))
      const top = [...byProduct.entries()]
        .map(([pid, v]) => ({
          ...productLookup.get(pid),
          qty: v.qty,
          revenue: v.revenue,
        }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 4)
      setTopProducts(top)

      setRecent(items.slice(0, 6))
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const empty = stats.productCount === 0

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
            Welcome back
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {shopName || 'Your shop'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s how your shop is performing.
          </p>
        </div>
      </div>

      {empty && (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <Package className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="font-semibold text-lg">Open your shop with a first product</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            You haven&apos;t listed anything yet. Add one product and it&apos;ll
            appear in the marketplace within seconds.
          </p>
          <Link href="/dashboard/products/new">
            <button className="mt-5 inline-flex items-center gap-2 rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium">
              <PlusCircle className="w-4 h-4" />
              Add your first product
            </button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Coins}
          label="Total revenue"
          value={formatPriceCompact(stats.totalRevenue)}
          hint="All time"
        />
        <StatCard
          icon={ShoppingBag}
          label="Orders"
          value={stats.ordersCount}
          hint={`${stats.pendingFulfillment} pending`}
          accent={stats.pendingFulfillment > 0}
        />
        <StatCard
          icon={Package}
          label="Active products"
          value={stats.activeCount}
          hint={`${stats.draftCount} drafts`}
        />
        <StatCard
          icon={Star}
          label="Avg rating"
          value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
          hint={`${stats.reviewCount} reviews`}
        />
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-semibold">Revenue, last 14 days</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Based on confirmed order items.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5" />
            Live
          </div>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: any, key) =>
                  key === 'revenue' ? formatPrice(Number(v)) : v
                }
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--brand))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent orders + top products */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Recent orders</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Items sold from your shop.
              </p>
            </div>
            <Link
              href="/dashboard/orders"
              className="text-xs font-medium hover:text-brand inline-flex items-center"
            >
              All orders <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No orders yet — share your shop and they&apos;ll start rolling in.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between p-4 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      Order #{String(r.order_id).slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      qty {r.quantity} · {r.fulfillment_status}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatPrice(Number(r.price) * Number(r.quantity))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Top products</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Your best-sellers by quantity.
              </p>
            </div>
            <Link
              href="/dashboard/products"
              className="text-xs font-medium hover:text-brand inline-flex items-center"
            >
              All products <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground inline-flex items-center justify-center gap-2 w-full">
              <AlertCircle className="w-4 h-4" />
              No sales recorded yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {topProducts.map((p, i) => (
                <li key={p.id ?? i} className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-md bg-secondary overflow-hidden border border-border flex items-center justify-center text-xs text-muted-foreground">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      'No img'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.qty} sold · {formatPrice(p.revenue)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: any
  label: string
  value: string | number
  hint?: string
  accent?: boolean
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${
          accent ? 'bg-brand text-brand-foreground' : 'bg-secondary text-foreground'
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {hint && <p className="text-[11px] text-muted-foreground/80 mt-1">{hint}</p>}
    </div>
  )
}
