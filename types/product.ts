// Centralized product/order types used across the marketplace.
import type { ShopSummary } from '@/lib/sellers'

export type ProductStatus = 'active' | 'draft' | 'archived'

export interface DbProduct {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number | null
  image_url: string | null
  created_at: string | null
  // Marketplace columns
  seller_id: string | null
  stock: number
  status: ProductStatus
  is_featured: boolean
  compare_at_price: number | null
}

// What the UI normally consumes. Adds derived fields like rating + a
// guaranteed image string for <Image>, and a compact shop summary for
// "Sold by ..." cards.
export interface Product extends DbProduct {
  rating: number
  review_count?: number
  image: string
  seller?: ShopSummary | null
}

// Re-export for convenience so existing imports of `SellerSummary` keep
// working (it's now an alias for `ShopSummary`).
export type SellerSummary = ShopSummary

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type FulfillmentStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface OrderRow {
  id: string
  user_id: string | null
  total_price: number | null
  status: OrderStatus | null
  created_at: string | null
}

export interface OrderItemRow {
  id: string
  order_id: string | null
  product_id: string | null
  seller_id: string | null
  quantity: number | null
  price: number | null
  fulfillment_status: FulfillmentStatus
}
