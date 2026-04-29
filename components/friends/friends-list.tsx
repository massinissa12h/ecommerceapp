'use client'

import { motion } from 'framer-motion'
import { MessageCircle, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserAvatar, userDisplayName } from './user-avatar'
import type { FriendshipWithUser } from '@/lib/types/social'

interface FriendsListProps {
  friends: FriendshipWithUser[]
  activePeerId: string | null
  unreadByPeerId: Map<string, number>
  onOpenChat: (friendship: FriendshipWithUser) => void
  onUnfriend: (friendshipId: string) => void
}

export function FriendsList({
  friends,
  activePeerId,
  unreadByPeerId,
  onOpenChat,
  onUnfriend,
}: FriendsListProps) {
  if (friends.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8" />
        </div>
        <h3 className="font-semibold mb-1">No friends yet</h3>
        <p className="text-sm text-muted-foreground">
          Use the <span className="font-medium">Find People</span> tab to add someone.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {friends.map((f) => {
        const active = f.other.id === activePeerId
        const unread = unreadByPeerId.get(f.other.id) ?? 0
        const handleOpen = () => onOpenChat(f)
        return (
          <motion.div
            key={f.id}
            whileHover={{ x: 2 }}
            role="button"
            tabIndex={0}
            onClick={handleOpen}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleOpen()
              }
            }}
            className={`group w-full text-left flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              active
                ? 'bg-primary/5 border-primary/40'
                : 'bg-white border-border/60 hover:border-primary/20'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                <UserAvatar user={f.other} linkToId={f.other.id} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate flex items-center gap-2">
                  {userDisplayName(f.other)}
                  {unread > 0 && (
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </p>
                {f.other.username && (
                  <p className="text-xs text-muted-foreground truncate">@{f.other.username}</p>
                )}
              </div>
            </div>
            <div
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`Remove ${userDisplayName(f.other)} from your friends?`)) {
                    onUnfriend(f.id)
                  }
                }}
                aria-label="Unfriend"
              >
                <UserMinus className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
