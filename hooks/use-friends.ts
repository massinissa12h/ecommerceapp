'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { FriendshipWithUser, PublicUser } from '@/lib/types/social'

export function useFriends(currentUserId: string | null) {
  const [rows, setRows] = useState<FriendshipWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelIdRef = useRef(Math.random().toString(36).slice(2))

  const load = useCallback(async () => {
    if (!currentUserId) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    const { data: friendships, error: fErr } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status, created_at, updated_at')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
      .order('updated_at', { ascending: false })

    if (fErr) {
      setError(fErr.message)
      setLoading(false)
      return
    }

    if (!friendships || friendships.length === 0) {
      setRows([])
      setLoading(false)
      return
    }

    const otherIds = Array.from(
      new Set(
        friendships.map((f) =>
          f.requester_id === currentUserId ? f.addressee_id : f.requester_id,
        ),
      ),
    )

    const { data: users, error: uErr } = await supabase
      .from('users')
      .select('id, username, email')
      .in('id', otherIds)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, avatar_url')
      .in('id', otherIds)
    const avatarMap = new Map<string, string | null>(
      (profiles ?? []).map((p: { id: string; avatar_url: string | null }) => [
        p.id,
        p.avatar_url,
      ]),
    )

    if (uErr) {
      setError(uErr.message)
      setLoading(false)
      return
    }

    const userMap = new Map<string, PublicUser>(
      (users ?? []).map((u) => [
        u.id,
        { ...u, avatar_url: avatarMap.get(u.id) ?? null } as PublicUser,
      ]),
    )

    const hydrated: FriendshipWithUser[] = friendships
      .map((f) => {
        const otherId = f.requester_id === currentUserId ? f.addressee_id : f.requester_id
        const other = userMap.get(otherId)
        if (!other) return null
        return {
          ...f,
          status: f.status as 'pending' | 'accepted',
          other,
          direction: (f.requester_id === currentUserId ? 'outgoing' : 'incoming') as
            | 'outgoing'
            | 'incoming',
        }
      })
      .filter(Boolean) as FriendshipWithUser[]

    setRows(hydrated)
    setLoading(false)
  }, [currentUserId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!currentUserId) return
    const channel = supabase
      .channel(`friendships:${currentUserId}:${channelIdRef.current}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships' },
        () => {

          load()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, load])

  const sendRequest = useCallback(
    async (addresseeId: string) => {
      if (!currentUserId) return { error: 'Not signed in' }
      if (addresseeId === currentUserId) return { error: "You can't friend yourself" }
      const { error } = await supabase.from('friendships').insert({
        requester_id: currentUserId,
        addressee_id: addresseeId,
        status: 'pending',
      })
      if (error) return { error: error.message }
      return { error: null }
    },
    [currentUserId],
  )

  const acceptRequest = useCallback(async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
    if (error) return { error: error.message }
    return { error: null }
  }, [])

  const declineOrCancel = useCallback(async (friendshipId: string) => {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId)
    if (error) return { error: error.message }
    return { error: null }
  }, [])

  const searchUsers = useCallback(
    async (query: string): Promise<PublicUser[]> => {
      const q = query.trim()
      if (!q || !currentUserId) return []
      const excludeIds = new Set<string>([currentUserId, ...rows.map((r) => r.other.id)])

      const { data, error } = await supabase
        .from('users')
        .select('id, username, email')
        .or(`username.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(20)

      if (error) return []
      const filtered = (data ?? []).filter((u) => !excludeIds.has(u.id))
      if (filtered.length === 0) return []

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', filtered.map((u) => u.id))
      const avatarMap = new Map<string, string | null>(
        (profiles ?? []).map((p: { id: string; avatar_url: string | null }) => [
          p.id,
          p.avatar_url,
        ]),
      )

      return filtered.map((u) => ({
        ...u,
        avatar_url: avatarMap.get(u.id) ?? null,
      })) as PublicUser[]
    },
    [currentUserId, rows],
  )

  const friends = rows.filter((r) => r.status === 'accepted')
  const incomingRequests = rows.filter(
    (r) => r.status === 'pending' && r.direction === 'incoming',
  )
  const outgoingRequests = rows.filter(
    (r) => r.status === 'pending' && r.direction === 'outgoing',
  )

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    loading,
    error,
    refresh: load,
    sendRequest,
    acceptRequest,
    declineOrCancel,
    searchUsers,
  }
}
