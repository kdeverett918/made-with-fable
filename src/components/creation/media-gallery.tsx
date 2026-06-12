import Image from 'next/image'
import { mediaUrl } from '@/lib/storage'
import type { CreationMedia } from '@/types/database'

export function MediaGallery({ media }: { media: CreationMedia[] }) {
  if (media.length === 0) return null

  return (
    <div className="space-y-4">
      {media.map((item) =>
        item.kind === 'video' ? (
          <video
            key={item.id}
            src={mediaUrl(item.storage_path)}
            poster={item.poster_path ? mediaUrl(item.poster_path) : undefined}
            controls
            playsInline
            preload="metadata"
            className="border-border w-full rounded-lg border"
            style={{ aspectRatio: `${item.width} / ${item.height}` }}
          />
        ) : (
          <div
            key={item.id}
            className="border-border relative w-full overflow-hidden rounded-lg border"
            style={{ aspectRatio: `${item.width} / ${item.height}` }}
          >
            <Image
              src={mediaUrl(item.storage_path)}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover"
              priority={item.position === 0}
            />
          </div>
        ),
      )}
    </div>
  )
}
