'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, Users, UserPlus, Inbox } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFriends } from '@/hooks/use-friends'
import { useSocialNotifications } from '@/hooks/use-social-notifications'
import { FriendsList } from '@/components/friends/friends-list'
import { RequestsList } from '@/components/friends/requests-list'
import { FindPeople } from '@/components/friends/find-people'
import { ChatPanel } from '@/components/friends/chat-panel'
import type { FriendshipWithUser, PublicUser } from '@/lib/types/social'

export default function FriendsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const peerParam = searchParams.get('with')
  const [userId, setUserId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activePeer, setActivePeer] = useState<PublicUser | null>(null)
  const [tab, setTab] = useState<'friends' | 'requests' | 'find'>('friends')

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      const uid = data.session?.user?.id ?? null
      setUserId(uid)
      setAuthLoading(false)
      if (!uid) router.replace('/login')
    }
    run()
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (cancelled) return
      const uid = session?.user?.id ?? null
      setUserId(uid)
      if (!uid) router.replace('/login')
    })
    return () => {
      cancelled = true
      listener?.subscription.unsubscribe()
    }
  }, [router])

  const {
    friends,
    incomingRequests,
    outgoingRequests,
    loading,
    sendRequest,
    acceptRequest,
    declineOrCancel,
    searchUsers,
  } = useFriends(userId)

  const { unreadMessages } = useSocialNotifications(userId)

  const [unreadByPeerId, setUnreadByPeerId] = useState<Map<string, number>>(new Map())
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const run = async () => {
      const { data } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('recipient_id', userId)
        .is('read_at', null)
      if (cancelled) return
      const map = new Map<string, number>()
      ;(data ?? []).forEach((m: { sender_id: string }) => {
        map.set(m.sender_id, (map.get(m.sender_id) ?? 0) + 1)
      })
      setUnreadByPeerId(map)
    }
    run()

  }, [userId, unreadMessages, activePeer?.id])

  const openChat = (f: FriendshipWithUser) => {
    setActivePeer(f.other)
  }

  useEffect(() => {
    if (!peerParam || activePeer?.id === peerParam) return
    const match = friends.find((f) => f.other.id === peerParam)
    if (match) {
      setActivePeer(match.other)
      setTab('friends')
    }
  }, [peerParam, friends, activePeer?.id])

  const incomingCount = incomingRequests.length

  const tabsItems = useMemo(
    () => [
      { id: 'friends', label: 'Friends', icon: Users, count: friends.length },
      { id: 'requests', label: 'Requests', icon: Inbox, count: incomingCount },
      { id: 'find', label: 'Find People', icon: UserPlus, count: 0 },
    ],
    [friends.length, incomingCount],
  )

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!userId) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold tracking-tight">Friends & Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect with other shoppers and chat in real time.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-6">

          <div className="bg-white rounded-3xl border border-border/60 shadow-sm p-4 lg:sticky lg:top-24 lg:self-start">
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="w-full grid grid-cols-3 h-auto bg-secondary/70 rounded-2xl p-1">
                {tabsItems.map((t) => {
                  const Icon = t.icon
                  return (
                    <TabsTrigger
                      key={t.id}
                      value={t.id}
                      className="flex flex-col gap-1 py-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow"
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-medium">{t.label}</span>
                        {t.count > 0 && (
                          <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                            {t.count}
                          </span>
                        )}
                      </div>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              <div className="mt-4">
                <TabsContent value="friends">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <FriendsList
                      friends={friends}
                      activePeerId={activePeer?.id ?? null}
                      unreadByPeerId={unreadByPeerId}
                      onOpenChat={openChat}
                      onUnfriend={async (id) => {
                        await declineOrCancel(id)
                        if (activePeer) {
                          const stillFriend = friends.some(
                            (f) => f.other.id === activePeer.id && f.id !== id,
                          )
                          if (!stillFriend) setActivePeer(null)
                        }
                      }}
                    />
                  )}
                </TabsContent>

                <TabsContent value="requests">
                  <RequestsList
                    incoming={incomingRequests}
                    outgoing={outgoingRequests}
                    onAccept={(id) => acceptRequest(id)}
                    onDecline={(id) => declineOrCancel(id)}
                    onCancel={(id) => declineOrCancel(id)}
                  />
                </TabsContent>

                <TabsContent value="find">
                  <FindPeople searchUsers={searchUsers} sendRequest={sendRequest} />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <ChatPanel
            currentUserId={userId}
            peer={activePeer}
            onClose={() => setActivePeer(null)}
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
