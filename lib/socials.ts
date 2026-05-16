import type { LucideIcon } from 'lucide-react'
import {
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Music,
  Github,
  Linkedin,
  Link as LinkIcon,
} from 'lucide-react'

export type SocialPlatform =
  | 'instagram'
  | 'twitter'
  | 'tiktok'
  | 'youtube'
  | 'facebook'
  | 'linkedin'
  | 'github'

const TEMPLATES: Record<
  SocialPlatform,
  { label: string; icon: LucideIcon; base: string }
> = {
  instagram: { label: 'Instagram', icon: Instagram, base: 'https://instagram.com/' },
  twitter: { label: 'X', icon: Twitter, base: 'https://x.com/' },
  tiktok: { label: 'TikTok', icon: Music, base: 'https://tiktok.com/@' },
  youtube: { label: 'YouTube', icon: Youtube, base: 'https://youtube.com/@' },
  facebook: { label: 'Facebook', icon: Facebook, base: 'https://facebook.com/' },
  linkedin: { label: 'LinkedIn', icon: Linkedin, base: 'https://linkedin.com/in/' },
  github: { label: 'GitHub', icon: Github, base: 'https://github.com/' },
}

export interface ResolvedSocial {
  platform: SocialPlatform | 'website'
  label: string
  icon: LucideIcon
  url: string
  display: string
}

/**
 * Normalize whatever the seller typed (full URL, "@handle", or plain handle)
 * into a clickable absolute URL.
 */
export function resolveSocial(
  platform: SocialPlatform,
  raw: string | null | undefined,
): ResolvedSocial | null {
  if (!raw) return null
  const value = raw.trim()
  if (!value) return null
  const tmpl = TEMPLATES[platform]
  let url: string
  if (/^https?:\/\//i.test(value)) {
    url = value
  } else {
    const handle = value.replace(/^@/, '')
    url = `${tmpl.base}${handle}`
  }
  return {
    platform,
    label: tmpl.label,
    icon: tmpl.icon,
    url,
    display: value.replace(/^https?:\/\//, '').replace(/^www\./, ''),
  }
}

export function resolveAllSocials(
  socials: Record<string, string> | null | undefined,
): ResolvedSocial[] {
  if (!socials) return []
  const order: SocialPlatform[] = [
    'instagram',
    'tiktok',
    'twitter',
    'youtube',
    'facebook',
    'linkedin',
    'github',
  ]
  return order
    .map((k) => resolveSocial(k, socials[k]))
    .filter((s): s is ResolvedSocial => s != null)
}

export function normalizeWebsite(url: string | null | undefined): string | null {
  if (!url) return null
  const v = url.trim()
  if (!v) return null
  if (/^https?:\/\//i.test(v)) return v
  return `https://${v}`
}

export { LinkIcon }
