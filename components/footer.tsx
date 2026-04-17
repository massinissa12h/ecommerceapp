import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-4">ModernShop</h3>
            <p className="text-sm opacity-80">
              Your destination for premium products across electronics, fashion, shoes, and accessories.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="opacity-80 hover:opacity-100 transition-opacity">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="opacity-80 hover:opacity-100 transition-opacity">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/cart" className="opacity-80 hover:opacity-100 transition-opacity">
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">
                  Shipping Info
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">
                  Returns
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-primary-foreground/20 pt-8">
          <p className="text-sm text-center opacity-80">
            &copy; {currentYear} ModernShop. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
