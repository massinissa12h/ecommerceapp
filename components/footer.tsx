import Link from 'next/link'
import { Store, Mail, Github, Twitter, Instagram } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="relative w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center">
                <Store className="w-4 h-4" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand ring-2 ring-card" />
              </div>
              <span className="text-[17px] font-semibold tracking-tight">
                Souqly
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              A modern marketplace where independent sellers and curated brands
              meet. Shop premium products, follow your favorite makers, and
              build the shop of your dreams.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <SocialLink href="#" icon={Twitter} />
              <SocialLink href="#" icon={Instagram} />
              <SocialLink href="#" icon={Github} />
            </div>
          </div>

          <FooterColumn title="Shop">
            <FooterLink href="/products">All products</FooterLink>
            <FooterLink href="/products?category=electronics">
              Electronics
            </FooterLink>
            <FooterLink href="/products?category=fashion">Fashion</FooterLink>
            <FooterLink href="/products?category=shoes">Shoes</FooterLink>
            <FooterLink href="/products?category=accessories">
              Accessories
            </FooterLink>
          </FooterColumn>

          <FooterColumn title="Sell">
            <FooterLink href="/dashboard">Seller dashboard</FooterLink>
            <FooterLink href="/dashboard/products/new">List a product</FooterLink>
            <FooterLink href="/dashboard/orders">Manage orders</FooterLink>
            <FooterLink href="#">Seller handbook</FooterLink>
          </FooterColumn>

          <FooterColumn title="Company">
            <FooterLink href="#">About</FooterLink>
            <FooterLink href="#">Help center</FooterLink>
            <FooterLink href="#">Privacy</FooterLink>
            <FooterLink href="#">Terms</FooterLink>
          </FooterColumn>
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">
            &copy; {currentYear} Souqly &middot; Built with care for makers.
          </p>
          <a
            href="mailto:support@souqly.com"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail className="w-4 h-4" />
            support@souqly.com
          </a>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">
        {title}
      </h4>
      <ul className="space-y-2 text-sm">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-foreground/80 hover:text-foreground transition-colors"
      >
        {children}
      </Link>
    </li>
  )
}

function SocialLink({ href, icon: Icon }: { href: string; icon: any }) {
  return (
    <Link
      href={href}
      className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
    >
      <Icon className="w-4 h-4" />
    </Link>
  )
}
