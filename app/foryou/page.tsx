'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  rating: number
  category: string
}

// Mock products
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    description: 'High-quality sound with noise cancellation',
    price: 199.99,
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    rating: 4.8,
    category: 'Electronics',
  },
  {
    id: '2',
    name: 'Classic Analog Watch',
    description: 'Elegant timepiece with leather strap',
    price: 149.99,
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    rating: 4.6,
    category: 'Accessories',
  },
  {
    id: '3',
    name: 'Minimalist Backpack',
    description: 'Durable and stylish everyday backpack',
    price: 89.99,
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    rating: 4.7,
    category: 'Fashion',
  },
  {
    id: '4',
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable and sustainable clothing',
    price: 34.99,
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    rating: 4.5,
    category: 'Fashion',
  },
]

export default function ForYouPage() {
  const [user, setUser] = useState<any>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      const currentUser = data.session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', currentUser.id)
          .single()

        setUsername(userData?.username ?? null)
      }

      setLoading(false)
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          const { data: userData } = await supabase
            .from('users')
            .select('username')
            .eq('id', currentUser.id)
            .single()

          setUsername(userData?.username ?? null)
        } else {
          setUsername(null)
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ✅ Navbar */}
      <Navbar />

      <main className="flex-1">

        {!user ? (
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-3xl font-bold mb-4">For You</h1>
            <p className="text-muted-foreground mb-8">
              Please sign in to see personalized recommendations
            </p>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="container mx-auto px-4 py-12">

            {/* Header */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase">
                  Curated For You
                </span>
              </div>

              <h1 className="text-4xl font-bold mb-2">
                {username ? `Welcome back, ${username}` : 'For You'}
              </h1>

              <p className="text-muted-foreground">
                Discover products based on your interests
              </p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {MOCK_PRODUCTS.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <div className="bg-card rounded-xl shadow hover:shadow-lg transition overflow-hidden">

                    <div className="relative w-full h-52">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="p-4">
                      <span className="text-xs text-primary">
                        {product.category}
                      </span>

                      <h3 className="font-semibold mt-1">
                        {product.name}
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        {product.description}
                      </p>

                      <div className="flex justify-between mt-3">
                        <span className="font-bold text-primary">
                          ${product.price}
                        </span>

                        <span className="text-sm">
                          ⭐ {product.rating}
                        </span>
                      </div>
                    </div>

                  </div>
                </Link>
              ))}
            </div>

          </div>
        )}

      </main>

      {/* ✅ Footer */}
      <Footer />

    </div>
  )
}