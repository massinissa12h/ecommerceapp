'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import {
  Shield,
  Loader2,
  Package,
  ShoppingBag,
  Sparkles,
  Lock,
} from 'lucide-react'

const TABS = [
  { href: '/admin', label: 'Products', icon: Package, exact: true },
  { href: '/admin/orders', label: 'Platform orders', icon: ShoppingBag },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [status, setStatus] = useState<'checking' | 'admin' | 'denied'>(
    'checking',
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      if (!uid) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
        return
      }
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', uid)
        .maybeSingle()
      if (cancelled) return
      setStatus(data?.role === 'admin' ? 'admin' : 'denied')
    })()
    return () => {
      cancelled = true
    }
  }, [router, pathname])

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 grid place-items-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 max-w-md mx-auto px-4 py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-5">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold">Admins only</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your account doesn&apos;t have access to the admin area.
          </p>
          <Link
            href="/"
            className="inline-flex items-center mt-6 rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium"
          >
            Back to shop
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Admin header */}
        <section className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-end justify-between gap-3 mb-5">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1 inline-flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </p>
                <h1 className="text-3xl font-semibold tracking-tight">
                  Souqly control center
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage platform-owned products and the orders placed on them.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 text-brand text-xs font-medium px-3 py-1.5">
                <Sparkles className="w-3 h-3" />
                Platform view
              </span>
            </div>

            <nav className="flex items-center gap-1">
              {TABS.map((t) => {
                const active = t.exact
                  ? pathname === t.href
                  : pathname === t.href || pathname.startsWith(t.href + '/')
                return (
                  <Link key={t.href} href={t.href}>
                    <motion.span
                      whileTap={{ scale: 0.97 }}
                      className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                        active
                          ? 'bg-foreground text-background'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      <t.icon className="w-3.5 h-3.5" />
                      {t.label}
                    </motion.span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-8">{children}</div>
      </main>
      <Footer />
    </div>
  )
}
