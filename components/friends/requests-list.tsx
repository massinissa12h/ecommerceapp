'use client'

import { Check, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserAvatar, userDisplayName } from './user-avatar'
import type { FriendshipWithUser } from '@/lib/types/social'

interface RequestsListProps {
  incoming: FriendshipWithUser[]
  outgoing: FriendshipWithUser[]
  onAccept: (id: string) => void
  onDecline: (id: string) => void
  onCancel: (id: string) => void
}

export function RequestsList({
  incoming,
  outgoing,
  onAccept,
  onDecline,
  onCancel,
}: RequestsListProps) {
  const empty = incoming.length === 0 && outgoing.length === 0

  if (empty) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <h3 className="font-semibold mb-1">No pending requests</h3>
        <p className="text-sm text-muted-foreground">
          You&apos;re all caught up.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {incoming.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
            Incoming ({incoming.length})
          </h3>
          <div className="space-y-2">
            {incoming.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-border/60 rounded-2xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar user={r.other} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {userDisplayName(r.other)}
                    </p>
                    <p className="text-xs text-muted-foreground">wants to be friends</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => onAccept(r.id)}
                    className="rounded-full"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDecline(r.id)}
                    className="rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
            Sent ({outgoing.length})
          </h3>
          <div className="space-y-2">
            {outgoing.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-border/60 rounded-2xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar user={r.other} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {userDisplayName(r.other)}
                    </p>
                    <p className="text-xs text-muted-foreground">awaiting response</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCancel(r.id)}
                  className="rounded-full text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
