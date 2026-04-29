import Link from 'next/link'
import {
  Store,
  Sparkles,
  Mail,
  ShieldCheck,
  Truck,
  RotateCcw,
  ArrowRight,
} from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/cart', label: 'Cart' },
    { href: '/foryou', label: 'For You' },
  ]

  const supportLinks = ['Contact Us', 'FAQ', 'Shipping Info', 'Track Order']
  const legalLinks = ['Privacy Policy', 'Terms of Service', 'Returns', 'Refund Policy']

  return (
    <footer className="relative overflow-hidden w-full bg-primary text-primary-foreground">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-white/70 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-14">
        <div className="mb-12 rounded-3xl border border-white/15 bg-white/10 backdrop-blur px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-sm mb-3 opacity-90">
              <Sparkles className="w-4 h-4" />
              Premium shopping experience
            </div>

            <h2 className="text-2xl md:text-3xl font-bold">
              Find your next favorite product.
            </h2>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-foreground text-primary px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Shop Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>

              <div>
                <h3 className="font-bold text-xl leading-none">ModernShop</h3>
                <p className="text-xs opacity-70 mt-1">Curated marketplace</p>
              </div>
            </div>

            <p className="text-sm opacity-80 leading-relaxed">
              Your destination for premium products across electronics, fashion,
              shoes, and accessories.
            </p>

            <div className="mt-5 grid gap-2 text-xs opacity-90">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Secure shopping experience
              </div>

              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Fast product discovery
              </div>

              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Easy returns
              </div>
            </div>
          </div>

          <FooterColumn title="Quick Links">
            {quickLinks.map((link) => (
              <FooterLink key={link.href} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Support">
            {supportLinks.map((label) => (
              <FooterLink key={label} href="#">
                {label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Legal">
            {legalLinks.map((label) => (
              <FooterLink key={label} href="#">
                {label}
              </FooterLink>
            ))}
          </FooterColumn>
        </div>

        <div className="border-t border-primary-foreground/20 pt-7 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-center opacity-80">
            &copy; {currentYear} ModernShop. All rights reserved.
          </p>

          <a
            href="mailto:support@modernshop.com"
            className="inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100 transition-opacity"
          >
            <Mail className="w-4 h-4" />
            support@modernshop.com
          </a>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h4 className="font-semibold mb-4">{title}</h4>
      <ul className="space-y-2 text-sm">{children}</ul>
    </div>
  )
}

function FooterLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity"
      >
        <span className="w-1 h-1 rounded-full bg-primary-foreground/60 group-hover:w-3 transition-all" />
        {children}
      </Link>
    </li>
  )
}
