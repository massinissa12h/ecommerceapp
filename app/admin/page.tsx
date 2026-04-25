'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  Edit2,
  Trash2,
  Loader2,
  Package,
  DollarSign,
  Star,
  Layers,
  Plus,
  X,
  Sparkles,
  ImageIcon,
  Save,
  SlidersHorizontal,
} from 'lucide-react'

type Product = {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number | null
  image_url: string | null
  rating: number | null
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'newest' | 'priceHigh' | 'priceLow' | 'rating'>(
    'newest'
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    image_url: '',
    rating: 0,
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setProducts(data)

    setLoading(false)
  }

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      category: '',
      price: 0,
      image_url: '',
      rating: 0,
    })
    setEditingId(null)
  }

  const createProduct = async () => {
    if (!form.name.trim()) return

    setSaving(true)

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name: form.name,
          description: form.description,
          category: form.category,
          price: form.price,
          image_url: form.image_url,
          rating: form.rating,
        },
      ])
      .select()

    if (!error && data) {
      setProducts([data[0], ...products])
      resetForm()
    }

    setSaving(false)
  }

  const updateProduct = async () => {
    if (!editingId || !form.name.trim()) return

    setSaving(true)

    const { error } = await supabase
      .from('products')
      .update({
        name: form.name,
        description: form.description,
        category: form.category,
        price: form.price,
        image_url: form.image_url,
        rating: form.rating,
      })
      .eq('id', editingId)

    if (!error) {
      setProducts(products.map((p) => (p.id === editingId ? { ...p, ...form } : p)))
      resetForm()
    }

    setSaving(false)
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return

    setDeletingId(id)

    const { error } = await supabase.from('products').delete().eq('id', id)

    if (!error) {
      setProducts(products.filter((p) => p.id !== id))
    }

    setDeletingId(null)
  }

  const startEdit = (p: Product) => {
    setEditingId(p.id)
    setForm({
      name: p.name,
      description: p.description || '',
      category: p.category || '',
      price: p.price || 0,
      image_url: p.image_url || '',
      rating: p.rating || 0,
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const categories = useMemo(() => {
    return [
      'all',
      ...Array.from(
        new Set(products.map((p) => p.category?.trim()).filter(Boolean) as string[])
      ),
    ]
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const matchesSearch =
        (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(search.toLowerCase())

      const matchesCategory =
        categoryFilter === 'all' ||
        (p.category || '').toLowerCase() === categoryFilter.toLowerCase()

      return matchesSearch && matchesCategory
    })

    if (sortBy === 'priceHigh') {
      list = [...list].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    }

    if (sortBy === 'priceLow') {
      list = [...list].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    }

    if (sortBy === 'rating') {
      list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    }

    return list
  }, [products, search, categoryFilter, sortBy])

  const totalValue = products.reduce((sum, p) => sum + (p.price ?? 0), 0)
  const avgRating =
    products.length > 0
      ? products.reduce((sum, p) => sum + (p.rating ?? 0), 0) / products.length
      : 0

  return (
    <>
      <Navbar cartCount={0} />

      <main className="min-h-screen bg-background overflow-hidden">
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 left-10 h-64 w-64 rounded-full bg-white/60 blur-3xl" />
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="relative max-w-6xl mx-auto px-4 py-14 md:py-20"
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-2 text-sm mb-5 backdrop-blur"
            >
              <Sparkles className="w-4 h-4" />
              Admin control center
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-6xl font-bold tracking-tight mb-4"
            >
              Admin Dashboard
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-primary-foreground/85 max-w-2xl text-lg"
            >
              Create, edit, organize, and monitor your product catalog from one
              polished dashboard.
            </motion.p>
          </motion.div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
          >
            <StatCard icon={Package} label="Products" value={products.length} />
            <StatCard icon={Layers} label="Categories" value={categories.length - 1} />
            <StatCard icon={DollarSign} label="Catalog Value" value={`$${totalValue.toFixed(0)}`} />
            <StatCard icon={Star} label="Avg Rating" value={avgRating.toFixed(1)} />
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="bg-white border border-border rounded-3xl p-6 md:p-8 mb-10 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  {editingId ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Fill in the product details below.
                </p>
              </div>

              {editingId && (
                <Button variant="outline" onClick={resetForm} className="rounded-xl">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Name">
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Product name"
                    className="rounded-xl"
                  />
                </Field>

                <Field label="Category">
                  <Input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Shoes, Electronics..."
                    className="rounded-xl"
                  />
                </Field>

                <Field label="Price">
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="rounded-xl"
                  />
                </Field>

                <Field label="Rating">
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                    className="rounded-xl"
                  />
                </Field>

                <Field label="Image URL" className="md:col-span-2">
                  <Input
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://..."
                    className="rounded-xl"
                  />
                </Field>

                <Field label="Description" className="md:col-span-2">
                  <Input
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Short product description"
                    className="rounded-xl"
                  />
                </Field>
              </div>

              <div className="rounded-3xl border border-dashed border-border bg-secondary/60 p-4 flex flex-col justify-between">
                <div className="aspect-square rounded-2xl bg-white overflow-hidden border border-border flex items-center justify-center">
                  {form.image_url ? (
                    <img
                      src={form.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="w-10 h-10 mx-auto mb-3" />
                      <p className="text-sm">Image preview</p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={editingId ? updateProduct : createProduct}
                  disabled={saving || !form.name.trim()}
                  className="w-full mt-4 rounded-xl"
                  size="lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editingId ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Product
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Product
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="bg-white border border-border rounded-3xl p-5 mb-6 shadow-sm"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>

              <div className="relative">
                <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background pl-10 pr-3 text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All categories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="newest">Sort: Newest</option>
                <option value="priceHigh">Sort: Price high to low</option>
                <option value="priceLow">Sort: Price low to high</option>
                <option value="rating">Sort: Rating</option>
              </select>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading products...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-border rounded-3xl">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold">No products found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try changing your filters or create a new product.
              </p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="space-y-4"
            >
              <AnimatePresence>
                {filtered.map((p) => (
                  <motion.div
                    layout
                    key={p.id}
                    variants={fadeUp}
                    exit={{ opacity: 0, x: -40, scale: 0.97 }}
                    whileHover={{ y: -3 }}
                    className="bg-white border border-border rounded-3xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={p.image_url || '/placeholder.png'}
                        alt={p.name}
                        className="w-16 h-16 rounded-2xl object-cover border bg-secondary shrink-0"
                      />

                      <div className="min-w-0">
                        <h3 className="font-bold truncate">{p.name}</h3>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <span>{p.category || 'No category'}</span>
                          <span>•</span>
                          <span className="font-semibold text-primary">
                            ${p.price ?? 0}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {p.rating ?? 0}
                          </span>
                        </div>

                        {p.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {p.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(p)}
                        className="rounded-xl"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteProduct(p.id)}
                        disabled={deletingId === p.id}
                        className="rounded-xl"
                      >
                        {deletingId === p.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </main>

      <Footer />
    </>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any
  label: string
  value: string | number
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4 }}
      className="bg-white border border-border rounded-3xl p-5 shadow-sm"
    >
      <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <Icon className="w-5 h-5" />
      </div>

      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </motion.div>
  )
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-semibold">{label}</label>
      {children}
    </div>
  )
}