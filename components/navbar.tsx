'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
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
  MapPin,
  ChevronDown,
  Headphones,
  Shirt,
  Watch,
  Footprints,
  Zap,
  Tag,
  Leaf,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/notification-bell'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface NavbarProps {
  cartCount?: number
}

const CATEGORY_LINKS = [
  { href: '/products?category=electronics', label: 'Electronics', icon: Headphones },
  { href: '/products?category=fashion', label: 'Fashion', icon: Shirt },
  { href: '/products?category=shoes', label: 'Shoes', icon: Footprints },
  { href: '/products?category=accessories', label: 'Accessories', icon: Watch },
  { href: '/products', label: "Today's Deals", icon: Zap, highlight: true },
  { href: '/products', label: 'New Arrivals', icon: Tag },
]

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
    if (pathname === '/products') setSearchValue(searchParams.get('q') ?? '')
    else setSearchValue('')
  }, [pathname, searchParams])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null))
    return () => listener?.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user?.id) { setAvatarUrl(null); return }
    let cancelled = false
    supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (!cancelled) setAvatarUrl((data?.avatar_url as string | null) ?? null) })
    const channel = supabase.channel(`navbar-profile:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => setAvatarUrl((payload.new as any)?.avatar_url ?? null))
      .subscribe()
    return () => { cancelled = true; supabase.removeChannel(channel) }
  }, [user?.id])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setIsDropdownOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null); setIsDropdownOpen(false); setIsMenuOpen(false)
    router.push('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchValue.trim()
    setIsMenuOpen(false)
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : '/products')
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Announcement strip */}
      <div style={{ backgroundColor: '#92B775' }} className="text-[#133215] text-xs text-center py-1.5 px-4 font-medium hidden md:block">
        🌿 Free shipping on orders over $25 &nbsp;·&nbsp; 30-day returns &nbsp;·&nbsp; Sustainably sourced products
      </div>

      {/* Main nav — Forest Green */}
      <div style={{ backgroundColor: '#133215' }} className="text-white">
        <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#92B775' }}>
              <Leaf className="w-5 h-5" style={{ color: '#133215' }} />
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:block">Souqly</span>
          </Link>

          {/* Deliver to */}
          <button className="hidden lg:flex items-start gap-1.5 rounded px-2 py-1 hover:bg-white/10 transition shrink-0">
            <MapPin className="w-3.5 h-3.5 mt-0.5 opacity-70" />
            <div className="text-left">
              <p className="text-[10px] opacity-70 leading-none">Deliver to</p>
              <p className="text-xs font-semibold leading-tight">Your location</p>
            </div>
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex">
            <div className="flex w-full rounded-lg overflow-hidden ring-2" style={{ '--tw-ring-color': '#92B775' } as any}>
              <input
                type="search"
                placeholder="Search products, brands, sellers…"
                className="flex-1 px-4 py-2.5 text-sm text-[#133215] bg-[#F3E8D3] placeholder:text-[#133215]/50 outline-none min-w-0"
                style={{ backgroundColor: '#F3E8D3' }}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <button
                type="submit"
                className="px-5 flex items-center justify-center transition-colors shrink-0"
                style={{ backgroundColor: '#92B775' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#7fa362')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#92B775')}
              >
                <Search className="w-5 h-5" style={{ color: '#133215' }} />
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0">

            {/* Account */}
            {user ? (
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(p => !p)}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                    {avatarUrl || user.user_metadata?.avatar_url ? (
                      <img src={avatarUrl ?? user.user_metadata?.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold">{(user.email ?? 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-[10px] opacity-70 leading-none">Hello, {user.email?.split('@')[0]}</p>
                    <p className="text-xs font-semibold leading-tight flex items-center gap-0.5">Account <ChevronDown className="w-3 h-3" /></p>
                  </div>
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 bg-white border border-border rounded-xl shadow-elevated-lg z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-border" style={{ backgroundColor: '#F3E8D3' }}>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Signed in as</p>
                        <p className="text-sm font-semibold truncate mt-0.5 text-[#133215]">{user.email}</p>
                      </div>
                      <DropdownItem href="/dashboard" icon={LayoutDashboard} onClick={() => setIsDropdownOpen(false)}>Seller Dashboard</DropdownItem>
                      <DropdownItem href={`/u/${user.id}`} icon={User} onClick={() => setIsDropdownOpen(false)}>Public Profile</DropdownItem>
                      <DropdownItem href="/orders" icon={PackageCheck} onClick={() => setIsDropdownOpen(false)}>My Orders</DropdownItem>
                      <DropdownItem href="/wishlist" icon={Heart} onClick={() => setIsDropdownOpen(false)}>Wishlist</DropdownItem>
                      <DropdownItem href="/profile" icon={Settings} onClick={() => setIsDropdownOpen(false)}>Account Settings</DropdownItem>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors border-t border-border"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login">
                  <button className="px-4 py-1.5 rounded text-sm font-medium hover:bg-white/10 transition">Sign in</button>
                </Link>
                <Link href="/signup">
                  <button
                    className="px-4 py-1.5 rounded text-sm font-semibold transition"
                    style={{ backgroundColor: '#92B775', color: '#133215' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#7fa362')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#92B775')}
                  >
                    Create account
                  </button>
                </Link>
              </div>
            )}

            {/* Orders */}
            <Link href="/orders" className="hidden lg:flex flex-col px-2 py-1 rounded hover:bg-white/10">
              <p className="text-[10px] opacity-70 leading-none">Returns</p>
              <p className="text-xs font-semibold leading-tight">& Orders</p>
            </Link>

            {/* Notifications */}
            {user && (
              <div className="hidden md:block [&_button]:text-white [&_button:hover]:bg-white/10 [&_button]:rounded [&_button]:p-1.5">
                <NotificationBell userId={user.id} />
              </div>
            )}

            {/* Wishlist */}
            <Link href="/wishlist" className="hidden sm:flex flex-col items-center px-2 py-1 rounded hover:bg-white/10">
              <Heart className="w-5 h-5" />
              <p className="text-[10px] font-semibold leading-tight">Wishlist</p>
            </Link>

            {/* Cart */}
            <Link href="/cart" className="flex items-end gap-1.5 px-2 py-1 rounded hover:bg-white/10">
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center"
                    style={{ backgroundColor: '#92B775', color: '#133215' }}
                  >
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold pb-0.5 hidden sm:block">Cart</span>
            </Link>

            {/* Sell */}
            <Link href="/dashboard" className="hidden md:flex flex-col px-2 py-1 rounded hover:bg-white/10">
              <p className="text-[10px] opacity-70 leading-none">Open your</p>
              <p className="text-xs font-semibold leading-tight">Shop</p>
            </Link>

            {/* Mobile toggle */}
            <button
              onClick={() => setIsMenuOpen(p => !p)}
              className="md:hidden w-9 h-9 rounded flex items-center justify-center hover:bg-white/10"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Category strip */}
      <div style={{ backgroundColor: '#1e4a20' }} className="text-white border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex items-center overflow-x-auto scrollbar-none">
          <Link href="/products" className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap hover:bg-white/10 rounded transition-colors shrink-0">
            <Menu className="w-3.5 h-3.5" /> All Categories
          </Link>
          {CATEGORY_LINKS.map((cat) => (
            <Link
              key={cat.href + cat.label}
              href={cat.href}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap hover:bg-white/10 rounded transition-colors shrink-0"
              style={cat.highlight ? { color: '#92B775' } : undefined}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.label}
            </Link>
          ))}
          <Link href="/foryou" className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap hover:bg-white/10 rounded transition-colors shrink-0">
            For You
          </Link>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-border overflow-hidden"
            style={{ backgroundColor: '#F3E8D3' }}
          >
            <div className="px-4 py-4 space-y-4">
              <form onSubmit={handleSearch} className="flex rounded-lg overflow-hidden border border-border">
                <input
                  type="search"
                  placeholder="Search products…"
                  className="flex-1 px-3 py-2.5 text-sm bg-white text-[#133215] outline-none placeholder:text-[#133215]/40"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
                <button type="submit" className="px-4 flex items-center" style={{ backgroundColor: '#92B775' }}>
                  <Search className="w-4 h-4" style={{ color: '#133215' }} />
                </button>
              </form>

              <div className="grid gap-1">
                {CATEGORY_LINKS.map((link) => (
                  <Link key={link.href + link.label} href={link.href} onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/60 text-[#133215]">
                    <link.icon className="w-4 h-4" style={{ color: link.highlight ? '#92B775' : undefined }} />
                    {link.label}
                  </Link>
                ))}
                <Link href="/foryou" onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/60 text-[#133215]">
                  For You
                </Link>
              </div>

              <div className="border-t border-border pt-4 grid gap-2">
                {user ? (
                  <>
                    <div className="rounded-lg bg-white border border-border p-3">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Signed in</p>
                      <p className="text-sm font-semibold truncate mt-0.5 text-[#133215]">{user.email}</p>
                    </div>
                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start"><LayoutDashboard className="w-4 h-4 mr-2" />Seller Dashboard</Button>
                    </Link>
                    <Link href="/orders" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start"><PackageCheck className="w-4 h-4 mr-2" />My Orders</Button>
                    </Link>
                    <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-destructive hover:bg-destructive/10">
                      <LogOut className="w-4 h-4 mr-2" />Sign out
                    </Button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full">Sign in</Button>
                    </Link>
                    <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full" style={{ backgroundColor: '#133215', color: '#F3E8D3' }}>Create account</Button>
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

function DropdownItem({ href, icon: Icon, onClick, children }: { href: string; icon: any; onClick?: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#133215] hover:bg-[#F3E8D3] transition-colors">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span>{children}</span>
    </Link>
  )
}
