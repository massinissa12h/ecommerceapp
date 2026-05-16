'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImageUploader } from './image-uploader'
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = [
  'electronics',
  'fashion',
  'shoes',
  'accessories',
  'home',
  'beauty',
  'sports',
  'books',
  'toys',
  'art',
]

interface ProductFormProps {
  userId: string
  productId?: string
}

export function ProductForm({ userId, productId }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(Boolean(productId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: CATEGORIES[0],
    price: '',
    compare_at_price: '',
    stock: '10',
    image_url: '' as string | null,
    status: 'active' as 'active' | 'draft' | 'archived',
  })

  useEffect(() => {
    if (!productId) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()
      if (cancelled) return
      if (error || !data) {
        setError(error?.message ?? 'Product not found')
      } else {
        setForm({
          name: data.name ?? '',
          description: data.description ?? '',
          category: data.category ?? CATEGORIES[0],
          price: String(data.price ?? ''),
          compare_at_price:
            data.compare_at_price != null ? String(data.compare_at_price) : '',
          stock: String(data.stock ?? 0),
          image_url: data.image_url ?? null,
          status: data.status ?? 'active',
        })
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [productId])

  const save = async () => {
    if (!form.name.trim() || !form.price) {
      setError('Name and price are required.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      price: Number(form.price),
      compare_at_price: form.compare_at_price
        ? Number(form.compare_at_price)
        : null,
      stock: Number(form.stock || 0),
      image_url: form.image_url,
      status: form.status,
      seller_id: userId,
    }

    if (productId) {
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', productId)
        .eq('seller_id', userId)
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from('products').insert(payload)
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    }
    router.push('/dashboard/products')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      <Link
        href="/dashboard/products"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to products
      </Link>

      <div className="flex items-end justify-between mb-8 gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {productId ? 'Edit product' : 'New product'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {productId
              ? 'Update product details, stock, and availability.'
              : 'Add a product to your shop. You can save it as a draft and publish later.'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Details" subtitle="The basics buyers will see first" />
            <div className="grid gap-4">
              <Field label="Name" required>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Hand-thrown ceramic mug"
                />
              </Field>
              <Field label="Description">
                <Textarea
                  value={form.description}
                  rows={4}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Tell buyers what makes this product special..."
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Category">
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c[0].toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as any,
                      })
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="active">Active — visible to buyers</option>
                    <option value="draft">Draft — hidden</option>
                    <option value="archived">Archived</option>
                  </select>
                </Field>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Pricing & inventory"
              subtitle="Set your price and how many you have on hand"
            />
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Price (DZD)" required>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Compare-at price">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.compare_at_price}
                  onChange={(e) =>
                    setForm({ ...form, compare_at_price: e.target.value })
                  }
                  placeholder="(optional)"
                />
              </Field>
              <Field label="Stock">
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Image" subtitle="Best at 1:1 aspect, well-lit" />
            <ImageUploader
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
              userId={userId}
              folder="products"
            />
          </Card>

          <Card>
            {error && (
              <div className="mb-3 rounded-md bg-destructive/10 text-destructive text-xs px-3 py-2">
                {error}
              </div>
            )}
            <Button
              onClick={save}
              disabled={saving}
              className="w-full"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {productId ? 'Save changes' : 'Publish product'}
                </>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground mt-3 text-center">
              You can edit or unpublish at any time.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">{children}</div>
  )
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-semibold">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  )
}

function Field({
  label,
  children,
  required,
}: {
  label: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground/80 flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  )
}
