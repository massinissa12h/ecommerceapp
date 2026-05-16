'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Cycle: light → dark → system. Keeps it to one button so the navbar doesn't
 * sprout a dropdown for a tiny preference.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // While the client hydrates, render a neutral placeholder so SSR & client
  // markup match (prevents the next-themes hydration warning).
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={className} aria-hidden>
        <Sun className="w-5 h-5 opacity-0" />
      </Button>
    )
  }

  const current = theme ?? 'system'
  const next =
    current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light'

  const Icon =
    current === 'system' ? Monitor : (resolvedTheme === 'dark' ? Moon : Sun)

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      title={`Theme: ${current}. Click for ${next}`}
      className={className}
    >
      <Icon className="w-5 h-5" />
    </Button>
  )
}
