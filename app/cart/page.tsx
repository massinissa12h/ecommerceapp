"use client";

import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CartPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar cartCount={0} />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-primary text-primary-foreground py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-2">Shopping Cart</h1>
            <p className="text-primary-foreground/90">
              0 items in your cart
            </p>
          </div>
        </section>

        {/* Cart Content */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Cart Items (Empty placeholder) */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-border p-6 text-center text-muted-foreground">
                No items yet
              </div>

              <div className="mt-6">
                <Link href="/products">
                  <Button
                    variant="outline"
                    className="inline-flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>

            {/* Order Summary (Empty values) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-border p-6 h-fit">
                <h2 className="text-xl font-bold text-foreground mb-6">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6 pb-6 border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground font-medium">$0.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-foreground font-medium">$0.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="text-foreground font-medium">$0.00</span>
                  </div>
                </div>

                <div className="flex justify-between text-lg font-bold text-foreground mb-6">
                  <span>Total</span>
                  <span>$0.00</span>
                </div>

                <p className="text-xs text-muted-foreground mb-4">
                  Add items to your cart to proceed
                </p>

                <Button className="w-full mb-3" size="lg" disabled>
                  Proceed to Checkout
                </Button>

                <Link href="/products">
                  <Button variant="outline" className="w-full" size="lg">
                    Continue Shopping
                  </Button>
                </Link>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-border space-y-2 text-xs text-muted-foreground">
                  <p>✓ Secure checkout</p>
                  <p>✓ 30-day returns</p>
                  <p>✓ Money-back guarantee</p>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}