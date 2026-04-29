'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart,
  Menu,
  X,
  Search,
  LogOut,
  User,
  Sparkles,
  Store,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NotificationBell } from '@/components/notification-bell'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface NavbarProps {
  cartCount?: number
}

export function Navbar({ cartCount = 0 }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname === '/products') {
      setSearchValue(searchParams.get('q') ?? '')
    } else {
      setSearchValue('')
    }
  }, [pathname, searchParams])

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user ?? null)
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener?.subscription.unsubscribe()
  }, [])

  // Load avatar_url from profiles whenever the signed-in user changes,
  // and stay in sync with realtime updates so the navbar reflects edits
  // made on the /profile page without a hard refresh.
  useEffect(() => {
    if (!user?.id) {
      setAvatarUrl(null)
      return
    }

    let cancelled = false
    const loadAvatar = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle()
      if (cancelled) return
      setAvatarUrl((data?.avatar_url as string | null) ?? null)
    }
    loadAvatar()

    const channel = supabase
      .channel(`navbar-profile:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          const next = (payload.new as { avatar_url?: string | null } | null)?.avatar_url
          setAvatarUrl(next ?? null)
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsDropdownOpen(false)
    setIsMenuOpen(false)
    router.push('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchValue.trim()
    setIsMenuOpen(false)
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : '/products')
  }

  const navLinks = [
    { href: '/products', label: 'Products' },
    { href: '/foryou', label: 'For You' },
    ...(user ? [{ href: '/friends', label: 'Friends' }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/80 backdrop-blur-xl">
      <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <motion.div
            whileHover={{ rotate: -8, scale: 1.05 }}
            className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm"
          >
            <Store className="w-5 h-5" />
          </motion.div>

          <div>
            <p className="text-xl font-bold tracking-tight text-foreground leading-none">
              ModernShop
            </p>
            <p className="hidden sm:block text-[11px] text-muted-foreground mt-0.5">
              Premium shopping
            </p>
          </div>
        </Link>

        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-sm"
        >
          <div className="relative w-full group">
            <Input
              type="search"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 h-10 rounded-full bg-secondary/70 border-border focus:bg-white transition-all"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />

            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
        </form>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = pathname === link.href

            return (
              <Link key={link.href} href={link.href}>
                <motion.div
                  whileHover={{ y: -2 }}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    active
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {link.label}

                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-full border border-primary/20"
                    />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          {!user && (
            <div className="hidden md:flex gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="rounded-full">
                  Login
                </Button>
              </Link>

              <Link href="/signup">
                <Button size="sm" className="rounded-full">
                  Sign up
                </Button>
              </Link>
            </div>
          )}

          {user && (
            <div className="hidden md:block">
              <NotificationBell userId={user.id} />
            </div>
          )}

          {user && (
            <div className="relative hidden md:block">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center overflow-hidden ring-2 ring-primary/10"
              >
                {avatarUrl || user.user_metadata?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl ?? user.user_metadata?.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.email?.charAt(0).toUpperCase() || 'U'
                )}
              </motion.button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    className="absolute right-0 mt-3 w-64 bg-white border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-4 border-b border-border bg-secondary/60">
                      <p className="text-xs text-muted-foreground mb-1">
                        Signed in as
                      </p>
                      <p className="text-sm font-medium truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      href={`/u/${user.id}`}
                      className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-secondary transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Public profile
                    </Link>

                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-secondary transition-colors border-t"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Sparkles className="w-4 h-4" />
                      Settings
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors border-t"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <Link href="/cart">
            <motion.div whileTap={{ scale: 0.94 }}>
              <Button variant="ghost" size="sm" className="relative rounded-full">
                <ShoppingCart className="w-5 h-5" />

                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[11px] rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-bold"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </Link>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden w-10 h-10 rounded-full border border-border flex items-center justify-center"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-white/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-10 rounded-full"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </form>

              <div className="grid gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium ${
                      pathname === link.href
                        ? 'bg-primary/10 text-primary'
                        : 'bg-secondary text-foreground'
                    }`}
                  >
                    {link.label}
                    {pathname === link.href && <Sparkles className="w-4 h-4" />}
                  </Link>
                ))}
              </div>

              <div className="border-t border-border pt-4 grid gap-2">
                {user ? (
                  <>
                    <div className="rounded-2xl bg-secondary p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Signed in as
                      </p>
                      <p className="text-sm font-medium truncate">{user.email}</p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="rounded-2xl px-4 py-3 bg-secondary text-sm font-medium"
                    >
                      Profile
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="rounded-2xl px-4 py-3 bg-destructive/10 text-destructive text-sm font-medium text-left"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full rounded-xl">
                        Login
                      </Button>
                    </Link>

                    <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full rounded-xl">
                        Sign up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}