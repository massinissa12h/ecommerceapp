'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { ImageIcon, Loader2, Upload, X } from 'lucide-react'

interface ImageUploaderProps {
  value: string | null
  onChange: (url: string | null) => void
  userId: string
  /**
   * Subfolder under the user's bucket folder. E.g. "products" -> uploads to
   * <userId>/products/...
   */
  folder?: string
}

export function ImageUploader({
  value,
  onChange,
  userId,
  folder = 'products',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Max file size is 5MB.')
      return
    }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${userId}/${folder}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('product-images')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      onChange(data.publicUrl)
    } catch (e: any) {
      setError(e.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.currentTarget.value = ''
        }}
      />

      <div className="rounded-xl border border-dashed border-border bg-secondary/40 p-4">
        <div className="aspect-square w-full rounded-lg bg-card overflow-hidden border border-border flex items-center justify-center relative">
          {value ? (
            <>
              <img src={value} alt="Product" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card/95 border border-border flex items-center justify-center text-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="text-center text-muted-foreground px-6">
              <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No image yet</p>
              <p className="text-xs mt-1">PNG, JPG, WebP up to 5MB</p>
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full mt-3"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {value ? 'Replace image' : 'Upload image'}
            </>
          )}
        </Button>

        {error && (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        )}
      </div>
    </div>
  )
}
