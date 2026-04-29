'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductCard } from '@/components/product-card'
import {
  ArrowLeft,
  Loader2,
  Check,
  Heart,
  Star,
  AlertCircle,
  Lock,
  User,
  MapPin,
  ShieldCheck,
  Sparkles,
  Mail,
  Phone,
  PackageSearch,
  PenLine,
  Camera,
  ExternalLink,
  Trash2,
} from 'lucide-react'
import { UserAvatar } from '@/components/friends/user-avatar'

interface Product {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number | null
  image_url: string | null
  created_at: string | null
  image?: string
  rating?: number
}

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

export default function ProfilePage() {
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [changing, setChanging] = useState(false)
  const [changeSuccess, setChangeSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [likedProducts, setLikedProducts] = useState<Product[]>([])
  const [userReviews, setUserReviews] = useState<any[]>([])
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    bio: '',
    avatarUrl: '' as string | null | '',
  })

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      setLoading(true)

      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        router.push('/login')
        return
      }

      const currentUser = data.session.user
      setUser(currentUser)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (profile) {
        setFormData({
          email: currentUser.email || '',
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          phone: profile.phone || '',
          address: profile.street_address || '',
          city: profile.city || '',
          postalCode: profile.postal_code || '',
          country: profile.country || '',
          bio: profile.bio || '',
          avatarUrl: profile.avatar_url || '',
        })
      } else {
        setFormData((prev) => ({
          ...prev,
          email: currentUser.email || '',
        }))
      }

      await fetchUserInteractions(currentUser.id)
      await fetchUserReviews(currentUser.id)

      setLoading(false)
    }

    checkAuthAndLoadProfile()
  }, [router])

  const fetchUserInteractions = async (userId: string) => {
    const { data: interactionsData, error: interactionsError } = await supabase
      .from('interactions')
      .select('product_id, action')
      .eq('user_id', userId)

    if (interactionsError) {
      console.error('Failed to fetch interactions:', interactionsError)
      return
    }

    const likedIds =
      interactionsData
        ?.filter((item: any) => item.action === 'like' || item.action === 'liked')
        .map((item: any) => item.product_id)
        .filter(Boolean) ?? []

    if (likedIds.length === 0) {
      setLikedProducts([])
      return
    }

    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', likedIds)

    if (productsError) {
      console.error('Failed to fetch interaction products:', productsError)
      return
    }

    const products = (productsData ?? []).map((product: any) => ({
      ...product,
      image: product.image_url ?? '',
      rating: 0,
    }))

    setLikedProducts(products)
  }

  const fetchUserReviews = async (userId: string) => {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        product_id,
        rating,
        comment,
        created_at,
        products (
          id,
          name,
          image_url,
          price,
          category
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch user reviews:', error)
      return
    }

    setUserReviews(data ?? [])
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setAvatarError(null)

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be 5 MB or smaller.')
      return
    }
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select an image file.')
      return
    }

    setAvatarUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'png'

      const path = `${user.id}/avatar-${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' })
      if (upErr) throw upErr

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = pub.publicUrl

      const { error: dbErr } = await supabase
        .from('profiles')
        .upsert({ id: user.id, avatar_url: publicUrl })
      if (dbErr) throw dbErr

      setFormData((prev) => ({ ...prev, avatarUrl: publicUrl }))
    } catch (err: any) {
      setAvatarError(err.message || 'Upload failed')
    } finally {
      setAvatarUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user) return
    setAvatarUploading(true)
    setAvatarError(null)
    try {
      await supabase.from('profiles').upsert({ id: user.id, avatar_url: null })
      setFormData((prev) => ({ ...prev, avatarUrl: '' }))
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        street_address: formData.address,
        city: formData.city,
        postal_code: formData.postalCode,
        country: formData.country,
        bio: formData.bio || null,
        avatar_url: formData.avatarUrl || null,
      })

      if (error) {
        console.error(error)
        return
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setChanging(true)
    setErrorMessage('')
    setChangeSuccess(false)

    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setErrorMessage('Please fill in all fields.')
      setChanging(false)
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage('Passwords do not match.')
      setChanging(false)
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      setChanging(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.newPassword,
    })

    if (error) {
      setErrorMessage(error.message)
    } else {
      setChangeSuccess(true)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      setTimeout(() => setChangeSuccess(false), 3000)
    }

    setChanging(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />

        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-11 h-11 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your profile...</p>
        </main>

        <Footer />
      </div>
    )
  }

  const displayName =
    `${formData.firstName} ${formData.lastName}`.trim() ||
    user?.email?.split('@')[0] ||
    'User'

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 left-10 h-64 w-64 rounded-full bg-white/60 blur-3xl" />
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="relative max-w-6xl mx-auto px-4 py-14 md:py-20"
          >
            <motion.div variants={fadeUp} className="mb-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-primary-foreground/85 hover:text-primary-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="flex flex-col md:flex-row md:items-end md:justify-between gap-8"
            >
              <div className="flex items-center gap-5">
                <div className="relative shrink-0 group">
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    className="w-24 h-24 rounded-3xl bg-white/15 border border-white/20 backdrop-blur overflow-hidden flex items-center justify-center text-3xl font-bold shadow-xl"
                  >
                    {formData.avatarUrl ? (

                      <img
                        src={formData.avatarUrl}
                        alt="Your avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{displayName.charAt(0).toUpperCase()}</span>
                    )}
                  </motion.div>

                  <label
                    htmlFor="avatar-upload"
                    className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white text-primary border border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                    title="Change avatar"
                  >
                    {avatarUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={avatarUploading}
                    />
                  </label>
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-3 py-1 text-xs mb-3 backdrop-blur">
                    <Sparkles className="w-3.5 h-3.5" />
                    Personal shopping profile
                  </div>

                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    {displayName}
                  </h1>

                  <p className="text-primary-foreground/80 mt-2">
                    Manage your account, likes, and reviews.
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {user && (
                      <Link href={`/u/${user.id}`}>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="rounded-full gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View public profile
                        </Button>
                      </Link>
                    )}
                    {formData.avatarUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full gap-1.5 text-white/80 hover:text-white hover:bg-white/10"
                        onClick={handleRemoveAvatar}
                        disabled={avatarUploading}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove avatar
                      </Button>
                    )}
                  </div>

                  {avatarError && (
                    <p className="text-xs text-rose-100 bg-rose-500/30 mt-2 px-3 py-1 rounded-full inline-block">
                      {avatarError}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 min-w-full md:min-w-[260px]">
                {[
                  ['Liked', likedProducts.length, Heart],
                  ['Reviews', userReviews.length, Star],
                ].map(([label, value, Icon]: any) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-4"
                  >
                    <Icon className="w-5 h-5 mb-2" />
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-primary-foreground/75">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </section>

        <section className="max-w-6xl mx-auto w-full px-4 py-10 md:py-14">
          <AnimatePresence>
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-2"
              >
                <Check className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-700">
                  Profile updated successfully!
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.form
            initial="hidden"
            animate="visible"
            variants={stagger}
            onSubmit={handleSaveProfile}
            className="space-y-8 mb-12"
          >
            <motion.div
              variants={fadeUp}
              className="bg-white border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6"
            >
              <SectionTitle
                icon={User}
                title="Contact Information"
                subtitle="Keep your basic account details up to date."
              />

              <div>
                <LabelText>Email</LabelText>

                <div className="relative">
                  <Input
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted opacity-70 cursor-not-allowed pl-10 rounded-xl"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                />

                <Field
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                />
              </div>

              <div>
                <LabelText>Phone Number</LabelText>

                <div className="relative">
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                    className="pl-10 rounded-xl"
                  />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div>
                <LabelText>Bio</LabelText>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell other shoppers a bit about yourself…"
                  rows={3}
                  maxLength={500}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {formData.bio.length}/500
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="bg-white border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6"
            >
              <SectionTitle
                icon={MapPin}
                title="Address"
                subtitle="Used later for checkout and shipping."
              />

              <Field
                label="Street Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="123 Main Street"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="San Francisco"
                />

                <Field
                  label="Postal Code"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="94105"
                />
              </div>

              <Field
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="United States"
              />
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={saving}
                className="gap-2 rounded-xl"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </motion.div>
          </motion.form>

          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="space-y-10"
          >
            <motion.div
              variants={fadeUp}
              className="bg-white border border-border rounded-3xl p-6 md:p-8 shadow-sm"
            >
              <SectionTitle
                icon={ShieldCheck}
                title="Security"
                subtitle="Update your password and keep your account protected."
              />

              <AnimatePresence>
                {changeSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-2"
                  >
                    <Check className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-700">
                      Password updated successfully!
                    </p>
                  </motion.div>
                )}

                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-2xl flex items-center gap-2"
                  >
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <p className="text-sm text-destructive">{errorMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form
                onSubmit={handlePasswordChange}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <PasswordField
                  label="Current Password"
                  value={passwordForm.currentPassword}
                  onChange={(value) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: value,
                    }))
                  }
                  placeholder="Current password"
                />

                <PasswordField
                  label="New Password"
                  value={passwordForm.newPassword}
                  onChange={(value) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: value,
                    }))
                  }
                  placeholder="New password"
                />

                <PasswordField
                  label="Confirm Password"
                  value={passwordForm.confirmPassword}
                  onChange={(value) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: value,
                    }))
                  }
                  placeholder="Confirm password"
                />

                <div className="md:col-span-3">
                  <Button
                    type="submit"
                    disabled={changing}
                    className="gap-2 rounded-xl"
                  >
                    {changing && <Loader2 className="w-4 h-4 animate-spin" />}
                    {changing ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </motion.div>

            <ProductSection
              icon={Heart}
              title="Liked Products"
              count={likedProducts.length}
              emptyText="You have no liked products yet."
              products={likedProducts}
            />

            <motion.div
              variants={fadeUp}
              className="bg-white border border-border rounded-3xl p-6 md:p-8 shadow-sm"
            >
              <SectionTitle
                icon={Star}
                title="My Reviews"
                subtitle="Products you reviewed before."
                count={userReviews.length}
              />

              {userReviews.length > 0 ? (
                <motion.div variants={stagger} className="space-y-4">
                  {userReviews.map((review) => (
                    <motion.div
                      key={review.id}
                      variants={fadeUp}
                      whileHover={{ y: -3 }}
                      className="border border-border rounded-2xl p-4 flex gap-4 bg-background"
                    >
                      <img
                        src={review.products?.image_url || '/placeholder.png'}
                        alt={review.products?.name || 'Product'}
                        className="w-20 h-20 object-cover rounded-2xl bg-muted border border-border"
                      />

                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {review.products?.name || 'Unknown product'}
                        </h3>

                        <p className="text-sm text-muted-foreground mb-2">
                          {review.products?.category || 'No category'} · $
                          {review.products?.price ?? 0}
                        </p>

                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={
                                star <= review.rating
                                  ? 'text-amber-400'
                                  : 'text-muted-foreground'
                              }
                            >
                              ★
                            </span>
                          ))}
                        </div>

                        {review.comment ? (
                          <p className="text-sm text-foreground mb-4">
                            {review.comment}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic mb-4">
                            No comment added.
                          </p>
                        )}

                        <Link href={`/product/${review.product_id}`}>
                          <Button size="sm" variant="outline" className="rounded-xl">
                            <PenLine className="w-4 h-4 mr-2" />
                            Change Review
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <EmptyState text="You have not reviewed any products yet." />
              )}
            </motion.div>
          </motion.section>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
  count,
}: {
  icon: any
  title: string
  subtitle?: string
  count?: number
}) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>

      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>

          {typeof count === 'number' && (
            <span className="text-xs bg-secondary text-muted-foreground px-2 py-1 rounded-full">
              {count}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

function LabelText({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-foreground mb-2">
      {children}
    </label>
  )
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
}) {
  return (
    <div>
      <LabelText>{label}</LabelText>
      <Input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="rounded-xl"
      />
    </div>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div>
      <LabelText>{label}</LabelText>

      <div className="relative">
        <Input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 rounded-xl"
        />

        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  )
}

function ProductSection({
  icon,
  title,
  count,
  emptyText,
  products,
}: {
  icon: any
  title: string
  count: number
  emptyText: string
  products: Product[]
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="bg-white border border-border rounded-3xl p-6 md:p-8 shadow-sm"
    >
      <SectionTitle icon={icon} title={title} count={count} />

      {products.length > 0 ? (
        <motion.div
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {products.map((product) => (
            <motion.div
              key={product.id}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <ProductCard product={product as any} onAddToCart={() => {}} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState text={emptyText} />
      )}
    </motion.div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-background">
      <PackageSearch className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
