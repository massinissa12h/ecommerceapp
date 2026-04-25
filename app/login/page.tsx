'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      <Navbar cartCount={0} />

      <main className="relative flex-1 flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-secondary" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
        >
          <motion.div variants={fadeUp} className="hidden lg:block">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary border border-primary/20 px-4 py-2 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Modern shopping experience
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-foreground mb-5">
              Welcome back to your favorite store.
            </h1>

            <p className="text-lg text-muted-foreground max-w-md leading-relaxed mb-8">
              Sign in to continue shopping, save products, write reviews, and
              manage your cart.
            </p>

            <div className="grid grid-cols-1 gap-4 max-w-md">
              {[
                [ShoppingBag, 'Track your cart and orders'],
                [ShieldCheck, 'Secure Supabase authentication'],
                [Sparkles, 'Personalized shopping actions'],
              ].map(([Icon, text]: any) => (
                <motion.div
                  key={text}
                  whileHover={{ x: 6 }}
                  className="flex items-center gap-3 rounded-2xl bg-white/70 backdrop-blur border border-border p-4 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="font-medium text-foreground">{text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="w-full max-w-md mx-auto">
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl border border-border p-8 shadow-xl"
            >
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-5 shadow-sm">
                  <Lock className="w-5 h-5" />
                </div>

                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Welcome Back
                </h1>

                <p className="text-muted-foreground">
                  Sign in to your account to continue
                </p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-5 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="text-sm">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form className="space-y-4" onSubmit={handleLogin}>
                <div>
                  <Label
                    htmlFor="email"
                    className="text-sm font-semibold mb-2 block"
                  >
                    Email Address
                  </Label>

                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 h-11 rounded-xl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold mb-2 block"
                  >
                    Password
                  </Label>

                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-11 rounded-xl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox id="rememberMe" />
                    <Label
                      htmlFor="rememberMe"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>

                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-6 rounded-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <p className="text-muted-foreground">
                  Don&apos;t have an account?
                </p>

                <Link
                  href="/signup"
                  className="inline-block mt-2 text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Create Account
                </Link>
              </div>

              <div className="mt-6 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>

                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full rounded-xl" size="sm">
                  Google
                </Button>
                <Button variant="outline" className="w-full rounded-xl" size="sm">
                  GitHub
                </Button>
              </div>
            </motion.div>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              <p>
                By continuing, you agree to our{' '}
                <Link href="/terms" className="text-primary hover:text-primary/80">
                  Terms
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  className="text-primary hover:text-primary/80"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}