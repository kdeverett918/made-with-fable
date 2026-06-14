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
  /** storage folder to upload into — a user's uid, or the shared guest folder */
  folder: string
  items: UploadedMedia[]
  onChange: (items: UploadedMedia[]) => void
}

export function MediaUploader({ folder, items, onChange }: MediaUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const imageCount = items.filter((m) => m.kind === 'image').length
  const hasVideo = items.some((m) => m.kind === 'video')
  const remainingImages = Math.max(0, MAX_IMAGES - imageCount)

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
          ? await processAndUploadVideo(file, folder)
          : await processAndUploadImage(file, folder)
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
    <div className="space-y-4">
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
        aria-describedby="media-rules media-status"
        className={cn(
          'group border-ink bg-background hover:bg-surface-raised grid w-full cursor-pointer border-2 border-dashed text-left transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-ink)] sm:grid-cols-[1fr_180px]',
          dragging &&
            'border-accent bg-surface-raised -translate-x-0.5 -translate-y-0.5 shadow-[4px_4px_0_0_var(--color-accent)]',
        )}
      >
        <div className="p-5 sm:p-6">
          <div className="text-accent flex gap-3">
            <ImagePlus className="h-6 w-6" aria-hidden />
            <Film className="h-6 w-6" aria-hidden />
          </div>
          <p className="font-display mt-5 text-5xl leading-none uppercase sm:text-6xl">Pin media</p>
          <p id="media-rules" className="label-mono text-muted mt-4 max-w-xl">
            Drop screenshots or a short video here. Up to {MAX_IMAGES} images, one MP4/WebM video,
            max 25MB and 60 seconds.
          </p>
        </div>
        <div className="border-ink grid grid-cols-2 border-t-2 sm:grid-cols-1 sm:border-t-0 sm:border-l-2">
          <div className="border-ink border-r-2 p-4 sm:border-r-0 sm:border-b-2">
            <p className="label-mono text-muted-foreground">Images left</p>
            <p className="font-display mt-1 text-4xl leading-none">{remainingImages}</p>
          </div>
          <div className="p-4">
            <p className="label-mono text-muted-foreground">Video</p>
            <p className="font-display mt-1 text-4xl leading-none">{hasVideo ? 'Set' : 'Open'}</p>
          </div>
        </div>
      </button>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,video/mp4,video/webm"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      <p id="media-status" className="label-mono text-muted-foreground">
        {items.length} pinned item{items.length === 1 ? '' : 's'}
        {uploadingCount > 0 ? `, ${uploadingCount} uploading` : ''}
      </p>

      {error && (
        <p className="label-mono border-accent text-accent border-2 px-3 py-2" role="alert">
          {error}
        </p>
      )}

      {(items.length > 0 || uploadingCount > 0) && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, i) => (
            <li
              key={item.storage_path}
              className="group border-ink bg-surface-raised relative border-2"
            >
              {item.kind === 'image' ? (
                <img src={item.previewUrl} alt="" className="aspect-square w-full object-cover" />
              ) : (
                <video src={item.previewUrl} muted className="aspect-square w-full object-cover" />
              )}
              {item.kind === 'video' && (
                <span className="bg-ink text-background absolute bottom-0 left-0 p-1">
                  <Film className="h-3.5 w-3.5" aria-hidden />
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove"
                className="bg-ink text-background absolute top-0 right-0 cursor-pointer p-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
          {Array.from({ length: uploadingCount }).map((_, i) => (
            <li
              key={`uploading-${i}`}
              className="border-ink bg-surface-raised flex aspect-square items-center justify-center border-2"
            >
              <Spinner />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
