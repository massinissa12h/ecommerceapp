'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useWishlist() {
  const [userId, setUserId] = useState<string | null>(null)
  const [ids, setIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user.id ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) {
      setIds(new Set())
      return
    }
    supabase
      .from('wishlist')
      .select('product_id')
      .eq('user_id', userId)
      .then(({ data }) => {
        setIds(new Set((data ?? []).map((r: any) => r.product_id)))
      })
  }, [userId])

  const toggle = useCallback(
    async (productId: string) => {
      if (!userId) return false
      const has = ids.has(productId)
      if (has) {
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', productId)
        setIds((s) => {
          const next = new Set(s)
          next.delete(productId)
          return next
        })
        return false
      } else {
        await supabase
          .from('wishlist')
          .insert({ user_id: userId, product_id: productId })
        setIds((s) => new Set(s).add(productId))
        return true
      }
    },
    [ids, userId],
  )

  return { wishlistIds: ids, toggleWishlist: toggle, isSignedIn: !!userId }
}
