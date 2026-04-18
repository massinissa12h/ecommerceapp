'use client'

import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Mail, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function SignUpPage() {

  const router = useRouter();
  const[email,setEmail] = useState("");
  const[password,setPassword] = useState("");
  const[username,setUsername] = useState("");
  const[error,setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
     e.preventDefault();
     setError("")

     const { data , error } = await supabase.auth.signUp({
        email,
        password,
        
     });
     if(error) {
        setError(error.message)
        return;
     }
     
     const user = data.user;

     if (user) {
    // 🔥 insert into your users table
    const { error: dbError } = await supabase
      .from("users")
      .insert([
        {
          id: user.id,
          email: user.email,
          username: username,
        },
      ]);

    if (dbError) {
      setError(dbError.message);
      return;
    }
    }


     router.push("/login");

  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar cartCount={0} />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg border border-border p-8 shadow-sm">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Create Account
              </h1>
              <p className="text-muted-foreground">
                Sign up to get started with ModernShop
              </p>
            </div>

            {/* Form */}
            <form 
            onSubmit={handleSignup}
            className="space-y-4">
              {/* Name Field */}
              <div>
                <Label htmlFor="name" className="text-sm font-semibold mb-2 block">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

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

              {/* Confirm Password Field */}
              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-semibold mb-2 block">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    required
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2 pt-2">
                <Checkbox id="terms" required />
                <Label
                  htmlFor="terms"
                  className="text-xs font-normal text-muted-foreground cursor-pointer leading-tight"
                >
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary hover:text-primary/80">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary hover:text-primary/80">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              {/* Submit Button */}
              <Button type="submit" size="lg" className="w-full mt-6">
                Create Account
              </Button>
            </form>

            {/* Link to Login */}
            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                Already have an account?
              </p>
              <Link
                href="/login"
                className="inline-block mt-2 text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                Sign In
              </Link>
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
        </div>
      </main>

      <Footer />
    </div>
  )
}