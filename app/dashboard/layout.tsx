'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  PlusCircle,
  ChevronLeft,
  Loader2,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/products', label: 'My products', icon: Package },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/dashboard/settings', label: 'Shop settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let unsub: any
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null
      setUserId(uid)
      setChecking(false)
      if (!uid) router.replace('/login?next=/dashboard')
    })
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_e, session) => {
        const uid = session?.user.id ?? null
        setUserId(uid)
        if (!uid) router.replace('/login?next=/dashboard')
      },
    )
    unsub = listener
    return () => unsub?.subscription?.unsubscribe?.()
  }, [router])

  if (checking || !userId) {
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        <aside className="lg:sticky lg:top-20 lg:self-start space-y-1">
          <Link
            href="/"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-3"
          >
            <ChevronLeft className="w-3 h-3 mr-1" />
            Back to shop
          </Link>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-2">
            Seller hub
          </p>
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors ${
                  active
                    ? 'bg-foreground text-background font-medium'
                    : 'text-foreground/80 hover:bg-secondary'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}

          <div className="pt-3">
            <Link href="/dashboard/products/new">
              <button className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-brand text-brand-foreground px-3 py-2 text-sm font-medium hover:bg-brand/90 transition-colors">
                <PlusCircle className="w-4 h-4" />
                New product
              </button>
            </Link>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
      <Footer />
    </div>
  )
}
