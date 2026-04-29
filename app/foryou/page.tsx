'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  Users,
  TrendingUp,
  Eye,
  Loader2,
} from 'lucide-react'

import { supabase } from '@/lib/supabaseClient'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { RecSection } from '@/components/foryou/rec-section'

import {
  fetchHomepage,
  fetchRecommendForItem,
  fetchFriendsLiked,
  fetchRecentViews,
  hydrateRecommendations,
  type RecommendedProduct,
  type HydratedProduct,
} from '@/lib/recommender'

interface ContentSection {
  anchor: HydratedProduct
  loading: boolean
  error: string | null
  products: RecommendedProduct[]
}

// Friendly wrapper around the raw error so the UI can suggest a fix
// when the FastAPI service is unreachable.
function describeEngineError(e: unknown): string {
  const msg = (e as Error)?.message || 'unknown error'
  if (/503|unreachable|ECONNREFUSED|fetch failed/i.test(msg)) {
    return `Recommender offline. Start the FastAPI service on :8000 and reload (${msg}).`
  }
  return `Recommender error: ${msg}`
}

export default function ForYouPage() {
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [pickedLoading, setPickedLoading] = useState(true)
  const [pickedError, setPickedError] = useState<string | null>(null)
  const [picked, setPicked] = useState<RecommendedProduct[]>([])

  const [trendingLoading, setTrendingLoading] = useState(true)
  const [trendingError, setTrendingError] = useState<string | null>(null)
  const [trending, setTrending] = useState<RecommendedProduct[]>([])

  const [friendsLoading, setFriendsLoading] = useState(true)
  const [friendsError, setFriendsError] = useState<string | null>(null)
  const [friendsLiked, setFriendsLiked] = useState<RecommendedProduct[]>([])

  const [contentSections, setContentSections] = useState<ContentSection[]>([])
  const [contentLoading, setContentLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      const u = data.session?.user
      setUser(u ? { id: u.id, email: u.email } : null)

      if (u) {
        const { data: row } = await supabase
          .from('users')
          .select('username')
          .eq('id', u.id)
          .maybeSingle()
        if (!cancelled) setUsername((row?.username as string | null) ?? null)
      }
      if (!cancelled) setAuthLoading(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const ctrl = new AbortController()
    setPickedLoading(true)
    setPickedError(null)
    fetchHomepage({ userId: user.id, n: 8, signal: ctrl.signal })
      .then(hydrateRecommendations)
      .then(setPicked)
      .catch((e: unknown) => {
        if ((e as Error).name === 'AbortError') return
        setPickedError(describeEngineError(e))
      })
      .finally(() => setPickedLoading(false))
    return () => ctrl.abort()
  }, [user])

  useEffect(() => {
    const ctrl = new AbortController()
    setTrendingLoading(true)
    setTrendingError(null)
    fetchHomepage({ n: 8, signal: ctrl.signal })
      .then(hydrateRecommendations)
      .then(setTrending)
      .catch((e: unknown) => {
        if ((e as Error).name === 'AbortError') return
        setTrendingError(describeEngineError(e))
      })
      .finally(() => setTrendingLoading(false))
    return () => ctrl.abort()
  }, [])

  useEffect(() => {
    if (!user) return
    setFriendsLoading(true)
    setFriendsError(null)
    fetchFriendsLiked(user.id, 8)
      .then(setFriendsLiked)
      .catch(() => setFriendsError("Couldn't load friend activity."))
      .finally(() => setFriendsLoading(false))
  }, [user])

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const run = async () => {
      setContentLoading(true)
      const anchors = await fetchRecentViews(user.id, 3)
      if (cancelled) return

      setContentSections(
        anchors.map((a) => ({ anchor: a, loading: true, error: null, products: [] })),
      )
      setContentLoading(false)

      await Promise.all(
        anchors.map(async (anchor) => {
          try {
            const recs = await fetchRecommendForItem({
              userId: user.id,
              itemId: anchor.id,
              n: 6,
            })
            const hydrated = await hydrateRecommendations(recs)
            const filtered = hydrated.filter((p) => p.id !== anchor.id)
            if (cancelled) return
            setContentSections((prev) =>
              prev.map((s) =>
                s.anchor.id === anchor.id
                  ? { ...s, loading: false, products: filtered }
                  : s,
              ),
            )
          } catch (e) {
            if (cancelled) return
            setContentSections((prev) =>
              prev.map((s) =>
                s.anchor.id === anchor.id
                  ? { ...s, loading: false, error: describeEngineError(e) }
                  : s,
              ),
            )
          }
        }),
      )
    }

    run()
    return () => {
      cancelled = true
    }
  }, [user])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-24 text-center">
          <Sparkles className="w-12 h-12 mx-auto text-primary mb-6" />
          <h1 className="text-3xl font-bold mb-3">Your personal For You feed</h1>
          <p className="text-muted-foreground mb-8">
            Sign in to see picks tailored from your taste, what your friends love,
            and what&apos;s trending right now.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            Sign in <ArrowRight className="w-4 h-4" />
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-secondary/30 to-background">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-10 space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Curated for you
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {username ? `Welcome back, ${username}` : 'Your For You feed'}
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Powered by content-based, collaborative, and social signals. Every
            recommendation comes with a &ldquo;why this?&rdquo; explanation.
          </p>
        </motion.div>

        <RecSection
          title="Picked for you"
          subtitle="Based on what shoppers like you have loved"
          icon={Sparkles}
          loading={pickedLoading}
          error={pickedError}
          products={picked}
          badge="For you"
          emptyMessage="Interact with a few products and we'll start tuning this list."
        />

        {contentLoading ? (
          <RecSection
            title="Because you viewed..."
            subtitle="Similar products to your recent views"
            icon={Eye}
            loading
            products={[]}
          />
        ) : contentSections.length === 0 ? (
          <RecSection
            title="Because you viewed..."
            subtitle="Similar products to your recent views"
            icon={Eye}
            loading={false}
            products={[]}
            emptyMessage="Browse a few products and they'll show up here as starting points."
          />
        ) : (
          contentSections.map((section) => (
            <RecSection
              key={section.anchor.id}
              title={`Because you viewed ${section.anchor.name}`}
              subtitle={section.anchor.category ?? 'Similar items'}
              icon={Eye}
              loading={section.loading}
              error={section.error}
              products={section.products}
              badge="Similar"
            />
          ))
        )}

        <RecSection
          title="Loved by your friends"
          subtitle="Products your friends have liked recently"
          icon={Users}
          loading={friendsLoading}
          error={friendsError}
          products={friendsLiked}
          badge="Friends"
          emptyMessage="Add friends to see what they're into."
        />

        <RecSection
          title="Trending right now"
          subtitle="What everyone's looking at on ModernShop"
          icon={TrendingUp}
          loading={trendingLoading}
          error={trendingError}
          products={trending}
          badge="Trending"
        />
      </main>

      <Footer />
    </div>
  )
}
