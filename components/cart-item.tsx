import Image from 'next/image'
import { Product } from '@/lib/mockProducts'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface CartItemProps {
  product: Product
  quantity: number
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}

export function CartItem({
  product,
  quantity,
  onQuantityChange,
  onRemove,
}: CartItemProps) {
  const total = product.price * quantity

  return (
    <div className="flex gap-4 py-4 border-b border-border last:border-b-0">
      {/* Product Image */}
      <div className="flex-shrink-0">
        <div className="relative w-24 h-24 bg-secondary rounded-lg overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100px, 96px"
          />
        </div>
      </div>

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-foreground">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            ${product.price.toFixed(2)} each
          </p>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="w-8 h-8 rounded border border-border hover:bg-secondary transition-colors text-sm"
          >
            -
          </button>
          <span className="w-8 text-center text-sm font-medium">
            {quantity}
          </span>
          <button
            onClick={() => onQuantityChange(quantity + 1)}
            className="w-8 h-8 rounded border border-border hover:bg-secondary transition-colors text-sm"
          >
            +
          </button>
        </div>
      </div>

      {/* Price and Remove */}
      <div className="flex flex-col items-end justify-between">
        <div className="text-right">
          <p className="font-bold text-lg text-foreground">
            ${total.toFixed(2)}
          </p>
        </div>
        <Button
          onClick={onRemove}
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
