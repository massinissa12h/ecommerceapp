'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { supabase } from '@/lib/supabaseClient'
import { fetchSellers } from '@/lib/sellers'
import { Button } from '@/components/ui/button'
import { Heart, Loader2 } from 'lucide-react'
import { useCart } from '../hooks/useCart'
import { useWishlist } from '../hooks/useWishlist'

export default function WishlistPage() {
  const router = useRouter()
  const { cartCount, addToCart } = useCart()
  const { wishlistIds, toggleWishlist } = useWishlist()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) {
        router.replace('/login?next=/wishlist')
        return
      }
      const { data } = await supabase
        .from('wishlist')
        .select('product:products ( * )')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      const rows = ((data ?? []) as any[]).map((r) => r.product).filter(Boolean)
      const sellerMap = await fetchSellers(rows.map((r: any) => r.seller_id))
      const enriched = rows.map((p: any) => ({
        ...p,
        image: p.image_url ?? '',
        rating: 0,
        seller: p.seller_id ? sellerMap[p.seller_id] : null,
      }))
      if (!cancelled) {
        setProducts(enriched)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar cartCount={cartCount} />
      <main className="flex-1">
        <section className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1 inline-flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" />
              Saved for later
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Your wishlist
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {products.length} item{products.length === 1 ? '' : 's'} you&apos;ve saved.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 rounded-xl border border-dashed border-border bg-card">
              <Heart className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <h2 className="font-semibold text-lg">Your wishlist is empty</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Tap the heart on any product to save it here.
              </p>
              <Link href="/products">
                <Button className="mt-5">Browse products</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={() => addToCart(p.id)}
                  onToggleWishlist={() => toggleWishlist(p.id)}
                  wishlisted={wishlistIds.has(p.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
