'use client'

import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'
import type { RecommendedProduct } from '@/lib/recommender'
import { RecProductCard } from './rec-product-card'

interface RecSectionProps {
  title: string
  subtitle?: string
  icon: LucideIcon
  accent?: string
  loading: boolean
  error?: string | null
  products: RecommendedProduct[]
  emptyMessage?: string
  badge?: string
}

export function RecSection({
  title,
  subtitle,
  icon: Icon,
  accent = 'text-primary',
  loading,
  error,
  products,
  emptyMessage = 'Nothing here yet.',
  badge,
}: RecSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center ${accent}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : loading ? (
        <SectionSkeleton />
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-secondary/30 px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((p) => <RecProductCard key={p.id} product={p} badge={badge} />)}
        </div>
      )}
    </motion.section>
  )
}

function SectionSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/60 overflow-hidden bg-white">
          <div className="aspect-square bg-secondary/60 animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-3 w-1/3 bg-secondary/70 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-secondary/70 rounded animate-pulse" />
            <div className="h-3 w-full bg-secondary/50 rounded animate-pulse" />
            <div className="h-5 w-1/3 bg-secondary/70 rounded animate-pulse mt-2" />
          </div>
        </div>
      ))}
    </div>
  )
}
