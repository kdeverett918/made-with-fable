'use client'

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from 'react'
import { Film, ImagePlus, X } from 'lucide-react'
import {
  MAX_IMAGES,
  processAndUploadImage,
  processAndUploadVideo,
  type UploadedMedia,
} from '@/lib/upload'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

interface MediaUploaderProps {
  userId: string
  items: UploadedMedia[]
  onChange: (items: UploadedMedia[]) => void
}

export function MediaUploader({ userId, items, onChange }: MediaUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const imageCount = items.filter((m) => m.kind === 'image').length
  const hasVideo = items.some((m) => m.kind === 'video')

  async function handleFiles(files: FileList | File[]) {
    setError(null)
    const list = Array.from(files)
    let images = imageCount
    let video = hasVideo
    const current = [...items]

    for (const file of list) {
      const isVideo = file.type.startsWith('video/')
      if (isVideo && video) {
        setError('Only one video per creation')
        continue
      }
      if (!isVideo && images >= MAX_IMAGES) {
        setError(`Up to ${MAX_IMAGES} images per creation`)
        continue
      }
      setUploadingCount((c) => c + 1)
      try {
        const uploaded = isVideo
          ? await processAndUploadVideo(file, userId)
          : await processAndUploadImage(file, userId)
        if (isVideo) video = true
        else images++
        current.push(uploaded)
        onChange([...current])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed')
      } finally {
        setUploadingCount((c) => c - 1)
      }
    }
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          'border-border hover:border-accent/50 flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 transition-colors',
          dragging && 'border-accent bg-accent/5',
        )}
      >
        <div className="text-accent flex gap-3">
          <ImagePlus className="h-6 w-6" aria-hidden />
          <Film className="h-6 w-6" aria-hidden />
        </div>
        <p className="text-sm font-medium">Drop screenshots or a short video here</p>
        <p className="text-muted-foreground text-xs">
          Up to {MAX_IMAGES} images · one video (MP4/WebM, max 25MB / 60s)
        </p>
      </button>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,video/mp4,video/webm"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {error && <p className="text-error mt-2 text-sm">{error}</p>}

      {(items.length > 0 || uploadingCount > 0) && (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {items.map((item, i) => (
            <li key={item.storage_path} className="group relative">
              <img
                src={item.kind === 'video' ? '' : item.previewUrl}
                alt=""
                className={cn(
                  'aspect-square w-full rounded-md object-cover',
                  item.kind === 'video' && 'hidden',
                )}
              />
              {item.kind === 'video' && (
                <video
                  src={item.previewUrl}
                  muted
                  className="aspect-square w-full rounded-md object-cover"
                />
              )}
              {item.kind === 'video' && (
                <Film
                  className="absolute bottom-1.5 left-1.5 h-4 w-4 text-white drop-shadow"
                  aria-hidden
                />
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove"
                className="bg-background/80 absolute top-1.5 right-1.5 cursor-pointer rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
          {Array.from({ length: uploadingCount }).map((_, i) => (
            <li
              key={`uploading-${i}`}
              className="bg-surface-raised flex aspect-square items-center justify-center rounded-md"
            >
              <Spinner />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
