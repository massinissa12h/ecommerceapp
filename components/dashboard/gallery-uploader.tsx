'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import {
  ImageIcon,
  Loader2,
  Upload,
  X,
  Star,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'

export interface GalleryImage {
  /** undefined for unsaved local-only images, real ID for DB rows */
  id?: string
  url: string
  position: number
  alt?: string | null
  /** True when this image is the product's primary (drives products.image_url) */
  primary?: boolean
}

interface GalleryUploaderProps {
  value: GalleryImage[]
  onChange: (next: GalleryImage[]) => void
  userId: string
  max?: number
}

/**
 * Multi-image uploader.
 * - First image (position 0) is treated as the primary and is what the card
 *   thumbnail uses (products.image_url).
 * - Caller is responsible for persisting the list; this component just
 *   manages the local ordered list of URLs.
 */
export function GalleryUploader({
  value,
  onChange,
  userId,
  max = 8,
}: GalleryUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sorted = [...value].sort((a, b) => a.position - b.position)

  const handleFiles = async (files: FileList) => {
    setError(null)
    const remaining = max - sorted.length
    if (remaining <= 0) {
      setError(`Max ${max} images.`)
      return
    }
    const accepted = Array.from(files).slice(0, remaining)
    setUploading(true)
    try {
      const uploaded: GalleryImage[] = []
      for (const file of accepted) {
        if (!file.type.startsWith('image/')) continue
        if (file.size > 5 * 1024 * 1024) {
          setError('Each image must be under 5MB.')
          continue
        }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${userId}/products/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('product-images')
          .upload(path, file, { cacheControl: '3600', upsert: false })
        if (upErr) throw upErr
        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(path)
        uploaded.push({
          url: data.publicUrl,
          position: sorted.length + uploaded.length,
          alt: null,
        })
      }
      onChange([...sorted, ...uploaded])
    } catch (e: any) {
      setError(e.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeAt = (idx: number) => {
    const next = sorted
      .filter((_, i) => i !== idx)
      .map((img, i) => ({ ...img, position: i }))
    onChange(next)
  }

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= sorted.length) return
    const next = [...sorted]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next.map((img, i) => ({ ...img, position: i })))
  }

  const setPrimary = (idx: number) => {
    if (idx === 0) return
    const picked = sorted[idx]
    const rest = sorted.filter((_, i) => i !== idx)
    onChange(
      [picked, ...rest].map((img, i) => ({ ...img, position: i })),
    )
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files)
          e.currentTarget.value = ''
        }}
      />

      <div className="rounded-xl border border-dashed border-border bg-secondary/40 p-4">
        {sorted.length === 0 ? (
          <div className="aspect-square w-full rounded-lg bg-card overflow-hidden border border-border flex items-center justify-center text-muted-foreground">
            <div className="text-center px-6">
              <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No images yet</p>
              <p className="text-xs mt-1">PNG, JPG, WebP — up to {max} images, 5MB each</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Primary (large) */}
            <div className="aspect-square w-full rounded-lg bg-card overflow-hidden border border-border relative">
              <img
                src={sorted[0].url}
                alt={sorted[0].alt ?? ''}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-foreground text-background text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5">
                <Star className="w-2.5 h-2.5 fill-current" />
                Primary
              </span>
              <button
                type="button"
                onClick={() => removeAt(0)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card/95 border border-border flex items-center justify-center text-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnails / extras */}
            {sorted.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {sorted.slice(1).map((img, i) => {
                  const idx = i + 1
                  return (
                    <div
                      key={img.id ?? img.url}
                      className="relative aspect-square rounded-md overflow-hidden border border-border bg-card group"
                    >
                      <img
                        src={img.url}
                        alt={img.alt ?? ''}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-stretch justify-between p-1.5">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setPrimary(idx)}
                            title="Make primary"
                            className="w-6 h-6 rounded-full bg-card/95 flex items-center justify-center text-foreground hover:text-warning"
                          >
                            <Star className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAt(idx)}
                            className="w-6 h-6 rounded-full bg-card/95 flex items-center justify-center text-foreground hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => move(idx, -1)}
                            className="w-6 h-6 rounded-full bg-card/95 flex items-center justify-center text-foreground hover:text-brand disabled:opacity-30"
                            disabled={idx <= 1}
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => move(idx, 1)}
                            className="w-6 h-6 rounded-full bg-card/95 flex items-center justify-center text-foreground hover:text-brand disabled:opacity-30"
                            disabled={idx >= sorted.length - 1}
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full mt-3"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || sorted.length >= max}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {sorted.length === 0
                ? 'Upload images'
                : `Add more (${sorted.length}/${max})`}
            </>
          )}
        </Button>

        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        {sorted.length > 0 && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            The first image is shown on product cards. Hover a thumbnail to
            reorder, star, or remove it.
          </p>
        )}
      </div>
    </div>
  )
}
