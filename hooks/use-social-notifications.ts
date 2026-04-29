'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useSocialNotifications(currentUserId: string | null) {
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [pendingRequests, setPendingRequests] = useState(0)

  const channelIdRef = useRef(Math.random().toString(36).slice(2))

  const refresh = useCallback(async () => {
    if (!currentUserId) {
      setUnreadMessages(0)
      setPendingRequests(0)
      return
    }

    const [{ count: msgCount }, { count: reqCount }] = await Promise.all([
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', currentUserId)
        .is('read_at', null),
      supabase
        .from('friendships')
        .select('id', { count: 'exact', head: true })
        .eq('addressee_id', currentUserId)
        .eq('status', 'pending'),
    ])

    setUnreadMessages(msgCount ?? 0)
    setPendingRequests(reqCount ?? 0)
  }, [currentUserId])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!currentUserId) return
    const channel = supabase
      .channel(`social-notifs:${currentUserId}:${channelIdRef.current}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () =>
        refresh(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () =>
        refresh(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, refresh])

  return {
    unreadMessages,
    pendingRequests,
    total: unreadMessages + pendingRequests,
    refresh,
  }
}
