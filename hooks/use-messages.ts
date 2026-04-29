'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Message } from '@/lib/types/social'

/**
 * useMessages — load the message history with one peer and stream new ones via Realtime.
 *
 * Inserts new messages locally on send (optimistic) and de-dupes when the realtime echo
 * arrives. Marks incoming messages as read whenever this conversation is open.
 */
export function useMessages(currentUserId: string | null, peerId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Used to ignore realtime echoes of messages already in state
  const seenIds = useRef<Set<string>>(new Set())
  const channelIdRef = useRef(Math.random().toString(36).slice(2))

  // ---------- loader ----------
  const load = useCallback(async () => {
    if (!currentUserId || !peerId) {
      setMessages([])
      return
    }
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id, recipient_id, content, created_at, read_at, metadata')
      .or(
        `and(sender_id.eq.${currentUserId},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${currentUserId})`,
      )
      .order('created_at', { ascending: true })
      .limit(500)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const list = (data ?? []) as Message[]
    seenIds.current = new Set(list.map((m) => m.id))
    setMessages(list)
    setLoading(false)
  }, [currentUserId, peerId])

  useEffect(() => {
    load()
  }, [load])

  // ---------- realtime ----------
  useEffect(() => {
    if (!currentUserId || !peerId) return

    // Filter to messages between us and this peer (either direction).
    // Postgres-changes filters don't support OR, so we subscribe broadly to messages
    // involving the current user and filter in code — small volume per user.
    const channel = supabase
      .channel(`messages:${currentUserId}:${peerId}:${channelIdRef.current}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new as Message
          const involvesPeer =
            (msg.sender_id === currentUserId && msg.recipient_id === peerId) ||
            (msg.sender_id === peerId && msg.recipient_id === currentUserId)
          if (!involvesPeer) return
          if (seenIds.current.has(msg.id)) return
          seenIds.current.add(msg.id)
          setMessages((prev) => [...prev, msg])
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new as Message
          const involvesPeer =
            (msg.sender_id === currentUserId && msg.recipient_id === peerId) ||
            (msg.sender_id === peerId && msg.recipient_id === currentUserId)
          if (!involvesPeer) return
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, peerId])

  // ---------- mark unread incoming as read ----------
  useEffect(() => {
    if (!currentUserId || !peerId) return
    const unreadIds = messages
      .filter((m) => m.recipient_id === currentUserId && m.read_at === null)
      .map((m) => m.id)
    if (unreadIds.length === 0) return
    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', unreadIds)
      .then(({ error }) => {
        if (error) console.warn('mark read failed', error.message)
      })
  }, [messages, currentUserId, peerId])

  // ---------- send ----------
  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || !currentUserId || !peerId) return { error: 'Missing data' }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          recipient_id: peerId,
          content: trimmed,
        })
        .select('id, sender_id, recipient_id, content, created_at, read_at, metadata')
        .single()

      if (error) return { error: error.message }
      if (data) {
        seenIds.current.add(data.id)
        setMessages((prev) => [...prev, data as Message])
      }
      return { error: null }
    },
    [currentUserId, peerId],
  )

  return { messages, loading, error, sendMessage, refresh: load }
}
