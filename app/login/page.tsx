'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setIsLoading(false)
        return
      }
      // In a real app, you would create the user here
      console.log('Signing up with:', { name, email, password })
    } else {
      // In a real app, you would authenticate the user here
      console.log('Logging in with:', { email, password })
    }

    setIsLoading(false)
    // Redirect or show success message
    alert(`${isSignUp ? 'Sign up' : 'Login'} successful! (This is a demo)`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar cartCount={0} />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Form Container */}
          <div className="bg-white rounded-lg border border-border p-8 shadow-sm">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h1>
              <p className="text-muted-foreground">
                {isSignUp
                  ? 'Sign up to get started with ModernShop'
                  : 'Sign in to your account to continue'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field (Sign Up Only) */}
              {isSignUp && (
                <div>
                  <Label htmlFor="name" className="text-sm font-semibold mb-2 block">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isSignUp}
                  />
                </div>
              )}

              {/* Email Field */}
              <div>
                <Label htmlFor="email" className="text-sm font-semibold mb-2 block">
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <Label htmlFor="password" className="text-sm font-semibold mb-2 block">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Confirm Password Field (Sign Up Only) */}
              {isSignUp && (
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold mb-2 block">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required={isSignUp}
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Remember Me / Forgot Password (Login Only) */}
              {!isSignUp && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                  <a
                    href="#"
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
              )}

              {/* Terms (Sign Up Only) */}
              {isSignUp && (
                <div className="flex items-start gap-2 pt-2">
                  <Checkbox id="terms" defaultChecked={false} />
                  <Label
                    htmlFor="terms"
                    className="text-xs font-normal text-muted-foreground cursor-pointer leading-tight"
                  >
                    I agree to the{' '}
                    <a href="#" className="text-primary hover:text-primary/80">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-primary hover:text-primary/80">
                      Privacy Policy
                    </a>
                  </Label>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full mt-6"
                disabled={isLoading}
              >
                {isLoading
                  ? 'Processing...'
                  : isSignUp
                    ? 'Create Account'
                    : 'Sign In'}
              </Button>
            </form>

            {/* Toggle Sign Up / Login */}
            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </p>
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                  setEmail('')
                  setPassword('')
                  setConfirmPassword('')
                  setName('')
                }}
                className="mt-2 text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>

            {/* Divider */}
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

            {/* Social Login Buttons */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full" size="sm">
                Google
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                GitHub
              </Button>
            </div>
          </div>

          {/* Additional Links */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>
              By continuing, you agree to our{' '}
              <a href="#" className="text-primary hover:text-primary/80">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary hover:text-primary/80">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
