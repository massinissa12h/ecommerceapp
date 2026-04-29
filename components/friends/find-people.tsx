'use client'

import { useEffect, useState } from 'react'
import { Search, UserPlus, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserAvatar, userDisplayName } from './user-avatar'
import type { PublicUser } from '@/lib/types/social'

interface FindPeopleProps {
  searchUsers: (query: string) => Promise<PublicUser[]>
  sendRequest: (userId: string) => Promise<{ error: string | null }>
}

export function FindPeople({ searchUsers, sendRequest }: FindPeopleProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PublicUser[]>([])
  const [searching, setSearching] = useState(false)
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  // Debounced search
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }
    setSearching(true)
    const timer = setTimeout(async () => {
      const found = await searchUsers(q)
      setResults(found)
      setSearching(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [query, searchUsers])

  const handleAdd = async (userId: string) => {
    setError(null)
    const { error } = await sendRequest(userId)
    if (error) {
      setError(error)
      return
    }
    setRequestedIds((prev) => new Set(prev).add(userId))
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username or email…"
          className="pl-10 rounded-full bg-secondary/70 border-border focus:bg-white h-11"
        />
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="space-y-2">
        {searching ? (
          <p className="text-sm text-muted-foreground text-center py-6">Searching…</p>
        ) : results.length === 0 && query.trim() ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No users found.
          </p>
        ) : results.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Start typing to find people to add.
          </p>
        ) : (
          results.map((u) => {
            const requested = requestedIds.has(u.id)
            return (
              <div
                key={u.id}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-border/60 rounded-2xl hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar user={u} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{userDisplayName(u)}</p>
                    {u.username && u.email && (
                      <p className="text-xs text-muted-foreground truncate">
                        {u.email}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={requested ? 'secondary' : 'default'}
                  onClick={() => handleAdd(u.id)}
                  disabled={requested}
                  className="rounded-full shrink-0"
                >
                  {requested ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Sent
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
