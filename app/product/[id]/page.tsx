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
  Bookmark,
  Send,
  Pencil,
  Trash2,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react'
import { useCart } from '@/app/hooks/useCart'

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
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  const [userId, setUserId] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [interactionLoading, setInteractionLoading] = useState(false)

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

      const { data: tagsData } = await supabase
        .from('product_tags')
        .select('tag')
        .eq('product_id', productId)

      const tags = (tagsData ?? []).map((t: { tag: string }) => t.tag)

      setProduct({
        ...productData,
        image_url: productData.image_url ?? null,
        image: productData.image_url ?? null,
        tags,
      })

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

    const fetchInteractions = async () => {
      const { data } = await supabase
        .from('interactions')
        .select('action')
        .eq('user_id', userId)
        .eq('product_id', productId)

      setIsLiked(data?.some((r) => r.action === 'like') ?? false)
      setIsSaved(data?.some((r) => r.action === 'save') ?? false)
    }

    fetchInteractions()
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

  const toggleInteraction = async (action: 'like' | 'save') => {
    if (!userId) return

    setInteractionLoading(true)

    const isActive = action === 'like' ? isLiked : isSaved
    const setter = action === 'like' ? setIsLiked : setIsSaved

    if (isActive) {
      await supabase
        .from('interactions')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('action', action)

      setter(false)
    } else {
      await supabase.from('interactions').upsert(
        {
          user_id: userId,
          product_id: productId,
          action,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,product_id,action',
        }
      )

      setter(true)
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
            <motion.div variants={fadeUp} className="flex items-start">
              <motion.div
                whileHover={{ scale: 1.015 }}
                transition={{ duration: 0.25 }}
                className="relative w-full aspect-square bg-secondary rounded-3xl overflow-hidden border border-border shadow-sm"
              >
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    No image available
                  </div>
                )}
              </motion.div>
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

              <p className="text-4xl font-bold text-foreground mb-6">
                ${(product.price ?? 0).toFixed(2)}
              </p>

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
                      <Badge key={tag} variant="secondary" className="capitalize">
                        {tag}
                      </Badge>
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
                  title={userId ? (isLiked ? 'Unlike' : 'Like') : 'Sign in to like'}
                  className={`flex flex-col items-center justify-center gap-0.5 w-16 h-12 rounded-xl border transition-all text-xs font-medium ${
                    isLiked
                      ? 'border-rose-400 bg-rose-50 text-rose-500'
                      : 'border-border hover:border-rose-300 hover:bg-rose-50 text-muted-foreground hover:text-rose-500'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isLiked ? 'fill-rose-500 text-rose-500' : ''
                    }`}
                  />
                  <span>{isLiked ? 'Liked' : 'Like'}</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => toggleInteraction('save')}
                  disabled={!userId || interactionLoading}
                  title={userId ? (isSaved ? 'Unsave' : 'Save') : 'Sign in to save'}
                  className={`flex flex-col items-center justify-center gap-0.5 w-16 h-12 rounded-xl border transition-all text-xs font-medium ${
                    isSaved
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <Bookmark
                    className={`w-4 h-4 ${
                      isSaved ? 'fill-primary text-primary' : ''
                    }`}
                  />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </motion.button>
              </div>

              {!userId && (
                <p className="text-xs text-muted-foreground mb-4">
                  <Link href="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>{' '}
                  to like, save, and review products.
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  [Truck, 'Free Shipping', 'On orders over $50'],
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
                <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
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
                      className="bg-white border border-border rounded-2xl p-6 shadow-sm"
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
                    className="text-center py-12 bg-white border border-border rounded-2xl shadow-sm"
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
                          className={`bg-white border rounded-2xl p-5 shadow-sm ${
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