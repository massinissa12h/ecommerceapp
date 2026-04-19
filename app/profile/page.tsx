'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2, Check } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  })

  useEffect(() => {
  const checkAuthAndLoadProfile = async () => {
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      router.push("/login");
      return;
    }

    const user = data.session.user;
    setUser(user);

    // 🔥 fetch profile from DB
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) {
      setFormData({
        email: user.email || "",
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        phone: profile.phone || "",
        address: profile.street_address || "",
        city: profile.city || "",
        postalCode: profile.postal_code || "",
        country: profile.country || "",
      });
    } else {
      // fallback if no profile yet
      setFormData(prev => ({
        ...prev,
        email: user.email || "",
      }));
    }

    setLoading(false);
  };

  checkAuthAndLoadProfile();
}, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
  e.preventDefault();
  setSaving(true);
  setSaveSuccess(false);

  try {
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        street_address: formData.address,
        city: formData.city,
        postal_code: formData.postalCode,
        country: formData.country,
      });

    if (error) {
      console.error(error);
      return;
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  } catch (err) {
    console.error("Error saving profile:", err);
  } finally {
    setSaving(false);
  }
};

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground text-sm">Manage your account information</p>
          </div>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-600 dark:text-green-400">Profile updated successfully!</p>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSaveProfile} className="space-y-8">
          {/* Contact Information */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Contact Information</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <Input
                type="email"
                value={formData.email}
                disabled
                className="bg-muted opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
                <Input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
                <Input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Address</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Street Address</label>
              <Input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">City</label>
                <Input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="San Francisco"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Postal Code</label>
                <Input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="94105"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Country</label>
              <Input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="United States"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  )
}
