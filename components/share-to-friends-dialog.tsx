'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Check, Loader2, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabaseClient'
import { useFriends } from '@/hooks/use-friends'
import { UserAvatar, userDisplayName } from '@/components/friends/user-avatar'
import type { ProductShareMetadata } from '@/lib/types/social'

interface ShareToFriendsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId: string
  product: {
    id: string
    name: string
    price: number | null
    image_url: string | null
  }
}

export function ShareToFriendsDialog({
  open,
  onOpenChange,
  currentUserId,
  product,
}: ShareToFriendsDialogProps) {
  const { friends, loading } = useFriends(currentUserId)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [note, setNote] = useState('')
  const [filter, setFilter] = useState('')
  const [sending, setSending] = useState(false)
  const [sentCount, setSentCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = friends.filter((f) => {
    const display = userDisplayName(f.other).toLowerCase()
    return display.includes(filter.toLowerCase())
  })

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSend = async () => {
    if (selected.size === 0) return
    setSending(true)
    setError(null)

    const metadata: ProductShareMetadata = {
      type: 'product_share',
      product_id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
    }

    const inserts = Array.from(selected).map((recipientId) => ({
      sender_id: currentUserId,
      recipient_id: recipientId,
      content: note.trim() || `Check out this product: ${product.name}`,
      metadata,
    }))

    const { error } = await supabase.from('messages').insert(inserts)
    setSending(false)
    if (error) {
      setError(error.message)
      return
    }

    setSentCount(selected.size)

    setTimeout(() => {
      onOpenChange(false)

      setSelected(new Set())
      setNote('')
      setFilter('')
      setSentCount(null)
    }, 1200)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share with friends</DialogTitle>
          <DialogDescription>
            Send <span className="font-medium">{product.name}</span> to one or more
            friends. They&apos;ll see it in their messages.
          </DialogDescription>
        </DialogHeader>

        {sentCount !== null ? (
          <div className="py-10 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3"
            >
              <Check className="w-7 h-7" />
            </motion.div>
            <p className="text-sm font-medium">
              Shared with {sentCount} {sentCount === 1 ? 'friend' : 'friends'}
            </p>
          </div>
        ) : (
          <>

            <div className="relative">
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search friends…"
                className="pl-9 rounded-full bg-secondary/50"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1 -mx-1 px-1">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Loading…
                </p>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {friends.length === 0
                    ? 'You have no friends yet — add some from the Friends page.'
                    : 'No friends match that search.'}
                </p>
              ) : (
                filtered.map((f) => {
                  const isSelected = selected.has(f.other.id)
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggle(f.other.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors text-left ${
                        isSelected
                          ? 'bg-primary/5 border-primary/40'
                          : 'bg-white border-border hover:border-primary/20'
                      }`}
                    >
                      <UserAvatar user={f.other} className="size-9" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {userDisplayName(f.other)}
                        </p>
                        {f.other.username && (
                          <p className="text-xs text-muted-foreground truncate">
                            @{f.other.username}
                          </p>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-border'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)…"
              rows={2}
              maxLength={500}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            {error && (
              <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={sending}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={selected.size === 0 || sending}
                className="rounded-full gap-2"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send
                {selected.size > 0 && ` (${selected.size})`}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
