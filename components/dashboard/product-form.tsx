'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { GalleryUploader, type GalleryImage } from './gallery-uploader'
import {
  Loader2,
  Save,
  ArrowLeft,
  Tag as TagIcon,
  X,
} from 'lucide-react'
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
    status: 'active' as 'active' | 'draft' | 'archived',
    is_featured: false,
  })

  const [images, setImages] = useState<GalleryImage[]>([])
  const [originalImageIds, setOriginalImageIds] = useState<Set<string>>(new Set())
  const [tags, setTags] = useState<string[]>([])
  const [originalTags, setOriginalTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (!productId) return
    let cancelled = false
    ;(async () => {
      const [{ data: p, error }, { data: imgs }, { data: tagRows }] =
        await Promise.all([
          supabase.from('products').select('*').eq('id', productId).single(),
          supabase
            .from('product_images')
            .select('*')
            .eq('product_id', productId)
            .order('position', { ascending: true }),
          supabase
            .from('product_tags')
            .select('tag')
            .eq('product_id', productId),
        ])

      if (cancelled) return
      if (error || !p) {
        setError(error?.message ?? 'Product not found')
      } else {
        setForm({
          name: p.name ?? '',
          description: p.description ?? '',
          category: p.category ?? CATEGORIES[0],
          price: String(p.price ?? ''),
          compare_at_price:
            p.compare_at_price != null ? String(p.compare_at_price) : '',
          stock: String(p.stock ?? 0),
          status: p.status ?? 'active',
          is_featured: !!p.is_featured,
        })

        // Seed the gallery: existing product_images rows, with the legacy
        // image_url prepended as the primary if there are no images yet.
        const existing: GalleryImage[] = (imgs ?? []).map((row: any) => ({
          id: row.id,
          url: row.url,
          position: row.position,
          alt: row.alt,
        }))
        if (existing.length === 0 && p.image_url) {
          existing.push({ url: p.image_url, position: 0 })
        } else if (
          existing.length > 0 &&
          p.image_url &&
          !existing.some((g) => g.url === p.image_url)
        ) {
          // primary image_url exists but isn't in the gallery — add it at position 0
          existing.unshift({ url: p.image_url, position: 0 })
          existing.forEach((g, i) => (g.position = i))
        }
        setImages(existing)
        setOriginalImageIds(
          new Set(existing.map((i) => i.id).filter(Boolean) as string[]),
        )

        const tagList = (tagRows ?? [])
          .map((r: any) => r.tag as string)
          .filter(Boolean)
        setTags(tagList)
        setOriginalTags(tagList)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [productId])

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9\- ]/g, '')
    if (!t) return
    if (tags.includes(t) || tags.length >= 8) {
      setTagInput('')
      return
    }
    setTags([...tags, t])
    setTagInput('')
  }

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t))

  const save = async () => {
    if (!form.name.trim() || !form.price) {
      setError('Name and price are required.')
      return
    }
    setSaving(true)
    setError(null)

    const primaryUrl = images[0]?.url ?? null
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      price: Number(form.price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      stock: Number(form.stock || 0),
      // products.image_url is the cached primary used by cards & legacy code
      image_url: primaryUrl,
      status: form.status,
      is_featured: form.is_featured,
      seller_id: userId,
    }

    let pid = productId
    if (pid) {
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', pid)
        .eq('seller_id', userId)
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert(payload)
        .select('id')
        .single()
      if (error || !data) {
        setError(error?.message ?? 'Could not create product')
        setSaving(false)
        return
      }
      pid = data.id
    }

    // Sync gallery: delete removed, insert new, update positions.
    try {
      // Figure out which DB rows to delete
      const keptIds = new Set(images.map((i) => i.id).filter(Boolean) as string[])
      const toDelete = [...originalImageIds].filter((id) => !keptIds.has(id))
      if (toDelete.length) {
        await supabase.from('product_images').delete().in('id', toDelete)
      }
      // Update positions for existing
      for (const img of images) {
        if (img.id) {
          await supabase
            .from('product_images')
            .update({ position: img.position, alt: img.alt ?? null })
            .eq('id', img.id)
        }
      }
      // Insert new
      const newRows = images
        .filter((i) => !i.id)
        .map((i) => ({
          product_id: pid,
          url: i.url,
          position: i.position,
          alt: i.alt ?? null,
        }))
      if (newRows.length) {
        await supabase.from('product_images').insert(newRows)
      }

      // Sync tags: replace the lot (small list, simpler than diff)
      const tagSetChanged =
        tags.length !== originalTags.length ||
        tags.some((t, i) => t !== originalTags[i])
      if (tagSetChanged) {
        await supabase.from('product_tags').delete().eq('product_id', pid)
        if (tags.length) {
          await supabase
            .from('product_tags')
            .insert(tags.map((tag) => ({ product_id: pid, tag })))
        }
      }
    } catch (e: any) {
      // Non-fatal: the product itself was saved. Surface but don't block.
      setError(`Saved, but gallery/tags sync had an issue: ${e.message ?? e}`)
      setSaving(false)
      return
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
              ? 'Update product details, stock, gallery, and availability.'
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
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
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
                      setForm({ ...form, status: e.target.value as any })
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
                  placeholder="0"
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
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) =>
                  setForm({ ...form, is_featured: e.target.checked })
                }
                className="rounded border-border"
              />
              <span>Pin as featured in my shop</span>
            </label>
          </Card>

          <Card>
            <CardHeader
              title="Tags"
              subtitle="Help buyers find this — handmade, vintage, gift, etc."
            />
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary text-foreground text-xs px-2.5 py-1"
                >
                  <TagIcon className="w-3 h-3 text-muted-foreground" />
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {tags.length === 0 && (
                <p className="text-xs text-muted-foreground">No tags yet.</p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="Type a tag and press Enter"
                disabled={tags.length >= 8}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTag}
                disabled={!tagInput.trim() || tags.length >= 8}
              >
                Add
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              {tags.length}/8 tags. Lowercase, no special characters.
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Gallery"
              subtitle="Up to 8 images. The first one is your product card thumbnail."
            />
            <GalleryUploader
              value={images}
              onChange={setImages}
              userId={userId}
              max={8}
            />
          </Card>

          <Card>
            {error && (
              <div className="mb-3 rounded-md bg-destructive/10 text-destructive text-xs px-3 py-2">
                {error}
              </div>
            )}
            <Button onClick={save} disabled={saving} className="w-full" size="lg">
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
