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
  Settings,
  LayoutDashboard,
  Store,
  Heart,
  PackageCheck,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NotificationBell } from '@/components/notification-bell'
import { ThemeToggle } from '@/components/theme-toggle'
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
  const dropdownRef = useRef<HTMLDivElement | null>(null)

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

  useEffect(() => {
    if (!user?.id) {
      setAvatarUrl(null)
      return
    }
    let cancelled = false
    supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setAvatarUrl((data?.avatar_url as string | null) ?? null)
      })

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

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!dropdownRef.current) return
      if (!dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

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
    { href: '/products', label: 'Shop' },
    { href: '/foryou', label: 'For You' },
    ...(user ? [{ href: '/friends', label: 'Friends' }] : []),
    ...(user ? [{ href: '/dashboard', label: 'Sell', accent: true }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="relative w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center">
            <Store className="w-4 h-4" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand ring-2 ring-background" />
          </div>
          <span className="text-[17px] font-semibold tracking-tight leading-none">
            Souqly
          </span>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Input
              type="search"
              placeholder="Search products, sellers, categories"
              className="w-full pl-9 pr-3 h-10 rounded-lg bg-secondary/60 border-transparent focus-visible:bg-card focus-visible:border-border"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
        </form>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link key={link.href} href={link.href}>
                <span
                  className={`relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    link.accent
                      ? 'text-brand hover:bg-brand/10'
                      : active
                        ? 'text-foreground bg-secondary'
                        : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.label}
                  {active && !link.accent && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute left-3 right-3 -bottom-0.5 h-[2px] bg-foreground rounded-full"
                    />
                  )}
                </span>
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-1.5">
          {!user && (
            <div className="hidden md:flex gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Create account</Button>
              </Link>
            </div>
          )}

          {user && (
            <div className="hidden md:block">
              <NotificationBell userId={user.id} />
            </div>
          )}

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          <Link href="/cart" aria-label="Cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="w-5 h-5" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 bg-brand text-brand-foreground text-[10px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center font-semibold"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </Link>

          {user && (
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen((p) => !p)}
                className="w-9 h-9 rounded-full bg-secondary text-foreground flex items-center justify-center overflow-hidden ring-1 ring-border hover:ring-foreground/40 transition"
              >
                {avatarUrl || user.user_metadata?.avatar_url ? (
                  <img
                    src={avatarUrl ?? user.user_metadata?.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold">
                    {(user.email ?? 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 bg-popover border border-border rounded-xl shadow-elevated-lg z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Signed in
                      </p>
                      <p className="text-sm font-medium truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>

                    <DropdownItem
                      href="/dashboard"
                      icon={LayoutDashboard}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Seller Dashboard
                    </DropdownItem>
                    <DropdownItem
                      href={`/u/${user.id}`}
                      icon={User}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Public profile
                    </DropdownItem>
                    <DropdownItem
                      href="/orders"
                      icon={PackageCheck}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      My orders
                    </DropdownItem>
                    <DropdownItem
                      href="/wishlist"
                      icon={Heart}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Wishlist
                    </DropdownItem>
                    <DropdownItem
                      href="/profile"
                      icon={Settings}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Account settings
                    </DropdownItem>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors border-t border-border"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button
            onClick={() => setIsMenuOpen((p) => !p)}
            className="md:hidden w-9 h-9 rounded-md border border-border flex items-center justify-center"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-card overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-9 rounded-lg bg-secondary/60 border-transparent"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </form>

              <div className="grid gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium ${
                      pathname === link.href
                        ? 'bg-secondary text-foreground'
                        : 'text-foreground/80'
                    } ${link.accent ? 'text-brand' : ''}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="border-t border-border pt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Appearance</p>
                <ThemeToggle />
              </div>

              <div className="border-t border-border pt-4 grid gap-2">
                {user ? (
                  <>
                    <div className="rounded-lg bg-secondary p-3">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Signed in
                      </p>
                      <p className="text-sm font-medium truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Seller Dashboard
                      </Button>
                    </Link>
                    <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="w-4 h-4 mr-2" />
                        Account settings
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </Button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Sign in
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full">Create account</Button>
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

function DropdownItem({
  href,
  icon: Icon,
  onClick,
  children,
}: {
  href: string
  icon: any
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
    >
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span>{children}</span>
    </Link>
  )
}
