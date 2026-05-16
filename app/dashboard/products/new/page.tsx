'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ProductForm } from '@/components/dashboard/product-form'
import { Loader2 } from 'lucide-react'

export default function NewProductPage() {
  const [uid, setUid] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUid(data.session?.user.id ?? null)
    })
  }, [])

  if (!uid) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return <ProductForm userId={uid} />
}
