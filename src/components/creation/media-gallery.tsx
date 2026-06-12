import Image from 'next/image'
import { mediaUrl } from '@/lib/storage'
import { cn } from '@/lib/utils'
import type { CreationMedia } from '@/types/database'

export function MediaGallery({ media }: { media: CreationMedia[] }) {
  if (media.length === 0) {
    return (
      <section className="border-ink bg-surface-raised border-2 p-3 shadow-[8px_8px_0_0_var(--color-ink)]">
        <div className="border-ink bg-background border-2 border-dashed px-6 py-20 text-center">
          <p className="font-display text-4xl leading-none uppercase">No media pinned</p>
          <p className="label-mono text-muted mt-3">
            This object ships on story, prompt, or live link.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="border-ink bg-surface-raised border-2 p-2 shadow-[8px_8px_0_0_var(--color-ink)] sm:p-4">
      <div className="border-ink mb-4 flex items-center justify-between border-b-2 pb-3">
        <p className="label-mono text-ink font-bold">Pinned work board</p>
        <p className="label-mono text-muted tabular-nums">
          {media.length.toString().padStart(2, '0')} item{media.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className={cn('grid gap-4', media.length > 1 && 'lg:grid-cols-2')}>
        {media.map((item, index) => {
          const aspectRatio =
            item.width > 0 && item.height > 0 ? `${item.width} / ${item.height}` : '16 / 9'

          return (
            <figure
              key={item.id}
              className={cn(
                'border-ink bg-background relative border-2 p-2 transition-transform duration-150 hover:-translate-y-1',
                index === 0 && media.length > 1 && 'lg:col-span-2',
              )}
            >
              <span
                className="border-ink bg-accent absolute -top-2 left-6 z-10 h-4 w-4 border-2"
                aria-hidden
              />
              <span
                className="border-ink bg-background absolute -top-2 right-6 z-10 h-4 w-4 border-2"
                aria-hidden
              />

              {item.kind === 'video' ? (
                <video
                  src={mediaUrl(item.storage_path)}
                  poster={item.poster_path ? mediaUrl(item.poster_path) : undefined}
                  controls
                  playsInline
                  preload="metadata"
                  className="border-ink bg-ink block w-full border-2 object-contain"
                  style={{ aspectRatio }}
                />
              ) : (
                <div
                  className="border-ink bg-surface relative w-full overflow-hidden border-2"
                  style={{ aspectRatio }}
                >
                  <Image
                    src={mediaUrl(item.storage_path)}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 960px"
                    className="object-contain"
                    priority={item.position === 0}
                  />
                </div>
              )}

              <figcaption className="label-mono text-muted mt-2 flex items-center justify-between">
                <span>{item.kind}</span>
                <span className="tabular-nums">Pin {String(index + 1).padStart(2, '0')}</span>
              </figcaption>
            </figure>
          )
        })}
      </div>
    </section>
  )
}
