'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'

export interface GalleryView {
  url: string
  alt?: string | null
}

interface ProductGalleryProps {
  images: GalleryView[]
  name: string
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  // Keep the active index in range if images change
  useEffect(() => {
    if (active >= images.length) setActive(0)
  }, [images.length, active])

  // Lightbox keyboard nav
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, images.length])

  if (images.length === 0) {
    return (
      <div className="relative w-full aspect-square bg-secondary rounded-3xl border border-border" />
    )
  }

  const next = () => setActive((i) => (i + 1) % images.length)
  const prev = () => setActive((i) => (i - 1 + images.length) % images.length)
  const current = images[active] ?? images[0]

  return (
    <div className="flex gap-3">
      {/* Vertical thumbnail strip on the left (desktop) */}
      {images.length > 1 && (
        <div className="hidden md:flex flex-col gap-2 w-16 max-h-[520px] overflow-y-auto">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              onClick={() => setActive(i)}
              className={`relative aspect-square w-full rounded-lg overflow-hidden border transition ${
                i === active
                  ? 'border-foreground ring-2 ring-foreground/20'
                  : 'border-border hover:border-foreground/40'
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `${name} image ${i + 1}`}
                fill
                unoptimized
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div className="flex-1 min-w-0 relative">
        <motion.div
          key={current.url}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="relative w-full aspect-square bg-secondary rounded-3xl overflow-hidden border border-border group"
        >
          <Image
            src={current.url}
            alt={current.alt ?? name}
            fill
            unoptimized
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />

          {images.length > 1 && (
            <>
              <NavBtn className="left-3" onClick={prev}>
                <ChevronLeft className="w-5 h-5" />
              </NavBtn>
              <NavBtn className="right-3" onClick={next}>
                <ChevronRight className="w-5 h-5" />
              </NavBtn>
            </>
          )}

          <button
            onClick={() => setLightbox(true)}
            title="View full size"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-card/95 border border-border flex items-center justify-center text-foreground/80 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-card/95 border border-border text-[11px] font-medium">
              {active + 1} / {images.length}
            </div>
          )}
        </motion.div>

        {/* Horizontal thumbnail strip on mobile */}
        {images.length > 1 && (
          <div className="md:hidden mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={img.url + i}
                onClick={() => setActive(i)}
                className={`relative aspect-square w-16 shrink-0 rounded-lg overflow-hidden border ${
                  i === active
                    ? 'border-foreground ring-2 ring-foreground/20'
                    : 'border-border'
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt ?? `${name} image ${i + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                setLightbox(false)
              }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:text-destructive"
            >
              <X className="w-5 h-5" />
            </button>
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    prev()
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center text-foreground"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    next()
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center text-foreground"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            <motion.div
              key={current.url}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl aspect-square"
            >
              <Image
                src={current.url}
                alt={current.alt ?? name}
                fill
                unoptimized
                className="object-contain"
                sizes="100vw"
              />
            </motion.div>
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-card border border-border text-sm font-medium">
                {active + 1} / {images.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NavBtn({
  className,
  onClick,
  children,
}: {
  className?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card/95 border border-border flex items-center justify-center text-foreground/80 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity ${className ?? ''}`}
    >
      {children}
    </button>
  )
}
