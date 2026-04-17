'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, X, Search } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface NavbarProps {
  cartCount?: number
}

export function Navbar({ cartCount = 0 }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <div className="text-xl font-bold tracking-tight text-foreground">
            ModernShop
          </div>
        </Link>

        {/* Search Bar - Hidden on Mobile */}
        <div className="hidden md:flex flex-1 max-w-xs">
          <div className="relative w-full">
            <Input
              type="search"
              placeholder="Search products..."
              className="w-full pl-10 text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/products"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Products
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Login
          </Link>
        </div>

        {/* Cart and Menu */}
        <div className="flex items-center gap-3">
          <Link href="/cart">
            <Button
              variant="ghost"
              size="sm"
              className="relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-white">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full pl-10 text-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>

            <Link
              href="/products"
              className="block text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Products
            </Link>
            <Link
              href="/login"
              className="block text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
