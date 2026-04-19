'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Check, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [changing, setChanging] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [changeSuccess, setChangeSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })


  const handlePasswordChange = async (e: React.FormEvent) => {
  e.preventDefault();
  setChanging(true);
  setErrorMessage('');
  setChangeSuccess(false);

  if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
    setErrorMessage('Please fill in all fields.');
    setChanging(false);
    return;
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    setErrorMessage('Passwords do not match.');
    setChanging(false);
    return;
  }

  if (passwordForm.newPassword.length < 6) {
    setErrorMessage('Password must be at least 6 characters.');
    setChanging(false);
    return;
  }

  const { error } = await supabase.auth.updateUser({
    password: passwordForm.newPassword,
  });

  if (error) {
    setErrorMessage(error.message);
  } else {
    setChangeSuccess(true);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  }

  setChanging(false);
};

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
       
        {/* Security Settings */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Security</h2>
          </div>

          {/* Change Password */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-foreground">Password</h3>
                <p className="text-sm text-muted-foreground">Change your password to keep your account secure</p>
              </div>
              
            </div>

            
              <form onSubmit={handlePasswordChange} className="space-y-4 pt-4 border-t border-border">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Confirm new password"
                  />
                </div>

                <Button type="submit" disabled={changing} className="w-full gap-2">
                  {changing && <Loader2 className="w-4 h-4 animate-spin" />}
                  {changing ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            
            
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
