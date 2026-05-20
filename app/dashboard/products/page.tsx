'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/format'
import {
  PlusCircle,
  Search,
  Loader2,
  Edit2,
  Trash2,
  EyeOff,
  Eye,
  Package,
  Star,
  AlertTriangle,
} from 'lucide-react'

type Row = {
  id: string
  name: string
  price: number | null
  stock: number
  status: 'active' | 'draft' | 'archived'
  image_url: string | null
  category: string | null
  is_featured: boolean
  created_at: string | null
}

export default function ProductsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'draft' | 'archived' | 'low_stock'
  >('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [lowStockThreshold, setLowStockThreshold] = useState(5)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) return
      const [{ data }, { data: shop }] = await Promise.all([
        supabase
          .from('products')
          .select(
            'id, name, price, stock, status, image_url, category, is_featured, created_at',
          )
          .eq('seller_id', uid)
          .order('created_at', { ascending: false }),
        supabase
          .from('shops')
          .select('low_stock_threshold')
          .eq('id', uid)
          .maybeSingle(),
      ])
      if (!cancelled) {
        setRows((data ?? []) as Row[])
        setLowStockThreshold(shop?.low_stock_threshold ?? 5)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = rows.filter((r) => {
    if (statusFilter === 'low_stock') {
      if (r.stock > lowStockThreshold) return false
    } else if (statusFilter !== 'all') {
      if (r.status !== statusFilter) return false
    }
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()))
      return false
    return true
  })

  const lowStockCount = rows.filter((r) => r.stock <= lowStockThreshold).length

  const toggleStatus = async (row: Row) => {
    setBusyId(row.id)
    const next = row.status === 'active' ? 'draft' : 'active'
    const { error } = await supabase
      .from('products')
      .update({ status: next })
      .eq('id', row.id)
    if (!error) {
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status: next } : r)))
    }
    setBusyId(null)
  }

  const toggleFeatured = async (row: Row) => {
    setBusyId(row.id)
    const next = !row.is_featured
    const { error } = await supabase
      .from('products')
      .update({ is_featured: next })
      .eq('id', row.id)
    if (!error) {
      setRows((rs) =>
        rs.map((r) => (r.id === row.id ? { ...r, is_featured: next } : r)),
      )
    }
    setBusyId(null)
  }

  const remove = async (row: Row) => {
    if (!confirm(`Delete "${row.name}"? This can't be undone.`)) return
    setBusyId(row.id)
    const { error } = await supabase.from('products').delete().eq('id', row.id)
    if (!error) setRows((rs) => rs.filter((r) => r.id !== row.id))
    setBusyId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rows.length} listed · {rows.filter((r) => r.is_featured).length}{' '}
            featured · {lowStockCount} low on stock
          </p>
        </div>
        <Link href="/dashboard/products/new">
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            New product
          </Button>
        </Link>
      </div>

      {lowStockCount > 0 && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 flex items-center justify-between gap-3">
          <p className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span>
              <span className="font-medium">{lowStockCount}</span>{' '}
              {lowStockCount === 1 ? 'product is' : 'products are'} at or below
              your low-stock threshold ({lowStockThreshold}).
            </span>
          </p>
          <button
            onClick={() => setStatusFilter('low_stock')}
            className="text-xs font-medium hover:underline"
          >
            View →
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search your products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50 border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Drafts</option>
          <option value="archived">Archived</option>
          <option value="low_stock">Low stock</option>
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-60" />
            {rows.length === 0
              ? 'No products yet. Create your first listing.'
              : 'No products match your filters.'}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((r) => {
              const isLow = r.stock <= lowStockThreshold
              const isOut = r.stock === 0
              return (
                <li
                  key={r.id}
                  className="grid grid-cols-[64px_1fr_auto] sm:grid-cols-[64px_1fr_120px_140px_auto] items-center gap-4 p-4"
                >
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-secondary border border-border flex items-center justify-center text-[10px] text-muted-foreground relative">
                    {r.image_url ? (
                      <img src={r.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      'No image'
                    )}
                    {r.is_featured && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center">
                        <Star className="w-3 h-3 fill-current" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/product/${r.id}`}
                      className="font-medium hover:text-brand transition-colors truncate inline-block max-w-full"
                    >
                      {r.name}
                    </Link>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      {r.category && (
                        <span className="px-1.5 py-0.5 rounded bg-secondary capitalize">
                          {r.category}
                        </span>
                      )}
                      <StatusPill status={r.status} />
                      {r.is_featured && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold bg-brand/10 text-brand inline-flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hidden sm:block text-sm font-medium">
                    {formatPrice(r.price ?? 0)}
                  </div>
                  <div className="hidden sm:block text-sm">
                    {isOut ? (
                      <span className="inline-flex items-center gap-1 text-destructive font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Out of stock
                      </span>
                    ) : isLow ? (
                      <span className="inline-flex items-center gap-1 text-warning font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Only {r.stock} left
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{r.stock} in stock</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleFeatured(r)}
                      disabled={busyId === r.id}
                      title={r.is_featured ? 'Unpin' : 'Feature this product'}
                      className={`w-9 h-9 rounded-md hover:bg-secondary flex items-center justify-center ${
                        r.is_featured
                          ? 'text-warning'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${r.is_featured ? 'fill-current' : ''}`}
                      />
                    </button>
                    <button
                      onClick={() => toggleStatus(r)}
                      disabled={busyId === r.id}
                      title={r.status === 'active' ? 'Hide from store' : 'Publish'}
                      className="w-9 h-9 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      {busyId === r.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : r.status === 'active' ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <Link
                      href={`/dashboard/products/${r.id}`}
                      className="w-9 h-9 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => remove(r)}
                      disabled={busyId === r.id}
                      className="w-9 h-9 rounded-md hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: Row['status'] }) {
  const map: Record<Row['status'], string> = {
    active: 'bg-success/10 text-success',
    draft: 'bg-muted text-muted-foreground',
    archived: 'bg-secondary text-muted-foreground',
  }
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold ${map[status]}`}>
      {status}
    </span>
  )
}
