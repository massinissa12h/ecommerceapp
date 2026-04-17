export interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  image: string
  rating: number
  tags: string[]
}

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with active noise cancellation and 30-hour battery life.',
    category: 'electronics',
    price: 299.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
    rating: 4.8,
    tags: ['electronics', 'audio', 'wireless'],
  },
  {
    id: '2',
    name: 'Classic White Sneakers',
    description: 'Timeless white sneakers made with premium leather and comfortable cushioning.',
    category: 'shoes',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1549298881-8d7fc46e1d87?w=500&h=500&fit=crop',
    rating: 4.6,
    tags: ['shoes', 'fashion', 'casual'],
  },
  {
    id: '3',
    name: 'Minimalist Watch',
    description: 'Elegant minimalist watch with a stainless steel case and leather strap.',
    category: 'accessories',
    price: 149.99,
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500&h=500&fit=crop',
    rating: 4.7,
    tags: ['accessories', 'fashion', 'lifestyle'],
  },
  {
    id: '4',
    name: 'Tech Backpack',
    description: 'Durable backpack with multiple compartments designed for laptops and tablets.',
    category: 'accessories',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    rating: 4.5,
    tags: ['accessories', 'tech', 'travel'],
  },
  {
    id: '5',
    name: 'Black Business Blazer',
    description: 'Professional black blazer perfect for business and formal occasions.',
    category: 'fashion',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1591047139829-c91a6b3792e3?w=500&h=500&fit=crop',
    rating: 4.7,
    tags: ['fashion', 'formal', 'business'],
  },
  {
    id: '6',
    name: 'Portable Speaker',
    description: 'Compact Bluetooth speaker with exceptional sound quality and waterproof design.',
    category: 'electronics',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1589003077984-894e133da26d?w=500&h=500&fit=crop',
    rating: 4.4,
    tags: ['electronics', 'audio', 'portable'],
  },
  {
    id: '7',
    name: 'Running Shoes',
    description: 'Lightweight running shoes with advanced cushioning technology for maximum comfort.',
    category: 'shoes',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop',
    rating: 4.6,
    tags: ['shoes', 'sports', 'athletic'],
  },
  {
    id: '8',
    name: 'Smart Watch',
    description: 'Feature-rich smartwatch with fitness tracking, heart rate monitor, and notifications.',
    category: 'electronics',
    price: 249.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    rating: 4.8,
    tags: ['electronics', 'wearables', 'fitness'],
  },
  {
    id: '9',
    name: 'Vintage Camera',
    description: 'Classic vintage camera with modern functionality for photography enthusiasts.',
    category: 'electronics',
    price: 449.99,
    image: 'https://images.unsplash.com/photo-1606933248051-5ce98f4a3f2b?w=500&h=500&fit=crop',
    rating: 4.9,
    tags: ['electronics', 'photography', 'vintage'],
  },
  {
    id: '10',
    name: 'Comfortable Loafers',
    description: 'Comfortable slip-on loafers perfect for both casual and formal wear.',
    category: 'shoes',
    price: 119.99,
    image: 'https://images.unsplash.com/photo-1543163521-9efdc62db534?w=500&h=500&fit=crop',
    rating: 4.5,
    tags: ['shoes', 'casual', 'formal'],
  },
  {
    id: '11',
    name: 'Summer Dress',
    description: 'Light and breathable summer dress perfect for warm weather and vacations.',
    category: 'fashion',
    price: 69.99,
    image: 'https://images.unsplash.com/photo-1595777707802-e2d2c5cebf1c?w=500&h=500&fit=crop',
    rating: 4.6,
    tags: ['fashion', 'casual', 'summer'],
  },
  {
    id: '12',
    name: 'Wireless Charger',
    description: 'Fast wireless charging pad compatible with all Qi-enabled devices.',
    category: 'electronics',
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1591589081896-b95e1620f1b6?w=500&h=500&fit=crop',
    rating: 4.3,
    tags: ['electronics', 'charging', 'accessories'],
  },
]

export const categories = ['electronics', 'shoes', 'fashion', 'accessories']
