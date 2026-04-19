'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Edit2, Trash2 } from 'lucide-react'

type Product = {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number | null
  image_url: string | null
  rating: number | null
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    image_url: '',
    rating: 0,
  })

  // ---------------- FETCH ----------------
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

  // ---------------- RESET ----------------
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

  // ---------------- CREATE ----------------
  const createProduct = async () => {
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
  }

  // ---------------- UPDATE ----------------
  const updateProduct = async () => {
    if (!editingId) return

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
      setProducts(
        products.map((p) =>
          p.id === editingId ? { ...p, ...form } : p
        )
      )
      resetForm()
    }
  }

  // ---------------- DELETE ----------------
  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (!error) {
      setProducts(products.filter((p) => p.id !== id))
    }
  }

  // ---------------- EDIT ----------------
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
  }

  // ---------------- FILTER ----------------
  const filtered = products.filter((p) =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Navbar cartCount={0} />

      <main className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-10">

          {/* HEADER */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your products easily
            </p>
          </div>

          {/* SEARCH */}
          <div className="flex items-center gap-3 mb-8">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* FORM */}
          <div className="bg-card border border-border rounded-xl p-6 mb-10 shadow-sm">

            <h2 className="text-lg font-semibold mb-1">
              {editingId ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Fill in product details below
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* NAME */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>

              {/* CATEGORY */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </div>

              {/* PRICE */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Price</label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                />
              </div>

              {/* RATING */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Rating</label>
                <Input
                  type="number"
                  value={form.rating}
                  onChange={(e) =>
                    setForm({ ...form, rating: Number(e.target.value) })
                  }
                />
              </div>

              {/* IMAGE */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Image URL</label>
                <Input
                  value={form.image_url}
                  onChange={(e) =>
                    setForm({ ...form, image_url: e.target.value })
                  }
                />
              </div>

              {/* DESCRIPTION */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 mt-6">
              {editingId && (
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}

              <Button
                onClick={editingId ? updateProduct : createProduct}
              >
                {editingId ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </div>

          {/* LIST */}
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-4">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="bg-card border border-border rounded-xl p-5 flex justify-between items-center hover:shadow-sm transition"
                >

                  {/* LEFT */}
                  <div className="flex items-center gap-4">

                    <img
                      src={p.image_url || '/placeholder.png'}
                      className="w-14 h-14 rounded-lg object-cover border"
                    />

                    <div>
                      <h3 className="font-semibold">{p.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {p.category}
                      </p>
                      <p className="text-sm font-medium">
                        ${p.price}
                      </p>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(p)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteProduct(p.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </>
  )
}