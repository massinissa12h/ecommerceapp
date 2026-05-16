// Centralized product/seller types used across the marketplace.

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
// guaranteed image string for <Image>.
export interface Product extends DbProduct {
  rating: number
  review_count?: number
  image: string
  seller?: SellerSummary | null
}

export interface SellerSummary {
  id: string
  username: string | null
  shop_name: string | null
  shop_slug: string | null
  avatar_url: string | null
  is_seller: boolean
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
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
