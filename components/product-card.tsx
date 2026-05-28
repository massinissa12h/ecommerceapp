'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, Star, ShoppingBag, ShoppingCart, Truck } from 'lucide-react'
import { useState } from 'react'
import { formatPrice } from '@/lib/format'

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
  const [wishlistedLocal, setWishlistedLocal] = useState(wishlisted ?? false)
  const image = product.image || product.image_url || ''
  const price = Number(product.price ?? 0)
  const compareAt = product.compare_at_price ?? null
  const hasDiscount = compareAt != null && compareAt > price
  const discountPct = hasDiscount ? Math.round(((compareAt! - price) / compareAt!) * 100) : 0
  const rating = Number(product.rating ?? 0)
  const lowStock = typeof product.stock === 'number' && product.stock > 0 && product.stock <= 5
  const outOfStock = typeof product.stock === 'number' && product.stock === 0
  const freeShipping = price >= 10

  const sellerName =
    product.seller?.display_name || product.seller?.name ||
    product.seller?.shop_name || product.seller?.username || 'Souqly'

  const sellerHref =
    product.seller?.href ||
    (product.seller?.slug ? `/shop/${product.seller.slug}`
      : product.seller?.shop_slug ? `/shop/${product.seller.shop_slug}`
      : product.seller?.id ? `/shop/${product.seller.id}`
      : '/products')

  return (
    <article className="group relative flex flex-col rounded-lg overflow-hidden border border-border bg-card hover:shadow-elevated hover:border-[#92B775] transition-all duration-150">
      {/* Image */}
      <Link href={`/product/${product.id}`} className="relative block overflow-hidden bg-[#F3E8D3]" style={{ paddingBottom: '100%' }}>
        <div className="absolute inset-0">
          {image && !imgErr ? (
            <Image
              src={image}
              alt={product.name}
              fill
              unoptimized
              onError={() => setImgErr(true)}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center" style={{ color: '#133215', opacity: 0.3 }}>
              <ShoppingBag className="w-10 h-10" />
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && discountPct >= 5 && (
            <span className="px-2 py-0.5 rounded text-[11px] font-bold leading-none text-white" style={{ backgroundColor: '#133215' }}>
              -{discountPct}%
            </span>
          )}
          {product.is_featured && (
            <span className="px-2 py-0.5 rounded text-[11px] font-bold leading-none text-[#133215]" style={{ backgroundColor: '#92B775' }}>
              Featured
            </span>
          )}
          {outOfStock && (
            <span className="px-2 py-0.5 rounded text-[11px] font-bold leading-none bg-muted text-muted-foreground">
              Sold out
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            setWishlistedLocal(p => !p)
            onToggleWishlist?.(product)
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          aria-label="Save to wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${wishlistedLocal ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
        </button>
      </Link>

      {/* Content */}
      <div className="flex flex-col p-3 flex-1">
        {/* Price */}
        <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
          <span className="text-base font-bold leading-none" style={{ color: '#133215' }}>
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through leading-none">
              {formatPrice(compareAt)}
            </span>
          )}
        </div>

        {/* Stars */}
        {rating > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className="w-3 h-3"
                  style={{
                    fill: s <= Math.round(rating) ? '#92B775' : 'transparent',
                    color: s <= Math.round(rating) ? '#92B775' : '#ccc',
                  }}
                />
              ))}
            </div>
            {product.review_count ? (
              <span className="text-[11px] text-muted-foreground">({product.review_count})</span>
            ) : null}
          </div>
        )}

        {/* Name */}
        <Link href={`/product/${product.id}`}>
          <h3 className="text-xs font-medium text-foreground line-clamp-2 leading-snug hover:text-[#133215] mb-1" style={{ color: '#133215' }}>
            {product.name}
          </h3>
        </Link>

        {/* Seller */}
        <Link href={sellerHref} className="text-[11px] text-muted-foreground hover:text-[#133215] transition-colors mb-2 truncate">
          {sellerName}
        </Link>

        {/* Free shipping / low stock */}
        {freeShipping && !outOfStock && (
          <p className="text-[11px] font-medium flex items-center gap-0.5 mb-2" style={{ color: '#4a7a2e' }}>
            <Truck className="w-3 h-3" /> Free shipping
          </p>
        )}
        {lowStock && (
          <p className="text-[11px] font-semibold mb-2" style={{ color: '#b45309' }}>
            Only {product.stock} left!
          </p>
        )}

        {/* Add to cart */}
        {onAddToCart && !outOfStock ? (
          <button
            onClick={() => onAddToCart(product)}
            className="mt-auto w-full text-xs font-semibold py-2 rounded flex items-center justify-center gap-1.5 transition-colors"
            style={{ backgroundColor: '#133215', color: '#F3E8D3' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1e4a20')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#133215')}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Add to Cart
          </button>
        ) : outOfStock ? (
          <div className="mt-auto w-full text-xs font-medium py-2 rounded bg-muted text-muted-foreground text-center">
            Out of stock
          </div>
        ) : null}
      </div>
    </article>
  )
}
