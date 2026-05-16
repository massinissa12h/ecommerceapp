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
} from 'lucide-react'

type Row = {
  id: string
  name: string
  price: number | null
  stock: number
  status: 'active' | 'draft' | 'archived'
  image_url: string | null
  category: string | null
  created_at: string | null
}

export default function ProductsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) return
      const { data } = await supabase
        .from('products')
        .select('id, name, price, stock, status, image_url, category, created_at')
        .eq('seller_id', uid)
        .order('created_at', { ascending: false })
      if (!cancelled) {
        setRows((data ?? []) as Row[])
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = rows.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

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
            {rows.length} listed · manage what shoppers see.
          </p>
        </div>
        <Link href="/dashboard/products/new">
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            New product
          </Button>
        </Link>
      </div>

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
            {filtered.map((r) => (
              <li
                key={r.id}
                className="grid grid-cols-[64px_1fr_auto] sm:grid-cols-[64px_1fr_120px_120px_auto] items-center gap-4 p-4"
              >
                <div className="w-16 h-16 rounded-md overflow-hidden bg-secondary border border-border flex items-center justify-center text-[10px] text-muted-foreground">
                  {r.image_url ? (
                    <img src={r.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    'No image'
                  )}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/product/${r.id}`}
                    className="font-medium hover:text-brand transition-colors truncate inline-block max-w-full"
                  >
                    {r.name}
                  </Link>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    {r.category && (
                      <span className="px-1.5 py-0.5 rounded bg-secondary capitalize">
                        {r.category}
                      </span>
                    )}
                    <StatusPill status={r.status} />
                  </div>
                </div>
                <div className="hidden sm:block text-sm font-medium">
                  {formatPrice(r.price ?? 0)}
                </div>
                <div className="hidden sm:block text-sm text-muted-foreground">
                  {r.stock} in stock
                </div>
                <div className="flex items-center gap-1">
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
            ))}
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
