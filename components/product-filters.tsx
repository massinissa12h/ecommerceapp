'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { categories } from '@/lib/mockProducts'

interface ProductFiltersProps {
  onFilterChange: (filters: FilterState) => void
  onSearchChange: (search: string) => void
}

export interface FilterState {
  categories: string[]
  priceRange: [number, number]
  minRating: number
}

export function ProductFilters({ onFilterChange, onSearchChange }: ProductFiltersProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [minRating, setMinRating] = useState(0)
  const [searchInput, setSearchInput] = useState('')

  const handleCategoryChange = (category: string, checked: boolean) => {
    const updated = checked
      ? [...selectedCategories, category]
      : selectedCategories.filter(c => c !== category)
    setSelectedCategories(updated)
    onFilterChange({
      categories: updated,
      priceRange,
      minRating,
    })
  }

  const handlePriceChange = (value: [number, number]) => {
    setPriceRange(value)
    onFilterChange({
      categories: selectedCategories,
      priceRange: value,
      minRating,
    })
  }

  const handleRatingChange = (rating: number) => {
    setMinRating(rating)
    onFilterChange({
      categories: selectedCategories,
      priceRange,
      minRating: rating,
    })
  }

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    onSearchChange(value)
  }

  const resetFilters = () => {
    setSelectedCategories([])
    setPriceRange([0, 500])
    setMinRating(0)
    setSearchInput('')
    onFilterChange({
      categories: [],
      priceRange: [0, 500],
      minRating: 0,
    })
    onSearchChange('')
  }

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 bg-white rounded-lg border border-border p-6 h-fit lg:sticky lg:top-24">
      {/* Search */}
      <div className="mb-6">
        <Label htmlFor="search" className="text-sm font-semibold mb-2 block">
          Search Products
        </Label>
        <Input
          id="search"
          type="text"
          placeholder="Search..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h3 className="font-semibold text-sm text-foreground mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center gap-2">
              <Checkbox
                id={category}
                checked={selectedCategories.includes(category)}
                onCheckedChange={(checked) =>
                  handleCategoryChange(category, checked as boolean)
                }
              />
              <Label
                htmlFor={category}
                className="text-sm font-normal cursor-pointer capitalize"
              >
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="font-semibold text-sm text-foreground mb-4">Price Range</h3>
        <Slider
          value={priceRange}
          onValueChange={handlePriceChange}
          min={0}
          max={500}
          step={10}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}</span>
        </div>
      </div>

      {/* Rating Filter */}
      <div className="mb-6">
        <h3 className="font-semibold text-sm text-foreground mb-3">Minimum Rating</h3>
        <div className="space-y-2">
          {[0, 3, 4, 4.5].map((rating) => (
            <button
              key={rating}
              onClick={() => handleRatingChange(rating)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                minRating === rating
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {rating === 0 ? 'All Ratings' : `${rating}+ Stars`}
            </button>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <Button
        onClick={resetFilters}
        variant="outline"
        className="w-full text-sm"
      >
        Reset Filters
      </Button>
    </aside>
  )
}
