'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Loader2,
  ArrowLeft,
  UserPlus,
  Check,
  Clock,
  MessageCircle,
  Heart,
  Star,
  Users,
  Pencil,
  X,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface PublicProfile {
  id: string
  username: string | null
  email: string | null
  created_at: string | null
  first_name: string | null
  last_name: string | null
  city: string | null
  country: string | null
  bio: string | null
  avatar_url: string | null
}

interface ProfileStats {
  reviewCount: number
  friendCount: number
  likeCount: number
}

type Relationship =
  | { kind: 'self' }
  | { kind: 'none' }
  | { kind: 'pending_outgoing'; friendshipId: string }
  | { kind: 'pending_incoming'; friendshipId: string }
  | { kind: 'friends'; friendshipId: string }

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const profileId = params.id as string

  const [me, setMe] = useState<string | null>(null)
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [stats, setStats] = useState<ProfileStats>({
    reviewCount: 0,
    friendCount: 0,
    likeCount: 0,
  })
  const [relationship, setRelationship] = useState<Relationship>({ kind: 'none' })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setNotFound(false)

    const { data: sessionData } = await supabase.auth.getSession()
    const myId = sessionData.session?.user?.id ?? null
    setMe(myId)

    const [{ data: userRow }, { data: profileRow }] = await Promise.all([
      supabase.from('users').select('id, username, email, created_at').eq('id', profileId).maybeSingle(),
      supabase
        .from('profiles')
        .select('first_name, last_name, city, country, bio, avatar_url')
        .eq('id', profileId)
        .maybeSingle(),
    ])

    if (!userRow) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setProfile({
      id: userRow.id,
      username: userRow.username,
      email: userRow.email,
      created_at: userRow.created_at,
      first_name: profileRow?.first_name ?? null,
      last_name: profileRow?.last_name ?? null,
      city: profileRow?.city ?? null,
      country: profileRow?.country ?? null,
      bio: profileRow?.bio ?? null,
      avatar_url: profileRow?.avatar_url ?? null,
    })

    const [{ count: reviewCount }, { count: friendCount }, { count: likeCount }] =
      await Promise.all([
        supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profileId),
        supabase
          .from('friendships')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'accepted')
          .or(`requester_id.eq.${profileId},addressee_id.eq.${profileId}`),
        supabase
          .from('interactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profileId)
          .eq('action', 'like'),
      ])

    setStats({
      reviewCount: reviewCount ?? 0,
      friendCount: friendCount ?? 0,
      likeCount: likeCount ?? 0,
    })

    if (!myId) {
      setRelationship({ kind: 'none' })
    } else if (myId === profileId) {
      setRelationship({ kind: 'self' })
    } else {
      const { data: fr } = await supabase
        .from('friendships')
        .select('id, requester_id, addressee_id, status')
        .or(
          `and(requester_id.eq.${myId},addressee_id.eq.${profileId}),and(requester_id.eq.${profileId},addressee_id.eq.${myId})`,
        )
        .maybeSingle()

      if (!fr) {
        setRelationship({ kind: 'none' })
      } else if (fr.status === 'accepted') {
        setRelationship({ kind: 'friends', friendshipId: fr.id })
      } else if (fr.requester_id === myId) {
        setRelationship({ kind: 'pending_outgoing', friendshipId: fr.id })
      } else {
        setRelationship({ kind: 'pending_incoming', friendshipId: fr.id })
      }
    }

    setLoading(false)
  }, [profileId])

  useEffect(() => {
    load()
  }, [load])

  const sendRequest = async () => {
    if (!me) return router.push('/login')
    setActionLoading(true)
    const { error } = await supabase.from('friendships').insert({
      requester_id: me,
      addressee_id: profileId,
      status: 'pending',
    })
    if (!error) await load()
    setActionLoading(false)
  }

  const acceptRequest = async () => {
    if (relationship.kind !== 'pending_incoming') return
    setActionLoading(true)
    await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', relationship.friendshipId)
    await load()
    setActionLoading(false)
  }

  const cancelOrRemove = async () => {
    if (
      relationship.kind !== 'pending_outgoing' &&
      relationship.kind !== 'friends' &&
      relationship.kind !== 'pending_incoming'
    )
      return
    setActionLoading(true)
    await supabase.from('friendships').delete().eq('id', relationship.friendshipId)
    await load()
    setActionLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <p className="text-sm text-muted-foreground mb-6">
            This profile doesn&apos;t exist or has been removed.
          </p>
          <Link href="/products">
            <Button>Back to shopping</Button>
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() ||
    profile.username ||
    profile.email?.split('@')[0] ||
    'User'

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null

  const location = [profile.city, profile.country].filter(Boolean).join(', ')

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-secondary/30 to-background">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative bg-white border border-border rounded-3xl shadow-sm overflow-hidden"
        >

          <div className="h-32 bg-gradient-to-br from-primary via-primary/80 to-primary/60 relative">
            <div className="absolute -bottom-1 -right-4 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute top-3 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur text-white text-xs px-3 py-1 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              Shopper profile
            </div>
          </div>

          <div className="px-6 md:px-10 pb-8">

            <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-12 gap-4">
              <Avatar className="size-24 ring-4 ring-white shadow-lg bg-white">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={fullName} />
                ) : null}
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {fullName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-wrap gap-2">
                {relationship.kind === 'self' && (
                  <Link href="/profile">
                    <Button className="rounded-full gap-2">
                      <Pencil className="w-4 h-4" />
                      Edit profile
                    </Button>
                  </Link>
                )}

                {relationship.kind === 'none' && (
                  <Button
                    onClick={sendRequest}
                    disabled={actionLoading}
                    className="rounded-full gap-2"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    Add friend
                  </Button>
                )}

                {relationship.kind === 'pending_outgoing' && (
                  <Button
                    variant="secondary"
                    onClick={cancelOrRemove}
                    disabled={actionLoading}
                    className="rounded-full gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Pending — Cancel
                  </Button>
                )}

                {relationship.kind === 'pending_incoming' && (
                  <>
                    <Button
                      onClick={acceptRequest}
                      disabled={actionLoading}
                      className="rounded-full gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Accept request
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={cancelOrRemove}
                      disabled={actionLoading}
                      className="rounded-full gap-2"
                    >
                      <X className="w-4 h-4" />
                      Decline
                    </Button>
                  </>
                )}

                {relationship.kind === 'friends' && (
                  <>
                    <Link href={`/friends?with=${profile.id}`}>
                      <Button className="rounded-full gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Message
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={cancelOrRemove}
                      disabled={actionLoading}
                      className="rounded-full text-muted-foreground"
                    >
                      Unfriend
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h1 className="text-3xl font-bold tracking-tight">{fullName}</h1>
              {profile.username && (
                <p className="text-muted-foreground">@{profile.username}</p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                {memberSince && <span>Member since {memberSince}</span>}
                {location && <span>· {location}</span>}
              </div>
            </div>

            {profile.bio && (
              <p className="mt-5 text-foreground leading-relaxed whitespace-pre-wrap bg-secondary/40 border border-border/60 rounded-2xl px-4 py-3">
                {profile.bio}
              </p>
            )}

            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { label: 'Friends', value: stats.friendCount, Icon: Users },
                { label: 'Reviews', value: stats.reviewCount, Icon: Star },
                { label: 'Likes', value: stats.likeCount, Icon: Heart },
              ].map(({ label, value, Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border bg-secondary/40 p-4 text-center"
                >
                  <Icon className="w-4 h-4 mx-auto text-primary mb-1" />
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <RecentReviews userId={profile.id} />
      </main>

      <Footer />
    </div>
  )
}

function RecentReviews({ userId }: { userId: string }) {
  const [reviews, setReviews] = useState<
    Array<{
      id: string
      rating: number
      comment: string | null
      created_at: string
      product_id: string
      products: { name: string; image_url: string | null } | null
    }>
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('reviews')
      .select(
        'id, rating, comment, created_at, product_id, products ( name, image_url )',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (cancelled) return
        setReviews((data as any) ?? [])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  if (loading) return null
  if (reviews.length === 0) return null

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="mt-8 bg-white border border-border rounded-3xl p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Star className="w-5 h-5 text-primary" />
        Recent reviews
      </h2>
      <div className="space-y-3">
        {reviews.map((r) => (
          <Link
            key={r.id}
            href={`/product/${r.product_id}`}
            className="flex gap-3 items-start p-3 rounded-2xl border border-border/60 hover:border-primary/30 transition-colors"
          >
            {r.products?.image_url && (

              <img
                src={r.products.image_url}
                alt={r.products.name}
                className="w-14 h-14 rounded-xl object-cover bg-secondary shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold truncate">
                  {r.products?.name ?? 'Product'}
                </p>
                <div className="flex items-center gap-0.5 shrink-0">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= r.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-border fill-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {r.comment && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {r.comment}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </motion.section>
  )
}
