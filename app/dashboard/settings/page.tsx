'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImageUploader } from '@/components/dashboard/image-uploader'
import {
  Loader2,
  Save,
  ExternalLink,
  Store,
  Globe,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Music,
  Github,
  Linkedin,
  Megaphone,
  Plane,
  Package,
  RotateCcw,
} from 'lucide-react'
import Link from 'next/link'

const SOCIALS: Array<{ key: string; label: string; icon: any; placeholder: string }> = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'username or full URL' },
  { key: 'twitter', label: 'X / Twitter', icon: Twitter, placeholder: 'username' },
  { key: 'tiktok', label: 'TikTok', icon: Music, placeholder: 'username' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'channel URL' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'page URL' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'profile URL' },
  { key: 'github', label: 'GitHub', icon: Github, placeholder: 'username' },
]

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48)
}

export default function ShopSettings() {
  const [uid, setUid] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const [form, setForm] = useState({
    username: '',
    shop_name: '',
    shop_slug: '',
    shop_bio: '',
    avatar_url: null as string | null,
    shop_banner_url: null as string | null,
    is_seller: true,
    website: '',
    contact_email: '',
    contact_phone: '',
    shop_location: '',
    socials: {} as Record<string, string>,
    shop_announcement: '',
    vacation_mode: false,
    vacation_message: '',
    shipping_policy: '',
    return_policy: '',
    low_stock_threshold: 5,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: session } = await supabase.auth.getSession()
      const u = session.session?.user
      if (!u) return
      setUid(u.id)
      setEmail(u.email ?? '')

      const [{ data: userRow }, { data: profile }] = await Promise.all([
        supabase.from('users').select('username').eq('id', u.id).maybeSingle(),
        supabase.from('profiles').select('*').eq('id', u.id).maybeSingle(),
      ])

      if (cancelled) return
      setForm({
        username: userRow?.username ?? '',
        shop_name: profile?.shop_name ?? '',
        shop_slug: profile?.shop_slug ?? '',
        shop_bio: profile?.shop_bio ?? '',
        avatar_url: profile?.avatar_url ?? null,
        shop_banner_url: profile?.shop_banner_url ?? null,
        is_seller: profile?.is_seller ?? true,
        website: profile?.website ?? '',
        contact_email: profile?.contact_email ?? '',
        contact_phone: profile?.contact_phone ?? '',
        shop_location: profile?.shop_location ?? '',
        socials: (profile?.socials as Record<string, string>) ?? {},
        shop_announcement: profile?.shop_announcement ?? '',
        vacation_mode: !!profile?.vacation_mode,
        vacation_message: profile?.vacation_message ?? '',
        shipping_policy: profile?.shipping_policy ?? '',
        return_policy: profile?.return_policy ?? '',
        low_stock_threshold: profile?.low_stock_threshold ?? 5,
      })
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const save = async () => {
    if (!uid) return
    setSaving(true)
    setMsg(null)

    if (form.username.trim()) {
      const { error: uErr } = await supabase
        .from('users')
        .update({ username: form.username.trim() })
        .eq('id', uid)
      if (uErr && !uErr.message.includes('duplicate')) {
        setMsg({ kind: 'err', text: uErr.message })
        setSaving(false)
        return
      }
    }

    // Strip empty social values so the socials JSON stays clean
    const cleanSocials: Record<string, string> = {}
    Object.entries(form.socials).forEach(([k, v]) => {
      if (v && v.trim()) cleanSocials[k] = v.trim()
    })

    const profilePayload = {
      id: uid,
      shop_name: form.shop_name.trim() || null,
      shop_slug: form.shop_slug.trim() ? slugify(form.shop_slug) : null,
      shop_bio: form.shop_bio.trim() || null,
      avatar_url: form.avatar_url,
      shop_banner_url: form.shop_banner_url,
      is_seller: form.is_seller,
      website: form.website.trim() || null,
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      shop_location: form.shop_location.trim() || null,
      socials: cleanSocials,
      shop_announcement: form.shop_announcement.trim() || null,
      vacation_mode: form.vacation_mode,
      vacation_message: form.vacation_message.trim() || null,
      shipping_policy: form.shipping_policy.trim() || null,
      return_policy: form.return_policy.trim() || null,
      low_stock_threshold: Math.max(0, Number(form.low_stock_threshold) || 0),
    }
    const { error } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })
    if (error) {
      setMsg({ kind: 'err', text: error.message })
    } else {
      setMsg({ kind: 'ok', text: 'Shop settings saved.' })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const shopUrl = form.shop_slug
    ? `/shop/${slugify(form.shop_slug)}`
    : uid
      ? `/u/${uid}`
      : '/'

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Shop settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personalize how buyers see your shop.
          </p>
        </div>
        <Link href={shopUrl}>
          <Button variant="outline" size="sm">
            View shop
            <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">Storefront</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Shop name">
            <Input
              value={form.shop_name}
              onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
              placeholder="e.g. North Studio"
            />
          </Field>
          <Field
            label="Shop URL"
            hint={
              form.shop_slug ? `souqly.com/shop/${slugify(form.shop_slug)}` : 'optional'
            }
          >
            <Input
              value={form.shop_slug}
              onChange={(e) => setForm({ ...form, shop_slug: e.target.value })}
              placeholder="my-shop"
            />
          </Field>
        </div>

        <Field label="About your shop">
          <Textarea
            value={form.shop_bio}
            rows={4}
            onChange={(e) => setForm({ ...form, shop_bio: e.target.value })}
            placeholder="Tell buyers what you make and what you stand for."
            maxLength={500}
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            {form.shop_bio.length}/500
          </p>
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-3">Shop avatar</h2>
          {uid && (
            <ImageUploader
              value={form.avatar_url}
              onChange={(url) => setForm({ ...form, avatar_url: url })}
              userId={uid}
              folder="avatar"
            />
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-3">Shop banner</h2>
          {uid && (
            <ImageUploader
              value={form.shop_banner_url}
              onChange={(url) => setForm({ ...form, shop_banner_url: url })}
              userId={uid}
              folder="banner"
            />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">Contact & web</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Website" icon={Globe}>
            <Input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://your-site.com"
            />
          </Field>
          <Field label="Contact email" icon={Mail}>
            <Input
              type="email"
              value={form.contact_email}
              onChange={(e) =>
                setForm({ ...form, contact_email: e.target.value })
              }
              placeholder="hello@your-shop.com"
            />
          </Field>
          <Field label="Phone" icon={Phone}>
            <Input
              value={form.contact_phone}
              onChange={(e) =>
                setForm({ ...form, contact_phone: e.target.value })
              }
              placeholder="+1 ..."
            />
          </Field>
          <Field label="Location" icon={MapPin}>
            <Input
              value={form.shop_location}
              onChange={(e) =>
                setForm({ ...form, shop_location: e.target.value })
              }
              placeholder="Brooklyn, NY"
            />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Instagram className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">Social media</h2>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Paste a username or a full URL. Empty fields are hidden on your shop.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {SOCIALS.map((s) => (
            <Field key={s.key} label={s.label} icon={s.icon}>
              <Input
                value={form.socials[s.key] ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    socials: { ...form.socials, [s.key]: e.target.value },
                  })
                }
                placeholder={s.placeholder}
              />
            </Field>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">Shop announcement</h2>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Pinned to the top of your shop page. Great for sales, restocks, or
          shipping notices.
        </p>
        <Textarea
          rows={3}
          maxLength={280}
          value={form.shop_announcement}
          onChange={(e) =>
            setForm({ ...form, shop_announcement: e.target.value })
          }
          placeholder='e.g. "Free shipping on orders over 5,000 DA this weekend!"'
        />
        <p className="text-[11px] text-muted-foreground">
          {form.shop_announcement.length}/280
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-muted-foreground" />
            <div>
              <h2 className="font-semibold">Vacation mode</h2>
              <p className="text-xs text-muted-foreground">
                Hides your products from the marketplace until you toggle it
                back off. Buyers can still see your shop page with a notice.
              </p>
            </div>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.vacation_mode}
              onChange={(e) =>
                setForm({ ...form, vacation_mode: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-secondary peer-checked:bg-foreground rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-card after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5" />
          </label>
        </div>
        {form.vacation_mode && (
          <Field label="Message shown on your shop">
            <Input
              value={form.vacation_message}
              onChange={(e) =>
                setForm({ ...form, vacation_message: e.target.value })
              }
              placeholder="Back September 1 — thanks for your patience!"
            />
          </Field>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">Policies</h2>
        </div>
        <Field label="Shipping policy">
          <Textarea
            rows={3}
            value={form.shipping_policy}
            onChange={(e) =>
              setForm({ ...form, shipping_policy: e.target.value })
            }
            placeholder="e.g. We ship within 2 business days via Yalidine."
          />
        </Field>
        <Field label="Return policy">
          <Textarea
            rows={3}
            value={form.return_policy}
            onChange={(e) =>
              setForm({ ...form, return_policy: e.target.value })
            }
            placeholder="e.g. Returns accepted within 7 days for unused items."
          />
        </Field>
        <Field
          label="Low-stock alert threshold"
          hint="We'll flag items in your dashboard when stock drops below this"
        >
          <Input
            type="number"
            min={0}
            value={form.low_stock_threshold}
            onChange={(e) =>
              setForm({
                ...form,
                low_stock_threshold: Number(e.target.value),
              })
            }
          />
        </Field>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Account</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Username">
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="your-handle"
            />
          </Field>
          <Field label="Email" hint="Change via account settings">
            <Input value={email} disabled />
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sticky bottom-4 rounded-xl border border-border bg-card p-3 shadow-elevated">
        {msg ? (
          <p
            className={`text-sm ${
              msg.kind === 'ok' ? 'text-success' : 'text-destructive'
            }`}
          >
            {msg.text}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Changes appear on your public shop within seconds.
          </p>
        )}
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  icon: Icon,
  children,
}: {
  label: string
  hint?: string
  icon?: any
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-medium text-foreground/80 inline-flex items-center gap-1.5">
          {Icon && <Icon className="w-3 h-3 text-muted-foreground" />}
          {label}
        </label>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
