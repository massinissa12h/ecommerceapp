import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/lib/mockProducts'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="group flex flex-col h-full bg-white rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-colors duration-200">
      {/* Image Container */}
      <Link href={`/product/${product.id}`} className="relative overflow-hidden bg-secondary h-64">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </Link>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Category Tag */}
        <span className="inline-block w-fit text-xs font-medium text-primary bg-secondary px-2 py-1 rounded mb-2 capitalize">
          {product.category}
        </span>

        {/* Name */}
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating)
                    ? 'fill-primary text-primary'
                    : 'text-border'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({product.rating})</span>
        </div>

        {/* Price */}
        <p className="font-bold text-lg text-foreground mb-4">
          ${product.price.toFixed(2)}
        </p>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <Link href={`/product/${product.id}`}>
            <Button variant="outline" className="w-full text-sm" size="sm">
              View
            </Button>
          </Link>
          <Button
            onClick={() => onAddToCart?.(product)}
            className="w-full text-sm"
            size="sm"
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  )
}
