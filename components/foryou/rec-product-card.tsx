'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, ShoppingBag } from 'lucide-react'
import type { RecommendedProduct } from '@/lib/recommender'

interface RecProductCardProps {
  product: RecommendedProduct
  // Optional badge label (e.g., the source name "content" or "collaborative")
  badge?: string
}

/**
 * Compact product card used in the For You sections. Shows the product image,
 * name, price, and an "explanation chip" pulled from the engine's XAI layer.
 */
export function RecProductCard({ product, badge }: RecProductCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 250, damping: 18 }}
      className="group h-full flex flex-col bg-white rounded-2xl border border-border/60 overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
    >
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-square bg-secondary/50 overflow-hidden">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
          {badge && (
            <span className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full backdrop-blur-sm">
              {badge}
            </span>
          )}
        </div>
      </Link>

      <div className="flex-1 flex flex-col p-3 gap-2">
        {product.category && (
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {product.category}
          </span>
        )}
        <Link href={`/product/${product.id}`} className="hover:text-primary transition-colors">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2">{product.name}</h3>
        </Link>

        {/* Explanation chip — from the engine's XAI layer. Keeps recs trustworthy. */}
        {product.explanation && (
          <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground bg-secondary/40 rounded-lg px-2 py-1.5">
            <Sparkles className="w-3 h-3 mt-0.5 text-primary shrink-0" />
            <span className="line-clamp-2">{product.explanation}</span>
          </div>
        )}

        <div className="mt-auto pt-1 flex items-center justify-between">
          {product.price !== null && (
            <span className="font-bold text-primary text-base">
              ${Number(product.price).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
