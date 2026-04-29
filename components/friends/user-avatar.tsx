'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { PublicUser } from '@/lib/types/social'
import { cn } from '@/lib/utils'

export function userDisplayName(u: Pick<PublicUser, 'username' | 'email'>) {
  return u.username?.trim() || u.email?.split('@')[0] || 'User'
}

interface UserAvatarProps {
  user: Pick<PublicUser, 'username' | 'email' | 'avatar_url'>
  className?: string
  /** Wrap in a Link to /u/[id]. Pass the user id. */
  linkToId?: string | null
}

export function UserAvatar({ user, className, linkToId }: UserAvatarProps) {
  const initial = userDisplayName(user).charAt(0).toUpperCase()
  const inner = (
    <Avatar
      className={cn(
        'size-10 ring-2 ring-primary/10 transition-transform hover:scale-105',
        className,
      )}
    >
      {user.avatar_url ? (
        <AvatarImage src={user.avatar_url} alt={userDisplayName(user)} />
      ) : null}
      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
        {initial}
      </AvatarFallback>
    </Avatar>
  )

  if (linkToId) {
    return (
      <Link href={`/u/${linkToId}`} aria-label={`View ${userDisplayName(user)}'s profile`}>
        {inner}
      </Link>
    )
  }
  return inner
}
