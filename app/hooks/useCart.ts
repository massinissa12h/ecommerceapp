// hooks/useCart.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useCart() {
  const [cartCount, setCartCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  // Get the current session user
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // Fetch current cart count on mount / user change
  useEffect(() => {
    if (!userId) return
    supabase
      .from('cart')
      .select('quantity')
      .eq('user_id', userId)
      .then(({ data }) => {
        const total = (data ?? []).reduce((sum, row) => sum + (row.quantity ?? 1), 0)
        setCartCount(total)
      })
  }, [userId])

  const addToCart = useCallback(
    async (productId: string) => {
      if (!userId) {
        // Not logged in — still reflect locally so UI doesn't feel broken
        setCartCount((c) => c + 1)
        return
      }

      // Check if the product is already in the cart
      const { data: existing } = await supabase
        .from('cart')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle()

      if (existing) {
        // Increment existing row
        await supabase
          .from('cart')
          .update({ quantity: (existing.quantity ?? 1) + 1 })
          .eq('id', existing.id)
      } else {
        // Insert new row (quantity defaults to 1 per your schema)
        await supabase
          .from('cart')
          .insert({ user_id: userId, product_id: productId })
      }

      setCartCount((c) => c + 1)
    },
    [userId]
  )

  return { cartCount, addToCart }
}