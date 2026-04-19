'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { mockProducts, Product } from '@/lib/mockProducts'
import { mockUsers, User } from '@/lib/mockUsers'
import { ProductForm } from '@/components/admin/product-form'

import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Users,
  Package,
  ChevronDown,
} from 'lucide-react'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'users'>('products')
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [expandedUserRole, setExpandedUserRole] = useState<string | null>(null)

  // Filter products
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter users
  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Product handlers
  const handleCreateProduct = (product: Product) => {
    setProducts([...products, { ...product, id: Date.now().toString() }])
    setShowProductForm(false)
  }

  const handleUpdateProduct = (product: Product) => {
    setProducts(products.map((p) => (p.id === product.id ? product : p)))
    setEditingProduct(null)
    setShowProductForm(false)
  }

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter((p) => p.id !== id))
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setShowProductForm(true)
  }

  const handleCloseProductForm = () => {
    setShowProductForm(false)
    setEditingProduct(null)
  }

  // User handlers
  const handleToggleUserRole = (userId: string) => {
    setUsers(
      users.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            role: u.role === 'admin' ? 'customer' : 'admin',
          }
        }
        return u
      })
    )
    setExpandedUserRole(null)
  }

  const handleToggleUserStatus = (userId: string) => {
    setUsers(
      users.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            status: u.status === 'active' ? 'banned' : 'active',
          }
        }
        return u
      })
    )
  }

  return (
    <>
      <Navbar cartCount={0} />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage products and users for your store
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-border">
            <button
              onClick={() => {
                setActiveTab('products')
                setSearchQuery('')
              }}
              className={`pb-4 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'products'
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Products ({products.length})
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('users')
                setSearchQuery('')
              }}
              className={`pb-4 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users ({users.length})
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder={
                  activeTab === 'products'
                    ? 'Search products by name or category...'
                    : 'Search users by name or email...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
              />
            </div>
          </div>

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <Button
                onClick={() => setShowProductForm(true)}
                size="lg"
                className="gap-2"
              >
                <Plus className="w-5 h-5" />
                Create New Product
              </Button>

              {/* Products Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="text-left px-6 py-4 font-semibold text-foreground">
                          Product
                        </th>
                        <th className="text-left px-6 py-4 font-semibold text-foreground">
                          Category
                        </th>
                        <th className="text-left px-6 py-4 font-semibold text-foreground">
                          Price
                        </th>
                        <th className="text-left px-6 py-4 font-semibold text-foreground">
                          Rating
                        </th>
                        <th className="text-left px-6 py-4 font-semibold text-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <tr
                            key={product.id}
                            className="border-b border-border hover:bg-muted/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-10 h-10 rounded object-cover"
                                />
                                <span className="font-medium text-foreground">
                                  {product.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                              {product.category}
                            </td>
                            <td className="px-6 py-4 font-semibold text-foreground">
                              ${product.price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                <span className="text-foreground">
                                  {product.rating}
                                </span>
                                <span className="text-yellow-500">★</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditProduct(product)}
                                  className="p-2 hover:bg-muted rounded transition-colors text-primary"
                                  title="Edit product"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteProduct(product.id)
                                  }
                                  className="p-2 hover:bg-muted rounded transition-colors text-destructive"
                                  title="Delete product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center">
                            <p className="text-muted-foreground">
                              No products found matching your search.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Users Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="text-left px-6 py-4 font-semibold text-foreground">
                          User
                        </th>
                        <th className="text-left px-6 py-4 font-semibold text-foreground">
                          Email
                        </th>
                        <th className="text-left px-6 py-4 font-semibold text-foreground">
                          Role
                        </th>
                        <th className="text-left px-6 py-4 font-semibold text-foreground">
                          Status
                        </th>
                        <th className="text-left px-6 py-4 font-semibold text-foreground">
                          Orders
                        </th>
                        <th className="text-left px-6 py-4 font-semibold text-foreground">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b border-border hover:bg-muted/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <span className="font-medium text-foreground">
                                {user.name}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                              {user.email}
                            </td>
                            <td className="px-6 py-4">
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setExpandedUserRole(
                                      expandedUserRole === user.id
                                        ? null
                                        : user.id
                                    )
                                  }
                                  className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
                                    user.role === 'admin'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-secondary text-secondary-foreground'
                                  }`}
                                >
                                  {user.role}
                                  <ChevronDown className="w-4 h-4" />
                                </button>

                                {expandedUserRole === user.id && (
                                  <div className="absolute top-full mt-1 bg-card border border-border rounded shadow-lg z-10">
                                    {user.role === 'customer' && (
                                      <button
                                        onClick={() =>
                                          handleToggleUserRole(user.id)
                                        }
                                        className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                                      >
                                        Make Admin
                                      </button>
                                    )}
                                    {user.role === 'admin' && (
                                      <button
                                        onClick={() =>
                                          handleToggleUserRole(user.id)
                                        }
                                        className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                                      >
                                        Make Customer
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() =>
                                  handleToggleUserStatus(user.id)
                                }
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                  user.status === 'active'
                                    ? 'bg-green-100/20 text-green-700 hover:bg-green-100/30'
                                    : 'bg-red-100/20 text-red-700 hover:bg-red-100/30'
                                }`}
                              >
                                {user.status}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-foreground">
                              {user.totalOrders}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                              {new Date(user.joinDate).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center">
                            <p className="text-muted-foreground">
                              No users found matching your search.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          initialProduct={editingProduct || undefined}
          onSubmit={
            editingProduct ? handleUpdateProduct : handleCreateProduct
          }
          onCancel={handleCloseProductForm}
        />
      )}

      <Footer />
    </>
  )
}
