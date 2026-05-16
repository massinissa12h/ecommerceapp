'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Star,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Heart,
  Share2,
  Send,
  Pencil,
  Trash2,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react'
import { ShareToFriendsDialog } from '@/components/share-to-friends-dialog'
import { useCart } from '@/app/hooks/useCart'
import { formatPrice } from '@/lib/format'
import { ProductGallery, type GalleryView } from '@/components/product-gallery'

interface Product {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number | null
  image_url: string | null
  image: string | null
  created_at: string | null
  tags: string[]
  seller_id: string | null
  stock?: number
  compare_at_price?: number | null
}

interface SellerInfo {
  id: string
  username: string | null
  shop_name: string | null
  shop_slug: string | null
  shop_bio: string | null
  avatar_url: string | null
}

interface Review {
  id: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  user_email?: string
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

function StarPicker({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const [hovered, setHovered] = useState(0)
  const sz = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5'
  const active = hovered || value

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => !readonly && setHovered(i)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? 'cursor-default' : 'cursor-pointer'}
        >
          <Star
            className={`${sz} transition-colors ${
              i <= active
                ? 'fill-amber-400 text-amber-400'
                : 'text-border fill-transparent'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export default function ProductDetailsPage() {
  const params = useParams()
  const productId = params.id as string
  const { cartCount, addToCart } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [seller, setSeller] = useState<SellerInfo | null>(null)
  const [gallery, setGallery] = useState<GalleryView[]>([])
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  const [userId, setUserId] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [interactionLoading, setInteractionLoading] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [myReview, setMyReview] = useState<Review | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [editingReview, setEditingReview] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user.id ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId || !productId) return

    const saveSeenInteraction = async () => {
      const { error } = await supabase.from('interactions').upsert(
        {
          user_id: userId,
          product_id: productId,
          action: 'seen',
          created_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,product_id,action',
        }
      )

      if (error) {
        console.error('Failed to save seen interaction:', error)
      }
    }

    saveSeenInteraction()
  }, [userId, productId])

  const fetchProduct = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (productError) throw productError
      if (!productData) throw new Error('Product not found')

      const [{ data: tagsData }, { data: galleryRows }] = await Promise.all([
        supabase.from('product_tags').select('tag').eq('product_id', productId),
        supabase
          .from('product_images')
          .select('url, alt, position')
          .eq('product_id', productId)
          .order('position', { ascending: true }),
      ])

      const tags = (tagsData ?? []).map((t: { tag: string }) => t.tag)

      // Build the gallery: start from product_images rows, then fall back to
      // the legacy image_url if there are no rows (so old products still work).
      const galleryList: GalleryView[] = ((galleryRows ?? []) as any[]).map((r) => ({
        url: r.url,
        alt: r.alt ?? null,
      }))
      if (galleryList.length === 0 && productData.image_url) {
        galleryList.push({ url: productData.image_url, alt: productData.name })
      } else if (
        productData.image_url &&
        !galleryList.some((g) => g.url === productData.image_url)
      ) {
        // Make sure the primary cached on products.image_url leads the gallery
        galleryList.unshift({ url: productData.image_url, alt: productData.name })
      }
      setGallery(galleryList)

      setProduct({
        ...productData,
        image_url: productData.image_url ?? null,
        image: productData.image_url ?? null,
        tags,
      })

      // Resolve seller info if this product belongs to one
      if (productData.seller_id) {
        const [{ data: userRow }, { data: profileRow }] = await Promise.all([
          supabase
            .from('users')
            .select('id, username')
            .eq('id', productData.seller_id)
            .maybeSingle(),
          supabase
            .from('profiles')
            .select('shop_name, shop_slug, shop_bio, avatar_url')
            .eq('id', productData.seller_id)
            .maybeSingle(),
        ])
        if (userRow) {
          setSeller({
            id: productData.seller_id,
            username: userRow.username ?? null,
            shop_name: profileRow?.shop_name ?? null,
            shop_slug: profileRow?.shop_slug ?? null,
            shop_bio: profileRow?.shop_bio ?? null,
            avatar_url: profileRow?.avatar_url ?? null,
          })
        }
      } else {
        setSeller(null)
      }

      if (productData.category) {
        const { data: similarData } = await supabase
          .from('products')
          .select('*')
          .eq('category', productData.category)
          .neq('id', productId)
          .limit(3)

        const similarIds = (similarData ?? []).map((p: any) => p.id)
        const tagsByProduct: Record<string, string[]> = {}

        if (similarIds.length > 0) {
          const { data: similarTags } = await supabase
            .from('product_tags')
            .select('product_id, tag')
            .in('product_id', similarIds)

          similarTags?.forEach(
            ({ product_id, tag }: { product_id: string; tag: string }) => {
              if (!tagsByProduct[product_id]) tagsByProduct[product_id] = []
              tagsByProduct[product_id].push(tag)
            }
          )
        }

        setSimilarProducts(
          (similarData ?? []).map((p: any) => ({
            ...p,
            image_url: p.image_url ?? null,
            image: p.image_url ?? null,
            tags: tagsByProduct[p.id] ?? [],
          }))
        )
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to load product.')
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  useEffect(() => {
    if (!userId || !productId) return

    // The heart on the product page is the wishlist toggle — read state from
    // the wishlist table so it stays in sync with /wishlist and the cards.
    const fetchWishlistState = async () => {
      const { data } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle()
      setIsLiked(!!data)
    }
    fetchWishlistState()
  }, [userId, productId])

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true)

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const userIds = [...new Set((data ?? []).map((r: any) => r.user_id))]
      let emailMap: Record<string, string> = {}

      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds)

        usersData?.forEach((u: { id: string; email: string }) => {
          emailMap[u.id] = u.email
        })
      }

      const enriched: Review[] = (data ?? []).map((r: any) => ({
        ...r,
        user_email: emailMap[r.user_id] ?? 'Anonymous',
      }))

      setReviews(enriched)

      if (userId) {
        const mine = enriched.find((r) => r.user_id === userId) ?? null
        setMyReview(mine)

        if (mine) {
          setReviewRating(mine.rating)
          setReviewComment(mine.comment ?? '')
        }
      }
    } finally {
      setReviewsLoading(false)
    }
  }, [productId, userId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const toggleInteraction = async (_action: 'like') => {
    if (!userId) return
    setInteractionLoading(true)

    if (isLiked) {
      await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId)
      setIsLiked(false)
    } else {
      await supabase
        .from('wishlist')
        .insert({ user_id: userId, product_id: productId })
      setIsLiked(true)
      // Keep an analytics breadcrumb for the recommender (best-effort).
      supabase
        .from('interactions')
        .upsert(
          {
            user_id: userId,
            product_id: productId,
            action: 'save',
            created_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,product_id,action' },
        )
        .then(() => {})
    }

    setInteractionLoading(false)
  }

  const handleReviewSubmit = async () => {
    if (!userId || reviewRating < 1) return

    setReviewSubmitting(true)
    setReviewError(null)

    try {
      if (myReview && editingReview) {
        const { error } = await supabase
          .from('reviews')
          .update({
            rating: reviewRating,
            comment: reviewComment.trim() || null,
          })
          .eq('id', myReview.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('reviews').insert({
          product_id: productId,
          user_id: userId,
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        })

        if (error) throw error
      }

      setEditingReview(false)
      await fetchReviews()
    } catch (err: any) {
      setReviewError(err.message ?? 'Failed to submit review.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleDeleteReview = async () => {
    if (!myReview) return

    setReviewSubmitting(true)

    await supabase.from('reviews').delete().eq('id', myReview.id)

    setMyReview(null)
    setReviewRating(5)
    setReviewComment('')
    setEditingReview(false)

    await fetchReviews()

    setReviewSubmitting(false)
  }

  const handleAddToCart = async () => {
    if (!product) return

    setAddingToCart(true)

    for (let i = 0; i < quantity; i++) {
      await addToCart(product.id)
    }

    setAddingToCart(false)
    setIsAdded(true)

    setTimeout(() => setIsAdded(false), 2000)
  }

  const handleQuantityChange = (value: number) => {
    if (value >= 1 && value <= 10) {
      setQuantity(value)
    }
  }

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar cartCount={cartCount} />

        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-11 h-11 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading product...</p>
        </main>

        <Footer />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar cartCount={cartCount} />

        <main className="flex-1 max-w-7xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-5"
          >
            <div className="flex items-center gap-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-xl px-6 py-5 max-w-md w-full shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium">{error ?? 'Product not found'}</p>
            </div>

            <Link href="/products">
              <Button>Back to Products</Button>
            </Link>
          </motion.div>
        </main>

        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar cartCount={cartCount} />

      <main className="flex-1">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="max-w-7xl mx-auto px-4 py-6"
        >
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
        </motion.div>

        <section className="max-w-7xl mx-auto px-4 pb-16">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-12"
          >
            <motion.div variants={fadeUp} className="flex items-start min-w-0">
              <div className="w-full">
                <ProductGallery images={gallery} name={product.name} />
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col">
              {product.category && (
                <Badge className="w-fit mb-4 capitalize">
                  {product.category}
                </Badge>
              )}

              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mb-6">
                <StarPicker value={Math.round(avgRating)} readonly size="md" />

                <span className="text-sm font-semibold text-foreground">
                  {avgRating > 0 ? avgRating.toFixed(1) : 'No ratings yet'}
                </span>

                {reviews.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                  </span>
                )}
              </div>

              <p className="text-4xl font-bold text-foreground mb-2">
                {formatPrice(product.price ?? 0)}
              </p>
              {product.compare_at_price &&
                product.compare_at_price > (product.price ?? 0) && (
                  <p className="text-sm text-muted-foreground line-through mb-4">
                    {formatPrice(product.compare_at_price)}
                  </p>
                )}

              {seller && (
                <Link
                  href={seller.shop_slug ? `/shop/${seller.shop_slug}` : `/u/${seller.id}`}
                  className="mb-6 inline-flex items-center gap-3 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors p-3 w-fit"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary border border-border overflow-hidden flex items-center justify-center text-sm font-semibold text-muted-foreground">
                    {seller.avatar_url ? (
                      <img src={seller.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (seller.shop_name || seller.username || 'S').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sold by</p>
                    <p className="text-sm font-medium">
                      {seller.shop_name || seller.username || 'Independent seller'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
                    Visit shop →
                  </span>
                </Link>
              )}
              {!seller && (
                <div className="mb-6 inline-flex items-center gap-3 rounded-lg border border-border bg-card p-3 w-fit">
                  <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold">
                    S
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sold by</p>
                    <p className="text-sm font-medium">Souqly</p>
                  </div>
                </div>
              )}

              {typeof product.stock === 'number' && (
                <p
                  className={`mb-4 text-xs font-medium ${
                    product.stock === 0
                      ? 'text-destructive'
                      : product.stock <= 5
                        ? 'text-warning'
                        : 'text-success'
                  }`}
                >
                  {product.stock === 0
                    ? 'Out of stock'
                    : product.stock <= 5
                      ? `Only ${product.stock} left in stock`
                      : 'In stock'}
                </p>
              )}

              {product.description && (
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  {product.description}
                </p>
              )}

              {product.tags.length > 0 && (
                <div className="mb-8">
                  <p className="text-sm font-semibold text-foreground mb-3">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/products?tag=${encodeURIComponent(tag)}`}
                        className="inline-flex items-center rounded-full bg-secondary text-foreground text-xs font-medium px-2.5 py-1 capitalize hover:bg-foreground hover:text-background transition-colors"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm font-semibold text-foreground mb-3">
                  Quantity
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="w-11 h-11 rounded-xl border border-border hover:bg-secondary transition-colors font-medium"
                  >
                    −
                  </button>

                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      handleQuantityChange(parseInt(e.target.value) || 1)
                    }
                    className="w-16 h-11 border border-border rounded-xl text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    min="1"
                    max="10"
                  />

                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="w-11 h-11 rounded-xl border border-border hover:bg-secondary transition-colors font-medium"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
                  <Button
                    onClick={handleAddToCart}
                    size="lg"
                    className="w-full rounded-xl"
                    disabled={addingToCart}
                  >
                    {addingToCart ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </span>
                    ) : isAdded ? (
                      '✓ Added!'
                    ) : (
                      'Add to Cart'
                    )}
                  </Button>
                </motion.div>

                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => toggleInteraction('like')}
                  disabled={!userId || interactionLoading}
                  title={
                    userId
                      ? isLiked
                        ? 'Remove from wishlist'
                        : 'Save to wishlist'
                      : 'Sign in to save'
                  }
                  className={`flex flex-col items-center justify-center gap-0.5 w-16 h-12 rounded-xl border transition-all text-xs font-medium ${
                    isLiked
                      ? 'border-destructive/40 bg-destructive/10 text-destructive'
                      : 'border-border hover:border-destructive/40 hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isLiked ? 'fill-destructive text-destructive' : ''
                    }`}
                  />
                  <span>{isLiked ? 'Saved' : 'Save'}</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setShareOpen(true)}
                  disabled={!userId}
                  title={userId ? 'Share with a friend' : 'Sign in to share'}
                  className="flex flex-col items-center justify-center gap-0.5 w-16 h-12 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </motion.button>
              </div>

              {!userId && (
                <p className="text-xs text-muted-foreground mb-4">
                  <Link href="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>{' '}
                  to like, share, and review products.
                </p>
              )}

              {userId && product && (
                <ShareToFriendsDialog
                  open={shareOpen}
                  onOpenChange={setShareOpen}
                  currentUserId={userId}
                  product={{
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image_url: product.image_url,
                  }}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  [Truck, 'Free Shipping', 'On orders over 5,000 DA'],
                  [RotateCcw, '30-Day Returns', 'Easy returns'],
                  [ShieldCheck, 'Warranty', '1 year'],
                ].map(([Icon, label, value]: any) => (
                  <motion.div
                    key={label}
                    whileHover={{ y: -4 }}
                    className="bg-secondary rounded-2xl p-4 border border-border"
                  >
                    <Icon className="w-5 h-5 text-primary mb-3" />
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{value}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </section>

        <section className="max-w-7xl mx-auto px-4 pb-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
            className="border-t border-border pt-12"
          >
            <motion.h2
              variants={fadeUp}
              className="text-3xl font-bold text-foreground mb-8"
            >
              Customer Reviews
            </motion.h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <motion.div variants={fadeUp} className="lg:col-span-1">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="text-center mb-6">
                    <p className="text-6xl font-bold text-foreground">
                      {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                    </p>

                    <div className="flex justify-center mt-2">
                      <StarPicker value={Math.round(avgRating)} readonly size="lg" />
                    </div>

                    <p className="text-sm text-muted-foreground mt-2">
                      {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {ratingCounts.map(({ star, count }) => (
                      <div key={star} className="flex items-center gap-2 text-sm">
                        <span className="w-4 text-right text-muted-foreground shrink-0">
                          {star}
                        </span>

                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />

                        <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{
                              width: reviews.length
                                ? `${(count / reviews.length) * 100}%`
                                : '0%',
                            }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="bg-amber-400 h-2 rounded-full"
                          />
                        </div>

                        <span className="w-5 text-muted-foreground shrink-0">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="lg:col-span-2 space-y-6">
                <AnimatePresence>
                  {userId && (!myReview || editingReview) && (
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                    >
                      <h3 className="font-semibold text-foreground mb-4">
                        {editingReview ? 'Edit Your Review' : 'Write a Review'}
                      </h3>

                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          Your rating
                        </p>

                        <StarPicker
                          value={reviewRating}
                          onChange={setReviewRating}
                          size="lg"
                        />
                      </div>

                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience with this product... (optional)"
                        rows={4}
                        className="w-full border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      />

                      {reviewError && (
                        <p className="text-destructive text-sm mt-2">
                          {reviewError}
                        </p>
                      )}

                      <div className="flex gap-3 mt-4">
                        <Button
                          onClick={handleReviewSubmit}
                          disabled={reviewSubmitting || reviewRating < 1}
                          className="gap-2 rounded-xl"
                        >
                          {reviewSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          {editingReview ? 'Update Review' : 'Submit Review'}
                        </Button>

                        {editingReview && (
                          <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => {
                              setEditingReview(false)
                              setReviewRating(myReview?.rating ?? 5)
                              setReviewComment(myReview?.comment ?? '')
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {reviewsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : reviews.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 bg-card border border-border rounded-2xl shadow-sm"
                  >
                    <Star className="w-10 h-10 text-border mx-auto mb-3" />
                    <p className="font-medium text-foreground">No reviews yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Be the first to share your thoughts
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                  >
                    {reviews.map((review) => {
                      const isOwn = review.user_id === userId

                      return (
                        <motion.div
                          key={review.id}
                          variants={fadeUp}
                          whileHover={{ y: -3 }}
                          className={`bg-card border rounded-2xl p-5 shadow-sm ${
                            isOwn ? 'border-primary/30 bg-primary/5' : 'border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                                {(review.user_email ?? 'A').charAt(0).toUpperCase()}
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  {isOwn ? 'You' : review.user_email?.split('@')[0]}

                                  {isOwn && (
                                    <span className="ml-2 text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                      Your review
                                    </span>
                                  )}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                  {new Date(review.created_at).toLocaleDateString(
                                    'en-US',
                                    {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    }
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <StarPicker value={review.rating} readonly size="sm" />

                              {isOwn && !editingReview && (
                                <div className="flex gap-1 ml-1">
                                  <button
                                    onClick={() => setEditingReview(true)}
                                    className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                                    title="Edit review"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={handleDeleteReview}
                                    className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                                    title="Delete review"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {review.comment && (
                            <p className="text-sm text-foreground leading-relaxed pl-12">
                              {review.comment}
                            </p>
                          )}
                        </motion.div>
                      )
                    })}
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </section>

        {similarProducts.length > 0 && (
          <section className="bg-secondary">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={staggerContainer}
              className="max-w-7xl mx-auto px-4 py-16"
            >
              <motion.h2
                variants={fadeUp}
                className="text-3xl font-bold text-foreground mb-8"
              >
                Similar Products
              </motion.h2>

              <motion.div
                variants={staggerContainer}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {similarProducts.map((p) => (
                  <motion.div
                    key={p.id}
                    variants={fadeUp}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ProductCard
                      product={p as any}
                      onAddToCart={() => addToCart(p.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
