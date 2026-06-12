'use client'

import imageCompression from 'browser-image-compression'
import { nanoid } from 'nanoid'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export interface UploadedMedia {
  kind: 'image' | 'video'
  storage_path: string
  poster_path: string | null
  width: number
  height: number
  /** local object URL for instant preview */
  previewUrl: string
}

export const MAX_IMAGES = 6
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024
export const MAX_VIDEO_SECONDS = 65

export async function processAndUploadImage(file: File, userId: string): Promise<UploadedMedia> {
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 1920,
    maxSizeMB: 4,
    fileType: 'image/webp',
    initialQuality: 0.82,
  })

  const bitmap = await createImageBitmap(compressed)
  const { width, height } = bitmap
  bitmap.close()

  const path = `${userId}/${nanoid(12)}.webp`
  const supabase = createSupabaseBrowserClient()
  const { error } = await supabase.storage
    .from('media')
    .upload(path, compressed, { contentType: 'image/webp' })
  if (error) throw new Error('Image upload failed')

  return {
    kind: 'image',
    storage_path: path,
    poster_path: null,
    width,
    height,
    previewUrl: URL.createObjectURL(compressed),
  }
}

function loadVideoMetadata(
  url: string,
): Promise<{ video: HTMLVideoElement; width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.src = url
    video.onloadedmetadata = () =>
      resolve({
        video,
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      })
    video.onerror = () => reject(new Error('Could not read video'))
  })
}

function capturePoster(video: HTMLVideoElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    video.currentTime = Math.min(0.1, video.duration / 2)
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')!.drawImage(video, 0, 0)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Poster capture failed'))),
        'image/webp',
        0.8,
      )
    }
  })
}

export async function processAndUploadVideo(file: File, userId: string): Promise<UploadedMedia> {
  if (!['video/mp4', 'video/webm'].includes(file.type)) {
    throw new Error('Videos must be MP4 or WebM')
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error('Videos must be under 25MB')
  }

  const objectUrl = URL.createObjectURL(file)
  const { video, width, height, duration } = await loadVideoMetadata(objectUrl)
  if (duration > MAX_VIDEO_SECONDS) {
    URL.revokeObjectURL(objectUrl)
    throw new Error('Videos must be 60 seconds or less')
  }

  const poster = await capturePoster(video)

  const id = nanoid(12)
  const ext = file.type === 'video/webm' ? 'webm' : 'mp4'
  const videoPath = `${userId}/${id}.${ext}`
  const posterPath = `${userId}/${id}-poster.webp`

  const supabase = createSupabaseBrowserClient()
  const [videoRes, posterRes] = await Promise.all([
    supabase.storage.from('media').upload(videoPath, file, { contentType: file.type }),
    supabase.storage.from('media').upload(posterPath, poster, { contentType: 'image/webp' }),
  ])
  if (videoRes.error || posterRes.error) throw new Error('Video upload failed')

  return {
    kind: 'video',
    storage_path: videoPath,
    poster_path: posterPath,
    width,
    height,
    previewUrl: objectUrl,
  }
}
