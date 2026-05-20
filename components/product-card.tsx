'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Heart, Star, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { formatPrice } from '@/lib/format'

// Loose shape so the card stays compatible with the old mock-style Product
// AND the marketplace Product (with seller / stock / status).
interface ProductCardProduct {
  id: string
  name: string
  description?: string | null
  category?: string | null
  price: number | null | undefined
  compare_at_price?: number | null
  image?: string
  image_url?: string | null
  rating?: number
  review_count?: number
  stock?: number
  is_featured?: boolean
  seller?: {
    id: string
    name?: string | null
    slug?: string | null
    display_name?: string
    href?: string
    /** Back-compat aliases for code that still passes the old shape. */
    shop_name?: string | null
    shop_slug?: string | null
    username?: string | null
  } | null
}

interface ProductCardProps {
  product: ProductCardProduct
  onAddToCart?: (product: ProductCardProduct) => void
  onToggleWishlist?: (product: ProductCardProduct) => void
  wishlisted?: boolean
  compact?: boolean
}

export function ProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  wishlisted,
  compact,
}: ProductCardProps) {
  const [imgErr, setImgErr] = useState(false)
  const image = product.image || product.image_url || ''
  const price = Number(product.price ?? 0)
  const compareAt = product.compare_at_price ?? null
  const hasDiscount = compareAt != null && compareAt > price
  const discountPct = hasDiscount
    ? Math.round(((compareAt! - price) / compareAt!) * 100)
    : 0
  const rating = Number(product.rating ?? 0)
  const lowStock =
    typeof product.stock === 'number' && product.stock > 0 && product.stock <= 5
  const outOfStock = typeof product.stock === 'number' && product.stock === 0
  const sellerName =
    product.seller?.display_name ||
    product.seller?.name ||
    product.seller?.shop_name ||
    product.seller?.username ||
    'Souqly'
  // Always link to /shop/... — the route resolves either a slug or a user id.
  const sellerHref =
    product.seller?.href ||
    (product.seller?.slug
      ? `/shop/${product.seller.slug}`
      : product.seller?.shop_slug
        ? `/shop/${product.seller.shop_slug}`
        : product.seller?.id
          ? `/shop/${product.seller.id}`
          : '/products')

  return (
    <article
      className={`group relative flex flex-col bg-card rounded-xl border border-border overflow-hidden transition-all duration-200 hover:border-foreground/20 hover:shadow-elevated ${
        compact ? '' : 'h-full'
      }`}
    >
      <Link
        href={`/product/${product.id}`}
        className="relative aspect-square overflow-hidden bg-secondary block"
      >
        {image && !imgErr ? (
          <Image
            src={image}
            alt={product.name}
            fill
            unoptimized
            onError={() => setImgErr(true)}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground">
            <ShoppingBag className="w-10 h-10" />
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {product.is_featured && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-foreground text-background">
              Featured
            </span>
          )}
          {hasDiscount && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-brand text-brand-foreground">
              -{discountPct}%
            </span>
          )}
          {outOfStock && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
              Sold out
            </span>
          )}
        </div>

        {onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              onToggleWishlist(product)
            }}
            className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-card/90 backdrop-blur border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Save to wishlist"
          >
            <Heart
              className={`w-4 h-4 ${wishlisted ? 'fill-destructive text-destructive' : ''}`}
            />
          </button>
        )}
      </Link>

      <div className="flex-1 p-4 flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          {product.category && (
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              {product.category}
            </span>
          )}
          {rating > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
              <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
              {product.review_count ? (
                <span>({product.review_count})</span>
              ) : null}
            </span>
          )}
        </div>

        <Link href={`/product/${product.id}`}>
          <h3 className="font-medium text-foreground hover:text-brand transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </Link>

        <Link
          href={sellerHref}
          className="mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          by {sellerName}
        </Link>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-lg font-semibold tracking-tight text-foreground">
              {formatPrice(price)}
            </p>
            {hasDiscount && (
              <p className="text-xs text-muted-foreground line-through">
                {formatPrice(compareAt)}
              </p>
            )}
            {lowStock && (
              <p className="text-[11px] text-warning font-medium mt-0.5">
                Only {product.stock} left
              </p>
            )}
          </div>

          {onAddToCart && !outOfStock && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddToCart(product)}
              className="h-9"
            >
              Add
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
