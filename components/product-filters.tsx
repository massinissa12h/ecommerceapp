'use client'

import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabaseClient'
import { Star, RotateCcw, Tag, DollarSign, LayoutList } from 'lucide-react'

interface ProductFiltersProps {
  onFilterChange: (filters: FilterState) => void
  onSearchChange: (search: string) => void
}

export interface FilterState {
  categories: string[]
  priceRange: [number, number]
  minRating: number
}

const RATING_OPTIONS = [
  { value: 0, label: 'All Ratings' },
  { value: 3, label: '3+ Stars' },
  { value: 4, label: '4+ Stars' },
  { value: 4.5, label: '4.5+ Stars' },
]

export function ProductFilters({ onFilterChange, onSearchChange }: ProductFiltersProps) {
  const [categories, setCategories] = useState<string[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000])
  const [minRating, setMinRating] = useState(0)

  // ── Fetch distinct categories from Supabase ──────────────────────────
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true)
      const { data } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null)

      if (data) {
        const unique = [...new Set(
          data
            .map((p: { category: string | null }) => p.category)
            .filter((c): c is string => !!c)
            .map((c) => c.trim().toLowerCase())
        )].sort()
        setCategories(unique)
      }
      setLoadingCategories(false)
    }
    fetchCategories()
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────
  const emit = (
    cats: string[],
    price: [number, number],
    rating: number
  ) => {
    onFilterChange({ categories: cats, priceRange: price, minRating: rating })
  }

  const handleCategoryChange = (category: string, checked: boolean) => {
    const updated = checked
      ? [...selectedCategories, category]
      : selectedCategories.filter((c) => c !== category)
    setSelectedCategories(updated)
    emit(updated, priceRange, minRating)
  }

  const handlePriceChange = (value: [number, number]) => {
    setPriceRange(value)
    emit(selectedCategories, value, minRating)
  }

  const handleRatingChange = (rating: number) => {
    setMinRating(rating)
    emit(selectedCategories, priceRange, rating)
  }

  const resetFilters = () => {
    setSelectedCategories([])
    setPriceRange([0, 20000])
    setMinRating(0)
    onFilterChange({ categories: [], priceRange: [0, 20000], minRating: 0 })
    onSearchChange('')
  }

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 20000 ||
    minRating > 0

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <aside className="w-full lg:w-64 flex-shrink-0 h-fit lg:sticky lg:top-24 space-y-1">

      {/* ── Categories ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <LayoutList className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm text-foreground">Categories</h3>
          {selectedCategories.length > 0 && (
            <span className="ml-auto text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
              {selectedCategories.length}
            </span>
          )}
        </div>

        {loadingCategories ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-5 bg-secondary rounded animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-xs text-muted-foreground">No categories found</p>
        ) : (
          <div className="space-y-2.5">
            {categories.map((category) => (
              <div key={category} className="flex items-center gap-2.5">
                <Checkbox
                  id={`cat-${category}`}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={(checked) =>
                    handleCategoryChange(category, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`cat-${category}`}
                  className="text-sm font-normal cursor-pointer capitalize leading-none"
                >
                  {category}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Price Range ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm text-foreground">Price Range</h3>
        </div>

        <Slider
          value={priceRange}
          onValueChange={handlePriceChange}
          min={0}
          max={20000}
          step={10}
          className="w-full"
        />

        <div className="flex items-center justify-between mt-3">
          <div className="text-xs bg-secondary text-foreground rounded px-2 py-1 font-medium">
            ${priceRange[0]}
          </div>
          <div className="h-px flex-1 bg-border mx-2" />
          <div className="text-xs bg-secondary text-foreground rounded px-2 py-1 font-medium">
            ${priceRange[1]}
          </div>
        </div>
      </div>

      {/* ── Rating ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm text-foreground">Minimum Rating</h3>
        </div>

        <div className="space-y-1.5">
          {RATING_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleRatingChange(value)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                minRating === value
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-foreground hover:bg-secondary'
              }`}
            >
              {value > 0 && (
                <Star
                  className={`w-3.5 h-3.5 shrink-0 ${
                    minRating === value ? 'fill-primary-foreground' : 'fill-amber-400 text-amber-400'
                  }`}
                />
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Reset ───────────────────────────────────────────────────── */}
      {hasActiveFilters && (
        <Button
          onClick={resetFilters}
          variant="outline"
          className="w-full text-sm gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filters
        </Button>
      )}
    </aside>
  )
}