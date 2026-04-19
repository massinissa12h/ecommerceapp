'use client'

import { useState } from 'react'
import { Product, categories } from '@/lib/mockProducts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface ProductFormProps {
  initialProduct?: Product
  onSubmit: (product: Product) => void
  onCancel: () => void
}

export function ProductForm({
  initialProduct,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [formData, setFormData] = useState<Product>(
    initialProduct || {
      id: Date.now().toString(),
      name: '',
      description: '',
      category: 'electronics',
      price: 0,
      image: '',
      rating: 5,
      tags: [],
    }
  )
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (!formData.description.trim())
      newErrors.description = 'Description is required'
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0'
    if (!formData.image.trim()) newErrors.image = 'Image URL is required'
    if (formData.rating < 0 || formData.rating > 5)
      newErrors.rating = 'Rating must be between 0 and 5'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold text-foreground">
            {initialProduct ? 'Edit Product' : 'Create New Product'}
          </h2>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Product Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter product name"
              className="w-full"
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter product description"
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">
                {errors.description}
              </p>
            )}
          </div>

          {/* Category and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Price ($) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseFloat(e.target.value) })
                }
                placeholder="0.00"
                className="w-full"
              />
              {errors.price && (
                <p className="text-sm text-destructive mt-1">{errors.price}</p>
              )}
            </div>
          </div>

          {/* Rating and Image URL */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Rating (0-5) *
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={(e) =>
                  setFormData({ ...formData, rating: parseFloat(e.target.value) })
                }
                placeholder="5"
                className="w-full"
              />
              {errors.rating && (
                <p className="text-sm text-destructive mt-1">{errors.rating}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Image URL *
              </label>
              <Input
                type="text"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                placeholder="https://..."
                className="w-full"
              />
              {errors.image && (
                <p className="text-sm text-destructive mt-1">{errors.image}</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="Add a tag and press Enter"
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addTag}
              >
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <div
                    key={tag}
                    className="bg-muted px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end border-t border-border pt-6">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {initialProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
