'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, MessageCircle, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMessages } from '@/hooks/use-messages'
import { UserAvatar, userDisplayName } from './user-avatar'
import type { Message, ProductShareMetadata, PublicUser } from '@/lib/types/social'

function isProductShare(meta: Message['metadata']): meta is ProductShareMetadata {
  return (
    !!meta &&
    typeof meta === 'object' &&
    (meta as { type?: string }).type === 'product_share'
  )
}

function ProductShareCard({
  meta,
  mine,
}: {
  meta: ProductShareMetadata
  mine: boolean
}) {
  return (
    <Link
      href={`/product/${meta.product_id}`}
      className={`block mt-2 rounded-xl overflow-hidden border ${
        mine
          ? 'bg-primary-foreground/10 border-primary-foreground/20'
          : 'bg-white border-border'
      } hover:opacity-90 transition-opacity`}
    >
      <div className="flex">
        <div className="relative w-20 h-20 shrink-0 bg-secondary flex items-center justify-center">
          {meta.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meta.image_url} alt={meta.name} className="w-full h-full object-cover" />
          ) : (
            <ShoppingBag className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 p-2.5 min-w-0">
          <p
            className={`text-xs uppercase tracking-wide ${
              mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
            }`}
          >
            Product
          </p>
          <p
            className={`text-sm font-semibold truncate ${
              mine ? 'text-primary-foreground' : 'text-foreground'
            }`}
          >
            {meta.name}
          </p>
          {meta.price !== null && (
            <p
              className={`text-sm font-medium mt-0.5 ${
                mine ? 'text-primary-foreground/90' : 'text-primary'
              }`}
            >
              ${meta.price.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

interface ChatPanelProps {
  currentUserId: string
  peer: PublicUser | null
  onClose: () => void
}

export function ChatPanel({ currentUserId, peer, onClose }: ChatPanelProps) {
  const { messages, loading, sendMessage } = useMessages(
    currentUserId,
    peer?.id ?? null,
  )
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, peer?.id])

  if (!peer) {
    return (
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center text-center p-8 bg-secondary/30 rounded-3xl border border-border/60 min-h-[60vh]">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <MessageCircle className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Pick a friend from the list to start chatting. Messages are delivered in
          real-time.
        </p>
      </div>
    )
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim() || sending) return
    setSending(true)
    const { error } = await sendMessage(draft)
    setSending(false)
    if (!error) setDraft('')
  }

  return (
    <div className="flex flex-1 flex-col bg-white rounded-3xl border border-border/60 shadow-sm overflow-hidden min-h-[60vh] max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/40">
        <div className="flex items-center gap-3">
          <UserAvatar user={peer} linkToId={peer.id} />
          <div>
            <p className="text-sm font-semibold leading-tight">
              {userDisplayName(peer)}
            </p>
            <p className="text-xs text-muted-foreground">
              {peer.username ? '@' + peer.username : peer.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full"
          aria-label="Close conversation"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading && messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Loading messages…
          </p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No messages yet — say hi to {userDisplayName(peer)}.
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const mine = m.sender_id === currentUserId
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm break-words ${
                      mine
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-secondary text-foreground rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {isProductShare(m.metadata) && (
                      <ProductShareCard meta={m.metadata} mine={mine} />
                    )}
                    <p
                      className={`text-[10px] mt-1 ${
                        mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}
                    >
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {mine && m.read_at ? ' · seen' : ''}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSend}
        className="border-t border-border bg-white p-3 flex items-center gap-2"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${userDisplayName(peer)}…`}
          className="rounded-full bg-secondary/70 border-border focus:bg-white"
          disabled={sending}
          maxLength={4000}
        />
        <Button
          type="submit"
          size="icon"
          className="rounded-full shrink-0"
          disabled={!draft.trim() || sending}
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}
